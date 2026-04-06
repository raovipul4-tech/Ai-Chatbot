import React from 'react';
import { Message } from '../types';
import { Bot, User } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface MessageBubbleProps {
  message: Message;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isBot = message.role === 'model';

  return (
    <div className={`flex w-full mb-6 ${isBot ? 'justify-start' : 'justify-end'}`}>
      <div className={`flex max-w-[85%] md:max-w-[70%] gap-3 ${isBot ? 'flex-row' : 'flex-row-reverse'}`}>
        
        {/* Avatar */}
        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center shadow-sm overflow-hidden ${
          isBot 
            ? 'bg-white border border-slate-200' 
            : 'bg-primary-600 text-white'
        }`}>
          {isBot ? (
            <img 
                src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400&h=400" 
                alt="Neha"
                className="w-full h-full object-cover"
            />
          ) : (
            <User size={20} />
          )}
        </div>

        {/* Content */}
        <div className={`flex flex-col ${isBot ? 'items-start' : 'items-end'}`}>
          <div className={`px-5 py-3.5 rounded-2xl shadow-sm ${
            isBot 
              ? 'bg-white border border-slate-200 text-slate-700 rounded-tl-none' 
              : 'bg-gradient-to-br from-primary-600 to-primary-500 text-white font-medium rounded-tr-none shadow-primary-500/20'
          }`}>
             <div className={`prose prose-sm max-w-none ${isBot ? 'prose-slate' : 'prose-invert'}`}>
                {isBot ? (
                  <ReactMarkdown>{message.text}</ReactMarkdown>
                ) : (
                  <p className="whitespace-pre-wrap">{message.text}</p>
                )}
             </div>
          </div>
          <span className="text-[10px] text-slate-400 mt-1 px-1">
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

      </div>
    </div>
  );
};