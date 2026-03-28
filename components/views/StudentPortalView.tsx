import React, { useState, useEffect } from 'react';
import { BellRing } from 'lucide-react';
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
import { Toolbox } from '../Toolbox';
import { PdfIconBox } from '../PdfUtils';
import { Palette, Activity, ChevronLeft, Send, Headphones } from 'lucide-react';

// Service para notificações (Courier)
const sendCourierNotification = async (studentName: string, studentId: string, type: 'lesson' | 'reminder') => {
    try {
        // O usuário mencionou 'conorg' ou algo assim, provavelmente Courier (courier.com)
        // Como não temos a API KEY configurada em segredo, deixamos a estrutura pronta
        console.log(`[Courier] Enviando notificação ${type} para ${studentName}`);
        // await fetch('https://api.courier.com/send', { ... });
    } catch (e) {
        console.error("Erro ao enviar notificação", e);
    }
};


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
    const [activeTab, setActiveTab] = useState<'home' | 'ranking_students' | 'ranking_teachers' | 'curriculum' | 'tools' | 'settings'>('home');
    const [studyHistory, setStudyHistory] = useState<Record<string, number>>({}); // { '2023-10-27': 45 }
    const [progressToday, setProgressToday] = useState<{ minutes: number, done: boolean }>({ minutes: 0, done: false });
    const [pushStatus, setPushStatus] = useState<"default" | "granted" | "denied">("default");
    const [history, setHistory] = useState<LessonHistory[]>([]);
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [curriculumInfo, setCurriculumInfo] = useState<any>(null);
    const [showFullHistory, setShowFullHistory] = useState(false);
    const [selectedLesson, setSelectedLesson] = useState<LessonHistory | null>(null);

    // Push Subscription Logic
    const subscribeToPush = async () => {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            showToast("Seu navegador não suporta notificações natias.", "error");
            return;
        }

        try {
            const registration = await navigator.serviceWorker.register('/sw.js');
            console.log('SW Registered:', registration);

            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: 'x1ZC1S07UyncvXoUleJTlmMMgVVeT0J/nnDfKnILQiM='
            });

            // Salvar no Supabase
            const { error } = await supabase.from('push_subscriptions').upsert({
                student_id: studentId,
                subscription_json: subscription,
                alias: `${navigator.platform} - ${new Date().toLocaleDateString()}`
            });

            if (error) throw error;
            showToast("Notificações ativadas com sucesso!", "success");
        } catch (e) {
            console.error("Erro ao assinar push:", e);
            showToast("Erro ao ativar notificações. Verifique as permissões.", "error");
        }
    };

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
    useEffect(() => {
        if ("Notification" in window) {
            setPushStatus(Notification.permission as any);
            if (Notification.permission === "default") {
                setTimeout(subscribeToPush, 3000);
            }
        }
    }, []);
        };

        fetchStudentData();

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
        const minutes = Math.ceil(studyTime / 60);
        
        if (minutes < 1 && studyTime > 10) {
             showToast("Sessão muito curta para registrar pontos.", "info");
             setStudyTime(0);
             return;
        }

        try {
            const today = new Date().toISOString().split('T')[0];
            const currentDayMinutes = (studyHistory[today] || 0) + minutes;
            const newPoints = (student?.points || 0) + (minutes * 2);
            
            await supabase.from('mc_students').update({ 
                points: newPoints,
                last_study_date: today,
                last_study_minutes: currentDayMinutes
            }).eq('id', studentId);
            
            setStudyHistory(prev => ({ ...prev, [today]: currentDayMinutes }));
            setProgressToday({ minutes: currentDayMinutes, done: true });
            showToast(`Treino concluído! +${minutes * 2} XP ganhos.`, "success");
            setStudyTime(0);
            setStudent(prev => prev ? { ...prev, points: newPoints } : null);
            setSelectedLesson(null);
        } catch (e) {
            showToast("Erro ao salvar progresso.", "error");
        }
    };

    if (!student) return <div className="min-h-screen bg-[#1A110D] flex items-center justify-center text-white/20 font-black uppercase tracking-[0.5em]">Aluno não encontrado</div>;

    const renderContent = () => {
        switch (activeTab) {
            case 'ranking_students':
                return (
                    <div className="pt-10 space-y-8">
                         <div className="flex items-center gap-4">
                             <div className="w-12 h-12 bg-yellow-500 rounded-2xl flex items-center justify-center text-white">
                                 <Trophy className="w-6 h-6" />
                             </div>
                             <div>
                                 <h2 className="text-xl font-black uppercase tracking-tighter">Ranking de Alunos</h2>
                                 <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Os melhores da semana</p>
                             </div>
                         </div>
                        <StudentRankingView students={allStudents} />
                    </div>
                );
            case 'ranking_teachers':
                return (
                    <div className="pt-10">
                        <RankingView teachers={teachers} lessonHistory={[]} students={[]} />
                    </div>
                );
            case 'tools':
                return (
                    <div className="pt-10 pb-20">
                         <div className="flex items-center gap-4 mb-10">
                             <div className="w-12 h-12 bg-[#E87A2C] rounded-2xl flex items-center justify-center text-white">
                                 <Activity className="w-6 h-6" />
                             </div>
                             <div>
                                 <h2 className="text-xl font-black uppercase tracking-tighter">Ferramentas</h2>
                                 <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Apoio ao seu estudo</p>
                             </div>
                         </div>
                         <Toolbox />
                    </div>
                );
            case 'home':
            default:
                const weekdays = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
                const now = new Date();
                const currentMonthDay = now.getDate();
                
                return (
                    <>
                        {/* Header de Boas Vindas */}
                        <div className="mb-10 animate-fade-in">
                            <h2 className="text-4xl font-black text-white uppercase tracking-tighter leading-none">Olá, {student?.name?.split(' ')[0]}!</h2>
                            <p className="text-[10px] font-black text-[#E87A2C] uppercase tracking-[0.4em] mt-3">Sua jornada musical continua aqui</p>
                        </div>

                        {/* Tracker Semanal */}
                        <section className="bg-white/5 border border-white/10 rounded-[32px] p-6 mb-10">
                            <div className="flex justify-between items-center mb-6">
                                <h4 className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-2">
                                    <Clock className="w-3 h-3 text-[#E87A2C]" /> Registro Semanal
                                </h4>
                                <span className="text-[10px] font-bold text-white/20 uppercase">Semana Atual</span>
                            </div>
                            <div className="grid grid-cols-7 gap-2">
                                {weekdays.map((day, i) => {
                                    // Cálculo simplificado de data para a semana atual
                                    const d = new Date();
                                    const dayOfWeek = d.getDay() === 0 ? 6 : d.getDay() - 1; // 0=Seg, 6=Dom
                                    const diff = i - dayOfWeek;
                                    const targetDate = new Date(d.setDate(d.getDate() + diff)).toISOString().split('T')[0];
                                    const studiedMinutes = studyHistory[targetDate] || 0;
                                    const isToday = i === dayOfWeek;

                                    return (
                                        <div key={day} className="flex flex-col items-center gap-2">
                                            <div className={`w-full aspect-square rounded-2xl flex flex-col items-center justify-center border transition-all ${studiedMinutes > 0 ? 'bg-emerald-500 border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'bg-rose-500/10 border-rose-500/20'}`}>
                                                {studiedMinutes > 0 ? (
                                                    <span className="text-[10px] font-black text-white uppercase">{studiedMinutes}m</span>
                                                ) : (
                                                    <div className="w-1.5 h-1.5 rounded-full bg-rose-500/20" />
                                                )}
                                            </div>
                                            <span className={`text-[8px] font-black uppercase ${isToday ? 'text-[#E87A2C]' : 'text-white/20'}`}>{day}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>

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

                                     {/* Barra de Progresso Diária */}
                                     {progressToday.done && (
                                         <div className="mb-6 p-4 bg-white/5 rounded-2xl border border-white/10 animate-fade-in">
                                             <div className="flex justify-between items-center mb-2">
                                                 <p className="text-[10px] font-black text-[#E87A2C] uppercase tracking-widest">Meta Diária Alcançada</p>
                                                 <p className="text-[10px] font-black text-white uppercase">{progressToday.minutes} MIN</p>
                                             </div>
                                             <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                                 <div className="h-full bg-[#E87A2C] w-full shadow-[0_0_10px_rgba(232,122,44,0.5)]"></div>
                                             </div>
                                         </div>
                                     )}

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
                            {/* Trilha de Estudos (Estilo Candy Crush / Map) */}
                            {curriculumInfo && (
                                <section className="relative py-10">
                                    <div className="flex flex-col items-center mb-16 relative z-10">
                                        <h3 className="text-2xl font-black uppercase tracking-tighter text-white flex items-center gap-3">
                                            <Map className="w-8 h-8 text-[#E87A2C]" /> Trilha de Evolução
                                        </h3>
                                        <div className="h-1 w-12 bg-[#E87A2C] rounded-full mt-2" />
                                    </div>

                                    {/* Linha da Trilha (SVG para o caminho curvo) */}
                                    <div className="absolute inset-x-0 top-32 bottom-0 flex justify-center pointer-events-none">
                                        <div className="w-px h-full bg-gradient-to-b from-[#E87A2C]/40 via-[#E87A2C]/20 to-transparent border-dashed border-l border-[#E87A2C]/20" />
                                    </div>

                                    <div className="relative z-10 flex flex-col items-center gap-16">
                                        {curriculumInfo.allTopics?.sort((a: any, b: any) => a.month_index - b.month_index).map((t: any, idx: number) => {
                                                            teacher_id: student?.teacher_id || "",
                                            const isPending = curriculumInfo.pendingTopics?.some((pt: any) => pt.id === t.id);
                                            const progress = curriculumInfo.progress?.find((p: any) => p.topic_id === t.id);
                                            const isCompleted = progress?.status === "quiz_completed";
                                            const align = idx % 2 === 0 ? 'ml-24' : 'mr-24';
                                            const rotate = idx % 2 === 0 ? 'rotate-3' : '-rotate-3';

                                            return (
                                                <div key={t.id} className={`flex flex-col items-center group ${align}`}>
                                                    <button
                                                        onClick={() => setSelectedLesson({
                                                            id: t.id,
                                                            student_id: studentId,
                                                            lesson_date: new Date().toISOString(),
                                                            objective: t.title,
                                                            report_data: {
                                                                tabs: [{ 
                                                                    title: 'Conteúdo Pedagógico', 
                                                                    content: t.content_text || 'Em breve...',
                                                                    isCurriculumContent: true, // Flag para mostrar o botão de prova
                                                                    topicId: t.id
                                                                }]
                                                            }
                                                        } as any)}
                                                        className={`w-28 h-28 rounded-[35px] flex items-center justify-center transition-all duration-500 shadow-2xl relative ${rotate} group-hover:scale-110 active:scale-90 ${isCompleted ? 'bg-emerald-500 shadow-emerald-500/30' : 'bg-rose-500 shadow-rose-500/30'}`}
                                                    >
                                                        {isCompleted ? (
                                                            <Trophy className="w-10 h-10 text-white" />
                                                        ) : (
                                                            <Star className="w-10 h-10 text-white animate-pulse" />
                                                        )}
                                                        
                                                        {/* Badge de Mês */}
                                                        <div className="absolute -top-3 -right-3 w-10 h-10 bg-[#1A110D] rounded-xl flex items-center justify-center border border-white/10 font-black text-[10px] text-white">
                                                            M{t.month_index}
                                                        </div>
                                                    </button>
                                                    <div className="mt-4 text-center">
                                                        <p className={`text-[10px] font-black uppercase tracking-widest ${isCompleted ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                            {isCompleted ? 'Dominado' : 'Próxima Fase'}
                                                        </p>
                                                        <h4 className="text-white font-black text-sm uppercase tracking-tight max-w-[120px] leading-none mt-1">{t.title}</h4>
                                                    </div>
                                                </div>
                                            );
                                        })}
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
            case "settings":
                return (
                    <div className="space-y-12 pb-20 animate-in slide-in-from-bottom-10 duration-500">
                        <div className="flex flex-col items-center text-center mt-12">
                            <div className="w-24 h-24 bg-[#E87A2C] rounded-[40px] flex items-center justify-center text-[#1A110D] shadow-2xl mb-6">
                                <BellRing className="w-10 h-10 animate-bounce" />
                            </div>
                            <h3 className="text-3xl font-black uppercase tracking-tighter">Central de Alertas</h3>
                            <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mt-2">{pushStatus === "granted" ? "SISTEMA OPERACIONAL" : "AGUARDANDO ATIVAÇÃO"}</p>
                        </div>

                        <div className="bg-white/5 p-8 rounded-[48px] border border-white/10 space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-[#E87A2C]"><Activity className="w-6 h-6" /></div>
                                <div>
                                    <h4 className="font-black uppercase tracking-tight">Status de Conexão</h4>
                                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest italic">{pushStatus === "granted" ? "Você está conectado com o Studio" : "Clique abaixo para autorizar"}</p>
                                </div>
                            </div>

                            {pushStatus !== "granted" && (
                                <button 
                                    onClick={subscribeToPush}
                                    className="w-full bg-white text-[#1A110D] py-6 rounded-[32px] font-black text-xs uppercase tracking-[0.2em] active:scale-95 transition-all flex items-center justify-center gap-3 shadow-2xl"
                                >
                                    <BellRing className="w-4 h-4" /> REATIVAR NOTIFICAÇÕES
                                </button>
                            )}

                            <div className="pt-6 border-t border-white/5">
                                <p className="text-[9px] font-black text-white/20 uppercase tracking-widest text-center italic">ID do Estudante: {studentId.substring(0,8)}...MusiClass</p>
                            </div>
                        </div>
                    </div>
                );

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

                           {/* Botão Solicitar Prova (Contexto de Matéria) */}
                           {selectedLesson.report_data?.tabs?.some((t: any) => t.isCurriculumContent) && (
                               <section className="p-8 bg-gradient-to-br from-indigo-500/20 to-purple-500/10 rounded-[40px] border border-white/5 space-y-6 relative overflow-hidden group">
                                   <div className="absolute -right-10 -top-10 w-40 h-40 bg-purple-500/20 blur-3xl rounded-full group-hover:bg-purple-500/30 transition-all" />
                                   
                                   <div className="relative z-10 flex flex-col items-center text-center">
                                       <div className="w-16 h-16 bg-white/10 rounded-3xl flex items-center justify-center mb-6 border border-white/10">
                                           <GraduationCap className="w-8 h-8 text-purple-400" />
                                       </div>
                                       <h3 className="text-xl font-black text-white uppercase tracking-tighter">Desafio de Maestria</h3>
                                       <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] mt-2 max-w-[200px]">Conclua o questionário para avançar na sua trilha</p>
                                   </div>

                                   <button 
                                       onClick={async () => {
                                           const topicId = selectedLesson.report_data.tabs.find((t: any) => t.topicId)?.topicId;
                                           if (!topicId) return;
                                           
                                           try {
                                               const { error } = await supabase.from('mc_exam_requests').insert({
                                                   student_id: studentId,
                                                   topic_id: topicId,
                                                   status: 'pending'
                                               });
                                               
                                               if (error) throw error;
                                               
                                               // Notificar Professor via Edge Function
                                               await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-push-notifications`, {
                                                   method: 'POST',
                                                   headers: { 'Content-Type': 'application/json' },
                                                   body: JSON.stringify({
                                                       teacher_id: student?.teacher_id,
                                                       title: '⚡ Nova Solicitação de Prova',
                                                // Notificar Professor via Edge Function
                                                const targetTeacher = selectedLesson?.teacher_id || student?.teacher_id;
                                                if (targetTeacher) {
                                                    await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-push-notifications`, {
                                                        method: "POST",
                                                        headers: { "Content-Type": "application/json" },
                                                        body: JSON.stringify({
                                                            teacher_id: targetTeacher,
                                                            title: "⚡ Nova Solicitação de Prova",
                                                            body: `${student?.name} terminou de estudar e solicitou a prova de ${selectedLesson.objective}.`,
                                                            url: "/students"
                                                        })
                                                    });
                                                }
                                       }}
                                       className="w-full bg-white text-[#1A110D] py-6 rounded-3xl font-black text-[10px] uppercase tracking-[0.3em] flex items-center justify-center gap-3 shadow-2xl hover:scale-[1.02] active:scale-95 transition-all relative z-10"
                                   >
                                       <Sparkles className="w-4 h-4 text-purple-600" /> Solicitar Prova Agora
                                   </button>
                               </section>
                           )}
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
                                            <div key={i} className="bg-white p-6 rounded-[32px] border-b-8 border-stone-200 shadow-xl overflow-hidden">
                                                <p className="text-[10px] font-black text-[#E87A2C] uppercase tracking-widest mb-4">{tab.title || "Matéria"}</p>
                                                <div className="font-sans text-[#3C2415] text-sm md:text-base leading-relaxed whitespace-pre-wrap break-words">
                                                    {tab.content}
                                                </div>
                                         </div>
                                     ))}
                                 </div>
                             </section>
                         )}

                          {/* Solos e Melodias */}
                          {selectedLesson.report_data?.solos?.length > 0 && (
                              <section className="space-y-6">
                                  <div className="flex items-center justify-between">
                                      <h4 className="text-xs font-black uppercase tracking-[0.2em] text-[#E87A2C]">Solos e Melodias</h4>
                                      <Music className="w-5 h-5 text-white/20" />
                                  </div>
                                  <div className="space-y-6">
                                      {selectedLesson.report_data.solos.map((solo: any, i: number) => (
                                          <div key={i} className="bg-white/5 p-6 rounded-[32px] border border-white/5">
                                              <p className="font-black text-[10px] uppercase text-[#E87A2C] mb-6 tracking-widest">{solo.title || `Melodia ${i + 1}`}</p>
                                              <div className="flex flex-wrap gap-4">
                                                  {(() => {
                                                      const maxPos = Math.max(...(solo.notes || []).map((n: any) => n.position || 0), 0);
                                                      const steps = Array.from({ length: maxPos + 1 });
                                                      return steps.map((_, stepIdx) => {
                                                          const harmonyNotes = (solo.notes || []).filter((n: any) => n.type === 'harmony' && (n.position || 0) === stepIdx);
                                                          const soloNotes = (solo.notes || []).filter((n: any) => n.type === 'solo' && (n.position || 0) === stepIdx);
                                                          if (harmonyNotes.length === 0 && soloNotes.length === 0) return null;
                                                          return (
                                                              <div key={stepIdx} className="flex flex-col gap-2 min-w-[60px] bg-white/5 p-3 rounded-2xl border border-white/10">
                                                                  <div className="flex flex-wrap gap-1 min-h-[24px]">
                                                                      {harmonyNotes.map((n: any, idx: number) => (
                                                                          <PdfIconBox key={idx} text={n.note} bgColor="bg-rose-600" />
                                                                      ))}
                                                                  </div>
                                                                  <div className="h-px bg-white/10 w-full" />
                                                                  <div className="flex flex-wrap gap-1 min-h-[24px]">
                                                                      {soloNotes.map((n: any, idx: number) => (
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
                              </section>
                          )}



                         {/* Seção Exclusiva de Bateria (Se houver ritmos/rudimentos) */}
                         {selectedLesson.report_data?.drums && (
                            <section className="space-y-8">
                                <div className="flex items-center justify-between">
                                     <h4 className="text-xs font-black uppercase tracking-[0.2em] text-[#E87A2C]">Estudo de Bateria</h4>
                                     <Activity className="w-5 h-5 text-white/20" />
                                </div>
                                
                                {selectedLesson.report_data.drums.rhythms?.map((r: any, rIdx: number) => (
                                    <div key={rIdx} className="bg-white/5 p-6 rounded-[32px] border border-white/5">
                                        <p className="text-[10px] font-black text-white/40 uppercase mb-4">{r.title}</p>
                                        <div className="flex gap-2 overflow-x-auto pb-2">
                                            {r.sequence?.map((parts: string[], sIdx: number) => (
                                                <div key={sIdx} className={`min-w-[40px] h-20 rounded-xl border border-white/5 flex flex-col items-center justify-center gap-1 ${sIdx % 4 === 0 ? 'bg-white/5' : ''}`}>
                                                    {parts.map(p => (
                                                        <div key={p} className="w-4 h-4 rounded-md bg-[#E87A2C] flex items-center justify-center text-[8px] text-white font-black">
                                                            {p === 'kick' ? '🥁' : p === 'snare' ? '⊚' : '×'}
                                                        </div>
                                                    ))}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </section>
                         )}

                         {/* Guias de Áudio (Vocal / Referência) */}
                         {selectedLesson.report_data?.recordings?.length > 0 && (
                            <section className="space-y-6">
                                <div className="flex items-center justify-between">
                                     <h4 className="text-xs font-black uppercase tracking-[0.2em] text-[#A855F7]">Guias e Áudios</h4>
                                     <Headphones className="w-5 h-5 text-white/20" />
                                </div>
                                <div className="grid grid-cols-1 gap-4">
                                    {selectedLesson.report_data.recordings.map((rec: any) => (
                                        <div 
                                            key={rec.id}
                                            onClick={() => {
                                                const a = new Audio(rec.url);
                                                a.play();
                                            }}
                                            className="bg-white/5 p-5 rounded-[24px] border border-white/10 flex items-center justify-between group active:scale-[0.98] transition-all cursor-pointer"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-[#A855F7] rounded-2xl flex items-center justify-center text-white">
                                                    <Play className="w-5 h-5 fill-current" />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-black uppercase text-white">{rec.title || 'Guia de Treino'}</p>
                                                    <p className="text-[8px] font-bold text-white/20 uppercase tracking-widest mt-1">Toque para ouvir</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                         )}

                     </div>

                     {/* Footer fixo do Modal */}
                     <div className="p-6 bg-[#1A110D] border-t border-white/10 space-y-4">
                          {isStudying && (
                              <div className="bg-[#E87A2C]/10 rounded-2xl p-4 border border-[#E87A2C]/20 flex items-center justify-between">
                                  <div>
                                      <p className="text-[10px] font-black text-[#E87A2C] uppercase">Tempo de Treino</p>
                                      <p className="text-xl font-black text-white">{formatTime(studyTime)}</p>
                                  </div>
                                  <button 
                                     onClick={handleFinishStudy}
                                     className="bg-[#E87A2C] text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest"
                                  >
                                     FINALIZAR ESTUDOS
                                  </button>
                              </div>
                          )}
                          <button 
                             onClick={() => setSelectedLesson(null)}
                             className="w-full bg-white/5 text-white/40 py-5 rounded-[24px] font-black text-xs uppercase tracking-[0.2em] active:scale-[0.98] transition-all border border-white/5"
                          >
                             FECHAR FICHA
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
                  onClick={() => setActiveTab('curriculum')}
                  className={`p-4 rounded-2xl flex-1 flex justify-center transition-all ${activeTab === 'curriculum' ? 'bg-[#E87A2C] text-white' : 'text-white/40'}`}
                >
                  <GraduationCap className="w-6 h-6" />
                </button>
                <button 
                   onClick={() => setActiveTab('tools')}
                   className={`p-4 rounded-2xl flex-1 flex justify-center transition-all ${activeTab === 'tools' ? 'bg-[#E87A2C] text-white' : 'text-white/40'}`}
                >
                  <Activity className="w-6 h-6" />
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
                  <Trophy className="w-6 h-6" />
                </button>
                <button 
                <button 
                  onClick={() => setActiveTab("settings")}
                  className={`p-4 rounded-2xl flex-1 flex justify-center transition-all ${activeTab === "settings" ? "bg-[#E87A2C] text-white" : "text-white/40"}`}
                >
                  <BellRing className="w-6 h-6" />
                </button>
            </nav>
        </div>
    );
};
