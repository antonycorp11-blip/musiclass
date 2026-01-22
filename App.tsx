
import React, { useState, useEffect } from 'react';
import {
  Users,
  BookOpen,
  Plus,
  Music,
  Trash2,
  X,
  Settings2,
  Zap,
  Layout,
  PlusCircle,
  Upload,
  LogOut,
  ChevronRight,
  Sparkles,
  RotateCcw,
  Shield,
  LayoutDashboard,
  Trash,
  Keyboard,
  ListTodo,
  Disc
} from 'lucide-react';

import * as XLSX from 'xlsx';
import { Instrument, Level, Student, Teacher } from './types';
import { ROOTS, CHORD_TYPES, SCALES } from './constants';
import { MusicEngine } from './services/musicEngine';
import { ChordVisualizer } from './components/ChordVisualizer';
import { TabEditor } from './components/TabEditor';
import { StudentPreview } from './components/StudentPreview';
import { Login } from './components/Login';
import { SoloEditor } from './components/SoloEditor';
import { Logo } from './components/Logo';
import { supabase } from './lib/supabase';
import { History as HistoryIcon, Clock } from 'lucide-react';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<Teacher | null>(null);
  const [activeTab, setActiveTab] = useState<'students' | 'lesson' | 'dashboard' | 'history'>('students');
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isAddingStudent, setIsAddingStudent] = useState(false);
  const [isAddingTeacher, setIsAddingTeacher] = useState(false);

  // Lesson State
  const [currentChords, setCurrentChords] = useState<any[]>([]);
  const [currentScales, setCurrentScales] = useState<any[]>([]);
  const [currentTabs, setCurrentTabs] = useState<{ id: string, title: string, content: string }[]>([]);
  const [currentSolos, setCurrentSolos] = useState<{ id: string, title: string, notes: string[] }[]>([]);
  const [exercises, setExercises] = useState<string[]>([]);
  const [newExercise, setNewExercise] = useState('');
  const [currentObjective, setCurrentObjective] = useState('');
  const [lessonHistory, setLessonHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Selection UI State
  const [showAdvancedChord, setShowAdvancedChord] = useState(false);
  const [selRoot, setSelRoot] = useState('C');
  const [selType, setSelType] = useState('maj');
  const [selExt, setSelExt] = useState('none');
  const [selScaleRoot, setSelScaleRoot] = useState('C');
  const [selScaleId, setSelScaleId] = useState('major');

  const [isPreviewing, setIsPreviewing] = useState(false);

  useEffect(() => {
    fetchInitialData();
    const savedUser = localStorage.getItem('music_current_user');
    if (savedUser) setCurrentUser(JSON.parse(savedUser));
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const { data: bTeachers, error: tError } = await supabase.from('mc_teachers').select('*');
      if (tError) {
        console.error("Supabase Teacher Error:", tError);
      }

      // Se bTeachers vier nulo ou vazio e não houver erro de rede, 
      // garantimos pelo menos o diretor hardcoded para evitar tela em branco
      if (bTeachers && bTeachers.length > 0) {
        setTeachers(bTeachers);
      } else {
        console.warn("Nenhum professor encontrado no banco, usando fallback local.");
        setTeachers([{
          id: 'emergency-director',
          name: 'MusiClass Diretor',
          password: 'admin',
          role: 'director'
        }]);
      }

      const { data: bStudents } = await supabase.from('mc_students').select('*').order('name');
      if (bStudents) setStudents(bStudents);

      const { data: bHistory } = await supabase.from('mc_lesson_history').select('*, mc_students(name, instrument)').order('created_at', { ascending: false });
      if (bHistory) setLessonHistory(bHistory);
    } catch (error) {
      console.error("Error fetching data:", error);
      // Fallback em caso de erro total de conexão
      setTeachers([{
        id: 'emergency-director',
        name: 'MusiClass Diretor',
        password: 'admin',
        role: 'director'
      }]);
    } finally {
      setLoading(false);
    }
  };

  const saveStudents = async (newStudents: Student[]) => {
    // This local update is just for UI consistency before a fresh fetch
    setStudents(newStudents);
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
    if (window.confirm("ATENÇÃO: Isso apagará TODOS os alunos do sistema permanentemente do Banco de Dados. Deseja continuar?")) {
      setLoading(true);
      try {
        const { error } = await supabase.from('mc_students').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        if (error) throw error;

        await fetchInitialData();
        setSelectedStudent(null);
        alert("Banco de dados resetado com sucesso!");
      } catch (error) {
        console.error("Erro ao resetar:", error);
        alert("Erro ao limpar dados do servidor.");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleAddTeacher = async (name: string, pass: string) => {
    if (pass.length !== 4 || isNaN(Number(pass))) {
      alert("A senha deve ter exatamente 4 dígitos numéricos.");
      return;
    }
    const { data, error } = await supabase.from('mc_teachers').insert([{ name, password: pass, role: 'teacher' }]).select();
    if (error) {
      console.error("Erro Supabase:", error);
      return alert(`Erro ao salvar professor: ${error.message || 'Erro desconhecido'}`);
    }

    await fetchInitialData();
    alert(`${name} cadastrado com sucesso!`);
    setIsAddingTeacher(false);
    return true;
  };

  const handleDeleteTeacher = async (id: string) => {
    const teacher = teachers.find(t => t.id === id);
    if (teacher?.role === 'director') return alert("O Diretor não pode ser removido.");
    if (window.confirm("Deseja realmente remover este professor?")) {
      const { error } = await supabase.from('mc_teachers').delete().eq('id', id);
      if (error) return alert("Erro ao remover professor.");
      await fetchInitialData();
    }
  };

  const addStudent = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!currentUser) return;
    const formData = new FormData(e.currentTarget);
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
      console.error("Erro ao salvar:", error);
      if (error.code === '23505') return alert("Este aluno já está cadastrado para este instrumento.");
      return alert(`Erro ao salvar aluno: ${error.message}`);
    }

    await fetchInitialData();
    setIsAddingStudent(false);
  };


  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;
    setLoading(true);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

        const batch: any[] = [];
        let missingTeachers = new Set<string>();

        for (let index = 0; index < jsonData.length; index++) {
          const row = jsonData[index];
          if (index === 0 || !row[0] || String(row[0]).includes('Aluno(a)')) continue;

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
            if (match) {
              teacherId = match.id;
            } else {
              missingTeachers.add(extractedTeacherName);
            }
          }

          let instrument = Instrument.GUITAR;
          const lowerInst = instrumentRaw.toLowerCase();
          if (lowerInst.includes('guitarra') || lowerInst.includes('electric')) instrument = Instrument.ELECTRIC_GUITAR;
          else if (lowerInst.includes('teclado') || lowerInst.includes('keyboard')) instrument = Instrument.KEYBOARD;
          else if (lowerInst.includes('piano')) instrument = Instrument.PIANO;
          else if (lowerInst.includes('bateria') || lowerInst.includes('drums')) instrument = Instrument.DRUMS;
          else if (lowerInst.includes('vocal') || lowerInst.includes('voice') || lowerInst.includes('canto')) instrument = Instrument.VOCALS;
          else if (lowerInst.includes('viol') || lowerInst.includes('guitar')) instrument = Instrument.GUITAR;


          const exists = students.some(s => s.name.toLowerCase() === fullName.toLowerCase() && s.instrument === instrument);
          const inBatch = batch.some(s => s.name.toLowerCase() === fullName.toLowerCase() && s.instrument === instrument);

          if (!exists && !inBatch) {
            // Validar se o teacherId é um UUID válido para o Postgres
            const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-4][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(teacherId);

            batch.push({
              name: fullName,
              age,
              instrument,
              level: Level.BEGINNER,
              teacher_id: isValidUUID ? teacherId : null
            });
          }
        }

        if (batch.length > 0) {
          const { error } = await supabase.from('mc_students').insert(batch);
          if (error) {
            console.error("Erro na importação:", error);
            return alert(`Erro ao importar alunos: ${error.message} (${error.details || 'Verifique se há nomes duplicados na planilha'})`);
          }

          await fetchInitialData();
          let msg = `${batch.length} novos alunos importados com sucesso!`;
          if (missingTeachers.size > 0) {
            msg += `\n\nAtenção: Professores não encontrados foram atribuídos a você: ${Array.from(missingTeachers).join(', ')}`;
          }
          alert(msg);
        } else {
          alert("Nenhum novo aluno encontrado na planilha.");
        }
      } catch (error) {
        alert("Erro ao ler o arquivo Excel.");
      } finally {
        setLoading(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleAddChord = () => {
    const chord = MusicEngine.generateChord(selRoot, selType, selExt);
    if (chord) setCurrentChords([...currentChords, { ...chord, typeId: selType, extId: selExt, root: selRoot }]);
  };

  const handleGenerateReport = async () => {
    if (!selectedStudent || !currentUser) return;

    const reportData = {
      chords: currentChords,
      scales: currentScales,
      tabs: currentTabs,
      solos: currentSolos,
      exercises: exercises
    };

    const { error } = await supabase.from('mc_lesson_history').insert([{
      student_id: selectedStudent.id,
      teacher_id: currentUser.id,
      objective: currentObjective,
      report_data: reportData
    }]);

    if (error) console.error("Erro ao salvar histórico:", error);

    await fetchInitialData();
    setIsPreviewing(true);
  };

  const handleAddScale = () => {
    const notes = MusicEngine.generateScale(selScaleRoot, selScaleId);
    const scale = SCALES.find(s => s.id === selScaleId);
    if (notes && scale) {
      setCurrentScales([...currentScales, { root: selScaleRoot, name: scale.name, notes }]);
    }
  };

  const handleAddTab = () => {
    setCurrentTabs([...currentTabs, { id: Math.random().toString(), title: '', content: '' }]);
  };

  const handleAddSolo = () => {
    setCurrentSolos([...currentSolos, { id: Math.random().toString(), title: '', notes: [] }]);
  };

  const updateTab = (id: string, title: string, content: string) => {
    setCurrentTabs(currentTabs.map(t => t.id === id ? { ...t, title, content } : t));
  };

  const updateSolo = (id: string, title: string, notes: string[]) => {
    setCurrentSolos(currentSolos.map(s => s.id === id ? { ...s, title, notes } : s));
  };

  const removeTab = (id: string) => {
    setCurrentTabs(currentTabs.filter(t => t.id !== id));
  };

  const handleAddExercise = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newExercise.trim()) {
      setExercises([...exercises, newExercise.trim()]);
      setNewExercise('');
    }
  };

  const handleRemoveExercise = (index: number) => {
    setExercises(exercises.filter((_, i) => i !== index));
  };

  const teacherStudents = students.filter(s => s.teacher_id === currentUser?.id || currentUser?.role === 'director');

  if (loading && !currentUser) {
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

  if (!currentUser) {
    return <Login teachers={teachers} onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-[#FBF6F0] flex flex-col md:flex-row font-sans text-[#1A110D] overflow-x-hidden">
      {/* Sidebar / Bottom Nav Bar */}
      <nav className="w-full md:w-20 lg:w-72 bg-[#1A110D] text-white p-2 md:p-4 lg:p-8 flex md:flex-col items-center lg:items-stretch fixed bottom-0 md:top-0 h-16 md:h-screen z-50 shadow-[0_-10px_30px_rgba(0,0,0,0.3)] md:shadow-2xl">
        <div className="hidden md:block absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full -mr-16 -mt-16" />
        <div className="hidden md:block mb-12 z-10">
          <Logo light size="sm" />
        </div>
        <div className="flex md:flex-col gap-1 md:gap-2 flex-grow justify-around md:justify-start w-full z-10">
          <button onClick={() => setActiveTab('students')} className={`flex flex-col md:flex-row items-center gap-1 md:gap-4 px-3 md:px-5 py-2 md:py-4 rounded-xl md:rounded-2xl transition-all ${activeTab === 'students' ? 'bg-[#E87A2C] shadow-lg shadow-orange-500/20 scale-105' : 'text-stone-500 hover:text-white'}`}>
            <Users className="w-5 h-5" />
            <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest md:hidden lg:block">Alunos</span>
          </button>
          <button onClick={() => { if (selectedStudent) setActiveTab('lesson'); else alert('Selecione um aluno primeiro!'); }} className={`flex flex-col md:flex-row items-center gap-1 md:gap-4 px-3 md:px-5 py-2 md:py-4 rounded-xl md:rounded-2xl transition-all ${activeTab === 'lesson' ? 'bg-[#E87A2C] shadow-lg shadow-orange-500/20 scale-105' : 'text-stone-500 hover:text-white'}`}>
            <BookOpen className="w-5 h-5" />
            <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest md:hidden lg:block">Aulas</span>
          </button>
          <button onClick={() => setActiveTab('history')} className={`flex flex-col md:flex-row items-center gap-1 md:gap-4 px-3 md:px-5 py-2 md:py-4 rounded-xl md:rounded-2xl transition-all ${activeTab === 'history' ? 'bg-[#E87A2C] shadow-lg shadow-orange-500/20 scale-105' : 'text-stone-500 hover:text-white'}`}>
            <Clock className="w-5 h-5" />
            <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest md:hidden lg:block">Histórico</span>
          </button>
          {currentUser.role === 'director' && (
            <button onClick={() => setActiveTab('dashboard')} className={`flex flex-col md:flex-row items-center gap-1 md:gap-4 px-3 md:px-5 py-2 md:py-4 rounded-xl md:rounded-2xl transition-all ${activeTab === 'dashboard' ? 'bg-[#E87A2C] shadow-lg shadow-orange-500/20 scale-105' : 'text-stone-500 hover:text-white'}`}>
              <LayoutDashboard className="w-5 h-5" />
              <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest md:hidden lg:block">Painel</span>
            </button>
          )}
          <button onClick={handleLogout} className="md:hidden flex flex-col items-center gap-1 px-3 py-2 text-stone-500">
            <LogOut className="w-5 h-5 flex-shrink-0" />
            <span className="text-[8px] font-black uppercase tracking-widest">Sair</span>
          </button>
        </div>

        <div className="hidden md:block mt-auto pt-6 border-t border-white/5 w-full z-10">
          <button onClick={handleLogout} className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-stone-500 hover:text-white transition-all group">
            <LogOut className="w-5 h-5 group-hover:text-rose-500 transition-colors" />
            <span className="lg:block md:hidden text-[10px] font-black uppercase tracking-widest">Sair do Sistema</span>
          </button>
        </div>
      </nav>

      {/* Main Content com Padding Lateral para a Sidebar fixa */}
      <main className="flex-grow md:ml-20 lg:ml-72 p-4 md:p-12 pb-24 md:pb-0 overflow-y-auto min-h-screen">
        {activeTab === 'students' && (
          <div className="max-w-6xl mx-auto animate-fade-in">
            {/* Logo Mobile Only */}
            <div className="md:hidden flex items-center justify-between mb-8 px-2">
              <Logo size="sm" />
              <div className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
            </div>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12 md:mb-16">
              <div className="w-full md:w-auto">
                <h2 className="text-3xl md:text-5xl font-black text-[#3C2415] tracking-tighter uppercase leading-tight md:leading-none">Meus Alunos</h2>
                <p className="text-[10px] md:text-sm font-bold text-[#E87A2C] uppercase tracking-[0.2em] md:tracking-[0.3em] mt-1 md:mt-2 italic">Gerencie sua agenda de aulas</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                <label className="cursor-pointer bg-white border border-[#3C2415]/10 px-6 py-3.5 md:py-4 rounded-2xl md:rounded-3xl flex items-center justify-center gap-3 shadow-sm hover:shadow-xl hover:border-[#E87A2C]/20 transition-all font-black text-[10px] md:text-xs uppercase tracking-widest text-[#3C2415]/60 flex-1 sm:flex-none">
                  <Upload className="w-4 h-4 text-[#E87A2C]" /> Subir Planilha
                  <input type="file" onChange={handleFileUpload} accept=".xlsx, .xls" className="hidden" />
                </label>
                <button onClick={() => setIsAddingStudent(true)} className="bg-[#1A110D] text-white px-6 py-3.5 md:py-4 rounded-2xl md:rounded-3xl flex items-center justify-center gap-3 shadow-xl hover:bg-[#3C2415] transition-all font-black text-[10px] md:text-xs uppercase tracking-widest flex-1 sm:flex-none">
                  <Plus className="w-4 h-4" /> Novo Aluno
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 pb-20">
              {teacherStudents.map(student => (
                <div key={student.id} onClick={() => { setSelectedStudent(student); setActiveTab('lesson'); }} className="group bg-white p-8 rounded-[48px] border border-[#3C2415]/5 shadow-sm hover:shadow-2xl transition-all duration-500 cursor-pointer relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-[#E87A2C]/5 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-700" />
                  <div className="w-16 h-16 bg-[#FBF6F0] rounded-[24px] flex items-center justify-center text-[#E87A2C] text-2xl font-black mb-6 group-hover:bg-[#E87A2C] group-hover:text-white transition-all duration-500">{student.name.charAt(0)}</div>
                  <h4 className="font-black text-[#3C2415] text-2xl tracking-tighter uppercase mb-1">{student.name}</h4>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black uppercase tracking-widest px-3 py-1 bg-[#1A110D] text-white rounded-full">{student.instrument}</span>
                    <span className="text-[9px] font-black uppercase tracking-widest px-3 py-1 bg-white border border-[#3C2415]/10 text-[#3C2415] rounded-full">{student.level}</span>
                  </div>
                </div>
              ))}
              {teacherStudents.length === 0 && (
                <div className="col-span-full py-20 text-center opacity-20 font-black uppercase text-xs tracking-[0.5em]">Nenhum aluno cadastrado para você</div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'lesson' && selectedStudent && (
          <div className="max-w-7xl mx-auto space-y-12 animate-fade-in pb-32">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div>
                <button onClick={() => setActiveTab('students')} className="text-[#3C2415]/40 hover:text-[#E87A2C] text-[10px] font-black uppercase tracking-widest mb-2 transition-colors">← Voltar aos alunos</button>
                <h2 className="text-4xl font-black text-[#3C2415] tracking-tighter uppercase leading-none">Plano de Aula: {selectedStudent.name}</h2>
              </div>
              <div className="bg-[#1A110D] px-6 py-3 rounded-2xl flex items-center gap-4 shadow-xl">
                <div className="w-8 h-8 bg-[#E87A2C] rounded-lg flex items-center justify-center font-black text-white">{selectedStudent.name.charAt(0)}</div>
                <p className="text-sm font-black text-white uppercase tracking-widest">{selectedStudent.instrument}</p>
              </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              <div className="lg:col-span-8 space-y-12">
                {/* Harmonias */}
                <section className="bg-white rounded-[48px] p-10 border border-[#3C2415]/5 shadow-sm">
                  <div className="flex items-center justify-between mb-10">
                    <h3 className="text-xl font-black text-[#3C2415] uppercase tracking-tighter flex items-center gap-3"><Zap className="text-[#E87A2C]" /> Harmonias e Acordes</h3>
                    <button onClick={() => setShowAdvancedChord(!showAdvancedChord)} className="p-3 bg-[#FBF6F0] rounded-2xl text-[#3C2415]/40 hover:text-[#E87A2C] transition-all flex items-center gap-2 text-[10px] font-black uppercase"><Settings2 className="w-4 h-4" /> Avançado</button>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-8">
                    {ROOTS.filter(r => showAdvancedChord || (!r.includes('#') && !r.includes('b'))).map(r => (
                      <button key={r} onClick={() => setSelRoot(r)} className={`px-5 py-3 rounded-xl font-black text-sm transition-all ${selRoot === r ? 'bg-[#E87A2C] text-white shadow-lg scale-110' : 'bg-[#FBF6F0] text-[#3C2415]/40 hover:bg-stone-100'}`}>{r}</button>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2 mb-10">
                    {CHORD_TYPES.filter(t => showAdvancedChord || (t.id === 'maj' || t.id === 'min')).map(t => (
                      <button key={t.id} onClick={() => setSelType(t.id)} className={`px-6 py-3 rounded-xl font-black text-xs transition-all ${selType === t.id ? 'bg-[#1A110D] text-white' : 'bg-[#FBF6F0] text-[#3C2415]/30'}`}>{t.name}</button>
                    ))}
                  </div>
                  <button onClick={handleAddChord} className="w-full bg-[#E87A2C] text-white py-6 rounded-[32px] font-black text-lg hover:bg-orange-600 transition-all flex items-center justify-center gap-3 shadow-xl shadow-orange-500/10">ADICIONAR ACORDE {selRoot}{selType !== 'maj' ? selType : ''}</button>

                  {currentChords.length > 0 && (
                    <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {currentChords.map((c, i) => (
                        <div key={i} className="relative group">
                          <ChordVisualizer instrument={selectedStudent.instrument} chordNotes={c.notes} root={c.root} type={c.typeId} ext={c.extId} notesWithIndices={c.notesWithIndices} />
                          <button onClick={() => setCurrentChords(currentChords.filter((_, idx) => idx !== i))} className="absolute top-4 right-4 bg-[#1A110D] text-white p-3 rounded-full shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-5 h-5" /></button>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                {/* Escalas */}
                <section className="bg-white rounded-[48px] p-10 border border-[#3C2415]/5 shadow-sm">
                  <h3 className="text-xl font-black text-[#3C2415] uppercase tracking-tighter flex items-center gap-3 mb-10"><Layout className="text-[#E87A2C]" /> Campo Harmônico / Escalas</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                    <div className="flex flex-wrap gap-2">
                      {ROOTS.filter(r => !r.includes('#') && !r.includes('b')).map(r => (
                        <button key={r} onClick={() => setSelScaleRoot(r)} className={`w-12 h-12 rounded-2xl font-black ${selScaleRoot === r ? 'bg-[#E87A2C] text-white shadow-lg scale-110' : 'bg-[#FBF6F0] text-[#3C2415]/40'}`}>{r}</button>
                      ))}
                    </div>
                    <select value={selScaleId} onChange={(e) => setSelScaleId(e.target.value)} className="w-full bg-[#FBF6F0] border-none rounded-2xl px-8 py-4 font-bold text-[#3C2415] focus:ring-2 focus:ring-orange-500">
                      {SCALES.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <button onClick={handleAddScale} className="w-full bg-[#1A110D] text-white py-6 rounded-3xl font-black text-lg hover:bg-[#3C2415] mb-10">ADICIONAR ESCALA</button>

                  <div className="space-y-4">
                    {currentScales.map((s, i) => (
                      <div key={i} className="bg-[#FBF6F0] p-6 rounded-3xl border border-[#3C2415]/5">
                        <div className="flex justify-between items-center mb-4">
                          <span className="font-black text-lg uppercase tracking-tight">{s.root} {s.name}</span>
                          <button onClick={() => setCurrentScales(currentScales.filter((_, idx) => idx !== i))} className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl"><Trash2 className="w-5 h-5" /></button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {s.notes.map((n: string, ni: number) => (
                            <span key={ni} className="w-10 h-10 bg-white border border-[#3C2415]/10 rounded-xl flex items-center justify-center font-black text-[#3C2415] text-xs shadow-sm">{n}</span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Exercícios */}
                <section className="bg-white rounded-[48px] p-10 border border-[#3C2415]/5 shadow-sm">
                  <h3 className="text-xl font-black text-[#3C2415] uppercase tracking-tighter flex items-center gap-3 mb-10"><ListTodo className="text-[#E87A2C]" /> Campo de Exercícios</h3>
                  <div className="relative mb-8">
                    <input
                      value={newExercise}
                      onChange={(e) => setNewExercise(e.target.value)}
                      onKeyDown={handleAddExercise}
                      placeholder="Descreva um exercício e aperte Enter..."
                      className="w-full bg-[#FBF6F0] border-none rounded-[32px] px-8 py-5 font-bold"
                    />
                    <button onClick={() => { if (newExercise) { setExercises([...exercises, newExercise]); setNewExercise(''); } }} className="absolute right-4 top-1/2 -translate-y-1/2 bg-[#1A110D] text-white p-3 rounded-2xl shadow-xl"><Plus className="w-4 h-4" /></button>
                  </div>
                  <div className="space-y-3">
                    {exercises.map((ex, i) => (
                      <div key={i} className="flex items-center justify-between p-5 bg-[#FBF6F0] rounded-3xl group">
                        <div className="flex items-center gap-4">
                          <div className="w-8 h-8 bg-white border border-stone-200 rounded-xl flex items-center justify-center font-black text-[10px] text-[#E87A2C]">{i + 1}</div>
                          <span className="font-bold text-[#3C2415]">{ex}</span>
                        </div>
                        <button onClick={() => handleRemoveExercise(i)} className="text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    ))}
                    {exercises.length === 0 && <div className="py-10 text-center opacity-20 font-black uppercase text-xs tracking-widest">Nenhum exercício listado</div>}
                  </div>
                </section>

                {/* Ditador de Solos Dinâmico */}
                <section className="space-y-8">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-black text-[#3C2415] uppercase tracking-tighter flex items-center gap-3"><Music className="text-[#E87A2C]" /> Ditador de Melodias</h3>
                    <button onClick={handleAddSolo} className="px-6 py-3 bg-[#1A110D] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-[#3C2415] transition-all"><Plus className="w-4 h-4" /> Novo Trecho</button>
                  </div>
                  {currentSolos.map(solo => (
                    <SoloEditor
                      key={solo.id}
                      id={solo.id}
                      title={solo.title}
                      notes={solo.notes}
                      instrument={selectedStudent.instrument}
                      onUpdate={(t, n) => updateSolo(solo.id, t, n)}
                      onRemove={() => setCurrentSolos(currentSolos.filter(s => s.id !== solo.id))}
                    />
                  ))}
                  {currentSolos.length === 0 && (
                    <button onClick={handleAddSolo} className="w-full py-16 border-2 border-dashed border-[#E87A2C]/20 rounded-[48px] text-[#E87A2C]/40 hover:text-[#E87A2C] hover:bg-orange-50/30 transition-all flex flex-col items-center gap-4 group">
                      <Music className="w-12 h-12 opacity-20 group-hover:opacity-100 transition-opacity" />
                      <span className="font-black uppercase tracking-[0.3em] text-xs">Criar Ditado de Solo</span>
                    </button>
                  )}
                </section>

                {/* Tablaturas */}
                <section className="space-y-6">
                  {currentTabs.map(tab => (
                    <div key={tab.id} className="relative">
                      <TabEditor title={tab.title} onTitleChange={(t) => updateTab(tab.id, t, tab.content)} value={tab.content} onChange={(c) => updateTab(tab.id, tab.title, c)} />
                      <button onClick={() => removeTab(tab.id)} className="absolute top-6 right-6 text-rose-500 hover:text-rose-700"><Trash2 className="w-5 h-5" /></button>
                    </div>
                  ))}
                  <button onClick={handleAddTab} className="w-full py-10 border-2 border-dashed border-stone-200 rounded-[48px] text-stone-300 font-black flex items-center justify-center gap-3 hover:bg-stone-50 transition-all">
                    <PlusCircle className="w-6 h-6" /> ADICIONAR TABLATURA / RIFF
                  </button>
                </section>
              </div>

              {/* Sidebar do Editor */}
              <div className="lg:col-span-4 space-y-8">
                <section className="bg-white p-10 rounded-[48px] border border-[#3C2415]/5 shadow-sm sticky top-12">
                  <div className="space-y-10">
                    <div>
                      <h3 className="text-[10px] font-black text-[#E87A2C] uppercase tracking-[0.3em] mb-4 flex items-center gap-2">Pauta Pedagógica</h3>
                      <textarea value={currentObjective} onChange={(e) => setCurrentObjective(e.target.value)} className="w-full bg-[#FBF6F0] border-none rounded-[32px] p-8 h-60 text-sm font-medium focus:ring-2 focus:ring-[#E87A2C]" placeholder="Descreva os objetivos da aula..." />
                    </div>
                    <button onClick={handleGenerateReport} className="w-full bg-[#1A110D] text-white py-6 rounded-[32px] font-black text-xs uppercase tracking-widest hover:bg-[#3C2415] transition-all flex items-center justify-center gap-3 shadow-2xl shadow-stone-950/20"><Sparkles className="w-4 h-4" /> FINALIZAR E GERAR PNG</button>
                  </div>
                </section>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="max-w-6xl mx-auto animate-fade-in space-y-12">
            <header>
              <h2 className="text-5xl font-black text-[#3C2415] tracking-tighter uppercase leading-none">Histórico de Aulas</h2>
              <p className="text-sm font-bold text-[#E87A2C] uppercase tracking-[0.3em] mt-2 italic">Acompanhamento pedagógico</p>
            </header>

            <div className="bg-white rounded-[48px] p-10 border border-[#3C2415]/5 shadow-sm overflow-hidden">
              <div className="space-y-6">
                {lessonHistory
                  .filter(h => currentUser?.role === 'director' || h.teacher_id === currentUser?.id)
                  .map((h, i) => (
                    <div key={i} className="flex flex-col md:flex-row justify-between items-start md:items-center p-6 bg-[#FBF6F0] rounded-3xl gap-4 group hover:bg-white hover:shadow-xl transition-all border border-transparent hover:border-orange-100">
                      <div className="flex items-center gap-6">
                        <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-[#E87A2C] font-black shadow-sm group-hover:bg-[#E87A2C] group-hover:text-white transition-all text-xl">{h.mc_students?.name.charAt(0)}</div>
                        <div>
                          <h4 className="font-black text-xl text-[#1A110D] uppercase tracking-tighter">{h.mc_students?.name}</h4>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 bg-[#1A110D] text-white rounded">{h.mc_students?.instrument}</span>
                            <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(h.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 w-full md:w-auto">
                        <div className="flex-grow md:flex-grow-0 bg-white/50 px-4 py-3 rounded-2xl border border-stone-100">
                          <p className="text-[7px] font-black text-stone-300 uppercase tracking-widest mb-1">Pauta</p>
                          <p className="text-[10px] font-bold text-[#3C2415] line-clamp-1 max-w-[200px]">{h.objective || 'Sem pauta descrita'}</p>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedStudent(students.find(s => s.id === h.student_id) || null);
                            setCurrentChords(h.report_data.chords || []);
                            setCurrentScales(h.report_data.scales || []);
                            setCurrentSolos(h.report_data.solos || []);
                            setCurrentTabs(h.report_data.tabs || []);
                            setExercises(h.report_data.exercises || []);
                            setCurrentObjective(h.objective || '');
                            setActiveTab('lesson');
                          }}
                          className="bg-[#1A110D] text-white px-6 py-4 rounded-2xl font-black text-[9px] uppercase tracking-widest hover:bg-[#E87A2C] transition-all shadow-lg shadow-stone-900/10"
                        >
                          Abrir Aula
                        </button>
                      </div>
                    </div>
                  ))}
                {lessonHistory.length === 0 && (
                  <div className="py-20 text-center opacity-20 font-black uppercase text-xs tracking-[0.5em]">Nenhuma aula finalizada ainda</div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'dashboard' && currentUser.role === 'director' && (
          <div className="max-w-7xl mx-auto animate-fade-in space-y-12">
            <header className="mb-12">
              <h2 className="text-5xl font-black text-[#3C2415] tracking-tighter uppercase leading-none">Painel Administrativo</h2>
              <p className="text-sm font-bold text-[#E87A2C] uppercase tracking-[0.3em] mt-2 italic">Gestão da Escola</p>
            </header>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              {/* Dashboard Content - Reuse existing logic */}
              <section className="bg-white rounded-[48px] p-10 border border-[#3C2415]/5 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-black text-[#3C2415] uppercase tracking-tighter flex items-center gap-3"><Users className="text-[#E87A2C]" /> Professores</h3>
                  <button onClick={() => setIsAddingTeacher(true)} className="p-3 bg-[#1A110D] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2">Adicionar</button>
                </div>
                <div className="space-y-4">
                  {teachers.map(t => (
                    <div key={t.id} className="bg-[#FBF6F0] p-6 rounded-3xl flex justify-between items-center group">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-[#E87A2C] font-black shadow-sm group-hover:bg-[#E87A2C] group-hover:text-white transition-all">{t.name.charAt(0)}</div>
                        <div>
                          <p className="font-black text-[#3C2415] uppercase tracking-tight">{t.name}</p>
                          <p className="text-[10px] font-bold text-[#3C2415]/40 uppercase tracking-widest">{students.filter(s => s.teacher_id === t.id).length} Alunos • Senha: {t.password}</p>
                        </div>
                      </div>
                      {t.id !== 'director' && <button onClick={() => handleDeleteTeacher(t.id)} className="p-3 text-rose-500 hover:bg-rose-50 rounded-2xl transition-all opacity-0 group-hover:opacity-100"><Trash2 className="w-5 h-5" /></button>}
                    </div>
                  ))}
                </div>
              </section>
              <section className="bg-white rounded-[48px] p-10 border border-[#3C2415]/5 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-black text-[#3C2415] uppercase tracking-tighter flex items-center gap-3"><BookOpen className="text-[#E87A2C]" /> Todos os Alunos ({students.length})</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-[#3C2415]/5">
                        <th className="pb-4 text-[10px] font-black uppercase text-[#3C2415]/30 tracking-widest">Nome</th>
                        <th className="pb-4 text-[10px] font-black uppercase text-[#3C2415]/30 tracking-widest">Instrumento</th>
                        <th className="pb-4 text-[10px] font-black uppercase text-[#3C2415]/30 tracking-widest text-right">Idade</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#3C2415]/5">
                      {students.map(s => (
                        <tr key={s.id} className="group">
                          <td className="py-4 font-bold text-[#3C2415] uppercase text-sm">{s.name}</td>
                          <td className="py-4"><span className="text-[9px] font-black px-3 py-1 bg-[#1A110D] text-white rounded-full uppercase italic">{s.instrument}</span></td>
                          <td className="py-4 text-right font-black text-[#E87A2C] text-sm tabular-nums">{s.age || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
            <div className="flex justify-center pt-10">
              <button onClick={handleResetData} className="px-10 py-5 border border-rose-500/20 text-rose-500 rounded-[32px] font-black text-xs uppercase tracking-widest hover:bg-rose-50 transition-all flex items-center gap-3"><RotateCcw className="w-4 h-4" /> Resetar Banco de Dados (Alunos)</button>
            </div>
          </div>
        )}
      </main>

      {isPreviewing && selectedStudent && (
        <StudentPreview
          studentName={selectedStudent.name}
          teacherName={currentUser?.name || ''}
          instrument={selectedStudent.instrument}
          objective={currentObjective}
          chords={currentChords}
          scales={currentScales}
          exercises={exercises}
          tabs={currentTabs}
          solos={currentSolos}
          onClose={() => setIsPreviewing(false)}
        />
      )}

      {isAddingStudent && (
        <div className="fixed inset-0 bg-[#3C2415]/40 backdrop-blur-xl flex items-center justify-center z-[100] p-6">
          <div className="bg-white rounded-[64px] p-12 w-full max-w-xl shadow-2xl relative overflow-hidden animate-fade-in">
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
    </div>
  );
};

export default App;
