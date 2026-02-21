
export enum Instrument {
  GUITAR = 'Violão',
  ELECTRIC_GUITAR = 'Guitarra',
  KEYBOARD = 'Teclado',
  DRUMS = 'Bateria',
  PIANO = 'Piano',
  VOCALS = 'Vocais',
  BASS = 'Baixo',
  VIOLIN = 'Violino'
}

export enum Level {
  BEGINNER = 'Iniciante',
  INTERMEDIATE = 'Intermediário',
  ADVANCED = 'Avançado'
}

export interface Teacher {
  id: string;
  name: string;
  password: string;
  role: 'director' | 'teacher';
  avatar?: string;
}

export interface Student {
  id: string;
  name: string;
  age?: number;
  instrument: Instrument;
  level: Level;
  teacher_id?: string;
  teacherId?: string; // For backward compatibility in code if needed
  createdAt?: number | string;
}

export interface ChordDefinition {
  root: string;
  type: string;
  extension?: string;
  notes: string[];
  intervals: number[];
  bass?: string; // For inverted chords like D/F#
  isCustom?: boolean;
}

export interface SoloNote {
  note: string;
  type: 'solo' | 'harmony';
  position?: number; // Optional position in the sequence for alignment (0-indexed)
}

export interface LessonHistory {
  id: string;
  student_id: string;
  teacher_id: string;
  lesson_date: string;
  objective: string;
  report_data: {
    chords: any[];
    scales: any[];
    tabs: any[];
    solos: any[];
    exercises: string[];
    recordings?: { id: string, title: string, url: string }[];
    drums?: {
      rhythms: { id: string, title: string, sequence: string[][], bpm: number, audioUrl?: string }[];
      rudiments: { id: string, title: string, pattern: string[] }[];
      positions?: any;
    };
  };
  mc_students?: {
    name: string;
    instrument: string;
  };
}
