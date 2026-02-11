import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Lock, Unlock, Activity, ChevronUp, ChevronDown, Check } from 'lucide-react';
import { PitchDetector } from 'pitchy';

const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export const Tuner: React.FC = () => {
    const [isListening, setIsListening] = useState(false);
    const [pitch, setPitch] = useState<number | null>(null);
    const [note, setNote] = useState<string>('');
    const [clarity, setClarity] = useState(0);
    const [lockedNote, setLockedNote] = useState<string | null>(null);
    const [targetFrequency, setTargetFrequency] = useState<number | null>(null);

    // Smooth output using exponential smoothing
    const smoothedPitch = useRef<number | null>(null);
    const alpha = 0.2; // Smoothing factor (lower = smoother)

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
            analyserRef.current.fftSize = 2048;

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

        // Lowered sensitivity threshold for better capture but smoothed output
        if (detectedClarity > 0.8) {
            // Apply smoothing
            if (smoothedPitch.current === null) {
                smoothedPitch.current = detectedPitch;
            } else {
                smoothedPitch.current = smoothedPitch.current * (1 - alpha) + detectedPitch * alpha;
            }

            const currentPitch = smoothedPitch.current;
            setPitch(Math.round(currentPitch * 10) / 10);

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
        if (!targetFrequency || !pitch) return null;
        const diff = pitch - targetFrequency;
        if (Math.abs(diff) < 2) return { text: 'PERFEITO', color: 'text-green-500', icon: Check };
        if (diff > 0) return { text: 'BAIXE ↓', color: 'text-blue-500', icon: ChevronDown };
        return { text: 'SUBA ↑', color: 'text-red-500', icon: ChevronUp };
    };

    const feedback = getFeedback();

    const getDeviationPx = () => {
        if (!pitch) return 50;
        const midi = 12 * (Math.log2(pitch / 440)) + 69;
        const dev = (midi - Math.round(midi)) * 100; // -50 to +50
        return 50 + (dev);
    };

    return (
        <div className="bg-[#0F0A09] p-10 rounded-[48px] border border-white/5 shadow-2xl space-y-8 h-full flex flex-col">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Activity className={`w-5 h-5 ${isListening ? 'text-[#E87A2C] animate-pulse' : 'text-stone-700'}`} />
                    <div>
                        <h3 className="font-black uppercase text-[10px] tracking-[0.3em] text-white">Audio Analysis</h3>
                        <p className="text-[8px] font-bold text-[#E87A2C] uppercase tracking-widest italic">Vocal & Instrument Precision</p>
                    </div>
                </div>

                <button
                    onClick={handleLock}
                    disabled={!isListening || (!note && !lockedNote)}
                    className={`
                        flex items-center gap-2 px-6 py-2.5 rounded-full text-[10px] font-black uppercase transition-all
                        ${lockedNote ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'bg-white/5 text-stone-500 hover:bg-white/10 disabled:opacity-20'}
                    `}
                >
                    {lockedNote ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                    {lockedNote ? `ALVO: ${lockedNote}` : 'TRAVAR NOTA'}
                </button>
            </div>

            <div className="flex-grow flex flex-col items-center justify-center py-10">
                {/* Advanced Gauge */}
                <div className="w-full max-w-md relative pb-10">
                    <div className="absolute top-0 w-full flex justify-between px-2 text-[8px] font-black text-stone-600 uppercase tracking-widest">
                        <span>Flat (-50)</span>
                        <span className="text-white">In-Tune</span>
                        <span>Sharp (+50)</span>
                    </div>

                    <div className="w-full h-8 bg-white/5 rounded-2xl mt-6 border border-white/5 overflow-hidden relative">
                        {/* Perfect Zone */}
                        <div className="absolute left-1/2 -translate-x-1/2 w-4 h-full bg-green-500/20" />

                        {/* Needle */}
                        <div
                            className={`
                                absolute top-1/2 -translate-y-1/2 w-1.5 h-6 rounded-full transition-all duration-75 shadow-2xl
                                ${feedback?.text === 'PERFEITO' ? 'bg-green-500 shadow-green-500/50' : 'bg-[#E87A2C] shadow-[#E87A2C]/50'}
                            `}
                            style={{ left: `${getDeviationPx()}%`, transform: 'translate(-50%, -50%)' }}
                        />
                    </div>
                </div>

                <div className="text-center relative">
                    {feedback && (
                        <div className={`absolute -top-12 left-1/2 -translate-x-1/2 flex items-center gap-2 px-6 py-2 rounded-full bg-white/5 border border-white/10 ${feedback.color} animate-bounce block`}>
                            <feedback.icon className="w-4 h-4" />
                            <span className="font-black text-xs uppercase tracking-widest">{feedback.text}</span>
                        </div>
                    )}

                    <div className="text-[160px] font-black text-white leading-none tracking-tighter select-none">
                        {note || '--'}
                    </div>

                    <div className="flex flex-col gap-1 mt-4">
                        <span className="text-2xl font-black text-[#E87A2C] tracking-tight tabular-nums">
                            {pitch ? `${pitch.toFixed(1)} Hz` : 'Silêncio...'}
                        </span>
                        {targetFrequency && (
                            <span className="text-[10px] font-bold text-stone-600 uppercase tracking-widest">
                                Alvo: {targetFrequency.toFixed(1)} Hz
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <button
                onClick={isListening ? stopRecording : startRecording}
                className={`
                    w-full py-8 rounded-[32px] flex items-center justify-center gap-4 transition-all active:scale-[0.98]
                    ${isListening
                        ? 'bg-white text-black'
                        : 'bg-[#E87A2C] text-white shadow-[0_20px_40px_rgba(232,122,44,0.2)] shadow-xl'}
                `}
            >
                {isListening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                <span className="font-black uppercase tracking-[0.2em] text-sm">
                    {isListening ? 'DESATIVAR ESCUTA' : 'INICIAR AFINAÇÃO'}
                </span>
            </button>
        </div>
    );
};
