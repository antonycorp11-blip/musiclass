
import React, { useState } from 'react';

interface Props {
  onSave: (notes: string[]) => void;
}

export const KeyboardEditor: React.FC<Props> = ({ onSave }) => {
  const [melody, setMelody] = useState<string[]>([]);
  const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

  const addNote = (note: string) => {
    const newMelody = [...melody, note];
    setMelody(newMelody);
    onSave(newMelody);
  };

  const removeLast = () => {
    const newMelody = melody.slice(0, -1);
    setMelody(newMelody);
    onSave(newMelody);
  };

  return (
    <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
      <h3 className="font-semibold text-gray-700 mb-4">Melodia / Solo (Teclado)</h3>
      
      <div className="flex flex-wrap gap-1 mb-6">
        {notes.map(n => (
          <button
            key={n}
            onClick={() => addNote(n)}
            className={`w-10 h-10 flex items-center justify-center rounded text-sm font-bold transition-colors ${
              n.includes('#') ? 'bg-gray-800 text-white hover:bg-black' : 'bg-gray-100 text-gray-800 hover:bg-gray-200 border'
            }`}
          >
            {n}
          </button>
        ))}
      </div>

      <div className="min-h-[60px] p-3 bg-gray-50 rounded border border-dashed flex flex-wrap gap-2 items-center">
        {melody.length === 0 && <span className="text-gray-400 italic">Nenhuma nota selecionada</span>}
        {melody.map((n, i) => (
          <span key={i} className="px-2 py-1 bg-indigo-600 text-white rounded text-sm flex items-center gap-1 shadow-sm">
            {n}
          </span>
        ))}
        {melody.length > 0 && (
          <button onClick={removeLast} className="text-red-500 text-xs font-bold ml-2">Limpar última</button>
        )}
      </div>
    </div>
  );
};
