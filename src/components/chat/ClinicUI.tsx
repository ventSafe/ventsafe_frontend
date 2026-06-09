"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useChatStore, type MessageStatus } from "@/store/chatStore";
import { initializeSocket, getSocket } from "@/lib/socket";
import { GradientOrb } from "@/components/shared/GradientOrb";
import {
  Users, FileText, Bell, Lock, X, CheckCircle, ArrowLeft, Send,
  Settings, User as UserIcon, BarChart3, Megaphone, Info, ChevronRight,
  ShieldCheck, Loader2, Check
} from "lucide-react";
import { encryptMessage, decryptMessage } from "@/lib/crypto/e2ee";
import { decryptPrivateKey } from "@/lib/blockchain/keys";
import { API_BASE_URL } from "@/config/constants";
import { useVaultStore } from "@/store/useVaultStore";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FollowerInsights {
  total_followers: number;
  online_followers: number;
}

// ─── Modal Components ─────────────────────────────────────────────────────────

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
      const encKey = localStorage.getItem("ventsafe-counsellor-encrypted-key") ||
        localStorage.getItem("ventsafe-encrypted-private-key");
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
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
        className="relative bg-ventsafe-card border border-ventsafe-border rounded-2xl p-8 w-full max-w-sm shadow-2xl"
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-ventsafe-muted hover:text-ventsafe-foreground/70 transition-colors">
          <X size={20} />
        </button>
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center">
            <ShieldCheck size={24} className="text-indigo-600" />
          </div>
          <div className="text-center">
            <h2 className="text-xl font-bold text-ventsafe-foreground mb-1">Unlock Clinical Suite</h2>
            <p className="text-sm text-ventsafe-muted leading-relaxed">
              Enter your <span className="text-indigo-600 font-semibold">4-digit registration PIN</span> to
              access sensitive chat data and private observations.
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
                className="w-12 h-12 text-center text-2xl font-bold bg-ventsafe-muted border border-ventsafe-border rounded-lg text-ventsafe-foreground focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all"
              />
            ))}
          </div>
          {error && (
            <p className="text-red-500 text-xs text-center bg-red-50 border border-red-100 rounded-lg px-4 py-2 w-full">
              {error}
            </p>
          )}
          <button
            onClick={handleUnlock}
            disabled={loading || pin.join("").length < 4}
            className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-ventsafe-muted text-white font-semibold py-3 rounded-xl transition-all shadow-lg active:scale-[0.98]"
          >
            {loading ? <Loader2 className="animate-spin mx-auto" size={20} /> : "Unlock Workspace"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function InsightsModal({ insights, onClose }: { insights: FollowerInsights | null, onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4"
    >
      <motion.div
        initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
        className="bg-ventsafe-card rounded-2xl p-6 w-full max-w-sm shadow-2xl border border-ventsafe-border"
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-ventsafe-foreground flex items-center gap-2">
            <BarChart3 size={18} className="text-indigo-600" />
            Follower Insights
          </h3>
          <button onClick={onClose} className="text-ventsafe-muted hover:text-ventsafe-foreground/70"><X size={20} /></button>
        </div>

        {!insights ? (
          <div className="flex justify-center p-8"><Loader2 className="animate-spin text-indigo-600" /></div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-ventsafe-muted rounded-xl border border-ventsafe-border">
              <p className="text-xs text-ventsafe-muted font-medium uppercase mb-1">Total Followers</p>
              <p className="text-3xl font-black text-ventsafe-foreground">{insights.total_followers}</p>
            </div>
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
              <p className="text-xs text-emerald-600 font-medium uppercase mb-1">Online Now</p>
              <p className="text-3xl font-black text-emerald-700">{insights.online_followers}</p>
            </div>
          </div>
        )}
        <p className="text-[10px] text-ventsafe-muted mt-6 text-center leading-relaxed">
          Follower insights are aggregated and anonymized. You cannot see individual student identities unless they initiate a chat.
        </p>
      </motion.div>
    </motion.div>
  );
}

function BroadcastModal({ onClose, onSend }: { onClose: () => void, onSend: (text: string) => void }) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4"
    >
      <motion.div
        initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        className="bg-ventsafe-card rounded-2xl p-6 w-full max-w-md shadow-2xl border border-ventsafe-border"
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-ventsafe-foreground flex items-center gap-2">
            <Megaphone size={18} className="text-amber-500" />
            Broadcast professional Tip
          </h3>
          <button onClick={onClose} className="text-ventsafe-muted hover:text-ventsafe-foreground/70"><X size={20} /></button>
        </div>
        <p className="text-xs text-ventsafe-muted mb-4">
          Broadcasts are sent to all your followers' feeds as a "Professional Tip".
          This is a great way to share inspiration or mental health strategies.
        </p>
        <textarea
          autoFocus
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="e.g. Remember to take deep breaths during exam week..."
          className="w-full h-32 bg-ventsafe-muted border border-ventsafe-border rounded-xl p-4 text-sm focus:outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-50"
        />
        <div className="mt-4 flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2 text-sm font-medium text-ventsafe-foreground/70">Cancel</button>
          <button
            disabled={!text.trim() || sending}
            onClick={async () => {
              setSending(true);
              await onSend(text);
              setSending(false);
              onClose();
            }}
            className="flex-[2] bg-amber-500 hover:bg-amber-600 disabled:bg-slate-200 text-white font-bold py-2.5 rounded-xl transition-all shadow-lg active:scale-[0.98] flex items-center justify-center gap-2"
          >
            {sending ? <Loader2 className="animate-spin" size={16} /> : <><Send size={16} /> Broadcast Now</>}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function MessageStatusIcon({ status }: { status?: import("@/store/chatStore").MessageStatus }) {
  if (!status || status === "sending") return <span className="text-[9px] text-ventsafe-muted ml-1 opacity-60 flex items-center">⏳</span>;
  if (status === "failed") return <span className="text-[9px] text-red-400 ml-1 flex items-center">✗</span>;
  if (status === "delivered") {
    return <span className="text-[9px] text-indigo-300 ml-1 inline-flex items-center"><Check size={10} strokeWidth={3} /><Check size={10} strokeWidth={3} className="-ml-1.5" /></span>;
  }
  return <span className="text-[9px] text-indigo-200/60 ml-1 flex items-center"><Check size={10} strokeWidth={3} /></span>;
}

export function ClinicUI() {
  const router = useRouter();
  const { user, token, anonymousName, logout } = useAuth();
  const { activeSessionId, sessions, messages, isTyping, setActiveSession, setSessions, setMessages, addOptimisticMessage, updateMessageStatus, setMessagePlaintext } = useChatStore();
  const [inputText, setInputText] = useState("");
  const [privateNote, setPrivateNote] = useState("");
  const [showVault, setShowVault] = useState(false);
  const [showInsights, setShowInsights] = useState(false);
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [insightsData, setInsightsData] = useState<FollowerInsights | null>(null);
  // ── Vault key from in-memory Zustand store (survives client nav, wiped on page reload) ──
  const { unlockedPrivKey, unlock: unlockVault } = useVaultStore();
  const [followers, setFollowers] = useState<{ id: string; anonymous_name: string; is_online: boolean; public_key: string }[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleFollowerClick = async (f: { id: string; anonymous_name: string; is_online: boolean; public_key: string }) => {
    try {
      const res = await fetch(`${API_BASE_URL}/chat/sessions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ targetUserId: f.id })
      });
      const data = await res.json();
      if (data.session) {
        const sessionId = data.session.id;
        const existing = sessions.find(s => s.id === sessionId);
        if (!existing) {
          setSessions([...sessions, {
            id: sessionId,
            other_user_id: f.id,
            status: data.session.status || "active",
            updated_at: new Date().toISOString(),
            anonymous_name: f.anonymous_name,
            public_key: f.public_key,
            is_online: f.is_online
          }]);
        }
        setActiveSession(sessionId);
      }
    } catch (err) {
      console.error("Failed to init session", err);
    }
  };

  // Fetch chat history when active session changes
  useEffect(() => {
    if (!activeSessionId || !token) return;
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

          const otherMessages = useChatStore.getState().messages.filter(m => m.session_id !== activeSessionId);
          setMessages([...otherMessages, ...mapped]);
        }
      })
      .catch(err => console.error("Failed to fetch chat history", err));
  }, [activeSessionId, token, setMessages]);

  // Init socket — retry if token wasn't available on first render
  useEffect(() => {
    const sock = initializeSocket();
    if (!sock) {
      const timer = setTimeout(() => { initializeSocket(); }, 500);
      return () => clearTimeout(timer);
    }
  }, [token]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Fetch active chat sessions (students this counsellor has chatted with)
  useEffect(() => {
    if (!token) return;
    fetch(`${API_BASE_URL}/chat/sessions`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => {
        if (data.sessions) {
          setSessions(data.sessions.map((s: any) => ({
            id: s.id,
            other_user_id: s.other_user_id,
            status: s.status || "active",
            updated_at: s.updated_at || new Date().toISOString(),
            anonymous_name: s.anonymous_name,
            public_key: s.public_key,
            is_online: s.is_online
          })));
        }
      })
      .catch(() => { });
  }, [token, setSessions]);

  // Fetch followers (students following this counsellor)
  useEffect(() => {
    if (!token) return;
    fetch(`${API_BASE_URL}/counsellors/followers/list`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => { if (data.success && data.data?.followers) setFollowers(data.data.followers); })
      .catch(() => { });
  }, [token]);

  // Decrypt messages when vault is unlocked
  useEffect(() => {
    if (!unlockedPrivKey) return;
    messages.forEach(async (msg) => {
      if (msg.plaintext || !msg.encrypted_blob || !msg.wrapped_aes_key_sender) return;
      try {
        const session = sessions.find((s) => s.id === msg.session_id);
        if (!session) return;
        const wrappedKey = msg.sender_id === user?.id ? msg.wrapped_aes_key_sender : msg.wrapped_aes_key_recipient;
        const text = await decryptMessage(wrappedKey, msg.encrypted_blob, unlockedPrivKey, session.public_key);
        setMessagePlaintext(msg.id, text);
      } catch (err) { console.warn("Decrypt failed:", msg.id, err); }
    });
  }, [unlockedPrivKey, messages, sessions, user?.id, setMessagePlaintext]);

  const fetchInsights = async () => {
    if (!token) return;
    setShowInsights(true);
    try {
      const r = await fetch(`${API_BASE_URL}/counsellors/followers`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const d = await r.json();
      if (d.success) setInsightsData(d.data);
    } catch { }
  };

  const activeSession = sessions.find((s) => s.id === activeSessionId);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeSession || !unlockedPrivKey) return;
    // Derive own public key from localStorage as fallback if user.publicKey is undefined
    const myPublicKey = user?.publicKey ||
      localStorage.getItem("ventsafe-public-key") ||
      localStorage.getItem("ventsafe-counsellor-public-key") ||
      localStorage.getItem("ventsafe-signup-public-key");
    if (!myPublicKey) {
      console.error("Cannot send: own public key not available");
      return;
    }

    const optimisticId = `optimistic-${Date.now()}`;
    const messageText = inputText;
    setInputText("");

    // 1. Optimistic message — show immediately with 'sending' status
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

      // IMPORTANT: receiverId must be the student's USER ID (other_user_id),
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
          // receiverId must be the actual user UUID, not the session UUID
          receiverId: receiverUserId,  // ← student's USER ID, not session ID
          messagePayload: {
            session_id: activeSession.id,
            encryptedBlob,
            wrappedAesKeySender,
            wrappedAesKeyRecipient,
          },
        },
        (ack: { status: string }) => {
          if (ack?.status === "delivered") {
            updateMessageStatus(optimisticId, "delivered");
          } else if (ack?.status === "error") {
            updateMessageStatus(optimisticId, "failed");
          } else {
            updateMessageStatus(optimisticId, "sent");
          }
        }
      );
    } catch (err) {
      console.error("Encryption failed:", err);
      updateMessageStatus(optimisticId, "failed");
    }
  };

  const handleBroadcast = async (content: string) => {
    if (!token) return;
    try {
      await fetch(`${API_BASE_URL}/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          content,
          category: 'counsellor_tip',
          privacy: 'public'
        })
      });
    } catch { }
  };

  const handleSaveNote = () => {
    if (!user?.publicKey || !privateNote) return;
    // ... encryption logic if needed for backend ...
  };

  return (
    <div className="flex h-screen bg-ventsafe-muted text-ventsafe-foreground font-sans overflow-hidden">

      {/* ── MODALS ── */}
      <AnimatePresence>
        {showVault && !unlockedPrivKey && (
          <VaultModal onUnlock={(pk) => { unlockVault(pk); setShowVault(false); }} onClose={() => setShowVault(false)} />
        )}
        {showInsights && (
          <InsightsModal insights={insightsData} onClose={() => setShowInsights(false)} />
        )}
        {showBroadcast && (
          <BroadcastModal onClose={() => setShowBroadcast(false)} onSend={handleBroadcast} />
        )}
      </AnimatePresence>

      {/* ── SIDEBAR ── */}
      <div className={`w-full md:w-72 bg-ventsafe-card border-r border-ventsafe-border flex-col shrink-0 shadow-sm z-20 ${activeSessionId ? "hidden md:flex" : "flex"}`}>
        <div className="p-6 border-b border-ventsafe-border">
          <button onClick={() => router.push('/vent-space')} className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-ventsafe-muted hover:text-indigo-600 transition-colors mb-4">
            <ArrowLeft size={14} /> Back to Vent Space
          </button>
          <h1 className="text-xl font-black tracking-tighter text-ventsafe-foreground mb-1">
            VentSafe <span className="text-indigo-600">Clinic</span>
          </h1>
          <div className="flex items-center gap-2 group cursor-pointer" onClick={() => router.push('/profile')}>
            <span className="text-[10px] text-ventsafe-muted font-bold uppercase tracking-widest">Workspace ID: {user?.id.slice(0, 8)}</span>
            <ChevronRight size={10} className="text-slate-300 group-hover:text-indigo-500 transition-colors" />
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-4">
          <div className="px-4 mb-6">
            <h3 className="text-[10px] font-bold text-ventsafe-muted uppercase tracking-[0.2em] mb-3 px-2">Active Cases</h3>
            <div className="space-y-1">
              {sessions.map(s => (
                <button
                  key={s.id}
                  onClick={() => setActiveSession(s.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl flex items-center gap-3 transition-all ${activeSessionId === s.id
                    ? 'bg-indigo-50 border border-indigo-100 shadow-sm'
                    : 'hover:bg-ventsafe-muted text-ventsafe-foreground/70'
                    }`}
                >
                  <GradientOrb fingerprint={s.id} size={30} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold truncate ${activeSessionId === s.id ? 'text-indigo-900' : 'text-ventsafe-foreground/80'}`}>
                      {s.anonymous_name}
                    </p>
                    <p className="text-[10px] text-ventsafe-muted">{s.is_online ? '🟢 Online' : '⚫ Offline'}</p>
                  </div>
                  {isTyping[s.id] && <Loader2 className="animate-spin text-indigo-400" size={12} />}
                </button>
              ))}
              {sessions.length === 0 && (
                <div className="px-2 py-8 text-center bg-ventsafe-muted/50 rounded-2xl border border-dashed border-ventsafe-border">
                  <p className="text-xs text-ventsafe-muted italic">No assigned cases yet</p>
                </div>
              )}
            </div>
          </div>
          <div className="px-4 border-t border-ventsafe-border pt-6 mb-6">
            <h3 className="text-[10px] font-bold text-ventsafe-muted uppercase tracking-[0.2em] mb-3 px-2">
              <Users size={12} className="inline mr-1" />Followers ({followers.length})
            </h3>
            <div className="space-y-1">
              {followers.length === 0 ? (
                <div className="px-2 py-4 text-center bg-ventsafe-muted/50 rounded-2xl border border-dashed border-ventsafe-border">
                  <p className="text-xs text-ventsafe-muted italic">No followers yet</p>
                </div>
              ) : (
                followers.map(f => (
                  <button
                    key={f.id}
                    onClick={() => handleFollowerClick(f)}
                    className="w-full text-left px-3 py-2 rounded-xl flex items-center gap-3 hover:bg-ventsafe-muted transition-all cursor-pointer"
                  >
                    <GradientOrb fingerprint={f.id} size={26} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-ventsafe-foreground/80 truncate">{f.anonymous_name}</p>
                      <p className="text-[9px] text-ventsafe-muted">{f.is_online ? '🟢 Online' : '⚫ Offline'}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
          <div className="px-4 border-t border-ventsafe-border pt-6 space-y-1">
            <h3 className="text-[10px] font-bold text-ventsafe-muted uppercase tracking-[0.2em] mb-3 px-2">Professional Tools</h3>
            <button
              onClick={fetchInsights}
              className="w-full flex items-center gap-3 text-sm font-medium text-ventsafe-foreground/70 hover:text-indigo-600 hover:bg-indigo-50 px-3 py-3 rounded-xl transition-all"
            >
              <BarChart3 size={18} /> Follower Insights
            </button>
            <button
              onClick={() => setShowBroadcast(true)}
              className="w-full flex items-center gap-3 text-sm font-medium text-ventsafe-foreground/70 hover:text-amber-600 hover:bg-amber-50 px-3 py-3 rounded-xl transition-all"
            >
              <Megaphone size={18} /> Broadcast Tip
            </button>
          </div>
        </nav>

        {/* Profile Section */}
        <div className="p-4 bg-ventsafe-muted/50 border-t border-ventsafe-border mt-auto">
          <div className="flex items-center gap-3 p-3 bg-ventsafe-card rounded-2xl shadow-sm border border-ventsafe-border mb-2">
            <GradientOrb fingerprint={user?.publicKey || "clinic"} size={36} />
            <div className="min-w-0">
              <p className="text-sm font-bold text-ventsafe-foreground truncate">{anonymousName}</p>
              <p className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full inline-block ${user?.role === 'counselor' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'
                }`}>
                {user?.role === 'counselor' ? 'Professional' : 'Volunteer'}
              </p>
            </div>
          </div>
          <div className="flex gap-1">
            <button onClick={() => router.push('/settings')} className="flex-1 flex items-center justify-center gap-2 py-2 text-[11px] font-bold text-ventsafe-muted hover:text-indigo-600 hover:bg-ventsafe-card rounded-xl transition-all">
              <Settings size={14} /> Settings
            </button>
            <button onClick={() => setShowVault(true)} className="flex-1 flex items-center justify-center gap-2 py-2 text-[11px] font-bold text-ventsafe-muted hover:text-indigo-600 hover:bg-ventsafe-card rounded-xl transition-all">
              <Lock size={14} /> {unlockedPrivKey ? 'Secure' : 'Unlock'}
            </button>
          </div>
        </div>
      </div>

      {/* ── MAIN AREA ── */}
      <div className={`flex-1 flex-col bg-ventsafe-card relative ${!activeSessionId ? "hidden md:flex" : "flex"}`}>
        {activeSession ? (
          <>
            {/* Header */}
            <div className="h-20 border-b border-ventsafe-border flex items-center px-4 md:px-8 justify-between shrink-0 bg-ventsafe-card/80 backdrop-blur-md sticky top-0 z-10">
              <div className="flex items-center gap-3 md:gap-4 min-w-0">
                <button onClick={() => setActiveSession(null)} className="md:hidden p-1.5 -ml-2 text-ventsafe-muted hover:text-ventsafe-foreground/80 transition-colors">
                  <ArrowLeft size={20} />
                </button>
                <div className="shrink-0">
                  <GradientOrb fingerprint={activeSession.id} size={44} pulse={activeSession.is_online} />
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg md:text-xl font-black text-ventsafe-foreground tracking-tight truncate">{activeSession.anonymous_name}</h2>
                  <p className="text-xs text-ventsafe-muted flex items-center gap-1.5 mt-0.5 truncate">
                    <span className={`shrink-0 w-2 h-2 rounded-full ${activeSession.is_online ? "bg-emerald-500 animate-pulse" : "bg-slate-300"}`} />
                    <span className="truncate">{activeSession.is_online ? "Active Now" : "Currently Offline"}</span>
                    {isTyping[activeSession.id] && <span className="italic text-indigo-500 ml-1 md:ml-2">typing...</span>}
                  </p>
                </div>
              </div>
              <div className="hidden md:flex items-center gap-3">
                <div className="px-3 py-1.5 rounded-full bg-ventsafe-muted text-ventsafe-foreground/70 text-[10px] font-bold uppercase tracking-widest border border-ventsafe-border">
                  Double-Blind Secure Session
                </div>
              </div>
            </div>

            {/* Chat Body */}
            <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] bg-[size:32px_32px]">
              {!unlockedPrivKey ? (
                <div className="flex flex-col items-center justify-center h-full opacity-40">
                  <Lock size={48} className="text-slate-300 mb-4" />
                  <h3 className="font-bold text-ventsafe-foreground">Workspace is Locked</h3>
                  <p className="text-sm text-ventsafe-muted max-w-xs text-center mt-2">
                    Messages are end-to-end encrypted. Use your PIN to unlock the workspace and decrypt the clinical conversation.
                  </p>
                  <button onClick={() => setShowVault(true)} className="mt-6 bg-slate-900 text-white px-6 py-2 rounded-full font-bold text-sm shadow-xl active:scale-95 transition-all">
                    Unlock Clinical Workspace
                  </button>
                </div>
              ) : (
                <>
                  {messages.filter(m => m.session_id === activeSession.id).map(msg => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[85%] md:max-w-md px-5 py-3.5 shadow-sm rounded-3xl border ${
                    msg.sender_id === user?.id
                        ? 'bg-indigo-600 text-white rounded-tr-none border-indigo-500'
                        : 'bg-ventsafe-card text-ventsafe-foreground/80 rounded-tl-none border-ventsafe-border'
                        } ${msg.status === 'failed' ? 'opacity-50' : ''}`}>
                        <p className="text-sm leading-relaxed">{msg.plaintext || (unlockedPrivKey ? "Decrypting..." : "[Encrypted]")}</p>
                        <div className={`flex items-center gap-1 mt-2 ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}>
                          <p className={`text-[9px] font-bold uppercase ${msg.sender_id === user?.id ? 'text-indigo-200' : 'text-ventsafe-muted'}`}>
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                          {msg.sender_id === user?.id && <MessageStatusIcon status={msg.status} />}
                        </div>
                        {msg.status === 'failed' && <p className="text-[9px] text-red-300 mt-0.5">Failed to send.</p>}
                      </div>
                    </motion.div>
                  ))}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Input */}
            <div className="p-6 border-t border-ventsafe-border bg-ventsafe-card shrink-0">
              <form onSubmit={handleSendMessage} className="relative group">
                <input
                  disabled={!unlockedPrivKey}
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey && inputText.trim() && unlockedPrivKey) {
                      e.preventDefault();
                      void handleSendMessage(e as unknown as React.FormEvent);
                    }
                  }}
                  placeholder={unlockedPrivKey ? "Write a professional message..." : "Unlock workspace to participate..."}
                  className="w-full bg-ventsafe-muted border border-ventsafe-border rounded-2xl pl-6 pr-16 py-4 text-sm focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition-all shadow-inner disabled:opacity-50"
                />
                <button
                  disabled={!unlockedPrivKey || !inputText.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-11 h-11 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white flex items-center justify-center transition-all shadow-lg shadow-indigo-200 group-focus-within:scale-105 active:scale-95"
                >
                  <Send size={18} />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
            <div className="w-20 h-20 rounded-3xl bg-ventsafe-muted border border-ventsafe-border flex items-center justify-center mb-6">
              <ShieldCheck size={40} className="text-indigo-200" />
            </div>
            <h3 className="text-xl font-black text-ventsafe-foreground tracking-tight">Select a Clinical Case</h3>
            <p className="text-sm text-ventsafe-muted max-w-sm mt-3 leading-relaxed">
              Pick a student from the active cases sidebar to initiate a secure, encrypted clinical session.
            </p>
          </div>
        )}
      </div>

      {/* ── RIGHT PANEL (Private Notes) ── */}
      <div className="w-80 bg-ventsafe-card border-l border-ventsafe-border flex flex-col hidden 2xl:flex shrink-0">
        <div className="h-20 border-b border-ventsafe-border flex items-center px-6 justify-between shrink-0 bg-ventsafe-muted/30">
          <h3 className="font-black text-ventsafe-foreground text-sm tracking-tight flex items-center gap-2">
            <FileText size={16} className="text-indigo-600" /> Clinical Observations
          </h3>
          <div className="flex gap-1">
            <div className="w-2 h-2 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.8)]" />
            <div className="w-2 h-2 rounded-full bg-amber-400" />
          </div>
        </div>

        {activeSession ? (
          <div className="flex-1 p-6 flex flex-col gap-4 overflow-y-auto">
            <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100">
              <p className="text-[11px] text-indigo-700 font-bold leading-relaxed flex items-start gap-2">
                <Info size={14} className="shrink-0 mt-0.5" />
                Notes are encrypted client-side. They are never sent in plaintext and are NOT visible to the student.
              </p>
            </div>
            <textarea
              value={privateNote}
              onChange={(e) => setPrivateNote(e.target.value)}
              placeholder="Draft clinical notes, observations, or strategies..."
              disabled={!unlockedPrivKey}
              className="flex-1 w-full bg-ventsafe-muted border border-ventsafe-border rounded-2xl p-5 text-sm focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 resize-none transition-all disabled:opacity-50 shadow-inner"
            />
            <button
              onClick={handleSaveNote}
              disabled={!unlockedPrivKey || !privateNote.trim()}
              className="w-full bg-slate-900 hover:bg-black disabled:bg-slate-200 text-white text-xs font-black uppercase tracking-widest py-4 rounded-2xl shadow-xl transition-all active:scale-[0.98] mb-4"
            >
              Encrypt & Save Note
            </button>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center opacity-30 grayscale">
            <FileText size={56} className="text-slate-300 mb-4" />
            <p className="text-xs font-bold text-ventsafe-muted uppercase tracking-widest">Select case for notes</p>
          </div>
        )}
      </div>
    </div>
  );
}
