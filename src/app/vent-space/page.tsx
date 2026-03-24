"use client";

import { useState } from "react";
import { Footer } from "@/components/shared/Footer";
import { Logo } from "@/components/shared/Logo";
import Link from "next/link";
import { RouteGuard } from "@/components/providers/RouteGuard";
import { useAuth } from "@/hooks/useAuth";
import { LogoutModal } from "@/components/shared/LogoutModal";

function VentSpaceContent() {
  const { anonymousName, logout, gender } = useAuth();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  return (
    <div className="min-h-screen bg-ventsafe-background flex flex-col">
      {/* Header */}
      <header className="p-6 border-b border-ventsafe-border/20">
        <div className="container mx-auto flex items-center justify-between">
          <Logo />

          {/* Anonymous name in header */}
          {anonymousName && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-ventsafe-foreground/10 border border-ventsafe-foreground/30 flex items-center justify-center">
                <span className="text-xs font-bold text-ventsafe-foreground">
                  {anonymousName.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="text-sm font-medium text-ventsafe-foreground">
                {anonymousName}
              </span>
            </div>
          )}

          <nav className="flex items-center gap-6">
            <Link href="/social-media" className="text-sm font-medium text-ventsafe-navy">Feed</Link>
            <Link href="/resources" className="text-sm font-medium text-ventsafe-foreground/70 hover:text-ventsafe-navy">Resources</Link>
            <Link href="/vent" className="text-sm font-medium text-ventsafe-foreground/70 hover:text-ventsafe-navy">Vent</Link>
            <Link href="/profile" className="text-sm font-medium text-ventsafe-foreground/70 hover:text-ventsafe-navy">Profile</Link>
            <button
              onClick={() => setShowLogoutModal(true)}
              className="text-sm font-medium text-ventsafe-foreground/50 hover:text-red-500 transition-colors cursor-pointer"
            >
              Log Out
            </button>

      <LogoutModal
        isOpen={showLogoutModal}
        currentName={anonymousName}
        gender={gender}
        onConfirm={() => { setShowLogoutModal(false); logout(); }}
        onCancel={() => setShowLogoutModal(false)}
      />
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-ventsafe-foreground mb-2">
            {anonymousName ? `Welcome, ${anonymousName}` : "Welcome to Your Feed"}
          </h1>
          <p className="text-lg text-ventsafe-foreground/70 mb-8">
            This is your anonymous safe space. Share your thoughts, connect with others, and find support.
          </p>
          <div className="flex gap-4 justify-center">
            <button className="bg-ventsafe-navy text-white px-8 py-3 rounded-lg font-medium hover:opacity-90 transition-opacity">
              Create Post
            </button>
            <button className="border-2 border-ventsafe-navy text-ventsafe-navy px-8 py-3 rounded-lg font-medium hover:bg-ventsafe-navy hover:text-white transition-colors">
              Explore Resources
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

// Wrap with RouteGuard — unauthenticated users get redirected to /login
export default function VentSpacePage() {
  return (
    <RouteGuard>
      <VentSpaceContent />
    </RouteGuard>
  );
}