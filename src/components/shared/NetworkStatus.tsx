"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";

export function NetworkStatus() {
  const toastId = useRef<string | number | null>(null);

  useEffect(() => {
    const handleOffline = () => {
      if (toastId.current) toast.dismiss(toastId.current);
      toastId.current = toast.error("You are currently offline. Please check your internet connection.", {
        duration: Infinity,
      });
    };

    const handleOnline = () => {
      if (toastId.current) toast.dismiss(toastId.current);
      toast.success("You are back online!");
      checkSpeed();
    };

    const checkSpeed = () => {
      if (!navigator.onLine) return;
      const conn = (navigator as any).connection;
      if (conn && (conn.effectiveType === 'slow-2g' || conn.effectiveType === '2g' || conn.downlink < 0.5)) {
        if (toastId.current) toast.dismiss(toastId.current);
        toastId.current = toast.warning("Your network connection is slow. The app may lag.", {
          duration: 5000,
        });
      }
    };

    const handleConnectionChange = () => {
      checkSpeed();
    };

    // Initial check
    if (typeof window !== "undefined") {
      if (!navigator.onLine) {
        handleOffline();
      } else {
        checkSpeed();
      }
    }

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    const conn = (navigator as any).connection;
    if (conn) {
      conn.addEventListener("change", handleConnectionChange);
    }

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
      if (conn) {
        conn.removeEventListener("change", handleConnectionChange);
      }
    };
  }, []);

  return null;
}
