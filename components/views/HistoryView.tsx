
import React from 'react';
import { Clock, Trash2, X, PlusCircle, Play } from 'lucide-react';
import { Student, Teacher } from '../../types';

interface HistoryViewProps {
    lessonHistory: any[];
    currentUser: Teacher;
    selectedStudent: Student | null;
    students: Student[];
    onSetSelectedStudent: (s: Student | null) => void;
    onOpenLesson: (h: any) => void;
    onDeleteLesson: (id: string) => void;
    onSaveTemplateFromHistory: (h: any) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
    lessonHistory,
    currentUser,
    selectedStudent,
    students,
    onSetSelectedStudent,
    onOpenLesson,
    onDeleteLesson,
    onSaveTemplateFromHistory
}) => {
    return (
        <div className="max-w-6xl mx-auto animate-fade-in space-y-12">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h2 className="text-5xl font-black text-[#3C2415] tracking-tighter uppercase leading-none">Histórico de Aulas</h2>
                    <p className="text-sm font-bold text-[#E87A2C] uppercase tracking-[0.3em] mt-2 italic">Acompanhamento pedagógico</p>
                </div>
                {selectedStudent && (
                    <div className="bg-[#E87A2C] px-6 py-3 rounded-2xl flex items-center gap-4 shadow-xl">
                        <div className="flex flex-col">
                            <span className="text-[8px] font-black text-white/60 uppercase tracking-widest">Filtrando Aluno</span>
                            <p className="text-sm font-black text-white uppercase tracking-tight">{selectedStudent.name}</p>
                        </div>
                        <button onClick={() => onSetSelectedStudent(null)} className="w-8 h-8 bg-white/20 hover:bg-white/40 rounded-full flex items-center justify-center text-white transition-all">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </header>

            <div className="bg-white rounded-[48px] p-10 border border-[#3C2415]/5 shadow-sm overflow-hidden">
                <div className="space-y-6">
                    {lessonHistory
                        .filter(h => {
                            const isAuth = currentUser?.role === 'director' || h.teacher_id === currentUser?.id;
                            const isForStudent = selectedStudent ? h.student_id === selectedStudent.id : true;
                            return isAuth && isForStudent;
                        })
                        .map((h, i) => (
                            <div key={h.id || i} className="flex flex-col md:flex-row justify-between items-start md:items-center p-6 bg-[#FBF6F0] rounded-3xl gap-4 group hover:bg-white hover:shadow-xl transition-all border border-transparent hover:border-orange-100">
                                <div className="flex items-center gap-6">
                                    <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-[#E87A2C] font-black shadow-sm group-hover:bg-[#E87A2C] group-hover:text-white transition-all text-xl">{h.mc_students?.name?.charAt(0) || '?'}</div>
                                    <div>
                                        <h4 className="font-black text-xl text-[#1A110D] uppercase tracking-tighter">{h.mc_students?.name}</h4>
                                        <div className="flex items-center gap-3 mt-1">
                                            <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 bg-[#1A110D] text-white rounded">{h.mc_students?.instrument}</span>
                                            <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(h.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 w-full md:w-auto">
                                    <div className="flex-grow md:flex-grow-0 bg-white/50 px-4 py-3 rounded-2xl border border-stone-100">
                                        <p className="text-[7px] font-black text-stone-300 uppercase tracking-widest mb-1">Pauta</p>
                                        <p className="text-[10px] font-bold text-[#3C2415] line-clamp-1 max-w-[200px]">{h.objective || 'Sem pauta descrita'}</p>
                                    </div>
                                    <button
                                        onClick={() => onOpenLesson(h)}
                                        className="bg-[#1A110D] text-white px-6 py-4 rounded-2xl font-black text-[9px] uppercase tracking-widest hover:bg-[#E87A2C] transition-all shadow-lg shadow-stone-900/10 flex items-center gap-2"
                                    >
                                        <Play className="w-3 h-3 fill-current" /> Abrir
                                    </button>
                                    <button
                                        onClick={() => onSaveTemplateFromHistory(h)}
                                        className="p-4 bg-orange-50 text-[#E87A2C] rounded-2xl hover:bg-[#E87A2C] hover:text-white transition-all border border-orange-100"
                                        title="Salvar como Modelo"
                                    >
                                        <PlusCircle className="w-5 h-5" />
                                    </button>
                                    {(currentUser?.role === 'director' || h.teacher_id === currentUser?.id) && (
                                        <button
                                            onClick={() => onDeleteLesson(h.id)}
                                            className="p-4 bg-red-50 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all border border-red-100"
                                            title="Excluir Aula"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    {lessonHistory.length === 0 && (
                        <div className="py-20 text-center opacity-20 font-black uppercase text-xs tracking-[0.5em]">Nenhuma aula finalizada ainda</div>
                    )}
                </div>
            </div>
        </div>
    );
};
