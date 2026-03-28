import React from 'react';

// Um contêiner que centraliza texto "blindado" contra o html2canvas offset bug
// Usando SVG para garantir que o texto de relatórios PDF nunca saia do eixo
export const PdfIconBox: React.FC<{
    text: string | number;
    bgColor?: string;
    textColor?: string;
    size?: string;
    fontSize?: number;
    className?: string;
}> = ({ text, bgColor = 'bg-[#1A110D]', textColor = 'currentColor', size = 'w-6 h-6', fontSize = 10, className = '' }) => {
    return (
        <div className={`${size} ${bgColor} rounded-md text-white shrink-0 shadow-sm ${className}`}>
            <svg viewBox="0 0 24 24" className="w-full h-full">
                <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central" fill={textColor} fontWeight="900" fontSize={fontSize}>
                    {text}
                </text>
            </svg>
        </div>
    );
};

export const PdfTitle: React.FC<{
    title: string;
    color?: string;
    fontSize?: number;
    className?: string;
}> = ({ title, color = '#1C1917', fontSize = 10, className = 'h-4 w-48' }) => {
    return (
        <svg viewBox={`0 0 ${title.length * 10} 20`} className={className}>
            <text x="0" y="50%" dominantBaseline="central" fill={color} fontWeight="900" fontSize={fontSize} style={{ letterSpacing: '0.1em' }}>
                {title.toUpperCase()}
            </text>
        </svg>
    );
};

export const PdfScaleCircle: React.FC<{
    note: string;
    className?: string;
}> = ({ note, className = 'w-9 h-9 bg-white/10 border border-white/10 rounded-xl shadow-lg' }) => {
    return (
        <div className={className}>
            <svg viewBox="0 0 36 36" className="w-full h-full">
                <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central" fill="white" fontWeight="900" fontSize="14">
                    {note}
                </text>
            </svg>
        </div>
    );
};

export const PdfDrumPart: React.FC<{ partId: string }> = ({ partId }) => {
    const config = {
        'kick': { color: 'bg-rose-500', icon: '🥁' },
        'snare': { color: 'bg-blue-600', icon: '⊚' },
        'hihat': { color: 'bg-orange-500', icon: '×' },
        'crash': { color: 'bg-yellow-500', icon: '✳' },
        'crash/ride': { color: 'bg-yellow-500', icon: '✳' },
        'tom1': { color: 'bg-emerald-500', icon: '◦' },
        'tom2': { color: 'bg-emerald-600', icon: '◦' },
        'floor': { color: 'bg-purple-600', icon: '◯' },
    }[partId] || { color: 'bg-stone-500', icon: '◦' };

    return (
        <div className={`w-5 h-5 md:w-7 md:h-7 rounded-md ${config.color}`}>
            <svg viewBox="0 0 24 24" className="w-full h-full">
                <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central" fill="white" fontWeight="900" fontSize="12">
                    {config.icon}
                </text>
            </svg>
        </div>
    );
};
