import React, { useState, useRef, useEffect } from 'react';
import { Pencil, Square, Type, Eraser, Trash2, Download, Undo } from 'lucide-react';
import jsPDF from 'jspdf';

export const Whiteboard: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [color, setColor] = useState('#1A110D');
    const [brushSize, setBrushSize] = useState(3);
    const [tool, setTool] = useState<'pencil' | 'eraser'>('pencil');
    const [history, setHistory] = useState<string[]>([]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Setup canvas size
        const parent = canvas.parentElement;
        if (parent) {
            canvas.width = parent.clientWidth;
            canvas.height = parent.clientHeight;
        }

        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Save initial state
        setHistory([canvas.toDataURL()]);
    }, []);

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        setIsDrawing(true);
        draw(e);
    };

    const stopDrawing = () => {
        if (isDrawing) {
            saveToHistory();
        }
        setIsDrawing(false);
        const ctx = canvasRef.current?.getContext('2d');
        ctx?.beginPath();
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing || !canvasRef.current) return;
        const ctx = canvasRef.current.getContext('2d');
        if (!ctx) return;

        const rect = canvasRef.current.getBoundingClientRect();
        let clientX, clientY;

        if ('touches' in e) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }

        ctx.lineWidth = brushSize;
        ctx.strokeStyle = tool === 'eraser' ? '#FFFFFF' : color;

        ctx.lineTo(clientX - rect.left, clientY - rect.top);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(clientX - rect.left, clientY - rect.top);
    };

    const saveToHistory = () => {
        if (canvasRef.current) {
            const newHistory = [...history, canvasRef.current.toDataURL()].slice(-20);
            setHistory(newHistory);
        }
    };

    const undo = () => {
        if (history.length <= 1) return;
        const prev = history[history.length - 2];
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (canvas && ctx && prev) {
            const img = new Image();
            img.src = prev;
            img.onload = () => {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0);
            };
            setHistory(history.slice(0, -1));
        }
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (canvas && ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            saveToHistory();
        }
    };

    const exportToPDF = () => {
        if (!canvasRef.current) return;
        const imgData = canvasRef.current.toDataURL('image/png');
        const pdf = new jsPDF({
            orientation: 'landscape',
            unit: 'px',
            format: [canvasRef.current.width, canvasRef.current.height]
        });
        pdf.addImage(imgData, 'PNG', 0, 0, canvasRef.current.width, canvasRef.current.height);
        pdf.save(`aula-notas-${new Date().getTime()}.pdf`);
    };

    return (
        <div className="flex flex-col h-full space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-stone-100">
                <div className="flex gap-2">
                    <button
                        onClick={() => setTool('pencil')}
                        className={`p-3 rounded-xl transition-all ${tool === 'pencil' ? 'bg-[#E87A2C] text-white shadow-lg shadow-orange-500/20' : 'bg-white text-stone-400 border border-stone-200 hover:bg-stone-50'}`}
                    >
                        <Pencil className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => setTool('eraser')}
                        className={`p-3 rounded-xl transition-all ${tool === 'eraser' ? 'bg-[#E87A2C] text-white shadow-lg shadow-orange-500/20' : 'bg-white text-stone-400 border border-stone-200 hover:bg-stone-50'}`}
                    >
                        <Eraser className="w-5 h-5" />
                    </button>
                    <div className="w-px h-10 bg-stone-100 mx-2" />
                    <button
                        onClick={undo}
                        className="p-3 bg-white text-stone-400 border border-stone-200 rounded-xl hover:bg-stone-50"
                    >
                        <Undo className="w-5 h-5" />
                    </button>
                    <button
                        onClick={clearCanvas}
                        className="p-3 bg-white text-stone-400 border border-stone-200 rounded-xl hover:text-red-500 hover:bg-red-50"
                    >
                        <Trash2 className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex gap-2 bg-white p-1.5 rounded-xl border border-stone-200 shadow-sm">
                        {['#1A110D', '#E87A2C', '#EF4444', '#3B82F6', '#10B981'].map(c => (
                            <button
                                key={c}
                                onClick={() => { setColor(c); setTool('pencil'); }}
                                className={`w-6 h-6 rounded-full transition-transform ${color === c && tool === 'pencil' ? 'scale-125 ring-2 ring-stone-200 ring-offset-2' : ''}`}
                                style={{ backgroundColor: c }}
                            />
                        ))}
                    </div>
                    <button
                        onClick={exportToPDF}
                        className="flex items-center gap-2 px-5 py-3 bg-[#1A110D] text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-stone-800 transition-all shadow-lg"
                    >
                        <Download className="w-4 h-4" />
                        Exportar PDF
                    </button>
                </div>
            </div>

            <div className="flex-grow bg-white rounded-3xl border border-stone-100 shadow-inner overflow-hidden relative cursor-crosshair">
                <canvas
                    ref={canvasRef}
                    onMouseDown={startDrawing}
                    onMouseUp={stopDrawing}
                    onMouseMove={draw}
                    onMouseOut={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchEnd={stopDrawing}
                    onTouchMove={draw}
                    className="absolute inset-0 w-full h-full touch-none"
                />
            </div>
        </div>
    );
};
