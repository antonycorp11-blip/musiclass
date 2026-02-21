
import React, { useState } from 'react';
import { Instrument } from '../types';
import { X, Save, Guitar as GuitarIcon, Keyboard as KeyboardIcon, Trash2 } from 'lucide-react';

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
    const [selectedFinger, setSelectedFinger] = useState<number>(1);

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
        const exists = guitarFingers.find(gf => gf.s === s && gf.f === f);
        if (exists && exists.finger === selectedFinger) {
            setGuitarFingers(guitarFingers.filter(gf => !(gf.s === s && gf.f === f)));
        } else {
            setGuitarFingers([...guitarFingers.filter(gf => gf.s !== s), { s, f, finger: selectedFinger }]);
        }
    };

    const handleSave = () => {
        if (!chordName) return alert("Dê um nome ao acorde!");

        if (isKeyboard) {
            onSave(chordName, selectedNotes, true);
        } else {
            // Reconstruct notesWithIndices: [string, fret, finger]
            const fingerData = guitarFingers
                .filter(gf => gf.f >= 0)
                .map(gf => [gf.s + 1, gf.f, gf.finger]);

            // However, we need to tell ChordVisualizer about ALL strings.
            // Let's create a full string array
            const fullShape = Array(numStrings).fill(null);
            guitarFingers.forEach(gf => {
                if (gf.f === -1) fullShape[gf.s] = null;
                else fullShape[gf.s] = gf.f;
            });

            onSave(chordName, fingerData.flat(), true);
        }
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-[#3C2415]/60 backdrop-blur-xl flex items-center justify-center z-[200] p-4">
            <div className="bg-white rounded-[48px] p-8 md:p-12 w-full max-w-2xl shadow-2xl relative animate-pop-in">
                <button onClick={onClose} className="absolute top-8 right-8 text-stone-300 hover:text-stone-500 transition-colors">
                    <X className="w-6 h-6" />
                </button>

                <div className="mb-10">
                    <h3 className="text-3xl font-black text-[#1A110D] uppercase tracking-tighter mb-2 flex items-center gap-3">
                        {isKeyboard ? <KeyboardIcon className="text-[#E87A2C]" /> : <GuitarIcon className="text-[#E87A2C]" />}
                        Criador de Acorde Manual
                    </h3>
                    <p className="text-[10px] font-black text-[#E87A2C] uppercase tracking-[0.3em]">Desenhe o diagrama nota por nota</p>
                </div>

                <div className="space-y-10">
                    <div>
                        <label className="text-[9px] font-black uppercase tracking-widest text-stone-400 mb-2 block text-center">Nome do Acorde (ex: C/G, D/F#)</label>
                        <input
                            value={chordName}
                            onChange={(e) => setChordName(e.target.value)}
                            placeholder="Nome do Acorde..."
                            className="w-full bg-[#FBF6F0] border-none rounded-[24px] px-8 py-5 font-black text-2xl text-center text-[#1A110D] focus:ring-2 focus:ring-[#E87A2C]"
                        />
                    </div>

                    <div className="bg-stone-50 p-8 rounded-[32px] border border-stone-100 min-h-[350px] flex items-center justify-center">
                        {isKeyboard ? (
                            <div className="relative w-full h-48 bg-[#1A110D] p-1.5 rounded-[24px] shadow-2xl overflow-visible max-w-lg">
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
                            <div className="flex flex-col items-center">
                                <p className="text-[8px] font-black text-[#E87A2C] uppercase tracking-[0.4em] mb-10 opacity-40">Braço Vertical Giga Size (MusiClass Design)</p>

                                <div className="relative w-64 h-[450px] bg-white border-x-[6px] border-b-[6px] border-stone-200 rounded-b-[32px] shadow-2xl overflow-y-auto overflow-x-visible custom-scrollbar">
                                    {/* Nut */}
                                    <div className="sticky top-0 w-full h-6 bg-[#1A110D] -mt-1 rounded-sm z-40 shadow-sm flex items-center justify-center">
                                        <div className="w-full h-[2px] bg-white/20" />
                                    </div>

                                    {/* Fret Lines */}
                                    {Array.from({ length: 12 }, (_, i) => i + 1).map(f => (
                                        <div key={f} className="absolute w-full h-[1px] bg-stone-100" style={{ top: `${(f / 12) * 100}%` }} />
                                    ))}

                                    {/* String Lines */}
                                    {stringIndices.map(s => (
                                        <div key={s} className="absolute h-full w-[2px] bg-stone-200" style={{ left: `${s * (100 / (numStrings - 1))}%` }} />
                                    ))}

                                    {/* Interactive Dots for Frets */}
                                    {Array.from({ length: 12 }, (_, i) => i + 1).map(f => (
                                        <div key={f} className="absolute w-full h-[8.33%] flex justify-between px-0" style={{ top: `${((f - 1) / 12) * 100}%` }}>
                                            {stringIndices.map(s => {
                                                const active = guitarFingers.find(gf => gf.s === s && gf.f === f);
                                                return (
                                                    <button
                                                        key={`${s}-${f}`}
                                                        onClick={() => toggleGuitarFinger(s, f)}
                                                        className={`absolute w-10 h-10 -ml-5 rounded-full z-30 transition-all flex items-center justify-center text-xs font-black transform translate-y-2
                                                            ${active ? 'bg-[#E87A2C] text-white shadow-xl scale-110' : 'bg-transparent hover:bg-orange-500/10'}`}
                                                        style={{ left: `${s * (100 / (numStrings - 1))}%` }}
                                                    >
                                                        {active ? active.finger : ''}
                                                    </button>
                                                );
                                            })}
                                            <span className="absolute -left-10 top-1/2 -translate-y-1/2 text-[8px] font-black text-stone-300">{f}</span>
                                        </div>
                                    ))}

                                    {/* Interactive Dots for Open/Quiet Strings */}
                                    <div className="absolute -top-10 w-full h-10 flex justify-between">
                                        {stringIndices.map(s => {
                                            const fretOnThisString = guitarFingers.find(gf => gf.s === s);
                                            const isQuiet = fretOnThisString?.f === -1;
                                            const isOpen = fretOnThisString?.f === 0;

                                            return (
                                                <button
                                                    key={s}
                                                    onClick={() => {
                                                        if (isOpen) toggleGuitarFinger(s, -1);
                                                        else if (isQuiet) setGuitarFingers(guitarFingers.filter(gf => gf.s !== s));
                                                        else toggleGuitarFinger(s, 0);
                                                    }}
                                                    className={`absolute w-8 h-8 -ml-4 rounded-xl flex items-center justify-center font-black text-xs transition-all shadow-sm
                                                        ${isOpen ? 'bg-emerald-50 text-emerald-600 border-2 border-emerald-200' : isQuiet ? 'bg-rose-50 text-rose-600 border-2 border-rose-200' : 'text-stone-300 hover:text-stone-400'}`}
                                                    style={{ left: `${s * (100 / (numStrings - 1))}%` }}
                                                >
                                                    {isOpen ? 'O' : isQuiet ? 'X' : '·'}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="mt-8 flex flex-col items-center gap-6">
                                    <div className="flex gap-3">
                                        {[1, 2, 3, 4].map(num => (
                                            <button
                                                key={num}
                                                onClick={() => setSelectedFinger(num)}
                                                className={`w-10 h-10 rounded-full font-black text-sm transition-all ${selectedFinger === num ? 'bg-[#E87A2C] text-white scale-110 shadow-lg' : 'bg-stone-100 text-stone-400'}`}
                                            >
                                                {num}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="flex gap-12 bg-stone-50 px-8 py-3 rounded-2xl border border-stone-100">
                                        <div className="flex items-center gap-2"><span className="text-emerald-500 font-bold text-lg">O</span> <span className="text-[10px] uppercase font-black text-stone-400 tracking-widest">Aberta</span></div>
                                        <div className="flex items-center gap-2"><span className="text-rose-500 font-bold text-lg">X</span> <span className="text-[10px] uppercase font-black text-stone-400 tracking-widest">Muda</span></div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={handleSave}
                        className="w-full bg-[#1A110D] text-white py-6 rounded-[32px] font-black text-xs uppercase tracking-widest hover:bg-[#E87A2C] transition-all flex items-center justify-center gap-3 shadow-2xl"
                    >
                        <Save className="w-4 h-4" /> Adicionar à Aula
                    </button>
                </div>
            </div>
        </div>
    );
};
