import React from 'react';
import { Users, BookOpen, Trash2, RotateCcw, Layout } from 'lucide-react';
import { Teacher, Student } from '../../types';

interface AdminDashboardViewProps {
    teachers: Teacher[];
    students: Student[];
    onAddTeacher: () => void;
    onDeleteTeacher: (id: string) => void;
    onResetData: () => void;
    onResetQuizzes?: () => void;
    schoolConfig: any;
    onUpdateConfig: (config: any) => void;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
    teachers,
    students,
    onAddTeacher,
    onDeleteTeacher,
    onResetData,
    onResetQuizzes,
    schoolConfig,
    onUpdateConfig
}) => {
    const updateConfig = (key: string, value: any) => {
        onUpdateConfig({ ...schoolConfig, [key]: value });
    };

    const resetConfig = () => {
        onUpdateConfig({
            headerPaddingH: 48,
            headerPaddingV: 32,
            logoHeight: 48,
            studentFontSize: 24,
            teacherFontSize: 14,
            logoOffset: 0,
            studentOffset: 0,
            teacherOffset: 0,
            badgeOffset: 0,
            badgeY: 0,
            badgeScale: 1,
            spacing: 24,
            dividerColor: '#E87A2C66',
            showMusiClass: true
        });
    };
    return (
        <div className="max-w-7xl mx-auto animate-fade-in space-y-12">
            <header className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h2 className="text-5xl font-black text-[#3C2415] tracking-tighter uppercase leading-none">Painel Administrativo</h2>
                    <p className="text-sm font-bold text-[#E87A2C] uppercase tracking-[0.3em] mt-2 italic">Gestão da Escola</p>
                </div>
                <div className="flex gap-4">
                    <button onClick={onResetData} className="px-6 py-3 border border-rose-500/20 text-rose-500 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-50 transition-all flex items-center gap-2 italic">
                        <RotateCcw className="w-3.5 h-3.5" /> Limpar Alunos
                    </button>
                </div>
            </header>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* PDF Layout Config (The "Editor") */}
                <section className="bg-white rounded-[48px] p-10 border border-[#3C2415]/5 shadow-sm space-y-8">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-black text-[#3C2415] uppercase tracking-tighter flex items-center gap-3">
                            <Layout className="text-[#E87A2C]" /> Design do PDF
                        </h3>
                        <button onClick={resetConfig} className="text-[9px] font-black text-[#3C2415]/30 hover:text-[#E87A2C] uppercase tracking-widest transition-colors">Resetar Padrão</button>
                    </div>

                    <p className="text-[10px] font-bold text-[#3C2415]/40 uppercase tracking-widest leading-loose">
                        Ajuste como os PDFs de todos os professores serão gerados. Use para evitar sobreposições e manter a marca.
                    </p>

                    {/* Previa ao Vivo */}
                    <div className="space-y-2">
                        <label className="text-[8px] font-black text-[#E87A2C] uppercase tracking-widest block">Prévia em Tempo Real (Cabeçalho)</label>
                        <div className="bg-[#1A110D] rounded-3xl border border-[#3C2415]/10 overflow-hidden shadow-xl scale-[0.6] origin-top-left -mb-[80px]" style={{ width: '800px' }}>
                            <div className="bg-[#1A110D] border-b-[4px] border-[#E87A2C]">
                                <div 
                                    className="flex flex-row items-center gap-0"
                                    style={{ padding: `${schoolConfig?.headerPaddingV || 32}px ${schoolConfig?.headerPaddingH || 48}px` }}
                                >
                                    <div 
                                        className="flex flex-col shrink-0 pr-10"
                                        style={{ transform: `translateX(${schoolConfig?.logoOffset || 0}px)` }}
                                    >
                                        <img src="/Logo-Laranja.png" alt="Logo" className="w-auto object-contain self-start" style={{ height: `${schoolConfig?.logoHeight || 48}px`, marginBottom: (schoolConfig?.showMusiClass !== false) ? '8px' : '0' }} />
                                        {(schoolConfig?.showMusiClass !== false) && (
                                            <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] font-sans ml-1">MusiClass</span>
                                        )}
                                    </div>
                                    <div className="h-10 w-[2px] bg-[#E87A2C]/40 shrink-0" />
                                        <div className="flex-1 flex flex-col justify-center px-6 min-w-0" style={{ transform: `translateX(${schoolConfig?.studentOffset || 0}px)` }}>
                                            <div className="mb-1">
                                                <span className="font-black text-white uppercase tracking-tight leading-none block" style={{ fontSize: `${schoolConfig?.studentFontSize || 24}px` }}>
                                                    Nome do Aluno
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-3 relative">
                                                <span className="text-[10px] font-bold text-[#E87A2C] uppercase tracking-widest leading-none">
                                                    {new Date().toLocaleDateString('pt-BR')}
                                                </span>
                                                <div 
                                                    className="inline-flex items-center h-6 px-3 bg-[#E87A2C] rounded-md shrink-0 shadow-lg shadow-orange-500/20 relative"
                                                    style={{ 
                                                        left: `${schoolConfig?.badgeOffset || 0}px`,
                                                        top: `${schoolConfig?.badgeY || 0}px`,
                                                        transform: `scale(${schoolConfig?.badgeScale || 1})`,
                                                        transformOrigin: 'left center'
                                                    }}
                                                >
                                                    <span className="text-[9px] font-black text-[#1A110D] uppercase tracking-tight leading-none pt-[1px]">Aula 11/24</span>
                                                </div>
                                            </div>
                                        </div>
                                    <div className="h-10 w-[1px] bg-white/10 shrink-0 mx-8" />
                                    <div className="shrink-0 text-right flex flex-col justify-center w-[180px]" style={{ transform: `translateX(${schoolConfig?.teacherOffset || 0}px)` }}>
                                        <span className="text-[8px] font-bold text-white/30 uppercase tracking-[0.15em] mb-1 leading-none">Instrutor</span>
                                        <span className="font-black text-white/70 uppercase tracking-tight leading-tight" style={{ fontSize: `${schoolConfig?.teacherFontSize || 14}px` }}>
                                            Prof. Exemplo
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-3">
                            <label className="text-[9px] font-black text-[#3C2415]/60 uppercase tracking-widest flex justify-between">
                                Altura da Logo <span>{schoolConfig?.logoHeight || 48}px</span>
                            </label>
                            <input 
                                type="range" min="30" max="100" 
                                value={schoolConfig?.logoHeight || 48} 
                                onChange={(e) => updateConfig('logoHeight', parseInt(e.target.value))}
                                className="w-full accent-[#E87A2C]" 
                            />
                        </div>

                        <div className="space-y-3">
                            <label className="text-[9px] font-black text-[#3C2415]/60 uppercase tracking-widest flex justify-between">
                                Fonte do Aluno <span>{schoolConfig?.studentFontSize || 24}px</span>
                            </label>
                            <input 
                                type="range" min="14" max="40" 
                                value={schoolConfig?.studentFontSize || 24} 
                                onChange={(e) => updateConfig('studentFontSize', parseInt(e.target.value))}
                                className="w-full accent-[#E87A2C]" 
                            />
                        </div>

                        <div className="space-y-3">
                            <label className="text-[9px] font-black text-[#3C2415]/60 uppercase tracking-widest flex justify-between">
                                Fonte do Professor <span>{schoolConfig?.teacherFontSize || 14}px</span>
                            </label>
                            <input 
                                type="range" min="10" max="24" 
                                value={schoolConfig?.teacherFontSize || 14} 
                                onChange={(e) => updateConfig('teacherFontSize', parseInt(e.target.value))}
                                className="w-full accent-[#E87A2C]" 
                            />
                        </div>

                        <div className="pt-4 border-t border-[#3C2415]/5 space-y-6">
                            <div className="space-y-3">
                                <label className="text-[9px] font-black text-[#3C2415]/60 uppercase tracking-widest flex justify-between">
                                    Ajuste Horizontal Logo <span>{schoolConfig?.logoOffset || 0}px</span>
                                </label>
                                <input 
                                    type="range" min="-100" max="100" 
                                    value={schoolConfig?.logoOffset || 0} 
                                    onChange={(e) => updateConfig('logoOffset', parseInt(e.target.value))}
                                    className="w-full accent-[#3C2415]" 
                                />
                            </div>

                            <div className="space-y-3">
                                <label className="text-[9px] font-black text-[#3C2415]/60 uppercase tracking-widest flex justify-between">
                                    Ajuste Horizontal Aluno <span>{schoolConfig?.studentOffset || 0}px</span>
                                </label>
                                <input 
                                    type="range" min="-100" max="100" 
                                    value={schoolConfig?.studentOffset || 0} 
                                    onChange={(e) => updateConfig('studentOffset', parseInt(e.target.value))}
                                    className="w-full accent-[#3C2415]" 
                                />
                            </div>

                            <div className="space-y-3">
                                <label className="text-[9px] font-black text-[#3C2415]/60 uppercase tracking-widest flex justify-between">
                                    Ajuste Horizontal Professor <span>{schoolConfig?.teacherOffset || 0}px</span>
                                </label>
                                <input 
                                    type="range" min="-200" max="100" 
                                    value={schoolConfig?.teacherOffset || 0} 
                                    onChange={(e) => updateConfig('teacherOffset', parseInt(e.target.value))}
                                    className="w-full accent-[#3C2415]" 
                                />
                            </div>

                            <div className="pt-4 border-t border-[#3C2415]/5 space-y-6">
                                <div className="space-y-3">
                                    <label className="text-[9px] font-black text-[#E87A2C] uppercase tracking-widest flex justify-between">
                                        Deslocar Contador (X) <span>{schoolConfig?.badgeOffset || 0}px</span>
                                    </label>
                                    <input 
                                        type="range" min="-100" max="100" 
                                        value={schoolConfig?.badgeOffset || 0} 
                                        onChange={(e) => updateConfig('badgeOffset', parseInt(e.target.value))}
                                        className="w-full accent-[#E87A2C]" 
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[9px] font-black text-[#E87A2C] uppercase tracking-widest flex justify-between">
                                        Deslocar Contador (Y) <span>{schoolConfig?.badgeY || 0}px</span>
                                    </label>
                                    <input 
                                        type="range" min="-50" max="50" 
                                        value={schoolConfig?.badgeY || 0} 
                                        onChange={(e) => updateConfig('badgeY', parseInt(e.target.value))}
                                        className="w-full accent-[#E87A2C]" 
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[9px] font-black text-[#E87A2C] uppercase tracking-widest flex justify-between">
                                        Tamanho do Contador <span>{Math.round((schoolConfig?.badgeScale || 1) * 100)}%</span>
                                    </label>
                                    <input 
                                        type="range" min="0.5" max="1.5" step="0.1"
                                        value={schoolConfig?.badgeScale || 1} 
                                        onChange={(e) => updateConfig('badgeScale', parseFloat(e.target.value))}
                                        className="w-full accent-[#E87A2C]" 
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-[#FBF6F0] rounded-2xl border border-[#3C2415]/5">
                            <div className="flex flex-col gap-1">
                                <span className="text-[9px] font-black text-[#3C2415] uppercase tracking-widest leading-none">Exibir Label "MusiClass"</span>
                                <span className="text-[7px] font-bold text-[#3C2415]/40 uppercase tracking-tight italic">Abaixo da logo</span>
                            </div>
                            <button 
                                onClick={() => updateConfig('showMusiClass', !schoolConfig?.showMusiClass)}
                                className={`w-10 h-5 rounded-full transition-all relative ${schoolConfig?.showMusiClass ? 'bg-[#E87A2C]' : 'bg-[#3C2415]/10'}`}
                            >
                                <div className={`absolute top-1 w-3 h-3 bg-white rounded-full shadow-sm transition-all ${schoolConfig?.showMusiClass ? 'left-6' : 'left-1'}`} />
                            </button>
                        </div>
                    </div>
                </section>

                <section className="bg-white rounded-[48px] p-10 border border-[#3C2415]/5 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-xl font-black text-[#3C2415] uppercase tracking-tighter flex items-center gap-3"><Users className="text-[#E87A2C]" /> Professores</h3>
                        <button onClick={onAddTeacher} className="p-3 bg-[#1A110D] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-stone-900/20 hover:bg-stone-800 transition-all">Adicionar</button>
                    </div>
                    <div className="space-y-4 max-h-[600px] overflow-y-auto no-scrollbar">
                        {teachers.map(t => (
                            <div key={t.id} className="bg-[#FBF6F0] p-6 rounded-3xl flex justify-between items-center group hover:bg-white hover:shadow-xl transition-all border border-transparent hover:border-[#3C2415]/5">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-[#E87A2C] font-black shadow-sm group-hover:bg-[#E87A2C] group-hover:text-white transition-all transform group-hover:rotate-6">{t.name.charAt(0)}</div>
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

                <section className="bg-white rounded-[48px] p-10 border border-[#3C2415]/5 shadow-sm flex flex-col">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-xl font-black text-[#3C2415] uppercase tracking-tighter flex items-center gap-3"><BookOpen className="text-[#E87A2C]" /> Todos os Alunos ({students.length})</h3>
                    </div>
                    <div className="overflow-x-auto flex-grow h-[600px] no-scrollbar">
                        <table className="w-full text-left">
                            <thead className="sticky top-0 bg-white z-10">
                                <tr className="border-b border-[#3C2415]/5">
                                    <th className="pb-4 text-[10px] font-black uppercase text-[#3C2415]/30 tracking-widest">Nome</th>
                                    <th className="pb-4 text-[10px] font-black uppercase text-[#3C2415]/30 tracking-widest">Instrumento</th>
                                    <th className="pb-4 text-[10px] font-black uppercase text-[#3C2415]/30 tracking-widest text-right">Aulas</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#3C2415]/5">
                                {students.map(s => (
                                    <tr key={s.id} className="group hover:bg-[#FBF6F0]/50 transition-colors">
                                        <td className="py-4 font-bold text-[#3C2415] uppercase text-[11px] md:text-xs">{s.name}</td>
                                        <td className="py-4"><span className="text-[8px] font-black px-3 py-1 bg-[#1A110D] text-white rounded-full uppercase italic tracking-tighter">{s.instrument}</span></td>
                                        <td className="py-4 text-right font-black text-[#E87A2C] text-xs tabular-nums">{s.lesson_count || 0}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        </div>
    );
};
