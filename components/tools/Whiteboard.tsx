import React, { useState, useRef, useEffect } from 'react';
import { Pencil, Eraser, Trash2, Download, Undo, Minus, Plus, Maximize, GripHorizontal, Moon, Sun, Monitor } from 'lucide-react';
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
    const [theme, setTheme] = useState<'whiteboard' | 'blackboard'>('whiteboard');
    const [strokes, setStrokes] = useState<Stroke[]>([]);
    const [history, setHistory] = useState<Stroke[][]>([]);
    const [isFullscreen, setIsFullscreen] = useState(false);

    const [menuPos, setMenuPos] = useState({ x: 20, y: 20 });
    const isDraggingMenu = useRef(false);
    const dragOffset = useRef({ x: 0, y: 0 });

    const currentStroke = useRef<Point[]>([]);

    useEffect(() => {
        // Safe default colors based on theme
        if (theme === 'blackboard' && (color === '#1A110D' || color === '#FFFFFF')) {
            setColor('#FFFFFF');
        } else if (theme === 'whiteboard' && (color === '#1A110D' || color === '#FFFFFF')) {
            setColor('#1A110D');
        }
    }, [theme]);

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

        const fsChange = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', fsChange);

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            document.removeEventListener('fullscreenchange', fsChange);
        };
    }, [strokes, theme]);

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

            // SMOOTH RENDERING: Quadratic Bézier Curves
            ctx.moveTo(stroke.points[0].x, stroke.points[0].y);

            for (let i = 1; i < stroke.points.length - 2; i++) {
                const xc = (stroke.points[i].x + stroke.points[i + 1].x) / 2;
                const yc = (stroke.points[i].y + stroke.points[i + 1].y) / 2;
                ctx.quadraticCurveTo(stroke.points[i].x, stroke.points[i].y, xc, yc);
            }

            // Join the last two points
            const len = stroke.points.length;
            if (len > 2) {
                ctx.quadraticCurveTo(
                    stroke.points[len - 2].x,
                    stroke.points[len - 2].y,
                    stroke.points[len - 1].x,
                    stroke.points[len - 1].y
                );
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
        if (isDrawing && tool === 'pencil') {
            const pos = getPos(e);
            currentStroke.current.push(pos);

            const canvas = canvasRef.current;
            const ctx = canvas?.getContext('2d');
            if (!ctx) return;

            ctx.strokeStyle = color;
            ctx.lineWidth = brushSize;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            // Real-time smooth preview
            const points = currentStroke.current;
            if (points.length < 3) return;

            const last = points[points.length - 1];
            const prev = points[points.length - 2];
            const prevPrev = points[points.length - 3];

            const xc = (prev.x + last.x) / 2;
            const yc = (prev.y + last.y) / 2;

            ctx.beginPath();
            const startXc = (prevPrev.x + prev.x) / 2;
            const startYc = (prevPrev.y + prev.y) / 2;
            ctx.moveTo(startXc, startYc);
            ctx.quadraticCurveTo(prev.x, prev.y, xc, yc);
            ctx.stroke();

        } else if (tool === 'eraser') {
            handleErase(e);
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

    const distToSegment = (p: Point, v: Point, w: Point) => {
        const l2 = Math.pow(v.x - w.x, 2) + Math.pow(v.y - w.y, 2);
        if (l2 === 0) return Math.sqrt(Math.pow(p.x - v.x, 2) + Math.pow(p.y - v.y, 2));
        let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
        t = Math.max(0, Math.min(1, t));
        return Math.sqrt(Math.pow(p.x - (v.x + t * (w.x - v.x)), 2) + Math.pow(p.y - (v.y + t * (w.y - v.y)), 2));
    };

    const handleErase = (e: React.MouseEvent | React.TouchEvent) => {
        const pos = getPos(e);
        const threshold = 25;

        const filteredStrokes = strokes.filter(stroke => {
            const isNear = stroke.points.some((p, i) => {
                if (i === 0) return false;
                return distToSegment(pos, stroke.points[i - 1], p) < threshold;
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
        setStrokes(history[history.length - 1]);
        setHistory(prev => prev.slice(0, -1));
    };

    const exportToPDF = () => {
        if (!canvasRef.current) return;

        // Temporarily clear grid for PDF
        redraw();

        const imgData = canvasRef.current.toDataURL('image/png');
        const pdf = jsPDF({
            orientation: 'landscape',
            unit: 'px',
            format: [canvasRef.current.width, canvasRef.current.height]
        });

        // Add bgColor if blackboard
        if (theme === 'blackboard') {
            pdf.setFillColor(15, 10, 9);
            pdf.rect(0, 0, canvasRef.current.width, canvasRef.current.height, 'F');
        }

        pdf.addImage(imgData, 'PNG', 0, 0, canvasRef.current.width, canvasRef.current.height);
        pdf.save(`quadro-v5-${theme}-${Date.now()}.pdf`);
    };

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
            const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
            const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;

            const padding = 10;
            const x = Math.max(padding, Math.min(window.innerWidth - 300, clientX - dragOffset.current.x));
            const y = Math.max(padding, Math.min(window.innerHeight - 80, clientY - dragOffset.current.y));

            setMenuPos({ x, y });
        };
        const onMouseUp = () => { isDraggingMenu.current = false; };

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
        window.addEventListener('touchmove', onMouseMove, { passive: false });
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
        } else {
            document.exitFullscreen();
        }
    };

    return (
        <div
            ref={containerRef}
            className={`relative w-full transition-all duration-700 overflow-hidden group ${isFullscreen ? 'h-screen w-screen' : 'h-full rounded-[40px] md:rounded-[64px] border border-stone-100 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)]'} ${theme === 'blackboard' ? 'bg-[#0F0A09]' : 'bg-white'}`}
        >
            <canvas
                ref={canvasRef}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseOut={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="absolute inset-0 w-full h-full cursor-crosshair touch-none z-10"
            />

            {/* ULTRA-SLIM HORIZONTAL BAR */}
            <div
                style={{ left: menuPos.x, top: menuPos.y }}
                className="absolute z-50 flex items-center gap-2 md:gap-4 bg-[#0F0A09]/95 backdrop-blur-2xl p-2 md:p-3 rounded-full border border-white/10 shadow-[0_24px_48px_-12px_rgba(0,0,0,0.5)] select-none transition-transform active:scale-[0.99]"
            >
                <div
                    onMouseDown={onMenuMouseDown}
                    onTouchStart={onMenuMouseDown}
                    className="p-1 px-2 cursor-grab active:cursor-grabbing text-stone-700 hover:text-white transition-colors"
                >
                    <GripHorizontal className="w-4 h-4 md:w-5 md:h-5" />
                </div>

                <div className="flex bg-white/5 p-1 rounded-full gap-1 border border-white/5">
                    <button onClick={() => setTool('pencil')} className={`p-2 md:p-3 rounded-full transition-all hover:scale-110 ${tool === 'pencil' ? 'bg-[#E87A2C] text-white shadow-lg' : 'text-stone-500 hover:text-stone-300'}`}><Pencil className="w-4 h-4 md:w-5 md:h-5" /></button>
                    <button onClick={() => setTool('eraser')} className={`p-2 md:p-3 rounded-full transition-all hover:scale-110 ${tool === 'eraser' ? 'bg-[#E87A2C] text-white shadow-lg' : 'text-stone-500 hover:text-stone-300'}`}><Eraser className="w-4 h-4 md:w-5 md:h-5" /></button>
                </div>

                <div className="flex gap-1.5 md:gap-3 px-1 md:px-2">
                    {[(theme === 'blackboard' ? '#FFFFFF' : '#1A110D'), '#E87A2C', '#EF4444', '#3B82F6', '#10B981', '#F59E0B'].map(c => (
                        <button
                            key={c}
                            onClick={() => { setColor(c); setTool('pencil'); }}
                            className={`w-6 h-6 md:w-8 md:h-8 rounded-full border-2 transition-all hover:scale-125 ${color === c && tool === 'pencil' ? 'border-white ring-2 ring-white/20' : 'border-transparent opacity-40 hover:opacity-100'}`}
                            style={{ backgroundColor: c }}
                        />
                    ))}
                </div>

                <div className="flex items-center gap-2 md:gap-4 px-2 md:px-4 bg-white/5 rounded-full border border-white/5">
                    <button onClick={() => setBrushSize(prev => Math.max(2, prev - 2))} className="text-stone-500 hover:text-white transition-colors"><Minus className="w-4 h-4" /></button>
                    <span className="text-[10px] md:text-xs font-black text-white w-4 text-center tabular-nums">{brushSize}</span>
                    <button onClick={() => setBrushSize(prev => Math.min(60, prev + 2))} className="text-stone-500 hover:text-white transition-colors"><Plus className="w-4 h-4" /></button>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={() => setTheme(theme === 'whiteboard' ? 'blackboard' : 'whiteboard')}
                        className={`p-2 md:p-3 rounded-full bg-white/5 transition-all hover:scale-110 ${theme === 'blackboard' ? 'text-yellow-400 hover:text-yellow-300' : 'text-stone-500 hover:text-stone-300'}`}
                        title={theme === 'whiteboard' ? 'Alternar para Blackboard' : 'Alternar para Whiteboard'}
                    >
                        {theme === 'whiteboard' ? <Moon className="w-4 h-4 md:w-5 md:h-5" /> : <Sun className="w-4 h-4 md:w-5 md:h-5" />}
                    </button>
                    <button onClick={undo} className="p-2 md:p-3 bg-white/5 text-stone-500 rounded-full hover:text-white hover:bg-white/10 transition-all"><Undo className="w-4 h-4 md:w-5 md:h-5" /></button>
                    <button onClick={clearCanvas} className="p-2 md:p-3 bg-red-500/10 text-red-500 rounded-full hover:bg-red-500 hover:text-white transition-all"><Trash2 className="w-4 h-4 md:w-5 md:h-5" /></button>
                    <button onClick={toggleFullscreen} className="p-2 md:p-3 bg-white/5 text-stone-500 rounded-full hover:text-white transition-all max-md:hidden">
                        <Monitor className="w-4 h-4 md:w-5 md:h-5" />
                    </button>
                    <button onClick={exportToPDF} className="p-2 md:p-3 bg-[#E87A2C] text-white rounded-full shadow-xl hover:scale-105 transition-transform"><Download className="w-4 h-4 md:w-5 md:h-5" /></button>
                </div>
            </div>

            {/* Grid Helper Layer */}
            <div className={`absolute inset-0 pointer-events-none transition-opacity duration-700 z-0 ${theme === 'blackboard' ? 'opacity-[0.05]' : 'opacity-[0.03]'}`}
                style={{ backgroundImage: `radial-gradient(${theme === 'blackboard' ? '#FFF' : '#000'} 1px, transparent 1px)`, backgroundSize: '24px 24px' }}
            />

            {/* Theme Badge */}
            <div className={`absolute bottom-8 right-12 px-4 py-2 rounded-full border backdrop-blur-md select-none transition-all duration-700 z-10 ${theme === 'blackboard' ? 'bg-white/5 border-white/10 text-stone-600' : 'bg-black/5 border-black/5 text-stone-400'}`}>
                <span className="text-[10px] font-black uppercase tracking-[0.4em]">MusiClass {theme.charAt(0).toUpperCase() + theme.slice(1)} Mode</span>
            </div>
        </div>
    );
};
