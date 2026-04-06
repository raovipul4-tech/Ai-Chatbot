import React, { useState, useEffect, useRef } from 'react';
import { MessageBubble } from './MessageBubble';
import { InputArea } from './InputArea';
import { Message, LeadToolArgs } from '../types';
import { sendMessageToGemini } from '../services/geminiService';
import { saveLeadToSupabase, checkStatusInSupabase } from '../services/supabaseService';
import { sendWhatsAppMessage } from '../services/messagingService';

interface ChatOverlayProps {
  isActive: boolean;
  onBack: () => void;
}

export const ChatOverlay: React.FC<ChatOverlayProps> = ({ isActive, onBack }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize chat with a welcome message
  useEffect(() => {
    if (isActive && messages.length === 0) {
      setMessages([
        {
          id: 'welcome',
          role: 'model',
          text: "Namaste! I am Neha. How can I help you with your job application or visa today?",
          timestamp: new Date()
        }
      ]);
    }
  }, [isActive, messages.length]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!isActive) return null;

  const handleSendMessage = async (text: string) => {
    // Add user message
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: text,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      // Map messages for API, filtering out errors and system messages
      const historyForApi = messages
        .filter(m => !m.isError && m.role !== 'system')
        .map(m => ({
            role: m.role as 'user' | 'model',
            text: m.text
        }));

      // Call Gemini
      const response = await sendMessageToGemini(historyForApi, text);

      // Handle Tool Calls if any (Simple simulation for text chat)
      if (response.toolCalls && response.toolCalls.length > 0) {
          for (const tool of response.toolCalls) {
              let toolResult = "Done.";
              
              if (tool.name === 'saveToExcel') {
                 await saveLeadToSupabase(tool.args as LeadToolArgs);
                 toolResult = "I have saved your details successfully.";
              }
              if (tool.name === 'checkApplicationStatus') {
                  const status = await checkStatusInSupabase(tool.args.identifier);
                  toolResult = status.responseString;
              }
              if (tool.name === 'navigateWebsite') {
                  window.parent.postMessage({ type: 'navigate', path: tool.args.path }, '*');
                  toolResult = "Navigating now.";
              }
              if (tool.name === 'sendWhatsAppMessage') {
                  await sendWhatsAppMessage(tool.args.phone, tool.args.message);
                  toolResult = "Message sent.";
              }
              
              // Append tool result to response text
              if (!response.text) {
                  response.text = toolResult;
              } else {
                  response.text += `\n\n${toolResult}`;
              }
          }
      }

      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: response.text,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMsg]);

    } catch (error) {
      console.error("Chat Error:", error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        text: "Sorry ji, I am having trouble connecting right now. Please try again.",
        timestamp: new Date(),
        isError: true
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-50 z-50 flex flex-col animate-in slide-in-from-right duration-300 pointer-events-auto">
      <div className="flex items-center justify-between bg-white px-4 py-3 border-b border-slate-200 shadow-sm">
         <button onClick={onBack} className="text-slate-500 hover:text-blue-600 text-sm font-medium px-2 py-1 rounded hover:bg-slate-100 transition-colors">
            ← Back
         </button>
         <span className="font-semibold text-slate-800">Chat with Neha</span>
         <div className="w-8"></div> {/* Spacer */}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.map(msg => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        {isLoading && (
             <div className="flex justify-start w-full mb-4">
               <div className="flex items-center gap-2 bg-white px-4 py-3 rounded-2xl rounded-tl-none border border-slate-200 shadow-sm">
                 <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                 <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-100"></div>
                 <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-200"></div>
               </div>
             </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <InputArea onSend={handleSendMessage} isLoading={isLoading} />
    </div>
  );
};