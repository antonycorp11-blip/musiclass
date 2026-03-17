
import React from 'react';
import { Level, Instrument } from '../../types';

interface AddStudentModalProps {
    onClose: () => void;
    onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}

export const AddStudentModal: React.FC<AddStudentModalProps> = ({ onClose, onSubmit }) => {
    return (
        <div className="fixed inset-0 bg-[#3C2415]/40 backdrop-blur-xl flex items-center justify-center z-[100] p-6">
            <div className="bg-white rounded-[64px] p-12 w-full max-w-xl shadow-2xl animate-fade-in">
                <h3 className="text-4xl font-black text-[#3C2415] tracking-tighter uppercase mb-6">Novo Aluno</h3>
                <form onSubmit={onSubmit} className="space-y-6">
                    <input name="name" required className="w-full bg-[#FBF6F0] border-none rounded-[32px] px-8 py-5 font-bold text-[#3C2415]" placeholder="Nome Completo" />
                    <div className="grid grid-cols-2 gap-6">
                        <input name="age" type="number" className="w-full bg-[#FBF6F0] border-none rounded-[32px] px-8 py-5 font-bold text-[#3C2415]" placeholder="Idade" />
                        <select name="level" className="w-full bg-[#FBF6F0] border-none rounded-[32px] px-8 py-5 font-bold text-[#3C2415]">
                            {Object.values(Level).map(l => <option key={l} value={l}>{l}</option>)}
                        </select>
                    </div>
                    <select name="instrument" className="w-full bg-[#FBF6F0] border-none rounded-[32px] px-8 py-5 font-bold text-[#3C2415]">
                        {Object.values(Instrument).map(i => <option key={i} value={i}>{i}</option>)}
                    </select>
                    <button type="submit" className="w-full bg-[#1A110D] text-white py-6 rounded-[32px] font-black text-lg shadow-xl hover:bg-[#3C2415] transition-all">
                        SALVAR ALUNO
                    </button>
                    <button type="button" onClick={onClose} className="w-full text-[#3C2415]/30 font-bold uppercase text-[10px] tracking-widest mt-4">
                        Dispensar
                    </button>
                </form>
            </div>
        </div>
    );
};
