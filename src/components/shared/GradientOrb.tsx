import React from "react";
import { motion } from "framer-motion";
import crypto from "crypto-js";

interface GradientOrbProps {
  fingerprint: string;
  size?: number;
  pulse?: boolean;
}

export function GradientOrb({ fingerprint, size = 48, pulse = false }: GradientOrbProps) {
  // Generate deterministc colors based on the RSA fingerprint
  // Fingerprint could be a hex string or base64. Let's hash it to ensure uniformity.
  const hash = crypto.SHA256(fingerprint).toString();
  
  // Extract 3 hex colors from the hash
  const color1 = `#${hash.slice(0, 6)}`;
  const color2 = `#${hash.slice(6, 12)}`;
  const color3 = `#${hash.slice(12, 18)}`;

  return (
    <motion.div
      animate={
        pulse
          ? {
              scale: [1, 1.05, 1],
              opacity: [0.8, 1, 0.8],
            }
          : {}
      }
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut",
      }}
      className="relative rounded-full overflow-hidden shadow-lg"
      style={{
        width: size,
        height: size,
        background: `linear-gradient(135deg, ${color1}, ${color2}, ${color3})`,
        boxShadow: `0 0 ${size / 4}px ${color2}40`, // soft glow
      }}
    >
      {/* Abstract Inner Wave / Glass overlay */}
      <div 
        className="absolute inset-0 bg-white/10"
        style={{
          backdropFilter: 'blur(2px)',
          borderRadius: '50%',
        }}
      />
    </motion.div>
  );
}
