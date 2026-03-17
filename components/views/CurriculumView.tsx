
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import {
    BookOpen, Plus, Trash2, Edit3,
    HelpCircle, CheckCircle2, Save, X, FileText, Send, Star, ChevronDown, ChevronUp, User, UserPlus, Download
} from 'lucide-react';
import { CurriculumTopic, InstrumentGroup, QuizQuestion, Teacher, Student } from '../../types';
import { fetchCurriculumTopics, saveCurriculumTopic, getInstrumentGroup, applyTopicToStudent } from '../../services/curriculumService';
import { useToast } from '../../context/ToastContext';
import jsPDF from 'jspdf';

interface Props {
    currentUser: Teacher;
    students: Student[];
    forceGroup?: InstrumentGroup;
    onSelectTopic?: (topic: CurriculumTopic) => void;
}

export const CurriculumView: React.FC<Props> = ({ currentUser, students, forceGroup, onSelectTopic }) => {
    const { showToast } = useToast();
    const [activeGroup, setActiveGroup] = useState<InstrumentGroup>(forceGroup || 'harmono_melodico');
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
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadTopics();
    }, [activeGroup]);

    const handleDownloadPDF = (topic: Partial<CurriculumTopic>) => {
        try {
            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            const margin = 20;
            const contentWidth = pageWidth - (margin * 2);
            let cursorY = 85;
            
            // Function to add header to any page
            const addHeader = (pdfDoc: jsPDF) => {
                pdfDoc.setFillColor(26, 17, 13); // Black
                pdfDoc.rect(0, 0, pageWidth, 40, 'F');
                
                pdfDoc.setTextColor(255, 255, 255);
                pdfDoc.setFontSize(22);
                pdfDoc.setFont("helvetica", "bold");
                pdfDoc.text("MUSICLASS", margin, 20);
                
                pdfDoc.setFontSize(10);
                pdfDoc.setFont("helvetica", "normal");
                pdfDoc.text("EDUCATIONAL SYSTEM", margin, 28);
                
                // Title on first page only (if cursorY is initial)
                if (cursorY === 85) {
                    pdfDoc.setTextColor(232, 122, 44); // Orange
                    pdfDoc.setFontSize(12);
                    pdfDoc.setFont("helvetica", "bold");
                    pdfDoc.text(activeGroup.replace('_', ' ').toUpperCase(), margin, 55);
                    
                    pdfDoc.setTextColor(60, 36, 21); // Dark Brown
                    pdfDoc.setFontSize(26);
                    pdfDoc.text(topic.title?.toUpperCase() || "MATÉRIA", margin, 65);
                    
                    // Divider
                    pdfDoc.setDrawColor(232, 122, 44);
                    pdfDoc.setLineWidth(1);
                    pdfDoc.line(margin, 75, pageWidth - margin, 75);
                }
            };

            const addFooter = (pdfDoc: jsPDF, pageNum: number) => {
                pdfDoc.setFontSize(8);
                pdfDoc.setTextColor(150, 150, 150);
                pdfDoc.text(`Página ${pageNum} - Gerado pelo MusiClass Manager`, pageWidth / 2, pageHeight - 10, { align: "center" });
            };

            addHeader(doc);
            
            // Content
            doc.setTextColor(60, 36, 21);
            doc.setFontSize(11);
            doc.setFont("helvetica", "normal");
            
            const splitContent = doc.splitTextToSize(topic.content_text || "Sem conteúdo cadastrado.", contentWidth);
            
            let currentPage = 1;
            splitContent.forEach((line: string) => {
                if (cursorY > pageHeight - 25) {
                    addFooter(doc, currentPage);
                    doc.addPage();
                    currentPage++;
                    cursorY = 55; // Start lower on new pages to leave room for header
                    addHeader(doc);
                    doc.setTextColor(60, 36, 21);
                    doc.setFontSize(11);
                    doc.setFont("helvetica", "normal");
                }
                doc.text(line, margin, cursorY);
                cursorY += 7; // Line height
            });
            
            addFooter(doc, currentPage);
            
            doc.save(`Materia_${topic.title?.replace(/\s+/g, '_')}.pdf`);
            showToast("PDF Gerado!", "success");
        } catch (e) {
            console.error(e);
            showToast("Erro ao gerar PDF.", "error");
        }
    };

    const handleSaveTopic = async () => {
        if (!editingTopic?.title || editingTopic.month_index === undefined) return;
        setLoading(true);
        try {
            await saveCurriculumTopic(editingTopic, activeGroup, currentUser.id);
            setEditingTopic(null);
            loadTopics();
            showToast("Matéria salva!", "success");
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
            showToast("Erro ao excluir.", "error");
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
                setEditingTopic({ ...editingTopic, quiz_json: [...(editingTopic.quiz_json || []), ...parsedQuiz] });
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
                try { await navigator.clipboard.writeText(link); showToast("Link copiado!", "success"); }
                catch (e) {
                    const textArea = document.createElement("textarea");
                    textArea.value = link; document.body.appendChild(textArea);
                    textArea.select(); document.execCommand('copy');
                    document.body.removeChild(textArea);
                    showToast("Link gerado!", "success");
                }
            }
        } catch (e: any) { showToast("Erro: " + e.message, "error"); }
        finally { setIsGeneratingLink(false); }
    };

    const eligibleStudents = students.filter(s => getInstrumentGroup(s.instrument) === activeGroup);
    const isEditable = editingTopic && (currentUser.role === 'director' || (editingTopic.month_index === 0 && editingTopic.creator_id === currentUser.id));

    return (
        <div className="max-w-6xl mx-auto space-y-6 md:space-y-8 animate-fade-in pb-20 pt-2 lg:pt-0">
            {!forceGroup && (
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-6 px-1">
                    <div>
                        <h2 className="text-3xl md:text-5xl font-black text-[#3C2415] tracking-tighter uppercase leading-none">Grade Master</h2>
                        <p className="text-stone-400 font-bold text-[10px] md:text-xs uppercase tracking-widest mt-1 md:mt-2">Biblioteca Pedagógica</p>
                    </div>
                    <button
                        onClick={() => setEditingTopic({ title: '', month_index: 0, content_text: '', quiz_json: [], creator_id: currentUser.id } as any)}
                        className="w-full md:w-auto px-6 py-4 bg-[#1A110D] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-orange-600 transition-all shadow-xl shadow-orange-500/10 flex items-center justify-center gap-2"
                    >
                        <Plus className="w-4 h-4" /> Novo Tópico
                    </button>
                </header>
            )}

            {!forceGroup && (
                <div className="flex flex-wrap gap-2 p-1 bg-[#FBF6F0] rounded-[24px] w-fit">
                    {(['harmono_melodico', 'percussao', 'vocal'] as InstrumentGroup[]).map(group => (
                        <button
                            key={group}
                            onClick={() => setActiveGroup(group)}
                            className={`px-5 py-3 rounded-2xl font-black text-[9px] md:text-[10px] uppercase tracking-widest transition-all ${activeGroup === group ? 'bg-[#1A110D] text-white shadow-xl' : 'text-[#3C2415]/30 hover:text-[#3C2415]'}`}
                        >
                            {group.replace('_', ' ')}
                        </button>
                    ))}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                {topics.map(topic => (
                    <div key={topic.id} className="bg-white rounded-[40px] md:rounded-[48px] p-8 md:p-10 border border-[#3C2415]/5 shadow-sm group hover:shadow-xl transition-all h-full flex flex-col">
                        <div className="flex justify-between items-start mb-6">
                            <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center font-black text-lg md:text-xl shadow-lg ${topic.month_index === 0 ? 'bg-stone-900 text-yellow-500' : 'bg-[#E87A2C] text-white'}`}>
                                {topic.month_index === 0 ? <Star className="w-5 h-5 fill-current" /> : topic.month_index}
                            </div>
                            {(currentUser.role === 'director' || topic.creator_id === currentUser.id) && (
                                <div className="flex gap-2">
                                    <button onClick={() => setEditingTopic(topic)} className="p-2.5 bg-[#FBF6F0] rounded-xl hover:bg-orange-50 text-stone-400 hover:text-[#E87A2C] transition-all"><Edit3 className="w-5 h-5" /></button>
                                    <button onClick={() => deleteTopic(topic.id)} className="p-2.5 bg-[#FBF6F0] rounded-xl hover:bg-rose-50 text-stone-300 hover:text-rose-500 transition-all"><Trash2 className="w-5 h-5" /></button>
                                </div>
                            )}
                        </div>
                        <h3 className="text-xl md:text-2xl font-black text-[#3C2415] uppercase tracking-tighter mb-2 line-clamp-2 min-h-[3rem]">{topic.title}</h3>
                        <p className="text-[10px] text-stone-300 font-bold uppercase tracking-widest mb-6">Módulo {activeGroup.split('_')[0]} • {topic.quiz_json?.length || 0} Questões</p>
                        
                        <div className="mt-auto flex flex-col gap-2">
                            <button onClick={() => { setEditingTopic(topic); setIsContentExpanded(false); }} className="w-full py-4 bg-[#FBF6F0] hover:bg-[#1A110D] hover:text-white rounded-2xl font-black text-[9px] md:text-[10px] uppercase tracking-widest transition-all">Ver Detalhes</button>
                            {onSelectTopic && (
                                <button onClick={() => onSelectTopic(topic)} className="w-full py-4 bg-[#E87A2C] text-white rounded-2xl font-black text-[9px] md:text-[10px] uppercase tracking-widest transition-all">Aplicar na Aula</button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {editingTopic && (
                <div className="fixed inset-0 bg-[#000000]/80 backdrop-blur-sm z-[600] flex items-end md:items-center justify-center p-0 md:p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-t-[40px] md:rounded-[48px] w-full max-w-4xl h-[92vh] md:h-auto md:max-h-[90vh] shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom duration-500">
                        <header className="p-6 md:p-10 border-b border-[#3C2415]/5 flex justify-between items-center shrink-0">
                            <div>
                                <h3 className="text-xl md:text-3xl font-black text-[#3C2415] tracking-tighter uppercase">{isEditable ? 'Editar' : 'Detalhes'}</h3>
                                <p className="text-[9px] md:text-[10px] font-black text-[#E87A2C] uppercase tracking-widest mt-1">{activeGroup.replace('_', ' ')} • Mes {editingTopic.month_index}</p>
                            </div>
                            <button onClick={() => setEditingTopic(null)} className="p-3 bg-[#FBF6F0] rounded-2xl hover:bg-rose-50 hover:text-rose-500 transition-all"><X className="w-6 h-6" /></button>
                        </header>

                        <div className="flex-grow overflow-y-auto custom-scrollbar">
                            <div className="p-6 md:p-10 space-y-8 pb-32">
                                {!isEditable ? (
                                    <div className="space-y-6">
                                        <h2 className="text-3xl md:text-5xl font-black text-[#3C2415] uppercase tracking-tighter leading-none">{editingTopic.title}</h2>
                                        
                                        <div className="flex gap-4">
                                            <button onClick={() => handleDownloadPDF(editingTopic)} className="flex items-center gap-2 px-6 py-3 bg-emerald-50 text-emerald-600 rounded-2xl font-black text-[9px] uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all">
                                                <Download className="w-4 h-4" /> Baixar Resumo PDF
                                            </button>
                                        </div>

                                        <div className="bg-[#FBF6F0] rounded-[32px] overflow-hidden border border-[#3C2415]/5">
                                            <div className={`p-6 md:p-10 text-stone-700 font-medium leading-relaxed whitespace-pre-wrap text-base md:text-xl ${!isContentExpanded ? 'max-h-[200px] overflow-hidden relative' : ''}`}>
                                                {editingTopic.content_text || 'Sem conteúdo.'}
                                                {!isContentExpanded && <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#FBF6F0] to-transparent" />}
                                            </div>
                                            <button onClick={() => setIsContentExpanded(!isContentExpanded)} className="w-full py-5 bg-white/50 border-t border-[#3C2415]/5 text-[10px] font-black uppercase tracking-[0.2em] text-[#E87A2C] flex items-center justify-center gap-2 hover:bg-white transition-all">
                                                {isContentExpanded ? <><ChevronUp className="w-4 h-4"/> Recolher</> : <><ChevronDown className="w-4 h-4"/> Expandir Leitura</>}
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                        <div className="col-span-1">
                                            <label className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-2 block">Mês</label>
                                            <input type="number" value={editingTopic.month_index || ''} onChange={e => setEditingTopic({ ...editingTopic, month_index: parseInt(e.target.value) })} className="w-full bg-[#FBF6F0] border-none rounded-2xl p-4 font-bold" />
                                        </div>
                                        <div className="md:col-span-3">
                                            <label className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-2 block">Título</label>
                                            <input value={editingTopic.title || ''} onChange={e => setEditingTopic({ ...editingTopic, title: e.target.value })} className="w-full bg-[#FBF6F0] border-none rounded-2xl p-4 font-bold text-lg" />
                                        </div>
                                        <div className="md:col-span-4">
                                            <label className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-2 block">Texto da Matéria</label>
                                            <textarea rows={8} value={editingTopic.content_text || ''} onChange={e => setEditingTopic({ ...editingTopic, content_text: e.target.value })} className="w-full bg-[#FBF6F0] border-none rounded-3xl p-6 font-bold text-base" />
                                        </div>
                                    </div>
                                )}

                                {editingTopic.id && (
                                    <div className="bg-[#E87A2C]/5 p-6 md:p-8 rounded-[40px] border border-[#E87A2C]/10 space-y-6">
                                        <div className="flex flex-col gap-6">
                                            <div className="flex items-center gap-4">
                                                <div className="p-3 bg-white rounded-2xl text-[#E87A2C] shadow-sm"><UserPlus className="w-6 h-6" /></div>
                                                <div>
                                                    <h4 className="font-black text-[#3C2415] uppercase tracking-tighter">Gerar Quiz Link</h4>
                                                    <p className="text-[9px] text-stone-400 font-bold uppercase tracking-widest">Selecione o aluno abaixo</p>
                                                </div>
                                            </div>
                                            <div className="flex flex-col md:flex-row gap-4">
                                                <select value={selectedStudentId} onChange={e => setSelectedStudentId(e.target.value)} className="flex-grow bg-white border-none rounded-2xl p-4 font-bold text-sm shadow-sm">
                                                    <option value="">Escolha o Aluno...</option>
                                                    {eligibleStudents.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                                </select>
                                                <button onClick={handleGenerateQuizLink} disabled={!selectedStudentId || isGeneratingLink} className="px-10 py-4 bg-[#E87A2C] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest disabled:opacity-30">
                                                    {isGeneratingLink ? 'AGUARDE...' : 'GERAR E COPIAR'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-8">
                                    <div className="flex justify-between items-center">
                                        <h4 className="text-xl md:text-2xl font-black text-[#3C2415] uppercase tracking-tighter flex items-center gap-3"><HelpCircle className="w-6 h-6 text-[#E87A2C]" /> Quiz e Exercícios</h4>
                                        {isEditable && <button onClick={() => setEditingTopic({ ...editingTopic, quiz_json: [...(editingTopic.quiz_json || []), { question: '', options: ['', '', '', ''], correctIndex: 0 }] })} className="px-5 py-3 bg-[#1A110D] text-white rounded-xl font-black text-[9px] uppercase tracking-widest">+ Pergunta</button>}
                                    </div>
                                    
                                    <div className="space-y-4">
                                        {editingTopic.quiz_json?.map((q, qIdx) => (
                                            <div key={qIdx} className="bg-[#FBF6F0]/50 p-6 md:p-8 rounded-[32px] border border-[#3C2415]/5 space-y-4">
                                                {isEditable ? (
                                                    <input value={q.question} onChange={e => {
                                                        const newList = [...(editingTopic.quiz_json || [])];
                                                        newList[qIdx].question = e.target.value; setEditingTopic({ ...editingTopic, quiz_json: newList });
                                                    }} placeholder="Pergunta..." className="w-full bg-white border-none rounded-xl p-4 font-bold text-sm" />
                                                ) : <h5 className="font-black text-[#3C2415] text-lg">{qIdx + 1}. {q.question}</h5>}
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    {q.options.map((opt, oIdx) => (
                                                        <div key={oIdx} className={`flex items-center gap-3 p-4 rounded-xl border ${q.correctIndex === oIdx ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-[#3C2415]/5'}`}>
                                                            {isEditable ? <input type="radio" checked={q.correctIndex === oIdx} onChange={() => {
                                                                const newList = [...(editingTopic.quiz_json || [])];
                                                                newList[qIdx].correctIndex = oIdx; setEditingTopic({ ...editingTopic, quiz_json: newList });
                                                            }} className="accent-[#E87A2C]" /> : <div className={`w-3 h-3 rounded-full ${q.correctIndex === oIdx ? 'bg-emerald-500' : 'bg-stone-200'}`} />}
                                                            {isEditable ? <input value={opt} onChange={e => {
                                                                const newList = [...(editingTopic.quiz_json || [])];
                                                                newList[qIdx].options[oIdx] = e.target.value; setEditingTopic({ ...editingTopic, quiz_json: newList });
                                                            }} className="flex-grow bg-transparent text-xs font-bold border-none" /> : <span className="text-xs font-bold text-stone-600">{opt}</span>}
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
                            <footer className="p-6 md:p-10 border-t border-[#3C2415]/5 bg-[#FBF6F0]/50 shrink-0">
                                <button onClick={handleSaveTopic} disabled={loading} className="w-full py-6 bg-[#1A110D] text-white rounded-2xl font-black uppercase tracking-[0.2em] shadow-2xl">
                                    {loading ? 'SALVANDO...' : 'SALVAR ALTERAÇÕES'}
                                </button>
                            </footer>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
