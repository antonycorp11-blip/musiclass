
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
  bass?: string;
  notesWithIndices?: any[];
  isCustom?: boolean;
  isFullscreen?: boolean;
}


export const ChordVisualizer: React.FC<Props> = ({ instrument, chordNotes, root, type = 'maj', ext = '', bass, notesWithIndices, isCustom, isFullscreen }) => {
  if (instrument === Instrument.KEYBOARD || instrument === Instrument.PIANO || instrument === Instrument.VOCALS) {
    return <KeyboardVisualizer chordNotes={chordNotes} root={root} type={type} ext={ext} bass={bass} notesWithIndices={notesWithIndices} isCustom={isCustom} />;
  }

  if (instrument === Instrument.DRUMS) {
    return <DrumsVisualizer root={root} />;
  }

  const isBass = instrument === Instrument.BASS;
  const numStrings = isBass ? 4 : 6;
  const stringIndices = Array.from({ length: numStrings }, (_, i) => i);

  // Guitar/Bass Logic
  let shape: any;
  if (isCustom && notesWithIndices) {
    // Reconstruct shape from custom data
    const frets: (number | null)[] = Array(numStrings).fill(null);
    const fingers: number[] = Array(numStrings).fill(0);
    for (let j = 0; j < notesWithIndices.length; j += 3) {
      const s = notesWithIndices[j] - 1;
      if (s >= numStrings) continue; // Safety check
      const f = notesWithIndices[j + 1];
      const fin = notesWithIndices[j + 2];
      frets[s] = f;
      fingers[s] = fin;
    }
    shape = { frets, fingers, barre: null };
  } else {
    shape = getGuitarShape(root, type, ext);
  }

  const nonNullFrets = shape.frets.filter((f: any) => f !== null && f > 0) as number[];
  const minFret = nonNullFrets.length > 0 ? Math.min(...nonNullFrets) : 0;
  const startFret = minFret > 4 ? minFret : 1;

  const displayType = type === 'min' ? 'm' : (type === 'maj' ? '' : type);
  const displayExt = ext === 'none' ? '' : (ext === '7' ? '7' : ext);
  const displayBass = bass && bass !== 'none' ? `/${bass}` : '';
  const fullChordName = isCustom ? root : `${root}${displayType}${displayExt}${displayBass}`;

  return (
    <div className={`flex flex-col bg-white border border-stone-200 rounded-xl overflow-hidden shadow-md group transition-all duration-300 w-full ${isFullscreen ? 'max-w-[400px]' : 'max-w-[260px] mx-auto'}`}>
      <div className="bg-[#1A110D] py-3 px-4 flex justify-between items-center border-b border-black">
        <h5 className="text-xl font-black text-[#E87A2C] uppercase leading-none">{fullChordName}</h5>
        <div className="flex gap-1 shrink-0">
          {!isCustom && chordNotes.slice(0, 3).map((n, i) => (
            <span key={i} className="text-[10px] font-bold text-white uppercase bg-white/10 px-2 py-0.5 rounded-md">{n}</span>
          ))}
        </div>
      </div>

      <div className="p-4 bg-stone-50 flex flex-col items-center">
        <p className="text-[#E87A2C] font-black uppercase tracking-[0.2em] text-[7px] mb-3 opacity-50">{instrument} {isCustom ? 'Custom' : 'Diagram'}</p>

        <div className={`relative ${isFullscreen ? 'w-64 h-[320px]' : 'w-28 h-40'} bg-white border-x-[3px] border-b-[3px] border-[#3C2415]/80 rounded-b-lg shadow-xl mt-1 relative z-10`}>
          {/* Top Nut or Fret Label */}
          {startFret > 1 ? (
            <div className="absolute -left-10 top-0 text-[#1A110D] font-black text-xs bg-stone-100 px-1.5 py-0.5 rounded border border-stone-200">{startFret}ª casa</div>
          ) : (
            <div className="absolute top-0 w-full h-3 bg-[#1A110D] -mt-1.5 rounded-sm z-20 shadow-md" />
          )}

          {[1, 2, 3, 4, 5].map(f => (
            <div key={f} className="absolute w-full h-[2px] bg-stone-200" style={{ top: `${f * 20}%` }} />
          ))}

          {stringIndices.map(s => (
            <div key={s} className="absolute h-full w-[1px] bg-stone-300" style={{ left: `${s * (100 / (numStrings - 1))}%` }} />
          ))}

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

          {shape.frets.map((fret: any, stringIndex: number) => {
            if (fret === null) {
              return (
                <div key={stringIndex} className="absolute -top-7 text-rose-500 font-black text-sm" style={{ left: `${stringIndex * (100 / (numStrings - 1))}%`, transform: 'translateX(-50%)' }}>
                  &times;
                </div>
              );
            }
            if (fret === 0) {
              return (
                <div key={stringIndex} className="absolute -top-7 text-emerald-500 font-black text-sm" style={{ left: `${stringIndex * (100 / (numStrings - 1))}%`, transform: 'translateX(-50%)' }}>
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
                  left: `${stringIndex * (100 / (numStrings - 1))}%`
                }}
              >
                {finger || ''}
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
