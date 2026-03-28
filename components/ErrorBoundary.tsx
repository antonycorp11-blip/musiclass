import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('MusiClass ErrorBoundary caught an error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#1A110D] flex items-center justify-center p-6 text-white font-sans">
          <div className="bg-rose-500/10 border-2 border-rose-500/20 max-w-lg w-full rounded-[32px] p-8 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-rose-500/20 rounded-2xl flex items-center justify-center mb-6 text-rose-500 shadow-xl">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h1 className="text-xl font-black uppercase tracking-tighter mb-2">Ops! Ocorreu um problema</h1>
            <p className="text-stone-400 text-sm mb-8 leading-relaxed">
              O sistema detectou uma indisponibilidade temporária no renderizador visual. 
              Como proteção de dados, pausamos a atividade nesta janela específica.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="flex items-center gap-2 bg-[#E87A2C] text-[#1A110D] px-6 py-3 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-orange-500 transition-all shadow-lg shadow-orange-500/20"
            >
              <RefreshCw className="w-4 h-4" /> Recarregar Sistema
            </button>
            
            {this.state.error && (
              <div className="mt-8 text-left w-full">
                <p className="text-[10px] font-black uppercase text-stone-500 mb-2">Detalhes técnicos para suporte:</p>
                <div className="p-4 bg-black/40 rounded-xl overflow-x-auto border border-white/5 font-mono text-[9px] text-rose-300">
                  {this.state.error.message}
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }

    return (this as any).props.children;
  }
}
