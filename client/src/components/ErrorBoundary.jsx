import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("FMS Crash Caught:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-background flex items-center justify-center p-6 text-center">
                    <div className="glass-card max-w-md p-10 space-y-6 border-red-500/20">
                        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertTriangle className="text-red-500" size={40} />
                        </div>
                        <h1 className="text-2xl font-bold text-white italic tracking-tight">SYSTEM RECOVERY</h1>
                        <p className="text-gray-400 text-sm leading-relaxed">
                            A serious error occurred while rendering this module. We have intercepted the crash to prevent a black screen.
                        </p>
                        <div className="p-4 bg-black/40 rounded-xl border border-white/5 text-left">
                            <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Error Trace</p>
                            <p className="text-xs text-red-400 font-mono break-all">{this.state.error?.toString()}</p>
                        </div>
                        <button
                            onClick={() => window.location.reload()}
                            className="w-full py-4 bg-primary text-black font-black rounded-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                        >
                            <RefreshCw size={18} /> RELOAD STUDIO
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
