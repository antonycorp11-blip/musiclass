
import React, { useState } from 'react';
import { Teacher } from '../types';
import { User, KeyRound, ChevronRight, Music, Plus, X } from 'lucide-react';

interface LoginProps {
    teachers: Teacher[];
    onLogin: (teacher: Teacher) => void;
}

export const Login: React.FC<LoginProps> = ({ teachers, onLogin }) => {
    const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedTeacher && password === selectedTeacher.password) {
            onLogin(selectedTeacher);
            setError('');
        } else {
            setError('Senha incorreta. Tente novamente.');
            setPassword('');
        }
    };


    if (selectedTeacher) {
        return (
            <div className="min-h-screen bg-[#FBF6F0] flex items-center justify-center p-6 bg-cover bg-center" style={{ backgroundImage: 'radial-gradient(circle at top right, rgba(232, 122, 44, 0.05), transparent)' }}>
                <div className="bg-white p-10 rounded-[48px] shadow-2xl border border-[#3C2415]/5 w-full max-w-md animate-fade-in">
                    <button
                        onClick={() => { setSelectedTeacher(null); setPassword(''); setError(''); }}
                        className="text-[#3C2415]/40 hover:text-[#E87A2C] font-black text-[10px] uppercase tracking-widest mb-8 flex items-center gap-2"
                    >
                        ← Voltar para a lista
                    </button>

                    <div className="flex flex-col items-center mb-10">
                        <div className="w-24 h-24 bg-[#E87A2C] rounded-[32px] flex items-center justify-center text-white text-4xl font-black mb-4 shadow-xl shadow-orange-500/20">
                            {selectedTeacher.name.charAt(0)}
                        </div>
                        <h2 className="text-3xl font-black text-[#3C2415] tracking-tighter uppercase">{selectedTeacher.name}</h2>
                        <p className="text-xs font-bold text-[#E87A2C] uppercase tracking-widest mt-1">Digite sua senha de acesso</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="relative">
                            <KeyRound className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-[#3C2415]/30" />
                            <input
                                type="password"
                                autoFocus
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full bg-[#FBF6F0] border-none rounded-3xl pl-16 pr-6 py-5 focus:ring-2 focus:ring-[#E87A2C] transition-all font-bold text-lg"
                            />
                        </div>
                        {error && <p className="text-rose-500 text-xs font-bold text-center uppercase tracking-wider">{error}</p>}
                        <button className="w-full bg-[#1A110D] text-white py-6 rounded-[32px] font-black text-lg hover:bg-[#3C2415] transition-all shadow-xl shadow-stone-900/20 flex items-center justify-center gap-3 group">
                            ENTRAR NO PAINEL <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FBF6F0] flex flex-col items-center justify-center p-6 md:p-12 overflow-x-hidden">
            <div className="text-center mb-16 max-w-2xl">
                <div className="w-20 h-20 bg-[#E87A2C] rounded-[28px] flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-orange-500/20 animate-bounce">
                    <Music className="w-10 h-10 text-white" />
                </div>
                <h1 className="text-5xl md:text-7xl font-black text-[#3C2415] tracking-tighter mb-4 leading-none">MUSICLASS</h1>
                <p className="text-sm md:text-lg font-bold text-[#3C2415]/40 uppercase tracking-[0.4em]">Selecione seu perfil abaixo</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 w-full max-w-6xl">
                {teachers.map(teacher => (
                    <div
                        key={teacher.id}
                        onClick={() => setSelectedTeacher(teacher)}
                        className="group cursor-pointer"
                    >
                        <div className="bg-white p-8 rounded-[48px] border border-[#3C2415]/5 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 flex flex-col items-center text-center">
                            <div className="w-20 h-20 bg-[#FBF6F0] text-[#3C2415] rounded-[32px] flex items-center justify-center text-3xl font-black mb-6 group-hover:bg-[#E87A2C] group-hover:text-white transition-all duration-500">
                                {teacher.name.charAt(0)}
                            </div>
                            <h3 className="text-2xl font-black text-[#3C2415] tracking-tight uppercase group-hover:text-[#E87A2C] transition-colors">{teacher.name}</h3>
                            <p className="text-[10px] font-black text-[#3C2415]/30 uppercase tracking-[0.2em] mt-2 group-hover:text-[#E87A2C]/60">Clique para acessar</p>
                        </div>
                    </div>
                ))}

            </div>

            <div className="mt-20 flex flex-col items-center opacity-20">
                <img src="/Logo-Laranja.png" alt="Logo" className="h-12 object-contain grayscale" />
                <p className="text-[10px] font-black uppercase mt-4 tracking-widest leading-none text-[#3C2415]">MusiClass Technology 2024</p>
            </div>
        </div>
    );
};
