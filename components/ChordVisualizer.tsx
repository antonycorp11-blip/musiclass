
import React from 'react';
import { Instrument } from '../types';
import { KeyboardVisualizer } from './KeyboardVisualizer';
import { DrumsVisualizer } from './DrumsVisualizer';
import { getGuitarShape } from '../services/chordLibrary';

interface Props {
  instrument: Instrument;
  chordNotes: string[];
  root: string;
  type?: string;
  ext?: string;
  notesWithIndices?: any[];
  isFullscreen?: boolean;
}

export const ChordVisualizer: React.FC<Props> = ({ instrument, chordNotes, root, type = 'maj', ext = '', notesWithIndices, isFullscreen }) => {
  if (instrument === Instrument.KEYBOARD || instrument === Instrument.PIANO || instrument === Instrument.VOCALS) {
    return <KeyboardVisualizer chordNotes={chordNotes} root={root} type={type} ext={ext} notesWithIndices={notesWithIndices} />;
  }

  if (instrument === Instrument.DRUMS) {
    return <DrumsVisualizer root={root} />;
  }

  // Guitar/Bass Logic
  const shape = getGuitarShape(root, type, ext);

  const nonNullFrets = shape.frets.filter(f => f !== null && f > 0) as number[];
  const minFret = nonNullFrets.length > 0 ? Math.min(...nonNullFrets) : 0;
  const startFret = minFret > 4 ? minFret : 1;

  const displayType = type === 'min' ? 'm' : (type === 'maj' ? '' : type);
  const displayExt = ext === 'none' ? '' : (ext === '7' ? '7' : ext);
  const fullChordName = `${root}${displayType}${displayExt}`;

  return (
    <div className={`flex flex-col bg-white border border-stone-200 rounded-xl overflow-hidden shadow-md group transition-all duration-300 w-full ${isFullscreen ? 'max-w-[400px]' : 'max-w-[260px] mx-auto'}`}>
      {/* Chord Header - Matching Keyboard Premium Style */}
      <div className="bg-[#1A110D] py-1.5 px-3 flex justify-between items-center border-b border-black">
        <h5 className="text-base font-black text-[#E87A2C] tracking-tighter uppercase leading-none truncate max-w-[65%]">{fullChordName}</h5>
        <div className="flex gap-1 shrink-0">
          {chordNotes.slice(0, 3).map((n, i) => (
            <span key={i} className="text-[7px] font-bold text-white/40 uppercase bg-white/5 px-1 rounded">{n}</span>
          ))}
        </div>
      </div>

      <div className="p-4 bg-stone-50 flex flex-col items-center">
        <p className="text-[#E87A2C] font-black uppercase tracking-[0.2em] text-[7px] mb-3 opacity-50">{instrument} Diagram</p>

        <div className={`relative ${isFullscreen ? 'w-64 h-[320px]' : 'w-28 h-40'} bg-white border-x-[3px] border-b-[3px] border-[#3C2415]/80 rounded-b-lg shadow-xl mt-1 relative z-10`}>
          {/* Top Nut or Fret Label */}
          {startFret > 1 ? (
            <div className="absolute -left-10 top-0 text-[#1A110D] font-black text-xs bg-stone-100 px-1.5 py-0.5 rounded border border-stone-200">{startFret}ª casa</div>
          ) : (
            <div className="absolute top-0 w-full h-3 bg-[#1A110D] -mt-1.5 rounded-sm z-20 shadow-md" />
          )}

          {/* Fret Lines */}
          {[1, 2, 3, 4, 5].map(f => (
            <div key={f} className="absolute w-full h-[2px] bg-stone-200" style={{ top: `${f * 20}%` }} />
          ))}

          {/* String Lines */}
          {[0, 1, 2, 3, 4, 5].map(s => (
            <div key={s} className="absolute h-full w-[1px] bg-stone-300" style={{ left: `${s * 20}%` }} />
          ))}

          {/* Barre Circle */}
          {shape.barre && (
            <div
              className="absolute bg-[#1A110D]/90 rounded-full border border-black z-10 shadow-lg"
              style={{
                top: `${(shape.barre - startFret + 1) * 20 - 14}%`,
                left: '0%',
                width: '100%',
                height: '20px'
              }}
            >
              <div className="w-full h-full flex items-center justify-center">
                <div className="w-1 h-1 bg-white/20 rounded-full" />
              </div>
            </div>
          )}

          {/* Notes / Fingers */}
          {shape.frets.map((fret, stringIndex) => {
            if (fret === null) {
              return (
                <div key={stringIndex} className="absolute -top-7 text-rose-500 font-black text-sm" style={{ left: `${stringIndex * 20}%`, transform: 'translateX(-50%)' }}>
                  &times;
                </div>
              );
            }
            if (fret === 0) {
              return (
                <div key={stringIndex} className="absolute -top-7 text-emerald-500 font-black text-sm" style={{ left: `${stringIndex * 20}%`, transform: 'translateX(-50%)' }}>
                  &#9675;
                </div>
              );
            }

            const relativeFret = fret - startFret + 1;
            const finger = shape.fingers[stringIndex];

            return (
              <div
                key={stringIndex}
                className="absolute w-7 h-7 bg-[#E87A2C] rounded-full border-2 border-white shadow-xl flex items-center justify-center text-white font-black text-[10px] z-30 transform -translate-x-1/2 -translate-y-1/2"
                style={{
                  top: `${(relativeFret * 20) - 10}%`,
                  left: `${stringIndex * 20}%`
                }}
              >
                {finger}
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white py-2 px-4 flex justify-center border-t border-stone-100">
        <span className="text-[7px] font-bold text-stone-300 uppercase tracking-[0.3em]">Professional {instrument} View</span>
      </div>
    </div>
  );
};
