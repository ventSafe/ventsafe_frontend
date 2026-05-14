"use client";

import React from "react";
import { LifeBuoy } from "lucide-react";

/**
 * MANI (Mentally Aware Nigeria Initiative) link button.
 * Now renders as an inline element for use in the header bar,
 * not a floating fixed-position element.
 */
export function ManiLifebuoy({ className = "" }: { className?: string }) {
  return (
    <a
      href="https://mentallyaware.org"
      target="_blank"
      rel="noopener noreferrer"
      title="MANI – Mentally Aware Nigeria Initiative"
      className={`flex items-center justify-center w-8 h-8 bg-red-500 text-white rounded-full shadow-sm hover:bg-red-600 transition-colors cursor-pointer ${className}`}
    >
      <LifeBuoy size={16} />
    </a>
  );
}
