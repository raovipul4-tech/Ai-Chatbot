export interface Message {
  id: string;
  role: 'user' | 'model' | 'system';
  text: string;
  timestamp: Date;
  isError?: boolean;
}

export interface Lead {
  id: string;
  customerName: string;
  contactInfo: string;
  interest: string;
  language: string;
  summary?: string;
  city?: string;
  experience?: string;
  passportStatus?: string;
  age?: string;
  bestCallTime?: string;
  remarks?: string;
  createdAt: Date;
}

export interface LeadToolArgs {
  customerName: string;
  contactInfo: string;
  interest: string;
  language?: string;
  summary?: string;
  city?: string;
  experience?: string;
  passportStatus?: string;
  age?: string;
  bestCallTime?: string;
  remarks?: string;
}