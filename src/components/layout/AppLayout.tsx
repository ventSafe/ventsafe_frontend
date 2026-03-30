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
} from "lucide-react";
import { Logo } from "@/components/shared/Logo";
import { useAuth } from "@/hooks/useAuth";
import { LogoutModal } from "@/components/shared/LogoutModal";
import { STORAGE_KEYS } from "@/config/constants";

// ─── Role Badge ───────────────────────────────────────────────────────────────

function RoleBadge({ role }: { role: string }) {
  if (role === "counselor") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-ventsafe-navy text-white border border-ventsafe-navy">
        <ShieldCheck size={10} />
        Counsellor
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-ventsafe-muted text-ventsafe-navy border border-ventsafe-border">
      <GraduationCap size={10} />
      Student
    </span>
  );
}

// ─── Nav Links ────────────────────────────────────────────────────────────────

const NAV_LINKS = [
  { href: "/vent-space", label: "Home", icon: <Home size={16} /> },
  { href: "/resources", label: "Resource", icon: <BookOpen size={16} /> },
  { href: "/vent", label: "Vent", icon: <MessageCircle size={16} /> },
];

// ─── Main Layout ──────────────────────────────────────────────────────────────

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const anonymousName =
    user?.anonymousName ||
    (typeof window !== "undefined"
      ? localStorage.getItem(STORAGE_KEYS.ANONYMOUS_ID) ?? "Anonymous"
      : "Anonymous");

  const firstLetter = anonymousName.charAt(0).toUpperCase();
  const userRole = user?.role ?? "student";

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

  const DROPDOWN_ITEMS: {
    icon: React.ReactNode;
    label: string;
    href?: string;
    onClick?: () => void;
  }[] = [
    {
      icon: <RefreshCw size={15} />,
      label: "Change anonymous name",
      onClick: () => {
        setDropdownOpen(false);
        setShowLogoutModal(true);
      },
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

  return (
    <>
      {/* ── Fixed Header ── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-ventsafe-background/90 backdrop-blur-md border-b border-ventsafe-border/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          {/* Logo */}
          <Logo />

          {/* Nav */}
          <nav className="hidden sm:flex items-center gap-6">
            {NAV_LINKS.map((link) => {
              const isActive =
                pathname === link.href ||
                (link.href !== "/vent-space" && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-1.5 text-sm font-medium relative transition-colors ${
                    isActive
                      ? "text-ventsafe-navy"
                      : "text-ventsafe-foreground/60 hover:text-ventsafe-navy"
                  }`}
                >
                  {link.icon}
                  {link.label}
                  {isActive && (
                    <span className="absolute -bottom-[14px] left-0 right-0 h-[2px] bg-ventsafe-navy rounded-full" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right: role badge + user dropdown */}
          <div className="flex items-center gap-2">
            {/* Role badge — always visible */}
            <RoleBadge role={userRole} />

            {/* User dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen((o) => !o)}
                className="flex items-center gap-1.5 pl-1 pr-2 py-1 rounded-ventsafe-full border border-ventsafe-border bg-white hover:border-ventsafe-navy transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-ventsafe-foreground text-ventsafe-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">
                  {firstLetter}
                </div>
                <span className="text-sm font-medium text-ventsafe-foreground hidden md:inline max-w-[100px] truncate">
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
                    className="absolute right-0 top-full mt-2 w-56 bg-white border border-ventsafe-border rounded-ventsafe-md shadow-lg overflow-hidden z-50"
                  >
                    {/* User header */}
                    <div className="flex items-center gap-3 px-4 py-3 border-b border-ventsafe-border/50 bg-ventsafe-muted/50">
                      <div className="w-8 h-8 rounded-full bg-ventsafe-foreground text-ventsafe-primary-foreground flex items-center justify-center text-sm font-bold shrink-0">
                        {firstLetter}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-ventsafe-foreground truncate">
                          {anonymousName}
                        </p>
                        <div className="mt-0.5">
                          <RoleBadge role={userRole} />
                        </div>
                      </div>
                    </div>

                    {/* Items */}
                    <div className="py-1">
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

                    {/* Logout */}
                    <div className="border-t border-ventsafe-border/50 py-1">
                      <button
                        onClick={() => {
                          setDropdownOpen(false);
                          setShowLogoutModal(true);
                        }}
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
          </div>
        </div>
      </header>

      {/* ── Page Content ── */}
      <div className="pt-16">{children}</div>

      {/* ── Logout / Name Change Modal ── */}
      <LogoutModal
        isOpen={showLogoutModal}
        currentName={anonymousName}
        gender={user?.gender ?? "male"} // use actual gender from user object
        mode="logout"
        onConfirm={logout} // fires on "Save & Logout" or "No, just log out"
        onCancel={() => setShowLogoutModal(false)}
      />
    </>
  );
}