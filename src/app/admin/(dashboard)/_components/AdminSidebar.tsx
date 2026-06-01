"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  FileCheck,
  LogOut,
  Shield,
  Crown,
  Menu,
  X,
  UserCog,
} from "lucide-react";
import { Logo } from "@/components/shared/Logo";
import { useAdminAuth } from "../../_context/AdminAuthContext";

interface SidebarProps {
  pendingCount: number;
}

const BASE_LINKS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/applications", label: "Applications", icon: FileCheck },
  { href: "/admin/users", label: "Users", icon: Users },
];

const SUPER_LINKS = [
  { href: "/admin/admins", label: "Manage Admins", icon: UserCog },
];

export function AdminSidebar({ pendingCount }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { admin, logout } = useAdminAuth();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const links = admin.is_super_admin
    ? [...BASE_LINKS, ...SUPER_LINKS]
    : BASE_LINKS;

  const renderNavContent = () => (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-5 border-b border-ventsafe-border/30">
        <div className="flex items-center justify-between mb-4">
          {!collapsed && <Logo />}
          <button
            onClick={() => {
              setCollapsed(!collapsed);
              setMobileOpen(false);
            }}
            className="text-ventsafe-foreground/40 hover:text-ventsafe-foreground cursor-pointer transition-colors ml-auto"
          >
            {mobileOpen ? (
              <X className="w-4 h-4" />
            ) : (
              <Menu className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Admin badge */}
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-3 bg-ventsafe-foreground/5 border border-ventsafe-foreground/10 rounded-ventsafe-sm px-3 py-2.5"
          >
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                admin.is_super_admin
                  ? "bg-yellow-100"
                  : "bg-ventsafe-foreground/10"
              }`}
            >
              {admin.is_super_admin ? (
                <Crown className="w-4 h-4 text-yellow-600" />
              ) : (
                <Shield className="w-4 h-4 text-ventsafe-foreground" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-ventsafe-foreground truncate">
                {admin.full_name}
              </p>
              <p
                className={`text-xs font-medium ${
                  admin.is_super_admin
                    ? "text-yellow-600"
                    : "text-ventsafe-foreground/50"
                }`}
              >
                {admin.is_super_admin ? "Super Admin" : "Admin"}
              </p>
            </div>
          </motion.div>
        )}

        {/* Collapsed admin icon */}
        {collapsed && (
          <div
            className={`w-9 h-9 rounded-lg flex items-center justify-center mx-auto ${
              admin.is_super_admin
                ? "bg-yellow-100"
                : "bg-ventsafe-foreground/10"
            }`}
          >
            {admin.is_super_admin ? (
              <Crown className="w-4 h-4 text-yellow-600" />
            ) : (
              <Shield className="w-4 h-4 text-ventsafe-foreground" />
            )}
          </div>
        )}
      </div>

      {/* Nav links */}
      <nav className="flex-1 p-3 space-y-1 mt-1">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <button
              key={href}
              onClick={() => {
                router.push(href);
                setMobileOpen(false);
              }}
              title={collapsed ? label : undefined}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-ventsafe-sm transition-all cursor-pointer text-left group ${
                active
                  ? "bg-ventsafe-foreground text-ventsafe-background shadow-md shadow-ventsafe-foreground/20"
                  : "text-ventsafe-foreground/60 hover:text-ventsafe-foreground hover:bg-ventsafe-foreground/5"
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {!collapsed && (
                <span className="text-sm font-medium flex-1">{label}</span>
              )}
              {!collapsed &&
                href === "/admin/applications" &&
                pendingCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold shrink-0"
                  >
                    {pendingCount > 9 ? "9+" : pendingCount}
                  </motion.span>
                )}
              {collapsed &&
                href === "/admin/applications" &&
                pendingCount > 0 && (
                  <span className="absolute right-1 top-1 w-2 h-2 bg-red-500 rounded-full" />
                )}
            </button>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-ventsafe-border/30">
        <button
          onClick={logout}
          title={collapsed ? "Sign Out" : undefined}
          className="w-full flex items-center gap-3 px-3 py-3 rounded-ventsafe-sm text-ventsafe-foreground/40 hover:text-red-500 hover:bg-red-500/10 transition-all cursor-pointer"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!collapsed && <span className="text-sm font-medium">Sign Out</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 64 : 256 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="hidden lg:flex flex-col bg-ventsafe-card border-r border-ventsafe-border/40 shrink-0 overflow-hidden h-screen sticky top-0 relative"
      >
        {renderNavContent()}
      </motion.aside>

      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-40 w-10 h-10 bg-ventsafe-card border border-ventsafe-border/40 rounded-xl flex items-center justify-center shadow-md cursor-pointer"
      >
        <Menu className="w-4 h-4 text-ventsafe-foreground" />
      </button>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 bg-black/30 z-40 lg:hidden"
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed left-0 top-0 bottom-0 w-64 bg-ventsafe-card border-r border-ventsafe-border/40 z-50 lg:hidden"
            >
              {renderNavContent()}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
