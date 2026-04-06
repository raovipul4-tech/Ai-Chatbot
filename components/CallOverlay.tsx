import React, { useEffect, useState } from 'react';
import { PhoneOff, Mic, Phone } from 'lucide-react';

interface CallOverlayProps {
  isActive: boolean;
  isConnected: boolean; // New prop to track connection state
  onEndCall: () => void;
  volumeLevel: number;
}

export const CallOverlay: React.FC<CallOverlayProps> = ({ isActive, isConnected, onEndCall, volumeLevel }) => {
  const [dots, setDots] = useState('');

  // Animation for "Calling..."
  useEffect(() => {
    if (isActive && !isConnected) {
      const interval = setInterval(() => {
        setDots(prev => prev.length < 3 ? prev + '.' : '');
      }, 500);
      return () => clearInterval(interval);
    }
  }, [isActive, isConnected]);

  if (!isActive) return null;

  const scale = isConnected ? 1 + Math.min(volumeLevel * 3, 2) : 1; 

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/95 backdrop-blur-2xl animate-in fade-in duration-300 pointer-events-auto">
      
      {/* Background decorations */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-30 pointer-events-none">
         <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-300/20 rounded-full blur-3xl animate-pulse"></div>
         <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-400/10 rounded-full blur-3xl"></div>
      </div>

      <div className="flex flex-col items-center gap-8 relative z-10">
        
        {/* Header Info */}
        <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
                {isConnected ? "Talking with Neha" : "Calling Neha"}
            </h2>
            <p className="text-slate-500 text-sm font-medium">
                {isConnected ? "Next2Dubai AI Concierge" : `Connecting${dots}`}
            </p>
        </div>

        {/* Avatar Area */}
        <div className="relative w-64 h-64 flex items-center justify-center">
           {/* Visualizer Ripples (Only show when connected) */}
           {isConnected && (
             <>
               <div 
                 className="absolute inset-0 border border-blue-100 rounded-full transition-all duration-75 ease-out"
                 style={{ transform: `scale(${scale * 1.3})`, opacity: 0.5 - (volumeLevel/2) }}
               />
               <div 
                 className="absolute inset-4 border border-blue-200 rounded-full transition-transform duration-75 ease-out"
                 style={{ transform: `scale(${scale * 1.15})`, opacity: 0.7 - (volumeLevel/2) }}
               />
             </>
           )}
           
           {/* Calling Pulse (Only show when connecting) */}
           {!isConnected && (
             <div className="absolute inset-0 rounded-full border-4 border-blue-100 animate-[ping_2s_ease-in-out_infinite]"></div>
           )}
           
           {/* Main Profile Photo */}
           <div className="relative w-40 h-40 rounded-full p-1 bg-gradient-to-tr from-blue-500 to-indigo-400 shadow-2xl shadow-blue-500/30 z-20">
              <img 
                src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400&h=400" 
                alt="Neha"
                className="w-full h-full rounded-full object-cover border-4 border-white"
              />
              
              {/* Status Icon */}
              <div className="absolute bottom-0 right-0 bg-white p-2 rounded-full shadow-lg border border-slate-100">
                  {isConnected ? (
                      <Mic className="w-5 h-5 text-blue-500 animate-pulse" />
                  ) : (
                      <Phone className="w-5 h-5 text-green-500 animate-bounce" />
                  )}
              </div>
           </div>
        </div>

        {/* Controls */}
        <div className="mt-8">
           <button 
             onClick={onEndCall}
             className="group flex items-center gap-3 bg-red-50 hover:bg-red-100 text-red-600 px-8 py-4 rounded-full transition-all hover:scale-105 active:scale-95 shadow-lg shadow-red-100 border border-red-100 cursor-pointer pointer-events-auto"
           >
             <div className="bg-red-500 p-2 rounded-full text-white group-hover:rotate-90 transition-transform shadow-md shadow-red-500/20">
                <PhoneOff size={20} />
             </div>
             <span className="font-semibold text-base">
                {isConnected ? "End Conversation" : "Cancel Call"}
             </span>
           </button>
        </div>
      </div>
    </div>
  );
};