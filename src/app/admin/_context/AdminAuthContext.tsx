"use client";

import { createContext, useContext } from "react";
import { AdminUser } from "../utils";

export interface AdminAuthCtx {
  admin: AdminUser;
  logout: () => Promise<void>;
  isSuperAdmin: boolean;
}

export const AdminAuthContext = createContext<AdminAuthCtx | null>(null);

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error("useAdminAuth must be used inside AdminLayout");
  return ctx;
}
