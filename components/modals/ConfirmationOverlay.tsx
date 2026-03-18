
import React from 'react';
import { CheckCircle2 } from 'lucide-react';

interface ConfirmationOverlayProps {
    student: string;
    inst: string;
    session: number;
    onClose: () => void;
}

export const ConfirmationOverlay: React.FC<ConfirmationOverlayProps> = ({ student, inst, session, onClose }) => {
    return (
        <div className="fixed inset-0 z-[200] bg-[#1A110D] flex items-center justify-center p-6 text-center animate-fade-in">
            <div className="max-w-md w-full space-y-8">
                <div className="relative">
                    <div className="absolute inset-0 bg-emerald-500 blur-[100px] opacity-20" />
                    <div className="w-24 h-24 bg-emerald-500 rounded-[32px] flex items-center justify-center mx-auto shadow-2xl relative">
                        <CheckCircle2 className="w-12 h-12 text-white" />
                    </div>
                </div>

                <div className="space-y-4">
                    <h2 className="text-4xl font-black text-white uppercase tracking-tighter">Parabéns, {student}!</h2>
                    <p className="text-stone-400 font-bold uppercase tracking-widest text-[10px]">Treino de {inst} Confirmado</p>

                    <div className="bg-white/5 border border-white/10 p-6 rounded-[32px] space-y-2">
                        <p className="text-emerald-400 font-black text-xs uppercase tracking-[0.2em]">Sessão #{session} Concluída</p>
                        <p className="text-stone-500 text-[11px] leading-relaxed">
                            Sua dedicação é o que faz a evolução acontecer. <br />
                            Seu professor já recebeu sua confirmação em tempo real!
                        </p>
                    </div>
                </div>

                <button
                    onClick={() => {
                        onClose();
                        window.close();
                    }}
                    className="w-full py-5 bg-[#E87A2C] hover:bg-orange-600 text-white rounded-[24px] font-black uppercase tracking-widest transition-all shadow-xl shadow-orange-500/20"
                >
                    FECHAR A PÁGINA
                </button>
                <p className="text-stone-500 text-[9px] uppercase tracking-widest mt-4">Sua confirmação foi salva. Você já pode fechar esta tela.</p>

            </div>
        </div>
    );
};
