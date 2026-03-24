"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronDown, LogOut, X } from "lucide-react";
import { API_BASE_URL, STORAGE_KEYS } from "@/config/constants";

const MALE_NAMES = [
  "Emeka",
  "Chidi",
  "Tunde",
  "Kola",
  "Femi",
  "Bayo",
  "Seun",
  "Tobi",
  "Dele",
  "Wale",
  "Ade",
  "Gbenga",
  "Kunle",
  "Rotimi",
  "Lanre",
  "Biodun",
  "Ifeanyi",
  "Uche",
  "Obinna",
  "Chidera",
  "Nnamdi",
  "Ikenna",
  "Chukwu",
  "Aminu",
  "Ibrahim",
  "Musa",
  "Yusuf",
  "Abdullahi",
  "Suleiman",
  "Abubakar",
];

const FEMALE_NAMES = [
  "Adaeze",
  "Chisom",
  "Ngozi",
  "Amaka",
  "Ify",
  "Ifeoma",
  "Chiamaka",
  "Temi",
  "Bisi",
  "Yemi",
  "Sola",
  "Folake",
  "Ronke",
  "Funmi",
  "Shade",
  "Kemi",
  "Lola",
  "Toyin",
  "Dupe",
  "Nneka",
  "Obiageli",
  "Chinwe",
  "Fatima",
  "Aisha",
  "Zainab",
  "Hauwa",
  "Maryam",
  "Halima",
  "Ramatu",
];

type Step = "ask" | "pick";

interface LogoutModalProps {
  isOpen: boolean;
  currentName: string;
  gender: "male" | "female";
  onConfirm: () => void;
  onCancel: () => void;
  mode?: "logout" | "login"; // logout = before logout, login = after login
}

export function LogoutModal({
  isOpen,
  currentName,
  gender,
  onConfirm,
  onCancel,
  mode = "logout",
}: LogoutModalProps) {
  const [step, setStep] = useState<Step>("ask");
  const [selectedName, setSelectedName] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const names = gender === "male" ? MALE_NAMES : FEMALE_NAMES;
  // Remove current name from options
  const availableNames = names.filter((n) => n !== currentName);

  const handleSaveAndLogout = async () => {
    if (!selectedName) {
      setError("Please select a name.");
      return;
    }
    setError("");
    setIsSaving(true);

    try {
      const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      const res = await fetch(`${API_BASE_URL}/auth/update-name`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ anonymousName: selectedName }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.message || "Failed to update name. Please try again.");
        return;
      }

      // Update localStorage immediately
      localStorage.setItem("ventsafe-anon-name", selectedName);

      // Proceed — either continue to app (login mode) or logout (logout mode)
      onConfirm();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSkipAndLogout = () => {
    setStep("ask");
    setSelectedName("");
    onConfirm();
  };

  const handleClose = () => {
    setStep("ask");
    setSelectedName("");
    setError("");
    onCancel();
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
            onClick={handleClose}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-white rounded-2xl shadow-2xl z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-ventsafe-border/30">
              <div className="flex items-center gap-2">
                <LogOut className="w-4 h-4 text-ventsafe-foreground" />
                <span className="text-sm font-bold text-ventsafe-foreground">
                  {mode === "login" ? "Welcome Back!" : "Logging Out"}
                </span>
              </div>
                          <button
                              type="button"
                              title="close"
                onClick={handleClose}
                className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-ventsafe-background transition-colors cursor-pointer"
              >
                <X className="w-4 h-4 text-ventsafe-foreground/50" />
              </button>
            </div>

            <AnimatePresence mode="wait">
              {/* ── Step 1: Ask ── */}
              {step === "ask" && (
                <motion.div
                  key="ask"
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ type: "spring", stiffness: 300, damping: 28 }}
                  className="p-5"
                >
                  <p className="text-sm text-ventsafe-foreground/70 mb-1">
                    You are currently known as
                  </p>
                  <p className="text-lg font-bold text-ventsafe-foreground mb-4">
                    {currentName}
                  </p>
                  <p className="text-sm text-ventsafe-foreground mb-6">
                    {mode === "login"
                      ? "Would you like a new anonymous name for this session?"
                      : "Would you like to change your anonymous name before logging out?"}
                  </p>

                  <div className="flex flex-col gap-2.5">
                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setStep("pick")}
                      className="w-full bg-ventsafe-foreground text-white py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity cursor-pointer"
                    >
                      Yes, change my name
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleSkipAndLogout}
                      className="w-full border border-ventsafe-foreground/20 text-ventsafe-foreground py-2.5 rounded-xl text-sm font-medium hover:bg-ventsafe-background transition-colors cursor-pointer"
                    >
                      {mode === "login"
                        ? "No, keep my name"
                        : "No, just log out"}
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {/* ── Step 2: Pick name ── */}
              {step === "pick" && (
                <motion.div
                  key="pick"
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ type: "spring", stiffness: 300, damping: 28 }}
                  className="p-5"
                >
                  <p className="text-sm text-ventsafe-foreground mb-4">
                    Choose your new anonymous name:
                  </p>

                  {/* Dropdown */}
                  <div className="relative mb-4">
                    <button
                      onClick={() => setShowDropdown((v) => !v)}
                      className="w-full flex items-center justify-between px-4 py-3 bg-ventsafe-foreground/5 border border-ventsafe-foreground/20 rounded-xl text-sm cursor-pointer hover:border-ventsafe-foreground/40 transition-colors"
                    >
                      <span
                        className={
                          selectedName
                            ? "text-ventsafe-foreground font-semibold"
                            : "text-ventsafe-foreground/40"
                        }
                      >
                        {selectedName || "Select a name..."}
                      </span>
                      <motion.span
                        animate={{ rotate: showDropdown ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronDown className="w-4 h-4 text-ventsafe-foreground/50" />
                      </motion.span>
                    </button>

                    <AnimatePresence>
                      {showDropdown && (
                        <motion.div
                          initial={{ opacity: 0, y: -8, scale: 0.97 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -8, scale: 0.97 }}
                          transition={{
                            type: "spring",
                            stiffness: 300,
                            damping: 26,
                          }}
                          className="absolute top-full left-0 right-0 mt-1 bg-white border border-ventsafe-border rounded-xl shadow-lg z-50 max-h-48 overflow-y-auto"
                        >
                          {availableNames.map((name, i) => (
                            <motion.button
                              key={name}
                              initial={{ opacity: 0, x: -8 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.02 }}
                              onClick={() => {
                                setSelectedName(name);
                                setShowDropdown(false);
                              }}
                              className={`w-full text-left px-4 py-2.5 text-sm transition-colors cursor-pointer flex items-center justify-between ${
                                selectedName === name
                                  ? "bg-ventsafe-foreground/8 text-ventsafe-foreground font-semibold"
                                  : "text-ventsafe-foreground/80 hover:bg-ventsafe-background"
                              }`}
                            >
                              {name}
                              {selectedName === name && (
                                <Check className="w-3.5 h-3.5 text-ventsafe-foreground" />
                              )}
                            </motion.button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {error && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-red-500 text-xs mb-3 text-center"
                    >
                      {error}
                    </motion.p>
                  )}

                  <div className="flex gap-2.5">
                    <button
                      onClick={() => {
                        setStep("ask");
                        setSelectedName("");
                        setError("");
                      }}
                      className="flex-1 border border-ventsafe-foreground/20 text-ventsafe-foreground py-2.5 rounded-xl text-sm font-medium hover:bg-ventsafe-background transition-colors cursor-pointer"
                    >
                      Back
                    </button>
                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleSaveAndLogout}
                      disabled={!selectedName || isSaving}
                      className="flex-1 bg-ventsafe-foreground text-white py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-60"
                    >
                      {isSaving
                        ? "Saving..."
                        : mode === "login"
                          ? "Save & Continue"
                          : "Save & Logout"}
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
