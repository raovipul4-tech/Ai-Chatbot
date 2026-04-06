import React from 'react';
import { Building2, Phone } from 'lucide-react';

interface HeaderProps {
  onStartCall: () => void;
  isCallActive: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onStartCall, isCallActive }) => {
  return (
    <header className="bg-white/90 backdrop-blur-md border-b border-slate-200 sticky top-0 z-20 shadow-sm">
      <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-primary-600 p-2 rounded-lg shadow-md shadow-primary-500/20">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 tracking-wide">Next<span className="text-primary-600">2</span>Dubai</h1>
            <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">AI Recruitment</p>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <button 
            onClick={onStartCall}
            disabled={isCallActive}
            className={`flex items-center gap-2 px-5 py-2 rounded-full font-semibold transition-all shadow-lg ${
              isCallActive 
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
              : 'bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white shadow-primary-500/30'
            }`}
          >
            <Phone className={`w-4 h-4 ${isCallActive ? '' : 'animate-pulse'}`} />
            <span className="hidden sm:inline">Call Neha</span>
            <span className="sm:hidden">Call</span>
          </button>
        </div>
      </div>
    </header>
  );
};