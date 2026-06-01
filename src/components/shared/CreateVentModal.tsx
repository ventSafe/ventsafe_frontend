"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronDown, Lock, Users, Globe, Eye, Sparkles } from "lucide-react";
import type { PostViewData } from "./PostCard";
import { API_BASE_URL } from "@/config/constants";

interface CreateVentModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: string;
  authorName: string;
  viewerRole?: string;
  onPosted: (post: PostViewData) => void;
}

type Privacy = "private" | "following_counsellors" | "all_counsellors" | "public" | "following_students" | "all_students";
type Category =
  | "general"
  | "academic_pressure"
  | "financial_stress"
  | "relationships"
  | "family_issues"
  | "health_concerns"
  | "career_anxiety"
  | "loneliness";

const CATEGORIES: { value: Category; label: string; color: string }[] = [
  { value: "general", label: "General", color: "bg-gray-100 text-gray-700 border-gray-200" },
  { value: "academic_pressure", label: "Academic Pressure", color: "bg-blue-100 text-blue-700 border-blue-200" },
  { value: "financial_stress", label: "Financial Stress", color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  { value: "relationships", label: "Relationships", color: "bg-pink-100 text-pink-700 border-pink-200" },
  { value: "family_issues", label: "Family Issues", color: "bg-orange-100 text-orange-700 border-orange-200" },
  { value: "health_concerns", label: "Health Concerns", color: "bg-green-100 text-green-700 border-green-200" },
  { value: "career_anxiety", label: "Career Anxiety", color: "bg-purple-100 text-purple-700 border-purple-200" },
  { value: "loneliness", label: "Loneliness", color: "bg-slate-100 text-slate-700 border-slate-200" },
];

const STUDENT_PRIVACY_OPTIONS: { value: Privacy; label: string; description: string; icon: React.ReactNode }[] = [
  { value: "private", label: "Private", description: "Only you can see this", icon: <Lock size={14} /> },
  { value: "following_counsellors", label: "Me + Counsellors I Follow", description: "You and your followed counsellors", icon: <Users size={14} /> },
  { value: "all_counsellors", label: "Me + All Counsellors", description: "You and all approved counsellors", icon: <Eye size={14} /> },
  { value: "public", label: "Public", description: "Share with everyone. Anonymous.", icon: <Globe size={14} /> },
];

const COUNSELLOR_PRIVACY_OPTIONS: { value: Privacy; label: string; description: string; icon: React.ReactNode }[] = [
  { value: "private", label: "Private", description: "Only you can see this", icon: <Lock size={14} /> },
  { value: "following_students", label: "Me + Students Following Me", description: "You and students who follow you", icon: <Users size={14} /> },
  { value: "all_students", label: "Me + All Students", description: "Visible to all students on the platform", icon: <Globe size={14} /> },
  { value: "public", label: "Public", description: "Share with everyone. Anonymous.", icon: <Globe size={14} /> },
];

const EMOJIS = ["😊", "😢", "😰", "😤", "😔", "🤔", "😭", "😡", "🥺", "💪"];

export function CreateVentModal({
  isOpen,
  onClose,
  token,
  authorName,
  viewerRole = "student",
  onPosted,
}: CreateVentModalProps) {
  const isCounsellor = viewerRole === "counselor";
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<Category>("general");
  const [privacy, setPrivacy] = useState<Privacy>("private");
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [showEmojis, setShowEmojis] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => textareaRef.current?.focus(), 100);
    } else {
      setContent("");
      setCategory("general");
      setPrivacy("private");
      setError("");
    }
  }, [isOpen]);

  const privacyOptions = isCounsellor ? COUNSELLOR_PRIVACY_OPTIONS : STUDENT_PRIVACY_OPTIONS;
  const selectedPrivacy = privacyOptions.find((p) => p.value === privacy) ?? privacyOptions[0];

  const handleSubmit = async () => {
    if (!content.trim() || content.length < 1) {
      setError("Please write something before posting.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE_URL}/posts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: content.trim(), category, privacy }),
      });
      const data = await res.json();
      if (data.success) {
        onPosted(data.data);
        onClose();
      } else {
        setError(data.error ?? "Failed to post. Please try again.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 z-50 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[820px] bg-ventsafe-card rounded-ventsafe-md shadow-2xl z-50 overflow-hidden max-h-[90vh] overflow-y-auto mx-4"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-ventsafe-border/30">
              <div className="flex items-center gap-2">
                <span className="text-lg">{isCounsellor ? "🌱" : "✨"}</span>
                <div>
                  <h2 className="text-base font-bold text-ventsafe-foreground">
                    {isCounsellor ? "Share Encouragement" : "What\u0027s on your mind?"}
                  </h2>
                  <p className="text-xs text-ventsafe-foreground/50">
                    {isCounsellor ? "Motivate and support students with your words." : "Express yourself freely. No judgment here!"}
                  </p>
                </div>
              </div>
              <button
                title="Close"
                type="button"
                onClick={onClose}
                className="p-2 hover:bg-ventsafe-muted rounded-ventsafe-sm transition-colors"
              >
                <X size={18} className="text-ventsafe-foreground/50" />
              </button>
            </div>

            <div className="px-6 py-4 space-y-5">
              {/* Textarea */}
              <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => {
                  setContent(e.target.value);
                  setError("");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.ctrlKey || e.metaKey) && content.trim()) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
                placeholder={isCounsellor ? "Write a motivational message, share a resource, or encourage a student..." : "Share what you are feeling or share your recovery story. This is your safe space."}
                className="w-full min-h-[180px] border border-ventsafe-border/50 rounded-ventsafe-md p-4 text-sm text-ventsafe-foreground resize-none focus:outline-none focus:border-ventsafe-navy placeholder:text-ventsafe-foreground/30 leading-relaxed"
              />

              {/* Bottom of textarea — emoji + char count */}
              <div className="flex items-center justify-between -mt-2">
                <div className="relative">
                  <button
                    onClick={() => setShowEmojis((e) => !e)}
                    className="text-xl hover:scale-110 transition-transform"
                  >
                    😊
                  </button>
                  <AnimatePresence>
                    {showEmojis && (
                      <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 6 }}
                        className="absolute bottom-full left-0 mb-2 bg-ventsafe-card border border-ventsafe-border rounded-ventsafe-sm shadow-md p-2 flex gap-1 flex-wrap w-48 z-10"
                      >
                        {EMOJIS.map((e) => (
                          <button
                            key={e}
                            onClick={() => {
                              setContent((c) => c + e);
                              setShowEmojis(false);
                            }}
                            className="text-lg hover:scale-125 transition-transform"
                          >
                            {e}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <span className="text-xs text-ventsafe-foreground/40">
                  {content.length.toLocaleString()}/10,000
                </span>
              </div>

              {/* Categories */}
              <div>
                <p className="text-sm font-semibold text-ventsafe-foreground mb-2">
                  Categories
                </p>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.value}
                      onClick={() => setCategory(cat.value)}
                      className={`px-3 py-1 rounded-full text-xs font-medium border transition-all cursor-pointer ${category === cat.value
                        ? cat.color + " ring-2 ring-offset-1 ring-current"
                        : "bg-ventsafe-card border-ventsafe-border text-ventsafe-foreground/60 hover:border-ventsafe-navy"
                        }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
                {/* AI Category Selection — Coming Soon */}
                <button
                  disabled
                  className="mt-3 flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium border border-dashed border-ventsafe-border text-ventsafe-foreground/40 bg-ventsafe-muted/30 cursor-not-allowed"
                >
                  <Sparkles size={14} className="text-ventsafe-navy/40" />
                  AI Category Selection
                  <span className="ml-1 px-1.5 py-0.5 text-[9px] font-bold uppercase bg-ventsafe-navy/10 text-ventsafe-navy rounded-full">
                    Coming Soon
                  </span>
                </button>
              </div>

              {/* Privacy */}
              <div>
                <p className="text-sm font-semibold text-ventsafe-foreground mb-2">
                  Who can see this?
                </p>
                <div className="relative">
                  <button
                    onClick={() => setPrivacyOpen((o) => !o)}
                    className="w-full flex items-center justify-between px-4 py-3 border border-ventsafe-border rounded-ventsafe-md hover:border-ventsafe-navy transition-colors bg-ventsafe-card"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-ventsafe-navy">
                        {selectedPrivacy.icon}
                      </span>
                      <div className="text-left">
                        <p className="text-sm font-medium text-ventsafe-foreground">
                          {selectedPrivacy.label}
                        </p>
                        <p className="text-xs text-ventsafe-foreground/50">
                          {selectedPrivacy.description}
                        </p>
                      </div>
                    </div>
                    <ChevronDown
                      size={16}
                      className={`text-ventsafe-foreground/40 transition-transform ${privacyOpen ? "rotate-180" : ""}`}
                    />
                  </button>

                  <AnimatePresence>
                    {privacyOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="absolute top-full left-0 right-0 mt-1 bg-ventsafe-card border border-ventsafe-border rounded-ventsafe-md shadow-lg z-10 overflow-hidden"
                      >
                        {privacyOptions.map((opt) => (
                          <button
                            key={opt.value}
                            onClick={() => {
                              setPrivacy(opt.value);
                              setPrivacyOpen(false);
                            }}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-ventsafe-muted transition-colors ${privacy === opt.value ? "bg-ventsafe-muted" : ""
                              }`}
                          >
                            <span className="text-ventsafe-navy">{opt.icon}</span>
                            <div>
                              <p className="text-sm font-medium text-ventsafe-foreground">
                                {opt.label}
                              </p>
                              <p className="text-xs text-ventsafe-foreground/50">
                                {opt.description}
                              </p>
                            </div>
                            {privacy === opt.value && (
                              <div className="ml-auto w-2 h-2 rounded-full bg-ventsafe-navy" />
                            )}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Error */}
              {error && (
                <p className="text-xs text-red-500 font-medium">{error}</p>
              )}

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={submitting || !content.trim()}
                className="w-full py-3 bg-ventsafe-foreground text-ventsafe-background rounded-ventsafe-md font-semibold text-sm disabled:opacity-40 hover:opacity-90 transition-opacity cursor-pointer"
              >
                {submitting ? "Posting..." : isCounsellor ? "Share" : "Vent"}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
