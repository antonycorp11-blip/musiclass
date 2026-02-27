
import { useState, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Student, Teacher, ChordDefinition } from '../types';
import { MusicEngine } from '../services/musicEngine';
import { SCALES } from '../constants';

export const useLesson = (selectedStudent: Student | null, currentUser: Teacher | null) => {
    const [currentChords, setCurrentChords] = useState<any[]>([]);
    const [currentScales, setCurrentScales] = useState<any[]>([]);
    const [currentTabs, setCurrentTabs] = useState<{ id: string, title: string, content: string }[]>([]);
    const [currentSolos, setCurrentSolos] = useState<{ id: string, title: string, notes: string[] }[]>([]);
    const [exercises, setExercises] = useState<string[]>([]);
    const [newExercise, setNewExercise] = useState('');
    const [currentObjective, setCurrentObjective] = useState('');
    const [drumsData, setDrumsData] = useState<{ rhythms: any[], rudiments: any[], positions?: any }>({ rhythms: [], rudiments: [], positions: undefined });
    const [recordings, setRecordings] = useState<{ id: string, title: string, blob: Blob | null, url: string }[]>([]);
    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorder = useRef<MediaRecorder | null>(null);
    const audioChunks = useRef<Blob[]>([]);

    const resetLesson = useCallback(() => {
        setCurrentChords([]);
        setCurrentScales([]);
        setCurrentTabs([]);
        setCurrentSolos([]);
        setExercises([]);
        setNewExercise('');
        setCurrentObjective('');
        setRecordings([]);
        setIsRecording(false);
        setDrumsData({ rhythms: [], rudiments: [], positions: undefined });
    }, []);

    const addChord = useCallback((root: string, type: string, extension: string, bass?: string) => {
        const chord = MusicEngine.generateChord(root, type, extension);
        if (chord) {
            setCurrentChords(prev => [...prev, {
                ...chord,
                typeId: type,
                extId: extension,
                root,
                bass: bass === 'none' ? undefined : bass
            }]);
        }
    }, []);

    const saveManualChord = useCallback((name: string, notes: number[], isCustom: boolean) => {
        setCurrentChords(prev => [...prev, {
            root: name,
            notes: [],
            notesWithIndices: notes,
            typeId: '',
            extId: '',
            isCustom
        }]);
    }, []);

    const addScale = useCallback((root: string, scaleId: string) => {
        const notes = MusicEngine.generateScale(root, scaleId);
        const scale = SCALES.find(s => s.id === scaleId);
        if (notes && scale) {
            setCurrentScales(prev => [...prev, { root, name: scale.name, notes }]);
        }
    }, []);

    const addTab = useCallback(() => {
        setCurrentTabs(prev => [...prev, { id: Math.random().toString(), title: '', content: '' }]);
    }, []);

    const addSolo = useCallback(() => {
        setCurrentSolos(prev => [...prev, { id: Math.random().toString(), title: '', notes: [] }]);
    }, []);

    const updateTab = useCallback((id: string, title: string, content: string) => {
        setCurrentTabs(prev => prev.map(t => t.id === id ? { ...t, title, content } : t));
    }, []);

    const updateSolo = useCallback((id: string, title: string, notes: string[]) => {
        setCurrentSolos(prev => prev.map(s => s.id === id ? { ...s, title, notes } : s));
    }, []);

    const removeTab = useCallback((id: string) => {
        setCurrentTabs(prev => prev.filter(t => t.id !== id));
    }, []);

    const addExercise = useCallback((e: React.KeyboardEvent | string) => {
        if (typeof e === 'string') {
            const val = e.trim();
            if (val) setExercises(prev => [...prev, val]);
            return;
        }
        if (e.key === 'Enter' && newExercise.trim()) {
            setExercises(prev => [...prev, newExercise.trim()]);
            setNewExercise('');
        }
    }, [newExercise]);

    const removeExercise = useCallback((index: number) => {
        setExercises(prev => prev.filter((_, i) => i !== index));
    }, []);

    const startRecording = useCallback(async () => {
        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error("Seu navegador não suporta gravação de áudio ou o acesso foi negado.");
            }
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const options = { audioBitsPerSecond: 128000 };
            mediaRecorder.current = new MediaRecorder(stream, options);
            audioChunks.current = [];

            mediaRecorder.current.ondataavailable = (e) => {
                if (e.data.size > 0) audioChunks.current.push(e.data);
            };

            mediaRecorder.current.onstop = () => {
                const blob = new Blob(audioChunks.current, { type: 'audio/webm' });
                const url = URL.createObjectURL(blob);
                const newRecording = {
                    id: Math.random().toString(36).substr(2, 9),
                    title: `Guia Vocal ${recordings.length + 1}`,
                    blob,
                    url
                };
                setRecordings(prev => [...prev, newRecording]);
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.current.start();
            setIsRecording(true);
        } catch (err) {
            console.error("Erro ao acessar microfone:", err);
            throw err;
        }
    }, [recordings.length]);

    const stopRecording = useCallback(() => {
        if (mediaRecorder.current && isRecording) {
            mediaRecorder.current.stop();
            setIsRecording(false);
        }
    }, [isRecording]);

    const handleDrumRecord = useCallback((blob: Blob, title: string) => {
        const url = URL.createObjectURL(blob);
        const newRecording = {
            id: Math.random().toString(36).substr(2, 9),
            title: title,
            blob,
            url
        };
        setRecordings(prev => [...prev, newRecording]);
    }, []);

    const exportSuccess = useCallback(async (): Promise<any[]> => {
        if (!selectedStudent || !currentUser) return recordings;

        let finalRecordings = [...recordings];
        const needsUpload = recordings.filter(r => r.blob !== null);

        if (needsUpload.length > 0) {
            for (let i = 0; i < finalRecordings.length; i++) {
                const rec = finalRecordings[i];
                if (rec.blob) {
                    const fileName = `guide-${selectedStudent.id}-${Date.now()}-${rec.id}.webm`;
                    const { data, error } = await supabase.storage
                        .from('lesson-audios')
                        .upload(fileName, rec.blob);

                    if (error) {
                        console.error("Erro ao subir áudio:", error);
                        continue;
                    }

                    if (data) {
                        const { data: { publicUrl } } = supabase.storage
                            .from('lesson-audios')
                            .getPublicUrl(fileName);
                        finalRecordings[i] = { ...rec, url: publicUrl, blob: null };
                    }
                }
            }
            setRecordings(finalRecordings);
        }

        const reportData = {
            chords: currentChords,
            scales: currentScales,
            tabs: currentTabs,
            solos: currentSolos,
            exercises: exercises,
            recordings: finalRecordings.map(r => ({ id: r.id, title: r.title, url: r.url })),
            drums: drumsData
        };

        const { error } = await supabase.from('mc_lesson_history').insert([{
            student_id: selectedStudent.id,
            teacher_id: currentUser.id,
            objective: currentObjective,
            report_data: reportData
        }]);

        if (error) console.error("Erro ao salvar histórico:", error);
        return finalRecordings;
    }, [selectedStudent, currentUser, recordings, currentChords, currentScales, currentTabs, currentSolos, exercises, drumsData, currentObjective]);

    return {
        currentChords, setCurrentChords,
        currentScales, setCurrentScales,
        currentTabs, setCurrentTabs,
        currentSolos, setCurrentSolos,
        exercises, setExercises,
        newExercise, setNewExercise,
        currentObjective, setCurrentObjective,
        drumsData, setDrumsData,
        recordings, setRecordings,
        isRecording,
        resetLesson,
        addChord, saveManualChord,
        addScale, addTab, addSolo, updateTab, updateSolo, removeTab,
        addExercise, removeExercise,
        startRecording, stopRecording, handleDrumRecord,
        exportSuccess
    };
};
