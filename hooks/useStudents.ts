
import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Student, Teacher, Instrument, Level } from '../types';
import { emusysService } from '../services/emusysService';
import * as XLSX from 'xlsx';

const normalizeKey = (s: string) => {
    if (!s) return "";
    return String(s).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim();
};

const isSimilar = (n1: string, n2: string) => {
    const norm1 = normalizeKey(n1);
    const norm2 = normalizeKey(n2);
    if (norm1 === norm2) return true;
    if (norm1.includes(norm2) || norm2.includes(norm1)) return true;
    const words1 = norm1.split(/\s+/).filter(w => w.length > 2);
    const words2 = norm2.split(/\s+/).filter(w => w.length > 2);
    if (words1.length === 0 || words2.length === 0) return false;
    const set2 = new Set(words2);
    const common = words1.filter(w => set2.has(w));
    return common.length >= 2;
};

export const useStudents = (currentUser: Teacher | null) => {
    const [students, setStudents] = useState<Student[]>([]);
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [lessonHistory, setLessonHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchInitialData = useCallback(async () => {
        setLoading(true);
        try {
            const { data: bTeachers, error: tError } = await supabase.from('mc_teachers').select('*');
            if (tError) console.error("Supabase Teacher Error:", tError);

            if (bTeachers && bTeachers.length > 0) {
                setTeachers(bTeachers);
            } else {
                setTeachers([{
                    id: 'emergency-director',
                    name: 'MusiClass Diretor',
                    password: 'admin',
                    role: 'director'
                }]);
            }

            const { data: bStudents } = await supabase.from('mc_students').select('*').order('name');
            if (bStudents) setStudents(bStudents);

            const { data: bHistory } = await supabase.from('mc_lesson_history')
                .select('*, mc_students(name, instrument)')
                .order('created_at', { ascending: false });
            if (bHistory) setLessonHistory(bHistory);
        } catch (error) {
            console.error("Error fetching data:", error);
            setTeachers([{
                id: 'emergency-director',
                name: 'MusiClass Diretor',
                password: 'admin',
                role: 'director'
            }]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchInitialData();
    }, [fetchInitialData]);

    const addStudent = useCallback(async (formData: FormData) => {
        if (!currentUser) return;
        const name = formData.get('name') as string;
        const instrument = formData.get('instrument') as Instrument;
        const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-4][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(currentUser.id);

        const { error } = await supabase.from('mc_students').insert([{
            name,
            age: formData.get('age') ? Number(formData.get('age')) : undefined,
            instrument,
            level: formData.get('level') as Level,
            teacher_id: isValidUUID ? currentUser.id : null
        }]);

        if (error) {
            if (error.code === '23505') throw new Error("Este aluno já está cadastrado para este instrumento.");
            throw error;
        }
        await fetchInitialData();
    }, [currentUser, fetchInitialData]);

    const deleteLesson = useCallback(async (lessonId: string) => {
        setLoading(true);
        try {
            const { error } = await supabase.from('mc_lesson_history').delete().eq('id', lessonId);
            if (error) throw error;
            await fetchInitialData();
        } catch (error) {
            console.error("Erro ao excluir aula:", error);
            throw error;
        } finally {
            setLoading(false);
        }
    }, [fetchInitialData]);

    const resetData = useCallback(async () => {
        setLoading(true);
        try {
            const { error } = await supabase.from('mc_students').delete().neq('id', '00000000-0000-0000-0000-000000000000');
            if (error) throw error;
            await fetchInitialData();
        } finally {
            setLoading(false);
        }
    }, [fetchInitialData]);

    const addTeacher = useCallback(async (name: string, pass: string) => {
        if (pass.length !== 4 || isNaN(Number(pass))) {
            throw new Error("A senha deve ter exatamente 4 dígitos numéricos.");
        }
        const { error } = await supabase.from('mc_teachers').insert([{ name, password: pass, role: 'teacher' }]);
        if (error) throw error;
        await fetchInitialData();
    }, [fetchInitialData]);

    const deleteTeacher = useCallback(async (id: string) => {
        const teacher = teachers.find(t => t.id === id);
        if (teacher?.role === 'director') throw new Error("O Diretor não pode ser removido.");
        const { error } = await supabase.from('mc_teachers').delete().eq('id', id);
        if (error) throw error;
        await fetchInitialData();
    }, [teachers, fetchInitialData]);

    const emusysSync = useCallback(async () => {
        if (!currentUser) return;

        setLoading(true);
        const logs: string[] = [];
        try {
            const emusysStudents = await emusysService.fetchActiveStudents('');
            if (!emusysStudents || emusysStudents.length === 0) throw new Error("Nenhum aluno retornado pelo Emusys.");

            const batch: any[] = [];
            const toUpdate: any[] = [];
            const missingTeachers = new Set<string>();

            for (const eStudent of emusysStudents) {
                const fullName = eStudent.nome.trim();
                const extractedTeacherName = eStudent.professor.trim();
                const instrumentRaw = eStudent.instrumento.trim();

                let instrument = Instrument.GUITAR;
                const lowerInst = instrumentRaw.toLowerCase();
                if (lowerInst.includes('guitarra') || lowerInst.includes('electric')) instrument = Instrument.ELECTRIC_GUITAR;
                else if (lowerInst.includes('teclado') || lowerInst.includes('keyboard')) instrument = Instrument.KEYBOARD;
                else if (lowerInst.includes('piano')) instrument = Instrument.PIANO;
                else if (lowerInst.includes('bateria') || lowerInst.includes('drums')) instrument = Instrument.DRUMS;
                else if (lowerInst.includes('vocal') || lowerInst.includes('voice') || lowerInst.includes('canto')) instrument = Instrument.VOCALS;
                else if (lowerInst.includes('baixo') || lowerInst.includes('bass')) instrument = Instrument.BASS;
                else if (lowerInst.includes('viol') || lowerInst.includes('guitar')) instrument = Instrument.GUITAR;
                else if (lowerInst.includes('violin')) instrument = Instrument.VIOLIN;

                let teacherId: string | null = null;
                if (extractedTeacherName && extractedTeacherName !== 'Não Atribuído') {
                    const match = teachers.find(t => isSimilar(t.name, extractedTeacherName));
                    if (match) {
                        teacherId = match.id;
                    } else {
                        missingTeachers.add(extractedTeacherName);
                    }
                }

                const existingStudent = students.find(s =>
                    normalizeKey(s.name) === normalizeKey(fullName) &&
                    normalizeKey(s.instrument) === normalizeKey(instrument)
                );

                if (existingStudent) {
                    const teacherChanged = normalizeKey(existingStudent.teacher_id || '') !== normalizeKey(teacherId || '');
                    if (teacherChanged) {
                        const oldTeacherObj = teachers.find(t => t.id === existingStudent.teacher_id);
                        const oldTeacherName = oldTeacherObj?.name || "Sem Professor";
                        const newTeacherNameFound = teachers.find(t => t.id === teacherId)?.name || extractedTeacherName || "Desconhecido";

                        logs.push(`🔄 ${fullName} (${instrument}): Professor trocado de [${oldTeacherName}] para [${newTeacherNameFound}]`);
                        toUpdate.push({
                            id: existingStudent.id,
                            teacher_id: teacherId,
                            lesson_count: eStudent.lesson_count,
                            contract_total: eStudent.contract_total
                        });
                    } else if (existingStudent.lesson_count !== eStudent.lesson_count || existingStudent.contract_total !== eStudent.contract_total) {
                        // Se só mudou a contagem de aulas
                        toUpdate.push({
                            id: existingStudent.id,
                            lesson_count: eStudent.lesson_count,
                            contract_total: eStudent.contract_total
                        });
                    }
                } else {
                    const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-4][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(teacherId || '');
                    batch.push({
                        name: fullName,
                        instrument,
                        level: Level.BEGINNER,
                        teacher_id: isValidUUID ? teacherId : null,
                        lesson_count: eStudent.lesson_count,
                        contract_total: eStudent.contract_total
                    });
                    logs.push(`✨ Novo aluno detectado: ${fullName} (${instrument}) - Prof: ${extractedTeacherName}`);
                }
            }

            // EXECUTAR ATUALIZAÇÕES COM VERIFICAÇÃO DE ERRO
            if (toUpdate.length > 0) {
                for (const up of toUpdate) {
                    const { id, ...updateData } = up;
                    const { error: upError } = await supabase.from('mc_students').update(updateData).eq('id', id);
                    if (upError) console.error(`Erro ao atualizar aluno ${id}:`, upError);
                }
            }

            const emusysKeys = new Set(emusysStudents.map(es => {
                let inst = Instrument.GUITAR;
                const lowerInst = es.instrumento.toLowerCase();
                if (lowerInst.includes('guitarra') || lowerInst.includes('electric')) inst = Instrument.ELECTRIC_GUITAR;
                else if (lowerInst.includes('teclado') || lowerInst.includes('keyboard')) inst = Instrument.KEYBOARD;
                else if (lowerInst.includes('piano')) inst = Instrument.PIANO;
                else if (lowerInst.includes('bateria') || lowerInst.includes('drums')) inst = Instrument.DRUMS;
                else if (lowerInst.includes('vocal') || lowerInst.includes('voice') || lowerInst.includes('canto')) inst = Instrument.VOCALS;
                else if (lowerInst.includes('baixo') || lowerInst.includes('bass')) inst = Instrument.BASS;
                else if (lowerInst.includes('viol') || lowerInst.includes('guitar')) inst = Instrument.GUITAR;
                else if (lowerInst.includes('violin')) inst = Instrument.VIOLIN;
                return `${normalizeKey(es.nome)}|${normalizeKey(inst)}`;
            }));

            const toDelete = students.filter(s => !emusysKeys.has(`${normalizeKey(s.name)}|${normalizeKey(s.instrument)}`));
            if (toDelete.length > 0) {
                const idsToDelete = toDelete.map(s => s.id);
                toDelete.forEach(s => logs.push(`🗑️ Aluno removido (Inativo no Emusys): ${s.name} (${s.instrument})`));
                const { error: delError } = await supabase.rpc('mc_delete_students_bulk', { student_ids: idsToDelete });
                if (delError) console.error("Erro ao remover alunos inativos via RPC Bulk:", delError);
            }

            if (batch.length > 0) {
                const { error: insError } = await supabase.from('mc_students').insert(batch);
                if (insError) throw insError;
            }

            await fetchInitialData();
            return {
                added: batch.length,
                updated: toUpdate.length,
                removed: toDelete.length,
                missingTeachers: Array.from(missingTeachers),
                logs
            };
        } finally {
            setLoading(false);
        }
    }, [currentUser, students, teachers, fetchInitialData]);

    const fileUpload = useCallback(async (file: File) => {
        if (!currentUser) return;
        setLoading(true);
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async (event) => {
                try {
                    const data = new Uint8Array(event.target?.result as ArrayBuffer);
                    const workbook = XLSX.read(data, { type: 'array' });
                    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
                    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

                    const batch: any[] = [];
                    let missingTeachersCount = new Set<string>();

                    for (let index = 1; index < jsonData.length; index++) {
                        const row = jsonData[index];
                        if (!row[0] || String(row[0]).includes('Aluno(a)')) continue;

                        const cell0 = String(row[0]).replace(/\r\n/g, '\n');
                        const cell0Parts = cell0.split('\n');
                        const fullName = cell0Parts[0].trim();
                        let age = undefined;

                        const ageLine = cell0Parts.find(l => l.includes('Idade:'));
                        if (ageLine) {
                            const ageMatch = ageLine.match(/\d+/);
                            if (ageMatch) age = Number(ageMatch[0]);
                        }

                        const cell2 = row[2] ? String(row[2]).replace(/\r\n/g, '\n') : '';
                        const cell2Parts = cell2.split('\n');
                        const instrumentRaw = cell2Parts[0] || '';

                        let teacherId = currentUser.id;
                        const teacherLine = cell2Parts.find(l => l.includes('-Prof.'));
                        if (teacherLine) {
                            const extractedTeacherName = teacherLine.replace('-Prof.', '').trim();
                            const match = teachers.find(t =>
                                t.name.toLowerCase().includes(extractedTeacherName.toLowerCase()) ||
                                extractedTeacherName.toLowerCase().includes(t.name.toLowerCase())
                            );
                            if (match) teacherId = match.id;
                            else missingTeachersCount.add(extractedTeacherName);
                        }

                        let instrument = Instrument.GUITAR;
                        const lowerInst = instrumentRaw.toLowerCase();
                        if (lowerInst.includes('guitarra')) instrument = Instrument.ELECTRIC_GUITAR;
                        else if (lowerInst.includes('teclado')) instrument = Instrument.KEYBOARD;
                        else if (lowerInst.includes('piano')) instrument = Instrument.PIANO;
                        else if (lowerInst.includes('bateria')) instrument = Instrument.DRUMS;
                        else if (lowerInst.includes('vocal')) instrument = Instrument.VOCALS;
                        else if (lowerInst.includes('baixo')) instrument = Instrument.BASS;
                        else if (lowerInst.includes('viol') || lowerInst.includes('guitar')) instrument = Instrument.GUITAR;

                        const exists = students.some(s => s.name.toLowerCase() === fullName.toLowerCase() && s.instrument === instrument);
                        const inBatch = batch.some(s => s.name.toLowerCase() === fullName.toLowerCase() && s.instrument === instrument);

                        if (!exists && !inBatch) {
                            const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-4][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(teacherId);
                            batch.push({ name: fullName, age, instrument, level: Level.BEGINNER, teacher_id: isValidUUID ? teacherId : null });
                        }
                    }

                    if (batch.length > 0) {
                        const { error } = await supabase.from('mc_students').insert(batch);
                        if (error) throw error;
                        await fetchInitialData();
                        resolve({ added: batch.length, missingTeachers: Array.from(missingTeachersCount) });
                    } else {
                        resolve({ added: 0 });
                    }
                } catch (e) { reject(e); }
            };
            reader.readAsArrayBuffer(file);
        });
    }, [currentUser, students, teachers, fetchInitialData]);

    return {
        students, teachers, lessonHistory, loading,
        fetchInitialData, addStudent, deleteLesson,
        resetData, addTeacher, deleteTeacher,
        emusysSync, fileUpload
    };
};
