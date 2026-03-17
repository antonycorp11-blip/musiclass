
import React from 'react';
import { X } from 'lucide-react';
import { CurriculumView } from '../views/CurriculumView';
import { Teacher, Student, CurriculumTopic } from '../../types';
import { useToast } from '../../context/ToastContext';
import { applyTopicToStudent } from '../../services/curriculumService';

interface CurriculumLibraryModalProps {
    currentUser: Teacher;
    selectedStudent: Student;
    students: Student[];
    currentObjective: string;
    setCurrentObjective: (objective: string) => void;
    onClose: () => void;
}

export const CurriculumLibraryModal: React.FC<CurriculumLibraryModalProps> = ({
    currentUser, selectedStudent, students, currentObjective, setCurrentObjective, onClose
}) => {
    const { showToast } = useToast();

    const handleSelectTopic = async (topic: CurriculumTopic) => {
        try {
            await applyTopicToStudent(selectedStudent.id, topic.id, currentUser.id);
            setCurrentObjective(topic.title + "\n\n" + (topic.content_text || '') + "\n\n" + currentObjective);
            showToast(`Matéria "${topic.title}" aplicada! Texto inserido e link do quiz gerado.`, "success");
            onClose();
        } catch (e) {
            console.error(e);
            showToast("Erro ao aplicar matéria.", "error");
        }
    };

    return (
        <div className="fixed inset-0 z-[600]">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <div className="absolute inset-x-4 top-10 bottom-10 md:inset-20 bg-white rounded-[48px] overflow-y-auto shadow-2xl p-8">
                <div className="flex justify-between items-center mb-10">
                    <h3 className="text-3xl font-black text-[#3C2415] tracking-tighter uppercase">Biblioteca de Matérias</h3>
                    <button onClick={onClose} className="p-4 bg-stone-100 rounded-2xl">
                        <X className="w-6 h-6" />
                    </button>
                </div>
                <CurriculumView
                    currentUser={currentUser}
                    students={students}
                    onSelectTopic={handleSelectTopic}
                />
            </div>
        </div>
    );
};
