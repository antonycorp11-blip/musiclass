
import React, { useState, useEffect } from 'react';
import {
  Users,
  BookOpen,
  LogOut,
  Clock,
  Wrench,
  LayoutDashboard,
  Layout,
  X
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
import { useLesson } from './hooks/useLesson';

// Views
import { StudentsView } from './components/views/StudentsView';
import { LessonEditorView } from './components/views/LessonEditorView';
import { HistoryView } from './components/views/HistoryView';
import { AdminDashboardView } from './components/views/AdminDashboardView';
import { LessonTemplatesView } from './components/views/LessonTemplatesView';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<Teacher | null>(null);
  const [activeTab, setActiveTab] = useState<'students' | 'lesson' | 'dashboard' | 'history' | 'toolbox'>('students');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isAddingStudent, setIsAddingStudent] = useState(false);
  const [isAddingTeacher, setIsAddingTeacher] = useState(false);

  // Custom Hooks
  const {
    students, teachers, lessonHistory, loading,
    fetchInitialData, addStudent: doAddStudent, deleteLesson,
    resetData, addTeacher, deleteTeacher,
    emusysSync, fileUpload
  } = useStudents(currentUser);

  const {
    currentChords, setCurrentChords, currentScales, setCurrentScales, currentTabs, setCurrentTabs, currentSolos, setCurrentSolos,
    exercises, setExercises, currentObjective, setCurrentObjective, drumsData, setDrumsData, recordings, setRecordings,
    isRecording, newExercise, setNewExercise,
    resetLesson, addChord, saveManualChord,
    addScale, addTab, addSolo, updateTab, updateSolo, removeTab,
    addExercise, removeExercise,
    startRecording, stopRecording, handleDrumRecord,
    exportSuccess
  } = useLesson(selectedStudent, currentUser);

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

  // Galeria de Aulas State
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
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

    if (error) alert("Erro ao salvar modelo: " + error.message);
    else {
      alert("Aula salva na sua galeria!");
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
    alert(`Modelo "${template.title}" aplicado a ${student.name}!`);
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

    if (error) alert("Erro ao salvar modelo: " + error.message);
    else {
      alert("Aula do histórico salva na sua galeria!");
      fetchTemplates();
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (window.confirm("Deseja excluir este modelo permanentemente?")) {
      const { error } = await supabase.from('mc_lesson_templates').delete().eq('id', id);
      if (error) alert(error.message);
      else fetchTemplates();
    }
  };

  const handleTogglePublic = async (id: string, isPublic: boolean) => {
    const { error } = await supabase.from('mc_lesson_templates').update({ is_public: isPublic }).eq('id', id);
    if (error) alert(error.message);
    else fetchTemplates();
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

      alert("Áudio enviado com sucesso!");
    } catch (e: any) {
      alert("Erro no upload: " + e.message);
    }
  };

  useEffect(() => {
    const savedUser = localStorage.getItem('music_current_user');
    if (savedUser && savedUser !== 'undefined') {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch (e) {
        console.error("Failed to parse saved user", e);
        localStorage.removeItem('music_current_user');
      }
    }

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

  const handleLogin = (user: Teacher) => {
    setCurrentUser(user);
    localStorage.setItem('music_current_user', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('music_current_user');
    setSelectedStudent(null);
  };

  const handleResetData = async () => {
    if (window.confirm("ATENÇÃO: Isso apagará TODOS os alunos do sistema permanentemente. Deseja continuar?")) {
      await resetData();
      setSelectedStudent(null);
      alert("Banco de dados resetado!");
    }
  };

  const handleAddTeacher = async (name: string, pass: string) => {
    try {
      await addTeacher(name, pass);
      alert(`${name} cadastrado com sucesso!`);
      setIsAddingTeacher(false);
      return true;
    } catch (e: any) {
      alert(e.message || "Erro ao salvar professor");
      return false;
    }
  };

  const handleDeleteTeacher = async (id: string) => {
    if (window.confirm("Deseja realmente remover este professor?")) {
      try {
        await deleteTeacher(id);
      } catch (e: any) {
        alert(e.message);
      }
    }
  };

  const addStudent = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await doAddStudent(new FormData(e.currentTarget));
      setIsAddingStudent(false);
    } catch (e: any) {
      alert(e.message);
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
      }
    } catch (e: any) {
      alert(e.message);
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
        alert(msg);
      } else {
        alert("Nenhum novo aluno na planilha.");
      }
    } catch (e) {
      alert("Erro ao ler Excel.");
    }
  };

  const handleSelectStudent = (student: Student) => {
    if (selectedStudent?.id !== student.id) {
      resetLesson();
    }
    setSelectedStudent(student);
    setActiveTab('lesson');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGenerateReport = () => {
    if (!selectedStudent || !currentUser) return;
    setIsPreviewing(true);
  };

  const handleExportSuccess = async (): Promise<any[]> => {
    const recs = await exportSuccess();
    await fetchInitialData();
    return recs;
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
          {currentUser.role === 'director' && (
            <button onClick={() => setActiveTab('dashboard')} className={`flex flex-col md:flex-row items-center gap-1 md:gap-4 px-3 md:px-5 py-2 md:py-4 rounded-xl md:rounded-2xl transition-all ${activeTab === 'dashboard' ? 'bg-[#E87A2C] shadow-lg shadow-orange-500/20 scale-105' : 'text-stone-500 hover:text-white'}`}>
              <LayoutDashboard className="w-5 h-5" /><span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest md:hidden lg:block">Painel</span>
            </button>
          )}
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
          />
        )}

        {activeTab === 'toolbox' && <Toolbox />}
      </main>

      {/* Modals & Overlays */}
      {isPreviewing && selectedStudent && (
        <StudentPreview
          studentName={selectedStudent.name} teacherName={currentUser?.name || ''}
          instrument={selectedStudent.instrument} objective={currentObjective}
          chords={currentChords} scales={currentScales} exercises={exercises}
          tabs={currentTabs} solos={currentSolos} recordings={recordings}
          drums={drumsData} onClose={() => setIsPreviewing(false)} onExport={handleExportSuccess}
          lessonCount={selectedStudent?.lesson_count}
          contractTotal={selectedStudent?.contract_total}
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
        <div className="fixed inset-0 bg-[#3C2415]/40 backdrop-blur-xl flex items-center justify-center z-[100] p-6">
          <div className="bg-white rounded-[64px] p-12 w-full max-w-xl shadow-2xl animate-fade-in">
            <h3 className="text-4xl font-black text-[#3C2415] tracking-tighter uppercase mb-6">Novo Aluno</h3>
            <form onSubmit={addStudent} className="space-y-6">
              <input name="name" required className="w-full bg-[#FBF6F0] border-none rounded-[32px] px-8 py-5 font-bold text-[#3C2415]" placeholder="Nome Completo" />
              <div className="grid grid-cols-2 gap-6">
                <input name="age" type="number" className="w-full bg-[#FBF6F0] border-none rounded-[32px] px-8 py-5 font-bold text-[#3C2415]" placeholder="Idade" />
                <select name="level" className="w-full bg-[#FBF6F0] border-none rounded-[32px] px-8 py-5 font-bold text-[#3C2415]">{Object.values(Level).map(l => <option key={l} value={l}>{l}</option>)}</select>
              </div>
              <select name="instrument" className="w-full bg-[#FBF6F0] border-none rounded-[32px] px-8 py-5 font-bold text-[#3C2415]">{Object.values(Instrument).map(i => <option key={i} value={i}>{i}</option>)}</select>
              <button type="submit" className="w-full bg-[#1A110D] text-white py-6 rounded-[32px] font-black text-lg shadow-xl hover:bg-[#3C2415] transition-all">SALVAR ALUNO</button>
              <button type="button" onClick={() => setIsAddingStudent(false)} className="w-full text-[#3C2415]/30 font-bold uppercase text-[10px] tracking-widest mt-4">Dispensar</button>
            </form>
          </div>
        </div>
      )}

      {isAddingTeacher && (
        <div className="fixed inset-0 bg-[#3C2415]/40 backdrop-blur-xl flex items-center justify-center z-[200] p-6">
          <div className="bg-white rounded-[64px] p-12 w-full max-w-lg shadow-2xl animate-fade-in">
            <h3 className="text-3xl font-black text-[#3C2415] tracking-tighter uppercase mb-2">Novo Professor</h3>
            <p className="text-[10px] font-black text-[#E87A2C] uppercase mb-8 tracking-widest">Crie uma conta de acesso para um colega</p>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              handleAddTeacher(formData.get('name') as string, formData.get('pass') as string);
            }} className="space-y-6">
              <input name="name" required className="w-full bg-[#FBF6F0] border-none rounded-3xl px-8 py-5 font-bold" placeholder="Nome do Professor" />
              <input name="pass" required maxLength={4} className="w-full bg-[#FBF6F0] border-none rounded-3xl px-8 py-5 font-bold" placeholder="Senha (4 números)" />
              <button type="submit" className="w-full bg-[#E87A2C] text-white py-5 rounded-3xl font-black text-lg shadow-xl">CADASTRAR</button>
              <button type="button" onClick={() => setIsAddingTeacher(false)} className="w-full text-stone-400 font-bold text-xs uppercase py-2">Cancelar</button>
            </form>
          </div>
        </div>
      )}

      {showInstallPrompt && (
        <div className="fixed inset-0 bg-[#1A110D]/60 backdrop-blur-md z-[200] flex items-end md:items-center justify-center p-4">
          <div className="bg-white rounded-[48px] p-10 w-full max-w-md shadow-2xl animate-in fade-in slide-in-from-bottom-10 border border-[#3C2415]/5">
            <div className="flex flex-col items-center text-center">
              <div className="w-24 h-24 bg-[#E87A2C] rounded-[32px] flex items-center justify-center mb-6 shadow-xl shadow-orange-500/20"><img src="/assets/icon-512.png" alt="MusiClass Icon" className="w-16 h-16 rounded-xl" /></div>
              <h3 className="text-3xl font-black text-[#1A110D] tracking-tighter uppercase mb-4">MusiClass no seu Tablet</h3>
              <p className="text-sm font-bold text-stone-500 uppercase tracking-widest leading-relaxed mb-8">Instale agora para acessar suas aulas direto da tela inicial, com desempenho superior.</p>
              <div className="flex flex-col w-full gap-3">
                <button onClick={handleInstallApp} className="w-full bg-[#1A110D] text-white py-6 rounded-[32px] font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:bg-[#3C2415] transition-all">Instalar Aplicativo</button>
                <button onClick={() => setShowInstallPrompt(false)} className="w-full py-4 text-stone-300 font-bold text-[10px] uppercase tracking-widest hover:text-[#E87A2C]">Agora não</button>
              </div>
            </div>
          </div>
        </div>
      )}
      {syncResults && (
        <div className="fixed inset-0 bg-[#1A110D]/60 backdrop-blur-md z-[300] flex items-center justify-center p-4">
          <div className="bg-white rounded-[48px] p-10 w-full max-w-2xl shadow-2xl animate-fade-in flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-3xl font-black text-[#1A110D] tracking-tighter uppercase">Resultado da Sincronização</h3>
                <p className="text-[10px] font-black text-[#E87A2C] uppercase tracking-widest mt-1">Logs de atividades coletados do Emusys</p>
              </div>
              <button onClick={() => setSyncResults(null)} className="p-3 bg-[#FBF6F0] rounded-2xl hover:bg-stone-100 transition-all"><X className="w-6 h-6 text-stone-400" /></button>
            </div>

            <div className="flex gap-4 mb-8">
              <div className="flex-1 bg-emerald-50 p-4 rounded-3xl border border-emerald-100">
                <p className="text-[10px] font-black text-emerald-600 uppercase mb-1">Novos</p>
                <p className="text-2xl font-black text-emerald-700">{syncResults.added}</p>
              </div>
              <div className="flex-1 bg-blue-50 p-4 rounded-3xl border border-blue-100">
                <p className="text-[10px] font-black text-blue-600 uppercase mb-1">Trocas</p>
                <p className="text-2xl font-black text-blue-700">{syncResults.updated}</p>
              </div>
              <div className="flex-1 bg-rose-50 p-4 rounded-3xl border border-rose-100">
                <p className="text-[10px] font-black text-rose-600 uppercase mb-1">Saídas</p>
                <p className="text-2xl font-black text-rose-700">{syncResults.removed}</p>
              </div>
            </div>

            <div className="flex-grow overflow-y-auto space-y-2 pr-4 custom-scrollbar">
              {syncResults.logs.length > 0 ? (
                syncResults.logs.map((log, i) => (
                  <div key={i} className="p-4 bg-[#FBF6F0] rounded-2xl text-[11px] font-bold text-[#3C2415]/70 border border-[#3C2415]/5">
                    {log}
                  </div>
                ))
              ) : (
                <div className="py-12 text-center opacity-30 font-black uppercase text-xs tracking-widest">Nenhuma alteração detectada</div>
              )}
            </div>

            {syncResults.missingTeachers.length > 0 && (
              <div className="mt-8 p-6 bg-orange-50 rounded-[32px] border border-orange-100">
                <h4 className="text-[10px] font-black text-orange-600 uppercase tracking-widest mb-3 flex items-center gap-2">⚠️ Professores não cadastrados no MusiClass:</h4>
                <div className="flex flex-wrap gap-2">
                  {syncResults.missingTeachers.map((t, i) => (
                    <span key={i} className="px-3 py-1 bg-white text-orange-700 text-[10px] font-black rounded-lg border border-orange-200">{t}</span>
                  ))}
                </div>
                <p className="text-[9px] font-bold text-orange-600/60 mt-3 italic">* Cadastre estes nomes no painel para que os alunos sejam vinculados automaticamente.</p>
              </div>
            )}

            <button onClick={() => setSyncResults(null)} className="mt-8 w-full bg-[#1A110D] text-white py-6 rounded-[32px] font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-[#3C2415] transition-all">CONCLUÍDO</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
