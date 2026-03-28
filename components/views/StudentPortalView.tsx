import React, { useState, useEffect } from 'react';
import { Student, Teacher, LessonHistory } from '../../types';
import { supabase } from '../../lib/supabase';
import { 
    Clock, 
    BookOpen, 
    Trophy, 
    Settings, 
    Play, 
    CheckCircle2, 
    ChevronRight,
    Music,
    User,
    Calendar,
    Award,
    Sparkles,
    Layout,
    Home,
    GraduationCap,
    ListChecks,
    History,
    Star,
    X,
    Maximize2,
    Eye,
    ChevronDown,
    Map
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { StudentRankingView } from './StudentRankingView';
import { RankingView } from './RankingView';
import { ChordVisualizer } from '../ChordVisualizer';
import { Instrument } from '../../types';
import { calculatePedagogicalRadar, fetchCurriculumTopics, fetchStudentCurriculumProgress, getInstrumentGroup } from '../../services/curriculumService';


interface Props {
    studentId: string;
    allStudents: Student[];
}

export const StudentPortalView: React.FC<Props> = ({ studentId, allStudents }) => {
    const { showToast } = useToast();
    const [student, setStudent] = useState<Student | null>(null);
    const [lastLesson, setLastLesson] = useState<LessonHistory | null>(null);
    const [loading, setLoading] = useState(true);
    const [isStudying, setIsStudying] = useState(false);
    const [studyTime, setStudyTime] = useState(0);
    const [activeTab, setActiveTab] = useState<'home' | 'ranking_students' | 'ranking_teachers' | 'settings'>('home');
    const [history, setHistory] = useState<LessonHistory[]>([]);
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [curriculumInfo, setCurriculumInfo] = useState<any>(null);
    const [showFullHistory, setShowFullHistory] = useState(false);
    const [selectedLesson, setSelectedLesson] = useState<LessonHistory | null>(null);

    useEffect(() => {
        const fetchStudentData = async () => {
            try {
                // 1. Fetch Student Info
                const { data: st, error: stErr } = await supabase
                    .from('mc_students')
                    .select('*')
                    .eq('id', studentId)
                    .single();
                
                if (stErr) throw stErr;
                setStudent(st);

                // 2. Fetch History
                const { data: hData, error: hDataErr } = await supabase
                    .from('mc_lesson_history')
                    .select('*')
                    .eq('student_id', studentId)
                    .order('created_at', { ascending: false });
                
                if (hData) {
                    setHistory(hData);
                    const last = hData[0] || null;
                    setLastLesson(last);
                    
                    // Auto-start timer if we have a recent lesson (within 2 hours)
                    if (last && new Date().getTime() - new Date(last.created_at).getTime() < 1000 * 60 * 60 * 2) {
                       setIsStudying(true);
                    }
                }

                // 3. Fetch Teachers (for ranking)
                const { data: tData } = await supabase.from('mc_teachers').select('*');
                if (tData) setTeachers(tData);

                if (st) {
                    const group = getInstrumentGroup(st.instrument as Instrument);
                    const allTopics = await fetchCurriculumTopics(group);
                    // Fetch progress again to be sure
                    const { data: pData } = await supabase.from('mc_student_topics').select('*').eq('student_id', studentId);
                    const progressWithTopics = (pData || []).map(p => ({
                        ...p,
                        topic: allTopics.find(t => t.id === p.topic_id)
                    }));
                    const radar = calculatePedagogicalRadar(st, allTopics, progressWithTopics);
                    setCurriculumInfo(radar);
                    console.log("Radar Aluno:", radar);
                }
            } catch (e) {
                console.error(e);
                showToast("Erro ao carregar portal.", "error");
            } finally {
                setLoading(false);
            }
        };

        fetchStudentData();
    }, [studentId]);

    // Timer Logic
    useEffect(() => {
        let interval: any;
        if (isStudying) {
            interval = setInterval(() => {
                setStudyTime(prev => prev + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isStudying]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleFinishStudy = async () => {
        setIsStudying(false);
        const minutes = Math.floor(studyTime / 60);
        
        if (minutes < 1) {
            showToast("Sessão muito curta para registrar pontos.", "info");
            setStudyTime(0);
            return;
        }

        try {
            // Update points logic (Mock simple update)
            const newPoints = (student?.points || 0) + (minutes * 2);
            await supabase.from('mc_students').update({ points: newPoints }).eq('id', studentId);
            
            showToast(`Treino concluído! +${minutes * 2} XP ganhos.`, "success");
            setStudyTime(0);
            setStudent(prev => prev ? { ...prev, points: newPoints } : null);
        } catch (e) {
            showToast("Erro ao salvar progresso.", "error");
        }
    };

    if (!student) return <div className="min-h-screen bg-[#1A110D] flex items-center justify-center text-white/20 font-black uppercase tracking-[0.5em]">Aluno não encontrado</div>;

    const renderContent = () => {
        switch (activeTab) {
            case 'ranking_students':
                return (
                    <div className="pt-10">
                        <StudentRankingView students={allStudents} />
                    </div>
                );
            case 'ranking_teachers':
                return (
                    <div className="pt-10">
                        <RankingView teachers={teachers} lessonHistory={[]} students={[]} />
                    </div>
                );
            case 'home':
            default:
                return (
                    <>
                        {/* Conteúdo Principal (Aba Home) */}
                        <div className="space-y-10 pb-20">
                            {/* Card de Aula em Destaque (Estilo Netflix/Apple) */}
                            <section className="relative group">
                                <div className="absolute -inset-1 bg-gradient-to-r from-[#E87A2C] to-orange-600 rounded-[40px] blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                                <div className="relative bg-[#2A1810] border border-white/10 rounded-[40px] p-8 shadow-2xl overflow-hidden">
                                     <div className="absolute top-0 right-0 w-32 h-32 bg-[#E87A2C]/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
                                     
                                     <div className="flex items-center justify-between mb-8">
                                         <div className="flex items-center gap-3">
                                             <div className="w-10 h-10 bg-[#E87A2C] rounded-2xl flex items-center justify-center text-[#1A110D]">
                                                 <BookOpen className="w-5 h-5" />
                                             </div>
                                             <div>
                                                 <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Sua Aula hoje</p>
                                                 <p className="text-sm font-black text-white uppercase tracking-tight">Conteúdo de Estudo</p>
                                             </div>
                                         </div>
                                         {lastLesson && (
                                             <span className="text-[10px] font-black text-[#E87A2C] uppercase px-3 py-1 bg-white/5 rounded-lg border border-white/10">
                                                 {new Date(lastLesson.lesson_date).toLocaleDateString()}
                                             </span>
                                         )}
                                     </div>

                                     {lastLesson ? (
                                         <div className="space-y-6">
                                             <h2 className="text-3xl font-black text-white uppercase tracking-tighter leading-[1.1]">
                                                 {lastLesson.objective || 'Atividade Prática de Hoje'}
                                             </h2>

                                             <div className="flex items-center gap-4 py-4 border-y border-white/5">
                                                 <div className="flex -space-x-2">
                                                     {(lastLesson.report_data?.chords || []).slice(0, 3).map((_, i) => (
                                                         <div key={i} className="w-8 h-8 rounded-full bg-[#E87A2C] border-2 border-[#1A110D] flex items-center justify-center text-[10px] font-black">C</div>
                                                     ))}
                                                 </div>
                                                 <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest leading-none">
                                                     {lastLesson.report_data?.chords?.length || 0} Harmonias • {lastLesson.report_data?.exercises?.length || 0} Metas
                                                 </p>
                                             </div>

                                             <button 
                                                 onClick={() => setSelectedLesson(lastLesson)}
                                                 className="w-full bg-white text-[#1A110D] py-5 rounded-[24px] font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                                             >
                                                 <Eye className="w-4 h-4" /> REVISAR CONTEÚDO AGORA
                                             </button>
                                         </div>
                                     ) : (
                                         <div className="py-10 text-center">
                                             <Music className="w-12 h-12 text-white/10 mx-auto mb-4" />
                                             <p className="text-white/20 font-black uppercase text-[10px] tracking-widest">Nenhuma aula disponível ainda</p>
                                         </div>
                                     )}
                                </div>
                            </section>

                            {/* Cronômetro (Mais Discreto) */}
                            <section className={`rounded-[32px] p-6 transition-all duration-500 ${isStudying ? 'bg-[#E87A2C] shadow-2xl shadow-orange-500/20' : 'bg-white/5 border border-white/10'}`}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                         <button 
                                             onClick={() => isStudying ? handleFinishStudy() : setIsStudying(true)}
                                             className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${isStudying ? 'bg-[#1A110D] text-white' : 'bg-[#E87A2C] text-white'}`}
                                         >
                                             {isStudying ? <CheckCircle2 className="w-6 h-6" /> : <Play className="w-6 h-6 fill-current" />}
                                         </button>
                                         <div>
                                             <p className={`text-[9px] font-black uppercase tracking-widest ${isStudying ? 'text-[#1A110D]/60' : 'text-white/40'}`}>
                                                 {isStudying ? 'Treino em andamento' : 'Cronômetro de Estudo'}
                                             </p>
                                             <p className={`text-2xl font-black tabular-nums ${isStudying ? 'text-[#1A110D]' : 'text-white'}`}>
                                                 {formatTime(studyTime)}
                                             </p>
                                         </div>
                                    </div>
                                    <div className={`p-4 rounded-2xl border ${isStudying ? 'bg-[#1A110D]/5 border-[#1A110D]/10' : 'bg-white/5 border-white/10'}`}>
                                         <Clock className={`w-5 h-5 ${isStudying ? 'text-[#1A110D]/40' : 'text-white/10'}`} />
                                    </div>
                                </div>
                            </section>

                            {/* Próximos Passos (Curriculum) - Estilo Map/Jornada */}
                            {curriculumInfo && (curriculumInfo.idealTopic || curriculumInfo.status !== 'ok') && (
                                <section className="space-y-6">
                                    <div className="flex items-center justify-between px-2">
                                        <h3 className="text-sm font-black uppercase tracking-widest text-white/40 flex items-center gap-2">
                                            <Map className="w-4 h-4" /> Jornada Pedagógica
                                        </h3>
                                        <span className="text-[10px] font-black text-[#E87A2C] uppercase border border-[#E87A2C]/20 px-3 py-1 rounded-full bg-[#E87A2C]/5">Nível {student.level || 'I'}</span>
                                    </div>
                                    
                                    <div className="bg-[#1A110D] border border-white/5 rounded-[40px] p-2">
                                         <div className="bg-white/5 rounded-[38px] p-6 space-y-4">
                                             {curriculumInfo.idealTopic && (
                                                 <div className="relative p-6 bg-gradient-to-br from-[#E87A2C] to-orange-600 rounded-3xl shadow-xl group">
                                                     <Star className="absolute top-4 right-4 w-12 h-12 text-white/20 group-hover:rotate-12 transition-transform" />
                                                     <p className="text-[9px] font-black text-white/60 uppercase tracking-widest mb-1">Próxima Conquista</p>
                                                     <h4 className="text-xl font-black text-white uppercase tracking-tight">{curriculumInfo.idealTopic.title}</h4>
                                                     <p className="text-[10px] font-medium text-white/80 mt-2 line-clamp-2">{curriculumInfo.idealTopic.content_text || 'Matéria teórica e prática em destaque.'}</p>
                                                 </div>
                                             )}
                                             
                                             <div className="grid grid-cols-1 gap-2">
                                                 {curriculumInfo.pendingTopics?.slice(0, 3).map((t: any) => (
                                                     <div key={t.id} className="p-4 bg-white/5 rounded-2xl flex items-center justify-between border border-white/5">
                                                         <div className="flex items-center gap-3">
                                                             <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-white/40 text-[10px] font-black">M{t.month_index}</div>
                                                             <span className="text-[10px] font-black uppercase text-white/40">{t.title}</span>
                                                         </div>
                                                         <ChevronRight className="w-4 h-4 text-white/10" />
                                                     </div>
                                                 ))}
                                             </div>
                                         </div>
                                    </div>
                                </section>
                            )}
                            
                            {/* Histórico Simplificado */}
                            <section className="space-y-6">
                                <h3 className="text-sm font-black uppercase tracking-widest text-white/40 flex items-center gap-2">
                                    <History className="w-4 h-4" /> Aulas Passadas
                                </h3>
                                <div className="space-y-3">
                                    {(showFullHistory ? history : history.slice(1, 4)).map((h, i) => (
                                        <button 
                                            key={h.id} 
                                            onClick={() => setSelectedLesson(h)}
                                            className="w-full bg-[#1A110D] border border-white/5 p-6 rounded-[32px] hover:bg-white/5 transition-all text-left flex items-center justify-between group"
                                        >
                                            <div className="flex items-center gap-5">
                                                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-[#E87A2C]/20 transition-colors">
                                                    <Calendar className="w-5 h-5 text-white/20 group-hover:text-[#E87A2C]" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-[#E87A2C] uppercase mb-1 tracking-widest">{new Date(h.lesson_date).toLocaleDateString()}</p>
                                                    <p className="text-sm font-bold uppercase text-white/70 line-clamp-1">{h.objective || 'Referência de Aula'}</p>
                                                </div>
                                            </div>
                                            <div className="w-10 h-10 rounded-full border border-white/5 flex items-center justify-center text-white/20 group-hover:text-white group-hover:border-white/20 transition-all">
                                                <ChevronRight className="w-4 h-4" />
                                            </div>
                                        </button>
                                    ))}
                                    
                                    {!showFullHistory && history.length > 4 && (
                                        <button 
                                            onClick={() => setShowFullHistory(true)}
                                            className="w-full py-6 text-[10px] font-black uppercase tracking-widest text-[#E87A2C] bg-orange-500/5 rounded-[32px] border border-orange-500/10 active:scale-[0.98] transition-all"
                                        >
                                            MOSTRAR TUDO ({history.length} AULAS)
                                        </button>
                                    )}
                                </div>
                            </section>
                        </div>
                    </>
                );
        }
    };

    return (
        <div className="min-h-screen bg-[#1A110D] text-white p-6 pb-32 animate-fade-in font-sans selection:bg-[#E87A2C] selection:text-white">
            {renderContent()}

            {/* Modal de Detalhes da Aula (Adaptado do StudentPreview) */}
            {selectedLesson && (
                <div className="fixed inset-0 z-[100] flex flex-col bg-[#1A110D] animate-in slide-in-from-bottom duration-300">
                    {/* Header do Modal */}
                    <div className="flex items-center justify-between p-6 border-b border-white/10 bg-[#1A110D] sticky top-0 z-10">
                         <div className="flex items-center gap-4">
                             <div className="w-12 h-12 bg-[#E87A2C] rounded-2xl flex items-center justify-center text-[#1A110D]">
                                 <BookOpen className="w-6 h-6" />
                             </div>
                             <div>
                                 <h2 className="text-sm font-black uppercase tracking-tighter">Detalhes da Aula</h2>
                                 <p className="text-[10px] font-bold text-[#E87A2C] uppercase tracking-widest">{new Date(selectedLesson.lesson_date).toLocaleDateString()}</p>
                             </div>
                         </div>
                         <button 
                            onClick={() => setSelectedLesson(null)}
                            className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center hover:bg-rose-500 transition-colors"
                         >
                            <X className="w-6 h-6" />
                         </button>
                    </div>

                    {/* Conteúdo do Modal (Scrollable) */}
                    <div className="flex-grow overflow-y-auto p-6 space-y-10 no-scrollbar">
                         {/* Pauta */}
                         <section>
                             <div className="flex items-center gap-2 mb-4">
                                 <span className="w-8 h-1 bg-[#E87A2C] rounded-full"></span>
                                 <p className="text-[10px] font-black text-white/40 uppercase tracking-widest leading-none">Diretriz Pedagógica</p>
                             </div>
                             <h3 className="text-3xl font-black text-white leading-tight uppercase tracking-tighter italic">
                                 "{selectedLesson.objective || 'Foco em Desenvolvimento Prático'}"
                             </h3>
                         </section>

                         {/* Harmonias e Digitações */}
                         {selectedLesson.report_data?.chords?.length > 0 && (
                             <section className="space-y-6">
                                 <div className="flex items-center justify-between">
                                     <h4 className="text-xs font-black uppercase tracking-[0.2em] text-[#E87A2C]">Estrutura Harmônica</h4>
                                     <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">{selectedLesson.report_data.chords.length} ACORDES</span>
                                 </div>
                                 <div className="grid grid-cols-1 gap-6">
                                     {selectedLesson.report_data.chords.map((chord: any, i: number) => (
                                         <div key={i} className="flex flex-col items-center">
                                             <ChordVisualizer 
                                                 instrument={student?.instrument as any} 
                                                 chordNotes={chord.notes}
                                                 root={chord.root}
                                                 type={chord.typeId}
                                                 ext={chord.extId}
                                                 bass={chord.bass}
                                                 notesWithIndices={chord.notesWithIndices}
                                                 isCustom={chord.isCustom}
                                                 isFullscreen={true} // Força uma visualização levemente maior no modal mobile
                                             />
                                         </div>
                                     ))}
                                 </div>
                             </section>
                         )}

                         {/* Metas de Prática */}
                         {selectedLesson.report_data?.exercises?.length > 0 && (
                             <section className="space-y-6">
                                 <div className="flex items-center justify-between">
                                     <h4 className="text-xs font-black uppercase tracking-[0.2em] text-[#E87A2C]">Checklist de Prática</h4>
                                     <ListChecks className="w-5 h-5 text-white/20" />
                                 </div>
                                 <div className="space-y-3">
                                     {selectedLesson.report_data.exercises.map((ex: string, i: number) => (
                                         <div key={i} className="p-6 bg-white rounded-[32px] flex items-center gap-5 shadow-xl">
                                             <div className="w-10 h-10 bg-[#1A110D] rounded-2xl flex items-center justify-center text-white text-lg font-black">{i+1}</div>
                                             <p className="text-sm font-black text-[#3C2415] uppercase leading-tight">{ex}</p>
                                         </div>
                                     ))}
                                 </div>
                             </section>
                         )}

                         {/* Materiais Extra */}
                         {selectedLesson.report_data?.tabs?.length > 0 && (
                             <section className="space-y-6">
                                 <div className="flex items-center justify-between">
                                     <h4 className="text-xs font-black uppercase tracking-[0.2em] text-[#E87A2C]">Tablaturas e Apoio</h4>
                                     <Layout className="w-5 h-5 text-white/20" />
                                 </div>
                                 <div className="space-y-4">
                                     {selectedLesson.report_data.tabs.map((tab: any, i: number) => (
                                         <div key={i} className="bg-white p-6 rounded-[32px] overflow-x-auto no-scrollbar border-b-8 border-stone-200 shadow-xl">
                                             <p className="text-[10px] font-black text-[#E87A2C] uppercase tracking-widest mb-4">{tab.title || 'Tablatura'}</p>
                                             <pre className="font-mono text-[#3C2415] text-[12px] leading-relaxed tracking-wider whitespace-pre">
                                                 {tab.content}
                                             </pre>
                                         </div>
                                     ))}
                                 </div>
                             </section>
                         )}

                         <div className="py-10 text-center opacity-20">
                             <p className="text-[10px] font-black uppercase tracking-[0.4em]">MusiClass Digital Ecosystem</p>
                         </div>
                    </div>

                    {/* Footer fixo do Modal */}
                    <div className="p-6 bg-[#1A110D] border-t border-white/10">
                         <button 
                            onClick={() => setSelectedLesson(null)}
                            className="w-full bg-[#E87A2C] text-white py-5 rounded-[24px] font-black text-xs uppercase tracking-[0.2em] active:scale-[0.98] transition-all"
                         >
                            CONCLUÍDO
                         </button>
                    </div>
                </div>
            )}

            {/* Rodapé Navbar Mobile */}
            <nav className="fixed bottom-6 left-6 right-6 bg-white/10 backdrop-blur-xl border border-white/10 rounded-[32px] p-2 flex justify-around items-center shadow-2xl z-50">
                <button 
                  onClick={() => setActiveTab('home')}
                  className={`p-4 rounded-2xl flex-1 flex justify-center transition-all ${activeTab === 'home' ? 'bg-[#E87A2C] text-white' : 'text-white/40'}`}
                >
                  <Home className="w-6 h-6" />
                </button>
                <button 
                  onClick={() => setActiveTab('ranking_students')}
                  className={`p-4 rounded-2xl flex-1 flex justify-center transition-all ${activeTab === 'ranking_students' ? 'bg-[#E87A2C] text-white' : 'text-white/40'}`}
                >
                  <Trophy className="w-6 h-6" />
                </button>
                <button 
                  onClick={() => setActiveTab('ranking_teachers')}
                  className={`p-4 rounded-2xl flex-1 flex justify-center transition-all ${activeTab === 'ranking_teachers' ? 'bg-[#E87A2C] text-white' : 'text-white/40'}`}
                >
                  <Sparkles className="w-6 h-6" />
                </button>
                <button 
                  onClick={() => setActiveTab('settings')}
                  className={`p-4 rounded-2xl flex-1 flex justify-center transition-all ${activeTab === 'settings' ? 'bg-[#E87A2C] text-white' : 'text-white/40'}`}
                >
                  <GraduationCap className="w-6 h-6" />
                </button>
            </nav>
        </div>
    );
};
