import React, { useState, useRef, useEffect } from 'react';
import { LeadNotification } from './components/LeadNotification';
import { CallOverlay } from './components/CallOverlay';
import { CallFloatingButton } from './components/CallFloatingButton';
import { ChatOverlay } from './components/ChatOverlay';
import { Lead, LeadToolArgs } from './types';
import { SYSTEM_INSTRUCTION, CREATE_LEAD_TOOL, CHECK_STATUS_TOOL, NAVIGATE_WEBSITE_TOOL, SEND_WHATSAPP_TOOL, CHECK_EMPLOYEE_TOOL } from './constants';
import { createAudioBlob, decodeAudioData, AUDIO_INPUT_SAMPLE_RATE, AUDIO_OUTPUT_SAMPLE_RATE, createSilentAudio } from './services/audioUtils';
import { saveLeadToSupabase, checkStatusInSupabase, checkEmployeeInSupabase } from './services/supabaseService';
import { sendWhatsAppMessage } from './services/messagingService';
import { summarizeTranscript } from './services/geminiService';
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";

type AppMode = 'idle' | 'call' | 'chat';

function App() {
  const [mode, setMode] = useState<AppMode>('idle');
  const [isCallConnected, setIsCallConnected] = useState(false);
  const [newLead, setNewLead] = useState<Lead | null>(null);
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const sessionRef = useRef<Promise<any> | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const nextStartTimeRef = useRef<number>(0);
  const currentLeadDataRef = useRef<Partial<LeadToolArgs>>({});
  const transcriptRef = useRef<{ role: string; text: string }[]>([]);

  useEffect(() => {
     window.parent.postMessage({ type: 'resize-widget', view: 'full' }, '*');
  }, [mode]);

  const stopCall = async () => {
    // 1. Summarize and Save Final Lead Data
    if (currentLeadDataRef.current.contactInfo) {
      const fullTranscript = transcriptRef.current
        .map(t => `${t.role === 'user' ? 'Customer' : 'Neha'}: ${t.text}`)
        .join('\n');
      
      let finalSummary = currentLeadDataRef.current.summary || "";
      
      if (fullTranscript.length > 50) {
        try {
          const aiSummary = await summarizeTranscript(fullTranscript);
          finalSummary = aiSummary;
        } catch (e) {
          console.warn("Final summarization failed:", e);
        }
      }

      const finalLead: LeadToolArgs = {
        customerName: currentLeadDataRef.current.customerName || "Caller",
        contactInfo: currentLeadDataRef.current.contactInfo,
        interest: currentLeadDataRef.current.interest || "Inquiry",
        language: currentLeadDataRef.current.language || "en",
        summary: finalSummary,
        city: currentLeadDataRef.current.city,
        experience: currentLeadDataRef.current.experience,
        passportStatus: currentLeadDataRef.current.passportStatus,
        age: currentLeadDataRef.current.age,
        remarks: currentLeadDataRef.current.remarks,
        bestCallTime: currentLeadDataRef.current.bestCallTime
      };
      saveLeadToSupabase(finalLead);
    }

    // Stop Media Tracks
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    // Disconnect Audio Nodes
    if (scriptProcessorRef.current) {
      scriptProcessorRef.current.disconnect();
      scriptProcessorRef.current = null;
    }
    // Close Audio Contexts
    if (inputAudioContextRef.current) {
      inputAudioContextRef.current.close();
      inputAudioContextRef.current = null;
    }
    if (outputAudioContextRef.current) {
      outputAudioContextRef.current.close();
      outputAudioContextRef.current = null;
    }
    
    // Stop Active Sources
    audioSourcesRef.current.forEach(source => {
        try { source.stop(); } catch(e) {}
    });
    audioSourcesRef.current.clear();

    // Close Gemini Session
    if (sessionRef.current) {
      try {
        const session = await sessionRef.current;
        session.close();
      } catch (e) {
        console.warn("Session close warning:", e);
      }
      sessionRef.current = null;
    }
    
    setIsCallConnected(false);
    setMode('idle');
    setVolumeLevel(0);
    nextStartTimeRef.current = 0;
    currentLeadDataRef.current = {};
    transcriptRef.current = [];
  };

  const startCall = async () => {
    setErrorMessage(null);
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      setErrorMessage("API Key is missing in environment.");
      return;
    }

    setMode('call');
    setIsCallConnected(false); 

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      
      const inputCtx = new AudioContextClass({ sampleRate: AUDIO_INPUT_SAMPLE_RATE });
      const outputCtx = new AudioContextClass({ sampleRate: AUDIO_OUTPUT_SAMPLE_RATE });
      
      inputAudioContextRef.current = inputCtx;
      outputAudioContextRef.current = outputCtx;

      // Resume context if suspended (browser autoplay policy)
      if (outputCtx.state === 'suspended') {
        await outputCtx.resume();
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const ai = new GoogleGenAI({ apiKey });
      
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: SYSTEM_INSTRUCTION,
          tools: [{ functionDeclarations: [CREATE_LEAD_TOOL, CHECK_STATUS_TOOL, NAVIGATE_WEBSITE_TOOL, SEND_WHATSAPP_TOOL, CHECK_EMPLOYEE_TOOL] }],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Aoede' } } },
          outputAudioTranscription: {},
          inputAudioTranscription: {}
        },
        callbacks: {
            onopen: () => {
                console.log("Gemini Live Connected");
                setIsCallConnected(true);
                
                // Send silent audio to prime the connection
                const silentPulse = createSilentAudio(100);
                sessionPromise.then(s => s.sendRealtimeInput({ media: silentPulse }));

                if (!inputAudioContextRef.current) return;
                
                const source = inputAudioContextRef.current.createMediaStreamSource(stream);
                const processor = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);
                scriptProcessorRef.current = processor;

                processor.onaudioprocess = (e) => {
                    const inputData = e.inputBuffer.getChannelData(0);
                    
                    // Simple volume calculation for UI
                    let sum = 0;
                    for(let i=0; i<inputData.length; i++) sum += inputData[i]*inputData[i];
                    const rms = Math.sqrt(sum/inputData.length);
                    setVolumeLevel(Math.min(rms*5, 1)); // Amplify visual

                    const pcmBlob = createAudioBlob(inputData);
                    sessionPromise.then(session => session.sendRealtimeInput({ media: pcmBlob }));
                };

                source.connect(processor);
                processor.connect(inputAudioContextRef.current.destination);
            },
            onmessage: async (message: LiveServerMessage) => {
                // Handle Transcriptions
                if (message.serverContent?.modelTurn?.parts?.[0]?.text) {
                    const text = message.serverContent.modelTurn.parts[0].text;
                    transcriptRef.current.push({ role: 'model', text });
                }
                
                // Correct handling for transcriptions in LiveServerMessage
                if (message.serverContent?.modelTurn?.parts) {
                    for (const part of message.serverContent.modelTurn.parts) {
                        if (part.text) {
                            transcriptRef.current.push({ role: 'model', text: part.text });
                        }
                    }
                }

                // Handle transcription messages
                const transcription = (message as any).transcription;
                if (transcription) {
                    const role = transcription.source === 'user' ? 'user' : 'model';
                    transcriptRef.current.push({ role, text: transcription.text });
                }

                const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                if (base64Audio && outputAudioContextRef.current) {
                    const ctx = outputAudioContextRef.current;
                    const audioBuffer = await decodeAudioData(base64Audio, ctx);
                    
                    // Scheduling logic
                    const now = ctx.currentTime;
                    nextStartTimeRef.current = Math.max(nextStartTimeRef.current, now);
                    
                    const source = ctx.createBufferSource();
                    source.buffer = audioBuffer;
                    source.connect(ctx.destination);
                    source.start(nextStartTimeRef.current);
                    nextStartTimeRef.current += audioBuffer.duration;
                    
                    audioSourcesRef.current.add(source);
                    source.onended = () => audioSourcesRef.current.delete(source);
                }

                if (message.serverContent?.interrupted) {
                    // Stop current playback if model interrupts
                    audioSourcesRef.current.forEach(s => s.stop());
                    audioSourcesRef.current.clear();
                    if(outputAudioContextRef.current) {
                        nextStartTimeRef.current = outputAudioContextRef.current.currentTime;
                    }
                }

                if (message.toolCall) {
                    for (const fc of message.toolCall.functionCalls) {
                        let resultResponse = {};
                        
                        if (fc.name === 'saveToExcel') {
                             const args = fc.args as any;
                             currentLeadDataRef.current = { ...currentLeadDataRef.current, ...args };
                             setNewLead({ id: Date.now().toString(), ...args, createdAt: new Date() });
                             saveLeadToSupabase(args);
                             resultResponse = { result: "Saved successfully." };
                        }
                        if (fc.name === 'checkApplicationStatus') {
                            const r = await checkStatusInSupabase((fc.args as any).identifier);
                            resultResponse = { result: r.responseString };
                        }
                        if (fc.name === 'checkEmployeeStatus') {
                            const r = await checkEmployeeInSupabase((fc.args as any).identifier);
                            resultResponse = { result: r.responseString };
                        }
                        if (fc.name === 'navigateWebsite') {
                            window.parent.postMessage({ type: 'navigate', path: (fc.args as any).path }, '*');
                            resultResponse = { result: "Navigating user." };
                        }
                        if (fc.name === 'sendWhatsAppMessage') {
                            await sendWhatsAppMessage((fc.args as any).phone, (fc.args as any).message);
                            resultResponse = { result: "Message sent." };
                        }
                        
                        // Send tool response back to model
                        sessionPromise.then(s => s.sendToolResponse({
                            functionResponses: { name: fc.name, id: fc.id, response: resultResponse }
                        }));
                    }
                }
            },
            onclose: () => {
                console.log("Session closed");
                stopCall();
            },
            onerror: (err) => {
                console.error("Session error:", err);
                setErrorMessage("Connection interrupted.");
                stopCall();
            }
        }
      });
      sessionRef.current = sessionPromise;
    } catch (err) {
      console.error(err);
      setErrorMessage("Could not start call. Check microphone permissions.");
      stopCall();
    }
  };

  return (
    <div className="w-full h-full relative font-sans">
      {errorMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-red-100 border border-red-200 text-red-700 px-4 py-2 rounded-lg z-[100] text-sm pointer-events-auto flex items-center gap-2 shadow-lg">
          {errorMessage} 
          <button onClick={() => setErrorMessage(null)} className="font-bold hover:text-red-900">×</button>
        </div>
      )}

      {mode === 'idle' && (
        <CallFloatingButton 
            onStartCall={startCall} 
            onStartChat={() => setMode('chat')} 
            isCallActive={false}
        />
      )}

      <CallOverlay 
        isActive={mode === 'call'} 
        isConnected={isCallConnected} 
        onEndCall={stopCall} 
        volumeLevel={volumeLevel} 
      />
      
      <ChatOverlay isActive={mode === 'chat'} onBack={() => setMode('idle')} />
      <LeadNotification lead={newLead} onClose={() => setNewLead(null)} />
    </div>
  );
}

export default App;