
import React, { useRef } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { ChordVisualizer } from './ChordVisualizer';
import { Logo } from './Logo';
import { Instrument, Level, SoloNote } from '../types';
import { User, X, Image as ImageIcon, GraduationCap, Calendar, Music, FileText, Play } from 'lucide-react';


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
    onClose: () => void;
    onExport?: () => void;
}

export const StudentPreview: React.FC<StudentPreviewProps> = ({
    studentName, teacherName, instrument, objective, chords, scales, exercises, tabs, solos = [], recordings = [], onClose, onExport
}) => {
    const today = new Date().toLocaleDateString('pt-BR');
    const documentRef = useRef<HTMLDivElement>(null);

    const handleDownloadImage = async () => {
        if (!documentRef.current) return;

        const canvas = await html2canvas(documentRef.current, {
            scale: 4,
            useCORS: true,
            backgroundColor: '#ffffff',
            logging: false,
            windowWidth: 1200,
        });

        const link = document.createElement('a');
        link.download = `aula-${studentName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png', 1.0);
        link.click();

        if (onExport) onExport();
    };

    const handleDownloadPDF = async () => {
        if (!documentRef.current) return;

        const canvas = await html2canvas(documentRef.current, {
            scale: 3,
            useCORS: true,
            backgroundColor: '#ffffff',
            logging: false,
            windowWidth: 1200,
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        const imgWidth = 210;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);

        // Mapeamento Inteligente: Transforma os cards do HTML em links no PDF
        const cards = documentRef.current.querySelectorAll('.audio-card-pdf');
        const containerRect = documentRef.current.getBoundingClientRect();

        cards.forEach((card) => {
            const cardRect = card.getBoundingClientRect();
            const url = (card as HTMLElement).dataset.url;

            if (url) {
                const relTop = cardRect.top - containerRect.top;
                const relLeft = cardRect.left - containerRect.left;

                const pdfX = (relLeft * imgWidth) / containerRect.width;
                const pdfY = (relTop * imgHeight) / containerRect.height;
                const pdfW = (cardRect.width * imgWidth) / containerRect.width;
                const pdfH = (cardRect.height * imgHeight) / containerRect.height;

                pdf.link(pdfX, pdfY, pdfW, pdfH, { url });
            }
        });

        pdf.save(`aula-${studentName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.pdf`);
        if (onExport) onExport();
    };

    return (
        <div className="fixed inset-0 bg-[#0A0503]/98 backdrop-blur-xl z-[100] overflow-y-auto font-sans p-2 md:p-6">
            {/* Action Bar */}
            <div className="max-w-4xl mx-auto mb-4 flex justify-between items-center bg-white/10 backdrop-blur-md p-2 px-4 rounded-full border border-white/10 sticky top-0 z-50 shadow-2xl">
                <div className="flex items-center gap-3">
                    <Logo light size="sm" />
                </div>
                <div className="flex gap-2">
                    {instrument === Instrument.VOCALS ? (
                        <button
                            onClick={handleDownloadPDF}
                            className="bg-[#1A110D] hover:bg-stone-800 px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all shadow-lg flex items-center gap-2 text-white border border-white/10"
                        >
                            <FileText className="w-3.5 h-3.5 text-[#E87A2C]" /> Salvar Ficha Interativa (PDF)
                        </button>
                    ) : (
                        <button
                            onClick={handleDownloadImage}
                            className="bg-[#E87A2C] hover:bg-orange-600 px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all shadow-lg flex items-center gap-2 text-white"
                        >
                            <ImageIcon className="w-3.5 h-3.5" /> Salvar Alta Resolução (PNG)
                        </button>
                    )}
                    <button onClick={onClose} className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-full transition-all">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <div ref={documentRef} className="max-w-4xl mx-auto bg-white shadow-2xl overflow-hidden rounded-sm">
                {/* Slim Header */}
                <div className="bg-[#1A110D] border-b-[6px] border-[#E87A2C]">
                    <div className="p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-3">
                                <Logo light size="md" />
                            </div>
                            <h1 className="text-xl font-black text-white uppercase tracking-tighter mt-2">Prática de {instrument}</h1>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-4 md:pt-0 border-t border-white/5 md:border-none w-full md:w-auto">
                            <div className="flex flex-col">
                                <span className="text-[6px] font-black text-[#E87A2C] uppercase tracking-[0.3em] mb-0.5">Aluno</span>
                                <span className="text-[11px] font-black text-white uppercase tracking-tight">{studentName}</span>
                            </div>
                            <div className="w-px h-6 bg-white/10 hidden md:block" />
                            <div className="flex flex-col">
                                <span className="text-[6px] font-black text-[#E87A2C] uppercase tracking-[0.3em] mb-0.5">Professor</span>
                                <span className="text-[11px] font-black text-white uppercase tracking-tight">{teacherName}</span>
                            </div>
                            <div className="w-px h-6 bg-white/10 hidden md:block" />
                            <div className="flex flex-col">
                                <span className="text-[6px] font-black text-[#E87A2C] uppercase tracking-[0.3em] mb-0.5">Emissão</span>
                                <span className="text-[11px] font-black text-stone-300 uppercase tracking-tight">{today}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-6 md:p-10 space-y-10">
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
                        {/* Seção de Harmonias - Largura Total */}
                        {chords.length > 0 && instrument !== Instrument.VOCALS && (
                            <section>
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 rounded bg-[#E87A2C]/10 flex items-center justify-center">
                                            <Music className="w-2.5 h-2.5 text-[#E87A2C]" />
                                        </div>
                                        <h2 className="text-[10px] font-black text-stone-800 uppercase tracking-widest">Estrutura Harmônica</h2>
                                    </div>
                                    <span className="text-[8px] font-bold text-stone-400 uppercase">{chords.length} ACORDES</span>
                                </div>
                                <div className={`grid ${instrument?.toLowerCase().includes('violão') || instrument?.toLowerCase().includes('guitarra') || instrument?.toLowerCase().includes('baixo') ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'} gap-3 md:gap-4`}>
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

                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                            {/* Left Side: Solos */}
                            <div className="lg:col-span-8 space-y-10">
                                {solos.length > 0 && instrument !== Instrument.VOCALS && (
                                    <section>
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
                                                                                <div key={idx} className="px-2 py-0.5 bg-red-600 text-white rounded-md font-black text-[9px] shadow-sm">
                                                                                    {n.note}
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                        <div className="h-px bg-stone-200 w-full" />
                                                                        <div className="flex flex-wrap gap-1 min-h-[20px]">
                                                                            {soloNotes.map((n, idx) => (
                                                                                <div key={idx} className="px-2 py-0.5 bg-blue-600 text-white rounded-md font-black text-[9px] shadow-sm">
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
                                    </section>
                                )}
                            </div>

                            {/* Right Side: Exercises & Scales */}
                            <div className="lg:col-span-4 space-y-10">
                                {exercises.length > 0 && (
                                    <section>
                                        <h2 className="text-[10px] font-black text-stone-800 uppercase tracking-widest mb-4">Checklist de Prática</h2>
                                        <div className="space-y-2">
                                            {exercises.map((ex, i) => (
                                                <div key={i} className="p-4 bg-white border border-stone-100 rounded-xl flex items-center gap-4 group transition-all hover:border-orange-100 shadow-sm">
                                                    <div className="w-6 h-6 bg-[#1A110D] rounded-md flex items-center justify-center text-[9px] font-black text-white shrink-0 group-hover:bg-[#E87A2C]">
                                                        {i + 1}
                                                    </div>
                                                    <span className="text-[11px] font-black text-[#3C2415] leading-tight">{ex}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                )}

                                {scales.length > 0 && instrument !== Instrument.VOCALS && (
                                    <section>
                                        <h2 className="text-[10px] font-black text-stone-800 uppercase tracking-widest mb-4">Fundamentos</h2>
                                        <div className="space-y-3">
                                            {scales.map((scale, i) => (
                                                <div key={i} className="bg-[#1A110D] p-5 rounded-xl shadow-xl">
                                                    <div className="flex justify-between items-center mb-4">
                                                        <p className="text-[9px] font-black text-[#E87A2C] uppercase tracking-widest">{scale.root} {scale.name}</p>
                                                        <div className="w-1.5 h-1.5 rounded-full bg-[#E87A2C] animate-pulse" />
                                                    </div>
                                                    <div className="flex gap-1 justify-start">
                                                        {scale.notes.map((n: string, ni: number) => (
                                                            <div key={ni} className="w-[30px] h-[30px] md:w-[35px] md:h-[35px] bg-white/10 border border-white/10 flex items-center justify-center font-black text-white text-[9px] md:text-[11px] rounded-[6px] shadow-lg shrink-0">
                                                                {n}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                )}
                            </div>
                        </div>

                        {/* Material Complementar */}
                        {tabs.filter(t => t.content.length > 5).map((tab, i) => (
                            <section key={i} className="pt-8 border-t border-stone-100">
                                <h2 className="text-[10px] font-black text-stone-800 uppercase tracking-widest mb-4">{tab.title || "Material Complementar"}</h2>
                                <div className="bg-[#FBF6F0] p-6 rounded-2xl border border-stone-200 overflow-hidden">
                                    <pre className="font-mono text-[#3C2415] text-[10px] sm:text-xs leading-relaxed tracking-wider whitespace-pre overflow-x-auto selection:bg-orange-100">
                                        {tab.content}
                                    </pre>
                                </div>
                            </section>
                        ))}

                        {/* Guias Vocais - Preview Integrada */}
                        {instrument === Instrument.VOCALS && recordings.length > 0 && (
                            <section className="pt-8 border-t border-stone-100">
                                <h2 className="text-[10px] font-black text-stone-800 uppercase tracking-widest mb-6">Guias de Treino MusiClass Studio</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {recordings.map((rec) => (
                                        <div
                                            key={rec.id}
                                            data-url={rec.url}
                                            className="audio-card-pdf bg-[#1A110D] p-5 rounded-[24px] border border-white/5 shadow-xl flex items-center justify-between group transition-all"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-[#E87A2C] rounded-2xl flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
                                                    <Play className="w-5 h-5 fill-current" />
                                                </div>
                                                <div>
                                                    <p className="text-[11px] font-black text-white uppercase tracking-tight">{rec.title}</p>
                                                    <p className="text-[8px] font-bold text-stone-500 uppercase tracking-widest mt-0.5">Clique para ouvir a guia</p>
                                                </div>
                                            </div>
                                            {/* O player de áudio fica oculto no PDF (pela captura do canvas) mas disponível na preview */}
                                            <div className="hidden md:block opacity-0 group-hover:opacity-100 transition-opacity">
                                                <audio src={rec.url} controls className="w-24 h-6 brightness-90 scale-75 origin-right" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}
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
        </div>
    );
};
