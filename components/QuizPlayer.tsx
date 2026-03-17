
import React, { useState, useEffect } from 'react';
import { CurriculumTopic, QuizQuestion, Student } from '../types';
import { supabase } from '../lib/supabase';
import { submitQuizResult } from '../services/curriculumService';
import { Logo } from './Logo';
import { Trophy, CheckCircle2, AlertCircle, ArrowRight, Share2, Download, FileText } from 'lucide-react';
import { domToPng } from 'modern-screenshot';
import { useToast } from '../context/ToastContext';

interface QuizPlayerProps {
    token: string;
    onClose?: () => void;
}

export const QuizPlayer: React.FC<QuizPlayerProps> = ({ token, onClose }) => {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [topic, setTopic] = useState<CurriculumTopic | null>(null);
    const [student, setStudent] = useState<Student | null>(null);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answers, setAnswers] = useState<number[]>([]);
    const [finished, setFinished] = useState(false);
    const [score, setScore] = useState(0);

    useEffect(() => {
        const loadQuiz = async () => {
            setLoading(true);
            try {
                const { data: progress, error } = await supabase
                    .from('mc_student_topics')
                    .select('*')
                    .eq('qr_code_token', token)
                    .single();

                if (error) {
                    console.error("Supabase Error ao buscar progresso:", error);
                    throw new Error("Link inválido ou expirado.");
                }
                if (!progress) throw new Error("Link inválido ou expirado.");

                // Fetch related data manually
                const { data: studentData } = await supabase.from('mc_students').select('*').eq('id', progress.student_id).single();
                const { data: topicData } = await supabase.from('mc_curriculum_topics').select('*').eq('id', progress.topic_id).single();

                if (!studentData || !topicData) throw new Error("Dados de aluno ou matéria não encontrados.");

                setTopic(topicData);
                setStudent(studentData);
                if (progress.status === 'quiz_completed') {
                    setScore(progress.quiz_score || 0);
                    setFinished(true);
                }
            } catch (e: any) {
                console.error("Quiz Fetch Error:", e);
                showToast(e.message, "error");
            } finally {
                setLoading(false);
            }
        };
        loadQuiz();
    }, [token]);

    const handleAnswer = (index: number) => {
        const newAnswers = [...answers];
        newAnswers[currentQuestion] = index;
        setAnswers(newAnswers);

        if (currentQuestion < (shuffledQuestions.length || 0) - 1) {
            setCurrentQuestion(currentQuestion + 1);
        } else {
            calculateFinish(newAnswers);
        }
    };

    const [shuffledQuestions, setShuffledQuestions] = useState<QuizQuestion[]>([]);

    useEffect(() => {
        if (topic?.quiz_json) {
            const shuffled = [...topic.quiz_json].sort(() => Math.random() - 0.5);
            setShuffledQuestions(shuffled.slice(0, 10)); // Sorteia 10 perguntas
        }
    }, [topic]);

    const calculateFinish = async (finalAnswers: number[]) => {
        if (!topic || !student || shuffledQuestions.length === 0) return;
        let correct = 0;
        shuffledQuestions.forEach((q, i) => {
            if (q.correctIndex === finalAnswers[i]) correct++;
        });
        const finalScore = Math.round((correct / shuffledQuestions.length) * 100);
        setScore(finalScore);
        setFinished(true);

        await submitQuizResult(student.id, topic.id, finalScore);
    };

    const [allCompletedProgress, setAllCompletedProgress] = useState<any[]>([]);
    useEffect(() => {
        if (student && finished) {
            supabase.from('mc_student_topics')
                .select('*')
                .eq('student_id', student.id)
                .eq('status', 'quiz_completed')
                .then(({ data }) => setAllCompletedProgress(data || []));
        }
    }, [student, finished]);

    if (loading) return (
        <div className="min-h-screen bg-[#FBF6F0] flex items-center justify-center">
            <div className="animate-spin w-10 h-10 border-4 border-[#E87A2C] border-t-transparent rounded-full" />
        </div>
    );

    if (!topic || !student) return (
        <div className="min-h-screen bg-[#FBF6F0] flex flex-col items-center justify-center p-10 text-center">
            <AlertCircle className="w-16 h-16 text-rose-500 mb-6" />
            <h2 className="text-2xl font-black text-[#3C2415] uppercase tracking-tighter">Ops! Questionário não localizado</h2>
            <p className="text-stone-400 font-bold text-sm mt-2">Verifique o link com seu professor.</p>
        </div>
    );

    if (finished) {
        const passed = score >= 60;
        return (
            <div className="min-h-screen bg-[#FBF6F0] flex flex-col items-center justify-center p-6 md:p-12 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/10 rounded-full -mr-48 -mt-48 animate-pulse" />
                <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-500/5 rounded-full -ml-40 -mb-40" />

                <div
                    id="quiz-certificate"
                    className="bg-[#1A110D] w-full max-w-xl rounded-[64px] p-12 shadow-[0_32px_64px_rgba(0,0,0,0.3)] border border-white/5 text-center relative z-10 animate-fade-in overflow-hidden"
                >
                    {/* Background Accents for the Image */}
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-500 via-[#E87A2C] to-emerald-500" />

                    <div className="flex flex-col items-center mb-12">
                        <img src="/Logo-Laranja.png" className="h-12 w-auto mb-4" alt="Logo" />
                        <span className="text-[10px] font-black uppercase text-orange-500/50 tracking-[0.4em]">Educational Journey</span>
                    </div>

                    <div className="relative mb-12">
                        <div className={`w-36 h-36 rounded-[48px] flex items-center justify-center mx-auto shadow-2xl relative z-10 transition-transform hover:scale-105 duration-500 ${passed ? 'bg-emerald-500 text-white shadow-emerald-500/30' : 'bg-rose-500 text-white shadow-rose-500/30'}`}>
                            {passed ? <Trophy className="w-16 h-16" /> : <AlertCircle className="w-16 h-16" />}
                        </div>
                        {passed && (
                            <div className="absolute -inset-4 bg-emerald-500/20 blur-3xl rounded-full animate-pulse" />
                        )}
                    </div>

                    <div className="space-y-2 mb-12">
                        <p className="text-emerald-500 font-black text-xs uppercase tracking-[0.3em]">Conquista Desbloqueada</p>
                        <h2 className="text-4xl font-black text-white tracking-tighter uppercase leading-tight">
                            {passed ? 'Parabéns, ' : 'Faltou pouco, '}<br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-stone-400">
                                {student.name.split(' ')[0]}!
                            </span>
                        </h2>
                    </div>

                    <div className="bg-white/5 rounded-[40px] p-10 backdrop-blur-xl border border-white/10 relative">
                        <p className="text-stone-500 font-black text-[10px] uppercase tracking-[0.2em] mb-4">Materia Concluída</p>
                        <h3 className="text-xl font-bold text-white mb-8">{topic.title}</h3>

                        <div className="flex items-end justify-center gap-2">
                            <p className={`text-7xl font-black leading-none ${passed ? 'text-emerald-400' : 'text-rose-400'}`}>{score}</p>
                            <span className="text-xl font-black text-stone-600 mb-2">%</span>
                        </div>
                        <p className="text-stone-500 text-[10px] font-bold uppercase mt-4">Aproveitamento Final</p>
                    </div>

                    <div className="mt-12 flex items-center justify-center gap-3">
                        <div className="h-px bg-white/10 flex-grow" />
                        <Logo size="sm" light />
                        <div className="h-px bg-white/10 flex-grow" />
                    </div>
                </div>

                {/* UI Buttons Controls (Invisible on Image Capture) */}
                <div className="mt-12 w-full max-w-xl grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                    {passed ? (
                        <>
                            <button
                                onClick={async () => {
                                    const element = document.getElementById('quiz-certificate');
                                    if (!element) return;
                                    try {
                                        const dataUrl = await domToPng(element, {
                                            quality: 1,
                                            scale: 3
                                        });
                                        const link = document.createElement('a');
                                        link.download = `Conquista_${student.name.split(' ')[0]}_${topic.title}.png`;
                                        link.href = dataUrl;
                                        link.click();
                                    } catch (err) {
                                        console.error("Erro ao gerar imagem:", err);
                                        showToast("Erro ao gerar imagem. Tente tirar um print da tela!", "error");
                                    }
                                }}
                                className="bg-[#E87A2C] text-white py-6 rounded-[32px] font-black text-xs uppercase tracking-[0.2em] shadow-2xl flex items-center justify-center gap-3 hover:scale-105 active:scale-95 transition-all"
                            >
                                <Download className="w-4 h-4" /> Baixar Card HD
                            </button>

                            <button
                                onClick={() => {
                                    if (navigator.share) {
                                        navigator.share({
                                            title: 'Minha Conquista MusiClass',
                                            text: `Concluí ${topic?.title} na MusiClass! 🏆`,
                                            url: window.location.href
                                        }).catch(() => { });
                                    } else {
                                        showToast("Link copiado!", "success");
                                    }
                                }}
                                className="bg-white text-[#1A110D] py-6 rounded-[32px] font-black text-xs uppercase tracking-[0.2em] shadow-xl flex items-center justify-center gap-3 hover:bg-stone-100 transition-all"
                            >
                                <Share2 className="w-4 h-4" /> Compartilhar
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={() => window.location.reload()}
                            className="w-full bg-rose-500 text-white py-6 rounded-[32px] font-black text-xs uppercase tracking-[0.2em] shadow-xl md:col-span-2"
                        >
                            Tentar Novamente
                        </button>
                    )}
                </div>

                {/* Matérias Concluídas (Botão de Boletim) */}
                <div className="mt-12 w-full max-w-xl space-y-4 relative z-10">
                    <h3 className="text-lg font-black text-[#3C2415] uppercase tracking-tighter text-center mb-6">Seu Histórico de Conquistas</h3>
                    {allCompletedProgress.filter(p => p.status === 'quiz_completed').map(p => (
                        <div key={p.id} className="w-full bg-[#1A110D] text-white px-6 py-6 rounded-[32px] shadow-xl flex items-center gap-6 border border-white/5 animate-fade-in group">
                            <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center flex-shrink-0 animate-pulse">
                                <Trophy className="w-8 h-8 text-white" />
                            </div>
                            <div className="text-left flex-grow">
                                <div className="flex items-center gap-2 mb-1">
                                    <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Objetivo Concluído</p>
                                </div>
                                <p className="text-lg font-black uppercase tracking-tight leading-none group-hover:text-emerald-400 transition-colors">{p.topic?.title || 'CONTEÚDO'}</p>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                                <div className="bg-emerald-500/10 text-emerald-500 px-4 py-1 rounded-full text-[12px] font-black">
                                    {p.quiz_score}%
                                </div>
                                <button
                                    onClick={() => {
                                        showToast(`BOLETIM MUSICLASS\n\nAluno: ${student.name}\nMatéria: ${p.topic?.title}\nNota Final: ${p.quiz_score}%\n\nResultado registrado no histórico pedagógico.`, "info");
                                    }}
                                    className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest bg-white/5 hover:bg-emerald-500 text-stone-300 hover:text-white px-4 py-2 rounded-xl transition-all"
                                >
                                    <FileText className="w-3 h-3" /> Detalhes
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                <p className="mt-12 text-[10px] font-black text-[#3C2415]/20 uppercase tracking-widest">MusiClass Technology 2024</p>
            </div>
        );
    }

    const q = topic.quiz_json[currentQuestion];

    return (
        <div className="min-h-screen bg-[#FBF6F0] flex flex-col p-6 md:p-12">
            <div className="max-w-3xl mx-auto w-full space-y-12">
                <header className="flex justify-between items-center">
                    <Logo size="xs" />
                    <div className="text-right">
                        <p className="text-[10px] font-black text-[#E87A2C] uppercase tracking-widest">{student.name}</p>
                        <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">{topic.title}</p>
                    </div>
                </header>

                {/* Progress Bar */}
                <div className="bg-white p-4 rounded-3xl shadow-sm flex items-center gap-6">
                    <div className="flex-grow bg-stone-100 h-2 rounded-full overflow-hidden">
                        <div
                            className="bg-[#E87A2C] h-full transition-all duration-500"
                            style={{ width: `${((currentQuestion) / shuffledQuestions.length) * 100}%` }}
                        />
                    </div>
                    <span className="font-black text-xs text-stone-400 whitespace-nowrap">
                        Questão {currentQuestion + 1} de {shuffledQuestions.length}
                    </span>
                </div>

                <div className="space-y-10 py-10">
                    <h1 className="text-3xl md:text-5xl font-black text-[#3C2415] tracking-tighter uppercase leading-tight animate-fade-in">
                        {shuffledQuestions[currentQuestion]?.question}
                    </h1>

                    <div className="grid grid-cols-1 gap-4">
                        {shuffledQuestions[currentQuestion]?.options.map((opt, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleAnswer(idx)}
                                className="w-full bg-white hover:bg-[#1A110D] hover:text-white p-8 rounded-[32px] text-left font-black text-lg transition-all border border-[#3C2415]/5 shadow-sm group flex items-center justify-between"
                            >
                                <span>{opt}</span>
                                <ArrowRight className="w-6 h-6 opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 transition-all text-[#E87A2C]" />
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
