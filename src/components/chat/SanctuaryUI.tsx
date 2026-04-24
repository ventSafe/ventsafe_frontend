"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useChatStore } from "@/store/chatStore";
import { initializeSocket, getSocket } from "@/lib/socket";
import { GradientOrb } from "@/components/shared/GradientOrb";
import {
  MessageSquare, Compass, Users, Lock, X, ShieldCheck,
  HelpCircle, ChevronRight, CheckCircle, ArrowLeft, Send,
} from "lucide-react";
import { encryptMessage } from "@/lib/crypto/e2ee";
import { decryptPrivateKey } from "@/lib/blockchain/keys";
import { API_BASE_URL } from "@/config/constants";

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
    if (!/^\d*$/.test(val)) return;
    const next = [...pin];
    next[i] = val.slice(-1);
    setPin(next);
    if (val && i < 3) refs[i + 1].current?.focus();
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

export function SanctuaryUI() {
  const router = useRouter();
  const { user, token, anonymousName } = useAuth();
  const { activeSessionId, sessions, messages, isTyping, setActiveSession, setSessions } = useChatStore();
  const [panel, setPanel] = useState<SidePanel>("chats");
  const [inputText, setInputText] = useState("");
  const [showVault, setShowVault] = useState(false);
  const [unlockedPrivKey, setUnlockedPrivKey] = useState<string | null>(null);
  const [followedCounsellors, setFollowedCounsellors] = useState<FollowedCounsellor[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Init socket
  useEffect(() => { initializeSocket(); }, []);

  // Scroll to bottom
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  // Load followed counsellors
  useEffect(() => {
    if (!token) return;
    fetch(`${API_BASE_URL}/counsellors/following`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          const list: FollowedCounsellor[] = data.data.counsellors;
          setFollowedCounsellors(list);
          // Auto-populate sessions from followed counsellors
          setSessions(list.map((c) => ({
            id: c.id,
            status: "active" as const,
            updated_at: new Date().toISOString(),
            anonymous_name: c.anonymous_name,
            public_key: c.public_key,
            is_online: c.is_online,
          })));
        }
      })
      .catch(() => {});
  }, [token, setSessions]);

  const activeSession = sessions.find((s) => s.id === activeSessionId);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeSession || !unlockedPrivKey || !user?.publicKey) return;
    try {
      const { encryptedBlob, wrappedAesKeySender, wrappedAesKeyRecipient } = await encryptMessage(
        inputText,
        user.publicKey,
        activeSession.public_key
      );
      getSocket()?.emit("send_message", {
        receiverId: activeSession.id,
        messagePayload: {
          session_id: activeSession.id,
          encryptedBlob,
          wrappedAesKeySender,
          wrappedAesKeyRecipient,
        },
      });
      setInputText("");
    } catch (err) {
      console.error("Encryption failed:", err);
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
          <VaultModal onUnlock={(k) => { setUnlockedPrivKey(k); setShowVault(false); }} onClose={() => setShowVault(false)} />
        )}
      </AnimatePresence>

      {/* ── LEFT SIDEBAR ── */}
      <div className="w-64 border-r border-[#233554] bg-[#0A192F] flex flex-col shrink-0">
        {/* Logo */}
        <div className="p-5 border-b border-[#233554]">
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
                    onClick={() => setActiveSession(s.id)}
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
      <div className="flex-1 flex flex-col bg-[#0A192F] relative overflow-hidden">
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
            <div className="relative z-10 h-20 border-b border-[#233554] flex items-center px-6 gap-4 bg-[#0a192f]/90 backdrop-blur-md shrink-0">
              <GradientOrb fingerprint={activeSession.public_key} size={40} pulse={activeSession.is_online} />
              <div className="flex-1">
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
                  <div className={`max-w-md px-4 py-3 rounded-2xl ${
                    msg.sender_id === user?.id
                      ? "bg-cyan-900/40 text-cyan-50 rounded-tr-sm border border-cyan-800/40"
                      : "bg-[#112240]/80 text-slate-200 rounded-tl-sm border border-slate-700/40"
                  }`}>
                    <p className="text-sm">{unlockedPrivKey ? "[Decrypted message]" : <span className="blur-sm select-none">Encrypted</span>}</p>
                    <p className="text-[10px] text-slate-500 mt-1 text-right">{new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
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
