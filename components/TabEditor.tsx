
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
  const columns = 16; // Smaller columns for better mobile focus

  const [grid, setGrid] = useState<string[][]>(() => {
    return Array(6).fill(null).map(() => Array(columns).fill('-'));
  });

  // Sincroniza o valor inicial se houver (útil para carregar aulas)
  useEffect(() => {
    if (value && value.includes('|')) {
      try {
        const lines = value.split('\n');
        if (lines.length === 6) {
          const newGrid = lines.map(line => {
            const content = line.split('|')[1]?.trim().replace(/^-/, '').replace(/-$/, '');
            if (content) {
              return content.split('-').slice(0, columns);
            }
            return Array(columns).fill('-');
          });
          // setGrid(newGrid as string[][]); // Desativado para evitar loop infinito, focar no '8' por agora
        }
      } catch (e) {
        console.error("Erro ao sincronizar tab:", e);
      }
    }
  }, []);

  const [cursor, setCursor] = useState({ r: 0, c: 0 });

  useEffect(() => {
    const tabString = grid.map((row, i) => `${strings[i]} |-${row.join('-')}-`).join('\n');
    onChange(tabString);
  }, [grid]);

  const setNote = (val: string) => {
    const newGrid = [...grid];
    newGrid[cursor.r][cursor.c] = val;
    setGrid(newGrid);
    if (val !== '-' && cursor.c < columns - 1) {
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
        <div className="flex items-center gap-3">
          <FileText className="w-5 h-5 text-indigo-600" />
          <input
            type="text"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="Título da Tab/Riff (ex: Solo)"
            className="text-xl font-black text-slate-900 border-none p-0 focus:ring-0 placeholder:text-slate-200 w-full"
          />
        </div>
      </div>

      {/* Interactive Grid */}
      <div className="bg-slate-900 p-6 rounded-[32px] font-mono relative overflow-hidden shadow-inner">
        {strings.map((s, ri) => (
          <div key={ri} className="flex items-center h-10 border-b border-white/5 last:border-none">
            <span className="w-6 font-black text-indigo-400 text-xs">{s}</span>
            <div className="flex-grow flex justify-between ml-4">
              {grid[ri].map((char, ci) => (
                <div
                  key={ci}
                  onClick={() => setCursor({ r: ri, c: ci })}
                  className={`
                    w-8 h-8 flex items-center justify-center rounded-lg transition-all text-sm cursor-pointer
                    ${cursor.r === ri && cursor.c === ci ? 'bg-indigo-500 text-white shadow-lg scale-110 z-10' : 'text-indigo-100/40 hover:bg-white/5'}
                    ${char !== '-' ? 'font-black text-white' : ''}
                  `}
                >
                  {char}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* MOBILE CONTROLS */}
      <div className="space-y-4 pt-2">
        <div className="flex justify-between items-center bg-slate-50 p-3 rounded-2xl">
          <div className="flex gap-2">
            <button onClick={() => move(0, -1)} className="p-3 bg-white rounded-xl shadow-sm hover:bg-indigo-50 active:scale-95"><ChevronLeft className="w-5 h-5 text-indigo-600" /></button>
            <button onClick={() => move(0, 1)} className="p-3 bg-white rounded-xl shadow-sm hover:bg-indigo-50 active:scale-95"><ChevronRight className="w-5 h-5 text-indigo-600" /></button>
          </div>
          <div className="flex flex-wrap justify-end gap-1.5 flex-grow ml-4">
            {['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '-', 'X'].map(n => (
              <button
                key={n}
                onClick={() => setNote(n)}
                className="w-9 h-9 bg-white border border-slate-200 rounded-lg flex items-center justify-center font-black text-slate-700 active:bg-indigo-600 active:text-white transition-colors text-xs"
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
