import { supabase } from "../../lib/supabase";

import { Bell } from 'lucide-react';
import React from 'react';
import {
    Zap, Settings2, MousePointer2, Trash2, Layout, X,
    ListTodo, Plus, Music, PlusCircle, Disc, Sparkles, Upload, ScrollText, ClipboardList, Check, Send
} from 'lucide-react';
import { Instrument, Student, Teacher } from '../../types';
import { ROOTS, CHORD_TYPES, SCALES } from '../../constants';
import { ChordVisualizer } from '../ChordVisualizer';
import { SoloEditor } from '../SoloEditor';
import { TabEditor } from '../TabEditor';
import { DrumsStudio } from '../DrumsStudio';
import { getPedagogicalSuggestion } from '../../services/geminiService';
import { PedagogicalRadar } from '../PedagogicalRadar';
import {
    fetchCurriculumTopics,
    fetchStudentCurriculumProgress,
    calculatePedagogicalRadar,
    getInstrumentGroup,
    applyTopicToStudent
} from '../../services/curriculumService';
import { CurriculumTopic, StudentTopicProgress } from '../../types';
import { useToast } from '../../context/ToastContext';

interface LessonEditorViewProps {
    selectedStudent: Student;
    currentUser: Teacher;
    activeTab: string;
    setActiveTab: (tab: string) => void;
    // Lesson state & handlers from hook
    currentChords: any[];
    setCurrentChords: (chords: any[]) => void;
    currentScales: any[];
    setCurrentScales: (scales: any[]) => void;
    currentTabs: any[];
    setCurrentTabs: (tabs: any[]) => void;
    currentSolos: any[];
    setCurrentSolos: (solos: any[]) => void;
    exercises: string[];
    setExercises: (ex: string[]) => void;
    newExercise: string;
    setNewExercise: (val: string) => void;
    currentObjective: string;
    setCurrentObjective: (val: string) => void;
    drumsData: any;
    setDrumsData: (data: any) => void;
    recordings: any[];
    setRecordings: (recs: any[]) => void;
    isRecording: boolean;
    // Actions
    onAddChord: () => void;
    onAddScale: () => void;
    onAddTab: () => void;
    onAddSolo: () => void;
    onUpdateTab: (id: string, title: string, content: string) => void;
    onUpdateSolo: (id: string, title: string, notes: string[]) => void;
    onRemoveTab: (id: string) => void;
    onAddExercise: (e: React.KeyboardEvent) => void;
    onRemoveExercise: (index: number) => void;
    onStartRecording: () => void;
    onStopRecording: () => void;
    onDrumRecord: (blob: Blob, title: string) => void;
    onGenerateReport: () => void;
    setIsManualChordOpen: (val: boolean) => void;
    // UI Selection State
    showAdvancedChord: boolean;
    setShowAdvancedChord: (val: boolean) => void;
    selRoot: string;
    setSelRoot: (val: string) => void;
    selType: string;
    setSelType: (val: string) => void;
    selScaleRoot: string;
    setSelScaleRoot: (val: string) => void;
    selScaleId: string;
    setSelScaleId: (val: string) => void;
    selBass: string;
    setSelBass: (val: string) => void;
    // New Version 7 Props
    onSaveTemplate: () => void;
    onToggleGallery: () => void;
    onToggleCurriculum: () => void;
    onAudioUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onSendToPortal?: () => Promise<void>;
    onLoadLastLesson?: () => void;
    onResetLesson?: () => void;
}

export const LessonEditorView: React.FC<LessonEditorViewProps> = ({
    selectedStudent,
    currentUser,
    setActiveTab,
    currentChords,
    setCurrentChords,
    currentScales,
    setCurrentScales,
    currentTabs,
    setCurrentTabs,
    currentSolos,
    setCurrentSolos,
    exercises,
    setExercises,
    newExercise,
    setNewExercise,
    currentObjective,
    setCurrentObjective,
    drumsData,
    setDrumsData,
    recordings,
    setRecordings,
    isRecording,
    onAddChord,
    onAddScale,
    onAddTab,
    onAddSolo,
    onUpdateTab,
    onUpdateSolo,
    onRemoveTab,
    onAddExercise,
    onRemoveExercise,
    onStartRecording,
    onStopRecording,
    onDrumRecord,
    onGenerateReport,
    setIsManualChordOpen,
    showAdvancedChord,
    setShowAdvancedChord,
    selRoot,
    setSelRoot,
    selType,
    setSelType,
    selScaleRoot,
    setSelScaleRoot,
    selScaleId,
    setSelScaleId,
    selBass,
    setSelBass,
    onSaveTemplate,
    onToggleGallery,
    onToggleCurriculum,
    onAudioUpload,
    onSendToPortal,
    onLoadLastLesson,
    onResetLesson
}) => {
    const { showToast } = useToast();
    const [isAILoading, setIsAILoading] = React.useState(false);
    const [isSending, setIsSending] = React.useState(false);

    const [examRequests, setExamRequests] = React.useState<any[]>([]);

    React.useEffect(() => {
        if (currentUser && selectedStudent) {
            supabase.from('mc_exam_requests')
                .select('*, mc_curriculum_topics(title)')
                .eq('student_id', selectedStudent.id)
                .eq('status', 'pending')
                .then(({ data }) => setExamRequests(data || []));
        }
    }, [currentUser, selectedStudent]);

    const handleApproveExam = async (req: any) => {
        try {
            // Criar token de quiz para o aluno
            const token = Math.random().toString(36).substring(2, 15);
            const { error: updateError } = await supabase.from('mc_student_topics').upsert({
                student_id: selectedStudent.id,
                topic_id: req.topic_id,
                status: 'quiz_authorized',
                qr_code_token: token
            });

            if (updateError) throw updateError;

            // Marcar solicitação como aprovada
            await supabase.from('mc_exam_requests').update({ status: 'approved' }).eq('id', req.id);

            // Notificar Aluno
            await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-push-notifications`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    student_id: selectedStudent.id,
                    title: '✅ Prova Liberada!',
                    body: `Sua prova de ${req.mc_curriculum_topics?.title} foi autorizada. Boa sorte!`,
                    url: `/?portal_id=${selectedStudent.id}`
                })
            });

            showToast("Prova liberada e aluno notificado!", "success");
            setExamRequests(examRequests.filter(r => r.id !== req.id));
        } catch (e) {
            showToast("Erro ao liberar prova.", "error");
        }
    };
    const handleSendToPortal = async () => {
        if (!selectedStudent || selectedStudent.id === 'temp') return;
        setIsSending(true);
        try {
            if (onSendToPortal) {
                await onSendToPortal();
                
                // Disparar Notificação Push via Supabase Edge Function
                try {
                    await fetch('https://wayigtlilhvutbfvxgae.supabase.co/functions/v1/send-push-notifications', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': 'Bearer sb_publishable_YP9wwSLwb5yIl6mX9ebAmg_IB3xDd4L'
                        },
                        body: JSON.stringify({
                            type: 'new_lesson',
                            studentId: selectedStudent.id,
                            title: 'Nova Aula Disponível! 🎸',
                            body: `Sua nova ficha de estudos já está no portal. Confira o que o professor preparou!`
                        })
                    });
                } catch (pushErr) {
                    console.error("Erro ao disparar notificação push:", pushErr);
                }

                showToast("Ficha enviada ao portal e aluno notificado!", "success");
            } else {
                // Fallback direct save if context doesn't provide it
                onGenerateReport(); // PDF fallback
            }
        } catch (e) {
            showToast("Erro ao enviar aula.", "error");
        } finally {
            setIsSending(false);
        }
    };

    const handleGenerateAISuggestion = async () => {
        if (!currentObjective.trim()) {
            showToast("Por favor, descreva o tema da aula ou objetivo na pauta abaixo para que a IA possa gerar sugestões.", "info");
            return;
        }

        setIsAILoading(true);
        try {
            const result = await getPedagogicalSuggestion(
                selectedStudent.instrument,
                selectedStudent.level,
                currentObjective
            );
            setCurrentObjective(currentObjective + "\n\n--- SUGESTÕES IA MUSICLASS ---\n" + result);
        } catch (e) {
            showToast("Erro ao gerar sugestões.", "error");
        } finally {
            setIsAILoading(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-12 animate-fade-in pb-32">

            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <button onClick={() => setActiveTab('students')} className="text-[#3C2415]/40 hover:text-[#E87A2C] text-[10px] font-black uppercase tracking-widest mb-2 transition-colors">← Voltar aos alunos</button>
                    <h2 className="text-4xl font-black text-[#3C2415] tracking-tighter uppercase leading-none">
                        {selectedStudent.id === 'temp' ? 'Montando Modelo de Aula' : `Plano de Aula: ${selectedStudent.name}`}
                    </h2>
                </div>
                <div className="flex items-center gap-3 flex-wrap justify-end">
                    {onResetLesson && (
                        <button onClick={() => {
                            if (confirm("Tem certeza que deseja zerar a ficha atual? Todo o conteúdo não salvo será perdido.")) {
                                onResetLesson();
                            }
                        }} className="bg-rose-50 text-rose-900 px-6 py-3 rounded-2xl flex items-center gap-4 border border-rose-100 hover:bg-rose-100 hover:text-rose-900 transition-all shadow-sm active:scale-95 cursor-pointer">
                            <Trash2 className="w-5 h-5 text-rose-500" />
                            <span className="text-xs font-black uppercase tracking-widest whitespace-nowrap">LIMPAR FICHA</span>
                        </button>
                    )}
                    {onLoadLastLesson && selectedStudent.id !== 'temp' && (
                        <button onClick={onLoadLastLesson} className="bg-purple-50 text-purple-900 px-6 py-3 rounded-2xl flex items-center gap-4 border border-purple-100 hover:bg-purple-100 hover:text-purple-900 transition-all shadow-sm active:scale-95 cursor-pointer">
                            <ScrollText className="w-5 h-5 text-purple-500" />
                            <span className="text-xs font-black uppercase tracking-widest whitespace-nowrap">CARREGAR ÚLTIMA AULA</span>
                        </button>
                    )}
                    <button onClick={onToggleGallery} className="bg-[#FBF6F0] text-[#3C2415] px-6 py-3 rounded-2xl flex items-center gap-4 border border-[#3C2415]/5 hover:bg-[#E87A2C] hover:text-white transition-all">
                        <Layout className="w-5 h-5" />
                        <span className="text-xs font-black uppercase tracking-widest">Galeria de Aulas</span>
                    </button>
                    <div className="bg-[#1A110D] px-6 py-3 rounded-2xl flex items-center gap-4 shadow-xl">
                        <div className="w-8 h-8 bg-[#E87A2C] rounded-lg flex items-center justify-center font-black text-white">{selectedStudent.id === 'temp' ? '?' : selectedStudent.name.charAt(0)}</div>
                        <p className="text-sm font-black text-white uppercase tracking-widest">{selectedStudent.id === 'temp' ? 'Rascunho' : selectedStudent.instrument}</p>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                <div className="lg:col-span-8 space-y-12">
                        {/* Solicitações de Prova Pendentes */}
                        {examRequests.length > 0 && (
                            <section className="bg-indigo-50 border-2 border-indigo-100 rounded-[48px] p-8 space-y-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-indigo-500 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-500/30">
                                        <Bell className="w-6 h-6 animate-swing" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-indigo-900 uppercase tracking-tighter">Solicitações de Prova</h3>
                                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mt-1">{examRequests.length} Estudo(s) Concluído(s)</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {examRequests.map(req => (
                                        <div key={req.id} className="bg-white p-6 rounded-[32px] shadow-sm border border-indigo-100 flex items-center justify-between group">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-500 font-black text-xs">
                                                    EX
                                                </div>
                                                <div>
                                                    <p className="font-black text-indigo-900 uppercase tracking-tight text-sm">{req.mc_curriculum_topics?.title}</p>
                                                    <p className="text-[9px] font-bold text-indigo-300 uppercase mt-1 tracking-widest">Aguardando autorização</p>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => handleApproveExam(req)}
                                                className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black text-[9px] uppercase tracking-[0.2em] shadow-lg shadow-indigo-600/20 hover:scale-[1.05] active:scale-95 transition-all flex items-center gap-2"
                                            >
                                                <Check className="w-4 h-4" /> Liberar Prova
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}
                    {/* Harmonias */}
                    {selectedStudent?.instrument !== Instrument.VOCALS && selectedStudent?.instrument !== Instrument.DRUMS && (
                        <section className="bg-white rounded-[48px] p-10 border border-[#3C2415]/5 shadow-sm">
                            <div className="flex items-center justify-between mb-10">
                                <h3 className="text-xl font-black text-[#3C2415] uppercase tracking-tighter flex items-center gap-3"><Zap className="text-[#E87A2C]" /> Harmonias e Acordes</h3>
                                <button onClick={() => setShowAdvancedChord(!showAdvancedChord)} className="p-3 bg-[#FBF6F0] rounded-2xl text-[#3C2415]/40 hover:text-[#E87A2C] transition-all flex items-center gap-2 text-[10px] font-black uppercase"><Settings2 className="w-4 h-4" /> Avançado</button>
                            </div>
                            <div className="flex flex-wrap gap-2 mb-8">
                                {ROOTS.filter(r => showAdvancedChord || (!r.includes('#') && !r.includes('b'))).map(r => (
                                    <button key={r} onClick={() => setSelRoot(r)} className={`px-5 py-3 rounded-xl font-black text-sm transition-all ${selRoot === r ? 'bg-[#E87A2C] text-white shadow-lg scale-110' : 'bg-[#FBF6F0] text-[#3C2415]/40 hover:bg-stone-100'}`}>{r}</button>
                                ))}
                            </div>
                            <div className="flex flex-wrap gap-2 mb-10">
                                {CHORD_TYPES.filter(t => showAdvancedChord || (t.id === 'maj' || t.id === 'min')).map(t => (
                                    <button key={t.id} onClick={() => setSelType(t.id)} className={`px-6 py-3 rounded-xl font-black text-xs transition-all ${selType === t.id ? 'bg-[#1A110D] text-white' : 'bg-[#FBF6F0] text-[#3C2415]/30'}`}>{t.name}</button>
                                ))}
                            </div>

                            {showAdvancedChord && (
                                <div className="mb-10 p-6 bg-stone-50 rounded-3xl border border-stone-100">
                                    <h4 className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-4">Selecione o Baixo (Opcional)</h4>
                                    <div className="flex flex-wrap gap-2">
                                        <button onClick={() => setSelBass('none')} className={`px-4 py-2 rounded-xl font-black text-[10px] ${selBass === 'none' ? 'bg-[#1A110D] text-white' : 'bg-white text-stone-300'}`}>Padrão</button>
                                        {ROOTS.map(r => (
                                            <button key={r} onClick={() => setSelBass(r)} className={`px-4 py-2 rounded-xl font-black text-[10px] transition-all ${selBass === r ? 'bg-[#E87A2C] text-white' : 'bg-white text-stone-300'}`}>{r}</button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <button onClick={onAddChord} className="w-full bg-[#E87A2C] text-white py-6 rounded-[32px] font-black text-lg hover:bg-orange-600 transition-all flex items-center justify-center gap-3 shadow-xl shadow-orange-500/10">ADICIONAR ACORDE {selRoot}{selType !== 'maj' ? selType : ''}{selBass !== 'none' ? `/${selBass}` : ''}</button>
                                <button onClick={() => setIsManualChordOpen(true)} className="w-full bg-[#1A110D] text-white py-6 rounded-[32px] font-black text-xs uppercase tracking-widest hover:bg-stone-800 transition-all flex items-center justify-center gap-3 shadow-lg"><MousePointer2 className="w-4 h-4" /> Criar Manualmente</button>
                            </div>

                            {currentChords.length > 0 && (
                                <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    {currentChords.map((c, i) => (
                                        <div key={i} className="relative group">
                                            <ChordVisualizer
                                                instrument={selectedStudent.instrument}
                                                chordNotes={c.notes}
                                                root={c.root}
                                                type={c.typeId}
                                                ext={c.extId}
                                                bass={c.bass}
                                                notesWithIndices={c.notesWithIndices}
                                                isCustom={c.isCustom}
                                            />
                                            <button onClick={() => setCurrentChords(currentChords.filter((_, idx) => idx !== i))} className="absolute top-4 right-4 bg-[#1A110D] text-white p-3 rounded-full shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-5 h-5" /></button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>
                    )}

                    {/* Escalas */}
                    {selectedStudent?.instrument !== Instrument.VOCALS && selectedStudent?.instrument !== Instrument.DRUMS && (
                        <section className="bg-white rounded-[48px] p-10 border border-[#3C2415]/5 shadow-sm">
                            <h3 className="text-xl font-black text-[#3C2415] uppercase tracking-tighter flex items-center gap-3 mb-10"><Layout className="text-[#E87A2C]" /> Campo Harmônico / Escalas</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                                <div className="flex flex-wrap gap-2">
                                    {ROOTS.filter(r => !r.includes('#') && !r.includes('b')).map(r => (
                                        <button key={r} onClick={() => setSelScaleRoot(r)} className={`w-12 h-12 rounded-2xl font-black ${selScaleRoot === r ? 'bg-[#E87A2C] text-white shadow-lg scale-110' : 'bg-[#FBF6F0] text-[#3C2415]/40'}`}>{r}</button>
                                    ))}
                                </div>
                                <select value={selScaleId} onChange={(e) => setSelScaleId(e.target.value)} className="w-full bg-[#FBF6F0] border-none rounded-2xl px-8 py-4 font-bold text-[#3C2415] focus:ring-2 focus:ring-orange-500">
                                    {SCALES.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>
                            <button onClick={onAddScale} className="w-full bg-[#1A110D] text-white py-6 rounded-3xl font-black text-lg hover:bg-[#3C2415] mb-10">ADICIONAR ESCALA</button>

                            <div className="space-y-4">
                                {currentScales.map((s, i) => (
                                    <div key={i} className="bg-[#FBF6F0] p-6 rounded-3xl border border-[#3C2415]/5">
                                        <div className="flex justify-between items-center mb-4">
                                            <span className="font-black text-lg uppercase tracking-tight">{s.root} {s.name}</span>
                                            <button onClick={() => setCurrentScales(currentScales.filter((_, idx) => idx !== i))} className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl"><Trash2 className="w-5 h-5" /></button>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {s.notes.map((n: string, ni: number) => (
                                                <span key={ni} className="w-10 h-10 bg-white border border-[#3C2415]/10 rounded-xl flex items-center justify-center font-black text-[#3C2415] text-xs shadow-sm">{n}</span>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Exercícios */}
                    <section className="bg-white rounded-[48px] p-10 border border-[#3C2415]/5 shadow-sm">
                        <h3 className="text-xl font-black text-[#3C2415] uppercase tracking-tighter flex items-center gap-3 mb-10"><ListTodo className="text-[#E87A2C]" /> Campo de Exercícios</h3>
                        <div className="relative mb-8">
                            <input
                                value={newExercise}
                                onChange={(e) => setNewExercise(e.target.value)}
                                onKeyDown={onAddExercise}
                                placeholder="Descreva um exercício e aperte Enter..."
                                className="w-full bg-[#FBF6F0] border-none rounded-[32px] px-8 py-5 font-bold"
                            />
                            <button onClick={() => { if (newExercise) { setExercises([...exercises, newExercise]); setNewExercise(''); } }} className="absolute right-4 top-1/2 -translate-y-1/2 bg-[#1A110D] text-white p-3 rounded-2xl shadow-xl"><Plus className="w-4 h-4" /></button>
                        </div>
                        <div className="space-y-3">
                            {exercises.map((ex, i) => (
                                <div key={i} className="flex items-center justify-between p-5 bg-[#FBF6F0] rounded-3xl group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-8 h-8 bg-white border border-stone-200 rounded-xl flex items-center justify-center font-black text-[10px] text-[#E87A2C]">{i + 1}</div>
                                        <span className="font-bold text-[#3C2415]">{ex}</span>
                                    </div>
                                    <button onClick={() => onRemoveExercise(i)} className="text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-4 h-4" /></button>
                                </div>
                            ))}
                            {exercises.length === 0 && <div className="py-10 text-center opacity-20 font-black uppercase text-xs tracking-widest">Nenhum exercício listado</div>}
                        </div>
                    </section>

                    {/* Ditador de Solos Dinâmico (Bateria) */}
                    {selectedStudent?.instrument === Instrument.DRUMS && (
                        <DrumsStudio
                            initialRhythms={drumsData.rhythms}
                            initialRudiments={drumsData.rudiments}
                            initialPositions={drumsData.positions}
                            onChange={(data) => setDrumsData(data)}
                            onRecordLoop={onDrumRecord}
                        />
                    )}

                    {/* Ditador de Solos Dinâmico (Melódico) */}
                    {selectedStudent?.instrument !== Instrument.VOCALS && selectedStudent?.instrument !== Instrument.DRUMS && (
                        <section className="space-y-8">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-xl font-black text-[#3C2415] uppercase tracking-tighter flex items-center gap-3"><Music className="text-[#E87A2C]" /> Ditador de Melodias</h3>
                                <button onClick={onAddSolo} className="px-6 py-3 bg-[#1A110D] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-[#3C2415] transition-all"><Plus className="w-4 h-4" /> Novo Trecho</button>
                            </div>
                            {currentSolos.map(solo => (
                                <SoloEditor
                                    key={solo.id}
                                    id={solo.id}
                                    title={solo.title}
                                    notes={solo.notes}
                                    instrument={selectedStudent.instrument}
                                    onUpdate={(t, n) => onUpdateSolo(solo.id, t, n)}
                                    onRemove={() => setCurrentSolos(currentSolos.filter(s => s.id !== solo.id))}
                                />
                            ))}
                            {currentSolos.length === 0 && (
                                <button onClick={onAddSolo} className="w-full py-16 border-2 border-dashed border-[#E87A2C]/20 rounded-[48px] text-[#E87A2C]/40 hover:text-[#E87A2C] hover:bg-orange-50/30 transition-all flex flex-col items-center gap-4 group">
                                    <Music className="w-12 h-12 opacity-20 group-hover:opacity-100 transition-opacity" />
                                    <span className="font-black uppercase tracking-[0.3em] text-xs">Criar Ditado de Solo</span>
                                </button>
                            )}
                        </section>
                    )}

                    {/* Tablaturas */}
                    {selectedStudent?.instrument !== Instrument.DRUMS && (
                        <section className="space-y-6">
                            {currentTabs.map(tab => (
                                <div key={tab.id} className="relative">
                                    <TabEditor title={tab.title} onTitleChange={(t) => onUpdateTab(tab.id, t, tab.content)} value={tab.content} onChange={(c) => onUpdateTab(tab.id, tab.title, c)} />
                                    <button onClick={() => onRemoveTab(tab.id)} className="absolute top-6 right-6 text-rose-500 hover:text-rose-700"><Trash2 className="w-5 h-5" /></button>
                                </div>
                            ))}
                            <button onClick={onAddTab} className="w-full py-10 border-2 border-dashed border-stone-200 rounded-[48px] text-stone-300 font-black flex items-center justify-center gap-3 hover:bg-stone-50 transition-all">
                                <PlusCircle className="w-6 h-6" /> ADICIONAR TABLATURA / RIFF
                            </button>
                        </section>
                    )}

                    {/* MusiClass Studio */}
                    <section className="bg-[#1A110D] rounded-[48px] p-10 shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/5 rounded-full -mr-32 -mt-32 animate-pulse" />
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-10">
                                <div>
                                    <h3 className="text-xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
                                        <Disc className={`w-6 h-6 ${isRecording ? 'text-red-500 animate-ping' : 'text-[#E87A2C]'}`} />
                                        MusiClass Studio
                                    </h3>
                                    <p className="text-[9px] font-bold text-stone-500 uppercase tracking-widest mt-1">Grave guias de treino para o aluno</p>
                                </div>
                            </div>

                            <div className="flex flex-col items-center py-6 border-b border-white/5 mb-8">
                                <div className="flex gap-4">
                                    <button
                                        onClick={isRecording ? onStopRecording : onStartRecording}
                                        className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-500 shadow-2xl ${isRecording ? 'bg-red-600 scale-110 shadow-red-500/20' : 'bg-white hover:bg-[#E87A2C] group/btn'}`}
                                    >
                                        {isRecording ? (
                                            <div className="w-6 h-6 bg-white rounded-sm animate-pulse" />
                                        ) : (
                                            <Plus className="w-8 h-8 text-[#1A110D] group-hover:text-white transition-colors" />
                                        )}
                                    </button>
                                    <label className="w-20 h-20 rounded-full bg-white/5 border-2 border-dashed border-white/20 flex flex-col items-center justify-center cursor-pointer hover:bg-white/10 hover:border-white/40 transition-all gap-1">
                                        <Upload className="w-6 h-6 text-stone-500" />
                                        <span className="text-[8px] font-black uppercase text-stone-500 tracking-tighter">Upload</span>
                                        <input type="file" onChange={onAudioUpload} accept="audio/*" className="hidden" />
                                    </label>
                                </div>
                                <p className="mt-4 text-[10px] font-black text-stone-400 uppercase tracking-[0.3em]">
                                    {isRecording ? 'Gravando...' : 'Gravar ou Subir Áudio'}
                                </p>
                            </div>

                            <div className="space-y-4">
                                {recordings.map((rec, idx) => (
                                    <div key={rec.id} className="bg-white/5 p-6 rounded-3xl border border-white/10 flex flex-col gap-4 group/item">
                                        <div className="flex items-center justify-between">
                                            <input
                                                value={rec.title}
                                                onChange={(e) => {
                                                    const newRecs = [...recordings];
                                                    newRecs[idx].title = e.target.value;
                                                    setRecordings(newRecs);
                                                }}
                                                className="bg-transparent border-none text-white font-black uppercase text-xs tracking-widest focus:ring-0 w-full"
                                            />
                                            <button onClick={() => setRecordings(recordings.filter((_, i) => i !== idx))} className="text-stone-600 hover:text-rose-500 transition-colors opacity-0 group-hover/item:opacity-100"><Trash2 className="w-4 h-4" /></button>
                                        </div>
                                        <audio src={rec.url} controls className="w-full h-10 opacity-60 hover:opacity-100 transition-opacity" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                </div>

                {/* Sidebar do Editor */}
                <div className="lg:col-span-4 space-y-8">
                    <section className="bg-white p-10 rounded-[48px] border border-[#3C2415]/5 shadow-sm sticky top-12">
                        <div className="space-y-10">
                            <div>
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-[10px] font-black text-[#E87A2C] uppercase tracking-[0.3em] flex items-center gap-2">Pauta Pedagógica</h3>
                                    <button
                                        onClick={handleGenerateAISuggestion}
                                        disabled={isAILoading}
                                        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase transition-all ${isAILoading ? 'bg-orange-100 text-orange-400' : 'bg-orange-50 text-[#E87A2C] hover:bg-[#E87A2C] hover:text-white'}`}
                                    >
                                        <Sparkles className={`w-3 h-3 ${isAILoading ? 'animate-spin' : ''}`} />
                                        {isAILoading ? 'Pensando...' : 'Sugestões IA'}
                                    </button>
                                </div>
                                <textarea value={currentObjective} onChange={(e) => setCurrentObjective(e.target.value)} className="w-full bg-[#FBF6F0] border-none rounded-[32px] p-8 h-60 text-sm font-medium focus:ring-2 focus:ring-[#E87A2C]" placeholder="Descreva os objetivos da aula..." />
                            </div>
                            <button onClick={onSaveTemplate} className="w-full bg-[#FBF6F0] text-[#3C2415] py-5 rounded-[24px] font-black text-[10px] uppercase tracking-widest border border-[#3C2415]/10 hover:bg-white transition-all flex items-center justify-center gap-3">
                                <PlusCircle className="w-4 h-4" /> Salvar como Modelo
                            </button>
                            {selectedStudent.id !== 'temp' && (
                                <button 
                                    onClick={handleSendToPortal} 
                                    disabled={isSending}
                                    className={`w-full bg-[#1A110D] text-white py-6 rounded-[32px] font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-2xl active:scale-95 ${isSending ? 'opacity-50' : 'hover:bg-emerald-600'}`}
                                >
                                    {isSending ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Send className="w-4 h-4" />}
                                    NOTIFICAR E ENVIAR AO PORTAL
                                </button>
                            )}
                            {selectedStudent.id !== 'temp' ? (
                                <button onClick={onGenerateReport} className="w-full bg-white text-[#E87A2C] border-2 border-[#E87A2C]/20 py-5 rounded-[32px] font-black text-[10px] uppercase tracking-widest hover:bg-orange-50 transition-all flex items-center justify-center gap-3">
                                    <ClipboardList className="w-4 h-4" />
                                    Gerar PDF de Segurança
                                </button>
                            ) : (
                                <p className="text-[10px] font-bold text-stone-400 text-center uppercase tracking-widest px-4">Selecione um aluno para gerar PDFs ou relatórios finais</p>
                            )}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};
