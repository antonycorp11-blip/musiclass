
import React, { useRef, useState, useEffect } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { ChordVisualizer } from './ChordVisualizer';
import { Logo } from './Logo';
import { Instrument, Level, SoloNote } from '../types';
import { User, X, GraduationCap, Calendar, Music, FileText, Play, Headphones, Clock } from 'lucide-react';


interface StudentPreviewProps {
    studentName: string;
    teacherName: string;
    instrument: any;
    objective: string;
    chords: any[];
    scales: any[];
    exercises: string[];
    tabs: { title: string, content: string }[];
    solos?: { title: string, notes: SoloNote[] }[];
    recordings?: { id: string, title: string, url: string }[];
    drums?: { rhythms: any[], rudiments: any[] };
    lessonCount?: number;
    contractTotal?: number;
    onClose: () => void;
    onExport?: () => Promise<any[]>;
}

export const StudentPreview: React.FC<StudentPreviewProps> = ({
    studentName, teacherName, instrument, objective, chords, scales, exercises, tabs, solos = [], recordings = [], drums = { rhythms: [], rudiments: [] }, lessonCount, contractTotal, onClose, onExport
}) => {
    const today = new Date().toLocaleDateString('pt-BR');
    const documentRef = useRef<HTMLDivElement>(null);

    const [viewScale, setViewScale] = useState(1);
    const [isExporting, setIsExporting] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const updateScale = () => {
            if (wrapperRef.current) {
                const wrapperWidth = wrapperRef.current.offsetWidth - 32; // padding
                const docWidth = 794; // 210mm approx in px
                if (wrapperWidth < docWidth) {
                    setViewScale(wrapperWidth / docWidth);
                } else {
                    setViewScale(1);
                }
            }
        };
        updateScale();
        window.addEventListener('resize', updateScale);
        return () => window.removeEventListener('resize', updateScale);
    }, []);

    const [playingUrl, setPlayingUrl] = useState<string | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const togglePlay = (url: string) => {
        if (playingUrl === url) {
            audioRef.current?.pause();
            setPlayingUrl(null);
        } else {
            if (audioRef.current) {
                audioRef.current.src = url;
                audioRef.current.play();
                setPlayingUrl(url);
            }
        }
    };

    const handleDownloadPrintPDF = async () => {
        setIsExporting(true);
        try {
            console.log('Iniciando exportação de PDF para Impressão (A4 Paginação)...');
            if (onExport) await onExport();
            // Pequeno delay para garantir que o layout adaptativo (colunas) foi aplicado
            await new Promise(r => setTimeout(r, 1000));

            const headerElem = document.getElementById('lesson-header');
            const bodyElem = document.getElementById('lesson-body');

            if (!headerElem || !bodyElem) {
                alert("Erro ao identificar componentes para impressão.");
                setIsExporting(false);
                return;
            }

            // --- CONFIGURAÇÃO DE IMPRESSÃO PROFISSIONAL ---
            const pdfWidth = 210; // A4 Width
            const pdfPageHeight = 297; // A4 Height
            const reductionFactor = 0.72; // Redução de ~30% conforme solicitado pelo usuário

            // Largura visual do conteúdo centralizado
            const contentWidth = pdfWidth * reductionFactor;
            const xOffset = (pdfWidth - contentWidth) / 2;

            // 1. Captura do Cabeçalho (Fixo em todas as páginas)
            const headerCanvas = await html2canvas(headerElem, {
                scale: 3,
                useCORS: true,
                backgroundColor: '#1A110D',
                windowWidth: 1000 // Garante proporções de desktop para clareza
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

            // Altura real que o corpo ocupará no PDF
            const bodyVisualHeight = (bodyCanvas.height * contentWidth) / bodyCanvas.width;

            const pdf = new jsPDF({
                orientation: 'p',
                unit: 'mm',
                format: 'a4',
                compress: true
            });

            // --- LÓGICA DE PAGINAÇÃO E REPETIÇÃO DE CABEÇALHO ---
            const bodyAvailableHeightPerPage = pdfPageHeight - headerPdfHeight - 10; // 10mm margem segurança
            let heightRemaining = bodyVisualHeight;
            let currentOffset = 0;

            while (heightRemaining > 0) {
                // Passo A: Desenha o Corpo (imagem fatiada pelo offset negativo)
                // O corpo começa logo abaixo do cabeçalho
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

                // Passo B: Máscara de Proteção (Garante que o corpo não vaze para trás do cabeçalho)
                pdf.setFillColor(255, 255, 255);
                pdf.rect(0, 0, pdfWidth, headerPdfHeight, 'F');

                // Passo C: Desenha o Cabeçalho (Sempre no topo, sobrepondo qualquer vazamento)
                pdf.addImage(headerImgData, 'PNG', 0, 0, pdfWidth, headerPdfHeight, undefined, 'FAST');

                // Passo D: Limpeza do Rodapé (Evita que o conteúdo vaze para a margem física da impressora)
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
            alert("PDF Profissional para Impressão gerado com sucesso!");

        } catch (error) {
            console.error('Erro no Print PDF:', error);
            alert('Falha interna na geração do PDF de Impressão.');
        } finally {
            setIsExporting(false);
        }
    };

    const handleDownloadPDF = async () => {
        setIsExporting(true);
        try {
            console.log('Iniciando exportação de PDF...');
            if ((window as any).logDebug) (window as any).logDebug('Aguardando sincronização...');

            // 1. Sincronização e Delay para estabilização do DOM
            if (onExport) await onExport();
            await new Promise(r => setTimeout(r, 1000)); // Delay maior para tablets

            // Busca o elemento de forma robusta
            const element = document.getElementById('lesson-document') || documentRef.current;

            if (!element) {
                alert("Erro Fatal: O documento da aula não foi encontrado para exportação.");
                setIsExporting(false);
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
            });

            console.log('Salvando...');
            pdf.save(`${studentName} - ${instrument} - ${today}.pdf`);

            if ((window as any).logDebug) (window as any).logDebug('PDF baixado!');
        } catch (error) {
            console.error('Erro ao baixar PDF:', error);
            alert('Erro na Geracao do PDF: ' + (error instanceof Error ? error.message : "Falha desconhecida"));
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-[#0A0503]/98 backdrop-blur-xl z-[100] overflow-y-auto font-sans p-2 md:p-6">
            {/* Action Bar */}
            <div className="max-w-4xl mx-auto mb-4 flex justify-between items-center bg-white/10 backdrop-blur-md p-2 px-4 rounded-full border border-white/10 sticky top-0 z-50 shadow-2xl">
                <div className="flex items-center gap-3">
                    <Logo light size="sm" />
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleDownloadPDF}
                        disabled={isExporting}
                        className={`${isExporting ? 'bg-stone-500 animate-pulse' : 'bg-white/10 hover:bg-white/20'} px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all shadow-lg flex items-center gap-2 text-white border border-white/10`}
                    >
                        {isExporting ? (
                            <><Clock className="w-3.5 h-3.5 animate-spin" /> Gerando...</>
                        ) : (
                            <>
                                <FileText className="w-3.5 h-3.5" />
                                PDF Digital
                            </>
                        )}
                    </button>
                    <button
                        onClick={handleDownloadPrintPDF}
                        disabled={isExporting}
                        className={`${isExporting ? 'bg-stone-500 animate-pulse' : 'bg-[#E87A2C] hover:bg-orange-600'} px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all shadow-lg flex items-center gap-2 text-white border border-white/10`}
                    >
                        <GraduationCap className="w-4 h-4" />
                        PDF para Impressão
                    </button>
                    <button onClick={onClose} className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-full transition-all">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <div ref={wrapperRef} className="w-full flex flex-col items-center">
                <div
                    ref={documentRef}
                    id="lesson-document"
                    className="bg-white"
                    style={{
                        width: '210mm',
                        minHeight: '297mm',
                        padding: '0',
                        flexShrink: 0,
                        transform: (!isExporting && viewScale < 1) ? `scale(${viewScale})` : 'none',
                        transformOrigin: 'top center',
                        marginBottom: (!isExporting && viewScale < 1) ? `-${(1 - viewScale) * 100}%` : '0',
                        boxShadow: 'none'
                    }}
                >
                    {/* Slim Header */}
                    <div id="lesson-header" className="bg-[#1A110D] border-b-[6px] border-[#E87A2C]">
                        <div className="p-10 flex flex-row justify-between items-center gap-12">
                            {/* Brand & Instrument */}
                            <div className="flex flex-col gap-4">
                                <div className="flex flex-col gap-2">
                                    <img src="/Logo-Laranja.png" alt="Logo" className="h-10 w-auto object-contain brightness-110 self-start" />
                                    <span className="text-[10px] font-black text-white uppercase tracking-tighter italic">MusiClass</span>
                                </div>
                                <h1 className="text-xl font-black text-white uppercase tracking-tighter">Prática de {instrument}</h1>
                            </div>

                            {/* Info Grid - Simplified */}
                            <div className="flex gap-12">
                                <div className="flex flex-col border-l-2 border-[#E87A2C] pl-5">
                                    <span className="text-[13px] font-black text-white uppercase tracking-tight leading-tight">{studentName}</span>
                                    <div className="flex items-center gap-3 mt-1">
                                        <span className="text-[10px] font-bold text-[#E87A2C] uppercase tracking-widest">{today}</span>
                                        {contractTotal && contractTotal > 0 && (
                                            <span className="text-[9px] font-black text-white bg-[#E87A2C] px-2 py-0.5 rounded-md uppercase tracking-tighter">
                                                Aula {lessonCount} / {contractTotal}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex flex-col border-l-2 border-white/20 pl-5">
                                    <span className="text-[11px] font-black text-white uppercase tracking-tight opacity-70">Prof. {teacherName}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div id="lesson-body" className="p-6 md:p-10 space-y-10">
                        {/* Objetivos */}
                        {objective && (
                            <section className="relative">
                                <div className="absolute -left-4 top-0 w-1 h-full bg-[#E87A2C]/20 rounded-full" />
                                <h2 className="text-[9px] font-black text-stone-300 uppercase tracking-[0.4em] mb-3">Diretrizes da Aula</h2>
                                <p className="text-[#3C2415] font-bold text-lg leading-snug italic max-w-2xl">
                                    "{objective}"
                                </p>
                            </section>
                        )}

                        <div className="flex flex-col gap-10">
                            {/* Seção de Harmonias - Ocultar para Bateria */}
                            {chords.length > 0 && instrument !== Instrument.VOCALS && instrument !== Instrument.DRUMS && (
                                <section>
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-4 h-4 rounded bg-[#E87A2C]/10 flex items-center justify-center">
                                                <Music className="w-2.5 h-2.5 text-[#E87A2C]" />
                                            </div>
                                            <h2 className="text-[10px] font-black text-stone-800 uppercase tracking-widest">Estrutura Harmônica</h2>
                                        </div>
                                        <span className="text-[11px] font-black text-stone-500 uppercase">{chords.length} ACORDES</span>
                                    </div>
                                    <div className={`grid ${instrument?.toLowerCase().includes('violão') || instrument?.toLowerCase().includes('guitarra') || instrument?.toLowerCase().includes('baixo') || instrument?.toLowerCase().includes('violino') ? 'grid-cols-4' : 'grid-cols-2'} gap-4`}>
                                        {chords.map((chord, i) => (
                                            <ChordVisualizer
                                                key={i}
                                                instrument={instrument}
                                                chordNotes={chord.notes}
                                                root={chord.root}
                                                type={chord.typeId}
                                                ext={chord.extId}
                                                bass={chord.bass}
                                                notesWithIndices={chord.notesWithIndices}
                                                isCustom={chord.isCustom}
                                            />
                                        ))}
                                    </div>
                                </section>
                            )}

                            <div className={`grid ${solos.length > 0 && exercises.length > 0 ? 'grid-cols-12' : 'grid-cols-1'} gap-10`}>
                                {/* Left Side: Solos */}
                                {solos.length > 0 && (
                                    <div className={`${exercises.length > 0 ? 'col-span-8' : 'col-span-1'} space-y-6`}>
                                        <h2 className="text-[10px] font-black text-stone-800 uppercase tracking-widest mb-4">Solos e Melodias (Bimanual)</h2>
                                        <div className="space-y-4">
                                            {solos.map((solo, i) => (
                                                <div key={i} className="bg-stone-50 p-6 rounded-2xl border border-stone-100">
                                                    <p className="font-black text-[8px] uppercase text-[#E87A2C] mb-4 tracking-widest">{solo.title || `Parte ${i + 1}`}</p>
                                                    <div className="flex flex-wrap gap-4">
                                                        {(() => {
                                                            const maxPos = Math.max(...solo.notes.map(n => n.position || 0), 0);
                                                            const steps = Array.from({ length: maxPos + 1 });
                                                            return steps.map((_, stepIdx) => {
                                                                const harmonyNotes = solo.notes.filter(n => n.type === 'harmony' && (n.position || 0) === stepIdx);
                                                                const soloNotes = solo.notes.filter(n => n.type === 'solo' && (n.position || 0) === stepIdx);

                                                                if (harmonyNotes.length === 0 && soloNotes.length === 0) return null;

                                                                return (
                                                                    <div key={stepIdx} className="flex flex-col gap-1 min-w-[50px] bg-stone-100/50 p-2 rounded-xl border border-stone-100">
                                                                        <div className="flex flex-wrap gap-1 min-h-[20px]">
                                                                            {harmonyNotes.map((n, idx) => (
                                                                                <div key={idx} className="flex items-center justify-center h-5 min-w-[20px] px-1.5 bg-red-600 text-white rounded-md font-black text-[9px] shadow-sm leading-tight">
                                                                                    {n.note}
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                        <div className="h-px bg-stone-200 w-full" />
                                                                        <div className="flex flex-wrap gap-1 min-h-[20px]">
                                                                            {soloNotes.map((n, idx) => (
                                                                                <div key={idx} className="flex items-center justify-center h-5 min-w-[20px] px-1.5 bg-blue-600 text-white rounded-md font-black text-[9px] shadow-sm leading-tight">
                                                                                    {n.note}
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                );
                                                            });
                                                        })()}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Right Side: Exercises */}
                                {exercises.length > 0 && (
                                    <div className={`${solos.length > 0 ? 'col-span-4' : 'col-span-1'} space-y-10`}>
                                        <h2 className="text-[10px] font-black text-stone-800 uppercase tracking-widest mb-4">Checklist de Prática</h2>
                                        <div className={`space-y-2 ${solos.length === 0 ? 'grid grid-cols-2 gap-4 space-y-0' : ''}`}>
                                            {exercises.map((ex, i) => (
                                                <div key={i} className="p-4 bg-white border border-stone-100 rounded-xl flex items-center gap-4 group transition-all hover:border-orange-100 shadow-sm">
                                                    <div className="w-6 h-6 bg-[#1A110D] rounded-md flex items-center justify-center text-[9px] font-black text-white shrink-0 group-hover:bg-[#E87A2C] leading-tight">
                                                        {i + 1}
                                                    </div>
                                                    <span className="text-[11px] font-black text-[#3C2415] leading-tight">{ex}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Tablaturas (Ocultar para Bateria) */}
                            {instrument !== Instrument.DRUMS && tabs?.map((tab, i) => (
                                <section key={i} className="pt-8 border-t border-stone-100">
                                    <h2 className="text-[10px] font-black text-stone-800 uppercase tracking-widest mb-4">{tab.title || "Material Complementar / TAB"}</h2>
                                    <div className="bg-[#FBF6F0] p-6 rounded-2xl border border-stone-200 overflow-visible">
                                        <pre className="font-mono text-[#3C2415] text-[10px] sm:text-xs leading-relaxed tracking-wider whitespace-pre selection:bg-orange-100">
                                            {tab.content}
                                        </pre>
                                    </div>
                                </section>
                            ))}

                            {/* Escalas e Fundamentos (Largura Total na Base) */}
                            {scales.length > 0 && instrument !== Instrument.VOCALS && instrument !== Instrument.DRUMS && (
                                <section className="pt-8 border-t-2 border-[#E87A2C]/10">
                                    <h2 className="text-[10px] font-black text-stone-800 uppercase tracking-widest mb-6">Fundamentos e Escalas Práticas</h2>
                                    <div className="grid grid-cols-1 gap-4">
                                        {scales.map((scale, i) => (
                                            <div key={i} className="bg-[#1A110D] p-6 rounded-[24px] shadow-xl flex items-center justify-between gap-10">
                                                <div className="flex flex-col min-w-[120px]">
                                                    <p className="text-[10px] font-black text-[#E87A2C] uppercase tracking-widest">{scale.root} {scale.name}</p>
                                                    <span className="text-[7px] font-bold text-stone-500 uppercase tracking-[0.3em] mt-1">Nível Técnico I</span>
                                                </div>
                                                <div className="flex flex-wrap gap-2 justify-end flex-grow">
                                                    {scale.notes.map((n: string, ni: number) => (
                                                        <div key={ni} className="inline-flex items-center justify-center w-9 h-9 bg-white/10 border border-white/10 font-black text-white text-[11px] rounded-xl shadow-lg leading-tight">
                                                            {n}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* Seção de Bateria (Exclusivo Bateria) */}
                            {instrument === Instrument.DRUMS && (
                                <div className="space-y-10">
                                    {/* Ritmos */}
                                    {drums.rhythms.length > 0 && (
                                        <section>
                                            <h2 className="text-[10px] font-black text-stone-800 uppercase tracking-widest mb-6">Groove da Aula (Pauta Interativa)</h2>
                                            <div className="space-y-8">
                                                {drums.rhythms.map((r, rIdx) => {
                                                    const rec = recordings.find(rec =>
                                                        rec.title === r.title ||
                                                        rec.title.toUpperCase() === r.title.toUpperCase() ||
                                                        (rIdx === 0 && (rec.title === 'RITMO A' || rec.title === 'RITMO 1' || rec.title.includes('RITMO')))
                                                    );
                                                    return (
                                                        <div
                                                            key={rIdx}
                                                            onClick={rec?.url ? () => togglePlay(rec.url) : undefined}
                                                            className={`bg-[#1A110D] p-6 rounded-[24px] border-2 transition-all ${rec ? 'audio-card-pdf cursor-pointer hover:border-[#E87A2C]/40' : 'border-transparent'} ${playingUrl === rec?.url ? 'border-[#E87A2C]' : 'border-transparent'}`}
                                                            data-url={rec?.url}
                                                        >
                                                            <div className="flex justify-between items-center mb-6">
                                                                <p className="text-[9px] font-black text-[#E87A2C] uppercase tracking-widest">{r.title}</p>
                                                                {rec && (
                                                                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all ${playingUrl === rec.url ? 'bg-[#E87A2C] border-[#E87A2C]' : 'bg-white/5 border-white/10'}`}>
                                                                        <Headphones className={`w-3 h-3 ${playingUrl === rec.url ? 'text-white' : 'text-[#E87A2C]'}`} />
                                                                        <span className={`text-[7px] font-black uppercase tracking-widest ${playingUrl === rec.url ? 'text-white' : 'text-white'}`}>
                                                                            {playingUrl === rec.url ? 'REPRODUZINDO' : 'Ouvir Loop'}
                                                                        </span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="flex gap-1 overflow-x-auto pb-2 scrollbar-hide">
                                                                {(r.sequence || []).map((stepParts: any[], idx: number) => (
                                                                    <div key={idx} className={`min-w-[32px] md:min-w-[42px] min-h-[120px] rounded-xl border border-white/5 flex flex-col items-center justify-start py-3 gap-1 ${idx % 4 === 0 ? 'bg-white/5' : ''}`}>
                                                                        {['crash', 'hihat', 'tom1', 'tom2', 'snare', 'floor', 'kick'].map(partId => {
                                                                            const isActive = stepParts.includes(partId) || (partId === 'crash' && stepParts.includes('crash/ride'));
                                                                            if (!isActive) return null;
                                                                            return (
                                                                                <div key={partId} className={`w-5 h-5 md:w-7 md:h-7 rounded-md flex items-center justify-center text-[10px] font-black text-white ${(partId === 'kick') ? 'bg-rose-500' :
                                                                                    (partId === 'snare') ? 'bg-blue-600' :
                                                                                        (partId === 'hihat') ? 'bg-orange-500' :
                                                                                            (partId === 'crash' || partId === 'crash/ride') ? 'bg-yellow-500' :
                                                                                                (partId === 'tom1') ? 'bg-emerald-500' :
                                                                                                    (partId === 'tom2') ? 'bg-emerald-600' :
                                                                                                        (partId === 'floor') ? 'bg-purple-600' :
                                                                                                            'bg-stone-500'
                                                                                    }`}>
                                                                                    {(partId === 'kick') ? '🥁' :
                                                                                        (partId === 'snare') ? '⊚' :
                                                                                            (partId === 'hihat') ? '×' :
                                                                                                (partId === 'crash' || partId === 'crash/ride') ? '✳' :
                                                                                                    (partId === 'tom1') ? '◦' :
                                                                                                        (partId === 'tom2') ? '◦' :
                                                                                                            (partId === 'floor') ? '◯' : '◦'}
                                                                                </div>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </section>
                                    )}

                                    {/* Rudimentos */}
                                    {drums.rudiments.length > 0 && (
                                        <section>
                                            <h2 className="text-[10px] font-black text-stone-800 uppercase tracking-widest mb-6">Fundamentos de Mãos (Rudimentos)</h2>
                                            <div className="grid grid-cols-2 gap-4">
                                                {drums.rudiments.map((rud, idx) => (
                                                    <div key={idx} className="bg-stone-50 p-5 rounded-2xl border border-stone-100">
                                                        <p className="text-[8px] font-black text-stone-400 uppercase tracking-widest mb-3">{rud.title}</p>
                                                        <div className="flex flex-wrap gap-2">
                                                            {rud.pattern.map((hand: string, sIdx: number) => (
                                                                <div key={sIdx} className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${hand === 'R' ? 'bg-[#E87A2C] text-white' : 'bg-[#1A110D] text-white'} leading-tight`}>
                                                                    {hand}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </section>
                                    )}
                                </div>
                            )}

                            {/* Guias de Estudo Interativas (Todos os instrumentos habilitados para PDF) */}
                            {recordings.length > 0 && (
                                <section className="pt-8 border-t border-stone-100">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-6 h-6 bg-[#E87A2C]/10 rounded-lg flex items-center justify-center">
                                            <Headphones className="w-3.5 h-3.5 text-[#E87A2C]" />
                                        </div>
                                        <h2 className="text-[10px] font-black text-stone-800 uppercase tracking-widest">Guias de Estudo e Referência</h2>
                                    </div>
                                    <div className="grid grid-cols-2 gap-6">
                                        {recordings.map((rec) => (
                                            <div
                                                key={rec.id}
                                                data-url={rec.url}
                                                onClick={() => togglePlay(rec.url)}
                                                className={`audio-card-pdf p-5 rounded-[24px] border shadow-xl flex items-center justify-between group transition-all cursor-pointer ${playingUrl === rec.url ? 'bg-[#E87A2C] border-[#E87A2C]' : 'bg-[#1A110D] border-white/5'}`}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg ${playingUrl === rec.url ? 'bg-white text-[#E87A2C]' : 'bg-[#E87A2C] shadow-orange-500/20'}`}>
                                                        {playingUrl === rec.url ? (
                                                            <Headphones className="w-5 h-5 animate-bounce" />
                                                        ) : (
                                                            <Play className="w-5 h-5 fill-current" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className={`text-[11px] font-black uppercase tracking-tight leading-tight ${playingUrl === rec.url ? 'text-white' : 'text-white'}`}>{rec.title || 'Referência MusiClass'}</p>
                                                        <p className={`text-[8px] font-bold uppercase tracking-widest mt-1.5 ${playingUrl === rec.url ? 'text-white/60' : 'text-stone-500'}`}>
                                                            {playingUrl === rec.url ? 'REPRODUZINDO...' : 'Clique para ouvir no PDF'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="py-10 text-center bg-stone-50 border-t border-stone-100 flex flex-col items-center gap-4">
                        <Logo size="sm" />
                        <div className="flex flex-col gap-1">
                            <p className="text-[8px] font-black text-stone-400 uppercase tracking-[0.6em]">MusiClass Educational Ecosystem</p>
                            <p className="text-[6px] font-bold text-stone-300 uppercase tracking-widest">Certification of Musical Progress &bull; {new Date().getFullYear()}</p>
                        </div>
                    </div>
                </div>
            </div>
            <audio ref={audioRef} onEnded={() => setPlayingUrl(null)} className="hidden" />
        </div>
    );
};
