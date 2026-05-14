"use client";

import React, { useEffect } from "react";

interface PanicButtonProps {
  onTrigger: () => void;
  /** When true, renders as an inline header element instead of floating */
  inline?: boolean;
}

/**
 * Panic/Escape button — pressing Esc or clicking redirects to Google Scholar
 * for safety. Can render floating (legacy) or inline (header bar).
 */
export function PanicButton({ onTrigger, inline = false }: PanicButtonProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onTrigger();
        window.location.href = "https://scholar.google.com";
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onTrigger]);

  if (inline) {
    return (
      <button
        onClick={() => {
          onTrigger();
          window.location.href = "https://scholar.google.com";
        }}
        title="Press 'Esc' to instantly leave"
        className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold bg-red-500 hover:bg-red-600 text-white rounded-full shadow-sm transition-colors cursor-pointer"
      >
        Esc
      </button>
    );
  }

  return (
    <button
      onClick={() => {
        onTrigger();
        window.location.href = "https://scholar.google.com";
      }}
      title="Press 'Esc' to instantly leave"
      className="fixed bottom-6 left-6 z-50 rounded-full font-bold shadow-lg opacity-80 hover:opacity-100 transition-opacity bg-red-500 hover:bg-red-600 text-white px-3 py-2 text-sm cursor-pointer"
    >
      Esc
    </button>
  );
}
