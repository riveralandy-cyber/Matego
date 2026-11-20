import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      errorMessage: '',
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error?.message || 'Error inesperado en la aplicación.',
    };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error('ErrorBoundary caught error:', error, info);
  }

  private getFriendlyMessage(): string {
    try {
      const parsed = JSON.parse(this.state.errorMessage);
      if (parsed && typeof parsed.error === 'string') {
        if (parsed.error.includes('Missing or insufficient permissions')) {
          return 'No cuentas con permisos suficientes para esta operación en la nube. Verifica que hayas iniciado sesión con Google y que tu perfil esté vinculado.';
        }
        if (parsed.error.includes('Quota exceeded')) {
          return 'Se alcanzó el límite diario gratuito de lecturas/escrituras de la base de datos. Intenta nuevamente mañana o revisa el plan en Firebase Console.';
        }
        return parsed.error;
      }
    } catch {
      // Not JSON formatted
    }
    return this.state.errorMessage;
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen tq-page flex items-center justify-center p-4 font-sans">
          <div className="max-w-md w-full tq-card border-2 rounded-3xl p-6 shadow-lg text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-100 dark:bg-rose-950/70 text-rose-600 dark:text-rose-300 flex items-center justify-center">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <h1 className="text-xl font-black tq-text">
              {this.state.errorMessage.includes('removeChild') || this.state.errorMessage.includes('Node')
                ? 'Interrupción Visual del Navegador'
                : 'Problema de Sincronización en la Nube'}
            </h1>
            <p className="text-xs tq-text-2 leading-relaxed">
              {this.getFriendlyMessage()}
            </p>
            <button
              type="button"
              onClick={() => {
                this.setState({ hasError: false, errorMessage: '' });
                window.location.reload();
              }}
              className="w-full py-3 tq-btn-primary rounded-2xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Recargar Plataforma</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
