
import { supabase } from '../lib/supabase';
import { Instrument, InstrumentGroup, CurriculumTopic, StudentTopicProgress, Student } from '../types';

export const getInstrumentGroup = (instrument: Instrument): InstrumentGroup => {
    switch (instrument) {
        case Instrument.DRUMS: return 'percussao';
        case Instrument.VOCALS: return 'vocal';
        default: return 'harmono_melodico';
    }
};

/**
 * BUSCA: Usa a tabela de Templates (que sabemos que funciona) para guardar a Grade.
 */
export const fetchCurriculumTopics = async (group: InstrumentGroup): Promise<CurriculumTopic[]> => {
    try {
        // 1. Busca na tabela nova
        const { data: newTopics, error: newError } = await supabase
            .from('mc_curriculum_topics')
            .select('*')
            .eq('group_name', group);

        // 2. Busca na tabela legada (TUDO que começa com GRADE_)
        const { data: legacyTopics, error: legacyError } = await supabase
            .from('mc_lesson_templates')
            .select('*')
            .ilike('instrument', 'GRADE_%');

        if (newError && !newError.message.includes("not found")) console.error("Erro nova:", newError);

        const merged: CurriculumTopic[] = [];

        // Mapeia novos
        if (newTopics) {
            newTopics.forEach(item => {
                merged.push({
                    id: item.id,
                    month_index: item.month_index || 1,
                    group_name: group,
                    title: item.title,
                    content_text: item.content_text,
                    quiz_json: item.quiz_json || []
                });
            });
        }

        // Mapeia legados (Filtra por grupo)
        if (legacyTopics) {
            legacyTopics.forEach(item => {
                const legacyInst = item.instrument.replace('GRADE_', '').toLowerCase();
                if (getInstrumentGroup(legacyInst as any) === group) {
                    if (!merged.find(m => m.id === item.id)) {
                        merged.push({
                            id: item.id,
                            month_index: item.report_data?.month_index || 1,
                            group_name: group,
                            title: item.title,
                            content_text: item.objective,
                            quiz_json: item.report_data?.quiz_json || []
                        });
                    }
                }
            });
        }

        return merged.sort((a, b) => a.month_index - b.month_index);
    } catch (e) {
        console.error("Erro híbrido:", e);
        return [];
    }
};

/**
 * SALVAMENTO: Usa a tabela mc_lesson_templates como repositório.
 */
export const saveCurriculumTopic = async (topic: Partial<CurriculumTopic>, group: InstrumentGroup, teacherId: string) => {
    const { error } = await supabase
        .from('mc_curriculum_topics')
        .upsert({
            id: topic.id || undefined,
            title: topic.title,
            group_name: group,
            month_index: topic.month_index,
            content_text: topic.content_text,
            quiz_json: topic.quiz_json || [],
            creator_id: teacherId
        });

    if (error) throw error;
};

// Funções de progresso continuam usando as tabelas de alunos que já funcionam
export const fetchStudentCurriculumProgress = async (studentId: string, allTopics: CurriculumTopic[]): Promise<StudentTopicProgress[]> => {
    try {
        const { data, error } = await supabase
            .from('mc_student_topics')
            .select('*')
            .eq('student_id', studentId);

        if (error) {
            // Se a tabela não existe, apenas retorna vazio em vez de explodir erro
            if (error.message.includes("mc_student_topics")) return [];
            throw error;
        }

        // Injeta os dados do tópico no progresso manualmente
        return (data || []).map(p => ({
            ...p,
            topic: allTopics.find(t => t.id === p.topic_id)
        }));
    } catch (e) {
        console.warn("Tabela de progresso ainda não configurada no Supabase.");
        return [];
    }
};

export const applyTopicToStudent = async (studentId: string, topicId: string, teacherId: string): Promise<string> => {
    let token = Math.random().toString(36).substring(2, 15).toUpperCase();
    try {
        // Primeiro, vê se já existe um token ou registro para este aluno + topico
        const { data: existing } = await supabase
            .from('mc_student_topics')
            .select('*')
            .eq('student_id', studentId)
            .eq('topic_id', topicId)
            .maybeSingle();

        if (existing) {
            token = existing.qr_code_token || token;
            const { error: upError } = await supabase
                .from('mc_student_topics')
                .update({ status: 'applied', teacher_id: teacherId, applied_at: new Date().toISOString(), qr_code_token: token })
                .eq('id', existing.id);
            if (upError) throw upError;
        } else {
            const { error: insError } = await supabase
                .from('mc_student_topics')
                .insert({
                    student_id: studentId,
                    topic_id: topicId,
                    teacher_id: teacherId,
                    status: 'applied',
                    applied_at: new Date().toISOString(),
                    qr_code_token: token
                });
            if (insError) throw insError;
        }
    } catch (e) {
        console.error("Erro ao aplicar tópico:", e);
    }
    return token;
};
export const calculatePedagogicalRadar = (
    student: Student,
    allTopics: CurriculumTopic[],
    progress: StudentTopicProgress[]
) => {
    const lessonCount = student.lesson_count || 0;
    const currentMonthIndex = Math.floor((lessonCount) / 4) + 1;

    // Tópicos que o aluno deveria ter feito (mês atual e anteriores)
    const requiredTopics = allTopics.filter(t => t.month_index <= currentMonthIndex);

    // Tópicos pendentes (não concluídos com quiz)
    const pendingTopics = requiredTopics.filter(t =>
        !progress.some(p => p.topic_id === t.id && p.status === 'quiz_completed')
    );

    // Separa os que já foram aplicados (mas sem quiz) dos que nem foram aplicados
    const appliedPending = pendingTopics.filter(t =>
        progress.some(p => p.topic_id === t.id && p.status === 'applied')
    );

    const notAppliedPending = pendingTopics.filter(t =>
        !progress.some(p => p.topic_id === t.id && (p.status === 'applied' || p.status === 'quiz_completed'))
    );

    // Tópico ideal para a aula de HOJE (geralmente o do mês atual se não foi aplicado)
    const idealTopic = notAppliedPending.find(t => t.month_index === currentMonthIndex) || notAppliedPending[0] || null;

    let status: 'ok' | 'action_needed' | 'critical' = 'ok';
    if (notAppliedPending.some(t => t.month_index < currentMonthIndex)) status = 'critical';
    else if (idealTopic) status = 'action_needed';

    return {
        currentMonthIndex,
        lessonCount,
        idealTopic,
        status,
        backlogCount: notAppliedPending.filter(t => t.month_index < currentMonthIndex).length,
        pendingTopics: notAppliedPending.filter(t => t.id !== idealTopic?.id),
        appliedTopics: appliedPending,
        allTopics, // Lista completa para o modal
        progress
    };
};
export const submitQuizResult = async (studentId: string, topicId: string, score: number) => {
    const { error } = await supabase
        .from('mc_student_topics')
        .update({
            quiz_score: score,
            status: score >= 60 ? 'quiz_completed' : 'applied',
            completed_at: score >= 60 ? new Date().toISOString() : null
        })
        .match({ student_id: studentId, topic_id: topicId });

    if (error) throw error;

    // Se passou, registra no histórico geral de aulas
    if (score >= 60) {
        await supabase
            .from('mc_lesson_history')
            .insert({
                student_id: studentId,
                teacher_id: "00000000-0000-0000-0000-000000000000",
                objective: `AVALIAÇÃO CONCLUÍDA: ${score}% de aproveitamento.`,
                report_data: {
                    exercises: [`Questionário realizado: Pontuação ${score}%`],
                    chords: [],
                    scales: [],
                    tabs: [],
                    solos: []
                },
                lesson_date: new Date().toISOString()
            });
    }
};

export const resetStudentTopic = async (studentId: string, topicId: string) => {
    const { error } = await supabase
        .from('mc_student_topics')
        .update({
            quiz_score: 0,
            status: 'applied',
            completed_at: null
        })
        .match({ student_id: studentId, topic_id: topicId });

    if (error) throw error;
};
