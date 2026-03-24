"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Monitor, Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { theme, setTheme } = useTheme();

  // useEffect only runs on the client, so now we can safely show the UI
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-10 h-10" />; // Placeholder to prevent layout shift
  }

  const getCurrentIcon = () => {
    if (theme === "system") return <Monitor className="h-4 w-4" />;
    if (theme === "dark") return <Moon className="h-4 w-4" />;
    return <Sun className="h-4 w-4" />;
  };

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-md hover:bg-ventsafe-navy/10 dark:hover:bg-white/10 transition-colors"
        aria-label="Toggle theme"
      >
        {getCurrentIcon()}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-ventsafe-darkBg border border-ventsafe-border dark:border-ventsafe-border/30 rounded-lg shadow-lg z-20 overflow-hidden">
            <button
              onClick={() => handleThemeChange("light")}
              className={`w-full px-4 py-2.5 text-left flex items-center gap-3 hover:bg-ventsafe-muted dark:hover:bg-white/5 transition-colors ${
                theme === "light" ? "bg-ventsafe-muted dark:bg-white/10" : ""
              }`}
            >
              <Sun className="h-4 w-4" />
              <span className="text-sm font-medium">Light</span>
            </button>
            <button
              onClick={() => handleThemeChange("dark")}
              className={`w-full px-4 py-2.5 text-left flex items-center gap-3 hover:bg-ventsafe-muted dark:hover:bg-white/5 transition-colors ${
                theme === "dark" ? "bg-ventsafe-muted dark:bg-white/10" : ""
              }`}
            >
              <Moon className="h-4 w-4" />
              <span className="text-sm font-medium">Dark</span>
            </button>
            <button
              onClick={() => handleThemeChange("system")}
              className={`w-full px-4 py-2.5 text-left flex items-center gap-3 hover:bg-ventsafe-muted dark:hover:bg-white/5 transition-colors ${
                theme === "system" ? "bg-ventsafe-muted dark:bg-white/10" : ""
              }`}
            >
              <Monitor className="h-4 w-4" />
              <span className="text-sm font-medium">System</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
