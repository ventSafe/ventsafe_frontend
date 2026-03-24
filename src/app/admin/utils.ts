// ─── API Base ──────────────────────────────────────────────────────────────────

export const ADMIN_API = process.env.NEXT_PUBLIC_API_URL
  ? `${process.env.NEXT_PUBLIC_API_URL}/admin`
  : "http://localhost:5000/api/admin";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  full_name: string;
  is_super_admin: boolean;
  is_active: boolean;
  last_login?: string;
  created_at: string;
}

export interface Application {
  id: string;
  tier: "volunteer" | "professional";
  status: "pending" | "approved" | "rejected";
  realName: string;
  email: string;
  institution?: string;
  licenseNumber?: string;
  specialisations: string[];
  statement: string;
  document_url?: string;
  admin_note?: string;
  reviewed_by_name?: string;
  reviewed_at?: string;
  created_at: string;
  anonymous_name: string;
  gender: string;
}

export interface UserRecord {
  id: string;
  anonymous_id: string;
  anonymous_name: string;
  gender: string;
  role: string;
  is_active: boolean;
  is_online: boolean;
  signup_status: string;
  last_seen?: string;
  created_at: string;
  tier?: string;
  specialisations?: string[];
  counsellor_status?: string;
}

export interface DashboardStats {
  totalStudents: number;
  totalCounsellors: number;
  pendingApplications: number;
  approvedApplications: number;
  rejectedApplications: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
