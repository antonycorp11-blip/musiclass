
import React, { useState } from 'react';
import { Instrument } from '../types';
import { X, Save, Guitar as GuitarIcon, Keyboard as KeyboardIcon, Trash2, Music } from 'lucide-react';
import { MusicEngine } from '../services/musicEngine';

interface ManualChordEditorProps {
    instrument: Instrument;
    onSave: (name: string, notes: number[], isCustom: boolean) => void;
    onClose: () => void;
}

export const ManualChordEditor: React.FC<ManualChordEditorProps> = ({ instrument, onSave, onClose }) => {
    const [chordName, setChordName] = useState('');
    const [selectedNotes, setSelectedNotes] = useState<number[]>([]);

    // Guitar specific state: [stringIndex, fretIndex]
    // fret -1 = X, fret 0 = O, frets 1-12 = normal
    const [guitarFingers, setGuitarFingers] = useState<{ s: number, f: number, finger: number }[]>([]);

    const isKeyboard = instrument === Instrument.KEYBOARD || instrument === Instrument.PIANO;
    const isBass = instrument === Instrument.BASS;
    const isViolin = instrument === Instrument.VIOLIN;
    const numStrings = (isBass || isViolin) ? 4 : 6;
    const stringIndices = Array.from({ length: numStrings }, (_, i) => i);

    const toggleKeyboardNote = (noteIdx: number) => {
        if (selectedNotes.includes(noteIdx)) {
            setSelectedNotes(selectedNotes.filter(n => n !== noteIdx));
        } else {
            setSelectedNotes([...selectedNotes, noteIdx].sort((a, b) => a - b));
        }
    };

    const toggleGuitarFinger = (s: number, f: number) => {
        const existing = guitarFingers.find(gf => gf.s === s && gf.f === f);

        if (!existing) {
            setGuitarFingers([...guitarFingers.filter(gf => gf.s !== s), { s, f, finger: 1 }]);
        } else {
            if (existing.finger < 4) {
                setGuitarFingers(guitarFingers.map(gf =>
                    (gf.s === s && gf.f === f) ? { ...gf, finger: existing.finger + 1 } : gf
                ));
            } else {
                setGuitarFingers(guitarFingers.filter(gf => !(gf.s === s && gf.f === f)));
            }
        }
    };

    const getCurrentNotes = () => {
        const notes: string[] = [];
        if (isKeyboard) {
            selectedNotes.forEach(idx => {
                const note = MusicEngine.getNoteFromInterval('C', idx).name;
                if (!notes.includes(note)) notes.push(note);
            });
        } else {
            stringIndices.forEach(s => {
                const gf = guitarFingers.find(f => f.s === s);
                if (gf && gf.f >= 0) {
                    const note = MusicEngine.getNoteByFretAndString(gf.f, s, numStrings);
                    if (!notes.includes(note)) notes.push(note);
                }
            });
        }
        return notes;
    };

    const currentNotesDisplay = getCurrentNotes();

    const handleSave = () => {
        if (!chordName) return alert("Dê um nome ao acorde!");

        if (isKeyboard) {
            onSave(chordName, selectedNotes, true);
        } else {
            const fingerData = guitarFingers
                .filter(gf => gf.f >= 0)
                .map(gf => [gf.s + 1, gf.f, gf.finger]);

            onSave(chordName, fingerData.flat(), true);
        }
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-[#3C2415]/60 backdrop-blur-xl flex items-center justify-center z-[200] p-2 md:p-4">
            <div className="bg-white rounded-[32px] md:rounded-[48px] w-full max-w-2xl shadow-2xl relative animate-pop-in max-h-[96vh] flex flex-col overflow-hidden">

                {/* Sticky Modal Header */}
                <div className="sticky top-0 bg-white/95 backdrop-blur-md z-[210] p-6 md:p-10 pb-4 border-b border-stone-100 flex items-center justify-between">
                    <div>
                        <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tighter mb-1 flex items-center gap-3">
                            {isKeyboard ? <KeyboardIcon className="text-[#E87A2C] w-6 h-6 md:w-8 md:h-8" /> : <GuitarIcon className="text-[#E87A2C] w-6 h-6 md:w-8 md:h-8" />}
                            Montar Acorde {isKeyboard ? '(Teclado)' : isBass ? '(Baixo)' : '(Violão)'}
                        </h3>
                        <p className="text-[9px] md:text-[10px] font-black text-[#E87A2C] uppercase tracking-[0.3em] opacity-60">Fidelidade Cromática MusiClass</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-stone-300 hover:text-stone-500 transition-colors p-2"
                    >
                        <X className="w-8 h-8" />
                    </button>
                </div>

                {/* Scrollable Modal Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-10 pt-8">
                    <div className="space-y-8">
                        {/* Chord Name Input */}
                        <div className="flex flex-col gap-4">
                            <div className="flex flex-wrap gap-2 justify-center mb-2">
                                {currentNotesDisplay.map((note, idx) => (
                                    <span key={idx} className="bg-[#E87A2C] text-white px-3 py-1 rounded-full text-[12px] font-black shadow-lg animate-pop-in">
                                        {note}
                                    </span>
                                ))}
                                {currentNotesDisplay.length === 0 && (
                                    <span className="text-stone-300 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                        <Music className="w-3 h-3" /> Nenhuma nota selecionada
                                    </span>
                                )}
                            </div>
                            <input
                                value={chordName}
                                onChange={(e) => setChordName(e.target.value)}
                                placeholder="Nome do Acorde (ex: C, G7...)"
                                className="w-full bg-[#FBF6F0] border-none rounded-[24px] px-8 py-5 md:py-6 font-black text-2xl md:text-3xl text-center focus:ring-4 focus:ring-[#E87A2C]/20 transition-all placeholder:text-stone-200"
                            />
                        </div>

                        {/* Editor Area */}
                        <div className="bg-stone-50 p-6 md:p-8 rounded-[40px] border border-stone-100 min-h-[450px] flex items-center justify-center relative">
                            {isKeyboard ? (
                                <div className="relative w-full h-48 bg-[#1A110D] p-2 rounded-[28px] shadow-2xl overflow-visible max-w-lg">
                                    <div className="relative w-full h-full flex rounded-xl bg-white overflow-hidden">
                                        {[0, 2, 4, 5, 7, 9, 11, 12, 14, 16, 17, 19].map((absIdx, i) => (
                                            <button
                                                key={absIdx}
                                                onClick={() => toggleKeyboardNote(absIdx)}
                                                style={{ width: `${100 / 12}%` }}
                                                className={`h-full border-r border-stone-200 relative transition-all ${selectedNotes.includes(absIdx) ? 'bg-orange-50' : 'bg-white'}`}
                                            >
                                                {selectedNotes.includes(absIdx) && (
                                                    <div className="absolute inset-x-2 bottom-4 h-2 bg-[#E87A2C] rounded-full shadow-lg animate-pop-in" />
                                                )}
                                            </button>
                                        ))}
                                        {/* Black Keys */}
                                        {[
                                            { absIdx: 1, afterIdx: 0 }, { absIdx: 3, afterIdx: 1 },
                                            { absIdx: 6, afterIdx: 3 }, { absIdx: 8, afterIdx: 4 }, { absIdx: 10, afterIdx: 5 },
                                            { absIdx: 13, afterIdx: 7 }, { absIdx: 15, afterIdx: 8 }, { absIdx: 18, afterIdx: 10 }
                                        ].map(bk => (
                                            <button
                                                key={bk.absIdx}
                                                onClick={() => toggleKeyboardNote(bk.absIdx)}
                                                className={`absolute top-0 w-[6%] h-[60%] -ml-[3%] rounded-b-lg z-20 shadow-lg transition-all ${selectedNotes.includes(bk.absIdx) ? 'bg-[#E87A2C] scale-105' : 'bg-[#1A110D]'}`}
                                                style={{ left: `${(bk.afterIdx + 1) * (100 / 12)}%` }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center w-full">
                                    <p className="text-[10px] font-black text-[#1A110D] uppercase tracking-[0.5em] mb-8 opacity-20">Diagrama Profissional</p>

                                    {/* Fretboard Internal Scrollable Area */}
                                    <div className="relative w-full max-w-[280px] h-[450px] bg-white border-x-[8px] border-b-[8px] border-stone-200 rounded-b-[40px] shadow-2xl overflow-y-auto overflow-x-hidden custom-scrollbar">

                                        {/* Internal Sticky Open/Quiet Header */}
                                        <div className="sticky top-0 w-full h-[60px] bg-white border-b-2 border-stone-100 z-50 flex justify-between items-center px-0">
                                            {stringIndices.map(s => {
                                                const fretOnThisString = guitarFingers.find(gf => gf.s === s);
                                                const isQuiet = fretOnThisString?.f === -1;
                                                const isOpen = fretOnThisString?.f === 0;

                                                return (
                                                    <button
                                                        key={s}
                                                        onClick={() => {
                                                            if (isOpen) setGuitarFingers([...guitarFingers.filter(gf => gf.s !== s), { s, f: -1, finger: 0 }]);
                                                            else if (isQuiet) setGuitarFingers(guitarFingers.filter(gf => gf.s !== s));
                                                            else setGuitarFingers([...guitarFingers.filter(gf => gf.s !== s), { s, f: 0, finger: 0 }]);
                                                        }}
                                                        className={`absolute w-10 h-10 -ml-5 rounded-2xl flex items-center justify-center font-black text-xs transition-all top-1/2 -translate-y-1/2 shadow-sm
                                                            ${isOpen ? 'bg-emerald-50 text-emerald-600 border-2 border-emerald-200' : isQuiet ? 'bg-rose-50 text-rose-600 border-2 border-rose-200' : 'bg-stone-50 text-stone-300 hover:text-stone-400 border border-stone-100'}`}
                                                        style={{ left: `${10 + s * (80 / (numStrings - 1))}%` }}
                                                    >
                                                        {isOpen ? 'O' : isQuiet ? 'X' : '·'}
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        {/* String Tuning Labels at the top (internal) */}
                                        <div className="w-full flex justify-between px-0 relative h-6 bg-stone-50/50">
                                            {stringIndices.map(s => (
                                                <span key={s} className="absolute -ml-2 text-[8px] font-black text-stone-400 uppercase top-1" style={{ left: `${10 + s * (80 / (numStrings - 1))}%` }}>
                                                    {isKeyboard ? '' : (numStrings === 4 ? ['E', 'A', 'D', 'G'][s] : ['E', 'A', 'D', 'G', 'B', 'E'][s])}
                                                </span>
                                            ))}
                                        </div>

                                        {/* Fretboard Surface */}
                                        <div className="relative w-full" style={{ height: '1500px' }}>
                                            {/* Visual Nut barrier */}
                                            <div className="absolute top-0 w-full h-[12px] bg-[#1A110D] z-40" />

                                            {/* Fret Lines */}
                                            {Array.from({ length: 24 }, (_, i) => i + 1).map(f => (
                                                <div key={f} className="absolute w-full h-[3px] bg-stone-100" style={{ top: `${(f / 24) * 100}%` }} />
                                            ))}

                                            {/* String Lines */}
                                            {stringIndices.map(s => (
                                                <div key={s} className="absolute h-full w-[2px] bg-stone-100" style={{ left: `${10 + s * (80 / (numStrings - 1))}%` }} />
                                            ))}

                                            {/* Interactive Fret Zones */}
                                            {Array.from({ length: 24 }, (_, i) => i + 1).map(f => (
                                                <div key={f} className="absolute w-full" style={{ top: `${((f - 1) / 24) * 100}%`, height: `${100 / 24}%` }}>
                                                    {/* Fret Number Label */}
                                                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[11px] font-black text-stone-900/40 z-10">{f}</span>

                                                    {stringIndices.map(s => {
                                                        const active = guitarFingers.find(gf => gf.s === s && gf.f === f);
                                                        return (
                                                            <button
                                                                key={`${s}-${f}`}
                                                                onClick={() => toggleGuitarFinger(s, f)}
                                                                className={`absolute w-12 h-12 -ml-[24px] rounded-full z-30 transition-all flex items-center justify-center text-xs font-black top-2/3 -translate-y-1/2
                                                                    ${active ? 'bg-[#E87A2C] text-white shadow-2xl scale-110' : 'bg-transparent hover:bg-[#E87A2C]/5'}`}
                                                                style={{ left: `${10 + s * (80 / (numStrings - 1))}%` }}
                                                            >
                                                                {active ? active.finger : ''}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Bottom Legend */}
                                    <div className="mt-8 flex flex-col items-center gap-4">
                                        <div className="flex gap-10 bg-white px-8 py-3 rounded-2xl border border-stone-100 shadow-sm">
                                            <div className="flex items-center gap-3 text-emerald-500 font-black text-xs">O <span className="text-[10px] text-stone-400">ABERTA</span></div>
                                            <div className="flex items-center gap-3 text-rose-500 font-black text-xs">X <span className="text-[10px] text-stone-400">MUDA</span></div>
                                        </div>
                                        <p className="text-[10px] font-black text-stone-300 uppercase tracking-widest text-center">Toque nas casas para definir dedos</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Final Action Button */}
                    <div className="mt-10 pb-4">
                        <button
                            onClick={handleSave}
                            className="w-full bg-[#1A110D] text-white py-6 md:py-7 rounded-[28px] font-black text-xs md:text-sm uppercase tracking-[0.2em] hover:bg-[#E87A2C] transition-all flex items-center justify-center gap-4 shadow-2xl active:scale-95 group"
                        >
                            <Save className="w-5 h-5 group-hover:scale-110 transition-transform" />
                            Adicionar à Aula
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
