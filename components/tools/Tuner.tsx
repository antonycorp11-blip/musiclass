import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Lock, Unlock, Activity, ChevronRight, ChevronLeft, Check } from 'lucide-react';
import { PitchDetector } from 'pitchy';

const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export const Tuner: React.FC = () => {
    const [isListening, setIsListening] = useState(false);
    const [pitch, setPitch] = useState<number | null>(null);
    const [note, setNote] = useState<string>('');
    const [clarity, setClarity] = useState(0);
    const [lockedNote, setLockedNote] = useState<string | null>(null);
    const [targetFrequency, setTargetFrequency] = useState<number | null>(null);

    const smoothedPitch = useRef<number | null>(null);
    const alpha = 0.05;

    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const animationFrameRef = useRef<number | null>(null);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            analyserRef.current = audioContextRef.current.createAnalyser();
            analyserRef.current.fftSize = 4096;

            const source = audioContextRef.current.createMediaStreamSource(stream);
            source.connect(analyserRef.current);

            setIsListening(true);
            detectPitch();
        } catch (err) {
            console.error('Error accessing microphone:', err);
        }
    };

    const stopRecording = () => {
        setIsListening(false);
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
        if (audioContextRef.current) audioContextRef.current.close();
        setPitch(null);
        setNote('');
        smoothedPitch.current = null;
    };

    const detectPitch = () => {
        if (!analyserRef.current || !audioContextRef.current) return;

        const data = new Float32Array(analyserRef.current.fftSize);
        analyserRef.current.getFloatTimeDomainData(data);

        const detector = PitchDetector.forFloat32Array(analyserRef.current.fftSize);
        const [detectedPitch, detectedClarity] = detector.findPitch(data, audioContextRef.current.sampleRate);

        setClarity(detectedClarity);

        if (detectedClarity > 0.95) {
            if (smoothedPitch.current === null) {
                smoothedPitch.current = detectedPitch;
            } else {
                smoothedPitch.current = smoothedPitch.current * (1 - alpha) + detectedPitch * alpha;
            }

            const currentPitch = smoothedPitch.current;
            setPitch(currentPitch);

            const midi = 12 * (Math.log2(currentPitch / 440)) + 69;
            const noteIndex = Math.round(midi) % 12;
            setNote(NOTES[noteIndex]);
        }

        animationFrameRef.current = requestAnimationFrame(detectPitch);
    };

    const handleLock = () => {
        if (lockedNote) {
            setLockedNote(null);
            setTargetFrequency(null);
        } else if (note && pitch) {
            setLockedNote(note);
            setTargetFrequency(pitch);
        }
    };

    const getFeedback = () => {
        if (!targetFrequency || !pitch || !lockedNote) return null;

        const diff = pitch - targetFrequency;
        const absDiff = Math.abs(diff);
        if (absDiff < 1.0) return { type: 'match' };

        if (diff < 0) return { type: 'up', color: 'text-green-500', label: 'SUBA ↑', intensity: Math.min(absDiff / 10, 1) };
        if (diff > 0) return { type: 'down', color: 'text-red-500', label: 'BAIXE ↓', intensity: Math.min(absDiff / 10, 1) };

        return null;
    };

    const feedback = getFeedback();

    const getDeviationPx = () => {
        if (!pitch) return 50;
        const midi = 12 * (Math.log2(pitch / 440)) + 69;
        const dev = (midi - Math.round(midi)) * 100;
        return Math.min(100, Math.max(0, 50 + (dev / 2))); // Slightly narrowed sensitivity for better visual UX
    };

    return (
        <div className="bg-[#0F0A09] p-6 lg:p-12 rounded-[40px] lg:rounded-[64px] border border-white/5 shadow-2xl h-full flex flex-col justify-between overflow-hidden relative transition-colors duration-500">
            {/* Dynamic Chromatic Feedback Layer */}
            <div className={`absolute inset-0 transition-opacity duration-700 pointer-events-none ${feedback?.type === 'match' ? 'bg-green-500/10 opacity-100' : 'opacity-0'}`} />
            <div className={`absolute inset-0 transition-opacity duration-700 pointer-events-none ${feedback?.type === 'up' ? 'bg-green-500/5 opacity-100' : 'opacity-0'}`} />
            <div className={`absolute inset-0 transition-opacity duration-700 pointer-events-none ${feedback?.type === 'down' ? 'bg-red-500/5 opacity-100' : 'opacity-0'}`} />

            <div className="flex flex-col sm:flex-row items-center justify-between relative z-10 gap-6">
                <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-2xl ${isListening ? 'bg-[#E87A2C]/20 border border-[#E87A2C]/40' : 'bg-white/5 border border-white/10'}`}>
                        <Activity className={`w-6 h-6 ${isListening ? 'text-[#E87A2C] animate-pulse' : 'text-stone-700'}`} />
                    </div>
                    <div>
                        <h3 className="font-black uppercase text-[10px] md:text-sm tracking-[0.4em] text-stone-500">Afinador v5</h3>
                        {isListening && <p className="text-[8px] md:text-[10px] text-[#E87A2C] font-bold uppercase tracking-widest mt-0.5 animate-fade-in">Escutando...</p>}
                    </div>
                </div>

                <button
                    onClick={handleLock}
                    disabled={!isListening}
                    className={`
                        px-8 py-4 rounded-full text-[10px] md:text-xs font-black uppercase transition-all flex items-center gap-3 backdrop-blur-md
                        ${lockedNote ? 'bg-red-600 text-white shadow-2xl shadow-red-600/30' : 'bg-white/5 text-stone-500 hover:text-white border border-white/10'}
                    `}
                >
                    {lockedNote ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                    {lockedNote ? `TRAVADO EM ${lockedNote}` : 'TRAVAR NOTA'}
                </button>
            </div>

            <div className="flex-grow flex items-center justify-center relative z-10 py-10">
                <div className="flex items-center justify-center gap-8 md:gap-24 lg:gap-40 w-full max-w-7xl">
                    {/* Left Directional Indicator (DESCER) */}
                    <div className="w-40 flex justify-end">
                        {feedback?.type === 'down' && (
                            <div className="flex flex-col items-center animate-pulse">
                                <ChevronLeft className="w-24 h-24 md:w-40 md:h-40 xl:w-56 xl:h-56 text-red-500 transition-transform hover:scale-110" />
                                <span className="text-red-500 font-black text-xs md:text-lg uppercase tracking-[0.5em] leading-none -mt-4">BAIXE</span>
                            </div>
                        )}
                    </div>

                    <div className="text-center relative">
                        {/* Perfect Match Ring */}
                        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] border-[20px] rounded-full border-green-500/0 transition-all duration-700 ${feedback?.type === 'match' ? 'border-green-500/20 scale-100 opacity-100' : 'scale-150 opacity-0'}`} />

                        <div className={`text-[120px] sm:text-[220px] md:text-[350px] lg:text-[450px] font-black leading-none tracking-tighter transition-all duration-300 drop-shadow-[0_0_50px_rgba(255,255,255,0.05)] ${feedback?.type === 'match' ? 'text-green-500 scale-105' : 'text-white'}`}>
                            {note || '--'}
                        </div>

                        <div className="flex flex-col items-center gap-1 mt-2 md:mt-0">
                            <span className="text-2xl md:text-4xl lg:text-6xl font-black text-[#E87A2C] tabular-nums tracking-tighter drop-shadow-lg">
                                {pitch ? `${pitch.toFixed(1)}` : '0.0'} <small className="text-xs md:text-sm lg:text-lg text-stone-600 uppercase font-black">Hz</small>
                            </span>
                            {targetFrequency && (
                                <div className="mt-2 px-6 py-2 bg-white/5 rounded-full border border-white/10 backdrop-blur-sm">
                                    <span className="text-[9px] md:text-[11px] font-black text-stone-600 uppercase tracking-[0.4em]">
                                        Nota Alvo: {targetFrequency.toFixed(1)} Hz
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Directional Indicator (SUBIR) */}
                    <div className="w-40 flex justify-start">
                        {feedback?.type === 'up' && (
                            <div className="flex flex-col items-center animate-pulse">
                                <ChevronRight className="w-24 h-24 md:w-40 md:h-40 xl:w-56 xl:h-56 text-green-500 transition-transform hover:scale-110" />
                                <span className="text-green-500 font-black text-xs md:text-lg uppercase tracking-[0.5em] leading-none -mt-4">SUBA</span>
                            </div>
                        )}
                        {feedback?.type === 'match' && (
                            <div className="flex flex-col items-center animate-bounce">
                                <Check className="w-24 h-24 md:w-40 md:h-40 xl:w-56 xl:h-56 text-green-500" />
                                <span className="text-green-500 font-black text-xs md:text-lg uppercase tracking-[0.5em] leading-none -mt-4">OK!</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="relative z-10 space-y-8 lg:space-y-12 pb-4">
                {/* Enhanced Needle Meter */}
                <div className="w-full h-3 md:h-5 bg-white/5 rounded-full relative overflow-hidden ring-1 ring-white/10">
                    <div className="absolute left-1/4 w-px h-full bg-white/5" />
                    <div className="absolute left-1/2 -translate-x-1/2 w-0.5 md:w-1 h-full bg-[#E87A2C]/30 z-0" />
                    <div className="absolute left-3/4 w-px h-full bg-white/5" />

                    <div
                        className={`absolute top-0 w-2 md:w-3 h-full transition-all duration-150 ${feedback?.type === 'match' ? 'bg-green-500 shadow-[0_0_25px_#22c55e]' : 'bg-[#E87A2C]'}`}
                        style={{ left: `${getDeviationPx()}%`, transform: 'translateX(-50%)' }}
                    />
                </div>

                <div className="max-w-4xl mx-auto w-full">
                    <button
                        onClick={isListening ? stopRecording : startRecording}
                        className={`
                            w-full py-6 md:py-10 rounded-[32px] md:rounded-[48px] flex items-center justify-center gap-6 transition-all active:scale-[0.98] shadow-2xl relative overflow-hidden group
                            ${isListening ? 'bg-white text-black' : 'bg-[#E87A2C] text-white shadow-orange-500/20'}
                        `}
                    >
                        <div className={`absolute inset-0 bg-white/20 transition-transform duration-500 translate-y-full group-hover:translate-y-0 ${!isListening && 'bg-black/10'}`} />
                        {isListening ? <MicOff className="w-8 h-8 md:w-10 md:h-10 relative z-10" /> : <Mic className="w-8 h-8 md:w-10 md:h-10 relative z-10" />}
                        <span className="font-black uppercase tracking-[0.3em] text-lg md:text-2xl relative z-10">
                            {isListening ? 'ENCERRAR ESCUTA' : 'INICIAR MONITORAMENTO'}
                        </span>
                    </button>
                </div>
            </div>

            {/* Visual Guide Label */}
            <div className="absolute bottom-6 left-12 opacity-30 select-none">
                <span className="text-[10px] font-black uppercase tracking-[0.5em] text-stone-600">MusiClass Audio Precision Engine v5.0</span>
            </div>
        </div>
    );
};
