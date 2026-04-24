"use client";

import { useAuth } from "@/hooks/useAuth";
import { SanctuaryUI } from "@/components/chat/SanctuaryUI";
import { ClinicUI } from "@/components/chat/ClinicUI";
import { useEffect, useState } from "react";
import { PanicButton } from "@/components/shared/PanicButton";
import { ManiLifebuoy } from "@/components/shared/ManiLifebuoy";

export default function ChatPage() {
  const { user } = useAuth();
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) return null;

  const isCounsellor = user?.role === "counselor";

  const handlePanic = () => {
    // Clear potentially sensitive states locally
    console.log("Panic triggered! Wiping chat state");
  };

  return (
    <>
      <main className="min-h-screen">
        {isCounsellor ? (
          <ClinicUI />
        ) : (
          <>
            <SanctuaryUI />
            <PanicButton onTrigger={handlePanic} />
            <ManiLifebuoy />
          </>
        )}
      </main>
    </>
  );
}
