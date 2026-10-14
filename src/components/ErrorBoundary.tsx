import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw, ShieldAlert, Home } from 'lucide-react';
import { StorageService } from '../services/storage';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary capturou erro:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  private handleRestoreOfficialData = () => {
    try {
      StorageService.resetToDefault();
      window.location.reload();
    } catch (e) {
      console.error(e);
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] flex items-center justify-center p-6 bg-zinc-950/80 rounded-2xl border border-red-500/30 text-white my-4">
          <div className="max-w-md w-full text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-red-950/60 border border-red-500/40 text-red-400 flex items-center justify-center shadow-lg shadow-red-950/50">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-black text-white tracking-tight">
                {this.props.fallbackTitle || 'Ocorreu um erro ao carregar os dados'}
              </h3>
              <p className="text-xs text-zinc-400">
                O aplicativo protegeu seus dados. Nenhum registro foi perdido.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl text-left text-[11px] font-mono text-red-300/90 overflow-x-auto max-h-28">
                {this.state.error.message || String(this.state.error)}
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={this.handleReset}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition flex items-center justify-center space-x-2 shadow-lg shadow-red-950/50 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Tentar Novamente</span>
              </button>

              <button
                type="button"
                onClick={this.handleRestoreOfficialData}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 text-xs font-bold transition flex items-center justify-center space-x-2 cursor-pointer"
              >
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                <span>Restaurar Dados Oficiais</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
