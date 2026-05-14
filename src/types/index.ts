// User Types
export interface User {
  id: string;
  anonymousId: string;
  publicKey: string;
  publicKeyFingerprint?: string;
  gender: "male" | "female";
  role: "student" | "counsellor_pending" | "counselor" | "admin";
  anonymousName?: string; // ← Added: e.g. "Emeka"
  signupStatus?: "keys_generated" | "pin_set" | "complete";
  agreedToTerms?: boolean;
  isOnline?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AnonymousProfile {
  anonymousName: string;
  avatarColor: string;
  avatarInitials: string;
  gender: "male" | "female";
}

// Post Types
export interface Post {
  id: string;
  content: string;
  category: string;
  intensityLevel: number;
  anonymousAuthor: AnonymousProfile;
  commentsCount: number;
  supportCount: number;
  viewCount: number;
  isAnonymous: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  postId: string;
  content: string;
  anonymousAuthor: AnonymousProfile;
  createdAt: string;
}

// Chat/Message Types
export interface Message {
  id: string;
  conversationId: string;
  content: string;
  senderId: string;
  senderType: "user" | "counselor" | "ai";
  isRead: boolean;
  createdAt: string;
}

export interface Conversation {
  id: string;
  participants: string[];
  lastMessage?: Message;
  unreadCount: number;
  status: "active" | "closed";
  createdAt: string;
  updatedAt: string;
}

// Crisis Alert Types
export interface CrisisAlert {
  id: string;
  userId: string;
  intensityLevel: number;
  content: string;
  status: "pending" | "assigned" | "resolved";
  assignedCounselorId?: string;
  resolvedAt?: string;
  createdAt: string;
}

// Mental Health Tracking
export interface MoodEntry {
  id: string;
  userId: string;
  mood: "very-bad" | "bad" | "neutral" | "good" | "very-good";
  intensityScore: number;
  notes?: string;
  createdAt: string;
}

export interface MoodHistory {
  entries: MoodEntry[];
  averageIntensity: number;
  trend: "improving" | "stable" | "declining";
}

// Blockchain Types
export interface BlockchainIdentity {
  publicKey: string;
  encryptedPrivateKey: string;
  anonymousId: string;
  network: string;
  isAuthenticated: boolean;
}

export interface KeyPair {
  publicKey: string;
  privateKey: string;
}

export interface BlockchainTransaction {
  hash: string;
  from: string;
  to: string;
  timestamp: string;
  status: "pending" | "confirmed" | "failed";
}

// AI Types
export interface AIAnalysis {
  sentiment: "positive" | "neutral" | "negative";
  intensityScore: number;
  keywords: string[];
  categories: string[];
  riskLevel: "low" | "moderate" | "high" | "critical";
  suggestedResponse?: string;
}

// Counselor Types
export interface CounselorProfile extends User {
  specializations: string[];
  totalSessions: number;
  rating: number;
  isAvailable: boolean;
  bio?: string;
}

// Notification Types
export interface Notification {
  id: string;
  userId: string;
  type: "message" | "crisis" | "comment" | "support" | "system";
  title: string;
  message: string;
  isRead: boolean;
  link?: string;
  createdAt: string;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ─── Auth Response Types ──────────────────────────────────────────────────────

// What the backend returns after signup
export interface SignupResponseData extends User {
  privateKey: string; // Returned exactly once — show to user and never store
  publicKey: string;
}

// What the backend returns after login
export interface LoginResponseData extends User {
  isNewUser: boolean; // True if first time logging in → redirect to /welcome
}

// ─── Form Types ───────────────────────────────────────────────────────────────

export interface SignupFormData {
  gender: "male" | "female";
  agreeToTerms: boolean;
  publicKey: string;
  role?: string;
}

export interface LoginFormData {
  publicKey: string;
  privateKey: string;
}

export interface PostFormData {
  content: string;
  category: string;
  isAnonymous: boolean;
}

export interface MessageFormData {
  content: string;
  recipientId: string;
}

// Store Types
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginFormData) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export interface ThemeState {
  theme: "light" | "dark";
  toggleTheme: () => void;
  setTheme: (theme: "light" | "dark") => void;
}

export interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Notification) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
}

// Utility Types
export type DeepPartial<T> = {
  [P in keyof T]?: DeepPartial<T[P]>;
};

export type Nullable<T> = T | null;

export type AsyncStatus = "idle" | "loading" | "success" | "error";
