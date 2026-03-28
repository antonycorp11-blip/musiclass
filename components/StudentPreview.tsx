
import React, { useRef, useState, useEffect } from 'react';
import { ChordVisualizer } from './ChordVisualizer';
import { Logo } from './Logo';
import { Instrument, Level, SoloNote } from '../types';
import { User, X, GraduationCap, Calendar, Music, FileText, Play, Headphones, Clock, CheckCircle2 } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { exportToPrintPDF, exportToDigitalPDF } from '../services/pdfExportService';
import { PdfIconBox, PdfTitle, PdfScaleCircle, PdfDrumPart } from './PdfUtils';


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
    lessonId?: string;
    designSettings: any;
    onClose: () => void;
    onExport?: () => Promise<{ recordings: any[], lessonId?: string }>;
}

export const StudentPreview: React.FC<StudentPreviewProps> = ({
    studentName, teacherName, instrument, objective, chords, scales, exercises, tabs, solos = [], recordings = [], drums = { rhythms: [], rudiments: [] }, lessonCount, contractTotal, lessonId: initialLessonId, onClose, onExport, designSettings
}) => {
    const { showToast } = useToast();
    const today = new Date().toLocaleDateString('pt-BR');
    const documentRef = useRef<HTMLDivElement>(null);
    const [lessonId, setLessonId] = useState(initialLessonId);

    const [viewScale, setViewScale] = useState(1);
    const [isExporting, setIsExporting] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);


    const formatShortName = (name: string) => {
        const parts = name.trim().split(/\s+/);
        if (parts.length <= 2) return name;
        return `${parts[0]} ${parts[parts.length - 1]}`;
    };

    const shortStudentName = formatShortName(studentName);

    useEffect(() => {
        console.group('[MusiClass] STUDENT PREVIEW LOADED');
        console.log("DADOS DO ALUNO E CARGA DA AULA:", { 
            studentName, instrument, objective, lessonId: initialLessonId,
            chords, scales, exercises, tabs, solos, drums, recordings, designSettings 
        });
        console.groupEnd();
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
        await exportToPrintPDF({
            studentName,
            onExport,
            onSuccess: (msg) => showToast(msg, "success"),
            onError: (msg) => showToast(msg, "error")
        });
        setIsExporting(false);
    };

    const handleDownloadPDF = async () => {
        setIsExporting(true);
        await exportToDigitalPDF({
            studentName,
            instrument,
            currentLessonId: lessonId,
            documentElement: documentRef.current,
            onExport,
            onLessonIdUpdate: setLessonId,
            onSuccess: (msg) => showToast(msg, "success"),
            onError: (msg) => showToast(msg, "error")
        });
        setIsExporting(false);
    };

    return (
        <div className="fixed inset-0 bg-[#0A0503]/98 backdrop-blur-xl z-[100] overflow-y-auto font-sans p-2 md:p-6 no-scrollbar">
            {/* Action Bar */}
            <div className="max-w-4xl mx-auto mb-4 flex justify-between items-center bg-black backdrop-blur-md p-2 px-4 rounded-full border border-white/20 sticky top-0 z-50 shadow-2xl">
                <div className="flex items-center gap-3">
                    <Logo light size="sm" />
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleDownloadPDF}
                        disabled={isExporting}
                        className={`${isExporting ? 'bg-stone-500 animate-pulse' : 'bg-black hover:bg-stone-900'} px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg flex items-center gap-2 text-white border border-white/10`}
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
                        className={`${isExporting ? 'bg-stone-500 animate-pulse' : 'bg-[#E87A2C] hover:bg-orange-600'} px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg flex items-center gap-2 text-[#1A110D] border border-[#E87A2C]/10`}
                    >
                        <GraduationCap className="w-4 h-4" />
                        PDF para Impressão
                    </button>
                    <button onClick={onClose} className="bg-black hover:bg-rose-600 text-white p-2.5 rounded-xl border border-white/10 transition-all">
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
                        fontFamily: "'Inter', sans-serif",
                        transform: (!isExporting && viewScale < 1) ? `scale(${viewScale})` : 'none',
                        transformOrigin: 'top center',
                        marginBottom: (!isExporting && viewScale < 1) ? `-${(1 - viewScale) * 100}%` : '0',
                        boxShadow: 'none',
                        backgroundColor: '#ffffff'
                    }}
                >
                    {/* Slim Header */}
                    <div id="lesson-header" style={{ backgroundColor: '#1A110D', borderBottom: '6px solid #E87A2C' }}>
                        <div 
                            className="flex flex-row items-center gap-0"
                            style={{ padding: `${designSettings?.headerPaddingV || 32}px ${designSettings?.headerPaddingH || 48}px` }}
                        >
                            {/* Brand Zone */}
                            <div 
                                className="flex flex-col shrink-0 pr-8"
                                style={{ transform: `translateX(${designSettings?.logoOffset || 0}px)` }}
                            >
                                <img 
                                    src="/Logo-Laranja.png" 
                                    alt="Logo" 
                                    className="w-auto object-contain self-start" 
                                    style={{ 
                                        height: `${(designSettings.logoHeight || 50) * 0.8}px`,
                                        marginBottom: designSettings.showMusiClass ? '4px' : '0'
                                    }}
                                />
                                {designSettings.showMusiClass && (
                                    <span className="text-[8px] font-black text-white/30 uppercase tracking-[0.2em] font-sans ml-1 text-left">MusiClass</span>
                                )}
                            </div>

                            {/* Vertical Divider 1 */}
                            <div className="h-12 w-[2px] bg-[#E87A2C]/40 shrink-0" />

                            {/* Info Zone */}
                            <div 
                                className="flex-1 flex flex-col justify-center px-6 min-w-0"
                                style={{ transform: `translateX(${designSettings.studentOffset}px)` }}
                            >
                                <div className="mb-1">
                                    <span 
                                        className="font-black text-white uppercase tracking-tight leading-none block"
                                        style={{ fontSize: `${(designSettings.studentFontSize || 24) * 0.9}px` }}
                                    >
                                        {shortStudentName}
                                    </span>
                                </div>
                                <div className="flex flex-wrap items-center gap-4">
                                    <span className="text-[12px] font-bold text-[#E87A2C] uppercase tracking-widest leading-none">
                                        {today}
                                    </span>
                                    {lessonCount !== undefined && (
                                        <div 
                                            className="inline-flex items-center justify-center h-6 px-3 bg-[#E87A2C] rounded-md shrink-0 shadow-lg shadow-orange-500/20"
                                        >
                                            <span className="text-[10px] font-black text-[#1A110D] uppercase tracking-tight leading-none pt-[1px]">Aula {lessonCount} {contractTotal ? `/ ${contractTotal}` : ''}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Vertical Divider 2 */}
                            <div className="h-12 w-[1px] bg-white/10 shrink-0 mx-6" />

                            {/* Teacher Zone */}
                            <div 
                                className="shrink-0 text-right flex flex-col justify-center"
                                style={{ transform: `translateX(${designSettings.teacherOffset}px)`, minWidth: '150px' }}
                            >
                                <span className="text-[9px] font-bold text-white/30 uppercase tracking-[0.15em] mb-1 leading-none">Instrutor</span>
                                <span 
                                    className="font-black text-white/70 uppercase tracking-tight leading-tight"
                                    style={{ fontSize: `${(designSettings.teacherFontSize || 16) * 0.9}px` }}
                                >
                                    Prof. {teacherName}
                                </span>
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

                        {/* Seção de Confirmação Simplificada */}
                        <div className={`p-4 rounded-[24px] border flex items-center justify-between gap-4 group overflow-hidden relative ${lessonId ? 'bg-emerald-50 border-emerald-100' : 'bg-stone-50 border-stone-200 shadow-sm opacity-80'}`}>
                            <div className="absolute right-0 top-0 w-32 h-32 bg-emerald-500/5 rounded-full -mr-16 -mt-16" />
                            <div className="flex items-center gap-3 z-10 shrink-0">
                                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-md ${lessonId ? 'bg-emerald-500' : 'bg-stone-400'}`}>
                                    <CheckCircle2 className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className={`text-xs font-black uppercase tracking-tighter ${lessonId ? 'text-emerald-900' : 'text-stone-600'}`}>Diário de Treino</h4>
                                    <p className={`text-[8px] font-bold uppercase tracking-widest ${lessonId ? 'text-emerald-600' : 'text-stone-400'}`}>
                                        Registre sua prática agora
                                    </p>
                                </div>
                            </div>

                            <div className="flex z-10 shrink-0 pl-2">
                                <div className={`confirm-read-pdf-main px-4 py-2.5 rounded-xl shadow-md transform active:scale-95 transition-all text-center flex items-center justify-center ${lessonId ? 'bg-emerald-500 text-white' : 'bg-stone-300 text-white'}`}>
                                    <span className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap">Clique Aqui ao Estudar</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-10">
                            {/* Seção de Harmonias - Ocultar para Bateria */}
                            {chords.length > 0 && instrument !== Instrument.VOCALS && instrument !== Instrument.DRUMS && (
                                <section>
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-4 h-4 rounded bg-[#E87A2C]/10 flex items-center justify-center">
                                                <Music className="w-2.5 h-2.5 text-[#E87A2C]" />
                                            </div>
                                            <svg viewBox="0 0 150 20" className="h-4 w-32">
                                                <text x="0" y="50%" dominantBaseline="central" fill="#1C1917" fontWeight="900" fontSize="10" style={{ letterSpacing: '0.1em' }}>ESTRUTURA HARMÔNICA</text>
                                            </svg>
                                        </div>
                                        <svg viewBox="0 0 100 20" className="h-4 w-20">
                                            <text x="100%" y="50%" textAnchor="end" dominantBaseline="central" fill="#78716C" fontWeight="900" fontSize="11">{chords.length} ACORDES</text>
                                        </svg>
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
                                        <PdfTitle title="SOLOS E MELODIAS (BIMANUAL)" />
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
                                                                                <PdfIconBox key={idx} text={n.note} bgColor="bg-red-600" />
                                                                            ))}
                                                                        </div>
                                                                        <div className="h-px bg-stone-200 w-full" />
                                                                        <div className="flex flex-wrap gap-1 min-h-[20px]">
                                                                            {soloNotes.map((n, idx) => (
                                                                                <PdfIconBox key={idx} text={n.note} bgColor="bg-blue-600" />
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
                                        <PdfTitle title="CHECKLIST DE PRÁTICA" />
                                        <div className={`space-y-2 ${solos.length === 0 ? 'grid grid-cols-2 gap-4 space-y-0' : ''}`}>
                                            {exercises.map((ex, i) => (
                                                <div key={i} className="p-4 bg-white border border-stone-100 rounded-xl flex items-center gap-4 group transition-all hover:border-orange-100 shadow-sm">
                                                    <PdfIconBox text={i + 1} className="group-hover:bg-[#E87A2C]" />
                                                    <span className="text-[11px] font-black uppercase text-[#3C2415] tracking-[0.1em] flex-grow leading-snug">{ex}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Tablaturas (Ocultar para Bateria) */}
                            {instrument !== Instrument.DRUMS && tabs.length > 0 && (
                                <section className="pt-8 border-t border-stone-100">
                                    <h2 className="text-[10px] font-black text-stone-800 uppercase tracking-widest mb-4">Material Complementar / TAB</h2>
                                    <div className="flex flex-row flex-wrap gap-6">
                                        {tabs.map((tab, i) => (
                                            <div key={i} className="flex-1 min-w-[300px] bg-[#FBF6F0] p-6 rounded-2xl border border-stone-200 overflow-x-auto custom-scrollbar">
                                                {tab.title && <p className="text-[9px] font-black text-[#E87A2C] uppercase tracking-[0.2em] mb-4">{tab.title}</p>}
                                                <pre className="font-mono text-[#3C2415] text-[10px] sm:text-xs leading-relaxed tracking-wider whitespace-pre selection:bg-orange-100">
                                                    {tab.content}
                                                </pre>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}

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
                                                        <PdfScaleCircle key={ni} note={n} />
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
                                                                                <div key={partId} className={`w-5 h-5 md:w-7 md:h-7 rounded-md ${(partId === 'kick') ? 'bg-rose-500' :
                                                                                    (partId === 'snare') ? 'bg-blue-600' :
                                                                                        (partId === 'hihat') ? 'bg-orange-500' :
                                                                                            (partId === 'crash' || partId === 'crash/ride') ? 'bg-yellow-500' :
                                                                                                (partId === 'tom1') ? 'bg-emerald-500' :
                                                                                                    (partId === 'tom2') ? 'bg-emerald-600' :
                                                                                                        (partId === 'floor') ? 'bg-purple-600' : 'bg-stone-500'}`}>
                                                                                    <svg viewBox="0 0 24 24" className="w-full h-full">
                                                                                        <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central" fill="white" fontWeight="900" fontSize="12">
                                                                                            {(partId === 'kick') ? '🥁' :
                                                                                                (partId === 'snare') ? '⊚' :
                                                                                                    (partId === 'hihat') ? '×' :
                                                                                                        (partId === 'crash' || partId === 'crash/ride') ? '✳' :
                                                                                                            (partId === 'tom1') ? '◦' :
                                                                                                                (partId === 'tom2') ? '◦' :
                                                                                                                    (partId === 'floor') ? '◯' : '◦'}
                                                                                        </text>
                                                                                    </svg>
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
                                                                <div key={sIdx} className={`w-8 h-8 rounded-lg ${hand === 'R' ? 'bg-[#E87A2C]' : 'bg-[#1A110D]'} text-white shadow-sm`}>
                                                                    <svg viewBox="0 0 32 32" className="w-full h-full">
                                                                        <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central" fill="white" fontWeight="900" fontSize="14">{hand}</text>
                                                                    </svg>
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
