import React, { useState, useRef, useEffect } from 'react';
import { Pencil, Eraser, Trash2, Download, Undo, Minus, Plus, Maximize, GripHorizontal } from 'lucide-react';
import jsPDF from 'jspdf';

interface Point {
    x: number;
    y: number;
}

interface Stroke {
    id: number;
    points: Point[];
    color: string;
    size: number;
}

export const Whiteboard: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [color, setColor] = useState('#1A110D');
    const [brushSize, setBrushSize] = useState(6);
    const [tool, setTool] = useState<'pencil' | 'eraser'>('pencil');
    const [strokes, setStrokes] = useState<Stroke[]>([]);
    const [history, setHistory] = useState<Stroke[][]>([]);
    const [isFullscreen, setIsFullscreen] = useState(false);

    // Draggable Menu State
    const [menuPos, setMenuPos] = useState({ x: 20, y: 20 });
    const isDraggingMenu = useRef(false);
    const dragOffset = useRef({ x: 0, y: 0 });

    const currentStroke = useRef<Point[]>([]);

    useEffect(() => {
        const resizeCanvas = () => {
            const canvas = canvasRef.current;
            const container = containerRef.current;
            if (!canvas || !container) return;
            canvas.width = container.clientWidth;
            canvas.height = container.clientHeight;
            redraw();
        };

        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        return () => window.removeEventListener('resize', resizeCanvas);
    }, [strokes]);

    const redraw = () => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        strokes.forEach(stroke => {
            if (stroke.points.length < 2) return;
            ctx.beginPath();
            ctx.strokeStyle = stroke.color;
            ctx.lineWidth = stroke.size;
            ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
            for (let i = 1; i < stroke.points.length; i++) {
                ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
            }
            ctx.stroke();
        });
    };

    const getPos = (e: React.MouseEvent | React.TouchEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();

        let clientX, clientY;
        if ('touches' in e) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = (e as any).clientX;
            clientY = (e as any).clientY;
        }

        return { x: clientX - rect.left, y: clientY - rect.top };
    };

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        if (tool === 'pencil') {
            setIsDrawing(true);
            const pos = getPos(e);
            currentStroke.current = [pos];
        } else if (tool === 'eraser') {
            handleErase(e);
        }
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing || tool !== 'pencil') return;
        const pos = getPos(e);
        currentStroke.current.push(pos);

        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!ctx) return;

        ctx.strokeStyle = color;
        ctx.lineWidth = brushSize;
        ctx.lineCap = 'round';
        const lastPoints = currentStroke.current.slice(-2);
        if (lastPoints.length === 2) {
            ctx.beginPath();
            ctx.moveTo(lastPoints[0].x, lastPoints[0].y);
            ctx.lineTo(lastPoints[1].x, lastPoints[1].y);
            ctx.stroke();
        }
    };

    const stopDrawing = () => {
        if (isDrawing) {
            const newStroke: Stroke = {
                id: Date.now(),
                points: currentStroke.current,
                color,
                size: brushSize
            };
            setHistory(prev => [...prev, strokes].slice(-20));
            setStrokes(prev => [...prev, newStroke]);
            setIsDrawing(false);
            currentStroke.current = [];
        }
    };

    const handleErase = (e: React.MouseEvent | React.TouchEvent) => {
        const pos = getPos(e);
        const threshold = 15; // Deletion sensitivity

        const filteredStrokes = strokes.filter(stroke => {
            // Check if pos is near any point in the stroke
            const isNear = stroke.points.some(p => {
                const dist = Math.sqrt(Math.pow(p.x - pos.x, 2) + Math.pow(p.y - pos.y, 2));
                return dist < threshold;
            });
            return !isNear;
        });

        if (filteredStrokes.length !== strokes.length) {
            setHistory(prev => [...prev, strokes].slice(-20));
            setStrokes(filteredStrokes);
        }
    };

    const undo = () => {
        if (history.length === 0) return;
        const previous = history[history.length - 1];
        setStrokes(previous);
        setHistory(prev => prev.slice(0, -1));
    };

    const clearCanvas = () => {
        setHistory(prev => [...prev, strokes].slice(-20));
        setStrokes([]);
    };

    const exportToPDF = () => {
        if (!canvasRef.current) return;
        const imgData = canvasRef.current.toDataURL('image/png');
        const pdf = jsPDF({
            orientation: 'landscape',
            unit: 'px',
            format: [canvasRef.current.width, canvasRef.current.height]
        });
        pdf.addImage(imgData, 'PNG', 0, 0, canvasRef.current.width, canvasRef.current.height);
        pdf.save(`aula-v3-${Date.now()}.pdf`);
    };

    // DRAG LOGIC for Menu
    const onMenuMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
        isDraggingMenu.current = true;
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        dragOffset.current = {
            x: clientX - menuPos.x,
            y: clientY - menuPos.y
        };
    };

    useEffect(() => {
        const onMouseMove = (e: MouseEvent | TouchEvent) => {
            if (!isDraggingMenu.current) return;
            const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
            const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
            setMenuPos({
                x: clientX - dragOffset.current.x,
                y: clientY - dragOffset.current.y
            });
        };
        const onMouseUp = () => { isDraggingMenu.current = false; };

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
        window.addEventListener('touchmove', onMouseMove);
        window.addEventListener('touchend', onMouseUp);
        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
            window.removeEventListener('touchmove', onMouseMove);
            window.removeEventListener('touchend', onMouseUp);
        };
    }, [menuPos]);

    const toggleFullscreen = () => {
        if (!containerRef.current) return;
        if (!document.fullscreenElement) {
            containerRef.current.requestFullscreen().catch(() => { });
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    return (
        <div ref={containerRef} className={`relative w-full bg-white transition-all duration-500 overflow-hidden group ${isFullscreen ? 'h-screen' : 'h-full rounded-[48px] border border-stone-100 shadow-2xl'}`}>
            <canvas
                ref={canvasRef}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseOut={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="absolute inset-0 w-full h-full cursor-crosshair touch-none"
            />

            {/* DRAGGABLE CONTROL BAR */}
            <div
                style={{ left: menuPos.x, top: menuPos.y }}
                className="absolute z-50 flex flex-col md:flex-row items-center gap-4 bg-[#0F0A09]/90 backdrop-blur-xl p-3 rounded-[32px] border border-white/10 shadow-3xl select-none"
            >
                <div
                    onMouseDown={onMenuMouseDown}
                    onTouchStart={onMenuMouseDown}
                    className="p-2 cursor-grab active:cursor-grabbing text-stone-500 hover:text-white transition-colors"
                >
                    <GripHorizontal className="w-5 h-5" />
                </div>

                <div className="flex gap-2">
                    <button onClick={() => setTool('pencil')} className={`p-3 rounded-2xl transition-all ${tool === 'pencil' ? 'bg-[#E87A2C] text-white' : 'bg-white/5 text-stone-500 hover:text-white'}`}><Pencil className="w-5 h-5" /></button>
                    <button onClick={() => setTool('eraser')} className={`p-3 rounded-2xl transition-all ${tool === 'eraser' ? 'bg-[#E87A2C] text-white' : 'bg-white/5 text-stone-500 hover:text-white'}`}><Eraser className="w-5 h-5" /></button>
                </div>

                <div className="w-px h-6 bg-white/10" />

                <div className="flex gap-2">
                    {['#1A110D', '#E87A2C', '#EF4444', '#3B82F6', '#10B981'].map(c => (
                        <button
                            key={c}
                            onClick={() => { setColor(c); setTool('pencil'); }}
                            className={`w-8 h-8 rounded-full border-2 transition-transform ${color === c && tool === 'pencil' ? 'scale-110 border-white' : 'border-transparent opacity-40'}`}
                            style={{ backgroundColor: c }}
                        />
                    ))}
                </div>

                <div className="flex items-center gap-3 px-2">
                    <button onClick={() => setBrushSize(prev => Math.max(2, prev - 2))} className="text-stone-500 hover:text-white"><Minus className="w-4 h-4" /></button>
                    <span className="text-[10px] font-black text-white w-4 text-center">{brushSize}</span>
                    <button onClick={() => setBrushSize(prev => Math.min(40, prev + 2))} className="text-stone-500 hover:text-white"><Plus className="w-4 h-4" /></button>
                </div>

                <div className="w-px h-6 bg-white/10" />

                <div className="flex gap-2">
                    <button onClick={undo} className="p-3 bg-white/5 text-stone-400 rounded-2xl hover:text-white"><Undo className="w-5 h-5" /></button>
                    <button onClick={clearCanvas} className="p-3 bg-red-500/20 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white"><Trash2 className="w-5 h-5" /></button>
                    <button onClick={toggleFullscreen} className="p-3 bg-white/5 text-stone-400 rounded-2xl hover:text-white">
                        <Maximize className="w-5 h-5" />
                    </button>
                    <button onClick={exportToPDF} className="p-3 bg-[#E87A2C] text-white rounded-2xl shadow-xl shadow-orange-500/20"><Download className="w-5 h-5" /></button>
                </div>
            </div>

            {/* Grid Helper - Optional visual flair */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.03] z-0"
                style={{ backgroundImage: 'radial-gradient(#000 0.5px, transparent 0.5px)', backgroundSize: '20px 20px' }}
            />
        </div>
    );
};
