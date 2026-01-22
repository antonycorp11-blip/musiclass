
import React, { useEffect, useRef } from 'react';

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
    notes: string[];
    instrument?: string;
    onUpdate: (title: string, notes: string[]) => void;
    onRemove: () => void;
}

export const SoloEditor: React.FC<SoloEditorProps> = ({ title, notes, instrument, onUpdate, onRemove }) => {
    const audioCtx = useRef<AudioContext | null>(null);

    const isKeyboardInstrument = instrument?.toLowerCase().includes('teclado') ||
        instrument?.toLowerCase().includes('piano') ||
        instrument?.toLowerCase().includes('vocal');

    const playNote = (note: string) => {
        const cleanNote = note.replace(/[0-9]/g, '');
        const freqKey = isKeyboardInstrument ? note : (note + '4'); // Default to octave 4 for simple buttons

        if (!audioCtx.current || audioCtx.current.state === 'suspended') {
            audioCtx.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        const ctx = audioCtx.current;
        const o = ctx.createOscillator();
        const g = ctx.createGain();

        o.type = 'triangle';
        o.frequency.setValueAtTime(NOTE_FREQS[freqKey] || 440, ctx.currentTime);

        g.gain.setValueAtTime(0.3, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.2);

        o.connect(g);
        g.connect(ctx.destination);

        o.start();
        o.stop(ctx.currentTime + 1.2);

        onUpdate(title, [...notes, cleanNote]);
    };

    return (
        <div className="bg-white rounded-[64px] p-10 border border-[#3C2415]/5 shadow-sm space-y-8">
            <div className="flex justify-between items-center border-b border-stone-50 pb-6">
                <div className="flex flex-col gap-1 w-2/3">
                    <span className="text-[8px] font-black text-[#E87A2C] uppercase tracking-[0.4em]">Editor de Melodia</span>
                    <input
                        value={title}
                        onChange={(e) => onUpdate(e.target.value, notes)}
                        placeholder="Nome da parte (ex: Introdução)"
                        className="text-2xl font-black text-[#1A110D] uppercase tracking-tighter bg-transparent border-none focus:ring-0 w-full"
                    />
                </div>
                <button onClick={onRemove} className="text-rose-400 font-black text-[10px] uppercase tracking-widest hover:bg-rose-50 px-4 py-2 rounded-xl transition-all">Remover</button>
            </div>

            {isKeyboardInstrument ? (
                /* Virtual Keyboard for Piano/Keys */
                <div className="relative w-full h-64 bg-[#1A110D] p-1.5 rounded-[24px] shadow-2xl overflow-visible">
                    <div className="relative w-full h-full flex rounded-xl bg-white overflow-hidden">
                        {WHITE_KEYS.map((note, i) => (
                            <button
                                key={note}
                                onClick={() => playNote(note)}
                                style={{ width: `${100 / WHITE_KEYS.length}%` }}
                                className="h-full border-r border-stone-300 relative flex flex-col items-center justify-end pb-4 group active:bg-orange-50 transition-colors"
                            >
                                <span className="text-[8px] font-black text-stone-200 group-active:text-[#E87A2C] transition-colors">{note.replace(/[0-9]/g, '')}</span>
                                <div className="absolute bottom-0 w-full h-1 bg-stone-100 opacity-50" />
                            </button>
                        ))}
                        {BLACK_KEYS_CONFIG.map(bk => {
                            const whiteKeyWidth = 100 / WHITE_KEYS.length;
                            const left = (bk.afterIdx + 1) * whiteKeyWidth;
                            return (
                                <button
                                    key={bk.note}
                                    onClick={() => playNote(bk.note)}
                                    className="absolute top-0 w-[4.6%] h-[60%] bg-[#1A110D] -ml-[2.3%] rounded-b-xl active:bg-black active:translate-y-1 transition-all z-20 shadow-lg flex items-end justify-center pb-3 border-b-4 border-black border-l border-r border-white/5"
                                    style={{ left: `${left}%` }}
                                />
                            );
                        })}
                    </div>
                </div>
            ) : (
                /* Simple Note Buttons for Guitar/Other */
                <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
                    {ALL_NOTES.map(note => (
                        <button
                            key={note}
                            onClick={() => playNote(note)}
                            className="bg-[#FBF6F0] hover:bg-[#E87A2C] hover:text-white py-6 rounded-2xl font-black text-[#1A110D] transition-all active:scale-95 shadow-sm active:shadow-inner"
                        >
                            {note}
                        </button>
                    ))}
                </div>
            )}

            {/* Sequence Recording */}
            <div className="flex flex-wrap gap-3 p-8 bg-stone-50 rounded-[40px] min-h-[120px] items-center border border-stone-100 shadow-inner">
                {notes.length === 0 && (
                    <div className="w-full flex flex-col items-center gap-2 opacity-30">
                        <p className="text-[9px] font-black uppercase tracking-[0.4em]">
                            {isKeyboardInstrument ? 'Toque no piano para ditar' : 'Clique nas notas acima para ditar o solo'}
                        </p>
                    </div>
                )}
                {notes.map((n, i) => (
                    <div key={i} className="px-5 py-3 bg-white border border-[#3C2415]/10 rounded-2xl font-black text-[#1A110D] text-lg flex items-center gap-4 group animate-pop-in shadow-sm hover:border-orange-200">
                        <span className="text-[#E87A2C] text-[10px] opacity-40">{i < 9 ? `0${i + 1}` : i + 1}</span>
                        {n}
                        <button onClick={() => onUpdate(title, notes.filter((_, idx) => idx !== i))} className="text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity">×</button>
                    </div>
                ))}
                {notes.length > 0 && (
                    <button onClick={() => onUpdate(title, [])} className="ml-auto px-6 py-2 bg-stone-200 text-stone-500 hover:bg-rose-50 hover:text-rose-500 rounded-full font-black text-[9px] uppercase tracking-widest transition-all">Limpar Tudo</button>
                )}
            </div>
        </div>
    );
};
