
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import {
    BookOpen, Plus, Trash2, Edit3,
    HelpCircle, Download, X, Star, ChevronDown, ChevronUp, UserPlus
} from 'lucide-react';
import { CurriculumTopic, InstrumentGroup, Teacher, Student } from '../../types';
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
    const [isContentExpanded, setIsContentExpanded] = useState(false);
    const [selectedStudentId, setSelectedStudentId] = useState('');
    const [isGeneratingLink, setIsGeneratingLink] = useState(false);
    const [generatedLink, setGeneratedLink] = useState<string | null>(null);

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

    useEffect(() => {
        setGeneratedLink(null);
        setSelectedStudentId('');
    }, [editingTopic?.id]);

    const handleDownloadPDF = async (topic: Partial<CurriculumTopic>) => {
        try {
            const html2canvas = (await import('html2canvas')).default;
            
            const container = document.createElement('div');
            container.id = 'pdf-render-container';
            container.style.position = 'absolute';
            container.style.top = '0';
            container.style.left = '-10000px'; // Far off screen but in visible DOM
            container.style.width = '794px'; // A4 width at 96 DPI
            container.style.backgroundColor = '#FBF6F0';
            container.style.color = '#1A110D';
            container.style.fontFamily = "'Inter', sans-serif";
            container.style.visibility = 'visible';
            
            container.innerHTML = `
                <div style="background: #1A110D; padding: 60px 60px; border-bottom: 12px solid #E87A2C; display: flex; align-items: center; justify-content: space-between;">
                    <div style="display: flex; flex-direction: column;">
                         <h1 style="color: white; font-weight: 950; font-size: 40px; margin: 0; letter-spacing: -2px; line-height: 0.9;">MUSICLASS</h1>
                         <p style="color: #E87A2C; font-weight: 800; font-size: 11px; margin: 10px 0 0 0; text-transform: uppercase; letter-spacing: 5px;">Studio de Música & Arte</p>
                    </div>
                    <img src="${window.location.origin}/Logo-Laranja.png" style="height: 70px;" id="pdf-logo" />
                </div>
                
                <div style="padding: 60px 80px;">
                    <div style="margin-bottom: 50px;">
                        <h2 style="font-size: 12px; font-weight: 950; color: #E87A2C; margin-bottom: 15px; text-transform: uppercase; letter-spacing: 3px;">MODULO ${activeGroup.replace('_', ' ').toUpperCase()}</h2>
                        <h1 style="font-size: 44px; font-weight: 950; color: #1A110D; margin: 0; text-transform: uppercase; line-height: 1.1; letter-spacing: -2px;">${topic.title || 'Matéria'}</h1>
                        <div style="margin-top: 30px; height: 6px; width: 80px; background: #E87A2C;"></div>
                    </div>
                    
                    <div style="font-size: 20px; line-height: 1.8; color: #3C2415; white-space: pre-wrap; font-weight: 600;" id="pdf-body-text">
${topic.content_text || 'Sem conteúdo cadastrado.'}
                    </div>
                    
                    <div style="margin-top: 80px; border-top: 2px solid #E87A2C22; padding-top: 40px; text-align: center;">
                        <p style="font-size: 12px; font-weight: 900; color: #1A110D; opacity: 0.3; text-transform: uppercase; letter-spacing: 2px;">Documento Oficial MusiClass • Emitido em ${new Date().toLocaleDateString()}</p>
                    </div>
                </div>
            `;
            
            document.body.appendChild(container);
            
            const logo = container.querySelector('#pdf-logo') as HTMLImageElement;
            if (logo) {
                await new Promise((resolve) => {
                    if (logo.complete) resolve(true);
                    logo.onload = () => resolve(true);
                    logo.onerror = () => resolve(true);
                    setTimeout(resolve, 2000);
                });
            }

            // Force browser to layout
            container.offsetHeight; 
            await new Promise(r => setTimeout(r, 1000));
            
            const canvas = await html2canvas(container, {
                scale: 2,
                useCORS: true,
                allowTaint: true,
                backgroundColor: '#FBF6F0',
                logging: false,
                width: 794
            });
            
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            
            const imgProps = pdf.getImageProperties(imgData);
            const imgActualHeight = (imgProps.height * pdfWidth) / imgProps.width;
            
            let heightLeft = imgActualHeight;
            let position = 0;
            const pageMargin = 5; // Smarter margin to avoid cutting lines

            pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgActualHeight, undefined, 'FAST');
            heightLeft -= (pdfHeight - pageMargin);

            while (heightLeft > 0) {
                position = heightLeft - imgActualHeight + pageMargin;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgActualHeight, undefined, 'FAST');
                heightLeft -= (pdfHeight - pageMargin);
            }
            
            document.body.removeChild(container);
            pdf.save(`Materia_${topic.title?.replace(/\s+/g, '_')}.pdf`);
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

    const handleGenerateQuizLink = async () => {
        if (!selectedStudentId || !editingTopic?.id) {
            showToast("Selecione um aluno primeiro!", "error");
            return;
        }
        
        setIsGeneratingLink(true);
        setGeneratedLink(null);
        try {
            const token = await applyTopicToStudent(selectedStudentId, editingTopic.id, currentUser.id);
            
            if (token) {
                const link = `${window.location.origin}/?quiz=${token}`;
                setGeneratedLink(link);
                
                try {
                    await navigator.clipboard.writeText(link);
                    showToast("Sucesso! Link copiado para o WhatsApp.", "success");
                } catch (err) {
                    const textArea = document.createElement("textarea");
                    textArea.value = link;
                    textArea.style.position = "fixed";
                    textArea.style.left = "-9999px";
                    textArea.style.top = "0";
                    document.body.appendChild(textArea);
                    textArea.focus();
                    textArea.select();
                    try {
                        document.execCommand('copy');
                        showToast("Sucesso! Link gerado.", "success");
                    } catch (copyErr) {
                        console.error("Falha ao copiar:", copyErr);
                    }
                    document.body.removeChild(textArea);
                }
            } else {
                throw new Error("Falha ao gerar o código da aula.");
            }
        } catch (e: any) { 
            console.error(e);
            showToast("Erro ao gerar link: " + e.message, "error"); 
        } finally { 
            setIsGeneratingLink(false); 
        }
    };

    const eligibleStudents = students.filter(s => getInstrumentGroup(s.instrument) === activeGroup);
    const isEditable = editingTopic && (currentUser.role === 'director' || (editingTopic.month_index === 0 && editingTopic.creator_id === currentUser.id));

    return (
        <div className="max-w-6xl mx-auto animate-fade-in pb-20 pt-0">
            {!forceGroup && (
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-6 px-1 mb-8 text-[#1A110D]">
                    <div>
                        <h2 className="text-4xl md:text-5xl font-black tracking-tighter uppercase leading-none">Grade Master</h2>
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
                <div className="flex flex-wrap gap-2 p-1 bg-[#FBF6F0] rounded-[24px] w-fit mb-8 border border-[#3C2415]/5">
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
                <div className="fixed inset-0 bg-[#1A110D]/70 backdrop-blur-md z-[600] flex items-end md:items-center justify-center p-0 md:p-4 animate-in fade-in duration-300">
                    <div className="bg-[#FBF6F0] rounded-t-[32px] md:rounded-[40px] w-full max-w-4xl h-full md:h-[90vh] shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-full duration-500 text-[#1A110D]">
                        <header className="p-6 md:p-10 border-b border-[#3C2415]/5 flex justify-between items-center shrink-0">
                            <div>
                                <h3 className="text-xl md:text-3xl font-black tracking-tighter uppercase">{isEditable ? 'Editar' : 'Detalhes'}</h3>
                                <p className="text-[9px] md:text-[10px] font-black text-[#E87A2C] uppercase tracking-widest mt-1">{activeGroup.replace('_', ' ')} • Mes {editingTopic.month_index}</p>
                            </div>
                            <button onClick={() => setEditingTopic(null)} className="p-3 bg-white rounded-2xl hover:bg-rose-50 hover:text-rose-500 transition-all shadow-sm"><X className="w-6 h-6" /></button>
                        </header>

                        <div className="flex-grow overflow-y-auto custom-scrollbar">
                            <div className="p-6 md:p-10 space-y-8 pb-32">
                                {!isEditable ? (
                                    <div className="space-y-6">
                                        <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter leading-none">{editingTopic.title}</h2>
                                        
                                        <div className="flex gap-4">
                                            <button onClick={() => handleDownloadPDF(editingTopic)} className="flex items-center gap-2 px-6 py-3 bg-emerald-50 text-emerald-600 rounded-2xl font-black text-[9px] uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all">
                                                <Download className="w-4 h-4" /> Baixar Resumo PDF
                                            </button>
                                        </div>

                                        <div className="bg-white rounded-[32px] overflow-hidden border border-[#3C2415]/5 shadow-sm">
                                            <div className={`p-6 md:p-10 text-stone-700 font-medium leading-relaxed whitespace-pre-wrap text-base md:text-xl ${!isContentExpanded ? 'max-h-[200px] overflow-hidden relative' : ''}`}>
                                                {editingTopic.content_text || 'Sem conteúdo.'}
                                                {!isContentExpanded && <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent" />}
                                            </div>
                                            <button onClick={() => setIsContentExpanded(!isContentExpanded)} className="w-full py-5 bg-stone-50 border-t border-[#3C2415]/5 text-[10px] font-black uppercase tracking-[0.2em] text-[#E87A2C] flex items-center justify-center gap-2 hover:bg-white transition-all">
                                                {isContentExpanded ? <><ChevronUp className="w-4 h-4"/> Recolher</> : <><ChevronDown className="w-4 h-4"/> Expandir Leitura</>}
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                        <div className="col-span-1">
                                            <label className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-2 block">Mês</label>
                                            <input type="number" value={editingTopic.month_index || ''} onChange={e => setEditingTopic({ ...editingTopic, month_index: parseInt(e.target.value) })} className="w-full bg-white border-none rounded-2xl p-4 font-bold shadow-sm" />
                                        </div>
                                        <div className="md:col-span-3">
                                            <label className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-2 block">Título</label>
                                            <input value={editingTopic.title || ''} onChange={e => setEditingTopic({ ...editingTopic, title: e.target.value })} className="w-full bg-white border-none rounded-2xl p-4 font-bold text-lg shadow-sm" />
                                        </div>
                                        <div className="md:col-span-4">
                                            <label className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-2 block">Texto da Matéria</label>
                                            <textarea rows={8} value={editingTopic.content_text || ''} onChange={e => setEditingTopic({ ...editingTopic, content_text: e.target.value })} className="w-full bg-white border-none rounded-3xl p-6 font-bold text-base shadow-sm" />
                                        </div>
                                    </div>
                                )}

                                {editingTopic.id && (
                                    <div className="bg-[#E87A2C]/5 p-6 md:p-8 rounded-[40px] border border-[#E87A2C]/10 space-y-6">
                                        <div className="flex flex-col gap-6">
                                            <div className="flex items-center gap-4">
                                                <div className="p-3 bg-white rounded-2xl text-[#E87A2C] shadow-sm"><UserPlus className="w-6 h-6" /></div>
                                                <div>
                                                    <h4 className="font-black uppercase tracking-tighter">Gerar Quiz Link</h4>
                                                    <p className="text-[9px] text-stone-400 font-bold uppercase tracking-widest">Selecione o aluno abaixo</p>
                                                </div>
                                            </div>
                                            <div className="flex flex-col md:flex-row gap-4">
                                                <select value={selectedStudentId} onChange={e => setSelectedStudentId(e.target.value)} className="flex-grow bg-white border-none rounded-2xl p-4 font-bold text-sm shadow-sm">
                                                    <option value="">Escolha o Aluno...</option>
                                                    {eligibleStudents.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                                </select>
                                                <button onClick={handleGenerateQuizLink} disabled={!selectedStudentId || isGeneratingLink} className="px-10 py-4 bg-[#E87A2C] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest disabled:opacity-30 shadow-lg">
                                                    {isGeneratingLink ? 'AGUARDE...' : 'GERAR E COPIAR'}
                                                </button>
                                            </div>
                                            {generatedLink && (
                                                <div className="bg-emerald-500/10 p-6 rounded-3xl border border-emerald-500/20 animate-in zoom-in duration-300">
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-2">Link Gerado com Sucesso:</p>
                                                    <div className="flex items-center gap-3">
                                                        <code className="flex-grow text-[9px] font-mono font-bold bg-white p-3 rounded-xl border border-emerald-500/10 break-all">{generatedLink}</code>
                                                        <button 
                                                            onClick={() => {
                                                                navigator.clipboard.writeText(generatedLink);
                                                                showToast("Copiado!", "success");
                                                            }}
                                                            className="p-3 bg-emerald-500 text-white rounded-xl shadow-lg hover:scale-105 transition-transform"
                                                        >
                                                            <Plus className="w-5 h-5 rotate-45" /> {/* Use X or check, or just copy icon */}
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-8">
                                    <div className="flex justify-between items-center">
                                        <h4 className="text-xl md:text-2xl font-black uppercase tracking-tighter flex items-center gap-3"><HelpCircle className="w-6 h-6 text-[#E87A2C]" /> Quiz e Exercícios</h4>
                                        {isEditable && <button onClick={() => setEditingTopic({ ...editingTopic, quiz_json: [...(editingTopic.quiz_json || []), { question: '', options: ['', '', '', ''], correctIndex: 0 }] })} className="px-5 py-3 bg-[#1A110D] text-white rounded-xl font-black text-[9px] uppercase tracking-widest shadow-md">+ Pergunta</button>}
                                    </div>
                                    
                                    <div className="space-y-4">
                                        {editingTopic.quiz_json?.map((q, qIdx) => (
                                            <div key={qIdx} className="bg-white p-6 md:p-8 rounded-[32px] border border-[#3C2415]/5 space-y-4 shadow-sm">
                                                {isEditable ? (
                                                    <input value={q.question} onChange={e => {
                                                        const newList = [...(editingTopic.quiz_json || [])];
                                                        newList[qIdx].question = e.target.value; setEditingTopic({ ...editingTopic, quiz_json: newList });
                                                    }} placeholder="Pergunta..." className="w-full bg-[#FBF6F0] border-none rounded-xl p-4 font-bold text-sm" />
                                                ) : <h5 className="font-black text-lg">{qIdx + 1}. {q.question}</h5>}
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    {q.options.map((opt, oIdx) => (
                                                        <div key={oIdx} className={`flex items-center gap-3 p-4 rounded-xl border ${q.correctIndex === oIdx ? 'bg-emerald-50 border-emerald-200' : 'bg-[#FBF6F0] border-[#3C2415]/5'}`}>
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
                            <footer className="p-6 md:p-10 border-t border-[#3C2415]/5 bg-white shrink-0">
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
