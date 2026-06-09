"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Logo } from "@/components/shared/Logo";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { useRouter } from "next/navigation";
import { Footer } from "@/components/shared/Footer";

export default function WelcomePage() {
  const router = useRouter();
  const [showWelcome, setShowWelcome] = useState(false);
  const [showUsername, setShowUsername] = useState(false);
  const [showSubtext, setShowSubtext] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [anonymousName, setAnonymousName] = useState("Friend");

  // Fix 3: Get real anonymous name from localStorage
  useEffect(() => {
    const name =
      localStorage.getItem("ventsafe-anon-name") ||
      localStorage.getItem("ventsafe-signup-anon-name") ||
      localStorage.getItem("ventsafe-counsellor-anon-name") ||
      "Friend";
    setAnonymousName(name);
  }, []);

  // Fix 1: Animation sequence — runs fresh every time this page is visited
  useEffect(() => {
    setShowWelcome(false);
    setShowUsername(false);
    setShowSubtext(false);
    setIsComplete(false);

    const t1 = setTimeout(() => setShowWelcome(true), 300);
    const t2 = setTimeout(() => setShowUsername(true), 1500);
    const t3 = setTimeout(() => setShowSubtext(true), 2800);
    const t4 = setTimeout(() => setIsComplete(true), 4000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, []);

  useEffect(() => {
    if (isComplete) {
      const t = setTimeout(() => router.push("/vent-space"), 4000);
      return () => clearTimeout(t);
    }
  }, [isComplete, router]);

  return (
    <div className="min-h-screen bg-ventsafe-background flex flex-col">
      <header className="p-6 flex items-center justify-between w-full relative">
        <div className="flex-1 flex justify-center md:justify-start">
          <Logo />
        </div>
        <div className="absolute right-6 top-6">
          <ThemeToggle />
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-2xl text-center">
          <div className="space-y-3">
            {showWelcome && (
              <motion.h1
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="text-ventsafe-btn-sm font-bold text-ventsafe-foreground"
              >
                <TypewriterText text="WELCOME TO VENT SAFE" delay={50} />
              </motion.h1>
            )}

            {/* Fix 3: Show real anonymous name */}
            {showUsername && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="text-ventsafe-tiny text-ventsafe-foreground"
              >
                <TypewriterText text={anonymousName} delay={80} />
              </motion.p>
            )}

            {showSubtext && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="text-ventsafe-btn-sm font-medium text-ventsafe-foreground tracking-wider"
              >
                <TypewriterText text="YOUR ANONYMOUS SAFE SPACE" delay={60} />
              </motion.p>
            )}
          </div>

          {isComplete && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-12"
            >
              <div className="flex justify-center items-center gap-2">
                {[0, 150, 300].map((delay) => (
                  <div
                    key={delay}
                    className="w-2 h-2 bg-ventsafe-navy rounded-full animate-bounce"
                    style={{ animationDelay: `${delay}ms` }}
                  />
                ))}
              </div>
              <p className="text-sm text-ventsafe-foreground/70 mt-4">
                Taking you to your feed...
              </p>
            </motion.div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

function TypewriterText({
  text,
  delay = 50,
}: {
  text: string;
  delay?: number;
}) {
  const [displayText, setDisplayText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);

  // Reset when text changes
  useEffect(() => {
    setDisplayText("");
    setCurrentIndex(0);
  }, [text]);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayText((prev) => prev + text[currentIndex]);
        setCurrentIndex((prev) => prev + 1);
      }, delay);
      return () => clearTimeout(timeout);
    }
  }, [currentIndex, text, delay]);

  return (
    <span className="inline-block">
      {displayText}
      {currentIndex < text.length && (
        <span className="inline-block w-0.5 h-[1em] bg-ventsafe-foreground ml-1 animate-pulse" />
      )}
    </span>
  );
}
