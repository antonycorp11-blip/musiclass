
import React from 'react';

interface AddTeacherModalProps {
    onClose: () => void;
    onSubmit: (name: string, pass: string) => void;
}

export const AddTeacherModal: React.FC<AddTeacherModalProps> = ({ onClose, onSubmit }) => {
    return (
        <div className="fixed inset-0 bg-[#3C2415]/40 backdrop-blur-xl flex items-center justify-center z-[200] p-6">
            <div className="bg-white rounded-[64px] p-12 w-full max-w-lg shadow-2xl animate-fade-in">
                <h3 className="text-3xl font-black text-[#3C2415] tracking-tighter uppercase mb-2">Novo Professor</h3>
                <p className="text-[10px] font-black text-[#E87A2C] uppercase mb-8 tracking-widest">Crie uma conta de acesso para um colega</p>
                <form onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    onSubmit(formData.get('name') as string, formData.get('pass') as string);
                }} className="space-y-6">
                    <input name="name" required className="w-full bg-[#FBF6F0] border-none rounded-3xl px-8 py-5 font-bold" placeholder="Nome do Professor" />
                    <input name="pass" required maxLength={4} className="w-full bg-[#FBF6F0] border-none rounded-3xl px-8 py-5 font-bold" placeholder="Senha (4 números)" />
                    <button type="submit" className="w-full bg-[#E87A2C] text-white py-5 rounded-3xl font-black text-lg shadow-xl">CADASTRAR</button>
                    <button type="button" onClick={onClose} className="w-full text-stone-400 font-bold text-xs uppercase py-2">Cancelar</button>
                </form>
            </div>
        </div>
    );
};
