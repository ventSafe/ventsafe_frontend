"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ChevronDown,
  RefreshCw,
  BookMarked,
  Settings,
  LogOut,
  Home,
  BookOpen,
  MessageCircle,
  ShieldCheck,
  GraduationCap,
  ArrowLeftRight,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";
import { checkAccountExists, checkAssociatedAccount, logout } from "@/lib/auth";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { Logo } from "@/components/shared/Logo";
import { useAuth } from "@/hooks/useAuth";
import { LogoutModal } from "@/components/shared/LogoutModal";
import { ManiLifebuoy } from "@/components/shared/ManiLifebuoy";
import { PanicButton } from "@/components/shared/PanicButton";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

const NAV_LINKS = [
  { href: "/vent-space", label: "Home", icon: <Home size={16} /> },
  { href: "/resources", label: "Resource", icon: <BookOpen size={16} /> },
  { href: "/chat", label: "Vent", icon: <MessageCircle size={16} /> },
];

// ─── Role Badge ───────────────────────────────────────────────────────────────

function RoleBadge({
  role,
  onSwitchRole,
}: {
  role: string;
  onSwitchRole: () => void;
}) {
  if (role === "counselor") {
    return (
      <button
        onClick={onSwitchRole}
        title="Switch account"
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-ventsafe-navy text-white border border-ventsafe-navy hover:opacity-80 transition-opacity cursor-pointer"
      >
        <ShieldCheck size={10} />
        Counsellor
      </button>
    );
  }
  if (role === "counsellor_pending") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-yellow-100 text-yellow-700 border border-yellow-200">
        <ShieldCheck size={10} />
        Pending
      </span>
    );
  }
  return (
    <button
      onClick={onSwitchRole}
      title="Switch account or sign up as counsellor"
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-ventsafe-muted text-ventsafe-navy border border-ventsafe-border hover:border-ventsafe-navy transition-colors cursor-pointer"
    >
      <GraduationCap size={10} />
      Student
    </button>
  );
}

// ─── Role Switch Modal ────────────────────────────────────────────────────────

function RoleSwitchModal({
  isOpen,
  currentRole,
  hasSeparateCounsellorAccount,
  hasSeparateStudentAccount,
  onClose,
}: {
  isOpen: boolean;
  currentRole: string;
  // true = they already have a counsellor account on this device → show "Log in"
  // false = no counsellor account found → show "Sign up"
  hasSeparateCounsellorAccount: boolean;
  // true = they already have a student account on this device → show "Log in"
  // false = no student account found → show "Sign up"
  hasSeparateStudentAccount: boolean;
  onClose: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative w-full max-w-sm bg-ventsafe-card rounded-ventsafe-md shadow-2xl z-10 overflow-hidden"
      >
        <div className="px-6 py-5 border-b border-ventsafe-border/30">
          <h2 className="text-base font-bold text-ventsafe-foreground">
            Switch Account
          </h2>
          <p className="text-xs text-ventsafe-foreground/50 mt-0.5">
            Currently signed in as a{" "}
            <span className="font-semibold">
              {currentRole === "counselor" ? "Counsellor" : "Student"}
            </span>
            .
          </p>
        </div>

        <div className="px-6 py-4 space-y-3">
          {/* ── Student is signed in → offer counsellor account ── */}
          {currentRole === "student" && (
            <>
              {hasSeparateCounsellorAccount ? (
                // They have counsellor keys → log in to their existing counsellor account
                <Link
                  href="/login/counsellor"
                  onClick={() => { if (typeof window !== 'undefined') { localStorage.removeItem('ventsafe-auth-token'); } onClose(); }}
                  className="flex items-center gap-3 p-4 border border-ventsafe-border rounded-ventsafe-md hover:border-ventsafe-navy transition-colors group cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-full bg-ventsafe-navy text-white flex items-center justify-center shrink-0">
                    <ShieldCheck size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-ventsafe-foreground">
                      Log in as Counsellor
                    </p>
                    <p className="text-xs text-ventsafe-foreground/50">
                      Switch to your existing counsellor account
                    </p>
                  </div>
                  <ArrowLeftRight
                    size={14}
                    className="ml-auto text-ventsafe-foreground/30 group-hover:text-ventsafe-navy"
                  />
                </Link>
              ) : (
                // No counsellor account found → prompt to create one
                <Link
                  href="/signup/counsellor"
                  onClick={onClose}
                  className="flex items-center gap-3 p-4 border border-ventsafe-border rounded-ventsafe-md hover:border-ventsafe-navy transition-colors group"
                >
                  <div className="w-9 h-9 rounded-full bg-ventsafe-muted text-ventsafe-navy flex items-center justify-center shrink-0">
                    <UserPlus size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-ventsafe-foreground">
                      Sign up as Counsellor
                    </p>
                    <p className="text-xs text-ventsafe-foreground/50">
                      Create a new counsellor account to support students
                    </p>
                  </div>
                  <ArrowLeftRight
                    size={14}
                    className="ml-auto text-ventsafe-foreground/30 group-hover:text-ventsafe-navy"
                  />
                </Link>
              )}
            </>
          )}

          {/* ── Counsellor is signed in → offer student account ── */}
          {currentRole === "counselor" && (
            <>
              {hasSeparateStudentAccount ? (
                // They have separate student keys → log in to their student account
                <Link
                  href="/login"
                  onClick={() => { if (typeof window !== 'undefined') { localStorage.removeItem('ventsafe-auth-token'); } onClose(); }}
                  className="flex items-center gap-3 p-4 border border-ventsafe-border rounded-ventsafe-md hover:border-ventsafe-navy transition-colors group cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-full bg-ventsafe-muted text-ventsafe-navy flex items-center justify-center shrink-0">
                    <GraduationCap size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-ventsafe-foreground">
                      Log in as Student
                    </p>
                    <p className="text-xs text-ventsafe-foreground/50">
                      Switch to your existing student account
                    </p>
                  </div>
                  <ArrowLeftRight
                    size={14}
                    className="ml-auto text-ventsafe-foreground/30 group-hover:text-ventsafe-navy"
                  />
                </Link>
              ) : (
                // No separate student account found → prompt to create one
                <Link
                  href="/signup"
                  onClick={onClose}
                  className="flex items-center gap-3 p-4 border border-ventsafe-border rounded-ventsafe-md hover:border-ventsafe-navy transition-colors group"
                >
                  <div className="w-9 h-9 rounded-full bg-ventsafe-muted text-ventsafe-navy flex items-center justify-center shrink-0">
                    <UserPlus size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-ventsafe-foreground">
                      Sign up as Student
                    </p>
                    <p className="text-xs text-ventsafe-foreground/50">
                      Create a new anonymous student account
                    </p>
                  </div>
                  <ArrowLeftRight
                    size={14}
                    className="ml-auto text-ventsafe-foreground/30 group-hover:text-ventsafe-navy"
                  />
                </Link>
              )}
            </>
          )}
        </div>

        <div className="px-6 py-3 border-t border-ventsafe-border/30">
          <button
            onClick={onClose}
            className="w-full py-2 text-sm text-ventsafe-foreground/60 hover:text-ventsafe-foreground transition-colors"
          >
            Cancel
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export { RoleSwitchModal };

// ─── Main Layout ──────────────────────────────────────────────────────────────

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, isInitialized, isLoading, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  // Redirect if not authenticated
  useEffect(() => {
    if (mounted && isInitialized && !isAuthenticated) {
      // Check if we are on a protected route
      const publicRoutes = ["/", "/login", "/signup", "/about", "/contact", "/terms", "/welcome", "/privacy-policy"];
      const isPublic = publicRoutes.some(route => pathname === route || pathname.startsWith("/login/") || pathname.startsWith("/signup/"));

      if (!isPublic) {
        // Fallback or hint for redirection: check if a counsellor key exists in localStorage
        const counsellorKey = typeof window !== "undefined"
          ? (localStorage.getItem("ventsafe-counsellor-public-key") || localStorage.getItem("ventsafe-counsellor-signup-public-key"))
          : null;

        const target = counsellorKey ? "/login/counsellor" : "/login";
        router.push(target);
      }
    }
  }, [mounted, isInitialized, isAuthenticated, pathname, router]);

  const anonymousName = mounted
    ? (user?.anonymousName ??
      localStorage.getItem("ventsafe-anon-name") ??
      localStorage.getItem("ventsafe-counsellor-anon-name") ??
      "Anonymous")
    : (user?.anonymousName ?? "Anonymous");

  // const firstLetter = (anonymousName || "A").charAt(0).toUpperCase();
  // Always read role from Zustand store (user object) — never from localStorage
  const userRole = user?.role ?? "student";
  const isCounsellor = userRole === "counselor";

  // Account existence results — populated by the real DB check in handleSwitchRoleClick
  const [hasSeparateCounsellorAccount, setHasSeparateCounsellorAccount] = useState(false);
  const [hasSeparateStudentAccount, setHasSeparateStudentAccount] = useState(false);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // ── Point 5 fix: counsellors log out to /login/counsellor ────────────────
  const handleLogout = async () => {
    setDropdownOpen(false);
    setShowLogoutModal(false);

    if (typeof window !== "undefined") {
      const currentPath = window.location.pathname;
      const SKIP = ["/login", "/login/counsellor", "/signup", "/welcome", "/"];
      if (!SKIP.some((p) => currentPath.startsWith(p))) {
        localStorage.setItem("ventsafe-redirect-after-login", currentPath);
      }
    }

    try {
      await logout();
    } catch {
      // proceed anyway
    }

    // Route to the correct login page based on role
    window.location.href = isCounsellor ? "/login/counsellor" : "/login";
  };

  const handleSwitchRoleClick = async () => {
    setDropdownOpen(false);
    const tId = toast.loading("Checking accounts...");

    try {
      // Read whatever public keys are stored locally for each role
      const counsellorPublicKey =
        typeof window !== "undefined"
          ? localStorage.getItem("ventsafe-counsellor-public-key") ??
          localStorage.getItem("ventsafe-counsellor-signup-public-key")
          : null;
      const studentPublicKey =
        typeof window !== "undefined"
          ? localStorage.getItem("ventsafe-signup-public-key") ??
          localStorage.getItem("ventsafe-public-key")
          : null;

      // Ask the backend whether those keys actually exist in the DB
      // ALSO: Check the DB for ANY account with the same name (requested DB-first check)
      const targetRole = userRole === "student" ? "counselor" : "student";

      const [counsellorResult, studentResult, associatedResult] = await Promise.all([
        counsellorPublicKey ? checkAccountExists(counsellorPublicKey) : null,
        studentPublicKey ? checkAccountExists(studentPublicKey) : null,
        checkAssociatedAccount(anonymousName, targetRole),
      ]);

      // A separate account exists if the key is in DB OR if an associated account by name was found
      if (userRole === "student") {
        setHasSeparateCounsellorAccount(
          !!counsellorResult?.exists || !!associatedResult?.exists
        );
        setHasSeparateStudentAccount(false);
      } else {
        setHasSeparateStudentAccount(
          !!studentResult?.exists || !!associatedResult?.exists
        );
        setHasSeparateCounsellorAccount(false);
      }
    } catch {
      // Network error — fall back to false (will show Sign up options)
      setHasSeparateCounsellorAccount(false);
      setHasSeparateStudentAccount(false);
    }

    toast.dismiss(tId);
    setShowRoleModal(true);
  };

  const DROPDOWN_ITEMS: {
    icon: React.ReactNode;
    label: string;
    href?: string;
    onClick?: () => void;
  }[] = [
      {
        icon: <RefreshCw size={15} />,
        label: "Change anon name",
        onClick: () => {
          setDropdownOpen(false);
          setShowLogoutModal(true);
        },
      },
      {
        icon: <ArrowLeftRight size={15} />,
        label: "Switch account",
        onClick: handleSwitchRoleClick,
      },
      {
        icon: <BookMarked size={15} />,
        label: "My vents",
        href: "/my-vents",
      },
      {
        icon: <Settings size={15} />,
        label: "Settings",
        href: "/settings",
      },
    ];

  if (!mounted || !isInitialized || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ventsafe-background">
        <div className="w-8 h-8 border-4 border-ventsafe-border border-t-ventsafe-navy rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-ventsafe-background/90 backdrop-blur-md border-b border-ventsafe-border/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <Logo />

          {/* Fix 3: correct active check — avoids /vent-space matching /vent */}
          <nav className="hidden sm:flex items-center gap-6">
            {NAV_LINKS.map((link) => {
              const isActive =
                pathname === link.href ||
                pathname.startsWith(link.href + "/");
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-1.5 text-sm font-medium relative transition-colors ${isActive
                    ? "text-ventsafe-navy"
                    : "text-ventsafe-foreground/60 hover:text-ventsafe-navy"
                    }`}
                >
                  {link.icon}
                  {link.label}
                  {isActive && (
                    <span className="absolute -bottom-3.5 left-0 right-0 h-0.5 bg-ventsafe-navy rounded-full" />
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            {/* Online/Offline indicator */}
            <div className="flex items-center gap-1.5" title={user?.isOnline ? 'Online' : 'Offline'}>
              <div className={`w-2 h-2 rounded-full ${user?.isOnline !== false ? 'bg-green-500' : 'bg-gray-300'}`} />
              <span className="text-[10px] font-medium text-ventsafe-foreground/50 hidden sm:inline">
                {user?.isOnline !== false ? 'Online' : 'Offline'}
              </span>
            </div>

            {/* MANI link + Panic/Esc button (Students only) */}
            {userRole === "student" && (
              <>
                <ManiLifebuoy />
                <PanicButton onTrigger={() => {}} inline />
              </>
            )}

            {/* Role badge */}
            <RoleBadge
              role={userRole}
              onSwitchRole={handleSwitchRoleClick}
            />

            <ThemeToggle />

            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen((o) => !o)}
                className="flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-ventsafe-full border border-ventsafe-border bg-ventsafe-card hover:border-ventsafe-navy transition-all shadow-sm active:scale-95"
              >
                <UserAvatar name={anonymousName} role={userRole} className="w-8 h-8 text-xs" />
                <span className="text-sm font-semibold text-ventsafe-foreground hidden md:inline max-w-30 truncate">
                  {anonymousName}
                </span>
                <motion.div
                  animate={{ rotate: dropdownOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown
                    size={13}
                    className="text-ventsafe-foreground/50"
                  />
                </motion.div>
              </button>

              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.97 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-56 bg-ventsafe-card border border-ventsafe-border rounded-ventsafe-md shadow-lg overflow-hidden z-50"
                  >
                    <div className="flex items-center gap-3 px-4 py-3 border-b border-ventsafe-border/50 bg-ventsafe-muted/30">
                      <UserAvatar name={anonymousName} role={userRole} className="w-10 h-10 text-sm" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-ventsafe-foreground truncate">
                          {anonymousName}
                        </p>
                        {/* Badge in dropdown also reads from Zustand */}
                        <div className="mt-0.5">
                          <RoleBadge
                            role={userRole}
                            onSwitchRole={handleSwitchRoleClick}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="py-1">
                      {/* Main nav links for mobile only */}
                      <div className="sm:hidden border-b border-ventsafe-border/50 pb-1 mb-1">
                        {NAV_LINKS.map((link) => {
                          const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
                          return (
                            <Link
                              key={link.href}
                              href={link.href}
                              onClick={() => setDropdownOpen(false)}
                              className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                                isActive ? "text-ventsafe-navy bg-ventsafe-muted/50" : "text-ventsafe-foreground hover:bg-ventsafe-muted"
                              }`}
                            >
                              <span className={isActive ? "text-ventsafe-navy" : "text-ventsafe-foreground/50"}>
                                {link.icon}
                              </span>
                              {link.label}
                            </Link>
                          );
                        })}
                      </div>

                      {DROPDOWN_ITEMS.map((item) =>
                        item.href ? (
                          <Link
                            key={item.label}
                            href={item.href}
                            onClick={() => setDropdownOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-ventsafe-foreground hover:bg-ventsafe-muted transition-colors"
                          >
                            <span className="text-ventsafe-foreground/50">
                              {item.icon}
                            </span>
                            {item.label}
                          </Link>
                        ) : (
                          <button
                            key={item.label}
                            onClick={item.onClick}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-ventsafe-foreground hover:bg-ventsafe-muted transition-colors"
                          >
                            <span className="text-ventsafe-foreground/50">
                              {item.icon}
                            </span>
                            {item.label}
                          </button>
                        ),
                      )}
                    </div>

                    <div className="border-t border-ventsafe-border/50 py-1">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-500/10 transition-colors"
                      >
                        <LogOut size={15} />
                        Log out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </header>

      <div className="pt-16">{children}</div>

      <LogoutModal
        isOpen={showLogoutModal}
        currentName={anonymousName}
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutModal(false)}
      />

      <AnimatePresence>
        {showRoleModal && (
          <RoleSwitchModal
            isOpen={showRoleModal}
            currentRole={userRole}
            hasSeparateCounsellorAccount={hasSeparateCounsellorAccount}
            hasSeparateStudentAccount={hasSeparateStudentAccount}
            onClose={() => setShowRoleModal(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}