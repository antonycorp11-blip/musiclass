
import React, { useState, useEffect } from 'react';
import {
  Users,
  BookOpen,
  LogOut,
  Clock,
  Wrench,
  LayoutDashboard,
  Layout,
  ScrollText,
  X,
  AlertCircle,
  Trophy,
  Menu,
  ChevronRight,
  Settings,
  Bell,
  Search,
  Sparkles
} from 'lucide-react';

import { Instrument, Level, Student, Teacher, LessonTemplate } from './types';
import { supabase } from './lib/supabase';
import { StudentPreview } from './components/StudentPreview';
import { Toolbox } from './components/Toolbox';
import { Login } from './components/Login';
import { Logo } from './components/Logo';
import { ManualChordEditor } from './components/ManualChordEditor';

// Custom Hooks
import { useStudents } from './hooks/useStudents';
import { useAuth } from './context/AuthContext';
import { useLessonContext } from './context/LessonContext';
import { useToast } from './context/ToastContext';
import { useSchoolConfig } from './hooks/useSchoolConfig';
import { useTeacherNotifications } from './hooks/useTeacherNotifications';
import { useConfirmationLink } from './hooks/useConfirmationLink';
import { useGlobalCurriculum } from './hooks/useGlobalCurriculum';
import { useAppInstall } from './hooks/useAppInstall';

// Views
import { StudentsView } from './components/views/StudentsView';
import { LessonEditorView } from './components/views/LessonEditorView';
import { HistoryView } from './components/views/HistoryView';
import { AdminDashboardView } from './components/views/AdminDashboardView';
import { LessonTemplatesView } from './components/views/LessonTemplatesView';
import { CurriculumView } from './components/views/CurriculumView';
import { QuizPlayer } from './components/QuizPlayer';

import { RankingView } from './components/views/RankingView';
import { StudentRankingView } from './components/views/StudentRankingView';
import { CurriculumTopic, StudentTopicProgress } from './types';
import { StudentCenterView } from './components/views/StudentCenterView';
import { StudentPortalView } from './components/views/StudentPortalView';

// Modals
import { AddStudentModal } from './components/modals/AddStudentModal';
import { AddTeacherModal } from './components/modals/AddTeacherModal';
import { SyncResultsModal } from './components/modals/SyncResultsModal';
import { InstallPrompt } from './components/modals/InstallPrompt';
import { ConfirmationOverlay } from './components/modals/ConfirmationOverlay';
import { CurriculumLibraryModal } from './components/modals/CurriculumLibraryModal';

const App: React.FC = () => {
    const { currentUser, logout, login: handleLogin } = useAuth();
    const { showToast } = useToast();
    const {
        selectedStudent, setSelectedStudent,
        currentChords, setCurrentChords, currentScales, setCurrentScales, currentTabs, setCurrentTabs, currentSolos, setCurrentSolos,
        exercises, setExercises, currentObjective, setCurrentObjective, drumsData, setDrumsData, recordings, setRecordings,
        isRecording, newExercise, setNewExercise,
        resetLesson, addChord, saveManualChord,
        addScale, addTab, addSolo, updateTab, updateSolo, removeTab,
        addExercise, removeExercise,
        startRecording, stopRecording, handleDrumRecord,
        exportSuccess
    } = useLessonContext();

    const [activeTab, setActiveTab] = useState<'students' | 'lesson' | 'dashboard' | 'history' | 'toolbox' | 'curriculum' | 'student-center' | 'ranking' | 'student-ranking'>('students');
    const [isAddingStudent, setIsAddingStudent] = useState(false);
    const [portalStudentId, setPortalStudentId] = useState<string | null>(null);

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const portalId = urlParams.get('portal_id');
        if (portalId) setPortalStudentId(portalId);
    }, []);

    const [isAddingTeacher, setIsAddingTeacher] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Custom Hooks
    const {
        students, teachers, lessonHistory, loading,
        fetchInitialData, addStudent: doAddStudent, deleteLesson,
        resetData, resetQuizzes, addTeacher, deleteTeacher,
        emusysSync, fileUpload
    } = useStudents(currentUser);

    // Selection UI State
  const [showAdvancedChord, setShowAdvancedChord] = useState(false);
  const [selRoot, setSelRoot] = useState('C');
  const [selType, setSelType] = useState('maj');
  const [selExt, setSelExt] = useState('none');
  const [selScaleRoot, setSelScaleRoot] = useState('C');
  const [selScaleId, setSelScaleId] = useState('major');
  const [selBass, setSelBass] = useState('none');
  const [isManualChordOpen, setIsManualChordOpen] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [currentLessonId, setCurrentLessonId] = useState<string | null>(null);
  
  const { schoolConfig, updateSchoolConfig } = useSchoolConfig(currentUser);
  const { showInstallPrompt, setShowInstallPrompt, handleInstallApp } = useAppInstall();
  const { confirmationScreen, setConfirmationScreen, quizToken, setQuizToken } = useConfirmationLink(showToast);
  const { allTopics, allProgress } = useGlobalCurriculum(currentUser);
  
  useTeacherNotifications(currentUser, students, fetchInitialData);

  // Galeria e Biblioteca State
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [isCurriculumLibraryOpen, setIsCurriculumLibraryOpen] = useState(false);
  const [templates, setTemplates] = useState<LessonTemplate[]>([]);

  const fetchTemplates = async () => {
    const { data, error } = await supabase
      .from('mc_lesson_templates')
      .select('*, mc_teachers(name)')
      .order('created_at', { ascending: false });

    if (error) console.error('Erro ao buscar templates:', error);
    else setTemplates(data || []);
  };

  useEffect(() => {
    if (currentUser) fetchTemplates();
  }, [currentUser]);

  const handleSaveTemplate = async () => {
    if (!currentUser) return;
    const title = window.prompt("Dê um título para este modelo de aula:");
    if (!title) return;

    const { error } = await supabase.from('mc_lesson_templates').insert({
      teacher_id: currentUser.id,
      title,
      instrument: selectedStudent?.instrument || 'Geral',
      objective: currentObjective,
      report_data: {
        chords: currentChords,
        scales: currentScales,
        tabs: currentTabs,
        solos: currentSolos,
        exercises: exercises,
        drums: drumsData
      },
      is_public: false
    });

    if (error) showToast("Erro ao salvar modelo: " + error.message, "error");
    else {
      showToast("Aula salva na sua galeria!", "success");
      fetchTemplates();
    }
  };

  const handleApplyTemplate = (template: LessonTemplate, student: Student) => {
    setCurrentChords(template.report_data.chords || []);
    setCurrentScales(template.report_data.scales || []);
    setCurrentTabs(template.report_data.tabs || []);
    setCurrentSolos(template.report_data.solos || []);
    setExercises(template.report_data.exercises || []);
    setCurrentObjective(template.objective || '');
    if (template.report_data.drums) setDrumsData(template.report_data.drums);

    setSelectedStudent(student);
    setActiveTab('lesson');
    setIsGalleryOpen(false);
    showToast(`Modelo "${template.title}" aplicado a ${student.name}!`, "success");
  };

  const handleSaveTemplateFromHistory = async (h: any) => {
    if (!currentUser) return;
    const title = window.prompt("Dê um título para este novo modelo de aula:", `Modelo: ${h.mc_students?.instrument || 'Aula'}`);
    if (!title) return;

    const { error } = await supabase.from('mc_lesson_templates').insert({
      teacher_id: currentUser.id,
      title,
      instrument: h.mc_students?.instrument || 'Geral',
      objective: h.objective,
      report_data: h.report_data,
      is_public: false
    });

    if (error) showToast("Erro ao salvar modelo: " + error.message, "error");
    else {
      showToast("Aula do histórico salva na sua galeria!", "success");
      fetchTemplates();
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (window.confirm("Deseja excluir este modelo permanentemente?")) {
      const { error } = await supabase.from('mc_lesson_templates').delete().eq('id', id);
      if (error) showToast(error.message, "error");
      else fetchTemplates();
    }
  };

  const handleTogglePublic = async (id: string, isPublic: boolean) => {
    const { error } = await supabase.from('mc_lesson_templates').update({ is_public: isPublic }).eq('id', id);
    if (error) showToast(error.message, "error");
    else {
        showToast(isPublic ? "Template agora é público." : "Template agora é privado.", "info");
        fetchTemplates();
    }
  };

  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;

    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${currentUser.id}/${fileName}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from('lesson-audios')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('lesson-audios')
        .getPublicUrl(filePath);

      setRecordings([...recordings, {
        id: fileName,
        title: `Upload: ${file.name}`,
        url: publicUrl
      }]);

      showToast("Áudio enviado com sucesso!", "success");
    } catch (e: any) {
      showToast("Erro no upload: " + e.message, "error");
    }
  };



    const handleLogout = () => {
        logout();
        setSelectedStudent(null);
    };

    const handleResetData = async () => {
        if (window.confirm("ATENÇÃO: Isso apagará TODOS os alunos do sistema permanentemente. Deseja continuar?")) {
            await resetData();
            setSelectedStudent(null);
            showToast("Banco de dados resetado!", "info");
        }
    };

    const handleAddTeacher = async (name: string, pass: string) => {
        try {
            await addTeacher(name, pass);
            showToast(`${name} cadastrado com sucesso!`, "success");
            setIsAddingTeacher(false);
            return true;
        } catch (e: any) {
            showToast(e.message || "Erro ao salvar professor", "error");
            return false;
        }
    };

    const handleDeleteTeacher = async (id: string) => {
        if (window.confirm("Deseja realmente remover este professor?")) {
            try {
                await deleteTeacher(id);
                showToast("Professor removido.", "info");
            } catch (e: any) {
                showToast(e.message, "error");
            }
        }
    };

    const addStudent = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        try {
            await doAddStudent(new FormData(e.currentTarget));
            setIsAddingStudent(false);
            showToast("Aluno cadastrado!", "success");
        } catch (e: any) {
            showToast(e.message, "error");
        }
    };

  const handleDeleteLesson = async (lessonId: string) => {
    if (window.confirm("Deseja realmente excluir esta aula?")) {
      await deleteLesson(lessonId);
    }
  };

  const [syncResults, setSyncResults] = useState<{ added: number, updated: number, removed: number, logs: string[], missingTeachers: string[] } | null>(null);

    const handleEmusysSync = async () => {
        try {
            const stats = await emusysSync();
            if (stats) {
                setSyncResults(stats);
                showToast("Sincronização concluída!", "success");
            }
        } catch (e: any) {
            showToast(e.message, "error");
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const stats: any = await fileUpload(file);
            if (stats.added > 0) {
                let msg = `${stats.added} alunos importados!`;
                if (stats.missingTeachers.length > 0) msg += `\n\nDocentes não reconhecidos: ${stats.missingTeachers.join(', ')}`;
                showToast(msg, "info");
            } else {
                showToast("Nenhum novo aluno na planilha.", "info");
            }
        } catch (e) {
            showToast("Erro ao ler Excel.", "error");
        }
    };

  const handleSelectStudent = (student: Student) => {
    if (selectedStudent?.id !== student.id) {
      resetLesson();
      setCurrentLessonId(null);
    }
    setSelectedStudent(student);
    setActiveTab('student-center');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGenerateReport = () => {
    if (!selectedStudent || !currentUser) return;
    setIsPreviewing(true);
  };

  const handleExportSuccess = async (): Promise<{ recordings: any[], lessonId?: string }> => {
    const result = await exportSuccess();
    if (result.lessonId) setCurrentLessonId(result.lessonId);
    await fetchInitialData();
    return result;
  };

  const teacherStudents = students.filter(s => s.teacher_id === currentUser?.id || currentUser?.role === 'director');

  if (portalStudentId) {
    return <StudentPortalView studentId={portalStudentId} allStudents={students} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1A110D] flex items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <Logo light size="md" />
          <div className="w-12 h-12 border-4 border-[#E87A2C] border-t-transparent rounded-full animate-spin" />
          <p className="text-white/40 font-black uppercase text-[10px] tracking-[0.5em]">Sincronizando Studio...</p>
        </div>
      </div>
    );
  }

  if (quizToken) {
    return (
      <QuizPlayer
        token={quizToken}
        onClose={() => setQuizToken(null)}
      />
    );
  }

  if (confirmationScreen) {
    return (
      <ConfirmationOverlay
        student={confirmationScreen.student}
        inst={confirmationScreen.inst}
        session={confirmationScreen.session}
        onClose={() => {
          setConfirmationScreen(null);
          if (currentUser) fetchInitialData();
        }}
      />
    );
  }

  if (!currentUser) return <Login teachers={teachers} onLogin={handleLogin} />;

  return (
    <div className="fixed inset-0 bg-[#1A110D] flex flex-col md:flex-row font-sans text-[#1A110D] overflow-hidden">
      
      {/* Top Mobile Bar (Fixed at top) */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-20 bg-[#1A110D] text-white z-[100] border-b border-white/5 safe-top w-full px-6 flex items-center justify-between">
        <div className="flex items-center">
          <Logo light size="sm" />
        </div>
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>
      </header>

      {/* Modern Sidebar (Overlay on Mobile, Fixed on Desktop) */}
      <nav className={`
        fixed inset-y-0 left-0 w-[280px] bg-[#1A110D] text-white z-[500] 
        transform transition-all duration-500 ease-in-out
        md:relative md:translate-x-0 md:w-20 lg:w-72
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        flex flex-col p-6 md:p-4 lg:p-8
      `}>
        {/* Close Button Mobile */}
        <button 
          onClick={() => setIsSidebarOpen(false)}
          className="md:hidden absolute top-6 right-6 p-2 bg-white/5 rounded-xl hover:bg-rose-500 transition-all"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="hidden md:block mb-12 z-10"><Logo light size="sm" /></div>
        <div className="md:hidden mb-12 flex flex-col gap-2">
          <Logo light size="sm" />
          <div className="h-0.5 w-12 bg-orange-500/20" />
        </div>

        <div className="flex flex-col gap-2 flex-grow w-full z-10 overflow-y-auto custom-scrollbar pr-2">
          <MenuButton 
            active={activeTab === 'students'} 
            onClick={() => { setActiveTab('students'); setIsSidebarOpen(false); }} 
            icon={<Users className="w-5 h-5" />} 
            label="Alunos" 
          />
          <MenuButton 
            active={activeTab === 'lesson'} 
            onClick={() => { setActiveTab('lesson'); setIsSidebarOpen(false); }} 
            icon={<BookOpen className="w-5 h-5" />} 
            label="Diário de Aula" 
          />
          <MenuButton 
            active={activeTab === 'history'} 
            onClick={() => { setActiveTab('history'); setIsSidebarOpen(false); }} 
            icon={<Clock className="w-5 h-5" />} 
            label="Histórico Geral" 
          />
          <MenuButton 
            active={activeTab === 'curriculum'} 
            onClick={() => { setActiveTab('curriculum'); setIsSidebarOpen(false); }} 
            icon={<ScrollText className="w-5 h-5" />} 
            label="Grade Master" 
          />
          <MenuButton 
            active={activeTab === 'toolbox'} 
            onClick={() => { setActiveTab('toolbox'); setIsSidebarOpen(false); }} 
            icon={<ScrollText className="w-5 h-5" />} 
            label="Grade Master" 
          />
          <MenuButton 
            active={activeTab === 'student-ranking'} 
            onClick={() => { setActiveTab('student-ranking'); setIsSidebarOpen(false); }} 
            icon={<Trophy className="w-5 h-5" />} 
            label="Ranking Alunos" 
          />
          <MenuButton 
            active={activeTab === 'ranking'} 
            onClick={() => { setActiveTab('ranking'); setIsSidebarOpen(false); }} 
            icon={<Sparkles className="w-5 h-5" />} 
            label="Hall da Fama" 
          />

          <div className="my-4 border-t border-white/5 shrink-0" />

          {currentUser.role === 'director' && (
            <MenuButton 
              active={activeTab === 'dashboard'} 
              onClick={() => { setActiveTab('dashboard'); setIsSidebarOpen(false); }} 
              icon={<LayoutDashboard className="w-5 h-5" />} 
              label="Painel Diretor" 
            />
          )}

          <button onClick={() => { setIsGalleryOpen(true); setIsSidebarOpen(false); }} className={`flex items-center gap-4 px-5 py-4 rounded-2xl transition-all text-stone-500 hover:text-white hover:bg-white/5`}>
            <Layout className="w-5 h-5" /><span className="text-[10px] font-black uppercase tracking-widest md:hidden lg:block">Galeria Modelos</span>
          </button>
        </div>

        <div className="mt-auto pt-6 border-t border-white/5 w-full z-10 shrink-0">
          <button onClick={handleLogout} className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-stone-300 hover:text-white transition-all group hover:bg-rose-500/10 hover:text-rose-400">
            <LogOut className="w-5 h-5" /><span className="text-[10px] font-black uppercase tracking-widest md:hidden lg:block">Sair do Sistema</span>
          </button>
        </div>
      </nav>

      {/* Click-away overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-[#1A110D]/80 backdrop-blur-md z-[400] md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Content Area (Scrollable independently) */}
      <main className="flex-grow flex flex-col h-full overflow-hidden relative bg-[#FBF6F0] rounded-t-[32px] md:rounded-none">
        <div className="flex-grow overflow-y-auto px-4 pt-24 pb-12 md:p-8 lg:p-12 custom-scrollbar">
        {activeTab === 'students' && (
          <StudentsView
            teacherStudents={teacherStudents}
            onSelectStudent={handleSelectStudent}
            onFileUpload={handleFileUpload}
            onEmusysSync={handleEmusysSync}
            onAddStudentClick={() => setIsAddingStudent(true)}
            allTopics={allTopics}
            allProgress={allProgress}
          />
        )}

        {activeTab === 'student-center' && selectedStudent && currentUser && (
          <StudentCenterView
            student={selectedStudent}
            teacher={currentUser}
            onStartLesson={() => {
                resetLesson();
                setCurrentLessonId(null);
                setActiveTab('lesson');
            }}
            onViewHistory={(h) => {
              setCurrentChords(h.report_data?.chords || []);
              setCurrentScales(h.report_data?.scales || []);
              setCurrentSolos(h.report_data?.solos || []);
              setCurrentTabs(h.report_data?.tabs || []);
              setExercises(h.report_data?.exercises || []);
              setCurrentObjective(h.objective || '');
              setRecordings(h.report_data?.recordings || []);
              setDrumsData(h.report_data?.drums || { rhythms: [], rudiments: [], positions: undefined });
              setCurrentLessonId(h.id);
              setActiveTab('lesson');
            }}
            onDeleteLesson={async (id) => {
                if (confirm("Deseja realmente excluir esta ficha?")) {
                    await deleteLesson(id);
                    showToast("Ficha excluída com sucesso.", "success");
                }
            }}
            allTopics={allTopics}
            allProgress={allProgress}
          />
        )}

        {activeTab === 'lesson' && currentUser && (
          <LessonEditorView
            selectedStudent={selectedStudent || { id: 'temp', name: 'Criador de Modelo', instrument: Instrument.GUITAR, level: Level.BEGINNER }} currentUser={currentUser}
            setActiveTab={setActiveTab} activeTab={activeTab}
            currentChords={currentChords} setCurrentChords={setCurrentChords}
            currentScales={currentScales} setCurrentScales={setCurrentScales}
            currentTabs={currentTabs} setCurrentTabs={setCurrentTabs}
            currentSolos={currentSolos} setCurrentSolos={setCurrentSolos}
            exercises={exercises} setExercises={setExercises}
            newExercise={newExercise} setNewExercise={setNewExercise}
            currentObjective={currentObjective} setCurrentObjective={setCurrentObjective}
            drumsData={drumsData} setDrumsData={setDrumsData}
            recordings={recordings} setRecordings={setRecordings}
            isRecording={isRecording}
            onAddChord={() => addChord(selRoot, selType, selExt, selBass)}
            onAddScale={() => addScale(selScaleRoot, selScaleId)}
            onAddTab={addTab}
            onAddSolo={addSolo}
            onUpdateTab={updateTab} onUpdateSolo={updateSolo} onRemoveTab={removeTab}
            onAddExercise={addExercise} onRemoveExercise={removeExercise}
            onStartRecording={startRecording} onStopRecording={stopRecording}
            onDrumRecord={handleDrumRecord} onGenerateReport={handleGenerateReport}
            setIsManualChordOpen={setIsManualChordOpen}
            showAdvancedChord={showAdvancedChord} setShowAdvancedChord={setShowAdvancedChord}
            selRoot={selRoot} setSelRoot={setSelRoot} selType={selType} setSelType={setSelType}
            selScaleRoot={selScaleRoot} setSelScaleRoot={setSelScaleRoot} selScaleId={selScaleId} setSelScaleId={setSelScaleId}
            selBass={selBass} setSelBass={setSelBass}
            onSaveTemplate={handleSaveTemplate}
            onToggleGallery={() => setIsGalleryOpen(true)}
            onToggleCurriculum={() => setIsCurriculumLibraryOpen(true)}
            onAudioUpload={handleAudioUpload}
            onSendToPortal={async () => {
                const result = await exportSuccess();
                if (result.lessonId) setCurrentLessonId(result.lessonId);
                await fetchInitialData();
            }}
            onLoadLastLesson={() => {
                const lastCourse = lessonHistory.find(h => h.student_id === selectedStudent?.id);
                if (lastCourse) {
                    setCurrentChords(lastCourse.report_data?.chords || []);
                    setCurrentScales(lastCourse.report_data?.scales || []);
                    setCurrentSolos(lastCourse.report_data?.solos || []);
                    setCurrentTabs(lastCourse.report_data?.tabs || []);
                    setExercises(lastCourse.report_data?.exercises || []);
                    setCurrentObjective(lastCourse.objective || '');
                    setRecordings(lastCourse.report_data?.recordings || []);
                    setDrumsData(lastCourse.report_data?.drums || { rhythms: [], rudiments: [], positions: undefined });
                    setCurrentLessonId(lastCourse.id);
                    // Não usa alert nativo para manter a estética, o UI pode reagir com toast se existir no app, ou só atualizar
                } else {
                    alert("Nenhuma sessão anterior encontrada para este aluno.");
                }
            }}
            onResetLesson={resetLesson}
          />
        )}

        {activeTab === 'history' && (
          <HistoryView
            lessonHistory={lessonHistory} currentUser={currentUser}
            selectedStudent={selectedStudent} students={students}
            onSetSelectedStudent={setSelectedStudent}
            onSaveTemplateFromHistory={handleSaveTemplateFromHistory}
            onOpenLesson={(h) => {
              setSelectedStudent(students.find(s => s.id === h.student_id) || null);
              setCurrentChords(h.report_data?.chords || []);
              setCurrentScales(h.report_data?.scales || []);
              setCurrentSolos(h.report_data?.solos || []);
              setCurrentTabs(h.report_data?.tabs || []);
              setExercises(h.report_data?.exercises || []);
              setCurrentObjective(h.objective || '');
              setRecordings(h.report_data?.recordings || []);
              setDrumsData(h.report_data?.drums || { rhythms: [], rudiments: [], positions: undefined });
              setActiveTab('lesson');
            }}
            onDeleteLesson={handleDeleteLesson}
          />
        )}

        {activeTab === 'dashboard' && currentUser.role === 'director' && (
          <AdminDashboardView
            teachers={teachers} students={students}
            onAddTeacher={() => setIsAddingTeacher(true)}
            onDeleteTeacher={handleDeleteTeacher} onResetData={handleResetData}
            schoolConfig={schoolConfig}
            onUpdateConfig={updateSchoolConfig}
            onResetQuizzes={resetQuizzes}
          />
        )}

        {activeTab === 'curriculum' && (
          <CurriculumView currentUser={currentUser} students={students} />
        )}

        {activeTab === 'student-ranking' && (
          <StudentRankingView students={students} />
        )}

        {activeTab === 'ranking' && (
          <RankingView
            teachers={teachers}
            students={students}
            lessonHistory={lessonHistory}
          />
        )}

        {isCurriculumLibraryOpen && selectedStudent && currentUser && (
          <CurriculumLibraryModal
            currentUser={currentUser}
            selectedStudent={selectedStudent}
            students={students}
            currentObjective={currentObjective}
            setCurrentObjective={setCurrentObjective}
            onClose={() => setIsCurriculumLibraryOpen(false)}
          />
        )}

        {activeTab === 'toolbox' && <Toolbox />}
        </div>
      </main>

      {/* Modals & Overlays */}


      {isPreviewing && selectedStudent && (
        <StudentPreview
          studentName={selectedStudent.name} teacherName={currentUser?.name || ''}
          instrument={selectedStudent.instrument} objective={currentObjective}
          chords={currentChords} scales={currentScales} exercises={exercises}
          tabs={currentTabs} solos={currentSolos} recordings={recordings}
          drums={drumsData} onClose={() => setIsPreviewing(false)} onExport={handleExportSuccess}
          lessonId={currentLessonId || undefined}
          lessonCount={selectedStudent?.lesson_count}
          contractTotal={selectedStudent?.contract_total}
          designSettings={schoolConfig}
        />
      )}

      {isGalleryOpen && (
        <LessonTemplatesView
          templates={templates}
          currentUser={currentUser}
          students={teacherStudents}
          onApplyTemplate={handleApplyTemplate}
          onDeleteTemplate={handleDeleteTemplate}
          onTogglePublic={handleTogglePublic}
          onClose={() => setIsGalleryOpen(false)}
        />
      )}

      {isManualChordOpen && (
        <ManualChordEditor
          instrument={selectedStudent?.instrument || Instrument.GUITAR}
          onClose={() => setIsManualChordOpen(false)}
          onSave={saveManualChord}
        />
      )}

      {isAddingStudent && (
        <AddStudentModal
          onClose={() => setIsAddingStudent(false)}
          onSubmit={addStudent}
        />
      )}

      {isAddingTeacher && (
        <AddTeacherModal
          onClose={() => setIsAddingTeacher(false)}
          onSubmit={handleAddTeacher}
        />
      )}

      {showInstallPrompt && (
        <InstallPrompt
          onInstall={handleInstallApp}
          onClose={() => setShowInstallPrompt(false)}
        />
      )}
      {syncResults && (
        <SyncResultsModal
          syncResults={syncResults}
          onClose={() => setSyncResults(null)}
        />
      )}
    </div>
  );
};

const MenuButton = ({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) => (
  <button 
    onClick={onClick} 
    className={`
      flex items-center gap-4 px-5 py-4 rounded-2xl transition-all w-full
      ${active ? 'bg-[#E87A2C] text-white shadow-xl shadow-orange-500/20' : 'text-stone-500 hover:text-white hover:bg-white/5'}
    `}
  >
    {icon}
    <span className="text-[10px] font-black uppercase tracking-widest md:hidden lg:block">{label}</span>
  </button>
);

export default App;
