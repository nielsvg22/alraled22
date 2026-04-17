import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch() {}

  handleReset = () => {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    } catch {}
    window.location.href = '/login';
  };

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
        <div className="max-w-2xl w-full rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
          <div className="space-y-1">
            <h1 className="text-xl font-black">CRM crashed</h1>
            <p className="text-sm text-white/60">Reload or reset your session.</p>
          </div>
          <pre className="text-xs whitespace-pre-wrap break-words bg-black/30 rounded-xl p-4 border border-white/10">
            {String(this.state.error?.message || this.state.error)}
          </pre>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-xl bg-white text-slate-900 font-bold text-sm"
            >
              Reload
            </button>
            <button
              type="button"
              onClick={this.handleReset}
              className="px-4 py-2 rounded-xl border border-white/20 text-white font-bold text-sm"
            >
              Reset session
            </button>
          </div>
        </div>
      </div>
    );
  }
}

