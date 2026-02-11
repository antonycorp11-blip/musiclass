import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Lock, Unlock, Activity } from 'lucide-react';
import { PitchDetector } from 'pitchy';

const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export const Tuner: React.FC = () => {
    const [isListening, setIsListening] = useState(false);
    const [pitch, setPitch] = useState<number | null>(null);
    const [note, setNote] = useState<string>('');
    const [clarity, setClarity] = useState(0);
    const [lockedNote, setLockedNote] = useState<string | null>(null);
    const [sensitivity, setSensitivity] = useState(0.85); // Default high sensitivity for vocals

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
    };

    const detectPitch = () => {
        if (!analyserRef.current || !audioContextRef.current) return;

        const data = new Float32Array(analyserRef.current.fftSize);
        analyserRef.current.getFloatTimeDomainData(data);

        const detector = PitchDetector.forFloat32Array(analyserRef.current.fftSize);
        const [detectedPitch, detectedClarity] = detector.findPitch(data, audioContextRef.current.sampleRate);

        setClarity(detectedClarity);

        if (detectedClarity > sensitivity) {
            const roundedPitch = Math.round(detectedPitch * 10) / 10;
            setPitch(roundedPitch);

            // Calculate Note
            const midi = 12 * (Math.log2(detectedPitch / 440)) + 69;
            const noteIndex = Math.round(midi) % 12;
            const currentNote = NOTES[noteIndex];

            if (lockedNote) {
                if (currentNote === lockedNote) {
                    setNote(currentNote);
                }
            } else {
                setNote(currentNote);
            }
        }

        animationFrameRef.current = requestAnimationFrame(detectPitch);
    };

    // UI Helper for "Cent" deviation (simplified)
    const getDeviation = () => {
        if (!pitch) return 0;
        const midi = 12 * (Math.log2(pitch / 440)) + 69;
        return (midi - Math.round(midi)) * 100;
    };

    return (
        <div className="bg-stone-50 p-8 rounded-[32px] border border-stone-100 space-y-8 h-full">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Activity className={`w-4 h-4 ${isListening ? 'text-[#E87A2C] animate-pulse' : 'text-stone-300'}`} />
                    <h3 className="font-black uppercase text-xs tracking-widest text-stone-400">Afinador de Alta Precisão</h3>
                </div>
                <button
                    onClick={() => setLockedNote(lockedNote ? null : note)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[9px] font-black uppercase transition-all ${lockedNote ? 'bg-red-500 text-white' : 'bg-stone-200 text-stone-500 hover:bg-stone-300'}`}
                >
                    {lockedNote ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                    {lockedNote ? `TRAVADO EM ${lockedNote}` : 'TRAVAR NOTA'}
                </button>
            </div>

            <div className="flex flex-col items-center justify-center py-10 relative">
                {/* Visual Meter */}
                <div className="absolute top-0 w-full flex justify-between px-10 text-[8px] font-bold text-stone-300 uppercase tracking-widest">
                    <span>-50</span>
                    <span>FLAT</span>
                    <span className="text-[#E87A2C]">PERFEITO</span>
                    <span>SHARP</span>
                    <span>+50</span>
                </div>

                <div className="w-full h-1.5 bg-stone-200 rounded-full mt-4 overflow-hidden relative">
                    <div
                        className={`absolute h-full transition-all duration-100 ${Math.abs(getDeviation()) < 5 ? 'bg-green-500 w-1' : 'bg-[#E87A2C] w-1'}`}
                        style={{ left: `${50 + (getDeviation())}%`, transform: 'translateX(-50%)' }}
                    />
                    <div className="absolute left-1/2 -top-1 w-px h-3 bg-[#E87A2C]/20" />
                </div>

                <div className="text-center mt-8 space-y-2">
                    <div className="text-9xl font-black text-[#1A110D] tracking-tighter min-h-[140px]">
                        {note || '--'}
                    </div>
                    <div className="text-xl font-black text-[#E87A2C] tracking-tight">
                        {pitch ? `${pitch} Hz` : 'Aguardando silêncio...'}
                    </div>
                </div>

                {isListening && clarity < sensitivity && (
                    <div className="mt-4 text-[9px] font-bold text-red-500 uppercase animate-pulse">
                        Aumente o volume ou limpe o som
                    </div>
                )}
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-2xl border border-stone-200">
                    <span className="text-[9px] font-black text-stone-400 uppercase block mb-2">Sensibilidade Vocal</span>
                    <input
                        type="range" min="0.5" max="0.99" step="0.01"
                        value={sensitivity}
                        onChange={(e) => setSensitivity(parseFloat(e.target.value))}
                        className="w-full h-1.5 bg-stone-100 rounded-lg appearance-none cursor-pointer accent-[#E87A2C]"
                    />
                </div>
                <button
                    onClick={isListening ? stopRecording : startRecording}
                    className={`py-5 rounded-2xl flex items-center justify-center gap-3 transition-all ${isListening ? 'bg-stone-800 text-white' : 'bg-[#E87A2C] text-white shadow-lg shadow-orange-500/20 shadow-xl'}`}
                >
                    {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                    <span className="font-black uppercase tracking-widest text-xs">
                        {isListening ? 'DESLIGAR AFINADOR' : 'ATIVAR MICROFONE'}
                    </span>
                </button>
            </div>
        </div>
    );
};
