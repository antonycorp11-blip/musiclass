
import React from 'react';
import { X } from 'lucide-react';
import { CurriculumView } from '../views/CurriculumView';
import { Teacher, Student, CurriculumTopic } from '../../types';
import { useToast } from '../../context/ToastContext';
import { applyTopicToStudent, getInstrumentGroup } from '../../services/curriculumService';

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
            showToast(`Matéria "${topic.title}" aplicada!`, "success");
            onClose();
        } catch (e) {
            console.error(e);
            showToast("Erro ao aplicar matéria.", "error");
        }
    };

    const studentGroup = getInstrumentGroup(selectedStudent.instrument);

    return (
        <div className="fixed inset-0 z-[600]">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <div className="absolute inset-x-0 bottom-0 top-10 md:inset-x-4 md:top-10 md:bottom-10 lg:inset-20 bg-white rounded-t-[48px] md:rounded-[48px] overflow-hidden shadow-2xl flex flex-col">
                <div className="flex justify-between items-center p-6 md:p-8 lg:p-10 border-b border-stone-100 bg-white shrink-0">
                    <div>
                        <h3 className="text-xl md:text-3xl font-black text-[#3C2415] tracking-tighter uppercase leading-tight">Biblioteca: {selectedStudent.instrument}</h3>
                        <p className="text-[9px] font-black text-[#E87A2C] uppercase tracking-widest mt-1">Exibindo apenas matérias para {studentGroup.replace('_', ' ')}</p>
                    </div>
                    <button onClick={onClose} className="p-3 md:p-4 bg-stone-100 rounded-xl md:rounded-2xl shrink-0">
                        <X className="w-5 h-5 md:w-6 md:h-6" />
                    </button>
                </div>
                <div className="flex-grow overflow-y-auto custom-scrollbar">
                    <CurriculumView
                        currentUser={currentUser}
                        students={students}
                        forceGroup={studentGroup}
                        onSelectTopic={handleSelectTopic}
                    />
                </div>
            </div>
        </div>
    );
};
