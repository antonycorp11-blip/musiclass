
import React, { useMemo } from 'react';
import { Trophy, Medal, Crown, Star, TrendingUp, Users } from 'lucide-react';
import { Teacher, Student } from '../../types';

interface RankingViewProps {
    teachers: Teacher[];
    lessonHistory: any[];
    students: Student[];
}

export const RankingView: React.FC<RankingViewProps> = ({ teachers, lessonHistory, students }) => {
    const rankingData = useMemo(() => {
        return teachers
            .filter(t => t.role !== 'director')
            .map(teacher => {
                const history = lessonHistory.filter(h => h.teacher_id === teacher.id);
                const totalReads = history.reduce((sum, h) => sum + (h.read_count || 0), 0);
                const activeStudents = students.filter(s => s.teacher_id === teacher.id).length;

                return {
                    ...teacher,
                    totalReads,
                    activeStudents,
                    performance: totalReads > 0 ? (totalReads / (activeStudents || 1)).toFixed(1) : '0'
                };
            }).sort((a, b) => b.totalReads - a.totalReads);
    }, [teachers, lessonHistory, students]);

    if (!teachers || teachers.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-20 text-stone-400">
                <Trophy className="w-16 h-16 mb-4 opacity-20" />
                <p className="font-black uppercase tracking-widest text-xs">Carregando dados do Ranking...</p>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <header className="relative py-16 px-10 bg-[#1A110D] rounded-[60px] overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/10 rounded-full -mr-32 -mt-32 blur-3xl" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-orange-500/10 rounded-full -ml-24 -mb-24 blur-2xl" />

                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="text-center md:text-left">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500/20 border border-yellow-500/30 rounded-full mb-6">
                            <Trophy className="w-4 h-4 text-yellow-500" />
                            <span className="text-[10px] font-black text-yellow-500 uppercase tracking-widest">Hall da Fama MusiClass</span>
                        </div>
                        <h2 className="text-5xl md:text-6xl font-black text-white tracking-tighter uppercase leading-none">Ranking de<br /><span className="text-yellow-500">Engajamento</span></h2>
                        <p className="text-stone-400 font-bold mt-6 max-w-md uppercase text-[10px] tracking-widest leading-relaxed">
                            Pontuação baseada no número de confirmações de leitura e treino dos alunos em tempo real.
                        </p>
                    </div>

                    <div className="flex gap-4">
                        <div className="bg-white/5 backdrop-blur-md border border-white/10 p-8 rounded-[40px] text-center min-w-[160px]">
                            <p className="text-[40px] font-black text-white leading-none mb-2">{lessonHistory.reduce((sum, h) => sum + (h.read_count || 0), 0)}</p>
                            <p className="text-[9px] font-black text-stone-500 uppercase tracking-widest">Treinos Totais</p>
                        </div>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 gap-4">
                {rankingData.map((t, i) => {
                    const isTop3 = i < 3;
                    const colors = [
                        'bg-yellow-500 shadow-yellow-500/20',
                        'bg-stone-300 shadow-stone-300/20',
                        'bg-orange-600 shadow-orange-600/20'
                    ];

                    return (
                        <div
                            key={t.id}
                            className={`group p-6 md:p-10 rounded-[48px] border transition-all duration-500 flex flex-col md:flex-row items-center gap-8 ${i === 0 ? 'bg-white border-yellow-200 shadow-2xl scale-[1.02] z-10' : 'bg-white border-stone-100 hover:border-orange-100'
                                }`}
                        >
                            <div className="flex items-center gap-8 shrink-0">
                                <div className={`w-16 h-16 rounded-3xl flex items-center justify-center font-black text-2xl shadow-xl transition-transform group-hover:rotate-12 ${isTop3 ? colors[i] + ' text-white' : 'bg-stone-100 text-stone-400'}`}>
                                    {i === 0 ? <Crown className="w-8 h-8" /> : i + 1}
                                </div>

                                <div>
                                    <h3 className="text-2xl font-black text-[#1A110D] tracking-tighter uppercase leading-none">{t.name}</h3>
                                    <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mt-2 flex items-center gap-2">
                                        <Users className="w-3 h-3" /> {t.activeStudents} Alunos Ativos
                                    </p>
                                </div>
                            </div>

                            <div className="flex-grow flex flex-wrap justify-center md:justify-end gap-4">
                                <div className="px-8 py-5 bg-[#FBF6F0] rounded-[32px] text-center min-w-[140px]">
                                    <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">Média/Aluno</p>
                                    <p className="text-xl font-black text-[#1A110D]">{t.performance}</p>
                                </div>
                                <div className={`px-10 py-5 rounded-[32px] text-center min-w-[180px] transition-all ${i === 0 ? 'bg-[#1A110D] text-white' : 'bg-[#E87A2C]/10 text-[#E87A2C]'}`}>
                                    <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${i === 0 ? 'text-white/40' : 'text-[#E87A2C]/40'}`}>Confirmações</p>
                                    <p className="text-3xl font-black flex items-center justify-center gap-2">
                                        {t.totalReads}
                                        {i === 0 && <Star className="w-5 h-5 fill-yellow-500 text-yellow-500" />}
                                    </p>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
