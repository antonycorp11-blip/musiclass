
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Square, Trash2, Activity, Volume2, Mic, Plus, Check, RotateCcw, LayoutGrid, Music, Eraser, Move, Save } from 'lucide-react';

const DEFAULT_PARTS_CONFIG = [
    { id: 'hihat', name: 'HI-HAT', icon: '×', color: 'bg-orange-500', top: '35%', left: '19%', size: '80px' },
    { id: 'crash', name: 'CRASH/RIDE', icon: '✳', color: 'bg-yellow-500', top: '15%', left: '80%', size: '110px' },
    { id: 'tom1', name: 'TOM 1', icon: '◦', color: 'bg-emerald-500', top: '22%', left: '42%', size: '90px' },
    { id: 'tom2', name: 'TOM 2', icon: '◦', color: 'bg-emerald-600', top: '22%', left: '58%', size: '90px' },
    { id: 'snare', name: 'SNARE', icon: '⊚', color: 'bg-blue-600', top: '55%', left: '35%', size: '110px' },
    { id: 'kick', name: 'KICK', icon: '🥁', color: 'bg-rose-500', top: '65%', left: '51%', size: '120px' },
    { id: 'floor', name: 'FLOOR TOM', icon: '◯', color: 'bg-purple-600', top: '55%', left: '76%', size: '110px' },
];

interface Rhythm {
    id: string;
    title: string;
    sequence: string[][];
    bpm: number;
}

interface DrumsStudioProps {
    initialRhythms?: any[];
    initialRudiments?: any[];
    initialPositions?: any;
    onChange: (data: { rhythms: any[], rudiments: any[], positions?: any }) => void;
    onRecordLoop?: (blob: Blob, title: string) => void;
}

export const DrumsStudio: React.FC<DrumsStudioProps> = ({
    initialRhythms = [],
    initialRudiments = [],
    initialPositions,
    onChange,
    onRecordLoop
}) => {
    const [rhythms, setRhythms] = useState<Rhythm[]>(initialRhythms.length > 0 ? initialRhythms : [
        { id: 'r-1', title: 'RITMO A', sequence: Array.from({ length: 8 }, () => []), bpm: 100 }
    ]);
    const [rudiments, setRudiments] = useState<any[]>(initialRudiments.length > 0 ? initialRudiments : [
        { id: 'rud-1', title: 'SINGLE STROKE', pattern: ['R', 'L', 'R', 'L', 'R', 'L', 'R', 'L'] }
    ]);
    const [padConfigs, setPadConfigs] = useState<any[]>(initialPositions || DEFAULT_PARTS_CONFIG);
    const [isEditMode, setIsEditMode] = useState(false);
    const [draggingPart, setDraggingPart] = useState<string | null>(null);

    const [selectedRhythmIdx, setSelectedRhythmIdx] = useState(0);
    const [selectedStep, setSelectedStep] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [isMetronomeActive, setIsMetronomeActive] = useState(true);
    const [isCountingIn, setIsCountingIn] = useState(false);
    const [countInValue, setCountInValue] = useState(0);
    const [currentPlayStep, setCurrentPlayStep] = useState(-1);
    const [bpm, setBpm] = useState(100);

    const containerRef = useRef<HTMLDivElement>(null);
    const audioContext = useRef<AudioContext | null>(null);
    const masterGain = useRef<GainNode | null>(null);
    const streamDest = useRef<MediaStreamAudioDestinationNode | null>(null);
    const recorder = useRef<MediaRecorder | null>(null);
    const timerId = useRef<number | null>(null);
    const lastTickTime = useRef(0);
    const stepIndex = useRef(0);
    const recordTimeoutId = useRef<any>(null);

    const initAudio = () => {
        if (!audioContext.current) {
            audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            masterGain.current = audioContext.current.createGain();
            masterGain.current.connect(audioContext.current.destination);
            streamDest.current = audioContext.current.createMediaStreamDestination();
            masterGain.current.connect(streamDest.current);
        }
        if (audioContext.current.state === 'suspended') audioContext.current.resume();
    };

    const playSound = (type: string, time: number) => {
        if (!audioContext.current || !masterGain.current) return;
        const gain = audioContext.current.createGain();

        if (type === 'kick') {
            const osc = audioContext.current.createOscillator();
            osc.frequency.setValueAtTime(120, time);
            osc.frequency.exponentialRampToValueAtTime(30, time + 0.1);
            gain.gain.setValueAtTime(2.0, time);
            gain.gain.exponentialRampToValueAtTime(0.01, time + 0.5);
            osc.connect(gain); osc.start(time); osc.stop(time + 0.5);
        } else if (type === 'snare') {
            const osc = audioContext.current.createOscillator();
            osc.type = 'triangle'; osc.frequency.setValueAtTime(180, time);
            const oGain = audioContext.current.createGain();
            oGain.gain.setValueAtTime(0.7, time);
            oGain.gain.exponentialRampToValueAtTime(0.01, time + 0.1);

            const bufSize = audioContext.current.sampleRate * 0.2;
            const buf = audioContext.current.createBuffer(1, bufSize, audioContext.current.sampleRate);
            const data = buf.getChannelData(0);
            for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
            const noise = audioContext.current.createBufferSource();
            noise.buffer = buf;
            const nGain = audioContext.current.createGain();
            nGain.gain.setValueAtTime(0.6, time);
            nGain.gain.exponentialRampToValueAtTime(0.01, time + 0.25);

            osc.connect(oGain); oGain.connect(gain);
            noise.connect(nGain); nGain.connect(gain);
            osc.start(time); noise.start(time);
            osc.stop(time + 0.25); noise.stop(time + 0.25);
        } else if (type === 'hihat') {
            const bufSize = audioContext.current.sampleRate * 0.05;
            const buf = audioContext.current.createBuffer(1, bufSize, audioContext.current.sampleRate);
            const data = buf.getChannelData(0);
            for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
            const noise = audioContext.current.createBufferSource(); noise.buffer = buf;
            const filter = audioContext.current.createBiquadFilter();
            filter.type = 'highpass'; filter.frequency.value = 10000;
            gain.gain.setValueAtTime(0.4, time);
            gain.gain.exponentialRampToValueAtTime(0.01, time + 0.05);
            noise.connect(filter); filter.connect(gain); noise.start(time);
        } else if (type === 'crash' || type === 'crash/ride') {
            // High fidelity Crash synthesis
            const bufSize = audioContext.current.sampleRate * 3.0;
            const buf = audioContext.current.createBuffer(1, bufSize, audioContext.current.sampleRate);
            const data = buf.getChannelData(0);
            for (let i = 0; i < bufSize; i++) {
                const noise = Math.random() * 2 - 1;
                data[i] = noise * Math.exp(-i / (audioContext.current.sampleRate * 0.8));
            }
            const noise = audioContext.current.createBufferSource(); noise.buffer = buf;
            const filter = audioContext.current.createBiquadFilter();
            filter.type = 'highpass'; filter.frequency.value = 7500;

            const shimmer = audioContext.current.createOscillator();
            shimmer.type = 'sine'; shimmer.frequency.value = 8000;
            const sGain = audioContext.current.createGain();
            sGain.gain.setValueAtTime(0.1, time);
            sGain.gain.exponentialRampToValueAtTime(0.01, time + 2.0);
            shimmer.connect(sGain); sGain.connect(gain); shimmer.start(time); shimmer.stop(time + 2.0);

            gain.gain.setValueAtTime(0.8, time);
            gain.gain.exponentialRampToValueAtTime(0.01, time + 2.5);
            noise.connect(filter); filter.connect(gain); noise.start(time);
        } else if (type === 'metronome-high') {
            const osc = audioContext.current.createOscillator();
            osc.frequency.setValueAtTime(1000, time);
            gain.gain.setValueAtTime(0.5, time);
            gain.gain.exponentialRampToValueAtTime(0.01, time + 0.05);
            osc.connect(gain); osc.start(time); osc.stop(time + 0.05);
        } else if (type === 'metronome-low') {
            const osc = audioContext.current.createOscillator();
            osc.frequency.setValueAtTime(800, time);
            gain.gain.setValueAtTime(0.3, time);
            gain.gain.exponentialRampToValueAtTime(0.01, time + 0.05);
            osc.connect(gain); osc.start(time); osc.stop(time + 0.05);
        } else {
            const freq = type.includes('tom') ? 160 : type === 'floor' ? 90 : 400;
            const osc = audioContext.current.createOscillator();
            osc.frequency.setValueAtTime(freq, time);
            osc.frequency.exponentialRampToValueAtTime(freq * 0.5, time + 0.4);
            gain.gain.setValueAtTime(1.0, time);
            gain.gain.exponentialRampToValueAtTime(0.01, time + 0.6);
            osc.connect(gain); osc.start(time); osc.stop(time + 0.6);
        }
        gain.connect(masterGain.current);
    };

    const scheduler = useCallback(() => {
        if (!audioContext.current || rhythms.length === 0) return;
        const scheduleAheadTime = 0.1;
        const secondsPerStep = 60.0 / bpm / 4;

        while (lastTickTime.current < audioContext.current.currentTime + scheduleAheadTime) {
            const time = lastTickTime.current;

            // Metronome (On beats 0, 4, 8, 12)
            if (isMetronomeActive) {
                if (stepIndex.current % 4 === 0) {
                    playSound(stepIndex.current === 0 ? 'metronome-high' : 'metronome-low', time);
                }
            }

            // Rhythm steps (Only if not counting in)
            if (!isCountingIn) {
                const currentRhythm = rhythms[selectedRhythmIdx];
                const partsAtStep = currentRhythm.sequence[stepIndex.current] || [];
                partsAtStep.forEach(partId => playSound(partId, time));

                const currentStepToSet = stepIndex.current;
                setTimeout(() => setCurrentPlayStep(currentStepToSet), 0);
            } else {
                // Count-in logic
                if (stepIndex.current % 4 === 0) {
                    const beat = Math.floor(stepIndex.current / 4) + 1;
                    setTimeout(() => setCountInValue(beat), 0);
                }
            }

            lastTickTime.current += secondsPerStep;
            stepIndex.current = (stepIndex.current + 1) % 8;

            // Loop logic for count-in transition
            if (stepIndex.current === 0 && isCountingIn) {
                setTimeout(() => {
                    setIsCountingIn(false);
                    if (isRecording && recorder.current && recorder.current.state === 'inactive') {
                        recorder.current.start();
                    }
                }, 0);
            }
        }
        timerId.current = window.requestAnimationFrame(scheduler);
    }, [bpm, rhythms, selectedRhythmIdx, isMetronomeActive, isCountingIn, isRecording]);

    useEffect(() => {
        if (isPlaying) {
            stepIndex.current = 0;
            lastTickTime.current = audioContext.current!.currentTime;
            scheduler();
        } else {
            if (timerId.current) window.cancelAnimationFrame(timerId.current);
            setCurrentPlayStep(-1);
        }
        return () => { if (timerId.current) window.cancelAnimationFrame(timerId.current); };
    }, [isPlaying, scheduler]);

    const togglePartInStep = (partId: string) => {
        if (isEditMode) return;
        const newRhythms = [...rhythms];
        const step = newRhythms[selectedRhythmIdx].sequence[selectedStep];
        if (step.includes(partId)) {
            newRhythms[selectedRhythmIdx].sequence[selectedStep] = step.filter(id => id !== partId);
        } else {
            newRhythms[selectedRhythmIdx].sequence[selectedStep] = [...step, partId];
        }
        setRhythms(newRhythms);
        onChange({ rhythms: newRhythms, rudiments, positions: padConfigs });
        initAudio(); playSound(partId, audioContext.current!.currentTime);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isEditMode || !draggingPart || !containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;

        const newConfigs = padConfigs.map(p =>
            p.id === draggingPart ? { ...p, left: `${x.toFixed(1)}%`, top: `${y.toFixed(1)}%` } : p
        );
        setPadConfigs(newConfigs);
    };

    const savePositions = () => {
        setIsEditMode(false);
        onChange({ rhythms, rudiments, positions: padConfigs });
    };

    const clearAll = () => {
        if (window.confirm("Deseja apagar TODO o ritmo atual?")) {
            const newRhythms = [...rhythms];
            newRhythms[selectedRhythmIdx].sequence = Array.from({ length: 8 }, () => []);
            setRhythms(newRhythms);
            onChange({ rhythms: newRhythms, rudiments, positions: padConfigs });
        }
    };

    const handleRecord = () => {
        initAudio();
        if (!streamDest.current) return;

        // SE JÁ ESTIVER GRAVANDO: PARAR IMEDIATAMENTE
        if (isRecording) {
            if (recordTimeoutId.current) clearTimeout(recordTimeoutId.current);
            if (recorder.current && recorder.current.state === 'recording') {
                recorder.current.stop();
            }
            setIsPlaying(false);
            setIsCountingIn(false);
            setIsRecording(false);
            return;
        }

        setIsPlaying(false);
        if (timerId.current) window.cancelAnimationFrame(timerId.current);

        setIsRecording(true);
        setIsCountingIn(true);
        setCountInValue(0);

        const chunks: Blob[] = [];
        recorder.current = new MediaRecorder(streamDest.current.stream);
        recorder.current.ondataavailable = (e) => chunks.push(e.data);
        recorder.current.onstop = () => {
            const blob = new Blob(chunks, { type: 'audio/webm' });
            if (onRecordLoop) onRecordLoop(blob, rhythms[selectedRhythmIdx]?.title || 'Loop de Bateria');
            setIsRecording(false);
        };

        // Initialize state for scheduler
        stepIndex.current = 0;
        lastTickTime.current = audioContext.current.currentTime + 0.1;
        setIsPlaying(true);

        // Record for exactly 15 seconds or until user stops manually
        const recordingDuration = 15;
        const countInDuration = (60 / bpm) * 4;

        if (recordTimeoutId.current) clearTimeout(recordTimeoutId.current);
        recordTimeoutId.current = setTimeout(() => {
            if (recorder.current && recorder.current.state === 'recording') {
                recorder.current.stop();
                setIsPlaying(false);
            }
        }, (countInDuration + recordingDuration) * 1000 + 400);
    };

    const addRudiment = () => {
        const next = [...rudiments, { id: Math.random().toString(36).substr(2, 9), title: 'NOVO RUDIMENTO', pattern: ['R', 'L', 'R', 'L'] }];
        setRudiments(next);
        onChange({ rhythms, rudiments: next, positions: padConfigs });
    };

    const removeRudiment = (id: string) => {
        const next = rudiments.filter(r => r.id !== id);
        setRudiments(next);
        onChange({ rhythms, rudiments: next, positions: padConfigs });
    };

    const updateRudiment = (idx: number, updates: any) => {
        const next = [...rudiments];
        next[idx] = { ...next[idx], ...updates };
        setRudiments(next);
        onChange({ rhythms, rudiments: next, positions: padConfigs });
    };

    return (
        <div className="space-y-8 relative">
            {/* Visual Count-in Overlay */}
            {isCountingIn && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
                    <div className="bg-[#1A110D]/80 backdrop-blur-md w-48 h-48 rounded-full flex items-center justify-center border-4 border-[#E87A2C] animate-in zoom-in-50 duration-300">
                        <span className="text-8xl font-black text-white animate-pulse">{countInValue}</span>
                    </div>
                </div>
            )}
            <section className="bg-white rounded-[40px] p-6 md:p-10 border border-[#3C2415]/10 shadow-sm relative overflow-hidden">
                {/* Barra Superior */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                    <div className="flex items-center gap-4">
                        <div>
                            <h3 className="text-xl font-black text-[#1A110D] uppercase tracking-tighter flex items-center gap-2">
                                <Activity className="text-[#E87A2C] w-6 h-6" /> MUSICLASS DRUMS STUDIO
                            </h3>
                            <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest mt-1">KIT PROFISSIONAL PERSONALIZÁVEL</p>
                        </div>
                        <button
                            onClick={() => isEditMode ? savePositions() : setIsEditMode(true)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-[9px] font-black uppercase transition-all ${isEditMode
                                ? 'bg-emerald-500 text-white border-emerald-400'
                                : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
                                }`}
                        >
                            {isEditMode ? <><Save className="w-3.5 h-3.5" /> Salvar Kit</> : <><Move className="w-3.5 h-3.5" /> Calibrar Kit</>}
                        </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex gap-1 bg-stone-100 p-1.5 rounded-2xl shadow-inner">
                            {rhythms.map((r, i) => (
                                <button key={r.id} onClick={() => setSelectedRhythmIdx(i)} className={`px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all ${selectedRhythmIdx === i ? 'bg-[#E87A2C] text-white shadow-md' : 'text-stone-400 hover:bg-stone-200'}`}>{r.title}</button>
                            ))}
                            <button onClick={() => {
                                const newR = { id: Math.random().toString(36).substr(2, 9), title: `RITMO ${rhythms.length + 1}`, sequence: Array.from({ length: 8 }, () => []), bpm: 100 };
                                const next = [...rhythms, newR]; setRhythms(next); setSelectedRhythmIdx(next.length - 1);
                                onChange({ rhythms: next, rudiments, positions: padConfigs });
                            }} className="px-3 py-2 text-[#E87A2C] hover:bg-orange-100 rounded-xl transition-all"><Plus className="w-4 h-4" /></button>
                        </div>

                        <div className="bg-stone-50 border border-stone-200 px-4 py-3.5 rounded-2xl flex items-center gap-4">
                            <span className="text-[10px] font-black text-[#E87A2C] w-16">{bpm} BPM</span>
                            <input type="range" min="40" max="220" value={bpm} onChange={(e) => setBpm(Number(e.target.value))} className="w-24 md:w-32 accent-[#E87A2C] h-1.5" />
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={() => setIsMetronomeActive(!isMetronomeActive)}
                                className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-all ${isMetronomeActive ? 'bg-[#E87A2C]/10 text-[#E87A2C] border-2 border-[#E87A2C]/20' : 'bg-stone-100 text-stone-400 border border-stone-200'}`}
                                title="Metrônomo"
                            >
                                <Music className="w-5 h-5" />
                            </button>
                            <button
                                onClick={handleRecord}
                                className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-all ${isRecording ? 'bg-red-600 animate-pulse' : 'bg-[#1A110D]'}`}
                                title="Gravar Loop"
                            >
                                <Mic className={`w-5 h-5 ${isRecording ? 'text-white' : 'text-red-500'}`} />
                            </button>
                            <button
                                onClick={() => { initAudio(); setIsPlaying(!isPlaying); }}
                                className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-all ${isPlaying ? 'bg-rose-500' : 'bg-[#E87A2C]'}`}
                                title={isPlaying ? "Parar" : "Play"}
                            >
                                {isPlaying ? <Square className="w-5 h-5 text-white fill-current" /> : <Play className="w-5 h-5 text-white fill-current ml-1" />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* PAUTA SUPERIOR */}
                <div className="mb-6">
                    <div className="flex gap-1 overflow-x-auto pb-4 pt-2 px-1 scrollbar-hide">
                        {rhythms[selectedRhythmIdx].sequence.map((stepParts, idx) => (
                            <div
                                key={idx}
                                onClick={() => setSelectedStep(idx)}
                                className={`relative min-w-[55px] md:min-w-[65px] h-32 rounded-[20px] cursor-pointer transition-all border-2 flex flex-col items-center justify-center gap-1 ${selectedStep === idx ? 'bg-orange-50 border-[#E87A2C] shadow-lg scale-105 z-10' : 'bg-stone-50 border-stone-100'
                                    } ${currentPlayStep === idx ? 'ring-2 ring-orange-500 scale-105' : ''}`}
                            >
                                {idx % 4 === 0 && <span className="absolute -top-3 text-[8px] font-black text-[#E87A2C] bg-white px-1.5 rounded-full shadow-sm">{Math.floor(idx / 4) + 1}</span>}
                                <div className="flex flex-col gap-1 w-full items-center p-1 min-h-[100px] justify-start mt-2">
                                    {['crash', 'hihat', 'tom1', 'tom2', 'snare', 'floor', 'kick'].map(partId => {
                                        const isActive = stepParts.includes(partId) || (partId === 'crash' && stepParts.includes('crash/ride'));
                                        if (!isActive) return null;
                                        const part = padConfigs.find(p => p.id === partId || (p.id === 'crash' && partId === 'crash'));
                                        return <div key={partId} className={`w-6 h-6 md:w-8 md:h-8 rounded-lg flex items-center justify-center shadow-sm ${part?.color} text-white font-black text-[10px]`}>{part?.icon}</div>;
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* BATERIA REAL - AREA DE TOQUE E CALIBRAÇÃO */}
                <div
                    ref={containerRef}
                    onMouseMove={handleMouseMove}
                    onMouseUp={() => setDraggingPart(null)}
                    onMouseLeave={() => setDraggingPart(null)}
                    className="relative bg-[#0d0d0d] rounded-[48px] overflow-hidden aspect-video flex items-center justify-center shadow-2xl group border-4 border-[#1A110D] cursor-crosshair"
                >
                    {/* KIT IMAGE BACKGROUND */}
                    <img
                        src="/assets/drums/drum_kit.png"
                        alt="Professional Drum Kit"
                        className={`absolute inset-0 w-full h-full object-cover pointer-events-none transition-all duration-700 ${isEditMode ? 'opacity-40 blur-sm scale-95' : 'opacity-80 group-hover:scale-105'}`}
                    />

                    {/* PADS DE INTERAÇÃO */}
                    <div className="absolute inset-0 z-10">
                        {padConfigs.map(part => {
                            const active = rhythms[selectedRhythmIdx].sequence[selectedStep].includes(part.id);
                            return (
                                <div
                                    key={part.id}
                                    onMouseDown={() => isEditMode && setDraggingPart(part.id)}
                                    className={`absolute flex flex-col items-center justify-center transition-all ${isEditMode ? 'cursor-move z-30' : 'z-10'}`}
                                    style={{
                                        top: part.top,
                                        left: part.left,
                                        width: part.size,
                                        height: part.size,
                                        transform: 'translate(-50%, -50%)'
                                    }}
                                >
                                    <button
                                        onClick={() => togglePartInStep(part.id)}
                                        className={`w-full h-full rounded-full border-2 transition-all duration-300 flex flex-col items-center justify-center group/part relative ${isEditMode
                                            ? 'bg-emerald-500/20 border-emerald-500 animate-pulse ring-4 ring-emerald-500/10'
                                            : active
                                                ? 'bg-[#E87A2C]/40 border-white scale-110 shadow-[0_0_40px_rgba(232,122,44,0.5)]'
                                                : 'bg-white/0 border-transparent hover:bg-white/10 hover:border-white/20'
                                            }`}
                                    >
                                        {isEditMode && <Move className="w-5 h-5 text-emerald-500 absolute -top-8 animate-bounce" />}

                                        <div className={`pointer-events-none transition-all flex flex-col items-center ${active || isEditMode ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
                                            <span className="text-xl mb-1">{part.icon}</span>
                                            <span className={`bg-[#1A110D] text-white px-3 py-1 rounded-full text-[7px] font-black tracking-widest shadow-xl border border-white/10 uppercase`}>
                                                {part.name}
                                            </span>
                                        </div>
                                    </button>
                                </div>
                            );
                        })}
                    </div>

                    {isEditMode && (
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none flex flex-col items-center gap-4 z-40 bg-emerald-500 text-white px-10 py-6 rounded-3xl shadow-2xl animate-in zoom-in-50">
                            <Move className="w-10 h-10 mb-2" />
                            <h4 className="text-xl font-black uppercase tracking-tighter">Modo de Calibração</h4>
                            <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">Arraste os botões para as posições reais da bateria</p>
                        </div>
                    )}

                    {/* APAGAR TUDO */}
                    {!isEditMode && (
                        <button
                            onClick={clearAll}
                            className="absolute bottom-6 right-6 z-20 flex items-center gap-3 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white border border-rose-500/20 rounded-2xl px-5 py-3 font-black transition-all shadow-xl group/clear"
                        >
                            <Trash2 className="w-5 h-5" />
                            <span className="text-[10px] uppercase tracking-widest">Apagar Ritmo</span>
                        </button>
                    )}
                </div>
            </section>

            {/* RUDIMENTOS */}
            <section className="bg-white rounded-[40px] p-8 border border-[#3C2415]/10 shadow-sm">
                <div className="flex justify-between items-center mb-8">
                    <h3 className="text-xl font-black text-[#1A110D] uppercase tracking-tighter flex items-center gap-3">
                        <Volume2 className="text-[#E87A2C]" /> Fundamentos e Técnica de Mãos (R/L)
                    </h3>
                    <button onClick={addRudiment} className="px-6 py-3 bg-[#1A110D] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-stone-800 transition-all">
                        <Plus className="w-4 h-4" /> Novo Rudimento
                    </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {rudiments.map((rud, rIdx) => (
                        <div key={rud.id} className="bg-stone-50 p-6 rounded-[32px] border border-stone-200 group transition-all hover:bg-white hover:shadow-md">
                            <div className="flex justify-between items-center mb-6">
                                <input value={rud.title} onChange={(e) => updateRudiment(rIdx, { title: e.target.value })} className="bg-transparent border-none font-black text-sm uppercase text-[#1A110D] p-0 focus:ring-0" />
                                <button onClick={() => removeRudiment(rud.id)} className="text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-4 h-4" /></button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {rud.pattern.map((hand: string, sIdx: number) => (
                                    <button
                                        key={sIdx}
                                        onClick={() => {
                                            const nextPattern = [...rud.pattern];
                                            nextPattern[sIdx] = hand === 'R' ? 'L' : 'R';
                                            updateRudiment(rIdx, { pattern: nextPattern });
                                        }}
                                        className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg transition-all ${hand === 'R' ? 'bg-[#E87A2C] text-white' : 'bg-[#1A110D] text-white'}`}
                                    >
                                        {hand}
                                    </button>
                                ))}
                                <button onClick={() => {
                                    const nextPattern = [...rud.pattern, 'R'];
                                    updateRudiment(rIdx, { pattern: nextPattern });
                                }} className="w-12 h-12 rounded-xl flex items-center justify-center border-2 border-dashed border-stone-200 text-stone-300 hover:text-[#E87A2C] hover:border-[#E87A2C] transition-all">
                                    <Plus className="w-5 h-5" />
                                </button>
                                {rud.pattern.length > 2 && (
                                    <button onClick={() => {
                                        const nextPattern = rud.pattern.slice(0, -1);
                                        updateRudiment(rIdx, { pattern: nextPattern });
                                    }} className="w-12 h-12 rounded-xl flex items-center justify-center border-2 border-dashed border-rose-100 text-rose-200 hover:text-rose-500 hover:border-rose-500 transition-all">
                                        <Eraser className="w-5 h-5" />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                    {rudiments.length === 0 && (
                        <div className="col-span-full py-16 text-center border-2 border-dashed border-stone-100 rounded-[32px] font-black uppercase text-[10px] tracking-widest text-stone-300">
                            Nenhum rudimento cadastrado
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
};
