"use client";

import { useAuth } from "@/hooks/useAuth";
import { SanctuaryUI } from "@/components/chat/SanctuaryUI";
import { ClinicUI } from "@/components/chat/ClinicUI";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function ChatPage() {
  const { user } = useAuth();
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) return null;

  const isCounsellor = user?.role === "counselor";

  return (
    <>


      <main className="min-h-screen">
        {isCounsellor ? (
          <ClinicUI />
        ) : (
          <SanctuaryUI />
        )}
      </main>
    </>
  );
}
