"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, X, ShieldAlert, Sparkles, Check } from "lucide-react";
import { generateAnonymousName } from "@/lib/utils";

interface ChangeNameModalProps {
  isOpen: boolean;
  currentName: string;
  gender: "male" | "female";
  onConfirm: (newName: string) => Promise<void>;
  onCancel: () => void;
}

export function ChangeNameModal({
  isOpen,
  currentName,
  gender,
  onConfirm,
  onCancel,
}: ChangeNameModalProps) {
  const [suggestedName, setSuggestedName] = useState<string>("");
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  const handleGenerate = () => {
    const newName = generateAnonymousName(gender || "female");
    setSuggestedName(newName);
  };

  const handleSave = async () => {
    if (!suggestedName) return;
    setIsUpdating(true);
    try {
      await onConfirm(suggestedName);
      setSuggestedName("");
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleClose = () => {
    setSuggestedName("");
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
            className="fixed inset-0 bg-black/45 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", stiffness: 320, damping: 26 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-ventsafe-card border border-ventsafe-border/40 rounded-2xl shadow-2xl z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-ventsafe-border/30">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-ventsafe-navy" />
                <span className="text-sm font-bold text-ventsafe-foreground">
                  Change Anonymous Name
                </span>
              </div>
              <button
                type="button"
                title="close"
                onClick={handleClose}
                disabled={isUpdating}
                className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-ventsafe-background transition-colors cursor-pointer disabled:opacity-40"
              >
                <X className="w-4 h-4 text-ventsafe-foreground/50" />
              </button>
            </div>

            <div className="p-5">
              <div className="mb-4">
                <p className="text-xs font-semibold text-ventsafe-foreground/45 uppercase tracking-wider mb-1">
                  Current Name
                </p>
                <div className="px-4 py-2.5 bg-ventsafe-muted/20 border border-ventsafe-border/30 rounded-xl text-sm font-medium text-ventsafe-foreground/75 truncate">
                  {currentName}
                </div>
              </div>

              {/* Generator Section */}
              <div className="mb-6 p-4 rounded-xl border border-dashed border-ventsafe-border bg-ventsafe-muted/10 flex flex-col items-center justify-center text-center">
                <p className="text-xs text-ventsafe-foreground/60 mb-3">
                  Click the button below to generate a new random anonymous alias.
                </p>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={handleGenerate}
                  disabled={isUpdating}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-ventsafe-navy text-white hover:opacity-90 transition-all cursor-pointer shadow-sm active:scale-95 disabled:opacity-50"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Generate New Alias
                </motion.button>

                {suggestedName && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mt-4 w-full"
                  >
                    <p className="text-xs font-semibold text-ventsafe-foreground/45 uppercase tracking-wider mb-1">
                      New Suggested Alias
                    </p>
                    <div className="flex items-center justify-center gap-2 px-4 py-3 bg-ventsafe-navy/5 border border-ventsafe-navy/30 rounded-xl text-base font-bold text-ventsafe-navy animate-pulse">
                      <Sparkles className="w-4 h-4 text-ventsafe-navy" />
                      {suggestedName}
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isUpdating}
                  className="flex-1 border border-ventsafe-border text-ventsafe-foreground py-2.5 rounded-xl text-sm font-medium hover:bg-ventsafe-background transition-colors cursor-pointer disabled:opacity-40"
                >
                  Cancel
                </button>
                <motion.button
                  whileHover={suggestedName ? { scale: 1.01 } : {}}
                  whileTap={suggestedName ? { scale: 0.98 } : {}}
                  type="button"
                  onClick={handleSave}
                  disabled={!suggestedName || isUpdating}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    suggestedName
                      ? "bg-ventsafe-foreground text-ventsafe-background hover:opacity-90 shadow-md"
                      : "bg-ventsafe-foreground/10 text-ventsafe-foreground/30 cursor-not-allowed"
                  }`}
                >
                  {isUpdating ? (
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Save Alias
                    </>
                  )}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
