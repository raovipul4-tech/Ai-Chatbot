import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2 } from 'lucide-react';

interface InputAreaProps {
  onSend: (text: string) => void;
  isLoading: boolean;
}

export const InputArea: React.FC<InputAreaProps> = ({ onSend, isLoading }) => {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    if (input.trim() && !isLoading) {
      onSend(input);
      setInput('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [input]);

  return (
    <div className="w-full bg-white/80 backdrop-blur border-t border-slate-200 p-4 pb-6 sticky bottom-0 z-10">
      <div className="max-w-4xl mx-auto relative">
        <div className="relative flex items-end gap-2 bg-slate-50 border border-slate-200 rounded-xl p-2 focus-within:border-primary-400 focus-within:ring-2 focus-within:ring-primary-100 transition-all">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Neha about jobs, visa, or salary..."
            className="w-full bg-transparent text-slate-800 placeholder-slate-400 text-sm p-3 outline-none resize-none scrollbar-hide max-h-[150px] min-h-[44px]"
            rows={1}
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className={`p-3 rounded-lg flex-shrink-0 transition-all duration-200 ${
              input.trim() && !isLoading
                ? 'bg-primary-600 hover:bg-primary-500 text-white shadow-lg shadow-primary-500/20'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
        <div className="text-center mt-2">
            <p className="text-[10px] text-slate-400">
                Powered by Next2Dubai AI.
            </p>
        </div>
      </div>
    </div>
  );
};