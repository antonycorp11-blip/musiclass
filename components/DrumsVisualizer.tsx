import React from 'react';

interface DrumsVisualizerProps {
    root: string; // Usado para o nome do ritmo/exercício
}

export const DrumsVisualizer: React.FC<DrumsVisualizerProps> = ({ root }) => {
    const instruments = ['Bumbo', 'Caixa', 'Chimbal'];
    const steps = [1, 2, 3, 4, 1, 2, 3, 4]; // 8 steps (2 tempos)

    return (
        <div className="flex flex-col items-center bg-gray-900 p-6 rounded-xl shadow-2xl border border-gray-700 w-full max-w-[400px]">
            <h5 className="text-lg font-black text-white mb-6 tracking-tighter uppercase self-start flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                Ritmo: {root}
            </h5>

            <div className="grid grid-cols-9 gap-2 w-full">
                <div className="col-span-1" />
                {steps.map((s, i) => (
                    <div key={i} className="text-[10px] font-bold text-gray-500 text-center">{s}</div>
                ))}

                {instruments.map((inst, i) => (
                    <React.Fragment key={inst}>
                        <div className="text-[10px] font-bold text-gray-400 flex items-center">{inst}</div>
                        {steps.map((_, idx) => (
                            <div
                                key={idx}
                                className={`
                  h-8 rounded-md border border-gray-800 transition-all cursor-pointer
                  ${(idx % 4 === 0) ? 'bg-gray-800' : 'bg-gray-850'}
                  hover:border-indigo-500
                `}
                            />
                        ))}
                    </React.Fragment>
                ))}
            </div>

            <p className="text-[10px] text-gray-500 mt-4 italic">Toque nos quadrados para montar o rítmo (Visualização)</p>
        </div>
    );
};
