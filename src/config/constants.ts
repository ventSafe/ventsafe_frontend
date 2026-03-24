// App Configuration
export const APP_NAME = "VentSafe";
export const APP_DESCRIPTION =
  "Anonymous Mental Health Platform for Nigerian Students";

// API Endpoints
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
export const WS_BASE_URL =
  process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:5000";
export const AI_SERVICE_URL =
  process.env.NEXT_PUBLIC_AI_SERVICE_URL || "http://localhost:8000/api";

// Blockchain Configuration
export const BLOCKCHAIN_NETWORK =
  process.env.NEXT_PUBLIC_BLOCKCHAIN_NETWORK || "development";
export const BLOCKCHAIN_RPC_URL =
  process.env.NEXT_PUBLIC_BLOCKCHAIN_RPC_URL || "http://localhost:8545";

// Routes
export const ROUTES = {
  // Public routes
  HOME: "/",
  ABOUT: "/about",
  CONTACT: "/contact",
  PRIVACY: "/privacy-policy",
  TERMS: "/terms",

  // Auth routes
  LOGIN: "/login",
  SIGNUP: "/signup",

  // Protected routes (after login)
  SOCIAL_MEDIA: "/vent-space", // Main feed/home after login
  RESOURCES: "/resources", // Resources page
  VENT: "/vent", // Chat/vent page
  PROFILE: "/profile",
  COUNSELOR: "/counselor",
  CRISIS: "/crisis",
} as const;

// Mental Health Categories
export const MENTAL_HEALTH_CATEGORIES = [
  { value: "exam-stress", label: "Exam Stress", emoji: "📚" },
  { value: "family-pressure", label: "Family Pressure", emoji: "👨‍👩‍👧‍👦" },
  { value: "financial-stress", label: "Financial Stress", emoji: "💰" },
  { value: "loneliness", label: "Loneliness", emoji: "😔" },
  { value: "depression", label: "Depression", emoji: "😞" },
  { value: "anxiety", label: "Anxiety", emoji: "😰" },
  { value: "relationship", label: "Relationship Issues", emoji: "💔" },
  { value: "identity-crisis", label: "Identity Crisis", emoji: "🤔" },
  { value: "suicidal-thoughts", label: "Suicidal Thoughts", emoji: "🆘" },
  { value: "other", label: "Other", emoji: "💬" },
] as const;

// Depression Intensity Levels
export const INTENSITY_LEVELS = {
  LOW: { min: 0, max: 3, label: "Low Risk", color: "green" },
  MODERATE: { min: 4, max: 6, label: "Moderate Risk", color: "yellow" },
  HIGH: { min: 7, max: 8, label: "High Risk", color: "orange" },
  CRITICAL: { min: 9, max: 10, label: "Critical Risk", color: "red" },
} as const;

// Crisis Hotlines (Nigeria)
export const CRISIS_HOTLINES = [
  { name: "Mental Health Foundation Nigeria", phone: "+234 818 886 0000" },
  { name: "Suicide Prevention Helpline", phone: "+234 806 210 6493" },
  { name: "Mentally Aware Nigeria", phone: "+234 809 210 0864" },
] as const;

// Local Storage Keys
export const STORAGE_KEYS = {
  THEME: "ventsafe-theme",
  AUTH_TOKEN: "ventsafe-auth-token",
  USER_DATA: "ventsafe-user-data",
  PUBLIC_KEY: "ventsafe-public-key",
  ENCRYPTED_PRIVATE_KEY: "ventsafe-encrypted-private-key",
  ANONYMOUS_ID: "ventsafe-anonymous-id",
  GENDER: "ventsafe-gender",
} as const;

// Validation Rules
export const VALIDATION = {
  MIN_POST_LENGTH: 10,
  MAX_POST_LENGTH: 5000,
  MIN_USERNAME_LENGTH: 3,
  MAX_USERNAME_LENGTH: 50,
  PASSWORD_MIN_LENGTH: 8,
} as const;

// WebSocket Events
export const WS_EVENTS = {
  CONNECT: "connect",
  DISCONNECT: "disconnect",
  MESSAGE: "message",
  CRISIS_ALERT: "crisis_alert",
  COUNSELOR_ONLINE: "counselor_online",
  COUNSELOR_OFFLINE: "counselor_offline",
  TYPING: "typing",
  NEW_POST: "new_post",
} as const;

// Animation Durations (ms)
export const ANIMATION_DURATION = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
} as const;

// Pagination
export const PAGINATION = {
  POSTS_PER_PAGE: 10,
  COMMENTS_PER_PAGE: 20,
  MESSAGES_PER_PAGE: 50,
} as const;
