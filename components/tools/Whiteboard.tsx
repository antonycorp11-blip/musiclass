import React, { useState, useRef, useEffect } from 'react';
import { Pencil, Eraser, Trash2, Download, Undo, Minus, Plus } from 'lucide-react';
import jsPDF from 'jspdf';

export const Whiteboard: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [color, setColor] = useState('#1A110D');
    const [brushSize, setBrushSize] = useState(4);
    const [tool, setTool] = useState<'pencil' | 'eraser'>('pencil');
    const [history, setHistory] = useState<string[]>([]);

    useEffect(() => {
        const resizeCanvas = () => {
            const canvas = canvasRef.current;
            const container = containerRef.current;
            if (!canvas || !container) return;

            // Store current content
            const temp = canvas.toDataURL();

            canvas.width = container.clientWidth;
            canvas.height = container.clientHeight;

            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                // Restore content
                const img = new Image();
                img.src = temp;
                img.onload = () => ctx.drawImage(img, 0, 0);
            }
        };

        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        // Initial history
        if (canvasRef.current) setHistory([canvasRef.current.toDataURL()]);

        return () => window.removeEventListener('resize', resizeCanvas);
    }, []);

    const getPos = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();

        let clientX, clientY;
        if ('touches' in e) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = (e as MouseEvent).clientX;
            clientY = (e as MouseEvent).clientY;
        }

        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    };

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        const ctx = canvasRef.current?.getContext('2d');
        if (!ctx) return;

        setIsDrawing(true);
        const { x, y } = getPos(e);
        ctx.beginPath();
        ctx.moveTo(x, y);
    };

    const stopDrawing = () => {
        if (isDrawing) {
            saveToHistory();
        }
        setIsDrawing(false);
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing || !canvasRef.current) return;
        const ctx = canvasRef.current.getContext('2d');
        if (!ctx) return;

        // Prevent scrolling on touch
        if (e.cancelable) e.preventDefault();

        const { x, y } = getPos(e);

        ctx.lineWidth = brushSize;
        ctx.strokeStyle = tool === 'eraser' ? '#FFFFFF' : color;

        ctx.lineTo(x, y);
        ctx.stroke();
    };

    const saveToHistory = () => {
        if (canvasRef.current) {
            const dataUrl = canvasRef.current.toDataURL();
            setHistory(prev => [...prev, dataUrl].slice(-20));
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
            setHistory(prevH => prevH.slice(0, -1));
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
        pdf.save(`quadro-aula-${new Date().getTime()}.pdf`);
    };

    return (
        <div ref={containerRef} className="relative w-full h-full bg-white rounded-[40px] shadow-2xl overflow-hidden border border-stone-100 group">
            {/* Canvas Area */}
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

            {/* Floating Top Controls */}
            <div className="absolute top-6 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-[#1A110D]/90 backdrop-blur-md p-3 rounded-[28px] border border-white/5 shadow-2xl opacity-40 hover:opacity-100 transition-opacity duration-300">
                <div className="flex gap-2 bg-white/5 p-1 rounded-2xl">
                    <button
                        onClick={() => setTool('pencil')}
                        className={`p-3 rounded-xl transition-all ${tool === 'pencil' ? 'bg-[#E87A2C] text-white' : 'text-stone-400 hover:text-white'}`}
                    >
                        <Pencil className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => setTool('eraser')}
                        className={`p-3 rounded-xl transition-all ${tool === 'eraser' ? 'bg-[#E87A2C] text-white' : 'text-stone-400 hover:text-white'}`}
                    >
                        <Eraser className="w-5 h-5" />
                    </button>
                </div>

                <div className="h-6 w-px bg-white/10" />

                <div className="flex gap-2">
                    {['#1A110D', '#E87A2C', '#EF4444', '#3B82F6'].map(c => (
                        <button
                            key={c}
                            onClick={() => { setColor(c); setTool('pencil'); }}
                            className={`w-8 h-8 rounded-full border-2 transition-transform ${color === c && tool === 'pencil' ? 'scale-110 border-white' : 'border-transparent opacity-50'}`}
                            style={{ backgroundColor: c }}
                        />
                    ))}
                </div>

                <div className="h-6 w-px bg-white/10" />

                <div className="flex items-center gap-4 text-white">
                    <button onClick={() => setBrushSize(prev => Math.max(1, prev - 1))} className="p-1 hover:text-[#E87A2C]"><Minus className="w-4 h-4" /></button>
                    <span className="text-[10px] font-black w-4 text-center">{brushSize}</span>
                    <button onClick={() => setBrushSize(prev => Math.min(20, prev + 1))} className="p-1 hover:text-[#E87A2C]"><Plus className="w-4 h-4" /></button>
                </div>
            </div>

            {/* Bottom Right Actions */}
            <div className="absolute bottom-6 right-6 flex flex-col gap-3 items-end">
                <div className="flex gap-2">
                    <button
                        onClick={undo}
                        className="p-4 bg-white shadow-xl rounded-2xl text-stone-600 border border-stone-100 hover:bg-stone-50 transition-all hover:-translate-y-1"
                    >
                        <Undo className="w-5 h-5" />
                    </button>
                    <button
                        onClick={clearCanvas}
                        className="p-4 bg-white shadow-xl rounded-2xl text-red-500 border border-stone-100 hover:bg-red-50 transition-all hover:-translate-y-1"
                    >
                        <Trash2 className="w-5 h-5" />
                    </button>
                </div>

                <button
                    onClick={exportToPDF}
                    className="flex items-center gap-3 px-8 py-5 bg-[#E87A2C] text-white rounded-[24px] font-black text-xs uppercase tracking-widest shadow-2xl shadow-orange-500/30 hover:shadow-orange-500/50 transition-all hover:-translate-y-1 active:scale-95"
                >
                    <Download className="w-5 h-5" />
                    Salvar Quadro em PDF
                </button>
            </div>

            {/* Legend */}
            <div className="absolute bottom-6 left-6 pointer-events-none">
                <span className="text-[8px] font-black text-stone-300 uppercase tracking-widest bg-stone-50/50 backdrop-blur-sm px-3 py-1.5 rounded-full border border-stone-100">
                    MusiClass Vision Board v2
                </span>
            </div>
        </div>
    );
};
