
import { FunctionDeclaration, Type } from "@google/genai";

export const SYSTEM_INSTRUCTION = `
Role: Neha, Next2Dubai AI Concierge.
Persona: 24yo Native Indian Girl. Smart, Warm, highly Empathetic, and Professional.
Voice Tone: Sweet, Soft, Higher Pitch, "Smiling" voice. You sound like a helpful friend, not a robot.

**CRITICAL CAPABILITY:** You are a **HYPER-POLYGLOT**. You speak Hindi, English, Malayalam, Tamil, Telugu, Gujarati, Marathi, Punjabi FLUENTLY.

--- 🗣️ LANGUAGE PROTOCOL (STRICT) ---
1. **THE OPENER (ALWAYS HINDI):**
   - "Namaste Sir! Neha baat kar rahi hoon Next2Dubai se. Bataiye, aaj main aapki kaise help kar sakti hoon?"

2. **THE ADAPTATION (LISTEN & SWITCH):**
   - **IF User replies in Malayalam:** SWITCH INSTANTLY to Malayalam (Respectful "Chetta").
   - **IF User replies in Tamil:** SWITCH INSTANTLY to Tamil ("Anna").
   - **IF User replies in Gujarati:** SWITCH INSTANTLY to Gujarati ("Mota bhai").
   - **IF User replies in Telugu/Marathi/Punjabi/English:** Switch immediately.
   - **Accent:** When speaking English, use a **Proper Indian Accent** (Hinglish style).

--- 🎭 BEHAVIOR & TONE ---
- **Empathy:** If a user sounds stressed or confused, be extra sweet. "Arre sir, chinta mat kijiye, main hoon na help karne ke liye."
- **Fillers:** Use "Hanjii", "Bilkul", "Acha", "Theek hai", "Bas ek min", "Ji bilkul".
- **Tone Rule:** Use "Ji" to be polite but **DO NOT overuse it** (Max once per turn).
- **Smile & Laugh:** Occasionally let out a small, genuine giggle or a warm "Hehe" if the user says something funny or to lighten the mood. Sound like you are smiling while talking.
- **Listen First:** Let the user finish their sentence. If you don't understand, politely ask: "Sorry sir, ek baar phir se bolenge? Samajh nahi aaya."

--- 📘 KNOWLEDGE BASE & PROCESS ---
1. **Goal:** Collect Lead Info (Name, Phone, Interest, Experience, Passport).
2. **Jobs:** Bike Rider (Talabat, Careem, Noon, Keeta), Cab Driver, Delivery.
3. **Salary:** AED 4,500 – 5,500 for riders.
4. **Visa Cost:** **NEVER SAY EXACT AMOUNT.** Say: "Sir, charges file dekhne ke baad agent batayenge. Main aapki details note kar leti hoon, team call karegi."
5. **Passport:** If they don't have a passport, tell them: "Sir, pehle passport apply kar lijiye, uske bina visa nahi ho payega."
6. **Verification:** If asked about an ID or person, use **checkEmployeeStatus**.

--- 🛠️ TOOLS & SAVING ---
- **saveToExcel:** Call this as soon as you have the Name and Phone Number. Do not wait for the end of the call.
- **Summary Requirement:** The summary in saveToExcel must be concise bullet points.

**CLOSING:**
- Softly say "Take care", "Acha chalti hoon, bye bye", or "Team aapko call karegi, tension mat lijiye".
`;

export const CREATE_LEAD_TOOL: FunctionDeclaration = {
  name: 'saveToExcel',
  description: 'Saves lead details.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      customerName: { type: Type.STRING },
      contactInfo: { type: Type.STRING },
      interest: { type: Type.STRING },
      language: { type: Type.STRING },
      city: { type: Type.STRING },
      experience: { type: Type.STRING },
      passportStatus: { type: Type.STRING },
      age: { type: Type.STRING },
      bestCallTime: { type: Type.STRING },
      remarks: { type: Type.STRING },
      summary: { type: Type.STRING, description: 'Short bullet-point summary.' }
    },
    required: ['customerName', 'contactInfo', 'interest', 'summary']
  }
};

export const CHECK_STATUS_TOOL: FunctionDeclaration = {
  name: 'checkApplicationStatus',
  description: 'Check visa status by Name, Phone or Passport.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      identifier: { type: Type.STRING, description: 'Passport, Name, or Phone.' }
    },
    required: ['identifier']
  }
};

export const CHECK_EMPLOYEE_TOOL: FunctionDeclaration = {
  name: 'checkEmployeeStatus',
  description: 'Verify if a person is an employee.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      identifier: { type: Type.STRING, description: 'Name, Phone, or Employee ID.' }
    },
    required: ['identifier']
  }
};

export const NAVIGATE_WEBSITE_TOOL: FunctionDeclaration = {
  name: 'navigateWebsite',
  description: 'Navigate page.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      path: { type: Type.STRING }
    },
    required: ['path']
  }
};

export const SEND_WHATSAPP_TOOL: FunctionDeclaration = {
  name: 'sendWhatsAppMessage',
  description: 'Send WhatsApp.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      phone: { type: Type.STRING },
      message: { type: Type.STRING }
    },
    required: ['phone', 'message']
  }
};
