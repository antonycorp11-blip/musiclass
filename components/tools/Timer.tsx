import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Clock, ChevronUp, ChevronDown } from 'lucide-react';

export const Timer: React.FC = () => {
    const [seconds, setSeconds] = useState(0); // real time remaining
    const [inputMinutes, setInputMinutes] = useState(2);
    const [inputSeconds, setInputSeconds] = useState(0);
    const [isActive, setIsActive] = useState(false);
    const [leadIn, setLeadIn] = useState<number | null>(null); // 3, 2, 1 lead in
    const [initialTime, setInitialTime] = useState(0);

    const intervalRef = useRef<number | null>(null);
    const leadInRef = useRef<number | null>(null);

    // Lead-in Logic
    useEffect(() => {
        if (leadIn !== null && leadIn > 0) {
            leadInRef.current = window.setTimeout(() => {
                setLeadIn(prev => prev! - 1);
            }, 1000);
        } else if (leadIn === 0) {
            setLeadIn(null);
            startActualTimer();
        }
        return () => {
            if (leadInRef.current) clearTimeout(leadInRef.current);
        };
    }, [leadIn]);

    // Timer Logic
    useEffect(() => {
        if (isActive && seconds > 0) {
            intervalRef.current = window.setInterval(() => {
                setSeconds(s => s - 1);
            }, 1000);
        } else if (seconds === 0 && isActive) {
            setIsActive(false);
            if (intervalRef.current) clearInterval(intervalRef.current);
            playAlert();
        }
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [isActive, seconds]);

    const playAlert = () => {
        try {
            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);

            osc.frequency.setValueAtTime(880, audioCtx.currentTime);
            gain.gain.setValueAtTime(0.5, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 1);

            osc.start();
            osc.stop(audioCtx.currentTime + 1);
        } catch (e) { }
    };

    const startActualTimer = () => {
        setIsActive(true);
    };

    const handleStart = () => {
        if (isActive) {
            setIsActive(false);
        } else {
            if (seconds === 0) {
                const total = (inputMinutes * 60) + inputSeconds;
                if (total === 0) return;
                setSeconds(total);
                setInitialTime(total);
            }
            setLeadIn(3); // Start lead-in
        }
    };

    const formatTime = (totalSeconds: number) => {
        const mins = Math.floor(totalSeconds / 60);
        const secs = totalSeconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const resetTimer = () => {
        setIsActive(false);
        setLeadIn(null);
        setSeconds(0);
        setInitialTime(0);
    };

    const adjustInput = (type: 'min' | 'sec', delta: number) => {
        if (isActive || leadIn !== null) return;
        if (type === 'min') {
            setInputMinutes(prev => Math.max(0, Math.min(99, prev + delta)));
        } else {
            setInputSeconds(prev => {
                let newVal = prev + delta;
                if (newVal >= 60) newVal = 0;
                if (newVal < 0) newVal = 59;
                return newVal;
            });
        }
    };

    return (
        <div className="bg-[#1A110D] p-10 rounded-[48px] border border-white/5 shadow-2xl h-full flex flex-col justify-between overflow-hidden relative">
            {/* Visual Progress Background */}
            {isActive && seconds > 0 && (
                <div
                    className="absolute inset-0 bg-[#E87A2C]/5 transition-all duration-1000 ease-linear origin-bottom"
                    style={{ transform: `scaleY(${seconds / initialTime})` }}
                />
            )}

            <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-[#E87A2C]" />
                    <h3 className="font-black uppercase text-[10px] tracking-[0.3em] text-stone-500">Cronômetro de Foco</h3>
                </div>
                {isActive && (
                    <div className="px-3 py-1 bg-red-500 rounded-full animate-pulse text-[8px] font-black text-white uppercase tracking-widest">
                        Em Execução
                    </div>
                )}
            </div>

            <div className="flex-grow flex flex-col items-center justify-center relative z-10 py-10">
                {leadIn !== null ? (
                    <div className="text-[180px] font-black text-[#E87A2C] leading-none animate-bounce">
                        {leadIn === 0 ? 'GO!' : leadIn}
                    </div>
                ) : (
                    <div className="w-full text-center">
                        {(isActive || seconds > 0) ? (
                            <div className="text-[160px] md:text-[200px] font-black text-white tracking-tighter leading-none select-none">
                                {formatTime(seconds)}
                            </div>
                        ) : (
                            <div className="flex items-center justify-center gap-4">
                                <div className="flex flex-col items-center">
                                    <button onClick={() => adjustInput('min', 1)} className="p-2 text-stone-600 hover:text-white transition-colors"><ChevronUp className="w-10 h-10" /></button>
                                    <span className="text-[120px] font-black text-white leading-none">{inputMinutes.toString().padStart(2, '0')}</span>
                                    <button onClick={() => adjustInput('min', -1)} className="p-2 text-stone-600 hover:text-white transition-colors"><ChevronDown className="w-10 h-10" /></button>
                                </div>
                                <span className="text-[100px] font-black text-[#E87A2C] animate-pulse">:</span>
                                <div className="flex flex-col items-center">
                                    <button onClick={() => adjustInput('sec', 10)} className="p-2 text-stone-600 hover:text-white transition-colors"><ChevronUp className="w-10 h-10" /></button>
                                    <span className="text-[120px] font-black text-white leading-none">{inputSeconds.toString().padStart(2, '0')}</span>
                                    <button onClick={() => adjustInput('sec', -10)} className="p-2 text-stone-600 hover:text-white transition-colors"><ChevronDown className="w-10 h-10" /></button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="flex gap-4 relative z-10">
                <button
                    onClick={handleStart}
                    disabled={leadIn !== null || (seconds === 0 && inputMinutes === 0 && inputSeconds === 0)}
                    className={`
                        flex-grow py-8 rounded-[32px] flex items-center justify-center gap-3 transition-all active:scale-[0.98]
                        ${isActive ? 'bg-white text-black' : 'bg-[#E87A2C] text-white shadow-xl shadow-orange-500/10 disabled:opacity-20'}
                    `}
                >
                    {isActive ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current" />}
                    <span className="font-black uppercase tracking-[0.2em] text-sm">
                        {isActive ? 'PAUSAR' : (seconds > 0 ? 'RETOMAR' : 'INICIAR TREINO')}
                    </span>
                </button>
                <button
                    onClick={resetTimer}
                    className="aspect-square w-24 flex items-center justify-center bg-white/5 text-stone-600 border border-white/10 rounded-[32px] hover:text-white hover:bg-white/10 transition-all"
                >
                    <RotateCcw className="w-6 h-6" />
                </button>
            </div>
        </div>
    );
};
