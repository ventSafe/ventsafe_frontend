"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { GraduationCap, Stethoscope, ChevronDown } from "lucide-react";
import { Logo } from "../shared/Logo";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

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

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close on route change
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-ventsafe-background/60 backdrop-blur-md">
      <div className="container mx-auto px-6 py-2.5">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Logo />

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "text-ventsafe-st font-normal transition-colors relative",
                  pathname === link.href
                    ? "text-ventsafe-navy"
                    : "text-ventsafe-foreground hover:text-ventsafe-navy",
                )}
              >
                {link.label}
                {pathname === link.href && (
                  <span className="absolute -bottom-1 left-0 right-0 border-b border-ventsafe-foreground z-20" />
                )}
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Vent Now — dropdown trigger */}
            <div className="relative" ref={menuRef}>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => setOpen((v) => !v)}
                className="flex items-center gap-1.5 px-3 py-1 bg-ventsafe-foreground text-ventsafe-background text-ventsafe-btn-sm rounded-ventsafe-tiny cursor-pointer select-none"
              >
                Vent Now
                <motion.span
                  animate={{ rotate: open ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </motion.span>
              </motion.button>

              <AnimatePresence>
                {open && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.97 }}
                    transition={{ type: "spring", stiffness: 300, damping: 26 }}
                    className="absolute right-0 mt-2 w-72 bg-white border border-ventsafe-border rounded-2xl shadow-xl shadow-ventsafe-foreground/10 overflow-hidden z-50"
                  >
                    <div className="p-2">
                      {ventOptions.map(
                        (
                          { href, label, description, Icon, badge, badgeColor },
                          i,
                        ) => (
                          <motion.button
                            key={href}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.06 }}
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
                                <span className="text-ventsafe-tiny font-semibold text-ventsafe-foreground">
                                  {label}
                                </span>
                                <span
                                  className={`text-[0.7rem] px-1.5 py-0.5 rounded-full font-medium ${badgeColor}`}
                                >
                                  {badge}
                                </span>
                              </div>
                              <p className="text-ventsafe-tiny text-ventsafe-foreground/50 truncate">
                                {description}
                              </p>
                            </div>
                          </motion.button>
                        ),
                      )}
                    </div>

                    <div className="border-t border-ventsafe-border/50 px-4 py-2.5">
                      <p className="text-ventsafe-tiny text-ventsafe-foreground/40 text-center">
                        Already have keys?{" "}
                        <button
                          onClick={() => {
                            setOpen(false);
                            router.push("/login");
                          }}
                          className="text-ventsafe-foreground/70 hover:text-ventsafe-foreground hover:underline cursor-pointer"
                        >
                          Log in here
                        </button>
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Login */}
            <Link
              href="/login"
              className="border border-ventsafe-foreground text-ventsafe-foreground px-6 py-1 rounded-ventsafe-tiny text-ventsafe-btn-sm hover:bg-ventsafe-foreground hover:text-ventsafe-primary-foreground transition-colors"
            >
              Login
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
