
import React, { useState, useEffect, useRef } from 'react';
import { FileText, Trash2, ChevronLeft, ChevronRight, Hash } from 'lucide-react';

interface Props {
  onChange: (tab: string) => void;
  value: string;
  title: string;
  onTitleChange: (title: string) => void;
}

export const TabEditor: React.FC<Props> = ({ onChange, value, title, onTitleChange }) => {
  const strings = ['e', 'B', 'G', 'D', 'A', 'E'];
  const columns = 64; // Increased for longer tabs

  const [grid, setGrid] = useState<string[][]>(() => {
    return Array(6).fill(null).map(() => Array(columns).fill('-'));
  });

  // Load existing data if any
  useEffect(() => {
    if (value && value.includes('|')) {
      try {
        const lines = value.split('\n');
        if (lines.length === 6) {
          const newGrid = Array(6).fill(null).map(() => Array(columns).fill('-'));
          lines.forEach((line, ri) => {
            const content = line.split('|')[1]?.trim();
            if (content) {
              const parts = content.split('-').filter(p => p !== '');
              parts.forEach((p, ci) => {
                if (ci < columns) newGrid[ri][ci] = p;
              });
            }
          });
          setGrid(newGrid);
        }
      } catch (e) {
        console.error("Erro ao sincronizar tab:", e);
      }
    }
  }, []); // Only on mount

  const [cursor, setCursor] = useState({ r: 0, c: 0 });

  useEffect(() => {
    const tabString = grid.map((row, i) => `${strings[i]} |-${row.join('-')}-`).join('\n');
    onChange(tabString);
  }, [grid]);

  const setNote = (val: string) => {
    const newGrid = [...grid];
    let currentValue = newGrid[cursor.r][cursor.c];

    // Logic for double digits: if current is a digit and new is a digit, append
    if (val !== '-' && val !== 'X' && currentValue !== '-' && currentValue !== 'X' && currentValue.length < 2) {
      const nextVal = currentValue + val;
      if (parseInt(nextVal) <= 24) {
        newGrid[cursor.r][cursor.c] = nextVal;
      } else {
        newGrid[cursor.r][cursor.c] = val;
      }
    } else {
      newGrid[cursor.r][cursor.c] = val;
    }

    setGrid(newGrid);
    if (val !== '-' && cursor.c < columns - 1) {
      // Don't auto-move if we just typed a single digit that could be followed by another
      // But actually, for tabs, it's better to move and use backspace to fix.
      // Or maybe only move if it's the 2nd digit or we press a key.
      // Let's stick to standard tab editor behavior: one cell = one fret position.
      setCursor({ ...cursor, c: cursor.c + 1 });
    }
  };

  const move = (dr: number, dc: number) => {
    setCursor({
      r: Math.max(0, Math.min(5, cursor.r + dr)),
      c: Math.max(0, Math.min(columns - 1, cursor.c + dc))
    });
  };

  return (
    <div className="bg-white rounded-[40px] p-6 border border-slate-100 shadow-sm space-y-6 overflow-hidden">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-[#E87A2C]" />
            <input
              type="text"
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              placeholder="Título da Tab/Riff (ex: Solo)"
              className="text-xl font-black text-slate-900 border-none p-0 focus:ring-0 placeholder:text-slate-200 w-full"
            />
          </div>
          <div className="text-[10px] font-black text-stone-400 uppercase tracking-widest hidden md:block">Clique para navegar • Digite números</div>
        </div>
      </div>

      {/* Interactive Grid with Horizontal Scroll */}
      <div className="bg-slate-900 p-6 rounded-[32px] font-mono relative shadow-inner overflow-x-auto custom-scrollbar overflow-y-hidden">
        <div className="min-w-max">
          {strings.map((s, ri) => (
            <div key={ri} className="flex items-center h-10 border-b border-white/5 last:border-none">
              <span className="w-8 shrink-0 font-black text-[#E87A2C] text-xs">{s}</span>
              <div className="flex items-center gap-1 ml-4">
                {grid[ri].map((char, ci) => (
                  <div
                    key={ci}
                    onClick={() => setCursor({ r: ri, c: ci })}
                    className={`
                      w-11 h-11 shrink-0 flex items-center justify-center rounded-xl transition-all text-base cursor-pointer border
                      ${cursor.r === ri && cursor.c === ci ? 'bg-[#E87A2C] text-white border-[#E87A2C] shadow-lg scale-110 z-10' : 'text-indigo-100/30 border-white/5 hover:bg-white/5'}
                      ${char !== '-' ? 'font-black text-white bg-white/10' : ''}
                    `}
                  >
                    {char}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MOBILE CONTROLS */}
      <div className="pt-2">
        <div className="flex flex-col md:flex-row gap-6 justify-between items-start bg-slate-50 p-6 rounded-[32px] border border-slate-100">
          <div className="flex md:flex-col gap-3 w-full md:w-auto">
            <button onClick={() => move(0, -1)} className="flex-1 md:w-14 h-14 bg-white rounded-2xl shadow-sm hover:bg-orange-50 active:scale-95 text-[#E87A2C] flex items-center justify-center border border-slate-200"><ChevronLeft className="w-6 h-6" /></button>
            <button onClick={() => move(0, 1)} className="flex-1 md:w-14 h-14 bg-white rounded-2xl shadow-sm hover:bg-orange-50 active:scale-95 text-[#E87A2C] flex items-center justify-center border border-slate-200"><ChevronRight className="w-6 h-6" /></button>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 w-full md:w-auto">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', 'X'].map(n => (
              <button
                key={n}
                onClick={() => setNote(n)}
                className="w-12 h-12 bg-white border border-slate-200 rounded-2xl flex items-center justify-center font-black text-[#1A110D] hover:border-[#E87A2C] hover:text-[#E87A2C] active:bg-[#E87A2C] active:text-white transition-all text-sm shadow-sm"
              >
                {n}
              </button>
            ))}
            <button
              onClick={() => {
                const newGrid = [...grid];
                newGrid[cursor.r][cursor.c] = '-';
                setGrid(newGrid);
              }}
              className="col-span-2 sm:col-span-2 h-12 bg-[#1A110D] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-stone-800 transition-all"
            >
              LIMPAR
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
