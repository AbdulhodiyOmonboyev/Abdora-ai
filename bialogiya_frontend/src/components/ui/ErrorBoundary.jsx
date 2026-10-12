import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, showDetails: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleLogout = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (_) {}
    window.location.href = '/login';
  };

  render() {
    if (this.state.hasError) {
      const errorMsg = this.state.error?.message || String(this.state.error || 'Noma\'lum xatolik');
      const errorStack = this.state.error?.stack || '';

      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--background)] text-[var(--text-primary)]">
          <div className="max-w-md w-full p-6 rounded-3xl border border-[var(--border)] bg-[var(--card)] shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <AlertTriangle size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold">Kutilmagan xatolik yuz berdi</h2>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Sahifani yuklashda xatolik kuzatildi. Iltimos, sahifani yangilang yoki birozdan so'ng qayta urinib ko'ring.
              </p>
            </div>

            {/* Error details toggle */}
            <div className="text-left">
              <button
                type="button"
                onClick={() => this.setState((s) => ({ showDetails: !s.showDetails }))}
                className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-1 mx-auto"
              >
                {this.state.showDetails ? "Tafsilotlarni yashirish ▲" : "Xatolik tafsilotlari ▼"}
              </button>
              {this.state.showDetails && (
                <div className="mt-2 p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-[11px] font-mono text-red-600 dark:text-red-400 max-h-48 overflow-auto break-all">
                  <div className="font-bold mb-1">{errorMsg}</div>
                  {errorStack && <pre className="text-[10px] whitespace-pre-wrap opacity-80">{errorStack}</pre>}
                </div>
              )}
            </div>

            <div className="space-y-2 pt-1">
              <button
                onClick={this.handleReload}
                className="btn-primary w-full py-2.5 text-xs font-semibold flex items-center justify-center gap-2"
              >
                <RefreshCw size={14} /> Sahifani yangilash
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={this.handleGoHome}
                  className="btn-secondary py-2 text-xs font-medium"
                >
                  Bosh sahifa
                </button>
                <button
                  type="button"
                  onClick={this.handleLogout}
                  className="btn-ghost py-2 text-xs font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                >
                  Qayta kirish
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
