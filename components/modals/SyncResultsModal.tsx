
import React from 'react';
import { X } from 'lucide-react';

interface SyncResultsModalProps {
    syncResults: {
        added: number;
        updated: number;
        removed: number;
        logs: string[];
        missingTeachers: string[];
    };
    onClose: () => void;
}

export const SyncResultsModal: React.FC<SyncResultsModalProps> = ({ syncResults, onClose }) => {
    return (
        <div className="fixed inset-0 bg-[#1A110D]/60 backdrop-blur-md z-[300] flex items-center justify-center p-4">
            <div className="bg-white rounded-[48px] p-10 w-full max-w-2xl shadow-2xl animate-fade-in flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h3 className="text-3xl font-black text-[#1A110D] tracking-tighter uppercase">Resultado da Sincronização</h3>
                        <p className="text-[10px] font-black text-[#E87A2C] uppercase tracking-widest mt-1">Logs de atividades coletados do Emusys</p>
                    </div>
                    <button onClick={onClose} className="p-3 bg-[#FBF6F0] rounded-2xl hover:bg-stone-100 transition-all">
                        <X className="w-6 h-6 text-stone-400" />
                    </button>
                </div>

                <div className="flex gap-4 mb-8">
                    <div className="flex-1 bg-emerald-50 p-4 rounded-3xl border border-emerald-100">
                        <p className="text-[10px] font-black text-emerald-600 uppercase mb-1">Novos</p>
                        <p className="text-2xl font-black text-emerald-700">{syncResults.added}</p>
                    </div>
                    <div className="flex-1 bg-blue-50 p-4 rounded-3xl border border-blue-100">
                        <p className="text-[10px] font-black text-blue-600 uppercase mb-1">Trocas</p>
                        <p className="text-2xl font-black text-blue-700">{syncResults.updated}</p>
                    </div>
                    <div className="flex-1 bg-rose-50 p-4 rounded-3xl border border-rose-100">
                        <p className="text-[10px] font-black text-rose-600 uppercase mb-1">Saídas</p>
                        <p className="text-2xl font-black text-rose-700">{syncResults.removed}</p>
                    </div>
                </div>

                <div className="flex-grow overflow-y-auto space-y-2 pr-4 custom-scrollbar">
                    {syncResults.logs.length > 0 ? (
                        syncResults.logs.map((log, i) => (
                            <div key={i} className="p-4 bg-[#FBF6F0] rounded-2xl text-[11px] font-bold text-[#3C2415]/70 border border-[#3C2415]/5">
                                {log}
                            </div>
                        ))
                    ) : (
                        <div className="py-12 text-center opacity-30 font-black uppercase text-xs tracking-widest">Nenhuma alteração detectada</div>
                    )}
                </div>

                {syncResults.missingTeachers.length > 0 && (
                    <div className="mt-8 p-6 bg-orange-50 rounded-[32px] border border-orange-100">
                        <h4 className="text-[10px] font-black text-orange-600 uppercase tracking-widest mb-3 flex items-center gap-2">⚠️ Professores não cadastrados no MusiClass:</h4>
                        <div className="flex flex-wrap gap-2">
                            {syncResults.missingTeachers.map((t, i) => (
                                <span key={i} className="px-3 py-1 bg-white text-orange-700 text-[10px] font-black rounded-lg border border-orange-200">{t}</span>
                            ))}
                        </div>
                        <p className="text-[9px] font-bold text-orange-600/60 mt-3 italic">* Cadastre estes nomes no painel para que os alunos sejam vinculados automaticamente.</p>
                    </div>
                )}

                <button onClick={onClose} className="mt-8 w-full bg-[#1A110D] text-white py-6 rounded-[32px] font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-[#3C2415] transition-all">CONCLUÍDO</button>
            </div>
        </div>
    );
};
