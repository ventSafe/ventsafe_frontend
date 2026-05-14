import { create } from "zustand";

export type MessageStatus = "sending" | "sent" | "delivered" | "failed";

export interface ChatMessage {
  id: string;
  session_id: string;
  sender_id: string;
  encrypted_blob: string;
  wrapped_aes_key_sender: string;
  wrapped_aes_key_recipient: string;
  read_at: string | null;
  created_at: string;
  /** Delivery status — only set for outgoing messages on this device */
  status?: MessageStatus;
  /** Cached plaintext — set for optimistic messages or after decryption */
  plaintext?: string;
}

export interface ChatSession {
  id: string;
  status: "active" | "archived" | "blocked";
  updated_at: string;
  anonymous_name: string;
  public_key: string;
  is_online: boolean;
  target_user_id?: string; // user ID before real session exists
  other_user_id?: string;  // actual other-party user ID for socket routing
}

interface ChatState {
  activeSessionId: string | null;
  sessions: ChatSession[];
  messages: ChatMessage[];
  isTyping: Record<string, boolean>;

  setActiveSession: (id: string | null) => void;
  setSessions: (sessions: ChatSession[]) => void;
  setMessages: (messages: ChatMessage[]) => void;
  addMessage: (message: ChatMessage) => void;
  /** Add an optimistic (pending) outgoing message before the ack arrives */
  addOptimisticMessage: (message: ChatMessage) => void;
  /** Update the status of a message by its id */
  updateMessageStatus: (id: string, status: MessageStatus) => void;
  setMessagePlaintext: (id: string, plaintext: string) => void;
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

  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),

  addOptimisticMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, { ...message, status: "sending" }],
    })),

  updateMessageStatus: (id, status) =>
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === id ? { ...m, status } : m
      ),
    })),

  setMessagePlaintext: (id, plaintext) =>
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === id ? { ...m, plaintext } : m
      ),
    })),

  setTypingStatus: (sessionId, isTyping) =>
    set((state) => ({
      isTyping: { ...state.isTyping, [sessionId]: isTyping },
    })),
}));
