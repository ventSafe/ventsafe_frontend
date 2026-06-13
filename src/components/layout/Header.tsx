"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { GraduationCap, Stethoscope, ChevronDown, User, LogOut, Menu, X } from "lucide-react";
import { Logo } from "../shared/Logo";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import {
  checkAccountExists,
  checkAssociatedAccount,
  logout as apiLogout,
} from "@/lib/auth";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { ThemeToggle } from "./ThemeToggle";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

function RoleBadge({ role }: { role: string }) {
  if (role === "counselor") {
    return (
      <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200">
        Counsellor
      </span>
    );
  }
  if (role === "counsellor_pending") {
    return (
      <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-yellow-100 text-yellow-700 border border-yellow-200">
        Pending
      </span>
    );
  }
  if (role === "admin") {
    return (
      <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-ventsafe-navy text-white">
        Admin
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-700 border border-blue-200">
      Student
    </span>
  );
}

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, user, anonymousName, logout, isInitialized } = useAuth();
  
  const [open, setOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  
  const [mounted, setMounted] = useState(false);
  const [hasStudentAccount, setHasStudentAccount] = useState(false);
  const [hasCounsellorAccount, setHasCounsellorAccount] = useState(false);
  
  const menuRef = useRef<HTMLDivElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(e.target as Node)) {
        setUserDropdownOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target as Node)) {
        setMobileMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close on route change
  useEffect(() => {
    setOpen(false);
    setUserDropdownOpen(false);
    setMobileMenuOpen(false);
  }, [pathname]);

  // Check for existing accounts
  useEffect(() => {
    async function checkAccounts() {
      const studentKey = localStorage.getItem("ventsafe-public-key") || localStorage.getItem("ventsafe-signup-public-key");
      const counsellorKey = localStorage.getItem("ventsafe-counsellor-public-key");

      // Key-based check
      if (studentKey) {
        const res = await checkAccountExists(studentKey);
        if (res?.exists) setHasStudentAccount(true);
      }
      if (counsellorKey) {
        const res = await checkAccountExists(counsellorKey);
        if (res?.exists) setHasCounsellorAccount(true);
      }

      // Name-based DB check (if logged in, check for existence of other role)
      if (isAuthenticated && anonymousName) {
        const studentCheck = await checkAssociatedAccount(anonymousName, "student");
        if (studentCheck.exists) setHasStudentAccount(true);

        const counsellorCheck = await checkAssociatedAccount(anonymousName, "counselor");
        if (counsellorCheck.exists) setHasCounsellorAccount(true);
      }
    }
    checkAccounts();
  }, [isAuthenticated, anonymousName]);

  const handleSwitchAccount = async (targetRole: "student" | "counselor") => {
    // 1. Log out current session
    await apiLogout();
    // 2. Redirect to specific page which will pick up the saved keys
    if (targetRole === "student") {
      router.push("/signup");
    } else {
      router.push("/signup/counsellor");
    }
  };

  const dashboardHref = user?.role === "admin" ? "/admin" : "/vent-space";

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-ventsafe-background/60 backdrop-blur-md border-b border-ventsafe-border/10">
      <div className="container mx-auto px-4 sm:px-6 py-2.5">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Logo />

          {/* Navigation (Desktop) */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "text-ventsafe-btn-sm font-medium transition-colors relative",
                  pathname === link.href
                    ? "text-ventsafe-navy"
                    : "text-ventsafe-foreground/60 hover:text-ventsafe-navy",
                )}
              >
                {link.label}
                {pathname === link.href && (
                  <span className="absolute -bottom-1 left-0 right-0 border-b border-ventsafe-navy z-20" />
                )}
              </Link>
            ))}
          </nav>

          {/* Auth Section */}
          <div className="flex items-center gap-2 md:gap-4 min-h-[36px]">
            <ThemeToggle />
            {!mounted || !isInitialized ? (
              <div className="flex items-center justify-center px-4">
                <div className="w-4 h-4 border-2 border-ventsafe-foreground/30 border-t-ventsafe-foreground rounded-full animate-spin" />
              </div>
            ) : isAuthenticated ? (
              <div className="flex items-center gap-4">
                {/* Desktop User Info & Actions */}
                <div className="hidden md:flex items-center gap-4">
                  <div className="flex items-center gap-3 pr-2 border-r border-ventsafe-border/30">
                    <UserAvatar name={anonymousName} role={user?.role} className="w-8 h-8 text-xs" />
                    <div className="flex flex-col items-start leading-tight">
                      <span className="text-xs font-bold text-ventsafe-foreground truncate max-w-[100px]">
                        {anonymousName}
                      </span>
                      <RoleBadge role={user?.role || "student"} />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={dashboardHref}
                      className="bg-ventsafe-foreground text-ventsafe-background px-4 py-1.5 rounded-ventsafe-tiny text-ventsafe-btn-sm font-semibold hover:opacity-90 transition-opacity"
                    >
                      Go to Platform
                    </Link>
                    <button
                      onClick={logout}
                      title="Logout"
                      className="p-1.5 text-ventsafe-foreground/40 hover:text-red-500 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Mobile User Dropdown */}
                <div className="md:hidden relative" ref={userDropdownRef}>
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-full border border-ventsafe-border bg-ventsafe-background hover:border-ventsafe-navy transition-all shadow-sm active:scale-95"
                  >
                    <UserAvatar name={anonymousName} role={user?.role} className="w-8 h-8 text-xs" />
                    <span className="text-sm font-semibold text-ventsafe-foreground max-w-[80px] truncate">
                      {anonymousName}
                    </span>
                    <motion.div animate={{ rotate: userDropdownOpen ? 180 : 0 }}>
                      <ChevronDown size={13} className="text-ventsafe-foreground/50" />
                    </motion.div>
                  </button>

                  <AnimatePresence>
                    {userDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 6, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 6, scale: 0.97 }}
                        className="absolute right-0 top-full mt-2 w-56 bg-ventsafe-background border border-ventsafe-border rounded-xl shadow-lg overflow-hidden z-50"
                      >
                        <div className="py-1 border-b border-ventsafe-border/50">
                          {navLinks.map((link) => (
                             <Link
                              key={link.href}
                              href={link.href}
                              onClick={() => setUserDropdownOpen(false)}
                              className="block px-4 py-2.5 text-sm text-ventsafe-foreground hover:bg-ventsafe-muted transition-colors"
                            >
                              {link.label}
                            </Link>
                          ))}
                        </div>
                        <div className="py-1">
                          <Link
                            href={dashboardHref}
                            onClick={() => setUserDropdownOpen(false)}
                            className="block px-4 py-2.5 text-sm text-ventsafe-navy font-semibold hover:bg-ventsafe-muted transition-colors"
                          >
                            Go to Platform
                          </Link>
                        </div>
                        <div className="border-t border-ventsafe-border/50 py-1">
                          <button
                            onClick={logout}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                          >
                            <LogOut size={15} />
                            Log out
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Switch Account Logic (Desktop only) */}
                {user?.role === "student" && hasCounsellorAccount && (
                  <button
                    onClick={() => handleSwitchAccount("counselor")}
                    className="hidden lg:flex items-center gap-1.5 text-[10px] font-bold text-ventsafe-foreground/60 hover:text-ventsafe-foreground transition-colors cursor-pointer border border-ventsafe-border/30 px-2 py-1 rounded-full"
                  >
                    <Stethoscope className="w-2.5 h-2.5" />
                    Switch to Counsellor
                  </button>
                )}
                {user?.role === "counselor" && hasStudentAccount && (
                  <button
                    onClick={() => handleSwitchAccount("student")}
                    className="hidden lg:flex items-center gap-1.5 text-[10px] font-bold text-ventsafe-foreground/60 hover:text-ventsafe-foreground transition-colors cursor-pointer border border-ventsafe-border/30 px-2 py-1 rounded-full"
                  >
                    <GraduationCap className="w-2.5 h-2.5" />
                    Switch to Student
                  </button>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-4">
                {/* Desktop Sign Up / Log In */}
                <Link
                  href="/login"
                  className="hidden md:block text-ventsafe-btn-sm font-medium text-ventsafe-foreground/60 hover:text-ventsafe-foreground transition-colors"
                >
                  Log in
                </Link>
                <div className="hidden md:block relative" ref={menuRef}>
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setOpen((v) => !v)}
                    className="bg-ventsafe-foreground text-ventsafe-background px-4 py-1.5 rounded-ventsafe-tiny text-ventsafe-btn-sm font-semibold hover:opacity-90 transition-opacity flex items-center gap-1.5 cursor-pointer"
                  >
                    Sign up
                    <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", open && "rotate-180")} />
                  </motion.button>

                  <AnimatePresence>
                    {open && (
                      <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.97 }}
                        className="absolute right-0 mt-2 w-56 bg-ventsafe-background border border-ventsafe-border rounded-xl shadow-xl overflow-hidden z-50"
                      >
                        <div className="p-1.5 flex flex-col">
                          <button
                            onClick={() => { setOpen(false); router.push(hasStudentAccount ? "/login" : "/signup"); }}
                            className="w-full text-left px-3 py-2 text-sm text-ventsafe-foreground hover:bg-ventsafe-muted rounded-lg transition-colors flex flex-col gap-0.5"
                          >
                            <div className="flex items-center gap-2">
                              <GraduationCap className="w-4 h-4" />
                              <span className="font-semibold">{hasStudentAccount ? "Login as Student" : "Sign up as Student"}</span>
                            </div>
                            {hasStudentAccount && <span className="text-[10px] text-ventsafe-foreground/50 ml-6">Saved account detected</span>}
                          </button>
                          <button
                            onClick={() => { setOpen(false); router.push(hasCounsellorAccount ? "/login/counsellor" : "/signup/counsellor"); }}
                            className="w-full text-left px-3 py-2 text-sm text-ventsafe-foreground hover:bg-ventsafe-muted rounded-lg transition-colors flex flex-col gap-0.5"
                          >
                            <div className="flex items-center gap-2">
                              <Stethoscope className="w-4 h-4" />
                              <span className="font-semibold">{hasCounsellorAccount ? "Login as Counsellor" : "Sign up as Counsellor"}</span>
                            </div>
                            {hasCounsellorAccount && <span className="text-[10px] text-ventsafe-foreground/50 ml-6">Saved account detected</span>}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Mobile Hamburger Menu (Logged out) */}
                <div className="md:hidden relative" ref={mobileMenuRef}>
                  <button
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="p-2 text-ventsafe-foreground hover:bg-ventsafe-muted rounded-full transition-colors"
                  >
                    {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                  </button>

                  <AnimatePresence>
                    {mobileMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 6, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 6, scale: 0.97 }}
                        className="absolute right-0 top-full mt-2 w-56 bg-ventsafe-background border border-ventsafe-border rounded-xl shadow-lg overflow-hidden z-50"
                      >
                        <div className="py-1 border-b border-ventsafe-border/50">
                          {navLinks.map((link) => (
                            <Link
                              key={link.href}
                              href={link.href}
                              onClick={() => setMobileMenuOpen(false)}
                              className="block px-4 py-2.5 text-sm text-ventsafe-foreground hover:bg-ventsafe-muted transition-colors"
                            >
                              {link.label}
                            </Link>
                          ))}
                        </div>
                        <div className="p-3 flex flex-col gap-2">
                          <span className="text-xs font-semibold text-ventsafe-foreground/60 px-1 uppercase tracking-wider">Sign Up / Login</span>
                          <Link 
                            href="/login" 
                            onClick={() => setMobileMenuOpen(false)} 
                            className="w-full py-2 text-center text-sm font-medium text-ventsafe-foreground border border-ventsafe-border rounded-lg"
                          >
                            Log In
                          </Link>
                          
                          <div className="flex flex-col gap-2 mt-2 pt-2 border-t border-ventsafe-border/50">
                            <button
                              onClick={() => { setMobileMenuOpen(false); router.push(hasStudentAccount ? "/login" : "/signup"); }}
                              className="w-full text-left px-3 py-2.5 text-sm bg-ventsafe-foreground text-ventsafe-background hover:opacity-90 rounded-lg transition-colors flex flex-col gap-0.5"
                            >
                              <div className="flex items-center gap-2">
                                <GraduationCap className="w-4 h-4" />
                                <span className="font-semibold">{hasStudentAccount ? "Login as Student" : "Sign up as Student"}</span>
                              </div>
                              {hasStudentAccount && <span className="text-[10px] text-ventsafe-background/70 ml-6">Saved account detected</span>}
                            </button>
                            
                            <button
                              onClick={() => { setMobileMenuOpen(false); router.push(hasCounsellorAccount ? "/login/counsellor" : "/signup/counsellor"); }}
                              className="w-full text-left px-3 py-2.5 text-sm bg-ventsafe-muted border border-ventsafe-border text-ventsafe-foreground hover:bg-ventsafe-border/50 rounded-lg transition-colors flex flex-col gap-0.5"
                            >
                              <div className="flex items-center gap-2">
                                <Stethoscope className="w-4 h-4" />
                                <span className="font-semibold">{hasCounsellorAccount ? "Login as Counsellor" : "Sign up as Counsellor"}</span>
                              </div>
                              {hasCounsellorAccount && <span className="text-[10px] text-ventsafe-foreground/50 ml-6">Saved account detected</span>}
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

