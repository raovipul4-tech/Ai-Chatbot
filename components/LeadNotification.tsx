import React, { useEffect, useState } from 'react';
import { CheckCircle2, X } from 'lucide-react';
import { Lead } from '../types';

interface LeadNotificationProps {
  lead: Lead | null;
  onClose: () => void;
}

export const LeadNotification: React.FC<LeadNotificationProps> = ({ lead, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (lead) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 300);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [lead, onClose]);

  if (!lead && !isVisible) return null;

  return (
    <div className={`fixed top-24 right-4 md:right-8 z-50 transition-all duration-500 transform ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-10 opacity-0'}`}>
      <div className="bg-white border border-primary-100 rounded-xl shadow-2xl shadow-slate-200/50 p-4 max-w-sm flex items-start gap-3">
        <div className="text-green-500 mt-0.5">
          <CheckCircle2 size={24} />
        </div>
        <div className="flex-1">
          <h4 className="text-slate-800 font-semibold text-sm">Lead Captured!</h4>
          <p className="text-slate-500 text-xs mt-1">
            Neha has saved interest for <span className="text-primary-600 font-bold">{lead?.interest}</span>.
          </p>
          <div className="mt-2 flex flex-col gap-0.5 text-[10px] text-slate-400 bg-slate-50 p-2 rounded">
            <span>Name: {lead?.customerName}</span>
            <span>Contact: {lead?.contactInfo}</span>
          </div>
        </div>
        <button onClick={() => setIsVisible(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
          <X size={16} />
        </button>
      </div>
    </div>
  );
};