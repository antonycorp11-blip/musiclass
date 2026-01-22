
import React, { useRef } from 'react';
import html2canvas from 'html2canvas';
import { ChordVisualizer } from './ChordVisualizer';
import { Logo } from './Logo';
import { User, X, Image as ImageIcon, GraduationCap, Calendar, Music } from 'lucide-react';

interface StudentPreviewProps {
    studentName: string;
    teacherName: string;
    instrument: any;
    objective: string;
    chords: any[];
    scales: any[];
    exercises: string[];
    tabs: { title: string, content: string }[];
    solos?: { title: string, notes: string[] }[];
    onClose: () => void;
}

export const StudentPreview: React.FC<StudentPreviewProps> = ({
    studentName, teacherName, instrument, objective, chords, scales, exercises, tabs, solos = [], onClose
}) => {
    const today = new Date().toLocaleDateString('pt-BR');
    const documentRef = useRef<HTMLDivElement>(null);

    const handleDownloadImage = async () => {
        if (!documentRef.current) return;

        const canvas = await html2canvas(documentRef.current, {
            scale: 3,
            useCORS: true,
            backgroundColor: '#ffffff',
            logging: false,
            windowWidth: 1000,
        });

        const link = document.createElement('a');
        link.download = `aula-${studentName.toLowerCase().replace(/\s+/g, '-')}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
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
                        onClick={handleDownloadImage}
                        className="bg-[#E87A2C] hover:bg-orange-600 px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all shadow-lg flex items-center gap-2 text-white"
                    >
                        <ImageIcon className="w-3.5 h-3.5" /> Salvar PNG
                    </button>
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
                                <div className="h-4 w-px bg-white/10" />
                                <span className="bg-[#E87A2C] px-2 py-0.5 rounded-[4px] text-[8px] font-black text-white uppercase tracking-tighter">Report</span>
                            </div>
                            <h1 className="text-xl font-black text-white uppercase tracking-tighter mt-2">Prática de {instrument}</h1>
                        </div>

                        <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
                            <div className="flex items-center gap-3 bg-white/5 p-3 px-4 rounded-lg border border-white/5 min-w-[180px]">
                                <User className="w-4 h-4 text-[#E87A2C]" />
                                <div className="flex flex-col">
                                    <span className="text-[7px] font-black text-stone-500 uppercase tracking-widest">Estudante</span>
                                    <span className="text-xs font-black text-white uppercase truncate max-w-[120px]">{studentName}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 bg-white/5 p-3 px-4 rounded-lg border border-white/5 min-w-[180px]">
                                <Calendar className="w-4 h-4 text-[#E87A2C]" />
                                <div className="flex flex-col">
                                    <span className="text-[7px] font-black text-stone-500 uppercase tracking-widest">Data</span>
                                    <span className="text-xs font-black text-white uppercase">{today}</span>
                                </div>
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
                        {chords.length > 0 && (
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
                                            notesWithIndices={chord.notesWithIndices}
                                        />
                                    ))}
                                </div>
                            </section>
                        )}

                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                            {/* Left Side: Solos */}
                            <div className="lg:col-span-8 space-y-10">
                                {solos.length > 0 && (
                                    <section>
                                        <h2 className="text-[10px] font-black text-stone-800 uppercase tracking-widest mb-4">Solos e Melodias</h2>
                                        <div className="space-y-3">
                                            {solos.map((solo, i) => (
                                                <div key={i} className="bg-stone-50 p-4 rounded-xl border border-stone-100">
                                                    <p className="font-black text-[8px] uppercase text-[#E87A2C] mb-3 tracking-widest">{solo.title || `Solo Parte ${i + 1}`}</p>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {solo.notes.map((n, idx) => (
                                                            <span key={idx} className="px-3 py-1.5 bg-white rounded-lg border border-stone-200 font-black text-[#1A110D] text-[10px] shadow-sm">{n}</span>
                                                        ))}
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

                                {scales.length > 0 && (
                                    <section>
                                        <h2 className="text-[10px] font-black text-stone-800 uppercase tracking-widest mb-4">Fundamentos</h2>
                                        <div className="space-y-3">
                                            {scales.map((scale, i) => (
                                                <div key={i} className="bg-[#1A110D] p-5 rounded-xl shadow-xl">
                                                    <div className="flex justify-between items-center mb-4">
                                                        <p className="text-[9px] font-black text-[#E87A2C] uppercase tracking-widest">{scale.root} {scale.name}</p>
                                                        <div className="w-1.5 h-1.5 rounded-full bg-[#E87A2C] animate-pulse" />
                                                    </div>
                                                    <div className="flex flex-wrap gap-1">
                                                        {scale.notes.map((n: string, ni: number) => (
                                                            <span key={ni} className="w-7 h-7 md:w-8 md:h-8 rounded bg-white/5 border border-white/10 flex items-center justify-center font-black text-white text-[9px] md:text-[10px] shrink-0">{n}</span>
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
