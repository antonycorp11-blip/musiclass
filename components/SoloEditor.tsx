
import React, { useEffect, useRef, useState } from 'react';
import { SoloNote } from '../types';

// Note frequencies for the oscillator
const NOTE_FREQS: Record<string, number> = {
    'C3': 130.81, 'C#3': 138.59, 'D3': 146.83, 'D#3': 155.56, 'E3': 164.81, 'F3': 174.61, 'F#3': 185.00, 'G3': 196.00, 'G#3': 207.65, 'A3': 220.00, 'A#3': 233.08, 'B3': 246.94,
    'C4': 261.63, 'C#4': 277.18, 'D4': 293.66, 'D#4': 311.13, 'E4': 329.63, 'F4': 349.23, 'F#4': 369.99, 'G4': 392.00, 'G#4': 415.30, 'A4': 440.00, 'A#4': 466.16, 'B4': 493.88,
    'C5': 523.25
};

const WHITE_KEYS = ['C3', 'D3', 'E3', 'F3', 'G3', 'A3', 'B3', 'C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'];
const BLACK_KEYS_CONFIG = [
    { note: 'C#3', afterIdx: 0, label: 'C#' }, { note: 'D#3', afterIdx: 1, label: 'D#' },
    { note: 'F#3', afterIdx: 3, label: 'F#' }, { note: 'G#3', afterIdx: 4, label: 'G#' }, { note: 'A#3', afterIdx: 5, label: 'A#' },
    { note: 'C#4', afterIdx: 7, label: 'C#' }, { note: 'D#4', afterIdx: 8, label: 'D#' },
    { note: 'F#4', afterIdx: 10, label: 'F#' }, { note: 'G#4', afterIdx: 11, label: 'G#' }, { note: 'A#4', afterIdx: 12, label: 'A#' }
];

const ALL_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

interface SoloEditorProps {
    id: string;
    title: string;
    notes: SoloNote[];
    instrument?: string;
    onUpdate: (title: string, notes: SoloNote[]) => void;
    onRemove: () => void;
}

export const SoloEditor: React.FC<SoloEditorProps> = ({ title, notes, instrument, onUpdate, onRemove }) => {
    const audioCtx = useRef<AudioContext | null>(null);
    const [inputType, setInputType] = useState<'solo' | 'harmony'>('solo');
    const [activeSlot, setActiveSlot] = useState(0);
    const [draggedNote, setDraggedNote] = useState<{ note: string, type: string, index: number } | null>(null);

    const isKeyboardInstrument = instrument?.toLowerCase().includes('teclado') ||
        instrument?.toLowerCase().includes('piano') ||
        instrument?.toLowerCase().includes('vocal');

    // Convert notes list to a more manageable grid structure for UI
    const SLOTS_COUNT = 32;
    const grid: { harmony: string[], solo: string[] }[] = Array.from({ length: SLOTS_COUNT }, () => ({ harmony: [], solo: [] }));

    notes.forEach(n => {
        const pos = n.position || 0;
        if (pos < SLOTS_COUNT) {
            if (n.type === 'harmony') grid[pos].harmony.push(n.note);
            else grid[pos].solo.push(n.note);
        }
    });

    const playNote = (note: string) => {
        const cleanNote = note.replace(/[0-9]/g, '');
        const freqKey = isKeyboardInstrument ? note : (note + '4');

        if (!audioCtx.current || audioCtx.current.state === 'suspended') {
            audioCtx.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        const ctx = audioCtx.current;
        const o = ctx.createOscillator();
        const g = ctx.createGain();

        o.type = inputType === 'solo' ? 'triangle' : 'square';
        o.frequency.setValueAtTime(NOTE_FREQS[freqKey] || 440, ctx.currentTime);

        g.gain.setValueAtTime(0.2, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.0);

        o.connect(g);
        g.connect(ctx.destination);

        o.start();
        o.stop(ctx.currentTime + 1.0);

        // Add note to active slot
        const newNotes = [...notes, { note: cleanNote, type: inputType, position: activeSlot }];
        onUpdate(title, newNotes);
    };

    const removeNoteAt = (pos: number, type: 'solo' | 'harmony', noteName: string) => {
        const newNotes = notes.filter(n => !(n.position === pos && n.type === type && n.note === noteName));
        onUpdate(title, newNotes);
    };

    const handleDrop = (targetPos: number) => {
        if (!draggedNote) return;
        const filtered = notes.filter(n => !(n.position === draggedNote.index && n.type === draggedNote.type && n.note === draggedNote.note));
        onUpdate(title, [...filtered, { note: draggedNote.note, type: draggedNote.type as any, position: targetPos }]);
        setDraggedNote(null);
    };

    return (
        <div className="bg-white rounded-[64px] p-10 border border-[#3C2415]/5 shadow-sm space-y-10">
            <div className="flex justify-between items-center border-b border-stone-50 pb-6">
                <div className="flex flex-col gap-1 w-2/3">
                    <span className="text-[8px] font-black text-[#E87A2C] uppercase tracking-[0.4em]">Ditador MusiClass Grid (Encaixe Perfeito)</span>
                    <input
                        value={title}
                        onChange={(e) => onUpdate(e.target.value, notes)}
                        placeholder="Nome da parte (ex: Introdução)"
                        className="text-2xl font-black text-[#1A110D] uppercase tracking-tighter bg-transparent border-none focus:ring-0 w-full"
                    />
                </div>
                <button onClick={onRemove} className="text-rose-400 font-black text-[10px] uppercase tracking-widest hover:bg-rose-50 px-4 py-2 rounded-xl transition-all">Remover</button>
            </div>

            <div className="flex flex-col gap-10">
                {/* 1. Timeline de Encaixe - NOW TOP & HORIZONTAL */}
                <div className="w-full flex flex-col bg-[#FBF6F0] rounded-[48px] p-8 border border-[#3C2415]/5 shadow-inner">
                    <div className="flex justify-between items-center mb-6">
                        <h4 className="text-[10px] font-black text-[#3C2415]/40 uppercase tracking-widest">Timeline de Sincronização</h4>
                        <button onClick={() => onUpdate(title, [])} className="text-rose-500 font-black text-[9px] uppercase tracking-widest hover:underline">Limpar Grid</button>
                    </div>

                    <div className="flex overflow-x-auto gap-4 pb-4 custom-scrollbar snap-x">
                        {grid.map((step, i) => (
                            <div
                                key={i}
                                onClick={() => setActiveSlot(i)}
                                onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('bg-orange-100'); }}
                                onDragLeave={(e) => e.currentTarget.classList.remove('bg-orange-100')}
                                onDrop={(e) => { e.preventDefault(); e.currentTarget.classList.remove('bg-orange-100'); handleDrop(i); }}
                                className={`flex flex-col min-w-[120px] gap-2 p-4 rounded-3xl transition-all border-2 cursor-pointer snap-start ${activeSlot === i ? 'bg-white border-[#E87A2C] shadow-xl scale-105 z-10' : 'bg-white/50 border-transparent hover:bg-white'}`}
                            >
                                <div className="w-6 h-6 flex items-center justify-center rounded-lg bg-stone-100 font-black text-[9px] text-stone-400 shrink-0">{i + 1}</div>

                                <div className="flex flex-col gap-3 min-h-[110px] justify-center">
                                    {/* Mão Esquerda (Base) */}
                                    <div className="flex flex-wrap gap-1.5 border-b border-stone-200/40 pb-3 min-h-[40px] items-center">
                                        {step.harmony.length > 0 ? step.harmony.map((n, ni) => (
                                            <div
                                                key={ni}
                                                draggable
                                                onDragStart={(e) => { e.stopPropagation(); setDraggedNote({ note: n, type: 'harmony', index: i }); }}
                                                className="px-3 py-1.5 bg-red-600 text-white rounded-xl text-[10px] font-black flex items-center gap-2 group/tag cursor-move shadow-md hover:bg-red-700 transition-all animate-pop-in border border-red-500"
                                            >
                                                <div className="w-1 h-1 rounded-full bg-red-200" />
                                                {n}
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); removeNoteAt(i, 'harmony', n); }}
                                                    className="w-4 h-4 rounded-full bg-black/20 flex items-center justify-center opacity-0 group-hover/tag:opacity-100 hover:bg-black/40 transition-all text-[10px] pb-[1px]"
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        )) : (
                                            <div className="w-full flex justify-center opacity-[0.03] py-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-[#1A110D]" />
                                            </div>
                                        )}
                                    </div>
                                    {/* Mão Direita (Solo) */}
                                    <div className="flex flex-wrap gap-1.5 min-h-[40px] items-center">
                                        {step.solo.length > 0 ? step.solo.map((n, ni) => (
                                            <div
                                                key={ni}
                                                draggable
                                                onDragStart={(e) => { e.stopPropagation(); setDraggedNote({ note: n, type: 'solo', index: i }); }}
                                                className="px-3 py-1.5 bg-blue-600 text-white rounded-xl text-[10px] font-black flex items-center gap-2 group/tag cursor-move shadow-md hover:bg-blue-700 transition-all animate-pop-in border border-blue-500"
                                            >
                                                <div className="w-1 h-1 rounded-full bg-blue-200" />
                                                {n}
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); removeNoteAt(i, 'solo', n); }}
                                                    className="w-4 h-4 rounded-full bg-black/20 flex items-center justify-center opacity-0 group-hover/tag:opacity-100 hover:bg-black/40 transition-all text-[10px] pb-[1px]"
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        )) : (
                                            <div className="w-full flex justify-center opacity-[0.03] py-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-[#1A110D]" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                                {activeSlot === i && <div className="h-1 w-full bg-[#E87A2C] rounded-full animate-pulse" />}
                            </div>
                        ))}
                    </div>
                </div>

                {/* 2. Seleção de Mão */}
                <div className="flex gap-4 max-w-2xl mx-auto w-full">
                    <button
                        onClick={() => setInputType('solo')}
                        className={`flex-1 py-5 rounded-[24px] font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-3 ${inputType === 'solo' ? 'bg-blue-600 text-white shadow-xl scale-105' : 'bg-stone-50 text-stone-300'}`}
                    >
                        <div className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-pulse" />
                        Mão Direita (Solo)
                    </button>
                    <button
                        onClick={() => setInputType('harmony')}
                        className={`flex-1 py-5 rounded-[24px] font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-3 ${inputType === 'harmony' ? 'bg-red-600 text-white shadow-xl scale-105' : 'bg-stone-50 text-stone-300'}`}
                    >
                        <div className="w-2.5 h-2.5 rounded-full bg-red-400 animate-pulse" />
                        Mão Esquerda (Base)
                    </button>
                </div>

                {/* 3. Instrumento - NOW BOTTOM & LARGE */}
                <div className="w-full">
                    {isKeyboardInstrument ? (
                        <div className="relative w-full h-[320px] bg-[#1A110D] p-3 rounded-[48px] shadow-2xl overflow-visible">
                            <div className="relative w-full h-full flex rounded-[32px] bg-white overflow-hidden shadow-inner border-[12px] border-black">
                                {WHITE_KEYS.map((note, i) => (
                                    <button
                                        key={note}
                                        onClick={() => playNote(note)}
                                        style={{ width: `${100 / WHITE_KEYS.length}%` }}
                                        className="h-full border-r border-stone-200 relative flex flex-col items-center justify-end pb-8 group active:bg-orange-50 transition-all hover:bg-stone-50"
                                    >
                                        <span className="text-xs font-black text-stone-300 group-hover:text-stone-500 transition-colors">{note.replace(/[0-9]/g, '')}</span>
                                        <div className="absolute bottom-4 w-4 h-4 rounded-full bg-stone-100 opacity-20" />
                                    </button>
                                ))}
                                {BLACK_KEYS_CONFIG.map(bk => {
                                    const whiteKeyWidth = 100 / WHITE_KEYS.length;
                                    const left = (bk.afterIdx + 1) * whiteKeyWidth;
                                    return (
                                        <button
                                            key={bk.note}
                                            onClick={() => playNote(bk.note)}
                                            className="absolute top-0 w-[4.4%] h-[62%] bg-gradient-to-b from-[#2A180B] to-black -ml-[2.2%] rounded-b-2xl active:translate-y-2 transition-all z-20 shadow-[0_10px_20px_rgba(0,0,0,0.5)] flex items-end justify-center pb-5 border-b-[8px] border-black border-x border-white/5"
                                            style={{ left: `${left}%` }}
                                        >
                                            <div className="w-2 h-2 rounded-full bg-white/10" />
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                            {ALL_NOTES.map(note => (
                                <button
                                    key={note}
                                    onClick={() => playNote(note)}
                                    className={`py-12 rounded-[32px] font-black text-2xl transition-all active:scale-95 shadow-xl ${inputType === 'solo' ? 'bg-blue-50 text-blue-900 border-b-8 border-blue-200 hover:bg-blue-600 hover:text-white' : 'bg-red-50 text-red-900 border-b-8 border-red-200 hover:bg-red-600 hover:text-white'}`}
                                >
                                    {note}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <p className="text-[10px] font-bold text-stone-300 uppercase italic text-center tracking-widest">
                Dica MusiClass: Use a timeline acima para organizar os tempos. Teclado gigante ativado para melhor precisão no toque.
            </p>
        </div>
    );
};
