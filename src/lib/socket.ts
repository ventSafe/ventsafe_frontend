import { io, Socket } from "socket.io-client";
import { useChatStore } from "@/store/chatStore";

let socket: Socket | null = null;

export const initializeSocket = (): Socket | null => {
  if (socket) return socket;

  // Strip any path (e.g. "/api") from the URL — Socket.io treats paths as namespaces.
  // We must connect to the bare origin: "http://localhost:5000"
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
  const backendUrl = (() => {
    try {
      const parsed = new URL(apiUrl);
      return parsed.origin; // only scheme + host + port, no path
    } catch {
      return "http://localhost:5000";
    }
  })();
  
  // Read JWT from localStorage — the backend auth middleware reads socket.handshake.auth.token
  const token = typeof window !== "undefined"
    ? localStorage.getItem("ventsafe-auth-token")
    : null;

  if (!token) {
    console.warn("Socket: no auth token found, skipping connection.");
    return null;
  }

  // Create socket connection — pass token via auth handshake (NOT cookies)
  socket = io(backendUrl, {
    withCredentials: true,
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    auth: { token }, // ← backend reads socket.handshake.auth.token
  });

  // Listen for connection events
  socket.on("connect", () => {
    console.log("Connected to WebSocket server:", socket?.id);
  });

  socket.on("connect_error", (err) => {
    console.error("Socket connection error:", err.message);
  });

  // Listen for incoming messages
  socket.on("receive_message", (data) => {
    const { senderId, encryptedBlob, wrappedAesKeySender, wrappedAesKeyRecipient, timestamp, id, session_id } = data;
    
    // Add to Zustand store
    useChatStore.getState().addMessage({
      id: id || Math.random().toString(36).substr(2, 9),
      session_id: session_id,
      sender_id: senderId,
      encrypted_blob: encryptedBlob,
      wrapped_aes_key_sender: wrappedAesKeySender,
      wrapped_aes_key_recipient: wrappedAesKeyRecipient,
      read_at: null,
      created_at: timestamp
    });
  });

  // Typing indicators
  socket.on("user_typing", ({ senderId }) => {
    const session = useChatStore.getState().sessions.find(
      (s) => s.id === useChatStore.getState().activeSessionId
    );
    if (session) {
      useChatStore.getState().setTypingStatus(session.id, true);
    }
  });

  socket.on("user_stop_typing", ({ senderId }) => {
    const session = useChatStore.getState().sessions.find(
      (s) => s.id === useChatStore.getState().activeSessionId
    );
    if (session) {
      useChatStore.getState().setTypingStatus(session.id, false);
    }
  });

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

/**
 * Forces a fresh socket connection (e.g. call after login when token is now available).
 */
export const resetSocket = (): Socket | null => {
  disconnectSocket();
  return initializeSocket();
};
