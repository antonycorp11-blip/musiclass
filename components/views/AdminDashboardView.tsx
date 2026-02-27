
import React from 'react';
import { Users, BookOpen, Trash2, RotateCcw } from 'lucide-react';
import { Teacher, Student } from '../../types';

interface AdminDashboardViewProps {
    teachers: Teacher[];
    students: Student[];
    onAddTeacher: () => void;
    onDeleteTeacher: (id: string) => void;
    onResetData: () => void;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
    teachers,
    students,
    onAddTeacher,
    onDeleteTeacher,
    onResetData
}) => {
    return (
        <div className="max-w-7xl mx-auto animate-fade-in space-y-12">
            <header className="mb-12">
                <h2 className="text-5xl font-black text-[#3C2415] tracking-tighter uppercase leading-none">Painel Administrativo</h2>
                <p className="text-sm font-bold text-[#E87A2C] uppercase tracking-[0.3em] mt-2 italic">Gestão da Escola</p>
            </header>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <section className="bg-white rounded-[48px] p-10 border border-[#3C2415]/5 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-xl font-black text-[#3C2415] uppercase tracking-tighter flex items-center gap-3"><Users className="text-[#E87A2C]" /> Professores</h3>
                        <button onClick={onAddTeacher} className="p-3 bg-[#1A110D] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2">Adicionar</button>
                    </div>
                    <div className="space-y-4">
                        {teachers.map(t => (
                            <div key={t.id} className="bg-[#FBF6F0] p-6 rounded-3xl flex justify-between items-center group">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-[#E87A2C] font-black shadow-sm group-hover:bg-[#E87A2C] group-hover:text-white transition-all">{t.name.charAt(0)}</div>
                                    <div>
                                        <p className="font-black text-[#3C2415] uppercase tracking-tight">{t.name}</p>
                                        <p className="text-[10px] font-bold text-[#3C2415]/40 uppercase tracking-widest">{students.filter(s => s.teacher_id === t.id).length} Alunos • Senha: {t.password}</p>
                                    </div>
                                </div>
                                {t.role !== 'director' && <button onClick={() => onDeleteTeacher(t.id)} className="p-3 text-rose-500 hover:bg-rose-50 rounded-2xl transition-all opacity-0 group-hover:opacity-100"><Trash2 className="w-5 h-5" /></button>}
                            </div>
                        ))}
                    </div>
                </section>
                <section className="bg-white rounded-[48px] p-10 border border-[#3C2415]/5 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-xl font-black text-[#3C2415] uppercase tracking-tighter flex items-center gap-3"><BookOpen className="text-[#E87A2C]" /> Todos os Alunos ({students.length})</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-[#3C2415]/5">
                                    <th className="pb-4 text-[10px] font-black uppercase text-[#3C2415]/30 tracking-widest">Nome</th>
                                    <th className="pb-4 text-[10px] font-black uppercase text-[#3C2415]/30 tracking-widest">Instrumento</th>
                                    <th className="pb-4 text-[10px] font-black uppercase text-[#3C2415]/30 tracking-widest text-right">Idade</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#3C2415]/5">
                                {students.map(s => (
                                    <tr key={s.id} className="group">
                                        <td className="py-4 font-bold text-[#3C2415] uppercase text-sm">{s.name}</td>
                                        <td className="py-4"><span className="text-[9px] font-black px-3 py-1 bg-[#1A110D] text-white rounded-full uppercase italic">{s.instrument}</span></td>
                                        <td className="py-4 text-right font-black text-[#E87A2C] text-sm tabular-nums">{s.age || '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
            <div className="flex justify-center pt-10">
                <button onClick={onResetData} className="px-10 py-5 border border-rose-500/20 text-rose-500 rounded-[32px] font-black text-xs uppercase tracking-widest hover:bg-rose-50 transition-all flex items-center gap-3"><RotateCcw className="w-4 h-4" /> Resetar Banco de Dados (Alunos)</button>
            </div>
        </div>
    );
};
