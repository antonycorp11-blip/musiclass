
import React from 'react';
import { Upload, RefreshCw, Plus } from 'lucide-react';
import { Logo } from '../Logo';
import { Student, Instrument } from '../../types';

interface StudentsViewProps {
    teacherStudents: Student[];
    onSelectStudent: (student: Student) => void;
    onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onEmusysSync: () => void;
    onAddStudentClick: () => void;
}

export const StudentsView: React.FC<StudentsViewProps> = ({
    teacherStudents,
    onSelectStudent,
    onFileUpload,
    onEmusysSync,
    onAddStudentClick
}) => {
    return (
        <div className="max-w-6xl mx-auto animate-fade-in">
            {/* Logo Mobile Only */}
            <div className="md:hidden flex items-center justify-between mb-8 px-2">
                <Logo size="sm" />
                <div className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
            </div>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12 md:mb-16">
                <div className="w-full md:w-auto">
                    <h2 className="text-3xl md:text-5xl font-black text-[#3C2415] tracking-tighter uppercase leading-tight md:leading-none">Meus Alunos</h2>
                    <p className="text-[10px] md:text-sm font-bold text-[#E87A2C] uppercase tracking-[0.2em] md:tracking-[0.3em] mt-1 md:mt-2 italic">Gerencie sua agenda de aulas</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                    <label className="cursor-pointer bg-white border border-[#3C2415]/10 px-6 py-3.5 md:py-4 rounded-2xl md:rounded-3xl flex items-center justify-center gap-3 shadow-sm hover:shadow-xl hover:border-[#E87A2C]/20 transition-all font-black text-[10px] md:text-xs uppercase tracking-widest text-[#3C2415]/60 flex-1 sm:flex-none">
                        <Upload className="w-4 h-4 text-[#E87A2C]" /> Subir Planilha
                        <input type="file" onChange={onFileUpload} accept=".xlsx, .xls" className="hidden" />
                    </label>
                    <button onClick={onEmusysSync} className="bg-white border-2 border-[#E87A2C] text-[#E87A2C] px-6 py-3.5 md:py-4 rounded-2xl md:rounded-3xl flex items-center justify-center gap-3 shadow-sm hover:bg-[#E87A2C] hover:text-white transition-all font-black text-[10px] md:text-xs uppercase tracking-widest flex-1 sm:flex-none">
                        <RefreshCw className="w-4 h-4" /> Sincronizar Emusys
                    </button>
                    <button onClick={onAddStudentClick} className="bg-[#1A110D] text-white px-6 py-3.5 md:py-4 rounded-2xl md:rounded-3xl flex items-center justify-center gap-3 shadow-xl hover:bg-[#3C2415] transition-all font-black text-[10px] md:text-xs uppercase tracking-widest flex-1 sm:flex-none">
                        <Plus className="w-4 h-4" /> Novo Aluno
                    </button>
                </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 pb-20">
                {teacherStudents.map(student => (
                    <div key={student.id} onClick={() => onSelectStudent(student)} className="group bg-white p-8 rounded-[48px] border border-[#3C2415]/5 shadow-sm hover:shadow-2xl transition-all duration-500 cursor-pointer relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-[#E87A2C]/5 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-700" />
                        <div className="w-16 h-16 bg-[#FBF6F0] rounded-[24px] flex items-center justify-center text-[#E87A2C] text-2xl font-black mb-6 group-hover:bg-[#E87A2C] group-hover:text-white transition-all duration-500">{student.name.charAt(0)}</div>
                        <h4 className="font-black text-[#3C2415] text-2xl tracking-tighter uppercase mb-1">{student.name}</h4>
                        <div className="flex items-center gap-2 mb-6">
                            <span className="text-[9px] font-black uppercase tracking-widest px-3 py-1 bg-[#1A110D] text-white rounded-full">{student.instrument}</span>
                            <span className="text-[9px] font-black uppercase tracking-widest px-3 py-1 bg-white border border-[#3C2415]/10 text-[#3C2415] rounded-full">{student.level}</span>
                        </div>

                        {/* Barra de Progresso do Contrato */}
                        {student.contract_total && student.contract_total > 0 && (
                            <div className="space-y-2 mt-auto">
                                <div className="flex justify-between items-end">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-[#3C2415]/30">Progresso</span>
                                    <span className="text-[11px] font-black text-[#E87A2C]">{student.lesson_count}/{student.contract_total} <span className="text-[8px] opacity-50">aulas</span></span>
                                </div>
                                <div className="h-1.5 w-full bg-[#3C2415]/5 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-[#E87A2C] transition-all duration-1000 ease-out rounded-full"
                                        style={{ width: `${Math.min(100, (student.lesson_count || 0) / student.contract_total * 100)}%` }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                ))}
                {teacherStudents.length === 0 && (
                    <div className="col-span-full py-20 text-center opacity-20 font-black uppercase text-xs tracking-[0.5em]">Nenhum aluno cadastrado para você</div>
                )}
            </div>
        </div>
    );
};
