import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Clock, ChevronUp, ChevronDown } from 'lucide-react';

export const Timer: React.FC = () => {
    const [seconds, setSeconds] = useState(0);
    const [inputMinutes, setInputMinutes] = useState(2);
    const [inputSeconds, setInputSeconds] = useState(0);
    const [isActive, setIsActive] = useState(false);
    const [leadIn, setLeadIn] = useState<number | null>(null);
    const [initialTime, setInitialTime] = useState(0);

    const intervalRef = useRef<number | null>(null);
    const leadInRef = useRef<number | null>(null);

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
            setLeadIn(3);
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

    const progress = initialTime > 0 ? (seconds / initialTime) * 100 : 0;

    return (
        <div className="bg-[#1A110D] p-6 md:p-10 rounded-[40px] md:rounded-[48px] border border-white/5 shadow-2xl h-full flex flex-col justify-between overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-white/5 z-20">
                <div
                    className="h-full bg-[#E87A2C] transition-all duration-1000 ease-linear"
                    style={{ width: `${progress}%` }}
                />
            </div>

            <div className="flex items-center justify-between relative z-10 pt-2">
                <div className="flex items-center gap-2 md:gap-3">
                    <Clock className="w-4 h-4 md:w-5 md:h-5 text-[#E87A2C]" />
                    <h3 className="font-black uppercase text-[8px] md:text-[10px] tracking-[0.2em] md:tracking-[0.3em] text-stone-500">Timer Pro</h3>
                </div>
            </div>

            <div className="flex-grow flex flex-col items-center justify-center relative z-10 my-4 md:my-0">
                {leadIn !== null ? (
                    <div className="text-[150px] sm:text-[200px] md:text-[350px] font-black text-[#E87A2C] leading-none animate-pulse">
                        {leadIn === 0 ? 'GO' : leadIn}
                    </div>
                ) : (
                    <div className="w-full flex flex-col items-center">
                        {(isActive || seconds > 0) ? (
                            <div className="text-[80px] sm:text-[140px] md:text-[300px] lg:text-[400px] font-black text-white tracking-tighter leading-none select-none drop-shadow-2xl">
                                {formatTime(seconds)}
                            </div>
                        ) : (
                            <div className="flex items-center justify-center gap-4 sm:gap-8 md:gap-12">
                                <div className="flex flex-col items-center">
                                    <button onClick={() => adjustInput('min', 1)} className="p-2 md:p-4 text-stone-700 hover:text-[#E87A2C]"><ChevronUp className="w-10 h-10 md:w-16 md:h-16" /></button>
                                    <span className="text-[100px] sm:text-[150px] md:text-[250px] font-black text-white leading-none tabular-nums">{inputMinutes.toString().padStart(2, '0')}</span>
                                    <button onClick={() => adjustInput('min', -1)} className="p-2 md:p-4 text-stone-700 hover:text-[#E87A2C]"><ChevronDown className="w-10 h-10 md:w-16 md:h-16" /></button>
                                </div>
                                <span className="text-[60px] md:text-[150px] font-black text-[#E87A2C] -mt-4 md:-mt-10">:</span>
                                <div className="flex flex-col items-center">
                                    <button onClick={() => adjustInput('sec', 10)} className="p-2 md:p-4 text-stone-700 hover:text-[#E87A2C]"><ChevronUp className="w-10 h-10 md:w-16 md:h-16" /></button>
                                    <span className="text-[100px] sm:text-[150px] md:text-[250px] font-black text-white leading-none tabular-nums">{inputSeconds.toString().padStart(2, '0')}</span>
                                    <button onClick={() => adjustInput('sec', -10)} className="p-2 md:p-4 text-stone-700 hover:text-[#E87A2C]"><ChevronDown className="w-10 h-10 md:w-16 md:h-16" /></button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="flex gap-3 md:gap-4 relative z-10 pb-2">
                <button
                    onClick={handleStart}
                    disabled={leadIn !== null || (seconds === 0 && inputMinutes === 0 && inputSeconds === 0)}
                    className={`
                        flex-grow py-5 md:py-8 rounded-[24px] md:rounded-[32px] flex items-center justify-center gap-3 md:gap-4 transition-all active:scale-[0.98]
                        ${isActive ? 'bg-white text-black' : 'bg-[#E87A2C] text-white shadow-2xl shadow-orange-500/20 disabled:opacity-10'}
                    `}
                >
                    {isActive ? <Pause className="w-6 h-6 md:w-8 md:h-8 fill-current" /> : <Play className="w-6 h-6 md:w-8 md:h-8 fill-current" />}
                    <span className="font-black uppercase tracking-[0.2em] text-sm md:text-lg">
                        {isActive ? 'PARAR' : (seconds > 0 ? 'RETOMAR' : 'INICIAR')}
                    </span>
                </button>
                <button
                    onClick={resetTimer}
                    className="aspect-square w-16 md:w-24 flex items-center justify-center bg-white/5 text-stone-600 border border-white/10 rounded-[24px] md:rounded-[32px] hover:text-white transition-all shadow-xl"
                >
                    <RotateCcw className="w-6 h-6 md:w-8 md:h-8" />
                </button>
            </div>
        </div>
    );
};
