
import React from 'react';

interface NoteWithIndex {
    name: string;
    absIndex: number;
}

interface KeyboardVisualizerProps {
    chordNotes: string[];
    root: string;
    type?: string;
    ext?: string;
    notesWithIndices?: NoteWithIndex[];
}

export const KeyboardVisualizer: React.FC<KeyboardVisualizerProps> = ({ chordNotes, root, type, ext, notesWithIndices }) => {
    const WHITE_KEYS_COUNT = 10; // 10 white keys makes each key slightly wider and more readable

    const isWhiteKey = (absIdx: number) => {
        const normalized = ((absIdx % 12) + 12) % 12;
        return [0, 2, 4, 5, 7, 9, 11].includes(normalized);
    };

    let startAbsIndex = 0;
    if (notesWithIndices && notesWithIndices.length > 0) {
        const indices = notesWithIndices.map(ni => ni.absIndex);
        const minIdx = Math.min(...indices);

        // Find the best starting point (C or F) that is at or before minIdx
        // and ensures the entire chord fits in the 10-white-key range.
        // 10 white keys is approximately 1.5 octaves (~16-17 semitones).
        const possibleStarts = [0, 5, 12, 17, 24, 29, 36, 41, 48];

        // We want the highest start that is <= minIdx - 1 (to give 1 white key of margin if possible)
        const validStarts = possibleStarts.filter(s => s <= minIdx - 1);
        startAbsIndex = validStarts.length > 0 ? validStarts[validStarts.length - 1] : possibleStarts[0];

        // Double check if maxIdx fits. If not, we might need a lower start, but usually 10 white keys cover enough.
        const maxIdx = Math.max(...indices);
        // Range check: we need to ensure maxIdx is within the semitone range of 10 white keys starting from startAbsIndex.
    }

    const whiteKeysInView: number[] = [];
    let checkIdx = startAbsIndex;
    while (whiteKeysInView.length < WHITE_KEYS_COUNT) {
        if (isWhiteKey(checkIdx)) {
            whiteKeysInView.push(checkIdx);
        }
        checkIdx++;
    }
    const maxViewAbsIndex = whiteKeysInView[whiteKeysInView.length - 1];

    const blackKeysToRender: { absIndex: number, afterIdx: number }[] = [];
    for (let i = 0; i < whiteKeysInView.length - 1; i++) {
        const currentWhite = whiteKeysInView[i];
        const nextWhite = whiteKeysInView[i + 1];
        if (nextWhite - currentWhite === 2) {
            blackKeysToRender.push({ absIndex: currentWhite + 1, afterIdx: i });
        }
    }

    const isHighlighted = (absIdx: number) => {
        if (!notesWithIndices) return false;
        return notesWithIndices.some(ni => ni.absIndex === absIdx);
    };

    const getNoteName = (absIdx: number) => {
        const note = notesWithIndices?.find(ni => ni.absIndex === absIdx);
        if (!note) return '';
        // Simplificar nomes para caber nos marcadores
        return note.name.replace('maj', '').replace('min', 'm');
    };

    const displayType = type === 'min' ? 'm' : (type === 'maj' ? '' : (type || ''));
    const displayExt = ext === 'none' || !ext ? '' : ext;
    const fullChordName = `${root}${displayType}${displayExt}`;

    return (
        <div className="flex flex-col bg-white border border-stone-200 rounded-xl overflow-hidden shadow-md group transition-all duration-300 w-full max-w-[400px]">
            {/* Chord Header - Compact & Professional */}
            <div className="bg-[#1A110D] py-2 px-4 flex justify-between items-center border-b border-black">
                <h5 className="text-lg font-black text-[#E87A2C] tracking-tighter uppercase leading-none">{fullChordName}</h5>
                <div className="flex gap-1">
                    {chordNotes.map((n, i) => (
                        <span key={i} className="text-[8px] font-bold text-white/40 uppercase bg-white/5 px-1 rounded">{n}</span>
                    ))}
                </div>
            </div>

            <div className="p-4 bg-stone-50 flex justify-center border-b border-stone-200">
                {/* Visualizer Casing */}
                <div className="relative w-full bg-[#0A0503] rounded-lg p-3 shadow-[0_15px_35px_-10px_rgba(0,0,0,0.5)] border-t border-white/5">
                    {/* Top casing detail */}
                    <div className="absolute top-0 left-0 w-full h-2 bg-[#1A110D] border-b border-black/50 z-40 rounded-t-lg" />

                    {/* Keyboard Surface */}
                    <div className="relative h-32 w-full flex bg-[#1A110D] rounded-sm overflow-visible pt-1 shadow-inner">
                        {/* White Keys */}
                        {whiteKeysInView.map((absIdx, i) => {
                            const active = isHighlighted(absIdx);
                            const noteName = getNoteName(absIdx);
                            return (
                                <div
                                    key={`w-${i}`}
                                    style={{ width: `${100 / WHITE_KEYS_COUNT}%` }}
                                    className={`h-full border-r border-stone-300 relative flex items-end justify-center pb-3 transition-all duration-300 rounded-b-sm
                                        ${active ? 'bg-gradient-to-t from-orange-50 to-white' : 'bg-gradient-to-b from-stone-50 to-white'}`}
                                >
                                    {/* Key shadow detail */}
                                    <div className="absolute top-0 w-full h-[1px] bg-black/10" />

                                    {active && (
                                        <div className="w-6 h-6 rounded-full bg-[#1A110D] shadow-2xl z-20 flex items-center justify-center border-2 border-orange-500/50 scale-110 mb-2">
                                            <span className="text-[8px] font-black text-white leading-none tracking-tighter uppercase">{noteName}</span>
                                        </div>
                                    )}
                                    {/* Rounded bottom for realism */}
                                    <div className="absolute bottom-0 w-full h-[6px] bg-gradient-to-t from-black/5 to-transparent rounded-b-sm" />
                                </div>
                            );
                        })}

                        {/* Black Keys */}
                        {blackKeysToRender.map((bk, i) => {
                            const whiteKeyWidth = 100 / WHITE_KEYS_COUNT;
                            const left = (bk.afterIdx + 1) * whiteKeyWidth;
                            const active = isHighlighted(bk.absIndex);
                            const noteName = getNoteName(bk.absIndex);

                            return (
                                <div
                                    key={`b-${bk.absIndex}`}
                                    className={`absolute top-0 h-[65%] w-[6.8%] -ml-[3.4%] z-30 flex items-end justify-center pb-2 rounded-b-[3px] shadow-[0_8px_15px_rgba(0,0,0,0.4)] transition-all duration-200
                                        ${active ? 'bg-[#3C2415] border-b-[4px] border-orange-500 scale-[1.02]' : 'bg-gradient-to-b from-[#2A180B] via-[#1A110D] to-black'}`}
                                    style={{ left: `${left}%` }}
                                >
                                    {active && (
                                        <div className="w-4 h-4 rounded-full bg-white shadow-xl flex items-center justify-center border border-orange-200">
                                            <span className="text-[6px] font-black text-[#E87A2C] leading-none mb-[0.5px] uppercase">{noteName}</span>
                                        </div>
                                    )}
                                    {/* Black key top reflect */}
                                    <div className="absolute top-0 w-full h-[40%] bg-gradient-to-b from-white/10 to-transparent rounded-t-[2px]" />
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Legend / Tip */}
            <div className="bg-white py-2 px-4 flex justify-center">
                <span className="text-[7px] font-bold text-stone-300 uppercase tracking-[0.3em]">Virtual 17-Note Conservatory Layout</span>
            </div>
        </div>
    );
};
