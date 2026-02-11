import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Volume2, Mic } from 'lucide-react';

export const Metronome: React.FC = () => {
    const [bpm, setBpm] = useState(100);
    const [isPlaying, setIsPlaying] = useState(false);
    const [mode, setMode] = useState<'click' | 'voice'>('click');
    const [currentBeat, setCurrentBeat] = useState(0);

    const audioContext = useRef<AudioContext | null>(null);
    const nextTickTime = useRef(0);
    const timerID = useRef<number | null>(null);
    const voiceBuffers = useRef<{ [key: number]: AudioBuffer }>({});

    // Carregar sons de voz (Simulado ou via Fetch)
    useEffect(() => {
        audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        // Aqui carregaríamos os samples 1, 2, 3, 4
        return () => {
            if (timerID.current) clearInterval(timerID.current);
            audioContext.current?.close();
        };
    }, []);

    const playClick = (time: number, beat: number) => {
        if (!audioContext.current) return;

        if (mode === 'voice' && voiceBuffers.current[beat + 1]) {
            const source = audioContext.current.createBufferSource();
            source.buffer = voiceBuffers.current[beat + 1];
            source.connect(audioContext.current.destination);
            source.start(time);
        } else {
            const osc = audioContext.current.createOscillator();
            const envelope = audioContext.current.createGain();

            osc.type = 'sine';
            osc.frequency.value = beat === 0 ? 1000 : 800;

            envelope.gain.value = 1;
            envelope.gain.exponentialRampToValueAtTime(0.001, time + 0.1);

            osc.connect(envelope);
            envelope.connect(audioContext.current.destination);

            osc.start(time);
            osc.stop(time + 0.1);
        }

        // Update UI beat (approximate)
        setTimeout(() => setCurrentBeat(beat), (time - audioContext.current!.currentTime) * 1000);
    };

    const scheduler = () => {
        while (audioContext.current && nextTickTime.current < audioContext.current.currentTime + 0.1) {
            const beat = Math.floor(nextTickTime.current * (bpm / 60)) % 4;
            playClick(nextTickTime.current, beat);
            nextTickTime.current += 60.0 / bpm;
        }
    };

    const toggleMetronome = () => {
        if (isPlaying) {
            if (timerID.current) clearInterval(timerID.current);
            setIsPlaying(false);
        } else {
            if (audioContext.current?.state === 'suspended') audioContext.current.resume();
            nextTickTime.current = audioContext.current!.currentTime;
            timerID.current = window.setInterval(scheduler, 25);
            setIsPlaying(true);
        }
    };

    return (
        <div className="bg-stone-50 p-8 rounded-[32px] border border-stone-100 space-y-8">
            <div className="flex items-center justify-between">
                <h3 className="font-black uppercase text-xs tracking-widest text-stone-400">Metrônomo Profissional</h3>
                <div className="flex bg-white rounded-xl p-1 border border-stone-100 shadow-sm">
                    <button
                        onClick={() => setMode('click')}
                        className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${mode === 'click' ? 'bg-[#E87A2C] text-white shadow-md' : 'text-stone-300'}`}
                    >
                        Click
                    </button>
                    <button
                        onClick={() => setMode('voice')}
                        className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${mode === 'voice' ? 'bg-[#E87A2C] text-white shadow-md' : 'text-stone-300'}`}
                    >
                        Voz
                    </button>
                </div>
            </div>

            <div className="text-center space-y-2">
                <div className="text-7xl font-black text-[#1A110D] tracking-tighter">{bpm}</div>
                <div className="text-[10px] font-black text-[#E87A2C] uppercase tracking-[0.4em]">BPM</div>
            </div>

            <input
                type="range"
                min="40" max="220"
                value={bpm}
                onChange={(e) => setBpm(parseInt(e.target.value))}
                className="w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-[#E87A2C]"
            />

            <div className="flex justify-center gap-4">
                {[0, 1, 2, 3].map(b => (
                    <div key={b} className={`w-3 h-3 rounded-full transition-all duration-100 ${currentBeat === b ? 'bg-[#E87A2C] scale-150 shadow-lg' : 'bg-stone-200'}`} />
                ))}
            </div>

            <button
                onClick={toggleMetronome}
                className={`w-full py-6 rounded-3xl flex items-center justify-center gap-3 transition-all ${isPlaying ? 'bg-[#1A110D] text-white shadow-stone-900/20' : 'bg-[#E87A2C] text-white shadow-orange-500/20 shadow-xl'}`}
            >
                {isPlaying ? <Pause className="fill-current" /> : <Play className="fill-current" />}
                <span className="font-black uppercase tracking-widest text-sm">{isPlaying ? 'PARAR' : 'INICIAR METRÔNOMO'}</span>
            </button>
        </div>
    );
};
