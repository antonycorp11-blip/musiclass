
import { ROOTS, CHORD_TYPES, EXTENSIONS, SCALES } from '../constants';

const CHROMATIC_SCALE = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export class MusicEngine {
  static getNoteFromInterval(root: string, intervalInSemitones: number) {
    const CHROMATIC_SCALE_SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const CHROMATIC_SCALE_FLAT = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

    // Normalizar entrada
    const mapFlatToSharp: Record<string, string> = { 'Db': 'C#', 'Eb': 'D#', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#' };
    const normalizedRoot = mapFlatToSharp[root] || root;

    const rootIndex = CHROMATIC_SCALE_SHARP.indexOf(normalizedRoot);
    if (rootIndex === -1) return { name: root, absIndex: 0 };

    const absIndex = rootIndex + intervalInSemitones;
    const targetIndex = absIndex % 12;

    const useFlats = root.includes('b');
    const name = useFlats ? CHROMATIC_SCALE_FLAT[targetIndex] : CHROMATIC_SCALE_SHARP[targetIndex];

    return { name, absIndex };
  }

  static generateChord(root: string, typeId: string, extensionId: string = 'none') {
    const type = CHORD_TYPES.find(t => t.id === typeId);
    const ext = EXTENSIONS.find(e => e.id === extensionId);

    if (!type) return null;

    const intervals = [...type.intervals, ...(ext?.intervals || [])];
    const notesWithIndices = intervals.map(i => this.getNoteFromInterval(root, i));

    return {
      root,
      type: type.name,
      extension: ext?.name !== 'Nenhuma' ? ext?.name : '',
      notes: notesWithIndices.map(ni => ni.name),
      notesWithIndices,
      intervals
    };
  }

  static generateScale(root: string, scaleId: string) {
    const scale = SCALES.find(s => s.id === scaleId);
    if (!scale) return null;
    return scale.intervals.map(i => this.getNoteFromInterval(root, i).name);
  }
}
