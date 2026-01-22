
import React from 'react';

export const ROOTS = ['C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B'];


export const ROOT_NAMES: Record<string, string> = {
  'C': 'Dó', 'C#': 'Dó sustenido', 'Db': 'Ré bemol',
  'D': 'Ré', 'D#': 'Ré sustenido', 'Eb': 'Mi bemol',
  'E': 'Mi', 'F': 'Fá', 'F#': 'Fá sustenido', 'Gb': 'Sol bemol',
  'G': 'Sol', 'G#': 'Sol sustenido', 'Ab': 'Lá bemol',
  'A': 'Lá', 'A#': 'Lá sustenido', 'Bb': 'Si bemol',
  'B': 'Si'
};

export const CHORD_TYPES = [
  { id: 'maj', name: 'Maior', intervals: [0, 4, 7] },
  { id: 'min', name: 'Menor', intervals: [0, 3, 7] },
  { id: 'dim', name: 'Diminuto', intervals: [0, 3, 6] },
  { id: 'aug', name: 'Aumentado', intervals: [0, 4, 8] },
  { id: 'sus2', name: 'Sus2', intervals: [0, 2, 7] },
  { id: 'sus4', name: 'Sus4', intervals: [0, 5, 7] },
  { id: 'm7b5', name: 'm7(b5)', intervals: [0, 3, 6, 10] }

];

export const EXTENSIONS = [
  { id: 'none', name: 'Nenhuma', intervals: [] },
  { id: '8', name: '8', intervals: [12] },
  { id: 'add3', name: 'add3', intervals: [4] },
  { id: 'add4', name: 'add4', intervals: [5] },
  { id: 'add5', name: 'add5', intervals: [7] },
  { id: '6', name: '6', intervals: [9] },
  { id: '7', name: '7', intervals: [10] },
  { id: 'maj7', name: 'maj7', intervals: [11] },
  { id: '9', name: '9', intervals: [2, 14] },
  { id: 'add9', name: 'add9', intervals: [14] },
  { id: '11', name: '11', intervals: [5, 17] },
  { id: '13', name: '13', intervals: [9, 21] }

];

export const SCALES = [
  { id: 'major', name: 'Maior', intervals: [0, 2, 4, 5, 7, 9, 11] },
  { id: 'minor', name: 'Menor Natural', intervals: [0, 2, 3, 5, 7, 8, 10] },
  { id: 'harmonic_minor', name: 'Menor Harmônica', intervals: [0, 2, 3, 5, 7, 8, 11] },
  { id: 'melodic_minor', name: 'Menor Melódica', intervals: [0, 2, 3, 5, 7, 9, 11] },
  { id: 'penta_maj', name: 'Pentatônica Maior', intervals: [0, 2, 4, 7, 9] },
  { id: 'penta_min', name: 'Pentatônica Menor', intervals: [0, 3, 5, 7, 10] }
];
