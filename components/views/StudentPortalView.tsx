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
    Award
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';

interface Props {
    studentId: string;
}

export const StudentPortalView: React.FC<Props> = ({ studentId }) => {
    const { showToast } = useToast();
    const [student, setStudent] = useState<Student | null>(null);
    const [lastLesson, setLastLesson] = useState<LessonHistory | null>(null);
    const [loading, setLoading] = useState(true);
    const [studyTime, setStudyTime] = useState(0);
    const [isStudying, setIsStudying] = useState(false);

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

                // 2. Fetch Last Lesson
                const { data: history, error: hErr } = await supabase
                    .from('mc_lesson_history')
                    .select('*')
                    .eq('student_id', studentId)
                    .order('created_at', { ascending: false })
                    .limit(1);
                
                if (history && history.length > 0) {
                    setLastLesson(history[0]);
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

    if (loading) return <div className="min-h-screen bg-[#1A110D] flex items-center justify-center text-white/20 font-black uppercase tracking-[0.5em]">Carregando Portal...</div>;
    if (!student) return <div className="min-h-screen bg-[#1A110D] flex items-center justify-center text-white/20 font-black uppercase tracking-[0.5em]">Aluno não encontrado</div>;

    return (
        <div className="min-h-screen bg-[#1A110D] text-white p-6 pb-32 animate-fade-in font-sans">
            {/* Header Perfil */}
            <header className="flex items-center justify-between mb-10 pt-4">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-[#E87A2C] rounded-2xl flex items-center justify-center shadow-lg border-2 border-white/10 overflow-hidden">
                        {student.avatar_url ? (
                            <img src={student.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                            <User className="w-8 h-8 text-white" />
                        )}
                    </div>
                    <div>
                        <h1 className="text-2xl font-black tracking-tighter uppercase leading-none">{student.name.split(' ')[0]}</h1>
                        <p className="text-[10px] font-bold text-[#E87A2C] uppercase tracking-widest mt-1">{student.instrument}</p>
                    </div>
                </div>
                <div className="bg-white/5 p-4 rounded-2xl border border-white/10 text-right">
                    <p className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-1">Engajamento</p>
                    <p className="text-xl font-black text-[#E87A2C] leading-none flex items-center gap-2 justify-end">
                        {student.points || 0} <Award className="w-4 h-4" />
                    </p>
                </div>
            </header>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-white/5 rounded-3xl p-6 border border-white/5">
                    <Trophy className="w-6 h-6 text-yellow-500 mb-3" />
                    <p className="text-[9px] font-black text-white/30 uppercase tracking-widest">Seu Ranking</p>
                    <p className="text-2xl font-black">#--</p>
                </div>
                <div className="bg-white/5 rounded-3xl p-6 border border-white/5">
                    <CheckCircle2 className="w-6 h-6 text-emerald-500 mb-3" />
                    <p className="text-[9px] font-black text-white/30 uppercase tracking-widest">Aulas Lidas</p>
                    <p className="text-2xl font-black">{student.lesson_count || 0}</p>
                </div>
            </div>

            {/* Cronômetro de Estudo */}
            <section className={`rounded-[40px] p-8 mb-8 transition-all duration-500 ${isStudying ? 'bg-[#E87A2C] shadow-2xl shadow-orange-500/30' : 'bg-white/5 border border-white/10'}`}>
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className={`text-xl font-black uppercase tracking-tighter ${isStudying ? 'text-[#1A110D]' : 'text-white'}`}>Hora de Estudar!</h3>
                        <p className={`text-[10px] font-bold uppercase tracking-widest ${isStudying ? 'text-[#1A110D]/60' : 'text-white/40'}`}>
                            {isStudying ? 'Contando XP...' : 'Inicie seu treino agora'}
                        </p>
                    </div>
                    <Clock className={`w-8 h-8 ${isStudying ? 'text-[#1A110D] animate-pulse' : 'text-white/20'}`} />
                </div>
                
                <div className="flex flex-col items-center gap-6">
                    <p className={`text-6xl font-black tracking-tighter ${isStudying ? 'text-[#1A110D]' : 'text-white/20'}`}>
                        {formatTime(studyTime)}
                    </p>
                    
                    {!isStudying ? (
                        <button 
                            onClick={() => setIsStudying(true)}
                            className="w-full bg-[#E87A2C] text-white py-5 rounded-2xl font-black text-lg uppercase tracking-widest flex items-center justify-center gap-3 active:scale-95 transition-all"
                        >
                            <Play className="w-6 h-6 fill-current" /> COMEÇAR TREINO
                        </button>
                    ) : (
                        <button 
                            onClick={handleFinishStudy}
                            className="w-full bg-[#1A110D] text-white py-5 rounded-2xl font-black text-lg uppercase tracking-widest active:scale-95 transition-all shadow-xl"
                        >
                            FINALIZAR E GANHAR XP
                        </button>
                    )}
                </div>
            </section>

            {/* Última Tarefa */}
            <section className="space-y-4">
                <div className="flex items-center justify-between px-2">
                    <h3 className="text-sm font-black uppercase tracking-widest text-white/40 flex items-center gap-2">
                        <BookOpen className="w-4 h-4" /> Última Aula
                    </h3>
                    <ChevronRight className="w-4 h-4 text-white/20" />
                </div>

                {lastLesson ? (
                    <div className="bg-white rounded-[32px] p-8 border border-white/5 shadow-xl">
                        <div className="flex items-start justify-between mb-4">
                            <span className="bg-[#E87A2C]/10 text-[#E87A2C] text-[9px] font-black uppercase px-3 py-1 rounded-lg">
                                {new Date(lastLesson.created_at).toLocaleDateString()}
                            </span>
                        </div>
                        <h4 className="text-2xl font-black text-[#1A110D] text-white uppercase tracking-tighter mb-4 line-clamp-2">
                            {lastLesson.objective || 'Atividade Prática'}
                        </h4>
                        <div className="flex gap-2">
                            <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                                {lastLesson.report_data.chords.length} Acordes
                            </span>
                            <span className="text-white/10">•</span>
                            <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                                {lastLesson.report_data.exercises.length} Metas
                            </span>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white/5 border-2 border-dashed border-white/5 rounded-[32px] p-12 text-center">
                        <Music className="w-12 h-12 text-white/10 mx-auto mb-4" />
                        <p className="text-white/20 font-black uppercase text-[10px] tracking-widest">Aguardando sua primeira aula...</p>
                    </div>
                )}
            </section>

            {/* Rodapé Navbar Mobile */}
            <nav className="fixed bottom-6 left-6 right-6 bg-white/10 backdrop-blur-xl border border-white/10 rounded-[32px] p-4 flex justify-around items-center shadow-2xl z-50">
                <button className="p-4 bg-[#E87A2C] text-white rounded-2xl"><BookOpen className="w-6 h-6" /></button>
                <button className="p-4 text-white/40"><Trophy className="w-6 h-6" /></button>
                <button className="p-4 text-white/40"><Settings className="w-6 h-6" /></button>
            </nav>
        </div>
    );
};
