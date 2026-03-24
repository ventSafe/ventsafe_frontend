import Link from "next/link";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="bg-ventsafe-background py-4 pt-8">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo */}
          <div>
            <Logo />
          </div>

          {/* Copyright */}
          <div className="flex items-center gap-2 text-sm text-ventsafe-foreground">
            <span>©</span>
            <span>Copyright 2026 All Right Reserved @VentSafe</span>
          </div>

          {/* Links */}
          <div className="flex items-center gap-6">
            <Link
              href="/terms"
              className="text-ventsafe-btn-sm text-ventsafe-foreground hover:text-ventsafe-primary transition-colors"
            >
              Terms & Conditions
            </Link>
            <Link
              href="/privacy-policy"
              className="text-ventsafe-btn-sm  text-ventsafe-foreground hover:text-ventsafe-primary transition-colors"
            >
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
