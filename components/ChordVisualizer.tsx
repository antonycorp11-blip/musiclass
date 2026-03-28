
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

  const isBass = instrument === Instrument.BASS || instrument?.toString().toLowerCase().includes('baixo');
  const isViolin = instrument?.toString().toLowerCase().includes('violin') || instrument?.toString().toLowerCase().includes('violino');
  const numStrings = (isBass || isViolin) ? 4 : 6;
  const stringIndices = Array.from({ length: numStrings }, (_, i) => i);

  // Guitar/Bass Logic
  let shape: any;
  if (isCustom && notesWithIndices) {
    // Reconstruct shape from custom data
    const frets: (number | null)[] = Array(numStrings).fill(null);
    const fingers: number[] = Array(numStrings).fill(0);
    for (let j = 0; j < notesWithIndices.length; j += 3) {
      const s = notesWithIndices[j] - 1;
      if (s < 0 || s >= numStrings) continue; // Safety check
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
  const maxFret = nonNullFrets.length > 0 ? Math.max(...nonNullFrets) : 0;

  // Dynamic windowing: show at least 5 frets, but more if the chord spans more
  const startFret = minFret > 4 ? minFret : 1;
  const numFretsToShow = Math.max(5, maxFret - startFret + 1);
  const fretIndices = Array.from({ length: numFretsToShow + 1 }, (_, i) => i);

  const displayType = type === 'min' ? 'm' : (type === 'maj' ? '' : type);
  const displayExt = ext === 'none' ? '' : (ext === '7' ? '7' : ext);
  const displayBass = bass && bass !== 'none' ? `/${bass}` : '';
  const fullChordName = isCustom ? root : `${root}${displayType}${displayExt}${displayBass}`;

  return (
    <div className={`flex flex-col bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-xl group transition-all duration-300 w-full ${isFullscreen ? 'max-w-[450px]' : 'max-w-[280px] mx-auto'}`}>
      <div className="bg-[#1A110D] py-4 px-5 flex justify-between items-center border-b-2 border-[#E87A2C]/30">
        <div className="h-8">
          <svg viewBox="0 0 120 32" className="h-full">
            <text x="0" y="54%" dominantBaseline="middle" fill="#E87A2C" fontWeight="900" fontSize="24" style={{ letterSpacing: '-0.05em' }}>{fullChordName.toUpperCase()}</text>
          </svg>
        </div>
        <div className="flex gap-3 shrink-0">
          {chordNotes.map((n, i) => (
             <span key={i} className="text-[14px] font-black text-white/80 uppercase tracking-tighter leading-none">{n}</span>
          ))}
        </div>
      </div>

      <div className="p-6 bg-[#FBF6F0] flex flex-col items-center">

        <div className={`relative ${isFullscreen ? 'w-72 h-[400px]' : 'w-32 h-48'} bg-white border-x-[4px] border-b-[4px] border-[#3C2415] rounded-b-xl shadow-2xl mt-1 relative z-10`}>
          {/* Top Nut or Fret Label */}
          {startFret > 1 ? (
            <div className="absolute -left-12 top-0 w-12 h-6 z-50">
              <svg viewBox="0 0 50 24" className="w-full h-full">
                <rect x="0" y="0" width="50" height="24" rx="6" fill="white" stroke="#E5E7EB" strokeWidth="1" />
                <text x="50%" y="54%" textAnchor="middle" dominantBaseline="middle" fill="#1A110D" fontWeight="900" fontSize="10">{startFret}ª casa</text>
              </svg>
            </div>
          ) : (
            <div className="absolute top-0 w-full h-4 bg-[#1A110D] -mt-2 rounded-t-sm z-40 shadow-md border-b border-[#E87A2C]/20" />
          )}

          {/* Fret Lines */}
          {fretIndices.map(f => (
            <div
              key={f}
              className="absolute w-full h-[3px] bg-stone-200/80 shadow-[0_1px_0_rgba(255,255,255,0.8)]"
              style={{ top: `${(f / numFretsToShow) * 100}%` }}
            />
          ))}

          {/* String Lines */}
          {stringIndices.map(s => (
            <div
              key={s}
              className={`absolute h-full shadow-inner ${s === 0 || s === numStrings - 1 ? 'w-[2px]' : 'w-[1.5px]'} bg-gradient-to-r from-stone-300 via-stone-400 to-stone-300`}
              style={{ left: `${s * (100 / (numStrings - 1))}%` }}
            />
          ))}

          {shape.barre && (
            <div
              className="absolute bg-[#1A110D] rounded-full border-2 border-[#3C2415] z-10 shadow-2xl flex items-center justify-center overflow-hidden"
              style={{
                top: `${((shape.barre - startFret + 1) / numFretsToShow) * 100 - (100 / numFretsToShow / 2 + 5)}%`,
                left: '-2%',
                width: '104%',
                height: `${80 / numFretsToShow}%`
              }}
            >
              <div className="w-full h-full bg-gradient-to-b from-white/10 to-transparent flex items-center justify-center">
                <div className="w-1.5 h-1.5 bg-[#E87A2C] rounded-full shadow-[0_0_10px_#E87A2C]" />
              </div>
            </div>
          )}

          {shape.frets.map((fret: any, stringIndex: number) => {
            if (fret === null) {
              return (
                <div key={stringIndex} className="absolute -top-10 w-8 h-8 z-50 transform -translate-x-1/2" style={{ left: `${stringIndex * (100 / (numStrings - 1))}%` }}>
                  <svg viewBox="0 0 24 24" className="w-full h-full drop-shadow-sm">
                    <path d="M7 7L17 17M7 17L17 7" stroke="#F43F5E" strokeWidth="3.5" strokeLinecap="round" />
                  </svg>
                </div>
              );
            }
            if (fret === 0) {
              return (
                <div key={stringIndex} className="absolute -top-10 w-8 h-8 z-50 transform -translate-x-1/2" style={{ left: `${stringIndex * (100 / (numStrings - 1))}%` }}>
                  <svg viewBox="0 0 24 24" className="w-full h-full drop-shadow-sm">
                    <circle cx="12" cy="12" r="7" fill="none" stroke="#10B981" strokeWidth="2.5" />
                  </svg>
                </div>
              );
            }

            const relativeFret = fret - startFret + 1;
            const finger = shape.fingers[stringIndex];

            return (
              <div
                key={stringIndex}
                className={`absolute ${isFullscreen ? 'w-10 h-10' : 'w-7 h-7'} bg-[#1A110D] rounded-full border-2 border-white shadow-[0_5px_15px_rgba(0,0,0,0.3)] z-30 transform -translate-x-1/2 -translate-y-1/2 hover:scale-110 transition-transform`}
                style={{
                  top: `${(relativeFret / numFretsToShow) * 100 - (100 / numFretsToShow / 2)}%`,
                  left: `${stringIndex * (100 / (numStrings - 1))}%`
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-[#E87A2C]/20 to-transparent rounded-full" />
                <svg viewBox="0 0 40 40" className="w-full h-full relative z-10">
                  <text x="50%" y="54%" textAnchor="middle" dominantBaseline="middle" fill="white" fontWeight="900" fontSize={isFullscreen ? "14" : "18"}>{finger || ''}</text>
                </svg>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-stone-50 py-3 px-5 flex justify-center border-t border-stone-100 italic">
        <span className="text-[10px] font-black text-stone-300 uppercase tracking-widest leading-none">Diagrama Digital</span>
      </div>
    </div >
  );
};
