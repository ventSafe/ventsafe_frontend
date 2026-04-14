"use client";

import { getInitials } from "@/lib/utils";

interface UserAvatarProps {
  name?: string;
  role?: string;
  className?: string;
}

export function UserAvatar({ name, role, className = "" }: UserAvatarProps) {
  const initials = name ? getInitials(name) : "?";
  
  // Navy for counselors, subtle grey for students
  const bgClass =
    role === "counselor" || role === "counsellor_pending"
      ? "bg-ventsafe-navy text-white shadow-sm"
      : "bg-ventsafe-muted text-ventsafe-foreground border border-ventsafe-border/30";

  return (
    <div
      className={`flex items-center justify-center rounded-full font-bold overflow-hidden shrink-0 ${bgClass} ${className}`}
    >
      <span className="opacity-95">{initials}</span>
    </div>
  );
}
