"use client";

import { motion, AnimatePresence } from "framer-motion";
import { LogOut, X } from "lucide-react";

interface LogoutModalProps {
  isOpen: boolean;
  currentName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function LogoutModal({
  isOpen,
  currentName,
  onConfirm,
  onCancel,
}: LogoutModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
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
                  Logging Out
                </span>
              </div>
              <button
                type="button"
                title="close"
                onClick={onCancel}
                className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-ventsafe-background transition-colors cursor-pointer"
              >
                <X className="w-4 h-4 text-ventsafe-foreground/50" />
              </button>
            </div>

            <div className="p-5">
              <p className="text-sm text-ventsafe-foreground/70 mb-1">
                You are currently known as
              </p>
              <p className="text-lg font-bold text-ventsafe-foreground mb-4">
                {currentName}
              </p>
              <p className="text-sm text-ventsafe-foreground mb-6">
                Are you sure you want to log out?
              </p>

              <div className="flex gap-2.5">
                <button
                  onClick={onCancel}
                  className="flex-1 border border-ventsafe-foreground/20 text-ventsafe-foreground py-2.5 rounded-xl text-sm font-medium hover:bg-ventsafe-background transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onConfirm}
                  className="flex-1 bg-ventsafe-foreground text-white py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity cursor-pointer"
                >
                  Log Out
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

