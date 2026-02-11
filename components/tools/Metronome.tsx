import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Volume2, Plus, Minus, Zap } from 'lucide-react';

export const Metronome: React.FC = () => {
    const [bpm, setBpm] = useState(100);
    const [isPlaying, setIsPlaying] = useState(false);
    const [mode, setMode] = useState<'click' | 'voice'>('click');
    const [currentBeat, setCurrentBeat] = useState(0);
    const [volume, setVolume] = useState(1.5); // Boosted volume
    const [timeSignature, setTimeSignature] = useState(4);

    const audioContext = useRef<AudioContext | null>(null);
    const gainNode = useRef<GainNode | null>(null);
    const nextTickTime = useRef(0);
    const timerID = useRef<number | null>(null);

    // Initialize Audio
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
        // Simple human-like voice synthesis for counting
        const utterance = new SpeechSynthesisUtterance((beat + 1).toString());
        utterance.rate = 2.5; // Fast enough for high BPM
        utterance.pitch = 1.2;
        utterance.volume = Math.min(volume, 1);
        window.speechSynthesis.speak(utterance);
    };

    const playClick = (time: number, beat: number) => {
        if (!audioContext.current || !gainNode.current) return;

        initAudio();

        if (mode === 'voice') {
            // Speech synthesis is async, using it for visual sync but it might have lag
            // In a pro app we'd use AudioBuffers, but here we'll stick to clear oscillators for stability
            // OR we can trigger speech synthesis. NOTE: SpeechSynthesis doesn't sync with WebAudio timing perfectly.
            playVoice(beat);
        }

        const osc = audioContext.current.createOscillator();
        const envelope = audioContext.current.createGain();

        // High definition click
        osc.type = beat === 0 ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(beat === 0 ? 1200 : 800, time);

        envelope.gain.setValueAtTime(0, time);
        envelope.gain.linearRampToValueAtTime(volume, time + 0.005);
        envelope.gain.exponentialRampToValueAtTime(0.001, time + 0.1);

        osc.connect(envelope);
        envelope.connect(gainNode.current);

        osc.start(time);
        osc.stop(time + 0.1);

        // Sync UI
        const delay = (time - audioContext.current.currentTime) * 1000;
        setTimeout(() => {
            setCurrentBeat(beat);
        }, Math.max(0, delay));
    };

    const scheduler = () => {
        while (audioContext.current && nextTickTime.current < audioContext.current.currentTime + 0.1) {
            const beat = Math.floor(nextTickTime.current * (bpm / 60) * (60 / bpm)) % timeSignature;
            // Corrected logic for beat tracking
            const absoluteBeat = Math.round((nextTickTime.current) / (60 / bpm));
            playClick(nextTickTime.current, absoluteBeat % timeSignature);
            nextTickTime.current += 60.0 / bpm;
        }
    };

    const toggleMetronome = () => {
        initAudio();
        if (isPlaying) {
            if (timerID.current) clearInterval(timerID.current);
            setIsPlaying(false);
            setCurrentBeat(-1);
        } else {
            if (audioContext.current?.state === 'suspended') audioContext.current.resume();
            nextTickTime.current = audioContext.current!.currentTime + 0.05;
            timerID.current = window.setInterval(scheduler, 25);
            setIsPlaying(true);
        }
    };

    const adjustBpm = (val: number) => {
        setBpm(prev => Math.max(40, Math.min(300, prev + val)));
    };

    return (
        <div className="bg-[#0F0A09] p-10 rounded-[48px] border border-white/5 shadow-2xl space-y-10 relative overflow-hidden group">
            {/* Background Glow */}
            <div className={`absolute -top-24 -right-24 w-64 h-64 bg-[#E87A2C]/10 rounded-full blur-3xl transition-opacity duration-500 ${isPlaying ? 'opacity-100' : 'opacity-0'}`} />

            <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${isPlaying ? 'bg-[#E87A2C] text-white animate-pulse' : 'bg-white/5 text-stone-500'}`}>
                        <Zap className="w-4 h-4" />
                    </div>
                    <div>
                        <h3 className="font-black uppercase text-[10px] tracking-[0.3em] text-white">MusiClass Pro</h3>
                        <p className="text-[8px] font-bold text-[#E87A2C] uppercase tracking-widest">Hi-Fi Metronome</p>
                    </div>
                </div>

                <div className="flex bg-white/5 rounded-[20px] p-1.5 border border-white/10">
                    <button
                        onClick={() => setMode('click')}
                        className={`px-5 py-2.5 rounded-[14px] text-[10px] font-black uppercase transition-all ${mode === 'click' ? 'bg-[#E87A2C] text-white shadow-xl' : 'text-stone-500 hover:text-stone-300'}`}
                    >
                        Padrão
                    </button>
                    <button
                        onClick={() => setMode('voice')}
                        className={`px-5 py-2.5 rounded-[14px] text-[10px] font-black uppercase transition-all ${mode === 'voice' ? 'bg-[#E87A2C] text-white shadow-xl' : 'text-stone-500 hover:text-stone-300'}`}
                    >
                        Voz (1,2,3,4)
                    </button>
                </div>
            </div>

            <div className="flex flex-col items-center justify-center py-4 relative z-10">
                <div className="flex items-center gap-10">
                    <button onClick={() => adjustBpm(-5)} className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-[#E87A2C] transition-all active:scale-90">
                        <Minus className="w-6 h-6" />
                    </button>

                    <div className="text-center">
                        <span className="text-[120px] font-black text-white tracking-tighter leading-none block select-none">
                            {bpm}
                        </span>
                        <span className="text-[10px] font-black text-[#E87A2C] uppercase tracking-[0.5em] mt-2 block">Batidas por Minuto</span>
                    </div>

                    <button onClick={() => adjustBpm(5)} className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-[#E87A2C] transition-all active:scale-90">
                        <Plus className="w-6 h-6" />
                    </button>
                </div>
            </div>

            {/* Pendulum / Visual Beat */}
            <div className="flex justify-center gap-6 relative z-10">
                {[...Array(timeSignature)].map((_, b) => (
                    <div key={b} className="flex flex-col items-center gap-3">
                        <div
                            className={`
                                w-4 h-4 rounded-full transition-all duration-75
                                ${currentBeat === b
                                    ? (b === 0 ? 'bg-orange-400 scale-150 shadow-[0_0_20px_rgba(232,122,44,0.6)]' : 'bg-white scale-125 shadow-[0_0_15px_rgba(255,255,255,0.4)]')
                                    : 'bg-white/10 scale-100'}
                            `}
                        />
                        <span className={`text-[10px] font-black ${currentBeat === b ? 'text-white' : 'text-stone-700'}`}>{b + 1}</span>
                    </div>
                ))}
            </div>

            <div className="space-y-6 relative z-10">
                <div className="flex items-center gap-6 bg-white/5 p-4 rounded-[28px] border border-white/10">
                    <Volume2 className="w-5 h-5 text-stone-500" />
                    <input
                        type="range"
                        min="0" max="3" step="0.1"
                        value={volume}
                        onChange={(e) => setVolume(parseFloat(e.target.value))}
                        className="flex-grow h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#E87A2C]"
                    />
                    <span className="text-[10px] font-black text-[#E87A2C] w-10">{(volume * 100).toFixed(0)}%</span>
                </div>

                <button
                    onClick={toggleMetronome}
                    className={`
                        w-full py-8 rounded-[32px] flex items-center justify-center gap-4 transition-all active:scale-[0.98]
                        ${isPlaying
                            ? 'bg-white text-black shadow-2xl'
                            : 'bg-[#E87A2C] text-white shadow-[0_20px_40px_rgba(232,122,44,0.3)] hover:shadow-[0_25px_50px_rgba(232,122,44,0.4)]'}
                    `}
                >
                    {isPlaying ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current" />}
                    <span className="font-black uppercase tracking-[0.2em] text-lg">{isPlaying ? 'PARAR' : 'INICIAR RITMO'}</span>
                </button>
            </div>
        </div>
    );
};
