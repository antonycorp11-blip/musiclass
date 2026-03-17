
import React from 'react';

export const Logo: React.FC<{ light?: boolean, size?: 'sm' | 'md' | 'lg' }> = ({ light = false, size = 'md' }) => {
    // Ajuste de altura conforme o tamanho solicitado
    const height = size === 'sm' ? 'h-8 md:h-9' : size === 'md' ? 'h-12 md:h-14' : 'h-16 md:h-20';

    return (
        <div className="flex items-center select-none overflow-hidden">
            <img
                src={light ? "/Logo-Laranja.png" : "/Logo-Fundo-Branco.png"}
                alt="Logo"
                className={`${height} w-auto object-contain transition-transform hover:scale-105 duration-300`}
                onError={(e) => {
                    // Fallback visual silencioso
                    e.currentTarget.style.display = 'none';
                }}
            />
        </div>
    );
};
