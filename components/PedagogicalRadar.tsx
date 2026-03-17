
import React from 'react';
import { CurriculumTopic, StudentTopicProgress } from '../types';
import { AlertCircle, CheckCircle2, Star, ChevronRight, BookOpen, Send } from 'lucide-react';
import { useToast } from '../context/ToastContext';

interface PedagogicalRadarProps {
    currentMonthIndex: number;
    lessonCount: number;
    idealTopic: CurriculumTopic | null;
    status: 'ok' | 'action_needed' | 'critical';
    backlogCount: number;
    pendingTopics: CurriculumTopic[];
    appliedTopics?: StudentTopicProgress[];
    progress: StudentTopicProgress[];
    onApply: (topic: CurriculumTopic) => void;
    compact?: boolean;
}

export const PedagogicalRadar: React.FC<PedagogicalRadarProps> = ({
    currentMonthIndex = 1,
    lessonCount = 0,
    idealTopic = null,
    status = 'ok',
    backlogCount = 0,
    pendingTopics = [],
    progress = [],
    appliedTopics = [],
    onApply,
    compact = false
}) => {
    const { showToast } = useToast();
    const handleCopyQuizLink = (token: string) => {
        const link = `${window.location.origin}/?quiz=${token}`;
        try {
            navigator.clipboard.writeText(link);
            showToast("Link do questionário copiado!", "success");
        } catch (e) {
            const textArea = document.createElement("textarea");
            textArea.value = link;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            showToast("Link copiado!", "success");
        }
    };

    if (status === 'ok' && !idealTopic && pendingTopics.length === 0 && (appliedTopics || []).length === 0) return null;

    return (
        <div className={`rounded-[40px] border shadow-xl transition-all animate-fade-in ${status === 'critical' ? 'bg-rose-50 border-rose-100' :
                status === 'action_needed' ? 'bg-orange-50 border-orange-100' : 'bg-emerald-50 border-emerald-100'
            } ${compact ? 'p-6 w-full' : 'p-8'}`}>
            <div className={`flex ${compact ? 'flex-col gap-6' : 'flex-col md:flex-row gap-8'} items-start`}>
                <div className={`flex-shrink-0 flex items-center justify-center ${compact ? 'w-full' : ''}`}>
                    <div className={`${compact ? 'w-14 h-14' : 'w-20 h-20'} rounded-3xl flex items-center justify-center shadow-lg ${status === 'critical' ? 'bg-rose-500 text-white' :
                            status === 'action_needed' ? 'bg-[#E87A2C] text-white' : 'bg-emerald-500 text-white'
                        }`}>
                        {status === 'critical' ? <AlertCircle className={compact ? "w-6 h-6" : "w-10 h-10"} /> :
                            status === 'action_needed' ? <Star className={compact ? "w-6 h-6" : "w-10 h-10"} /> : <CheckCircle2 className={compact ? "w-6 h-6" : "w-10 h-10"} />}
                    </div>
                </div>

                <div className={`flex-grow space-y-4 ${compact ? 'text-center w-full' : ''}`}>
                    <div>
                        <div className={`flex items-center gap-2 mb-1 ${compact ? 'justify-center' : ''}`}>
                            <span className={`text-[9px] font-black uppercase tracking-widest ${status === 'critical' ? 'text-rose-600' :
                                    status === 'action_needed' ? 'text-[#E87A2C]' : 'text-emerald-600'
                                }`}>
                                {status === 'critical' ? '⚠️ Atraso' :
                                    status === 'action_needed' ? '📅 Novo Ciclo' : '✅ Em Dia'}
                            </span>
                            <span className="text-stone-300">•</span>
                            <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">
                                M{currentMonthIndex} (Aula {lessonCount})
                            </span>
                        </div>
                        <h3 className={`${compact ? 'text-lg' : 'text-2xl'} font-black text-[#3C2415] uppercase tracking-tighter leading-tight`}>
                            {status === 'critical' ? `Faltam ${backlogCount} matérias` :
                                idealTopic ? idealTopic.title : 'Tudo em dia'}
                        </h3>
                    </div>

                    <div className={`flex flex-wrap gap-2 ${compact ? 'justify-center' : ''}`}>
                        {idealTopic && (
                            <button
                                onClick={() => onApply(idealTopic)}
                                className={`${compact ? 'px-4 py-3 text-[9px]' : 'px-6 py-4 text-xs'} bg-[#E87A2C] text-white rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-orange-500/20 flex items-center gap-2 hover:scale-105 transition-all`}
                            >
                                <BookOpen className="w-3.5 h-3.5" /> {compact ? 'Aplicar Próxima' : `Aplicar: ${idealTopic.title}`}
                            </button>
                        )}

                        {pendingTopics.map(t => (
                            <button
                                key={t.id}
                                onClick={() => onApply(t)}
                                className={`bg-white/80 hover:bg-white border border-stone-200/50 flex items-center gap-2 transition-all group ${compact ? 'px-3 py-2 rounded-xl' : 'px-5 py-3 rounded-2xl'}`}
                            >
                                <div className="text-[9px] font-black text-[#E87A2C]">M{t.month_index}</div>
                                <div className="text-left">
                                    <p className={`${compact ? 'text-[10px]' : 'text-xs'} font-bold text-[#3C2415] line-clamp-1`}>{t.title}</p>
                                </div>
                            </button>
                        ))}

                        {/* Lista de matérias aplicadas aguardando quiz */}
                        {(appliedTopics || []).map(t => (
                            <div key={t.id} className={`bg-white/50 border border-stone-200/30 flex items-center gap-3 ${compact ? 'px-3 py-2 rounded-xl w-full' : 'px-4 py-3 rounded-2xl'}`}>
                                <div className="text-left flex-grow">
                                    <p className="text-[8px] font-black text-stone-400 uppercase tracking-tighter">Aguardando Quiz</p>
                                    <p className={`${compact ? 'text-[10px]' : 'text-xs'} font-bold text-[#3C2415] line-clamp-1`}>{t.topic?.title}</p>
                                </div>
                                <button
                                    onClick={() => handleCopyQuizLink(t.qr_code_token || '')}
                                    className="p-2 bg-[#1A110D] text-white rounded-xl hover:bg-stone-800 transition-all"
                                >
                                    <Send className="w-3 h-3" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
