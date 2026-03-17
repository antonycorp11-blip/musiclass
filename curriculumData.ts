
import { CurriculumTopic, InstrumentGroup } from './types';

export const MASTER_CURRICULUM: Record<InstrumentGroup, CurriculumTopic[]> = {
    harmono_melodico: [
        {
            id: 'm1-hm',
            group_name: 'harmono_melodico',
            month_index: 1,
            title: 'Mês 01 - Fundamentos e Percepção',
            content_text: 'O que é melodia? É a linha cantada. O que é harmonia? São os acordes. O que é ritmo? É o tempo do som.',
            quiz_json: [
                { question: 'O que é melodia?', options: ['Ritmo', 'Linha cantada', 'Volume', 'Tempo'], correctIndex: 1 },
                { question: 'O que é harmonia?', options: ['Ritmo', 'Acordes', 'Melodia', 'Volume'], correctIndex: 1 },
                { question: 'Quem geralmente toca a harmonia?', options: ['Bateria', 'Violão', 'Flauta', 'Voz'], correctIndex: 1 },
                { question: 'Quantas notas existem antes de repetir?', options: ['7', '10', '12', '14'], correctIndex: 2 }
            ]
        }
    ],
    percussao: [
        {
            id: 'm1-perc',
            group_name: 'percussao',
            month_index: 1,
            title: 'Mês 01 - Ritmo e Coordenação',
            content_text: 'Introdução aos rudimentos e tempo binário.',
            quiz_json: [
                { question: 'O que é bumbo?', options: ['Prato', 'Tambor grave', 'Baqueta', 'Voz'], correctIndex: 1 }
            ]
        }
    ],
    vocal: [
        {
            id: 'm1-voc',
            group_name: 'vocal',
            month_index: 1,
            title: 'Mês 01 - Respiração e Postura',
            content_text: 'Apoio diafragmático e relaxamento laríngeo.',
            quiz_json: [
                { question: 'Onde fica o diafragma?', options: ['Cabeça', 'Abdômen', 'Pé', 'Mão'], correctIndex: 1 }
            ]
        }
    ]
};
