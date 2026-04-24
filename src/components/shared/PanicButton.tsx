"use client";

import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";

interface PanicButtonProps {
  onTrigger: () => void;
}

export function PanicButton({ onTrigger }: PanicButtonProps) {
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onTrigger();
        // Fallback: quickly redirect away
        window.location.href = "https://scholar.google.com";
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onTrigger]);

  return (
    <Button 
      variant="default" 
      size="sm"
      className="fixed bottom-6 left-6 z-50 rounded-full font-bold shadow-lg opacity-80 hover:opacity-100 transition-opacity bg-red-500 hover:bg-red-600 text-white"
      onClick={() => {
        onTrigger();
        window.location.href = "https://scholar.google.com";
      }}
      title="Press 'Esc' to instantly leave"
    >
      Esc
    </Button>
  );
}
