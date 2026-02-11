import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Clock } from 'lucide-react';

export const Timer: React.FC = () => {
    const [seconds, setSeconds] = useState(0);
    const [isActive, setIsActive] = useState(false);
    const [initialTime, setInitialTime] = useState(0); // em segundos

    const intervalRef = useRef<number | null>(null);

    useEffect(() => {
        if (isActive && seconds > 0) {
            intervalRef.current = window.setInterval(() => {
                setSeconds(s => s - 1);
            }, 1000);
        } else if (seconds === 0 && isActive) {
            setIsActive(false);
            if (intervalRef.current) clearInterval(intervalRef.current);
            // Alerta sonoro básico
            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const osc = audioCtx.createOscillator();
            osc.connect(audioCtx.destination);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.5);
        }
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [isActive, seconds]);

    const formatTime = (totalSeconds: number) => {
        const mins = Math.floor(totalSeconds / 60);
        const secs = totalSeconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const addMinutes = (mins: number) => {
        const newSeconds = seconds + (mins * 60);
        setSeconds(newSeconds);
        setInitialTime(newSeconds);
    };

    const resetTimer = () => {
        setIsActive(false);
        setSeconds(0);
        setInitialTime(0);
    };

    return (
        <div className="bg-stone-50 p-8 rounded-[32px] border border-stone-100 space-y-8 h-full flex flex-col justify-between">
            <div className="flex items-center justify-between">
                <h3 className="font-black uppercase text-xs tracking-widest text-stone-400">Temporizador de Atividade</h3>
                <Clock className="w-4 h-4 text-stone-300" />
            </div>

            <div className="text-center space-y-4 py-6">
                <div className={`text-8xl font-black tracking-tighter transition-all ${seconds < 10 && seconds > 0 ? 'text-red-500 scale-110' : 'text-[#1A110D]'}`}>
                    {formatTime(seconds)}
                </div>
                {isActive && (
                    <div className="w-full bg-stone-200 h-1.5 rounded-full overflow-hidden">
                        <div
                            className="bg-[#E87A2C] h-full transition-all duration-1000 ease-linear"
                            style={{ width: `${(seconds / initialTime) * 100}%` }}
                        />
                    </div>
                )}
            </div>

            {!isActive && seconds === 0 && (
                <div className="grid grid-cols-3 gap-3">
                    {[1, 5, 10, 15, 20, 30].map(m => (
                        <button
                            key={m}
                            onClick={() => addMinutes(m)}
                            className="py-3 bg-white border border-stone-200 rounded-xl font-black text-xs text-stone-600 hover:bg-orange-50 hover:border-orange-200 transition-all"
                        >
                            +{m} MIN
                        </button>
                    ))}
                </div>
            )}

            <div className="flex gap-4">
                <button
                    onClick={() => setIsActive(!isActive)}
                    disabled={seconds === 0}
                    className={`flex-grow py-5 rounded-2xl flex items-center justify-center gap-3 transition-all ${isActive ? 'bg-stone-800 text-white' : 'bg-[#E87A2C] text-white shadow-lg shadow-orange-500/20 disabled:opacity-30'}`}
                >
                    {isActive ? <Pause className="fill-current" /> : <Play className="fill-current" />}
                    <span className="font-black uppercase tracking-widest text-xs">{isActive ? 'PAUSAR' : 'PLAY'}</span>
                </button>
                <button
                    onClick={resetTimer}
                    className="p-5 bg-white border border-stone-200 rounded-2xl text-stone-400 hover:text-red-500 transition-all"
                >
                    <RotateCcw className="w-6 h-6" />
                </button>
            </div>
        </div>
    );
};
