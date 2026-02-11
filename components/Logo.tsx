
import React from 'react';

export const Logo: React.FC<{ light?: boolean, size?: 'sm' | 'md' | 'lg' }> = ({ light = false, size = 'md' }) => {
    const height = size === 'sm' ? 'h-8' : size === 'md' ? 'h-12' : 'h-20';

    return (
        <div className="flex items-center gap-3 select-none">
            <img
                src="/Logo-Laranja.png"
                alt="MusiClass Logo"
                className={`${height} w-auto object-contain filter ${light ? 'brightness-110' : ''}`}
                onError={(e) => {
                    // Fallback visual caso a imagem não carregue
                    e.currentTarget.style.display = 'none';
                }}
            />
            {size !== 'sm' && (
                <div className="flex flex-col border-l border-orange-500/20 pl-3">
                    <span className={`font-black uppercase tracking-tighter italic ${size === 'lg' ? 'text-2xl' : 'text-lg'} ${light ? 'text-white' : 'text-[#1A110D]'}`}>
                        MusiClass
                    </span>
                    <span className={`text-[6px] font-bold uppercase tracking-[0.4em] ${light ? 'text-orange-400' : 'text-stone-400'}`}>
                        Educational System
                    </span>
                </div>
            )}
        </div>
    );
};
