
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import {
    BookOpen, Plus, Trash2, ChevronRight, Edit3,
    HelpCircle, CheckCircle2, Save, X, FileText, Send, Star, ChevronDown, ChevronUp
} from 'lucide-react';
import { CurriculumTopic, InstrumentGroup, QuizQuestion, Teacher, Student } from '../../types';
import { fetchCurriculumTopics, saveCurriculumTopic, getInstrumentGroup, applyTopicToStudent } from '../../services/curriculumService';
import { Sparkles, User } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

interface Props {
    currentUser: Teacher;
    students: Student[];
    onSelectTopic?: (topic: CurriculumTopic) => void;
}

export const CurriculumView: React.FC<Props> = ({ currentUser, students, onSelectTopic }) => {
    const { showToast } = useToast();
    const [activeGroup, setActiveGroup] = useState<InstrumentGroup>('harmono_melodico');
    const [topics, setTopics] = useState<CurriculumTopic[]>([]);
    const [editingTopic, setEditingTopic] = useState<Partial<CurriculumTopic> | null>(null);
    const [loading, setLoading] = useState(false);
    const [aiInput, setAiInput] = useState("");
    const [isAiModuleOpen, setIsAiModuleOpen] = useState(false);
    const [selectedStudentId, setSelectedStudentId] = useState<string>("");
    const [isGeneratingLink, setIsGeneratingLink] = useState(false);
    const [isContentExpanded, setIsContentExpanded] = useState(false);

    const loadTopics = async () => {
        setLoading(true);
        try {
            const data = await fetchCurriculumTopics(activeGroup);
            setTopics(data || []);
        } catch (e: any) {
            if (!e.message?.includes("not found")) {
                console.error("Erro ao carregar matérias:", e);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadTopics();
    }, [activeGroup]);

    const handleSaveTopic = async () => {
        if (!editingTopic?.title || editingTopic.month_index === undefined) return;
        setLoading(true);
        try {
            await saveCurriculumTopic(editingTopic, activeGroup, currentUser.id);
            setEditingTopic(null);
            loadTopics();
        } catch (e: any) {
            showToast("Erro ao salvar: " + e.message, "error");
        } finally {
            setLoading(false);
        }
    };

    const deleteTopic = async (id: string) => {
        if (!window.confirm("Deseja excluir este tópico?")) return;
        try {
            const { error } = await supabase.from('mc_curriculum_topics').delete().eq('id', id);
            if (error) throw error;
            loadTopics();
        } catch (e: any) {
            console.error(e);
            showToast("Erro ao excluir: " + (e.message || "Você não tem permissão ou o tópico está em uso."), "error");
        }
    };

    const handleManualImport = () => {
        if (!aiInput.trim()) return;
        try {
            const questionsRaw = aiInput.split(/\d+\.\s+/).filter(q => q.trim().length > 10);
            const parsedQuiz: QuizQuestion[] = questionsRaw.map(raw => {
                const lines = raw.split('\n').map(l => l.trim()).filter(l => l.length > 0);
                const question = lines[0];
                const options: string[] = [];
                ['A)', 'B)', 'C)', 'D)'].forEach(prefix => {
                    const optLine = lines.find(l => l.startsWith(prefix));
                    if (optLine) options.push(optLine.replace(prefix, '').trim());
                });
                const answerLine = lines.find(l => l.includes('✅') || l.toLowerCase().includes('resposta:'));
                let correctIndex = 0;
                if (answerLine) {
                    if (answerLine.includes('A')) correctIndex = 0;
                    else if (answerLine.includes('B')) correctIndex = 1;
                    else if (answerLine.includes('C')) correctIndex = 2;
                    else if (answerLine.includes('D')) correctIndex = 3;
                }
                return { question, options, correctIndex } as QuizQuestion;
            });

            if (editingTopic && parsedQuiz.length > 0) {
                setEditingTopic({
                    ...editingTopic,
                    quiz_json: [...(editingTopic.quiz_json || []), ...parsedQuiz]
                });
                setAiInput("");
                setIsAiModuleOpen(false);
                showToast(`${parsedQuiz.length} questões importadas!`, "success");
            }
        } catch (e: any) { showToast("Erro: " + e.message, "error"); }
    };

    const handleGenerateQuizLink = async () => {
        if (!selectedStudentId || !editingTopic?.id) return;
        setIsGeneratingLink(true);
        try {
            const token = await applyTopicToStudent(selectedStudentId, editingTopic.id, currentUser.id);

            if (token) {
                const link = `${window.location.origin}/?quiz=${token}`;
                try {
                    await navigator.clipboard.writeText(link);
                    showToast("✨ Link copiado! Cole no WhatsApp do aluno.", "success");
                } catch (clipErr) {
                    // Fallback para quando o navegador bloqueia clipboard (comum em Iframe ou mobile sem HTTPS)
                    const textArea = document.createElement("textarea");
                    textArea.value = link;
                    document.body.appendChild(textArea);
                    textArea.select();
                    document.execCommand('copy');
                    document.body.removeChild(textArea);
                    showToast("✨ Link gerado e copiado!", "success");
                }
            } else {
                showToast("Erro ao gerar token do quiz.", "error");
            }
        } catch (e: any) {
            if (e.message?.includes("mc_student_topics")) {
                console.warn("Funcionalidade de link limitada por falta de tabela.");
            } else {
                showToast("Erro: " + e.message, "error");
            }
        } finally {
            setIsGeneratingLink(false);
        }
    };

    const eligibleStudents = students.filter(s => getInstrumentGroup(s.instrument) === activeGroup);
    const isEditable = editingTopic && (currentUser.role === 'director' || (editingTopic.month_index === 0 && editingTopic.creator_id === currentUser.id));

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-fade-in pb-20">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h2 className="text-4xl font-black text-[#3C2415] tracking-tighter uppercase leading-none">Grade Master</h2>
                    <p className="text-stone-400 font-bold text-xs uppercase tracking-widest mt-2">{currentUser.role === 'director' ? 'Gestão de Conteúdo' : 'Consulta Pedagógica'}</p>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => {
                            setEditingTopic({
                                title: '',
                                month_index: 0,
                                content_text: '',
                                quiz_json: [],
                                creator_id: currentUser.id
                            } as any);
                        }}
                        className="flex items-center gap-2 px-6 py-3 bg-[#1A110D] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-orange-600 transition-all shadow-xl shadow-orange-500/10"
                    >
                        <Plus className="w-4 h-4" /> Novo Questionário
                    </button>
                </div>
            </header>

            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-6 px-2">
                As matérias mensais (Mês 1, 2...) são a base principal. Questionários (Mês 0) são extras personalizados.
            </p>

            <div className="flex gap-4 p-2 bg-[#FBF6F0] rounded-[32px] w-fit">
                {(['harmono_melodico', 'percussao', 'vocal'] as InstrumentGroup[]).map(group => (
                    <button
                        key={group}
                        onClick={() => setActiveGroup(group)}
                        className={`px-8 py-4 rounded-3xl font-black text-[10px] uppercase tracking-widest transition-all ${activeGroup === group ? 'bg-[#1A110D] text-white shadow-xl' : 'text-[#3C2415]/40 hover:text-[#3C2415]'}`}
                    >
                        {group.replace('_', ' ')}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {/* MATÉRIAS MESTRAS */}
                <div className="col-span-full mb-4 border-b border-[#3C2415]/5 pb-4">
                    <h3 className="text-xs font-black text-[#E87A2C] uppercase tracking-[0.3em]">Grade Mestre MusiClass</h3>
                </div>
                {topics.filter(t => t.month_index > 0).map(topic => (
                    <div key={topic.id} className="bg-white rounded-[48px] p-10 border border-[#3C2415]/5 shadow-sm group hover:shadow-2xl transition-all">
                        <div className="flex justify-between items-start mb-6">
                            <div className="w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl shadow-lg bg-[#E87A2C] text-white">
                                {topic.month_index}
                            </div>
                            {(currentUser.role === 'director' || topic.creator_id === currentUser.id) && (
                                <div className="flex gap-2">
                                    <button onClick={() => setEditingTopic(topic)} className="p-3 bg-[#FBF6F0] rounded-xl hover:bg-orange-50 text-stone-400 hover:text-[#E87A2C] transition-all"><Edit3 className="w-5 h-5" /></button>
                                    <button onClick={() => deleteTopic(topic.id)} className="p-3 bg-[#FBF6F0] rounded-xl hover:bg-rose-50 text-stone-300 hover:text-rose-500 transition-all"><Trash2 className="w-5 h-5" /></button>
                                </div>
                            )}
                        </div>
                        <h3 className="text-2xl font-black text-[#3C2415] uppercase tracking-tighter mb-4">{topic.title}</h3>
                        <p className="text-xs text-stone-400 font-bold uppercase tracking-widest mb-6">{(topic.quiz_json?.length || 0)} Questões de Quiz</p>
                        <div className="flex flex-col gap-2">
                            <button onClick={() => setEditingTopic(topic)} className="w-full py-4 bg-[#FBF6F0] group-hover:bg-[#1A110D] group-hover:text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all">Ver Detalhes</button>
                            {onSelectTopic && (
                                <button onClick={() => onSelectTopic(topic)} className="w-full py-4 bg-[#E87A2C] text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all">Aplicar na Aula</button>
                            )}
                        </div>
                    </div>
                ))}

                {/* CONTEÚDO PERSONALIZADO */}
                {topics.some(t => t.month_index === 0) && (
                    <>
                        <div className="col-span-full mt-12 mb-4 border-b border-[#3C2415]/5 pb-4">
                            <h3 className="text-xs font-black text-stone-800 uppercase tracking-[0.3em]">Questionários & Personalizados</h3>
                        </div>
                        {topics.filter(t => t.month_index === 0).map(topic => (
                            <div key={topic.id} className="bg-white rounded-[48px] p-10 border border-[#3C2415]/5 shadow-sm group hover:shadow-2xl transition-all">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl shadow-lg bg-stone-900 text-yellow-500">
                                        <Star className="w-6 h-6 fill-current" />
                                    </div>
                                    <div className="flex gap-2">
                                        <span className="px-3 py-1 bg-stone-100 text-stone-500 rounded-full text-[7px] font-black uppercase tracking-widest self-center">Personalizado</span>
                                        {(currentUser.role === 'director' || topic.creator_id === currentUser.id) && (
                                            <div className="flex gap-2">
                                                <button onClick={() => setEditingTopic(topic)} className="p-3 bg-[#FBF6F0] rounded-xl hover:bg-orange-50 text-stone-400 hover:text-[#E87A2C] transition-all"><Edit3 className="w-5 h-5" /></button>
                                                <button onClick={() => deleteTopic(topic.id)} className="p-3 bg-[#FBF6F0] rounded-xl hover:bg-rose-50 text-stone-300 hover:text-rose-500 transition-all"><Trash2 className="w-5 h-5" /></button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <h3 className="text-2xl font-black text-[#3C2415] uppercase tracking-tighter mb-4">{topic.title}</h3>
                                <p className="text-xs text-stone-400 font-bold uppercase tracking-widest mb-6">{(topic.quiz_json?.length || 0)} Questões de Quiz</p>
                                <div className="flex flex-col gap-2">
                                    <button onClick={() => setEditingTopic(topic)} className="w-full py-4 bg-[#FBF6F0] group-hover:bg-[#1A110D] group-hover:text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all">Ver Detalhes</button>
                                    {onSelectTopic && (
                                        <button onClick={() => onSelectTopic(topic)} className="w-full py-4 bg-[#E87A2C] text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all">Aplicar na Aula</button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </>
                )}
            </div>

            {editingTopic && (
                <div className="fixed inset-0 bg-[#1A110D]/60 backdrop-blur-md z-[500] flex items-center justify-center p-4">
                    <div className="bg-white rounded-[56px] w-full max-w-4xl max-h-[90vh] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95">
                        <header className="p-6 md:p-10 border-b border-[#3C2415]/5 flex justify-between items-center shrink-0">
                            <div className="flex-1 pr-4">
                                <h3 className="text-xl md:text-3xl font-black text-[#3C2415] tracking-tighter uppercase leading-tight">{currentUser.role === 'director' ? 'Editar Tópico' : 'Visualizar Tópico'}</h3>
                                <p className="text-[9px] font-black text-[#E87A2C] uppercase tracking-widest mt-1 md:mt-2">{activeGroup.replace('_', ' ')} • Mês {editingTopic.month_index}</p>
                            </div>
                            <button onClick={() => setEditingTopic(null)} className="p-3 md:p-4 bg-[#FBF6F0] rounded-xl md:rounded-2xl hover:bg-rose-50 hover:text-rose-500 transition-all"><X className="w-5 h-5 md:w-6 md:h-6" /></button>
                        </header>

                        <div className="flex-grow overflow-y-auto p-6 md:p-10 custom-scrollbar space-y-6 md:space-y-8">
                            {(!isEditable) ? (
                                <>
                                    <div className="space-y-2">
                                        <h4 className="text-[10px] font-black text-[#E87A2C] uppercase tracking-[0.2em]">Conteúdo Pedagógico</h4>
                                        <div className="bg-[#FBF6F0] rounded-[32px] overflow-hidden border border-[#3C2415]/5">
                                            <div className={`p-6 md:p-8 text-stone-700 font-medium leading-relaxed whitespace-pre-wrap text-base md:text-lg ${!isContentExpanded ? 'max-h-[150px] overflow-hidden relative' : ''}`}>
                                                {editingTopic.content_text || 'Sem conteúdo cadastrado.'}
                                                {!isContentExpanded && (
                                                    <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[#FBF6F0] to-transparent" />
                                                )}
                                            </div>
                                            <button 
                                                onClick={() => setIsContentExpanded(!isContentExpanded)}
                                                className="w-full py-4 bg-white/50 border-t border-[#3C2415]/5 text-[10px] font-black uppercase tracking-widest text-[#E87A2C] flex items-center justify-center gap-2 hover:bg-white transition-all"
                                            >
                                                {isContentExpanded ? <><ChevronUp className="w-3 h-3"/> Ocultar Texto</> : <><ChevronDown className="w-3 h-3"/> Expandir Conteúdo Completo</>}
                                            </button>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="grid grid-cols-4 gap-6">
                                        <div className="col-span-1">
                                            <label className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-2 block">Mês</label>
                                            <input type="number" value={editingTopic.month_index || ''} onChange={e => setEditingTopic({ ...editingTopic, month_index: parseInt(e.target.value) })} className="w-full bg-[#FBF6F0] border-none rounded-2xl p-4 font-bold" />
                                        </div>
                                        <div className="col-span-3">
                                            <label className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-2 block">Título da Matéria</label>
                                            <input value={editingTopic.title || ''} onChange={e => setEditingTopic({ ...editingTopic, title: e.target.value })} className="w-full bg-[#FBF6F0] border-none rounded-2xl p-4 font-bold" />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-2 block">Conteúdo / Resumo</label>
                                        <textarea rows={4} value={editingTopic.content_text || ''} onChange={e => setEditingTopic({ ...editingTopic, content_text: e.target.value })} className="w-full bg-[#FBF6F0] border-none rounded-3xl p-6 font-bold text-sm" />
                                    </div>
                                </>
                            )}

                            {/* SEÇÃO DE AÇÃO PARA PROFESSORES */}
                            {editingTopic.id && (
                                <div className="bg-[#E87A2C]/5 p-6 md:p-8 rounded-[40px] border border-[#E87A2C]/10 space-y-6">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-white rounded-2xl text-[#E87A2C] shadow-sm">
                                            <User className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h4 className="font-black text-[#3C2415] uppercase tracking-tighter text-sm md:text-base">Módulo: Aplicar para Aluno</h4>
                                            <p className="text-[9px] text-stone-400 font-bold uppercase tracking-widest">Gere o link do questionário agora</p>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-4">
                                        <select
                                            value={selectedStudentId}
                                            onChange={(e) => setSelectedStudentId(e.target.value)}
                                            className="w-full bg-white border-none rounded-2xl p-4 font-bold text-sm shadow-sm focus:ring-2 focus:ring-[#E87A2C]"
                                        >
                                            <option value="">Selecione o aluno...</option>
                                            {eligibleStudents.map(s => (
                                                <option key={s.id} value={s.id}>{s.name} ({s.instrument})</option>
                                            ))}
                                        </select>

                                        <button
                                            onClick={handleGenerateQuizLink}
                                            disabled={!selectedStudentId || isGeneratingLink}
                                            className="w-full py-5 bg-[#E87A2C] text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-orange-500/20 hover:scale-[1.02] transition-all disabled:opacity-30 disabled:hover:scale-100 flex items-center justify-center gap-3"
                                        >
                                            {isGeneratingLink ? 'GERANDO...' : <><Send className="w-4 h-4" /> GERAR LINK E COPIAR LINK</>}
                                        </button>
                                    </div>
                                </div>
                            )}

                                    {eligibleStudents.length === 0 && (
                                        <p className="text-[9px] text-[#E87A2C] font-black uppercase text-center tracking-widest">Nenhum aluno de {activeGroup.replace('_', ' ')} encontrado.</p>
                                    )}
                                </div>
                            )}

                            <div className="space-y-6">
                                <div className="flex justify-between items-center">
                                    <h4 className="text-xl font-black text-[#3C2415] uppercase tracking-tighter flex items-center gap-3"><HelpCircle className="w-6 h-6 text-[#E87A2C]" /> Questionário</h4>
                                    {isEditable && (
                                        <div className="flex gap-2">
                                            <button onClick={() => setIsAiModuleOpen(!isAiModuleOpen)} className="px-4 py-2 bg-emerald-500 text-white rounded-xl font-black text-[9px] uppercase tracking-widest flex items-center gap-2"><FileText className="w-3 h-3" /> Importar Texto</button>
                                            <button onClick={() => setEditingTopic({ ...editingTopic, quiz_json: [...(editingTopic.quiz_json || []), { question: '', options: ['', '', '', ''], correctIndex: 0 }] })} className="px-4 py-2 bg-[#E87A2C] text-white rounded-xl font-black text-[9px] uppercase tracking-widest">+ Add Pergunta</button>
                                        </div>
                                    )}
                                </div>

                                {isAiModuleOpen && (
                                    <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100 mb-8 animate-fade-in">
                                        <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-4">Cole o texto do questionário abaixo</p>
                                        <textarea value={aiInput} onChange={e => setAiInput(e.target.value)} rows={6} className="w-full bg-white border-none rounded-2xl p-4 text-xs font-bold mb-4" placeholder="1. Pergunta?&#10;A) Opção 1...&#10;✅ Resposta: B" />
                                        <button onClick={handleManualImport} disabled={!aiInput} className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest">Processar e Adicionar</button>
                                    </div>
                                )}

                                <div className="space-y-4">
                                <div className="space-y-4">
                                    {editingTopic.quiz_json?.map((q, qIdx) => (
                                        <div key={qIdx} className="bg-[#FBF6F0] p-8 rounded-[32px] border border-[#3C2415]/5 space-y-4 relative">
                                            {isEditable && (
                                                <button onClick={() => setEditingTopic({ ...editingTopic, quiz_json: editingTopic.quiz_json?.filter((_, i) => i !== qIdx) })} className="absolute top-6 right-6 p-2 text-rose-300 hover:text-rose-500 transition-all"><X className="w-4 h-4" /></button>
                                            )}
                                            {isEditable ? (
                                                <input value={q.question} onChange={e => {
                                                    const newList = [...(editingTopic.quiz_json || [])];
                                                    newList[qIdx].question = e.target.value;
                                                    setEditingTopic({ ...editingTopic, quiz_json: newList });
                                                }} placeholder="Texto da Pergunta" className="w-full bg-white border-none rounded-xl p-4 font-bold text-sm" />
                                            ) : (
                                                <h5 className="font-black text-[#3C2415] text-lg pr-10">{qIdx + 1}. {q.question}</h5>
                                            )}
                                            <div className="grid grid-cols-2 gap-4">
                                                {q.options.map((opt, oIdx) => (
                                                    <div key={oIdx} className={`flex items-center gap-3 p-3 rounded-xl border ${q.correctIndex === oIdx ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-[#3C2415]/5'}`}>
                                                        {isEditable ? (
                                                            <input type="radio" checked={q.correctIndex === oIdx} onChange={() => {
                                                                const newList = [...(editingTopic.quiz_json || [])];
                                                                newList[qIdx].correctIndex = oIdx;
                                                                setEditingTopic({ ...editingTopic, quiz_json: newList });
                                                            }} className="w-4 h-4 accent-[#E87A2C]" />
                                                        ) : (
                                                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${q.correctIndex === oIdx ? 'bg-emerald-500 border-emerald-500' : 'border-stone-200'}`}>
                                                                {q.correctIndex === oIdx && <CheckCircle2 className="w-2 h-2 text-white" />}
                                                            </div>
                                                        )}
                                                        {isEditable ? (
                                                            <input value={opt} onChange={e => {
                                                                const newList = [...(editingTopic.quiz_json || [])];
                                                                newList[qIdx].options[oIdx] = e.target.value;
                                                                setEditingTopic({ ...editingTopic, quiz_json: newList });
                                                            }} className="flex-grow border-none font-bold text-xs bg-transparent" placeholder={`Opção ${String.fromCharCode(65 + oIdx)}`} />
                                                        ) : (
                                                            <span className={`flex-grow font-bold text-xs ${q.correctIndex === oIdx ? 'text-emerald-700' : 'text-stone-500'}`}>{opt}</span>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                </div>
                            </div>
                        </div>

                        {isEditable && (
                            <footer className="p-10 border-t border-[#3C2415]/5 shrink-0 bg-[#FBF6F0]/30">
                                <button onClick={handleSaveTopic} disabled={loading} className="w-full bg-[#1A110D] text-white py-6 rounded-3xl font-black text-xs uppercase tracking-[0.3em] shadow-2xl flex items-center justify-center gap-3">
                                    {loading ? 'SALVANDO...' : <><Save className="w-5 h-5" /> SALVAR ALTERAÇÕES</>}
                                </button>
                            </footer>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
