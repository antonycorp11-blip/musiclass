
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
  Trophy
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

// Views
import { StudentsView } from './components/views/StudentsView';
import { LessonEditorView } from './components/views/LessonEditorView';
import { HistoryView } from './components/views/HistoryView';
import { AdminDashboardView } from './components/views/AdminDashboardView';
import { LessonTemplatesView } from './components/views/LessonTemplatesView';
import { CurriculumView } from './components/views/CurriculumView';
import { QuizPlayer } from './components/QuizPlayer';
import { fetchCurriculumTopics, applyTopicToStudent } from './services/curriculumService';
import { RankingView } from './components/views/RankingView';
import { CurriculumTopic, StudentTopicProgress } from './types';
import { StudentCenterView } from './components/views/StudentCenterView';

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

    const [activeTab, setActiveTab] = useState<'students' | 'lesson' | 'dashboard' | 'history' | 'toolbox' | 'curriculum' | 'student-center' | 'ranking'>('students');
    const [isAddingStudent, setIsAddingStudent] = useState(false);
    const [isAddingTeacher, setIsAddingTeacher] = useState(false);

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
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [quizToken, setQuizToken] = useState<string | null>(null);
  const [currentLessonId, setCurrentLessonId] = useState<string | null>(null);
  const [schoolConfig, setSchoolConfig] = useState<any>({
    headerPaddingH: 48,
    headerPaddingV: 32,
    logoHeight: 48,
    studentFontSize: 24,
    teacherFontSize: 14,
    logoOffset: 0,
    studentOffset: 0,
    teacherOffset: 0,
    spacing: 24,
    dividerColor: '#E87A2C66',
    showMusiClass: true
  });

  const fetchSchoolConfig = async () => {
    try {
      const { data, error } = await supabase.from('mc_school_config').select('config').limit(1).single();
      if (error && error.code !== 'PGRST116') throw error;
      if (data?.config) setSchoolConfig(data.config);
    } catch (e) {
      console.warn("Using default school config", e);
    }
  };

  const updateSchoolConfig = async (newConfig: any) => {
    setSchoolConfig(newConfig);
    try {
      const { data: existing } = await supabase.from('mc_school_config').select('id').limit(1).single();
      if (existing) {
        await supabase.from('mc_school_config').update({ config: newConfig }).eq('id', existing.id);
      } else {
        await supabase.from('mc_school_config').insert({ config: newConfig });
      }
    } catch (e) {
      console.error("Error saving school config:", e);
    }
  };

  useEffect(() => {
    if (currentUser) fetchSchoolConfig();
  }, [currentUser]);

  useEffect(() => {
    if (currentUser && currentUser.role === 'teacher') {
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
      }

      const channel = supabase
        .channel('schema-db-changes')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'mc_lesson_history',
            filter: `teacher_id=eq.${currentUser.id}`
          },
          (payload) => {
            const oldRead = payload.old.read_count || 0;
            const newRead = payload.new.read_count || 0;

            if (newRead > oldRead || (payload.new.is_read && !payload.old.is_read)) {
              // Sound notification if possible
              const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
              audio.play().catch(() => { });

              // Browser notification
              if (Notification.permission === 'granted') {
                const s = students.find(std => std.id === payload.new.student_id);
                const sName = s ? s.name : 'Um aluno';
                new Notification('Confirmação MusiClass!', {
                  body: `${sName} confirmou o treino agora!`,
                  icon: '/favicon.ico',
                  requireInteraction: true
                });
              }
              fetchInitialData();
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [currentUser]);

  const [confirmationScreen, setConfirmationScreen] = useState<{ student: string, inst: string, session: string } | null>(null);

  useEffect(() => {
    const handleConfirmation = async () => {
      const params = new URLSearchParams(window.location.search);
      const token = params.get('quiz');
      if (token) setQuizToken(token);

      const confirmReadId = params.get('confirm_read');
      if (!confirmReadId) return;

      console.log('Detectada solicitação de confirmação:', confirmReadId);

      const session = params.get('session') || '1';
      const sName = params.get('s_name') || 'Estudante';
      const inst = params.get('inst') || 'Instrumento';

      try {
        const { data, error: fetchError } = await supabase.from('mc_lesson_history')
          .select('read_count, interaction_log')
          .eq('id', confirmReadId)
          .single();

        if (fetchError) throw fetchError;

        const newCount = (data?.read_count || 0) + 1;
        const oldLog = Array.isArray(data?.interaction_log) ? data.interaction_log : [];
        const newLog = [...oldLog, {
          session,
          at: new Date().toISOString(),
          student: sName,
          instrument: inst
        }];

        const { error: updateError } = await supabase.from('mc_lesson_history')
          .update({
            is_read: true,
            read_at: new Date().toISOString(),
            read_count: newCount,
            interaction_log: newLog
          })
          .eq('id', confirmReadId);

        if (updateError) throw updateError;

        console.log('Confirmação salva com sucesso!');
        setConfirmationScreen({ student: sName, inst, session });
        window.history.replaceState({}, document.title, "/");
      } catch (err) {
        console.error("Erro no fluxo de confirmação:", err);
        showToast("Erro ao confirmar leitura. Por favor, avise seu professor.", "error");
      }
    };

    handleConfirmation();
  }, []);

  // Dados Globais de Currículo para Alertas
  const [allTopics, setAllTopics] = useState<CurriculumTopic[]>([]);
  const [allProgress, setAllProgress] = useState<StudentTopicProgress[]>([]);

  const fetchGlobalCurriculum = async () => {
    try {
      const groups = ['harmono_melodico', 'percussao', 'vocal'] as const;
      const topicsPromises = groups.map(g => fetchCurriculumTopics(g));
      const results = await Promise.all(topicsPromises);
      const flatTopics = results.flat();
      setAllTopics(flatTopics);

      try {
        const { data: progressData } = await supabase.from('mc_student_topics').select('*');
        if (progressData) {
          setAllProgress(progressData.map(p => ({
            ...p,
            topic: flatTopics.find(t => t.id === p.topic_id)
          })));
        }
      } catch (e) {
        console.warn("Tabela mc_student_topics ausente.");
      }
    } catch (e) { console.error("Erro ao buscar currículo global:", e); }
  };

  useEffect(() => {
    if (currentUser) fetchGlobalCurriculum();
  }, [currentUser]);

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

    useEffect(() => {
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
            const isInstalled = window.matchMedia('(display-mode: standalone)').matches;
            if (!isInstalled) setShowInstallPrompt(true);
        });
    }, []);

    const handleInstallApp = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') console.log('User accepted');
        setDeferredPrompt(null);
        setShowInstallPrompt(false);
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

  if (!currentUser) return <Login teachers={teachers} onLogin={handleLogin} />;

  if (quizToken) {
    return (
      <QuizPlayer
        token={quizToken}
        onClose={() => setQuizToken(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#FBF6F0] flex flex-col md:flex-row font-sans text-[#1A110D] overflow-x-hidden">
      {/* Sidebar */}
      <nav className="w-full md:w-20 lg:w-72 bg-[#1A110D] text-white p-2 md:p-4 lg:p-8 flex md:flex-col items-center lg:items-stretch fixed bottom-0 md:top-0 h-16 md:h-screen z-50 shadow-[0_-10px_30px_rgba(0,0,0,0.3)] md:shadow-2xl">
        <div className="hidden md:block absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full -mr-16 -mt-16" />
        <div className="hidden md:block mb-12 z-10"><Logo light size="sm" /></div>
        <div className="flex md:flex-col gap-1 md:gap-2 flex-grow justify-around md:justify-start w-full z-10">
          <button onClick={() => setActiveTab('students')} className={`flex flex-col md:flex-row items-center gap-1 md:gap-4 px-3 md:px-5 py-2 md:py-4 rounded-xl md:rounded-2xl transition-all ${activeTab === 'students' ? 'bg-[#E87A2C] shadow-lg shadow-orange-500/20 scale-105' : 'text-stone-500 hover:text-white'}`}>
            <Users className="w-5 h-5" /><span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest md:hidden lg:block">Alunos</span>
          </button>
          <button onClick={() => setActiveTab('lesson')} className={`flex flex-col md:flex-row items-center gap-1 md:gap-4 px-3 md:px-5 py-2 md:py-4 rounded-xl md:rounded-2xl transition-all ${activeTab === 'lesson' ? 'bg-[#E87A2C] shadow-lg shadow-orange-500/20 scale-105' : 'text-stone-500 hover:text-white'}`}>
            <BookOpen className="w-5 h-5" /><span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest md:hidden lg:block">Aulas</span>
          </button>
          <button onClick={() => setActiveTab('history')} className={`flex flex-col md:flex-row items-center gap-1 md:gap-4 px-3 md:px-5 py-2 md:py-4 rounded-xl md:rounded-2xl transition-all ${activeTab === 'history' ? 'bg-[#E87A2C] shadow-lg shadow-orange-500/20 scale-105' : 'text-stone-500 hover:text-white'}`}>
            <Clock className="w-5 h-5" /><span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest md:hidden lg:block">Histórico</span>
          </button>
          <button onClick={() => setActiveTab('toolbox')} className={`flex flex-col md:flex-row items-center gap-1 md:gap-4 px-3 md:px-5 py-2 md:py-4 rounded-xl md:rounded-2xl transition-all ${activeTab === 'toolbox' ? 'bg-[#E87A2C] shadow-lg shadow-orange-500/20 scale-105' : 'text-stone-500 hover:text-white'}`}>
            <Wrench className="w-5 h-5" /><span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest md:hidden lg:block">Ferramentas</span>
          </button>
          <button onClick={() => setIsGalleryOpen(true)} className={`flex flex-col md:flex-row items-center gap-1 md:gap-4 px-3 md:px-5 py-2 md:py-4 rounded-xl md:rounded-2xl transition-all text-stone-500 hover:text-white hover:bg-white/5`}>
            <Layout className="w-5 h-5" /><span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest md:hidden lg:block">Galeria</span>
          </button>
          <button onClick={() => setActiveTab('curriculum')} className={`flex flex-col md:flex-row items-center gap-1 md:gap-4 px-3 md:px-5 py-2 md:py-4 rounded-xl md:rounded-2xl transition-all ${activeTab === 'curriculum' ? 'bg-[#E87A2C] shadow-lg shadow-orange-500/20 scale-105' : 'text-stone-500 hover:text-white'}`}>
            <ScrollText className="w-5 h-5" /><span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest md:hidden lg:block">Grade Master</span>
          </button>
          {currentUser.role === 'director' && (
            <>
              <button onClick={() => setActiveTab('dashboard')} className={`flex flex-col md:flex-row items-center gap-1 md:gap-4 px-3 md:px-5 py-2 md:py-4 rounded-xl md:rounded-2xl transition-all ${activeTab === 'dashboard' ? 'bg-[#E87A2C] shadow-lg shadow-orange-500/20 scale-105' : 'text-stone-500 hover:text-white'}`}>
                <LayoutDashboard className="w-5 h-5" /><span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest md:hidden lg:block">Painel</span>
              </button>
            </>
          )}
          <button onClick={() => setActiveTab('ranking')} className={`flex flex-col md:flex-row items-center gap-1 md:gap-4 px-3 md:px-5 py-2 md:py-4 rounded-xl md:rounded-2xl transition-all ${activeTab === 'ranking' ? 'bg-yellow-500 shadow-lg shadow-yellow-500/20 scale-105' : 'text-stone-500 hover:text-white'}`}>
            <Trophy className="w-5 h-5" /><span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest md:hidden lg:block">Ranking</span>
          </button>
          <button onClick={handleLogout} className="md:hidden flex flex-col items-center gap-1 px-3 py-2 text-stone-500"><LogOut className="w-5 h-5" /><span className="text-[8px] font-black uppercase tracking-widest">Sair</span></button>
        </div>
        <div className="hidden md:block mt-auto pt-6 border-t border-white/5 w-full z-10">
          <button onClick={handleLogout} className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-stone-500 hover:text-white transition-all group">
            <LogOut className="w-5 h-5 group-hover:text-rose-500 transition-colors" /><span className="lg:block md:hidden text-[10px] font-black uppercase tracking-widest">Sair do Sistema</span>
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow md:ml-20 lg:ml-72 p-4 md:p-12 pb-24 md:pb-0 overflow-y-auto min-h-screen">
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
            onStartLesson={() => setActiveTab('lesson')}
            onViewHistory={(h) => {
              setCurrentChords(h.report_data.chords || []);
              setCurrentScales(h.report_data.scales || []);
              setCurrentSolos(h.report_data.solos || []);
              setCurrentTabs(h.report_data.tabs || []);
              setExercises(h.report_data.exercises || []);
              setCurrentObjective(h.objective || '');
              setRecordings(h.report_data.recordings || []);
              setDrumsData(h.report_data.drums || { rhythms: [], rudiments: [], positions: undefined });
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
              setCurrentChords(h.report_data.chords || []);
              setCurrentScales(h.report_data.scales || []);
              setCurrentSolos(h.report_data.solos || []);
              setCurrentTabs(h.report_data.tabs || []);
              setExercises(h.report_data.exercises || []);
              setCurrentObjective(h.objective || '');
              setRecordings(h.report_data.recordings || []);
              setDrumsData(h.report_data.drums || { rhythms: [], rudiments: [], positions: undefined });
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
      </main>

      {/* Modals & Overlays */}
      {confirmationScreen && (
        <ConfirmationOverlay
          student={confirmationScreen.student}
          inst={confirmationScreen.inst}
          session={confirmationScreen.session}
          onClose={() => {
            setConfirmationScreen(null);
            fetchInitialData();
          }}
        />
      )}

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

export default App;
