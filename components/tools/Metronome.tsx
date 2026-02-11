import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Volume2, Plus, Minus, Zap, Bell, BellOff } from 'lucide-react';

export const Metronome: React.FC = () => {
    const [bpm, setBpm] = useState(100);
    const [isPlaying, setIsPlaying] = useState(false);
    const [mode, setMode] = useState<'click' | 'voice'>('click');
    const [currentBeat, setCurrentBeat] = useState(0);
    const [volume, setVolume] = useState(1.5);
    const [timeSignature, setTimeSignature] = useState(4);
    const [hasAccent, setHasAccent] = useState(true);

    const audioContext = useRef<AudioContext | null>(null);
    const gainNode = useRef<GainNode | null>(null);
    const nextTickTime = useRef(0);
    const timerID = useRef<number | null>(null);

    // Use refs for values needed in the high-frequency scheduler to avoid stale closures
    const bpmRef = useRef(bpm);
    const modeRef = useRef(mode);
    const hasAccentRef = useRef(hasAccent);
    const volumeRef = useRef(volume);
    const timeSignatureRef = useRef(timeSignature);

    useEffect(() => {
        bpmRef.current = bpm;
        modeRef.current = mode;
        hasAccentRef.current = hasAccent;
        volumeRef.current = volume;
        timeSignatureRef.current = timeSignature;
    }, [bpm, mode, hasAccent, volume, timeSignature]);

    useEffect(() => {
        return () => {
            if (timerID.current) clearInterval(timerID.current);
            audioContext.current?.close();
        };
    }, []);

    const initAudio = () => {
        if (!audioContext.current) {
            audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            gainNode.current = audioContext.current.createGain();
            gainNode.current.connect(audioContext.current.destination);
        }
    };

    const playVoice = (beat: number) => {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance((beat + 1).toString());
        utterance.rate = 3.5;
        utterance.pitch = 1.2;
        utterance.volume = Math.min(volumeRef.current, 1);
        window.speechSynthesis.speak(utterance);
    };

    const playClick = (time: number, beat: number) => {
        if (!audioContext.current || !gainNode.current) return;

        const delay = (time - audioContext.current.currentTime) * 1000;
        setTimeout(() => {
            setCurrentBeat(beat);
        }, Math.max(0, delay));

        if (modeRef.current === 'voice') {
            playVoice(beat);
            return;
        }

        const osc = audioContext.current.createOscillator();
        const envelope = audioContext.current.createGain();

        const isFirstBeat = beat === 0;
        const useAccent = isFirstBeat && hasAccentRef.current;

        osc.type = useAccent ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(useAccent ? 1200 : 800, time);

        envelope.gain.setValueAtTime(0, time);
        envelope.gain.linearRampToValueAtTime(volumeRef.current, time + 0.005);
        envelope.gain.exponentialRampToValueAtTime(0.001, time + 0.1);

        osc.connect(envelope);
        envelope.connect(gainNode.current);

        osc.start(time);
        osc.stop(time + 0.1);
    };

    const scheduler = () => {
        if (!audioContext.current) return;

        while (nextTickTime.current < audioContext.current.currentTime + 0.1) {
            const beat = Math.round(nextTickTime.current / (60 / bpmRef.current)) % timeSignatureRef.current;
            playClick(nextTickTime.current, beat);
            nextTickTime.current += 60.0 / bpmRef.current;
        }
    };

    const toggleMetronome = () => {
        initAudio();
        if (isPlaying) {
            if (timerID.current) clearInterval(timerID.current);
            setIsPlaying(false);
            setCurrentBeat(-1);
            window.speechSynthesis.cancel();
        } else {
            if (audioContext.current?.state === 'suspended') audioContext.current.resume();
            nextTickTime.current = audioContext.current!.currentTime + 0.05;
            timerID.current = window.setInterval(scheduler, 25);
            setIsPlaying(true);
        }
    };

    const adjustBpm = (val: number) => {
        setBpm(prev => Math.max(1, Math.min(500, prev + val)));
    };

    return (
        <div className="bg-[#0F0A09] p-6 md:p-10 rounded-[40px] md:rounded-[48px] border border-white/5 shadow-2xl space-y-6 md:space-y-10 relative overflow-hidden h-full flex flex-col justify-between">
            <div className={`absolute -top-24 -right-24 w-64 h-64 bg-[#E87A2C]/10 rounded-full blur-3xl transition-opacity duration-500 ${isPlaying ? 'opacity-100' : 'opacity-0'}`} />

            <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-2 md:gap-3">
                    <div className={`p-1.5 md:p-2 rounded-lg md:rounded-xl ${isPlaying ? 'bg-[#E87A2C] text-white animate-pulse' : 'bg-white/5 text-stone-500'}`}>
                        <Zap className="w-3 h-3 md:w-4 md:h-4" />
                    </div>
                    <div>
                        <h3 className="font-black uppercase text-[8px] md:text-[10px] tracking-[0.2em] md:tracking-[0.3em] text-white">Metrônomo</h3>
                        <p className="text-[7px] md:text-[8px] font-bold text-[#E87A2C] uppercase tracking-widest">v4 Mobile</p>
                    </div>
                </div>

                <div className="flex items-center gap-2 md:gap-4">
                    <button
                        onClick={() => setHasAccent(!hasAccent)}
                        className={`p-2.5 md:p-3 rounded-xl md:rounded-2xl transition-all ${hasAccent ? 'bg-[#E87A2C]/20 text-[#E87A2C]' : 'bg-white/5 text-stone-600'}`}
                    >
                        {hasAccent ? <Bell className="w-4 h-4 md:w-5 md:h-5" /> : <BellOff className="w-4 h-4 md:w-5 md:h-5" />}
                    </button>
                    <div className="flex bg-white/5 rounded-[16px] md:rounded-[20px] p-1 border border-white/10">
                        <button
                            onClick={() => setMode('click')}
                            className={`px-3 md:px-5 py-2 md:py-2.5 rounded-[12px] md:rounded-[14px] text-[8px] md:text-[10px] font-black uppercase transition-all ${mode === 'click' ? 'bg-[#E87A2C] text-white shadow-xl' : 'text-stone-500 hover:text-stone-300'}`}
                        >
                            Click
                        </button>
                        <button
                            onClick={() => setMode('voice')}
                            className={`px-3 md:px-5 py-2 md:py-2.5 rounded-[12px] md:rounded-[14px] text-[8px] md:text-[10px] font-black uppercase transition-all ${mode === 'voice' ? 'bg-[#E87A2C] text-white shadow-xl' : 'text-stone-500 hover:text-stone-300'}`}
                        >
                            Voz
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex flex-col items-center justify-center relative z-10 my-2 md:my-0">
                <div className="flex items-center gap-4 md:gap-8">
                    <button onClick={() => adjustBpm(-10)} className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-white/10 active:scale-90 transition-all">
                        <Minus className="w-4 h-4 md:w-5 md:h-5" />
                    </button>

                    <div className="text-center group cursor-pointer" onClick={() => adjustBpm(0)}>
                        <span className="text-[70px] sm:text-[100px] md:text-[140px] font-black text-white tracking-tighter leading-none block select-none group-active:scale-95 transition-transform">
                            {bpm}
                        </span>
                        <span className="text-[8px] md:text-[10px] font-black text-stone-500 uppercase tracking-[0.5em] mt-1 md:mt-2 block">BPM</span>
                    </div>

                    <button onClick={() => adjustBpm(10)} className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-white/10 active:scale-90 transition-all">
                        <Plus className="w-4 h-4 md:w-5 md:h-5" />
                    </button>
                </div>

                <input
                    type="range"
                    min="1" max="500"
                    value={bpm}
                    onChange={(e) => setBpm(parseInt(e.target.value))}
                    className="w-full max-w-xs md:max-w-sm mt-6 md:mt-8 h-1 bg-white/5 rounded-lg appearance-none cursor-pointer accent-[#E87A2C]"
                />
            </div>

            <div className="flex justify-center gap-3 md:gap-4 relative z-10">
                {[...Array(timeSignature)].map((_, b) => (
                    <div key={b} onClick={() => { if (b === 0) setHasAccent(!hasAccent); }} className="flex flex-col items-center gap-3 cursor-pointer">
                        <div
                            className={`
                                w-2.5 h-2.5 md:w-3 md:h-3 rounded-full transition-all duration-75
                                ${currentBeat === b
                                    ? (b === 0 && hasAccent ? 'bg-[#E87A2C] scale-150 shadow-[0_0_15px_rgba(232,122,44,0.6)]' : 'bg-white scale-125')
                                    : 'bg-white/5 scale-100'}
                            `}
                        />
                    </div>
                ))}
            </div>

            <div className="space-y-4 md:space-y-6 relative z-10">
                <div className="flex items-center gap-4 md:gap-6 bg-white/5 p-3 md:p-4 rounded-[24px] md:rounded-[28px] border border-white/10">
                    <Volume2 className="w-4 h-4 text-stone-500" />
                    <input
                        type="range"
                        min="0" max="3" step="0.1"
                        value={volume}
                        onChange={(e) => setVolume(parseFloat(e.target.value))}
                        className="flex-grow h-1 bg-white/5 rounded-lg appearance-none cursor-pointer accent-[#E87A2C]"
                    />
                </div>

                <button
                    onClick={toggleMetronome}
                    className={`
                        w-full py-5 md:py-8 rounded-[28px] md:rounded-[32px] flex items-center justify-center gap-3 md:gap-4 transition-all active:scale-[0.98]
                        ${isPlaying ? 'bg-white text-black' : 'bg-[#E87A2C] text-white shadow-2xl shadow-orange-500/20'}
                    `}
                >
                    {isPlaying ? <Pause className="w-6 h-6 md:w-8 md:h-8 fill-current" /> : <Play className="w-6 h-6 md:w-8 md:h-8 fill-current" />}
                    <span className="font-black uppercase tracking-[0.2em] text-sm md:text-lg">{isPlaying ? 'PARAR' : 'PLAY'}</span>
                </button>
            </div>
        </div>
    );
};
