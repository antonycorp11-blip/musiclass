
import { Instrument } from '../types';

// O proxy no vite.config.ts redireciona /emusys-api para https://api.emusys.com.br
const EMUSYS_API_BASE = '/emusys-api/v1';

export interface EmusysStudent {
    nome: string;
    professor: string;
    instrumento: string;
}

export const emusysService = {
    fetchActiveStudents: async (token: string): Promise<EmusysStudent[]> => {
        try {
            console.log("Iniciando busca sincronizada com padrão Confirmaula...");

            // Definindo período de 60 dias (30 passados, 30 futuros) para captar todos os alunos ativos
            const now = new Date();
            const start = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
            const end = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));

            const startDate = start.toISOString().split('T')[0] + ' 00:00:00';
            const endDate = end.toISOString().split('T')[0] + ' 23:59:59';

            let allStudentsMap = new Map<string, EmusysStudent>();
            let nextCursor: string | null = null;
            let hasMore = true;

            while (hasMore) {
                // O Emusys v1 usa o endpoint /aulas para obter dados de alunos vinculados
                let url = `${EMUSYS_API_BASE}/aulas?token=${token}&data_hora_inicial=${encodeURIComponent(startDate)}&data_hora_final=${encodeURIComponent(endDate)}`;
                if (nextCursor) url += `&cursor=${encodeURIComponent(nextCursor)}`;

                console.log(`Buscando aulas (cursor: ${nextCursor || 'inicio'})...`);
                const response = await fetch(url, {
                    headers: { 'Accept': 'application/json' }
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`Erro API Emusys (${response.status}): ${errorText}`);
                }

                const data = await response.json();
                const lessons = data.items || [];

                lessons.forEach((lesson: any) => {
                    const category = (lesson.categoria || '').toLowerCase();
                    const type = (lesson.tipo || '').toLowerCase();
                    const turma = (lesson.turma_nome || '').toLowerCase();
                    const course = (lesson.curso_nome || '').toLowerCase();

                    const blacklistedTerms = [
                        'experimental',
                        'avaliaçao',
                        'avaliação',
                        'demonstrativa',
                        'cortesia',
                        'bonificaçao',
                        'bonificação',
                        'teste'
                    ];

                    const isExperimental = blacklistedTerms.some(term =>
                        category.includes(term) ||
                        type.includes(term) ||
                        turma.includes(term) ||
                        course.includes(term)
                    ) || category.includes('reposiçao') || category.includes('reposição') ||
                        category.includes('diagnostica') || category.includes('diagnóstica');

                    if (lesson.cancelada || isExperimental) {
                        if (isExperimental) {
                            const filteredStudents = lesson.alunos?.map((aluno: any) => aluno.nome_aluno).filter(Boolean).join(', ');
                            console.log(`🚫 Filtrando aula experimental/reposição/diagnóstica: ${lesson.turma_nome} / ${lesson.categoria}. Alunos: ${filteredStudents || 'N/A'}`);
                        }
                        return;
                    }

                    const teacherName = lesson.professores?.[0]?.nome || 'Não Atribuído';
                    const courseName = lesson.curso_nome || 'Geral';

                    lesson.alunos?.forEach((aluno: any) => {
                        const studentName = aluno.nome_aluno;
                        if (!studentName) return;

                        // Se o aluno já foi marcado em uma aula experimental anteriormente nesta busca,
                        // poderíamos removê-lo, mas aqui estamos filtrando por AULA.
                        // Se o aluno tem 1 aula regular e 1 experimental, ele entra pela regular.

                        if (!allStudentsMap.has(studentName)) {
                            allStudentsMap.set(studentName, {
                                nome: studentName,
                                professor: teacherName,
                                instrumento: aluno.instrumento || courseName
                            });
                        }
                    });
                });

                nextCursor = data.paginacao?.proximo_cursor || null;
                hasMore = !!(data.paginacao?.tem_mais && nextCursor);

                // Limite de segurança para evitar loops infinitos
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
