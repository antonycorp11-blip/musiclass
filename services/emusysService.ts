
import { Instrument } from '../types';

// O proxy no vite.config.ts redireciona /emusys-api para https://api.emusys.com.br
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const EDGE_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/emusys-proxy`;

export interface EmusysStudent {
    nome: string;
    professor: string;
    instrumento: string;
    lesson_count?: number;
    contract_total?: number;
}

export const emusysService = {
    fetchActiveStudents: async (_token: string): Promise<EmusysStudent[]> => {
        try {
            console.log("Iniciando busca sincronizada via Proxy Seguro...");

            const now = new Date();
            const start = new Date(now.getTime() - (10 * 24 * 60 * 60 * 1000));
            const end = new Date(now.getTime() + (10 * 24 * 60 * 60 * 1000));

            const startDate = start.toISOString().split('T')[0] + ' 00:00:00';
            const endDate = end.toISOString().split('T')[0] + ' 23:59:59';

            let allStudentsMap = new Map<string, EmusysStudent>();
            let nextCursor: string | null = null;
            let hasMore = true;

            const supabaseKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY;

            while (hasMore) {
                const path = `/aulas?data_hora_inicial=${encodeURIComponent(startDate)}&data_hora_final=${encodeURIComponent(endDate)}${nextCursor ? `&cursor=${encodeURIComponent(nextCursor)}` : ''}`;

                const response = await fetch(EDGE_FUNCTION_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'apikey': supabaseKey
                    },
                    body: JSON.stringify({ path })
                });

                if (!response.ok) {
                    const err = await response.json();
                    const details = err.details || err.content || 'Falha desconhecida';
                    throw new Error(`Erro Proxy (${response.status}): ${err.error}. Resposta: ${details}`);
                }

                const data = await response.json();
                const lessons = data.items || [];

                lessons.forEach((lesson: any) => {
                    const category = (lesson.categoria || '').toLowerCase();
                    const type = (lesson.tipo || '').toLowerCase();
                    const turma = (lesson.turma_nome || '').toLowerCase();
                    const course = (lesson.curso_nome || '').toLowerCase();

                    const blacklistedTerms = [
                        'experimental', 'avaliaçao', 'avaliação', 'demonstrativa', 'cortesia',
                        'bonificaçao', 'bonificação', 'teste', 'diagnostica', 'diagnóstica'
                    ];

                    const isExperimental = blacklistedTerms.some(term =>
                        category.includes(term) || type.includes(term) || turma.includes(term) || course.includes(term)
                    ) || category.includes('reposiçao') || category.includes('reposição');

                    if (lesson.cancelada || isExperimental) return;

                    const teacherName = lesson.professores?.[0]?.nome;
                    if (!teacherName || teacherName === 'Não Atribuído') return;

                    const courseName = (lesson.curso_nome || '').trim();
                    const turmaName = (lesson.turma_nome || '').trim();
                    const lesson_count = lesson.nr_da_aula || 0;
                    const contract_total = lesson.qtd_aulas_contrato || 0;

                    lesson.alunos?.forEach((aluno: any) => {
                        const studentName = aluno.nome_aluno;
                        let instrumentName = (aluno.instrumento || '').trim();

                        if (!instrumentName || instrumentName.toLowerCase() === 'musica' || instrumentName.toLowerCase() === 'música') {
                            instrumentName = courseName || turmaName || 'Geral';
                        }

                        if (!studentName) return;

                        const compositeKey = `${studentName.toLowerCase().trim()}|${instrumentName.toLowerCase().trim()}`;

                        allStudentsMap.set(compositeKey, {
                            nome: studentName,
                            professor: teacherName,
                            instrumento: instrumentName,
                            lesson_count,
                            contract_total
                        });
                    });
                });

                nextCursor = data.paginacao?.proximo_cursor || null;
                hasMore = !!(data.paginacao?.tem_mais && nextCursor);
                if (allStudentsMap.size > 2000) break;
            }

            const result = Array.from(allStudentsMap.values());
            console.log(`✅ Sincronização concluída! ${result.length} alunos encontrados.`);
            return result;

        } catch (error) {
            console.error("Erro ao sincronizar via padrão Confirmaula:", error);
            throw error;
        }
    }
};
