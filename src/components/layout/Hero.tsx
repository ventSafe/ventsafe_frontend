"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { GraduationCap, Stethoscope, ChevronDown } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const ventOptions = [
  {
    href: "/signup",
    label: "Sign up as Student",
    description: "Anonymous key pair — no name or email needed",
    Icon: GraduationCap,
    badge: "Student",
    badgeColor: "bg-blue-100 text-blue-700",
  },
  {
    href: "/signup/counsellor",
    label: "Sign up as Counsellor",
    description: "Verified counsellor — anonymous but trusted",
    Icon: Stethoscope,
    badge: "Counsellor",
    badgeColor: "bg-emerald-100 text-emerald-700",
  },
];

export function Hero() {
  const { isAuthenticated, user, isInitialized } = useAuth();
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isLoginMode, setIsLoginMode] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    const hasAccount =
      localStorage.getItem("ventsafe-signup-public-key") ||
      localStorage.getItem("ventsafe-counsellor-public-key");
    if (hasAccount) {
      setIsLoginMode(true);
    }
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
        // Reset to appropriate mode when closed
        const hasAccount =
          localStorage.getItem("ventsafe-signup-public-key") ||
          localStorage.getItem("ventsafe-counsellor-public-key");
        setTimeout(() => setIsLoginMode(!!hasAccount), 200);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const currentOptions = isLoginMode
    ? [
        {
          href: "/login",
          label: "Log in as Student",
          description: "Use your anonymous key pair to access your account",
          Icon: GraduationCap,
          badge: "Student",
          badgeColor: "bg-blue-100 text-blue-700",
        },
        {
          href: "/login/counsellor",
          label: "Log in as Counsellor",
          description: "Access your verified counsellor account",
          Icon: Stethoscope,
          badge: "Counsellor",
          badgeColor: "bg-emerald-100 text-emerald-700",
        },
      ]
    : [
        {
          href: "/signup",
          label: "Sign up as Student",
          description: "Anonymous key pair — no name or email needed",
          Icon: GraduationCap,
          badge: "Student",
          badgeColor: "bg-blue-100 text-blue-700",
        },
        {
          href: "/signup/counsellor",
          label: "Sign up as Counsellor",
          description: "Verified counsellor — anonymous but trusted",
          Icon: Stethoscope,
          badge: "Counsellor",
          badgeColor: "bg-emerald-100 text-emerald-700",
        },
      ];

  return (
    <section className="min-h-screen flex items-center justify-center pt-42 pb-16 px-6">
      <div className="container mx-auto max-w-5xl">
        <div className="text-center flex flex-col items-center justify-center gap-20">
          <div className="flex flex-col items-center justify-center gap-2">
            {/* Main Heading */}
            <h1 className="text-ventsafe-sub-heading md:text-ventsafe-title lg:text-ventsafe-heading font-bold text-ventsafe-foreground leading-tight">
              Vent Freely
            </h1>

            {/* Subheading */}
            <h2 className="text-ventsafe-tw md:text-ventsafe-des font-medium text-ventsafe-foreground/80">
              No Judgment, No Shame, No Stigma
            </h2>

            {/* Description */}
            <p className="text-ventsafe-btn-sm md:text-ventsafe-st text-ventsafe-foreground/70 max-w-2xl mx-auto">
              Support For Uni Mental Health, 100% Private
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 min-h-[44px] w-full max-w-[280px] sm:max-w-none">
              {!mounted || !isInitialized ? (
                <div className="flex items-center gap-2 text-ventsafe-foreground/50 h-[36px]">
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm font-medium">Loading...</span>
                </div>
              ) : (
                <>
                  {/* Vent Now — dropdown */}
              <div className="relative w-full sm:w-auto" ref={menuRef}>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setOpen((v) => !v)}
                  className="flex items-center justify-center gap-2 bg-ventsafe-foreground text-ventsafe-background px-4 py-1.5 rounded-ventsafe-tiny font-medium hover:opacity-90 transition-opacity text-ventsafe-btn-sm w-full sm:w-auto cursor-pointer select-none"
                >
                  Vent Now
                  <motion.span
                    animate={{ rotate: open ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </motion.span>
                </motion.button>

                <AnimatePresence>
                  {open && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.97 }}
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 26,
                      }}
                      className="absolute left-0 sm:left-1/2 sm:-translate-x-1/2 mt-2 w-72 bg-ventsafe-card border border-ventsafe-border rounded-2xl shadow-xl shadow-ventsafe-foreground/10 overflow-hidden z-50"
                    >
                      <div className="p-2">
                        <AnimatePresence mode="wait">
                          <motion.div
                            key={isLoginMode ? "login" : "signup"}
                            initial={{ opacity: 0, x: isLoginMode ? 10 : -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: isLoginMode ? -10 : 10 }}
                            transition={{ duration: 0.2 }}
                          >
                            {currentOptions.map(
                              (
                                {
                                  href,
                                  label,
                                  description,
                                  Icon,
                                  badge,
                                  badgeColor,
                                },
                                i,
                              ) => (
                                <button
                                  key={href}
                                  onClick={() => {
                                    setOpen(false);
                                    router.push(href);
                                  }}
                                  className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-ventsafe-background transition-colors cursor-pointer text-left"
                                >
                                  <div className="w-10 h-10 rounded-xl bg-ventsafe-foreground/8 flex items-center justify-center shrink-0">
                                    <Icon className="w-5 h-5 text-ventsafe-foreground" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                      <span className="text-sm font-semibold text-ventsafe-foreground">
                                        {label}
                                      </span>
                                      <span
                                        className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${badgeColor}`}
                                      >
                                        {badge}
                                      </span>
                                    </div>
                                    <p className="text-xs text-ventsafe-foreground/50 truncate">
                                      {description}
                                    </p>
                                  </div>
                                </button>
                              ),
                            )}
                          </motion.div>
                        </AnimatePresence>
                      </div>

                      <div className="border-t border-ventsafe-border/50 px-4 py-2.5">
                        <p className="text-xs text-ventsafe-foreground/40 text-center">
                          {isLoginMode ? "Don't have keys? " : "Already have keys? "}
                          <button
                            onClick={() => setIsLoginMode(!isLoginMode)}
                            className="text-ventsafe-foreground/70 hover:text-ventsafe-foreground underline cursor-pointer"
                          >
                            {isLoginMode ? "Sign up here" : "Log in here"}
                          </button>
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Secondary CTA */}
              <button
                onClick={() => {
                  const target = user?.role === "admin" ? "/admin" : "/vent-space";
                  router.push(target);
                }}
                className="border border-ventsafe-foreground text-ventsafe-foreground px-4 py-1.5 rounded-ventsafe-tiny font-medium hover:bg-ventsafe-foreground hover:text-ventsafe-background transition-colors text-ventsafe-btn-sm w-full sm:w-auto cursor-pointer"
              >
                {mounted && isAuthenticated ? "Continue to Platform" : "Vent As Guest"}
              </button>
                </>
              )}
            </div>
          </div>

          {/* Illustration */}
          <Image
            src="/images/vent-image.png"
            alt="Illustration Image"
            width={340}
            height={411}
            className="w-[280px] sm:w-[340px] h-auto"
          />
        </div>
      </div>
    </section>
  );
}
