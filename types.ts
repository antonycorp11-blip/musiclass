
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
  lesson_count?: number;
  contract_total?: number;
}

export interface LessonTemplate {
  id: string;
  teacher_id: string;
  title: string;
  instrument: string;
  objective: string;
  report_data: LessonHistory['report_data'];
  is_public: boolean;
  created_at?: string;
  mc_teachers?: {
    name: string;
  };
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

// --- SISTEMA CURRICULAR ---

export type InstrumentGroup = 'harmono_melodico' | 'percussao' | 'vocal';

export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
}

export interface CurriculumTopic {
  id: string;
  group_name: InstrumentGroup;
  month_index: number;
  title: string;
  content_text: string;
  quiz_json: QuizQuestion[];
  created_at?: string;
}

export interface StudentTopicProgress {
  id: string;
  student_id: string;
  topic_id: string;
  status: 'pending' | 'applied' | 'quiz_completed';
  quiz_score?: number;
  applied_at?: string;
  completed_at?: string;
  teacher_id?: string;
  qr_code_token?: string;
  topic?: CurriculumTopic; // Joined data
}
