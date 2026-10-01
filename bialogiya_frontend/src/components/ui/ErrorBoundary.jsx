import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
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

  render() {
    if (this.state.hasError) {
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
            <button
              onClick={this.handleReload}
              className="btn-primary w-full py-2.5 text-xs font-semibold flex items-center justify-center gap-2"
            >
              <RefreshCw size={14} /> Sahifani yangilash
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
