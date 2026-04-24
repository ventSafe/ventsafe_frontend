"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useChatStore } from "@/store/chatStore";
import { initializeSocket, getSocket } from "@/lib/socket";
import { GradientOrb } from "@/components/shared/GradientOrb";
import {
  Users, FileText, Bell, Lock, X, CheckCircle, ArrowLeft, Send,
  Settings, User as UserIcon, BarChart3, Megaphone, Info, ChevronRight,
  ShieldCheck, Loader2
} from "lucide-react";
import { encryptMessage } from "@/lib/crypto/e2ee";
import { decryptPrivateKey } from "@/lib/blockchain/keys";
import { API_BASE_URL } from "@/config/constants";
import forge from "node-forge";

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
        className="relative bg-white border border-slate-200 rounded-2xl p-8 w-full max-w-sm shadow-2xl"
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors">
          <X size={20} />
        </button>
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center">
            <ShieldCheck size={24} className="text-indigo-600" />
          </div>
          <div className="text-center">
            <h2 className="text-xl font-bold text-slate-900 mb-1">Unlock Clinical Suite</h2>
            <p className="text-sm text-slate-500 leading-relaxed">
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
                className="w-12 h-12 text-center text-2xl font-bold bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all"
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
            className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold py-3 rounded-xl transition-all shadow-lg active:scale-[0.98]"
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
        className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl border border-slate-100"
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 size={18} className="text-indigo-600" />
            Follower Insights
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
        </div>
        
        {!insights ? (
           <div className="flex justify-center p-8"><Loader2 className="animate-spin text-indigo-600" /></div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-xs text-slate-500 font-medium uppercase mb-1">Total Followers</p>
              <p className="text-3xl font-black text-slate-900">{insights.total_followers}</p>
            </div>
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
              <p className="text-xs text-emerald-600 font-medium uppercase mb-1">Online Now</p>
              <p className="text-3xl font-black text-emerald-700">{insights.online_followers}</p>
            </div>
          </div>
        )}
        <p className="text-[10px] text-slate-400 mt-6 text-center leading-relaxed">
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
        className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-slate-100"
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-slate-900 flex items-center gap-2">
            <Megaphone size={18} className="text-amber-500" />
            Broadcast professional Tip
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
        </div>
        <p className="text-xs text-slate-500 mb-4">
          Broadcasts are sent to all your followers' feeds as a "Professional Tip". 
          This is a great way to share inspiration or mental health strategies.
        </p>
        <textarea
          autoFocus
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="e.g. Remember to take deep breaths during exam week..."
          className="w-full h-32 bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm focus:outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-50"
        />
        <div className="mt-4 flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2 text-sm font-medium text-slate-600">Cancel</button>
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
            {sending ? <Loader2 className="animate-spin" size={16} /> : <><Send size={16}/> Broadcast Now</>}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ClinicUI() {
  const router = useRouter();
  const { user, token, anonymousName, logout } = useAuth();
  const { activeSessionId, sessions, messages, isTyping, setActiveSession, setSessions } = useChatStore();
  const [inputText, setInputText] = useState("");
  const [privateNote, setPrivateNote] = useState("");
  const [showVault, setShowVault] = useState(false);
  const [showInsights, setShowInsights] = useState(false);
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [insightsData, setInsightsData] = useState<FollowerInsights | null>(null);
  const [unlockedPrivKey, setUnlockedPrivKey] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Init socket and fetch status
  useEffect(() => { 
    initializeSocket(); 
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Fetch active students (cases)
  useEffect(() => {
    if (!token) return;
    fetch(`${API_BASE_URL}/counsellors/students`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(r => r.json())
    .then(data => {
      if (data.success) {
        setSessions(data.data.students.map((s: any) => ({
          id: s.id,
          status: "active",
          updated_at: s.last_seen || new Date().toISOString(),
          anonymous_name: s.anonymous_name,
          public_key: s.public_key, // Backend needs to return this in the student list for E2EE
          is_online: s.is_online
        })));
      }
    })
    .catch(() => {});
  }, [token, setSessions]);

  const fetchInsights = async () => {
    if (!token) return;
    setShowInsights(true);
    try {
      const r = await fetch(`${API_BASE_URL}/counsellors/followers`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const d = await r.json();
      if (d.success) setInsightsData(d.data);
    } catch {}
  };

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
          wrappedAesKeyRecipient
        }
      });
      setInputText("");
    } catch (err) {
      console.error("Encryption failed:", err);
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
    } catch {}
  };

  const handleSaveNote = () => {
    if (!user?.publicKey || !privateNote) return;
    // ... encryption logic if needed for backend ...
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-800 font-sans overflow-hidden">
      
      {/* ── MODALS ── */}
      <AnimatePresence>
        {showVault && !unlockedPrivKey && (
          <VaultModal onUnlock={(pk) => { setUnlockedPrivKey(pk); setShowVault(false); }} onClose={() => setShowVault(false)} />
        )}
        {showInsights && (
          <InsightsModal insights={insightsData} onClose={() => setShowInsights(false)} />
        )}
        {showBroadcast && (
          <BroadcastModal onClose={() => setShowBroadcast(false)} onSend={handleBroadcast} />
        )}
      </AnimatePresence>

      {/* ── SIDEBAR ── */}
      <div className="w-72 bg-white border-r border-slate-200 flex flex-col shrink-0 shadow-sm z-20">
        <div className="p-6 border-b border-slate-100">
          <h1 className="text-xl font-black tracking-tighter text-slate-900 mb-1">
            VentSafe <span className="text-indigo-600">Clinic</span>
          </h1>
          <div className="flex items-center gap-2 group cursor-pointer" onClick={() => router.push('/profile')}>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Workspace ID: {user?.id.slice(0,8)}</span>
            <ChevronRight size={10} className="text-slate-300 group-hover:text-indigo-500 transition-colors" />
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-4">
          <div className="px-4 mb-6">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-3 px-2">Active Cases</h3>
            <div className="space-y-1">
              {sessions.map(s => (
                <button 
                  key={s.id}
                  onClick={() => setActiveSession(s.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl flex items-center gap-3 transition-all ${
                    activeSessionId === s.id 
                    ? 'bg-indigo-50 border border-indigo-100 shadow-sm' 
                    : 'hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <GradientOrb fingerprint={s.id} size={30} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold truncate ${activeSessionId === s.id ? 'text-indigo-900' : 'text-slate-700'}`}>
                      {s.anonymous_name}
                    </p>
                    <p className="text-[10px] text-slate-400">{s.is_online ? '🟢 Online' : '⚫ Offline'}</p>
                  </div>
                  {isTyping[s.id] && <Loader2 className="animate-spin text-indigo-400" size={12} />}
                </button>
              ))}
              {sessions.length === 0 && (
                <div className="px-2 py-8 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                  <p className="text-xs text-slate-400 italic">No assigned cases yet</p>
                </div>
              )}
            </div>
          </div>

          <div className="px-4 border-t border-slate-100 pt-6 space-y-1">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-3 px-2">Professional Tools</h3>
            <button 
              onClick={fetchInsights}
              className="w-full flex items-center gap-3 text-sm font-medium text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 px-3 py-3 rounded-xl transition-all"
            >
              <BarChart3 size={18} /> Follower Insights
            </button>
            <button 
              onClick={() => setShowBroadcast(true)}
              className="w-full flex items-center gap-3 text-sm font-medium text-slate-600 hover:text-amber-600 hover:bg-amber-50 px-3 py-3 rounded-xl transition-all"
            >
              <Megaphone size={18} /> Broadcast Tip
            </button>
          </div>
        </nav>

        {/* Profile Section */}
        <div className="p-4 bg-slate-50/50 border-t border-slate-100 mt-auto">
          <div className="flex items-center gap-3 p-3 bg-white rounded-2xl shadow-sm border border-slate-100 mb-2">
            <GradientOrb fingerprint={user?.publicKey || "clinic"} size={36} />
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-800 truncate">{anonymousName}</p>
              <p className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full inline-block ${
                user?.role === 'counselor' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'
              }`}>
                {user?.role === 'counselor' ? 'Professional' : 'Volunteer'}
              </p>
            </div>
          </div>
          <div className="flex gap-1">
            <button onClick={() => router.push('/settings')} className="flex-1 flex items-center justify-center gap-2 py-2 text-[11px] font-bold text-slate-500 hover:text-indigo-600 hover:bg-white rounded-xl transition-all">
              <Settings size={14} /> Settings
            </button>
            <button onClick={() => setShowVault(true)} className="flex-1 flex items-center justify-center gap-2 py-2 text-[11px] font-bold text-slate-500 hover:text-indigo-600 hover:bg-white rounded-xl transition-all">
              <Lock size={14} /> {unlockedPrivKey ? 'Secure' : 'Unlock'}
            </button>
          </div>
        </div>
      </div>

      {/* ── MAIN AREA ── */}
      <div className="flex-1 flex flex-col bg-white relative">
        {activeSession ? (
          <>
            {/* Header */}
            <div className="h-20 border-b border-slate-100 flex items-center px-8 justify-between shrink-0 bg-white/80 backdrop-blur-md sticky top-0 z-10">
               <div className="flex items-center gap-4">
                 <GradientOrb fingerprint={activeSession.id} size={44} pulse={activeSession.is_online} />
                 <div>
                   <h2 className="text-xl font-black text-slate-900 tracking-tight">{activeSession.anonymous_name}</h2>
                   <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                     <span className={`w-2 h-2 rounded-full ${activeSession.is_online ? "bg-emerald-500 animate-pulse" : "bg-slate-300"}`} />
                     {activeSession.is_online ? "Active Now" : "Currently Offline"}
                     {isTyping[activeSession.id] && <span className="italic text-indigo-500 ml-2">student is typing...</span>}
                   </p>
                 </div>
               </div>
               <div className="flex items-center gap-3">
                 <div className="px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-widest border border-slate-200">
                    Double-Blind Secure Session
                 </div>
               </div>
            </div>

            {/* Chat Body */}
            <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] bg-[size:32px_32px]">
               {!unlockedPrivKey ? (
                 <div className="flex flex-col items-center justify-center h-full opacity-40">
                   <Lock size={48} className="text-slate-300 mb-4" />
                   <h3 className="font-bold text-slate-900">Workspace is Locked</h3>
                   <p className="text-sm text-slate-500 max-w-xs text-center mt-2">
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
                      <div className={`max-w-[70%] p-4 rounded-3xl shadow-sm border ${
                        msg.sender_id === user?.id 
                         ? 'bg-indigo-600 text-white rounded-tr-none border-indigo-500' 
                         : 'bg-white text-slate-700 rounded-tl-none border-slate-200'
                      }`}>
                         <p className="text-sm leading-relaxed">[Decrypted Message Content]</p>
                         <p className={`text-[9px] mt-2 font-bold uppercase ${msg.sender_id === user?.id ? 'text-indigo-200' : 'text-slate-400'}`}>
                           {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                         </p>
                      </div>
                    </motion.div>
                  ))}
                  <div ref={messagesEndRef} />
                 </>
               )}
            </div>

            {/* Input */}
            <div className="p-6 border-t border-slate-100 bg-white shrink-0">
               <form onSubmit={handleSendMessage} className="relative group">
                 <input 
                   disabled={!unlockedPrivKey}
                   type="text" 
                   value={inputText}
                   onChange={(e) => setInputText(e.target.value)}
                   placeholder={unlockedPrivKey ? "Write a professional message..." : "Unlock workspace to participate..."}
                   className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition-all shadow-inner disabled:opacity-50"
                 />
                 <button 
                   disabled={!unlockedPrivKey || !inputText.trim()}
                   className="absolute right-3 top-2.5 w-11 h-11 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white flex items-center justify-center transition-all shadow-lg shadow-indigo-200 group-focus-within:scale-105 active:scale-95"
                 >
                   <Send size={18} />
                 </button>
               </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
             <div className="w-20 h-20 rounded-3xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-6">
                <ShieldCheck size={40} className="text-indigo-200" />
             </div>
             <h3 className="text-xl font-black text-slate-900 tracking-tight">Select a Clinical Case</h3>
             <p className="text-sm text-slate-500 max-w-sm mt-3 leading-relaxed">
               Pick a student from the active cases sidebar to initiate a secure, encrypted clinical session.
             </p>
          </div>
        )}
      </div>

      {/* ── RIGHT PANEL (Private Notes) ── */}
      <div className="w-80 bg-white border-l border-slate-200 flex flex-col hidden 2xl:flex shrink-0">
         <div className="h-20 border-b border-slate-100 flex items-center px-6 justify-between shrink-0 bg-slate-50/30">
           <h3 className="font-black text-slate-900 text-sm tracking-tight flex items-center gap-2">
             <FileText size={16} className="text-indigo-600"/> Clinical Observations
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
               className="flex-1 w-full bg-slate-50 border border-slate-200 rounded-2xl p-5 text-sm focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 resize-none transition-all disabled:opacity-50 shadow-inner"
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
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Select case for notes</p>
            </div>
         )}
      </div>
    </div>
  );
}
