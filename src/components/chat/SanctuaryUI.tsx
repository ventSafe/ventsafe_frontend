"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useChatStore, type MessageStatus } from "@/store/chatStore";
import { initializeSocket, getSocket } from "@/lib/socket";
import { GradientOrb } from "@/components/shared/GradientOrb";
import {
  MessageSquare, Compass, Users, Lock, X, ShieldCheck,
  HelpCircle, ChevronRight, CheckCircle, ArrowLeft, Send,
  Check,
} from "lucide-react";
import { encryptMessage, decryptMessage } from "@/lib/crypto/e2ee";
import { decryptPrivateKey } from "@/lib/blockchain/keys";
import { API_BASE_URL } from "@/config/constants";
import { useVaultStore } from "@/store/useVaultStore";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FollowedCounsellor {
  id: string;
  anonymous_name: string;
  tier: string | null;
  public_key: string;
  is_online: boolean;
}

type SidePanel = "chats" | "explore" | "following" | "how";

// ─── Vault PIN Modal ──────────────────────────────────────────────────────────

function VaultModal({ onUnlock, onClose }: { onUnlock: (key: string) => void; onClose: () => void }) {
  const [pin, setPin] = useState(["", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const refs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];

  const handleDigit = (i: number, val: string) => {
    if (!val) { const next = [...pin]; next[i] = ""; setPin(next); return; }
    const digits = val.replace(/\D/g, "");
    if (!digits) return;
    const next = [...pin];
    if (digits.length > 1) {
      for (let j = 0; j < digits.length && i + j < 4; j++) next[i + j] = digits[j];
      setPin(next); refs[Math.min(i + digits.length, 3)].current?.focus(); return;
    }
    next[i] = digits.slice(-1);
    setPin(next);
    if (i < 3) refs[i + 1].current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent, i: number) => {
    if (e.key === "Backspace" && !pin[i] && i > 0) refs[i - 1].current?.focus();
  };

  const handleUnlock = async () => {
    const pinStr = pin.join("");
    if (pinStr.length < 4) { setError("Enter all 4 digits."); return; }
    setError(""); setLoading(true);
    try {
      // Try student key first, then counsellor key
      const encKey =
        localStorage.getItem("ventsafe-encrypted-private-key") ||
        localStorage.getItem("ventsafe-counsellor-encrypted-key");
      if (!encKey) throw new Error("No encrypted key found. Log out and log back in.");
      const privKey = await decryptPrivateKey(encKey, pinStr);
      onUnlock(privKey);
    } catch {
      setError("Wrong PIN. This is the 4-digit PIN you created during registration.");
      setPin(["", "", "", ""]);
      setTimeout(() => refs[0].current?.focus(), 50);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
        className="relative bg-[#112240] border border-slate-700 rounded-2xl p-8 w-full max-w-sm shadow-2xl"
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors">
          <X size={20} />
        </button>
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-cyan-900/30 border border-cyan-700 flex items-center justify-center">
            <Lock size={24} className="text-cyan-400" />
          </div>
          <div className="text-center">
            <h2 className="text-xl font-bold text-white mb-1">Unlock Your Vault</h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              Enter the <span className="text-cyan-300 font-semibold">4-digit PIN</span> you set during{" "}
              <span className="text-cyan-300 font-semibold">registration</span> (the one that encrypts your private key).
            </p>
          </div>
          <div className="flex gap-3">
            {pin.map((d, i) => (
              <input
                key={i}
                ref={refs[i]}
                type="password"
                inputMode="numeric"
                maxLength={1}
                value={d}
                onChange={(e) => handleDigit(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, i)}
                className="w-12 h-12 text-center text-2xl font-bold bg-[#0A192F] border border-slate-600 rounded-lg text-white focus:outline-none focus:border-cyan-500 transition-colors"
              />
            ))}
          </div>
          {error && (
            <p className="text-red-400 text-sm text-center bg-red-900/20 border border-red-800/50 rounded-lg px-4 py-2 w-full">
              {error}
            </p>
          )}
          <button
            onClick={handleUnlock}
            disabled={loading || pin.join("").length < 4}
            className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            {loading ? "Unlocking..." : "Unlock Vault"}
          </button>
          <p className="text-xs text-slate-500 text-center">
            🔒 Messages are encrypted end-to-end. Only you can read them.
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── How It Works Panel ───────────────────────────────────────────────────────
function HowItWorksPanel() {
  const steps = [
    { icon: "🔍", title: "1. Follow a Counsellor", desc: "Go to Explore or the main feed and follow a counsellor. Only counsellors you follow will appear in your chat list." },
    { icon: "🔐", title: "2. Keys are Exchanged", desc: "VentSafe uses RSA + AES encryption. Your messages are encrypted before leaving your device. The server never sees plaintext." },
    { icon: "💬", title: "3. Start Chatting", desc: "Click a counsellor from the Chats tab. Unlock your Vault with your registration PIN to send and read messages." },
    { icon: "🛡️", title: "4. Stay Anonymous", desc: "Your counsellor only sees your anonymous name and gradient orb — never your real identity. Their identity is equally hidden." },
    { icon: "🚨", title: "5. Panic Button", desc: "Press Esc or tap the red Esc button at any time to instantly leave to a safe page. No trace is left in the browser." },
  ];

  return (
    <div className="p-6 space-y-5">
      <h2 className="text-xl font-bold text-white mb-4">How the Chat Works</h2>
      {steps.map((s) => (
        <div key={s.title} className="flex gap-4">
          <span className="text-2xl mt-0.5">{s.icon}</span>
          <div>
            <p className="font-semibold text-slate-200 text-sm">{s.title}</p>
            <p className="text-slate-400 text-xs mt-1 leading-relaxed">{s.desc}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Tier Badge ───────────────────────────────────────────────────────────────
function TierBadge({ tier }: { tier: string | null }) {
  if (!tier) return null;
  const label = tier === "professional" ? "Pro" : "Vol";
  const bg = tier === "professional" ? "bg-indigo-900/50 text-indigo-300 border-indigo-700" : "bg-emerald-900/50 text-emerald-300 border-emerald-700";
  return (
    <span className={`px-1.5 py-0.5 rounded text-[9px] uppercase font-bold border ${bg}`}>
      {label}
    </span>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

// ─── Message Status Indicator ────────────────────────────────────────────────
function MessageStatusIcon({ status }: { status?: MessageStatus }) {
  if (!status || status === "sending") {
    return <span className="text-[9px] text-slate-500 ml-1 opacity-60 flex items-center">⏳</span>;
  }
  if (status === "failed") {
    return <span className="text-[9px] text-red-400 ml-1 flex items-center">✗ Failed</span>;
  }
  if (status === "delivered") {
    return (
      <span className="text-[9px] text-cyan-400 ml-1 flex items-center gap-0.5 inline-flex">
        <Check size={10} strokeWidth={3} /><Check size={10} strokeWidth={3} className="-ml-1.5" />
      </span>
    );
  }
  // sent
  return (
    <span className="text-[9px] text-slate-400 ml-1 flex items-center">
      <Check size={10} strokeWidth={3} />
    </span>
  );
}

export function SanctuaryUI() {
  const router = useRouter();
  const { user, token, anonymousName } = useAuth();
  const { activeSessionId, sessions, messages, isTyping, setActiveSession, setSessions, setMessages, addOptimisticMessage, updateMessageStatus, setMessagePlaintext } = useChatStore();
  const [panel, setPanel] = useState<SidePanel>("chats");
  const [inputText, setInputText] = useState("");
  const [showVault, setShowVault] = useState(false);
  // ── Vault key from in-memory Zustand store (survives client nav, wiped on page reload) ──
  const { unlockedPrivKey, unlock: unlockVault } = useVaultStore();
  const [followedCounsellors, setFollowedCounsellors] = useState<FollowedCounsellor[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [socketReady, setSocketReady] = useState(false);

  const handleSessionClick = async (s: any) => {
    if (s.target_user_id) {
      try {
        const res = await fetch(`${API_BASE_URL}/chat/sessions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ targetUserId: s.target_user_id })
        });
        const data = await res.json();
        if (data.session) {
          const sessionId = data.session.id;
          setSessions(useChatStore.getState().sessions.map((sess: any) => 
            sess.id === s.id ? { ...sess, id: sessionId, other_user_id: sess.target_user_id, target_user_id: undefined } : sess
          ));
          setActiveSession(sessionId);
        }
      } catch (err) {
        console.error("Failed to init session", err);
      }
    } else {
      setActiveSession(s.id);
    }
  };

  // Init socket — retry if token wasn't available on first render
  useEffect(() => {
    const sock = initializeSocket();
    if (sock) {
      setSocketReady(true);
    } else {
      // Token might not have been in localStorage yet — retry once token is ready
      const timer = setTimeout(() => {
        const retrySock = initializeSocket();
        if (retrySock) setSocketReady(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [token]);

  // Scroll to bottom
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  // Load followed counsellors AND sessions
  useEffect(() => {
    if (!token) return;
    Promise.all([
      fetch(`${API_BASE_URL}/counsellors/following`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()),
      fetch(`${API_BASE_URL}/chat/sessions`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json())
    ]).then(([followingData, sessionsData]) => {
      let trueSessions: any[] = [];
      if (sessionsData.sessions) {
        trueSessions = sessionsData.sessions.map((s: any) => ({
          id: s.id,
          other_user_id: s.other_user_id,  // ← counsellor's actual user ID for socket routing
          status: s.status || "active",
          updated_at: s.updated_at || new Date().toISOString(),
          anonymous_name: s.anonymous_name,
          public_key: s.public_key,
          is_online: s.is_online
        }));
      }
      
      const followed: FollowedCounsellor[] = followingData.success ? followingData.data.counsellors : [];
      setFollowedCounsellors(followed);

      const merged = [...trueSessions];
      followed.forEach(c => {
        if (!trueSessions.some(s => s.public_key === c.public_key)) {
          merged.push({
            id: c.id,
            target_user_id: c.id,
            status: "active",
            updated_at: new Date().toISOString(),
            anonymous_name: c.anonymous_name,
            public_key: c.public_key,
            is_online: c.is_online
          });
        }
      });
      setSessions(merged);
    }).catch(() => {});
  }, [token, setSessions]);

  // Fetch chat history when active session changes
  // Only fetch if activeSessionId is a real chat session UUID (not a counsellor user ID placeholder)
  useEffect(() => {
    if (!activeSessionId || !token) return;
    // Skip if this is a temporary counsellor-user-id (before session is created)
    // Real session IDs come from the backend and are stored alongside other_user_id
    const session = useChatStore.getState().sessions.find(s => s.id === activeSessionId);
    if (!session || session.target_user_id) return; // skip unresolved sessions

    fetch(`${API_BASE_URL}/chat/sessions/${activeSessionId}/messages`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(r => r.json())
    .then(data => {
      if (data.messages) {
        const mapped = data.messages.map((m: any) => ({
          id: m.id,
          session_id: m.session_id,
          sender_id: m.sender_id,
          encrypted_blob: m.encrypted_blob,
          wrapped_aes_key_sender: m.wrapped_aes_key_sender,
          wrapped_aes_key_recipient: m.wrapped_aes_key_recipient,
          read_at: m.read_at,
          created_at: m.created_at,
          status: "delivered"
        }));

        const currentMessages = useChatStore.getState().messages;
        const others = currentMessages.filter((p) => p.session_id !== activeSessionId);
        setMessages([...others, ...mapped]);
      }
    })
    .catch(err => console.error("Failed to fetch chat history", err));
  }, [activeSessionId, token, setMessages]);

  // Decrypt messages when vault is unlocked
  useEffect(() => {
    if (!unlockedPrivKey) return;
    messages.forEach(async (msg) => {
      if (msg.plaintext || !msg.encrypted_blob || !msg.wrapped_aes_key_sender) return;
      try {
        // Find the other party's public key
        const session = sessions.find((s) => s.id === msg.session_id);
        if (!session) return;
        const wrappedKey = msg.sender_id === user?.id ? msg.wrapped_aes_key_sender : msg.wrapped_aes_key_recipient;
        const text = await decryptMessage(wrappedKey, msg.encrypted_blob, unlockedPrivKey, session.public_key);
        setMessagePlaintext(msg.id, text);
      } catch (err) {
        console.warn("Failed to decrypt message:", msg.id, err);
      }
    });
  }, [unlockedPrivKey, messages, sessions, user?.id, setMessagePlaintext]);

  const activeSession = sessions.find((s) => s.id === activeSessionId);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeSession || !unlockedPrivKey) return;
    // Derive our own public key from localStorage as fallback if user.publicKey is undefined
    const myPublicKey = user?.publicKey ||
      localStorage.getItem("ventsafe-public-key") ||
      localStorage.getItem("ventsafe-signup-public-key") ||
      localStorage.getItem("ventsafe-counsellor-public-key");
    if (!myPublicKey) {
      console.error("Cannot send: own public key not available");
      return;
    }

    const optimisticId = `optimistic-${Date.now()}`;
    const messageText = inputText;
    setInputText("");

    // 1. Add optimistic message immediately so the UI is instant
    addOptimisticMessage({
      id: optimisticId,
      session_id: activeSession.id,
      sender_id: user?.id || "",
      encrypted_blob: "",
      wrapped_aes_key_sender: "",
      wrapped_aes_key_recipient: "",
      read_at: null,
      created_at: new Date().toISOString(),
      status: "sending",
      plaintext: messageText,
    });

    try {
      const { encryptedBlob, wrappedAesKeySender, wrappedAesKeyRecipient } = await encryptMessage(
        messageText,
        unlockedPrivKey,
        activeSession.public_key
      );

      // 2. Emit with ack callback — backend confirms delivery
      // IMPORTANT: receiverId must be the counsellor's USER ID (other_user_id),
      // NOT the chat session UUID. The backend routes to `user:<userId>` rooms.
      const receiverUserId = activeSession.other_user_id || activeSession.target_user_id;
      if (!receiverUserId) {
        console.error("Cannot send: receiver user ID unknown for session", activeSession.id);
        updateMessageStatus(optimisticId, "failed");
        return;
      }

      const sock = getSocket();
      if (!sock?.connected) {
        console.error("Socket not connected — cannot send message");
        updateMessageStatus(optimisticId, "failed");
        return;
      }

      sock.emit(
        "send_message",
        {
          receiverId: receiverUserId,  // ← counsellor's USER ID, not session ID
          messagePayload: {
            session_id: activeSession.id,
            encryptedBlob,
            wrappedAesKeySender,
            wrappedAesKeyRecipient,
          },
        },
        (ack: { status: string }) => {
          if (ack?.status === "delivered") {
            // Server received it and relayed to recipient → ✓✓ delivered
            updateMessageStatus(optimisticId, "delivered");
          } else if (ack?.status === "error") {
            updateMessageStatus(optimisticId, "failed");
          } else {
            // Server received it but recipient may be offline → ✓ sent
            updateMessageStatus(optimisticId, "sent");
          }
        }
      );
    } catch (err) {
      console.error("Encryption failed:", err);
      updateMessageStatus(optimisticId, "failed");
    }
  };

  const handleTyping = () => {
    if (activeSession) getSocket()?.emit("typing", { receiverId: activeSession.id });
  };

  const navItems: { id: SidePanel; icon: React.ReactNode; label: string }[] = [
    { id: "chats", icon: <MessageSquare size={18} />, label: "Chats" },
    { id: "explore", icon: <Compass size={18} />, label: "Explore" },
    { id: "following", icon: <Users size={18} />, label: "Following" },
    { id: "how", icon: <HelpCircle size={18} />, label: "How It Works" },
  ];

  return (
    <div className="flex h-screen bg-[#0A192F] text-slate-300 font-sans overflow-hidden">

      {/* ── Vault Modal ── */}
      <AnimatePresence>
        {showVault && !unlockedPrivKey && (
          <VaultModal onUnlock={(k) => { unlockVault(k); setShowVault(false); }} onClose={() => setShowVault(false)} />
        )}
      </AnimatePresence>

      {/* ── LEFT SIDEBAR ── */}
      <div className={`w-full md:w-64 border-r border-[#233554] bg-[#0A192F] flex-col shrink-0 ${activeSessionId ? "hidden md:flex" : "flex"}`}>
        {/* Logo */}
        <div className="p-5 border-b border-[#233554]">
          <button onClick={() => router.push('/vent-space')} className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-slate-500 hover:text-cyan-400 transition-colors mb-4">
            <ArrowLeft size={14} /> Back to Vent Space
          </button>
          <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 tracking-tighter">VentSafe</h1>
          <p className="text-[10px] text-slate-500 mt-0.5">The Sanctuary</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                if (item.id === "explore") { router.push("/available-counsellors"); return; }
                setPanel(item.id);
              }}
              className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${panel === item.id ? "bg-[#112240] text-cyan-400" : "hover:bg-[#112240]/60 text-slate-400"}`}
            >
              {item.icon} {item.label}
            </button>
          ))}

          {/* Session List (visible in chats panel) */}
          {panel === "chats" && (
            <div className="mt-4">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-600 px-3 mb-2">Your Counsellors</p>
              {sessions.length === 0 ? (
                <div className="px-3 py-4 text-center">
                  <p className="text-xs text-slate-600 italic">No sessions yet. Follow a counsellor to start.</p>
                  <button
                    onClick={() => router.push("/available-counsellors")}
                    className="mt-2 text-xs text-cyan-500 hover:underline flex items-center gap-1 mx-auto"
                  >
                    Explore counsellors <ChevronRight size={12} />
                  </button>
                </div>
              ) : (
                sessions.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => handleSessionClick(s)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center gap-3 transition-colors ${activeSessionId === s.id ? "bg-[#112240] border border-cyan-800/40" : "hover:bg-[#112240]/60"}`}
                  >
                    <div className="relative">
                      <GradientOrb fingerprint={s.public_key} size={32} />
                      <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#0A192F] ${s.is_online ? "bg-green-500" : "bg-slate-600"}`} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-200 truncate">{s.anonymous_name}</p>
                      {isTyping[s.id] && <p className="text-[10px] text-cyan-400 italic">typing...</p>}
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </nav>

        {/* Bottom profile */}
        <div className="p-4 border-t border-[#233554] space-y-2">
          <button
            onClick={() => setShowVault(true)}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-lg hover:bg-[#112240] transition-colors text-slate-400 text-sm"
          >
            <Lock size={16} />
            {unlockedPrivKey ? <span className="text-green-400 flex items-center gap-1"><CheckCircle size={12} /> Vault Open</span> : "Settings & Vault"}
          </button>
          <div className="flex items-center gap-3 px-3 py-2">
            <GradientOrb fingerprint={user?.publicKey || "default"} size={32} />
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-300 truncate">{anonymousName}</p>
              <p className="text-[10px] text-slate-600">Ghost Profile</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── MAIN AREA ── */}
      <div className={`flex-1 flex-col bg-[#0A192F] relative overflow-hidden ${!activeSessionId && panel === "chats" ? "hidden md:flex" : "flex"}`}>
        {/* Subtle background grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(17,34,64,0.3)_1px,transparent_1px),linear-gradient(90deg,rgba(17,34,64,0.3)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

        {/* Following/How panels rendered over the chat area */}
        <AnimatePresence>
          {panel === "following" && (
            <motion.div
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="absolute inset-0 z-10 bg-[#0A192F] overflow-y-auto"
            >
              <div className="p-6">
                <button onClick={() => setPanel("chats")} className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 text-sm">
                  <ArrowLeft size={16} /> Back to Chats
                </button>
                <h2 className="text-xl font-bold text-white mb-4">Counsellors You Follow</h2>
                {followedCounsellors.length === 0 ? (
                  <div className="text-center py-12 opacity-50">
                    <Users size={48} className="text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-500">You are not following any counsellors yet.</p>
                    <button onClick={() => router.push("/available-counsellors")} className="mt-3 text-cyan-500 text-sm hover:underline">
                      Go to Explore
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {followedCounsellors.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => { setActiveSession(c.id); setPanel("chats"); }}
                        className="w-full flex items-center gap-4 bg-[#112240] hover:bg-[#1a2f4f] border border-slate-700 rounded-xl p-4 transition-colors text-left"
                      >
                        <div className="relative">
                          <GradientOrb fingerprint={c.public_key} size={44} />
                          <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#112240] ${c.is_online ? "bg-green-500" : "bg-slate-600"}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-slate-200">{c.anonymous_name}</p>
                            <TierBadge tier={c.tier} />
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">{c.is_online ? "🟢 Active now" : "⚫ Offline"}</p>
                        </div>
                        <ChevronRight size={16} className="text-slate-600" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {panel === "how" && (
            <motion.div
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="absolute inset-0 z-10 bg-[#0A192F] overflow-y-auto"
            >
              <div className="p-6">
                <button onClick={() => setPanel("chats")} className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 text-sm">
                  <ArrowLeft size={16} /> Back
                </button>
                <HowItWorksPanel />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Chat Window */}
        {activeSession ? (
          <>
            {/* Header */}
            <div className="relative z-10 h-20 border-b border-[#233554] flex items-center px-4 md:px-6 gap-3 md:gap-4 bg-[#0a192f]/90 backdrop-blur-md shrink-0">
              <button onClick={() => setActiveSession(null)} className="md:hidden p-1.5 -ml-2 text-slate-400 hover:text-white transition-colors">
                <ArrowLeft size={20} />
              </button>
              <GradientOrb fingerprint={activeSession.public_key} size={40} pulse={activeSession.is_online} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg font-bold text-slate-100">{activeSession.anonymous_name}</h2>
                  <TierBadge tier={(followedCounsellors.find(c => c.id === activeSession.id)?.tier) ?? null} />
                  <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-cyan-900/50 text-cyan-400 border border-cyan-800">E2E Encrypted</span>
                </div>
                <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                  <span className={`w-2 h-2 rounded-full ${activeSession.is_online ? "bg-green-500" : "bg-slate-500"}`} />
                  {activeSession.is_online ? "Active now" : "Offline"}
                  {isTyping[activeSession.id] && " · Typing..."}
                </p>
              </div>
              {!unlockedPrivKey && (
                <button onClick={() => setShowVault(true)} className="text-xs bg-cyan-900/30 hover:bg-cyan-900/50 border border-cyan-800 text-cyan-400 px-3 py-1.5 rounded-full transition-colors flex items-center gap-1">
                  <Lock size={12} /> Unlock Vault
                </button>
              )}
            </div>

            {/* Messages */}
            <div className="relative z-10 flex-1 overflow-y-auto p-6 space-y-4">
              {!unlockedPrivKey && (
                <div className="text-center py-8">
                  <Lock size={32} className="text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-500 text-sm">Unlock your vault to view messages.</p>
                  <button onClick={() => setShowVault(true)} className="mt-3 text-cyan-400 text-sm hover:underline">Unlock now</button>
                </div>
              )}
              {messages.filter((m) => m.session_id === activeSession.id).map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.sender_id === user?.id ? "justify-end" : "justify-start"}`}
                >
                  <div className={`max-w-[85%] md:max-w-md px-4 py-3 rounded-2xl ${
                    msg.sender_id === user?.id
                      ? "bg-cyan-900/40 text-cyan-50 rounded-tr-sm border border-cyan-800/40"
                      : "bg-[#112240]/80 text-slate-200 rounded-tl-sm border border-slate-700/40"
                  } ${msg.status === "failed" ? "opacity-50" : ""}`}>
                    <p className="text-sm">{msg.plaintext || (unlockedPrivKey ? "Decrypting..." : <span className="blur-sm select-none">Encrypted</span>)}</p>
                    <div className="flex items-center justify-end gap-1 mt-1">
                      <p className="text-[10px] text-slate-500">{new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                      {msg.sender_id === user?.id && <MessageStatusIcon status={msg.status} />}
                    </div>
                    {msg.status === "failed" && (
                      <button
                        onClick={() => void handleSendMessage({ preventDefault: () => {} } as React.FormEvent)}
                        className="text-[9px] text-red-400 underline mt-0.5"
                      >
                        Tap to retry
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="relative z-10 p-5 bg-[#0a192f]/90 border-t border-[#233554] shrink-0">
              <form onSubmit={handleSendMessage} className="flex gap-3">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => { setInputText(e.target.value); handleTyping(); }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey && inputText.trim() && unlockedPrivKey) {
                      e.preventDefault();
                      void handleSendMessage(e as unknown as React.FormEvent);
                    }
                  }}
                  disabled={!unlockedPrivKey}
                  placeholder={unlockedPrivKey ? "Write a secure message..." : "Unlock vault to send messages..."}
                  className="flex-1 bg-[#112240] border border-[#233554] rounded-full px-6 py-3 text-sm text-slate-200 focus:outline-none focus:border-cyan-600 transition-colors placeholder:text-slate-600 disabled:opacity-40"
                />
                <button
                  type="submit"
                  disabled={!unlockedPrivKey || !inputText.trim()}
                  className="w-12 h-12 rounded-full bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-700 disabled:text-slate-500 flex items-center justify-center transition-colors shrink-0"
                >
                  <Send size={18} />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="relative z-10 flex-1 flex flex-col items-center justify-center gap-4 opacity-40">
            <MessageSquare size={56} className="text-slate-600" />
            <p className="text-slate-500 text-center max-w-xs">
              {sessions.length === 0
                ? "Follow a counsellor from Explore to start a confidential chat."
                : "Select a counsellor from the sidebar to open the chat."}
            </p>
            {sessions.length === 0 && (
              <button onClick={() => router.push("/available-counsellors")} className="text-cyan-500 text-sm hover:underline flex items-center gap-1">
                Explore Counsellors <ChevronRight size={14} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
