
import React from 'react';

interface InstallPromptProps {
    onInstall: () => void;
    onClose: () => void;
}

export const InstallPrompt: React.FC<InstallPromptProps> = ({ onInstall, onClose }) => {
    return (
        <div className="fixed inset-0 bg-[#1A110D]/60 backdrop-blur-md z-[200] flex items-end md:items-center justify-center p-4">
            <div className="bg-white rounded-[48px] p-10 w-full max-w-md shadow-2xl animate-in fade-in slide-in-from-bottom-10 border border-[#3C2415]/5">
                <div className="flex flex-col items-center text-center">
                    <div className="w-24 h-24 bg-[#E87A2C] rounded-[32px] flex items-center justify-center mb-6 shadow-xl shadow-orange-500/20">
                        <img src="/assets/icon-512.png" alt="MusiClass Icon" className="w-16 h-16 rounded-xl" />
                    </div>
                    <h3 className="text-3xl font-black text-[#1A110D] tracking-tighter uppercase mb-4">MusiClass no seu Tablet</h3>
                    <p className="text-sm font-bold text-stone-500 uppercase tracking-widest leading-relaxed mb-8">Instale agora para acessar suas aulas direto da tela inicial, com desempenho superior.</p>
                    <div className="flex flex-col w-full gap-3">
                        <button onClick={onInstall} className="w-full bg-[#1A110D] text-white py-6 rounded-[32px] font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:bg-[#3C2415] transition-all">
                            Instalar Aplicativo
                        </button>
                        <button onClick={onClose} className="w-full py-4 text-stone-300 font-bold text-[10px] uppercase tracking-widest hover:text-[#E87A2C]">
                            Agora não
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
