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

    // Extra strong smoothing for 60% less sensitivity
    const smoothedPitch = useRef<number | null>(null);
    const alpha = 0.05; // Reduced from 0.2 for much slower/smoother tracking

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
            analyserRef.current.fftSize = 4096; // Higher resolution for better detail

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

        // High clarity threshold to filter background noise (A/C, etc)
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
        } else {
            // Decay smoothing if no clear signal
            // setPitch(null); // Optional: clear if not clear enough
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
        if (Math.abs(diff) < 1.5) return { type: 'match' };

        // Seta Verde à direita para SUBIR (pitch < target)
        // Seta Vermelha à esquerda para DESCER (pitch > target)
        if (diff < 0) return { type: 'up', color: 'text-green-500', label: 'SUBA ↑' };
        if (diff > 0) return { type: 'down', color: 'text-red-500', label: 'BAIXE ↓' };

        return null;
    };

    const feedback = getFeedback();

    const getDeviationPx = () => {
        if (!pitch) return 50;
        const midi = 12 * (Math.log2(pitch / 440)) + 69;
        const dev = (midi - Math.round(midi)) * 100;
        return Math.min(100, Math.max(0, 50 + (dev)));
    };

    return (
        <div className="bg-[#0F0A09] p-10 rounded-[48px] border border-white/5 shadow-2xl h-full flex flex-col justify-between overflow-hidden relative">
            <div className={`absolute inset-0 bg-green-500/5 transition-opacity duration-300 ${feedback?.type === 'match' ? 'opacity-100' : 'opacity-0'}`} />

            <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-3">
                    <Activity className={`w-5 h-5 ${isListening ? 'text-[#E87A2C] animate-pulse' : 'text-stone-800'}`} />
                    <h3 className="font-black uppercase text-[10px] tracking-[0.3em] text-stone-500">Tuner Pro v3</h3>
                </div>

                <button
                    onClick={handleLock}
                    disabled={!isListening}
                    className={`
                        px-8 py-3 rounded-full text-[10px] font-black uppercase transition-all flex items-center gap-2
                        ${lockedNote ? 'bg-red-500 text-white shadow-xl shadow-red-500/20' : 'bg-white/5 text-stone-600 hover:text-white'}
                    `}
                >
                    {lockedNote ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                    {lockedNote ? `BLOQUEADO EM ${lockedNote}` : 'BLOQUEAR NOTA'}
                </button>
            </div>

            <div className="flex-grow flex items-center justify-center relative z-10">
                <div className="flex items-center justify-center gap-16 w-full max-w-4xl">
                    {/* Left Arrow (Down/Lower) */}
                    <div className="w-32 flex justify-end">
                        {feedback?.type === 'down' && (
                            <div className="flex flex-col items-center animate-pulse">
                                <ChevronLeft className="w-24 h-24 text-red-500" />
                                <span className="text-red-500 font-black text-xs uppercase tracking-widest">{feedback.label}</span>
                            </div>
                        )}
                    </div>

                    <div className="text-center">
                        <div className={`text-[250px] font-black leading-none tracking-tighter transition-all duration-300 ${feedback?.type === 'match' ? 'text-green-500 scale-110' : 'text-white'}`}>
                            {note || '--'}
                        </div>
                        <div className="flex flex-col gap-1 mt-4">
                            <span className="text-3xl font-black text-[#E87A2C] tabular-nums tracking-tighter">
                                {pitch ? `${pitch.toFixed(1)}` : '0.0'} <small className="text-[10px] text-stone-600">Hz</small>
                            </span>
                            {targetFrequency && (
                                <span className="text-[10px] font-bold text-stone-700 uppercase tracking-[0.4em]">
                                    Alvo: {targetFrequency.toFixed(1)} Hz
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Right Arrow (Up/Higher) */}
                    <div className="w-32 flex justify-start">
                        {feedback?.type === 'up' && (
                            <div className="flex flex-col items-center animate-pulse">
                                <ChevronRight className="w-24 h-24 text-green-500" />
                                <span className="text-green-500 font-black text-xs uppercase tracking-widest">{feedback.label}</span>
                            </div>
                        )}
                        {feedback?.type === 'match' && (
                            <div className="flex flex-col items-center animate-bounce">
                                <Check className="w-24 h-24 text-green-500" />
                                <span className="text-green-500 font-black text-xs uppercase tracking-widest">PERFEITO</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="relative z-10 space-y-8">
                {/* Needle Meter */}
                <div className="w-full h-2 bg-white/5 rounded-full relative overflow-hidden">
                    <div className="absolute left-1/2 -translate-x-1/2 w-1 h-full bg-white/10 z-0" />
                    <div
                        className={`absolute top-0 w-1.5 h-full transition-all duration-150 ${feedback?.type === 'match' ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' : 'bg-[#E87A2C]'}`}
                        style={{ left: `${getDeviationPx()}%`, transform: 'translateX(-50%)' }}
                    />
                </div>

                <button
                    onClick={isListening ? stopRecording : startRecording}
                    className={`
                        w-full py-8 rounded-[32px] flex items-center justify-center gap-4 transition-all active:scale-[0.98]
                        ${isListening ? 'bg-white text-black' : 'bg-[#E87A2C] text-white shadow-2xl shadow-orange-500/20'}
                    `}
                >
                    {isListening ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
                    <span className="font-black uppercase tracking-[0.2em] text-lg">
                        {isListening ? 'PARAR ESCUTA' : 'OUVIR NOTA'}
                    </span>
                </button>
            </div>
        </div>
    );
};
