import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export interface PDFExportOptions {
    studentName: string;
    onExport?: () => Promise<{ recordings: any[], lessonId?: string }>;
    onSuccess: (msg: string) => void;
    onError: (msg: string) => void;
}

export interface DigitalPDFExportOptions extends PDFExportOptions {
    instrument: string;
    currentLessonId: string | undefined;
    onLessonIdUpdate: (id: string) => void;
    documentElement: HTMLElement | null;
}

const today = new Date().toLocaleDateString('pt-BR');

export const exportToPrintPDF = async (options: PDFExportOptions) => {
    const { studentName, onExport, onSuccess, onError } = options;

    try {
        console.log('Iniciando exportação de PDF para Impressão (A4 Paginação)...');
        if (onExport) await onExport();
        // Pequeno delay para garantir que o layout adaptativo (colunas) foi aplicado
        await new Promise(r => setTimeout(r, 1000));

        const headerElem = document.getElementById('lesson-header');
        const bodyElem = document.getElementById('lesson-body');

        if (!headerElem || !bodyElem) {
            onError("Erro ao identificar componentes para impressão.");
            return;
        }

        // --- CONFIGURAÇÃO DE IMPRESSÃO PROFISSIONAL ---
        const pdfWidth = 210; // A4 Width
        const pdfPageHeight = 297; // A4 Height
        const reductionFactor = 0.72; // Redução de ~30% conforme solicitado

        const contentWidth = pdfWidth * reductionFactor;
        const xOffset = (pdfWidth - contentWidth) / 2;

        // 1. Captura do Cabeçalho (Fixo em todas as páginas)
        const headerCanvas = await html2canvas(headerElem, {
            scale: 3,
            useCORS: true,
            backgroundColor: '#1A110D',
            windowWidth: 1000
        });
        const headerImgData = headerCanvas.toDataURL('image/png', 1.0);
        const headerPdfHeight = (headerCanvas.height * pdfWidth) / headerCanvas.width;

        // 2. Captura do Corpo Completo
        const bodyCanvas = await html2canvas(bodyElem, {
            scale: 3,
            useCORS: true,
            backgroundColor: '#ffffff',
            windowWidth: 1000
        });
        const bodyImgData = bodyCanvas.toDataURL('image/png', 1.0);

        const bodyVisualHeight = (bodyCanvas.height * contentWidth) / bodyCanvas.width;

        const pdf = new jsPDF({
            orientation: 'p',
            unit: 'mm',
            format: 'a4',
            compress: true
        });

        const bodyAvailableHeightPerPage = pdfPageHeight - headerPdfHeight - 10;
        let heightRemaining = bodyVisualHeight;
        let currentOffset = 0;

        while (heightRemaining > 0) {
            // Corpo
            pdf.addImage(
                bodyImgData,
                'PNG',
                xOffset,
                headerPdfHeight - currentOffset,
                contentWidth,
                bodyVisualHeight,
                undefined,
                'FAST'
            );

            // Máscara
            pdf.setFillColor(255, 255, 255);
            pdf.rect(0, 0, pdfWidth, headerPdfHeight, 'F');

            // Cabeçalho
            pdf.addImage(headerImgData, 'PNG', 0, 0, pdfWidth, headerPdfHeight, undefined, 'FAST');

            // Limpeza
            if (heightRemaining > bodyAvailableHeightPerPage) {
                pdf.setFillColor(255, 255, 255);
                pdf.rect(0, pdfPageHeight - 5, pdfWidth, 5, 'F');
            }

            heightRemaining -= bodyAvailableHeightPerPage;
            currentOffset += bodyAvailableHeightPerPage;

            if (heightRemaining > 0) {
                pdf.addPage();
            }
        }

        pdf.save(`${studentName} - IMPRESSAO - ${today}.pdf`);
        onSuccess("PDF Profissional para Impressão gerado com sucesso!");

    } catch (error) {
        console.error('Erro no Print PDF:', error);
        onError("Falha interna na geração do PDF de Impressão.");
    }
};

export const exportToDigitalPDF = async (options: DigitalPDFExportOptions) => {
    const { studentName, instrument, currentLessonId, documentElement, onExport, onLessonIdUpdate, onSuccess, onError } = options;

    try {
        console.log('Iniciando exportação de PDF...');
        let finalLessonId = currentLessonId;

        // 1. Sincronização e Delay para estabilização do DOM
        if (onExport) {
            const result = await onExport();
            if (result.lessonId) {
                finalLessonId = result.lessonId;
                onLessonIdUpdate(result.lessonId);
                // Delay extra para garantir que o React renderizou o botão de confirmação no DOM
                await new Promise(r => setTimeout(r, 600));
            }
        }
        await new Promise(r => setTimeout(r, 400));

        const element = document.getElementById('lesson-document') || documentElement;

        if (!element) {
            onError("Erro Fatal: O documento da aula não foi encontrado para exportação.");
            return;
        }

        console.log('Capturando canvas para PDF...');
        const canvas = await html2canvas(element as HTMLElement, {
            scale: 3.5, // Alta resolução (Top Quality)
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff',
            logging: false,
            windowWidth: 1200,
        });

        console.log('Gerando arquivo PDF...');
        const imgData = canvas.toDataURL('image/png', 1.0); // PNG para máxima nitidez
        const imgWidth = 210;
        let imgHeight = (canvas.height * imgWidth) / canvas.width;

        const pdf = new jsPDF({
            orientation: 'p',
            unit: 'mm',
            format: [imgWidth, imgHeight],
            compress: true
        });

        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight, undefined, 'FAST');

        // Mapeamento Blindado de Links
        const cards = element.querySelectorAll('.audio-card-pdf');
        cards.forEach((card) => {
            const cardElement = card as HTMLElement;
            const url = cardElement.dataset.url;
            if (!url) return;

            const rect = cardElement.getBoundingClientRect();
            const parentRect = element.getBoundingClientRect();

            const relTop = rect.top - parentRect.top;
            const relLeft = rect.left - parentRect.left;

            const pdfX = (relLeft * 210) / parentRect.width;
            const pdfY = (relTop * imgHeight) / parentRect.height;
            const pdfW = (rect.width * 210) / parentRect.width;
            const pdfH = (rect.height * imgHeight) / parentRect.height;
            pdf.link(pdfX, pdfY, pdfW, pdfH, { url });
            
            // Fallback de texto invisível 
            pdf.setTextColor(26, 17, 13);
            pdf.setFontSize(8);
            pdf.textWithLink('Ouvir', pdfX + 2, pdfY + 6, { url });
        });

        // Link de Confirmação Único
        const confirmBtn = element.querySelector('.confirm-read-pdf-main');
        if (confirmBtn) {
            const rect = confirmBtn.getBoundingClientRect();
            const parentRect = element.getBoundingClientRect();
            const relTop = rect.top - parentRect.top;
            const relLeft = rect.left - parentRect.left;

            const pdfX = (relLeft * 210) / parentRect.width;
            const pdfY = (relTop * imgHeight) / parentRect.height;
            const pdfW = (rect.width * 210) / parentRect.width;
            const pdfH = (rect.height * imgHeight) / parentRect.height;

            const baseUrl = window.location.href.split('?')[0];
            const fixedBase = baseUrl.endsWith('/') ? baseUrl : baseUrl + '/';
            // Use encodeURIComponent purely on the dynamic data
            const confirmUrl = `${fixedBase}?confirm_read=${finalLessonId}&session=1&s_name=${encodeURIComponent(studentName)}&inst=${encodeURIComponent(instrument)}`;
            
            pdf.link(pdfX, pdfY, pdfW, pdfH, { url: confirmUrl });
            
            // Fallback de texto invisível
            pdf.setTextColor(16, 185, 129);
            pdf.setFontSize(8);
            pdf.textWithLink('CONFIRMAR TREINO', pdfX + 1, pdfY + 4, { url: confirmUrl });
        }

        console.log('Salvando...');
        pdf.save(`${studentName} - ${instrument} - ${today}.pdf`);

        if ((window as any).logDebug) (window as any).logDebug('PDF baixado!');
        onSuccess("PDF Digital gerado com sucesso!");
    } catch (error) {
        console.error('Erro ao baixar PDF:', error);
        onError('Erro na Geracao do PDF: ' + (error instanceof Error ? error.message : "Falha desconhecida"));
    }
};
