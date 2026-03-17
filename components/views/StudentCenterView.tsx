
import React, { useState, useEffect } from 'react';
import { Student, Teacher, CurriculumTopic, StudentTopicProgress } from '../../types';
import { supabase } from '../../lib/supabase';
import {
    User,
    BookOpen,
    Trophy,
    FileText,
    ArrowRight,
    Calendar,
    CheckCircle2,
    Clock,
    TrendingUp,
    Music,
    AlertCircle,
    ChevronRight,
    QrCode,
    Trash2,
    RotateCcw
} from 'lucide-react';
import { Logo } from '../Logo';
import { PedagogicalRadar } from '../PedagogicalRadar';
import { useToast } from '../../context/ToastContext';

interface StudentCenterViewProps {
    student: Student;
    teacher: Teacher;
    onStartLesson: () => void;
    onViewHistory: (lesson: any) => void;
    allTopics: CurriculumTopic[];
    allProgress: StudentTopicProgress[];
    onDeleteLesson?: (id: string) => void;
}

export const StudentCenterView: React.FC<StudentCenterViewProps> = ({
    student,
    teacher,
    onStartLesson,
    onViewHistory,
    allTopics,
    allProgress,
    onDeleteLesson
}) => {
    const { showToast } = useToast();
    const [view, setView] = useState<'dashboard' | 'boletim'>('dashboard');
    const [lessonCount, setLessonCount] = useState(0);
    const [recentLessons, setRecentLessons] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            setLoading(true);
            try {
                const { data: history, error } = await supabase
                    .from('mc_lesson_history')
                    .select('*')
                    .eq('student_id', student.id)
                    .order('created_at', { ascending: false });

                if (history) {
                    setRecentLessons(history);
                    setLessonCount(history.length);
                }
            } catch (e) {
                console.error("Erro dashboard:", e);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardData();
    }, [student.id]);

    // Lógica Pedagógica
    const studentQuizzes = allProgress.filter(p => p.student_id === student.id);
    const completedTopicIds = studentQuizzes
        .filter(p => p.status === 'quiz_completed')
        .map(p => p.topic_id);

    const currentMonthIndex = Math.max(1, Math.ceil((lessonCount + 1) / 4));

    const relevantTopics = allTopics.filter(t => t.month_index <= currentMonthIndex);
    const pendingTopics = relevantTopics.filter(t => !completedTopicIds.includes(t.id));
    const appliedTopics = studentQuizzes.filter(p => p.status === 'applied');

    const idealTopic = relevantTopics.find(t => t.month_index === currentMonthIndex && !completedTopicIds.includes(t.id));

    const status = pendingTopics.length > 2 ? 'critical' :
        (idealTopic || pendingTopics.length > 0) ? 'action_needed' : 'ok';

    const backlogCount = pendingTopics.length;

    const handleApplyTopic = async (topic: CurriculumTopic) => {
        try {
            const { applyTopicToStudent } = await import('../../services/curriculumService');
            await applyTopicToStudent(student.id, topic.id, teacher.id);
            showToast(`Matéria "${topic.title}" aplicada com sucesso!`, "success");
            // Recarregar dados se necessário ou confiar no global
        } catch (e) {
            showToast("Erro ao aplicar matéria.", "error");
        }
    };

    if (view === 'boletim') {
        return (
            <div className="space-y-10 animate-fade-in">
                <header className="flex items-center justify-between">
                    <div>
                        <button
                            onClick={() => setView('dashboard')}
                            className="text-[10px] font-black text-[#E87A2C] uppercase tracking-widest mb-2 flex items-center gap-2"
                        >
                            <ChevronRight className="w-4 h-4 rotate-180" /> Voltar ao Painel
                        </button>
                        <h2 className="text-4xl font-black text-[#3C2415] tracking-tighter uppercase">Boletim Pedagógico</h2>
                    </div>
                    <div className="text-right">
                        <p className="text-xl font-black text-[#3C2415] uppercase">{student.name}</p>
                        <p className="text-[10px] font-bold text-stone-400 p-0 m-0 uppercase tracking-widest leading-none mt-1">{student.instrument}</p>
                    </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-white rounded-[48px] p-10 shadow-xl border border-stone-100 h-fit">
                        <h3 className="text-sm font-black text-[#3C2415] uppercase tracking-widest mb-8 flex items-center gap-3">
                            <TrendingUp className="w-5 h-5 text-[#E87A2C]" /> Evolução Geral
                        </h3>
                        <div className="flex justify-center py-6">
                            <PedagogicalRadar
                                currentMonthIndex={currentMonthIndex}
                                lessonCount={lessonCount}
                                idealTopic={idealTopic || null}
                                status={status}
                                backlogCount={backlogCount}
                                pendingTopics={pendingTopics}
                                appliedTopics={appliedTopics}
                                progress={studentQuizzes}
                                onApply={handleApplyTopic}
                            />
                        </div>
                    </div>

                    <div className="space-y-6">
                        <h3 className="text-sm font-black text-[#3C2415] uppercase tracking-widest flex items-center gap-3">
                            <Trophy className="w-5 h-5 text-emerald-500" /> Conquistas e Provas
                        </h3>

                        {studentQuizzes.length === 0 ? (
                            <div className="bg-[#1A110D] p-12 rounded-[48px] text-center border border-white/5">
                                <AlertCircle className="w-12 h-12 text-orange-500/50 mx-auto mb-4" />
                                <p className="text-white/40 font-black uppercase text-[10px] tracking-[0.3em]">Nenhuma prova realizada ainda</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {studentQuizzes.map(q => (
                                    <div key={q.id} className="bg-white p-6 rounded-[32px] shadow-sm border border-stone-100 flex items-center justify-between hover:shadow-md transition-all group">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${q.status === 'quiz_completed' ? 'bg-emerald-500 text-white' : 'bg-[#E87A2C] text-white animate-pulse'}`}>
                                                {q.status === 'quiz_completed' ? <CheckCircle2 className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-[#E87A2C] uppercase tracking-widest">{q.topic?.title || 'Conteúdo Aplicado'}</p>
                                                <p className="text-sm font-black text-[#3C2415] uppercase">{q.status === 'quiz_completed' ? 'Concluído' : 'Em Andamento'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {q.status === 'quiz_completed' && (
                                                <div className="text-right">
                                                    <p className="text-2xl font-black text-emerald-500 leading-none">{q.quiz_score}%</p>
                                                    <p className="text-[8px] font-bold text-stone-400 uppercase tracking-widest mt-1">Acerto Final</p>
                                                </div>
                                            )}
                                            {teacher.role === 'director' && (
                                                <button
                                                    onClick={async () => {
                                                        if (confirm("Deseja zerar o resultado desta prova para o aluno refazer?")) {
                                                            try {
                                                                const { resetStudentTopic } = await import('../../services/curriculumService');
                                                                await resetStudentTopic(student.id, q.topic_id);
                                                                showToast("Prova zerada com sucesso!", "success");
                                                                window.location.reload(); 
                                                            } catch (e) {
                                                                showToast("Erro ao zerar prova.", "error");
                                                            }
                                                        }
                                                    }}
                                                    className="p-3 bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white rounded-xl transition-all"
                                                    title="Zerar Prova"
                                                >
                                                    <RotateCcw className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="bg-orange-50 p-8 rounded-[40px] border border-orange-100">
                            <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <QrCode className="w-4 h-4" /> Provas Pendentes
                            </p>
                            <div className="space-y-3">
                                {allTopics.filter(t => !studentQuizzes.find(p => p.topic_id === t.id)).slice(0, 3).map(t => (
                                    <div key={t.id} className="flex items-center justify-between opacity-50">
                                        <span className="text-[11px] font-bold uppercase text-orange-950">{t.title}</span>
                                        <div className="h-px bg-orange-200 flex-grow mx-4 mt-1 border-dotted border-b-2" />
                                        <span className="text-[9px] font-black text-orange-400 uppercase">Pendente</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-12 animate-fade-in">
            {/* Perfil Header */}
            <div className="relative bg-[#1A110D] rounded-[64px] p-10 md:p-16 overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-96 h-96 bg-[#E87A2C]/10 rounded-full -mr-48 -mt-48 blur-3xl animate-pulse" />
                <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-500/5 rounded-full -ml-40 -mb-40 blur-2xl" />

                <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
                    <div className="w-32 h-32 md:w-48 md:h-48 bg-white/10 rounded-[48px] border border-white/20 flex items-center justify-center p-Safe hover:scale-105 transition-transform duration-500 group">
                        <User className="w-16 h-16 md:w-24 md:h-24 text-[#E87A2C] group-hover:text-white transition-colors" />
                    </div>

                    <div className="flex-grow text-center md:text-left space-y-4">
                        <div className="flex flex-col md:flex-row md:items-center gap-3">
                            <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter uppercase leading-none">
                                {student.name.split(' ')[0]} <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#E87A2C] to-orange-400">{student.name.split(' ').slice(1).join(' ')}</span>
                            </h2>
                            <span className="inline-block px-4 py-1.5 bg-white/10 rounded-xl text-[10px] font-black text-emerald-400 uppercase tracking-widest border border-white/5 mx-auto md:mx-0">
                                Ativo
                            </span>
                        </div>

                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-8">
                            <div className="space-y-1">
                                <p className="text-[9px] font-black text-white/30 uppercase tracking-widest">Instrumento</p>
                                <div className="flex items-center gap-2 text-white font-black uppercase text-xl">
                                    <Music className="w-5 h-5 text-[#E87A2C]" /> {student.instrument}
                                </div>
                            </div>
                            <div className="w-px h-10 bg-white/10 hidden md:block" />
                            <div className="space-y-1">
                                <p className="text-[9px] font-black text-white/30 uppercase tracking-widest">Nível Atual</p>
                                <p className="text-white font-black uppercase text-xl">{student.level || 'Iniciante'}</p>
                            </div>
                            <div className="w-px h-10 bg-white/10 hidden md:block" />
                            <div className="space-y-1">
                                <p className="text-[9px] font-black text-white/30 uppercase tracking-widest">Idade</p>
                                <p className="text-white font-black uppercase text-xl">{student.age || '--'} Anos</p>
                            </div>
                            <div className="w-px h-10 bg-white/10 hidden md:block" />
                            <div className="space-y-1 text-center md:text-left">
                                <p className="text-[9px] font-black text-white/30 uppercase tracking-widest">Aula Atual</p>
                                <div className="flex items-center gap-2">
                                    <span className="text-3xl font-black text-[#E87A2C] leading-none">{lessonCount + 1}</span>
                                    <span className="text-[10px] font-bold text-white/40 uppercase">de {student.contract_total || '∞'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <button
                    onClick={onStartLesson}
                    className="group relative bg-[#1A110D] hover:bg-[#E87A2C] p-1 shadow-2xl rounded-[40px] transition-all duration-500 overflow-hidden"
                >
                    <div className="bg-[#1A110D] p-10 rounded-[38px] flex items-center justify-between group-hover:bg-[#E87A2C]/10 border border-white/5">
                        <div className="flex items-center gap-6">
                            <div className="w-16 h-16 bg-white/5 rounded-3xl flex items-center justify-center group-hover:bg-[#E87A2C] transition-colors shadow-inner">
                                <BookOpen className="w-8 h-8 text-[#E87A2C] group-hover:text-white" />
                            </div>
                            <div className="text-left">
                                <p className="text-2xl font-black text-white uppercase tracking-tighter">Montar Aula</p>
                                <p className="text-[10px] font-bold text-stone-500 group-hover:text-white uppercase tracking-widest mt-1">Preparar conteúdo e ficha de treino</p>
                            </div>
                        </div>
                        <ArrowRight className="w-8 h-8 text-[#E87A2C] group-hover:text-white group-hover:translate-x-2 transition-all" />
                    </div>
                </button>

                <button
                    onClick={() => setView('boletim')}
                    className="group relative bg-white hover:bg-[#1A110D] p-1 shadow-xl rounded-[40px] transition-all duration-500 overflow-hidden border border-stone-100"
                >
                    <div className="bg-white p-10 rounded-[38px] flex items-center justify-between group-hover:bg-[#1A110D] transition-colors">
                        <div className="flex items-center gap-6">
                            <div className="w-16 h-16 bg-stone-50 rounded-3xl flex items-center justify-center group-hover:bg-emerald-500 transition-colors">
                                <Trophy className="w-8 h-8 text-[#E87A2C] group-hover:text-white" />
                            </div>
                            <div className="text-left">
                                <p className="text-2xl font-black text-[#1A110D] group-hover:text-white uppercase tracking-tighter">Ver Boletim</p>
                                <p className="text-[10px] font-bold text-stone-400 group-hover:text-white/40 uppercase tracking-widest mt-1">Resultados pedagógicos e provas</p>
                            </div>
                        </div>
                        <ArrowRight className="w-8 h-8 text-stone-200 group-hover:text-white group-hover:translate-x-2 transition-all" />
                    </div>
                </button>
            </div>

            {/* Fichas e Histórico */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
                <div className="md:col-span-8 space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <div>
                            <h3 className="text-xl font-black text-[#3C2415] uppercase tracking-tighter shadow-sm">Atividades Recentes</h3>
                            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mt-1">Últimas 5 fichas de treino geradas</p>
                        </div>
                        <div className="bg-[#1A110D] px-6 py-2 rounded-2xl flex items-center gap-3">
                            <FileText className="w-4 h-4 text-[#E87A2C]" />
                            <span className="text-[10px] font-black text-white uppercase tracking-widest">{lessonCount} Fichas</span>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {loading ? (
                            <div className="p-20 text-center opacity-20">Carregando histórico...</div>
                        ) : recentLessons.length === 0 ? (
                            <div className="bg-stone-100/50 border-2 border-dashed border-stone-200 rounded-[48px] p-20 text-center">
                                <FileText className="w-16 h-16 text-stone-300 mx-auto mb-4" />
                                <p className="text-stone-400 font-black uppercase text-xs tracking-widest">Nenhuma ficha gerada para este aluno ainda</p>
                            </div>
                        ) : (
                            recentLessons.slice(0, 5).map((h, i) => (
                                <div key={h.id} className="bg-white p-8 rounded-[40px] shadow-sm border border-stone-100 flex flex-col md:flex-row items-center justify-between hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
                                    <div className="flex items-center gap-6 flex-grow">
                                        <div className="w-14 h-14 bg-stone-50 rounded-2xl flex items-center justify-center text-stone-300 group-hover:bg-[#E87A2C]/10 group-hover:text-[#E87A2C] transition-colors">
                                            <Calendar className="w-6 h-6" />
                                        </div>
                                        <div className="text-left">
                                            <p className="text-[10px] font-black text-[#E87A2C] uppercase tracking-[0.2em] mb-1">Aula #{recentLessons.length - i}</p>
                                            <p className="text-lg font-black text-[#3C2415] uppercase tracking-tight line-clamp-1">{h.objective || 'Atividade Prática'}</p>
                                            <div className="flex items-center gap-4 mt-2">
                                                <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest bg-stone-50 px-3 py-1 rounded-lg">
                                                    {new Date(h.created_at).toLocaleDateString()}
                                                </span>
                                                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border-2 transition-all ${h.is_read || (h.read_count && h.read_count > 0) ? 'bg-emerald-50 border-emerald-100' : 'bg-stone-50 border-stone-200'}`}>
                                                    <div className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all ${h.is_read || (h.read_count && h.read_count > 0) ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white border-stone-300'}`}>
                                                        {(h.is_read || (h.read_count && h.read_count > 0)) && <CheckCircle2 className="w-3 h-3 stroke-[4px]" />}
                                                    </div>
                                                    <span className={`text-[9px] font-black uppercase tracking-widest ${h.is_read || (h.read_count && h.read_count > 0) ? 'text-emerald-700' : 'text-stone-400'}`}>
                                                        {h.read_count && h.read_count > 0 ? `${h.read_count}x Treinado` : h.is_read ? 'Lida' : 'Não lida'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-6 md:mt-0 flex items-center gap-3">
                                        <button
                                            onClick={() => onViewHistory(h)}
                                            className="px-8 py-4 bg-stone-50 hover:bg-[#1A110D] hover:text-white rounded-3xl font-black text-[10px] uppercase tracking-widest transition-all"
                                        >
                                            Reabrir Ficha
                                        </button>
                                        {onDeleteLesson && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onDeleteLesson(h.id);
                                                    setRecentLessons(prev => prev.filter(l => l.id !== h.id));
                                                }}
                                                className="p-4 bg-stone-50 hover:bg-rose-500 hover:text-white rounded-2xl transition-all group/del"
                                                title="Excluir Ficha"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="md:col-span-4 space-y-8">
                    <div className="bg-[#1A110D] rounded-[48px] p-8 shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#E87A2C]/10 rounded-full -mr-16 -mt-16 blur-xl" />
                        <h3 className="text-white font-black uppercase text-xl tracking-tighter mb-8 flex items-center gap-3">
                            <QrCode className="w-6 h-6 text-[#E87A2C]" /> Radar Estudante
                        </h3>
                        <PedagogicalRadar
                            currentMonthIndex={currentMonthIndex}
                            lessonCount={lessonCount}
                            idealTopic={idealTopic || null}
                            status={status}
                            backlogCount={backlogCount}
                            pendingTopics={pendingTopics}
                            appliedTopics={appliedTopics}
                            progress={studentQuizzes}
                            onApply={handleApplyTopic}
                            compact
                        />
                        <button
                            onClick={() => setView('boletim')}
                            className="w-full mt-8 bg-white/5 hover:bg-white/10 text-white/40 hover:text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all border border-white/5"
                        >
                            Ver detalhes do desempenho
                        </button>
                    </div>

                    <div className="bg-emerald-500 rounded-[48px] p-10 text-white shadow-xl group border-b-8 border-emerald-700">
                        <Trophy className="w-12 h-12 mb-6 group-hover:scale-125 transition-transform" />
                        <h4 className="text-3xl font-black uppercase tracking-tighter leading-none mb-2">Próximo Nível</h4>
                        <p className="text-white/60 font-bold text-[10px] uppercase tracking-widest leading-relaxed">
                            Complete mais 3 aulas de técnica para desbloquear o Radar Avançado.
                        </p>
                    </div>
                </div>
            </div>

            <p className="text-center text-[10px] font-black text-[#3C2415]/20 uppercase tracking-[0.5em] pt-12">MusiClass Student Dashboard 2024</p>
        </div>
    );
};
