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
                    <div className="animate-fade-in h-[600px]">
                        <Metronome />
                    </div>
                )}

                {activeTool === 'timer' && (
                    <div className="animate-fade-in h-[600px]">
                        <Timer />
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
