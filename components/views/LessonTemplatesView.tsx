
import React, { useState } from 'react';
import { Search, Globe, Lock, Play, Trash2, X, Music, User, Users } from 'lucide-react';
import { LessonTemplate, Teacher, Student, Instrument, Level } from '../../types';
import { StudentPreview } from '../StudentPreview';

interface LessonTemplatesViewProps {
    templates: LessonTemplate[];
    currentUser: Teacher;
    students: Student[];
    onApplyTemplate: (template: LessonTemplate, student: Student) => void;
    onDeleteTemplate: (id: string) => void;
    onTogglePublic: (id: string, isPublic: boolean) => void;
    onClose: () => void;
}

export const LessonTemplatesView: React.FC<LessonTemplatesViewProps> = ({
    templates,
    currentUser,
    students,
    onApplyTemplate,
    onDeleteTemplate,
    onTogglePublic,
    onClose
}) => {
    const [search, setSearch] = useState('');
    const [activeTab, setActiveTab] = useState<'my' | 'public'>('my');
    const [selectedInstrument, setSelectedInstrument] = useState<string | null>(null);
    const [previewTemplate, setPreviewTemplate] = useState<LessonTemplate | null>(null);
    const [selectedTemplateForApply, setSelectedTemplateForApply] = useState<LessonTemplate | null>(null);

    const filteredTemplates = templates.filter(t => {
        const matchesSearch = t.title.toLowerCase().includes(search.toLowerCase()) ||
            t.instrument.toLowerCase().includes(search.toLowerCase());
        const matchesTab = activeTab === 'public' ? t.is_public : t.teacher_id === currentUser.id;
        const matchesInstrument = selectedInstrument ? t.instrument === selectedInstrument : true;
        return matchesSearch && matchesTab && matchesInstrument;
    });

    const instrumentos = Array.from(new Set(templates.map(t => t.instrument))).sort();

    return (
        <div className="fixed inset-0 bg-[#1A110D]/60 backdrop-blur-md z-[400] flex items-center justify-center p-4">
            <div className="bg-white rounded-[48px] w-full max-w-5xl h-[90vh] shadow-2xl animate-fade-in flex flex-col overflow-hidden">
                {/* Header */}
                <header className="p-8 md:p-12 border-b border-[#3C2415]/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-[#FBF6F0]/50">
                    <div>
                        <h2 className="text-4xl font-black text-[#3C2415] tracking-tighter uppercase leading-none">Galeria de Aulas</h2>
                        <p className="text-sm font-bold text-[#E87A2C] uppercase tracking-[0.3em] mt-2 italic">Modelos e Compartilhamento</p>
                    </div>
                    <button onClick={onClose} className="p-4 bg-white rounded-2xl shadow-sm hover:bg-rose-50 hover:text-rose-500 transition-all">
                        <X className="w-6 h-6" />
                    </button>
                </header>

                {/* Tabs & Search */}
                <div className="px-8 md:px-12 py-6 flex flex-col md:flex-row gap-6 items-center justify-between border-b border-[#3C2415]/5">
                    <div className="flex bg-[#FBF6F0] p-1.5 rounded-2xl w-full md:w-auto">
                        <button
                            onClick={() => setActiveTab('my')}
                            className={`px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'my' ? 'bg-white text-[#E87A2C] shadow-sm' : 'text-[#3C2415]/30 hover:text-[#3C2415]'}`}
                        >
                            <Lock className="w-3 h-3" /> Minhas Aulas
                        </button>
                        <button
                            onClick={() => setActiveTab('public')}
                            className={`px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'public' ? 'bg-white text-[#E87A2C] shadow-sm' : 'text-[#3C2415]/30 hover:text-[#3C2415]'}`}
                        >
                            <Globe className="w-3 h-3" /> Galeria Geral
                        </button>
                    </div>

                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-[#3C2415]/20" />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Buscar aula ou instrumento..."
                            className="w-full bg-[#FBF6F0] border-none rounded-2xl pl-14 pr-6 py-4 font-bold text-sm focus:ring-2 focus:ring-[#E87A2C]"
                        />
                    </div>
                </div>

                {/* Instrument Filters */}
                <div className="px-8 md:px-12 py-4 flex gap-2 overflow-x-auto no-scrollbar border-b border-[#3C2415]/5 bg-[#FBF6F0]/20 shrink-0">
                    <button
                        onClick={() => setSelectedInstrument(null)}
                        className={`px-4 py-2 rounded-full font-black text-[9px] uppercase tracking-widest whitespace-nowrap transition-all ${!selectedInstrument ? 'bg-[#1A110D] text-white' : 'bg-white text-stone-400 hover:text-[#1A110D]'}`}
                    >
                        Todos
                    </button>
                    {instrumentos.map(inst => (
                        <button
                            key={inst}
                            onClick={() => setSelectedInstrument(inst)}
                            className={`px-4 py-2 rounded-full font-black text-[9px] uppercase tracking-widest whitespace-nowrap transition-all ${selectedInstrument === inst ? 'bg-[#E87A2C] text-white shadow-lg shadow-orange-500/20' : 'bg-white text-stone-400 hover:text-[#1A110D]'}`}
                        >
                            {inst}
                        </button>
                    ))}
                </div>

                {/* Grid */}
                <div className="flex-grow overflow-y-auto p-8 md:p-12 custom-scrollbar">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredTemplates.map(t => (
                            <div
                                key={t.id}
                                onClick={() => setPreviewTemplate(t)}
                                className="group bg-white rounded-[32px] border border-[#3C2415]/5 p-8 hover:shadow-2xl transition-all duration-500 relative flex flex-col h-full cursor-pointer"
                            >
                                <div className="flex justify-between items-start mb-6" onClick={e => e.stopPropagation()}>
                                    <div className="w-12 h-12 bg-[#FBF6F0] rounded-2xl flex items-center justify-center text-[#E87A2C] group-hover:bg-[#E87A2C] group-hover:text-white transition-all">
                                        <Music className="w-6 h-6" />
                                    </div>
                                    <div className="flex gap-2">
                                        {t.teacher_id === currentUser.id && (
                                            <>
                                                <button onClick={() => onTogglePublic(t.id, !t.is_public)} className={`p-2 rounded-lg transition-all ${t.is_public ? 'text-[#E87A2C] bg-orange-50' : 'text-stone-300 bg-stone-50'}`}>
                                                    {t.is_public ? <Globe className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                                                </button>
                                                <button onClick={() => onDeleteTemplate(t.id)} className="p-2 text-rose-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>

                                <h4 className="text-xl font-black text-[#3C2415] uppercase tracking-tight mb-2 leading-tight">{t.title}</h4>
                                <span className="text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1 bg-[#1A110D] text-white rounded-full inline-block mb-4 self-start">{t.instrument}</span>

                                <p className="text-xs text-[#3C2415]/50 font-medium line-clamp-3 mb-8 flex-grow italic">"{t.objective || 'Sem objetivo descrito'}"</p>

                                <div className="flex items-center justify-between pt-6 border-t border-[#3C2415]/5">
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-2 opacity-40">
                                            <User className="w-3 h-3" />
                                            <span className="text-[8px] font-bold uppercase tracking-widest">{t.mc_teachers?.name || 'MusiClass'}</span>
                                        </div>
                                        <div className="flex items-center gap-2 opacity-30">
                                            <Globe className="w-2.5 h-2.5" />
                                            <span className="text-[7px] font-bold uppercase tracking-tight">{t.is_public ? 'Compartilhada' : 'Privada'}</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedTemplateForApply(t);
                                        }}
                                        className="px-6 py-3 bg-[#E87A2C] text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-orange-600 transition-all flex items-center gap-2 shadow-lg shadow-orange-500/10"
                                    >
                                        <Play className="w-3 h-3 fill-current" /> Aplicar
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {filteredTemplates.length === 0 && (
                        <div className="py-32 flex flex-col items-center justify-center text-center opacity-20">
                            <Music className="w-20 h-20 mb-6" />
                            <p className="font-black uppercase tracking-[0.5em] text-sm">Nenhuma aula encontrada nesta galeria</p>
                            <p className="text-xs font-bold mt-2">Salve seus planos de aula para vê-los aqui!</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal de Seleção de Aluno */}
            {selectedTemplateForApply && (
                <div className="fixed inset-0 bg-[#0A0503]/90 backdrop-blur-xl z-[500] flex items-center justify-center p-4" onClick={() => setSelectedTemplateForApply(null)}>
                    <div className="bg-white rounded-[48px] w-full max-w-2xl h-[70vh] shadow-2xl overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
                        <header className="p-10 border-b border-[#3C2415]/5 flex justify-between items-center bg-[#FBF6F0]/30">
                            <div>
                                <h3 className="text-3xl font-black text-[#3C2415] tracking-tighter uppercase leading-none">Vincular Aula</h3>
                                <p className="text-[10px] font-bold text-[#E87A2C] uppercase tracking-[0.3em] mt-2 italic">Aplicando: {selectedTemplateForApply.title}</p>
                            </div>
                            <button onClick={() => setSelectedTemplateForApply(null)} className="p-3 bg-white rounded-xl shadow-sm hover:bg-rose-50 hover:text-rose-500 transition-all">
                                <X className="w-5 h-5" />
                            </button>
                        </header>
                        <div className="flex-grow overflow-y-auto p-10 custom-scrollbar grid grid-cols-1 gap-4">
                            {students.map(s => (
                                <button
                                    key={s.id}
                                    onClick={() => {
                                        onApplyTemplate(selectedTemplateForApply, s);
                                        setSelectedTemplateForApply(null);
                                    }}
                                    className="flex items-center justify-between p-6 bg-[#FBF6F0]/50 hover:bg-[#E87A2C] group rounded-3xl transition-all border border-[#3C2415]/5"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-[#E87A2C] shadow-sm group-hover:scale-110 transition-transform">
                                            <Users className="w-6 h-6" />
                                        </div>
                                        <div className="text-left">
                                            <p className="font-black text-[#3C2415] uppercase tracking-tight group-hover:text-white">{s.name}</p>
                                            <p className="text-[9px] font-bold text-[#3C2415]/30 uppercase tracking-[0.2em] group-hover:text-white/60">{s.instrument}</p>
                                        </div>
                                    </div>
                                    <Play className="w-4 h-4 text-[#E87A2C] group-hover:text-white" />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Preview da Aula (Usando StudentPreview em modo modelo) */}
            {previewTemplate && (
                <StudentPreview
                    studentName="Preview do Modelo"
                    teacherName={currentUser.name}
                    instrument={previewTemplate.instrument}
                    objective={previewTemplate.objective}
                    chords={previewTemplate.report_data.chords || []}
                    scales={previewTemplate.report_data.scales || []}
                    exercises={previewTemplate.report_data.exercises || []}
                    tabs={previewTemplate.report_data.tabs || []}
                    solos={previewTemplate.report_data.solos || []}
                    drums={previewTemplate.report_data.drums}
                    recordings={[]} // Opcional: mostrar audios salvos ?
                    onClose={() => setPreviewTemplate(null)}
                />
            )}
        </div>
    );
};
