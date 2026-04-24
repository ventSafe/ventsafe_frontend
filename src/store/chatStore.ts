import { create } from "zustand";

export interface ChatMessage {
  id: string;
  session_id: string;
  sender_id: string;
  encrypted_blob: string;
  wrapped_aes_key_sender: string;
  wrapped_aes_key_recipient: string;
  read_at: string | null;
  created_at: string;
}

export interface ChatSession {
  id: string;
  status: "active" | "archived" | "blocked";
  updated_at: string;
  anonymous_name: string;
  public_key: string;
  is_online: boolean;
}

interface ChatState {
  activeSessionId: string | null;
  sessions: ChatSession[];
  messages: ChatMessage[];
  isTyping: Record<string, boolean>; // mapping of session_id to boolean
  
  setActiveSession: (id: string | null) => void;
  setSessions: (sessions: ChatSession[]) => void;
  setMessages: (messages: ChatMessage[]) => void;
  addMessage: (message: ChatMessage) => void;
  setTypingStatus: (sessionId: string, isTyping: boolean) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  activeSessionId: null,
  sessions: [],
  messages: [],
  isTyping: {},

  setActiveSession: (id) => set({ activeSessionId: id }),
  setSessions: (sessions) => set({ sessions }),
  setMessages: (messages) => set({ messages }),
  
  addMessage: (message) => set((state) => ({ 
    messages: [...state.messages, message] 
  })),
  
  setTypingStatus: (sessionId, isTyping) => set((state) => ({
    isTyping: { ...state.isTyping, [sessionId]: isTyping }
  })),
}));
