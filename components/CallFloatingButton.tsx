
import React from 'react';
import { Phone, MessageSquare, Sparkles } from 'lucide-react';

interface CallFloatingButtonProps {
  onStartCall: () => void;
  onStartChat: () => void;
  isCallActive: boolean;
}

export const CallFloatingButton: React.FC<CallFloatingButtonProps> = ({ 
  onStartCall, 
  onStartChat, 
  isCallActive,
}) => {
  if (isCallActive) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-40 p-4 bg-black/20 backdrop-blur-sm">
      
      {/* Main Card */}
      <div className="bg-white/95 backdrop-blur-xl border border-white/50 rounded-3xl shadow-2xl p-8 w-full max-w-md text-center relative overflow-hidden animate-in zoom-in-95 duration-300 pointer-events-auto">
        
        {/* Decorative Elements */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>
        <div className="absolute -top-32 -right-32 w-64 h-64 bg-blue-100 rounded-full blur-3xl opacity-60 pointer-events-none"></div>
        <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-indigo-100 rounded-full blur-3xl opacity-60 pointer-events-none"></div>

        {/* Neha Profile */}
        <div className="relative mx-auto w-32 h-32 mb-6">
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 animate-pulse opacity-20"></div>
            <img 
                src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400&h=400" 
                alt="Neha"
                className="w-full h-full rounded-full object-cover border-[5px] border-white shadow-xl relative z-10"
            />
            <div className="absolute bottom-2 right-2 w-5 h-5 bg-green-500 border-2 border-white rounded-full z-20 shadow-md animate-bounce"></div>
        </div>

        <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-800 mb-1">Namaste! I'm Neha</h1>
            <p className="text-slate-500 text-sm font-medium">Next2Dubai AI Concierge</p>
            <div className="flex items-center justify-center gap-2 mt-3">
                <span className="px-3 py-1 bg-blue-50 text-blue-600 text-xs font-semibold rounded-full border border-blue-100 flex items-center gap-1.5">
                    <Sparkles size={10} /> AI Assistant
                </span>
            </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3.5">
            <button
                onClick={onStartCall}
                className="group relative w-full flex items-center justify-center gap-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white py-4 px-6 rounded-xl font-bold shadow-lg shadow-blue-500/30 transition-all hover:-translate-y-0.5 active:scale-[0.98] cursor-pointer"
            >
                <div className="bg-white/20 p-1.5 rounded-full">
                    <Phone size={18} className="animate-pulse" />
                </div>
                <span className="text-base">Connect on Call</span>
            </button>

            <button
                onClick={onStartChat}
                className="group w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 py-4 px-6 rounded-xl font-bold shadow-sm transition-all hover:-translate-y-0.5 active:scale-[0.98] cursor-pointer"
            >
                <div className="bg-slate-100 p-1.5 rounded-full text-slate-600 group-hover:text-blue-600 transition-colors">
                    <MessageSquare size={18} />
                </div>
                <span className="text-base">Chat with Neha</span>
            </button>
        </div>

        <div className="mt-6 text-[10px] text-slate-400 font-medium uppercase tracking-wider">
            Multilingual Support • Instant Answers
        </div>

      </div>
    </div>
  );
};
