import React, { useState } from 'react';
import { Metronome } from './tools/Metronome';
import { Timer } from './tools/Timer';
import { Tuner } from './tools/Tuner';
import { Whiteboard } from './tools/Whiteboard';
import { Music, Clock, Activity, Palette } from 'lucide-react';

export const Toolbox: React.FC = () => {
    const [activeTool, setActiveTool] = useState<'metronome' | 'timer' | 'tuner' | 'whiteboard'>('metronome');

    const tools = [
        { id: 'metronome', name: 'Metrônomo', icon: Music, color: 'text-blue-500' },
        { id: 'timer', name: 'Timer', icon: Clock, color: 'text-purple-500' },
        { id: 'tuner', name: 'Afinador', icon: Activity, color: 'text-emerald-500' },
        { id: 'whiteboard', name: 'Quadro', icon: Palette, color: 'text-orange-500' },
    ] as const;

    return (
        <div className="flex flex-col gap-8 h-full">
            {/* Tool Selection Tabs */}
            <div className="flex flex-wrap gap-4">
                {tools.map((tool) => (
                    <button
                        key={tool.id}
                        onClick={() => setActiveTool(tool.id)}
                        className={`
                            flex items-center gap-3 px-6 py-4 rounded-[24px] font-black text-xs uppercase tracking-widest transition-all
                            ${activeTool === tool.id
                                ? 'bg-[#1A110D] text-white shadow-xl shadow-stone-900/10 scale-105'
                                : 'bg-white text-stone-400 border border-stone-100 hover:bg-stone-50 hover:text-stone-600'}
                        `}
                    >
                        <tool.icon className={`w-4 h-4 ${activeTool === tool.id ? 'text-[#E87A2C]' : tool.color}`} />
                        {tool.name}
                    </button>
                ))}
            </div>

            {/* Tool Container */}
            <div className="relative flex-grow min-h-[500px]">
                {activeTool === 'metronome' && (
                    <div className="animate-fade-in grid grid-cols-1 md:grid-cols-2 gap-8">
                        <Metronome />
                        <div className="bg-[#1A110D] p-10 rounded-[32px] text-white flex flex-col justify-center gap-6">
                            <h4 className="text-xl font-black uppercase tracking-tighter">Dica do Professor</h4>
                            <p className="text-stone-400 text-sm leading-relaxed">
                                Use o metrônomo para garantir que o aluno mantenha o pulso estável. O modo <b>VOZ</b> é ideal para iniciantes que ainda estão aprendendo a contar os tempos do compasso.
                            </p>
                            <div className="flex gap-4">
                                <div className="p-4 bg-white/5 rounded-2x border border-white/10 text-[10px] font-bold uppercase tracking-widest">Estabilidade</div>
                                <div className="p-4 bg-white/5 rounded-2x border border-white/10 text-[10px] font-bold uppercase tracking-widest">Precisão</div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTool === 'timer' && (
                    <div className="animate-fade-in grid grid-cols-1 md:grid-cols-2 gap-8">
                        <Timer />
                        <div className="bg-[#E87A2C] p-10 rounded-[32px] text-white flex flex-col justify-center gap-6 shadow-xl shadow-orange-500/20">
                            <h4 className="text-xl font-black uppercase tracking-tighter">Gestão de Tempo</h4>
                            <p className="text-orange-950/70 text-sm leading-relaxed font-bold">
                                Cronometre exercícios técnicos para gerar foco total. Recomendo séries de 1 ou 5 minutos para treinos de repetição (loops).
                            </p>
                            <div className="w-16 h-1 bg-white/30 rounded-full" />
                        </div>
                    </div>
                )}

                {activeTool === 'tuner' && (
                    <div className="animate-fade-in h-full">
                        <Tuner />
                    </div>
                )}

                {activeTool === 'whiteboard' && (
                    <div className="animate-fade-in h-[700px]">
                        <Whiteboard />
                    </div>
                )}
            </div>
        </div>
    );
};
