"use client";

import React from "react";
import { motion } from "framer-motion";
import { LifeBuoy } from "lucide-react";

export function ManiLifebuoy() {
  return (
    <motion.a
      href="https://maninigeria.com"
      target="_blank"
      rel="noopener noreferrer"
      title="MANI - Mentally Aware Nigeria Initiative"
      animate={{
        scale: [1, 1.1, 1],
      }}
      transition={{
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut",
      }}
      className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 bg-red-500 text-white rounded-full shadow-[0_0_15px_rgba(239,68,68,0.5)] hover:bg-red-600 transition-colors cursor-pointer"
    >
      <LifeBuoy size={28} />
    </motion.a>
  );
}
