import React, { useMemo } from 'react';
import { Trophy, Medal, Crown, Star, TrendingUp, Users, Award } from 'lucide-react';
import { Student } from '../../types';

interface Props {
    students: Student[];
}

export const StudentRankingView: React.FC<Props> = ({ students }) => {
    const sortedStudents = useMemo(() => {
        return [...students].sort((a, b) => (b.points || 0) - (a.points || 0));
    }, [students]);

    if (!students || students.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-20 text-stone-400">
                <Trophy className="w-16 h-16 mb-4 opacity-20" />
                <p className="font-black uppercase tracking-widest text-xs">Aguardando dados de alunos...</p>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <header className="relative py-16 px-10 bg-[#1A110D] rounded-[60px] overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full -mr-32 -mt-32 blur-3xl" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/10 rounded-full -ml-24 -mb-24 blur-2xl" />

                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="text-center md:text-left">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/20 border border-emerald-500/30 rounded-full mb-6">
                            <Award className="w-4 h-4 text-emerald-400" />
                            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Gameficação MusiClass</span>
                        </div>
                        <h2 className="text-5xl md:text-6xl font-black text-white tracking-tighter uppercase leading-none">Ranking de<br /><span className="text-[#E87A2C]">Estudantes</span></h2>
                        <p className="text-stone-400 font-bold mt-6 max-w-md uppercase text-[10px] tracking-widest leading-relaxed">
                            Alunos mais engajados baseados em tempo de treino, leitura de fichas e conclusão de provas.
                        </p>
                    </div>

                    <div className="flex gap-4">
                        <div className="bg-white/5 backdrop-blur-md border border-white/10 p-8 rounded-[40px] text-center min-w-[160px]">
                            <p className="text-[40px] font-black text-white leading-none mb-2">
                                {students.reduce((sum, s) => sum + (s.points || 0), 0)}
                            </p>
                            <p className="text-[9px] font-black text-stone-500 uppercase tracking-widest">XP Total Acumulado</p>
                        </div>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 gap-4">
                {sortedStudents.map((s, i) => {
                    const isTop3 = i < 3;
                    const colors = [
                        'bg-yellow-500 shadow-yellow-500/20',
                        'bg-stone-300 shadow-stone-300/20',
                        'bg-orange-600 shadow-orange-600/20'
                    ];

                    return (
                        <div
                            key={s.id}
                            className={`group p-6 md:p-8 rounded-[48px] border transition-all duration-500 flex flex-col md:flex-row items-center gap-8 ${
                                i === 0 ? 'bg-white border-yellow-200 shadow-2xl scale-[1.02] z-10' : 'bg-white border-stone-100 hover:border-orange-100'
                            }`}
                        >
                            <div className="flex items-center gap-8 shrink-0">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl shadow-xl transition-transform group-hover:rotate-12 ${
                                    isTop3 ? colors[i] + ' text-white' : 'bg-stone-50 text-stone-300'
                                }`}>
                                    {i === 0 ? <Crown className="w-7 h-7" /> : i + 1}
                                </div>

                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 bg-stone-100 rounded-2xl overflow-hidden border-2 border-white flex items-center justify-center text-[#E87A2C] font-black text-xl">
                                        {s.avatar_url ? <img src={s.avatar_url} className="w-full h-full object-cover" /> : s.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-[#1A110D] tracking-tighter uppercase leading-none">{s.name}</h3>
                                        <p className="text-[9px] font-black text-[#E87A2C] uppercase tracking-[0.2em] mt-2 italic">
                                            {s.instrument}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex-grow flex flex-wrap justify-center md:justify-end gap-3">
                                <div className="px-6 py-4 bg-stone-50 rounded-[24px] text-center min-w-[100px]">
                                    <p className="text-[8px] font-black text-stone-400 uppercase tracking-widest mb-1">Aulas</p>
                                    <p className="text-lg font-black text-[#1A110D]">{s.lesson_count || 0}</p>
                                </div>
                                <div className={`px-10 py-5 rounded-[32px] text-center min-w-[150px] transition-all ${
                                    i === 0 ? 'bg-[#1A110D] text-white shadow-xl shadow-stone-900/40' : 'bg-orange-50 text-[#E87A2C]'
                                }`}>
                                    <p className={`text-[9px] font-black uppercase tracking-widest mb-1 ${i === 0 ? 'text-white/40' : 'text-[#E87A2C]/40'}`}>Pontos de XP</p>
                                    <p className="text-3xl font-black flex items-center justify-center gap-2">
                                        {s.points || 0}
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
