
import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { Student, Teacher, Instrument, ChordDefinition } from '../types';
import { useLesson as useLessonHook } from '../hooks/useLesson';

interface LessonContextType {
    selectedStudent: Student | null;
    setSelectedStudent: (s: Student | null) => void;
    // Proxied from useLesson
    currentChords: any[];
    setCurrentChords: React.Dispatch<React.SetStateAction<any[]>>;
    currentScales: any[];
    setCurrentScales: React.Dispatch<React.SetStateAction<any[]>>;
    currentTabs: any[];
    setCurrentTabs: React.Dispatch<React.SetStateAction<any[]>>;
    currentSolos: any[];
    setCurrentSolos: React.Dispatch<React.SetStateAction<any[]>>;
    exercises: string[];
    setExercises: React.Dispatch<React.SetStateAction<string[]>>;
    currentObjective: string;
    setCurrentObjective: React.Dispatch<React.SetStateAction<string>>;
    drumsData: any;
    setDrumsData: React.Dispatch<React.SetStateAction<any>>;
    recordings: any[];
    setRecordings: React.Dispatch<React.SetStateAction<any[]>>;
    isRecording: boolean;
    resetLesson: () => void;
    addChord: (root: string, type: string, extension: string, bass?: string) => void;
    saveManualChord: (name: string, notes: number[], isCustom: boolean) => void;
    addScale: (root: string, scaleId: string) => void;
    addTab: () => void;
    addSolo: () => void;
    updateTab: (id: string, title: string, content: string) => void;
    updateSolo: (id: string, title: string, notes: string[]) => void;
    removeTab: (id: string) => void;
    addExercise: (e: React.KeyboardEvent | string) => void;
    removeExercise: (index: number) => void;
    startRecording: () => Promise<void>;
    stopRecording: () => void;
    handleDrumRecord: (blob: Blob, title: string) => void;
    exportSuccess: () => Promise<any>;
}

const LessonContext = createContext<LessonContextType | undefined>(undefined);

export const LessonProvider: React.FC<{ children: React.ReactNode, currentUser: Teacher | null }> = ({ children, currentUser }) => {
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const lesson = useLessonHook(selectedStudent, currentUser);

    return (
        <LessonContext.Provider value={{
            selectedStudent,
            setSelectedStudent,
            ...lesson
        }}>
            {children}
        </LessonContext.Provider>
    );
};

export const useLessonContext = () => {
    const context = useContext(LessonContext);
    if (!context) throw new Error("useLessonContext must be used within a LessonProvider");
    return context;
};
