<p align="center">
  <img src="public/images/logo-white.png" alt="VentSafe Logo" width="200" style="background:#000562; border-radius:12px; padding:16px;" />
</p>

# VentSafe — Frontend

> **Next.js 16 · React 19 · TypeScript · TailwindCSS v4 · Zustand · Socket.IO**

A safe, anonymous mental health platform for Nigerian tertiary institution students. The frontend is a Next.js App Router application that communicates with the VentSafe REST API and WebSocket server.

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Project Structure](#project-structure)
3. [Environment Variables](#environment-variables)
4. [Getting Started](#getting-started)
5. [Page Routes & Navigation Flow](#page-routes--navigation-flow)
6. [Authentication Flow](#authentication-flow)
7. [Theme System](#theme-system)
8. [State Management](#state-management)
9. [Component Architecture](#component-architecture)
10. [Real-Time Chat](#real-time-chat)
11. [Blockchain & Anonymity Layer](#blockchain--anonymity-layer)
12. [API Integration](#api-integration)
13. [Key Design Decisions](#key-design-decisions)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| UI Library | React 19 |
| Styling | TailwindCSS v4 + CSS custom properties |
| State Management | Zustand v5 |
| Forms | React Hook Form + Zod validation |
| Real-time | Socket.IO Client v4 |
| Animations | Framer Motion v12 |
| Notifications | Sonner (toast) |
| Theme | next-themes |
| Crypto | node-forge, crypto-js, bip39, ethers.js |
| HTTP | Axios + native fetch |
| Font | Montserrat (Google Fonts via next/font) |

---

## Project Structure

```
ventsafe-frontend/
├── public/                        # Static assets
├── src/
│   ├── app/                       # Next.js App Router pages
│   │   ├── layout.tsx             # Root layout (font, theme, providers)
│   │   ├── page.tsx               # Landing page  /
│   │   ├── globals.css            # Design tokens + global CSS
│   │   ├── about/                 # /about
│   │   ├── contact/               # /contact
│   │   ├── privacy-policy/        # /privacy-policy
│   │   ├── terms/                 # /terms
│   │   ├── login/                 # /login  — key-pair login
│   │   ├── signup/                # /signup — anonymous sign-up wizard
│   │   ├── onboarding/            # /onboarding — post-signup setup
│   │   ├── welcome/               # /welcome — first-launch screen
│   │   ├── vent-space/            # /vent-space — social feed (protected)
│   │   ├── chat/                  # /chat — real-time chat (protected)
│   │   ├── my-vents/              # /my-vents — own posts (protected)
│   │   ├── resources/             # /resources — mental health resources (protected)
│   │   ├── available-counsellors/ # /available-counsellors (protected)
│   │   ├── settings/              # /settings
│   │   ├── admin/                 # /admin — admin dashboard
│   │   └── coming-soon/           # Placeholder fallback
│   │
│   ├── components/
│   │   ├── layout/                # Header, Hero, Sidebar
│   │   ├── shared/                # Footer and shared UI
│   │   ├── feed/                  # Vent Space / social feed
│   │   ├── chat/                  # Chat UI
│   │   ├── counselor/             # Counsellor components
│   │   ├── mental-health/         # Mood tracker, crisis tools
│   │   ├── forms/                 # Auth forms, post forms
│   │   ├── ui/                    # Primitive components (Button, Dialog, etc.)
│   │   └── providers/
│   │       ├── AuthProvider.tsx   # Runs checkAuth() on every page load
│   │       ├── ThemeProvider.tsx  # next-themes wrapper (default = light)
│   │       └── RouteGuard.tsx     # Client-side protected route enforcement
│   │
│   ├── store/
│   │   ├── useAuthStore.ts        # Auth state + token lifecycle (Zustand)
│   │   ├── chatStore.ts           # Active chat session state
│   │   └── useVaultStore.ts       # In-memory key vault
│   │
│   ├── hooks/
│   │   └── useAuth.ts             # Convenience hook wrapping useAuthStore
│   │
│   ├── config/
│   │   └── constants.ts           # API URLs, route constants, storage keys
│   │
│   ├── lib/                       # Utility functions (cn, formatters)
│   ├── types/                     # Shared TS types (User, Post, etc.)
│   └── middware.ts                # Next.js middleware (pass-through)
│
├── next.config.ts
├── tsconfig.json
└── package.json
```

---

## Environment Variables

Create `.env.local` in the `ventsafe-frontend/` directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_WS_URL=ws://localhost:5000
NEXT_PUBLIC_AI_SERVICE_URL=http://localhost:8000/api
NEXT_PUBLIC_BLOCKCHAIN_NETWORK=development
NEXT_PUBLIC_BLOCKCHAIN_RPC_URL=http://localhost:8545
```

---

## Getting Started

```bash
# Install dependencies
npm install

# Create environment file and fill in values
cp .env.local.example .env.local

# Start development server
npm run dev
# Runs at http://localhost:3000

# Production build
npm run build && npm run start
```

---

## Page Routes & Navigation Flow

### Public Routes

| Route | Description |
|---|---|
| `/` | Landing page with hero, product pitch, and CTAs |
| `/about` | Platform mission and overview |
| `/contact` | Support contact form |
| `/privacy-policy` | Data usage legal page |
| `/terms` | Terms of service |
| `/login` | Key-pair authentication |
| `/signup` | Multi-step anonymous registration |
| `/onboarding` | Post-signup preferences setup |
| `/welcome` | First-launch greeting |

### Protected Routes (requires JWT — enforced by `RouteGuard`)

| Route | Access Level |
|---|---|
| `/vent-space` | Students + Counsellors |
| `/chat` | Students + Counsellors |
| `/my-vents` | Students |
| `/resources` | All authenticated |
| `/available-counsellors` | Students |
| `/settings` | All authenticated |
| `/admin` | Admins only |

### Navigation Flow

```
[ / Landing ]
   ├── /signup → 3-step wizard → /onboarding → /welcome → /vent-space
   ├── /login  → key-pair entry → /vent-space
   └── /about | /contact | /privacy-policy | /terms  (public)

[ /vent-space ] — main app shell
   ├── /chat                     Real-time anonymous chat
   ├── /my-vents                 Manage own posts
   ├── /resources                Mental health articles
   ├── /available-counsellors    Browse & follow counsellors
   └── /settings                 Theme toggle, account options
```

---

## Authentication Flow

VentSafe uses **RSA key-pair anonymous authentication** — no email or phone number is stored.

### Sign Up (3 Steps)

```
Step 1 — Generate Key Pair
  RSA 2048-bit key pair generated in browser (node-forge)
  Public key → POST /api/auth/signup
  Server returns anonymous alias

Step 2 — Save Private Key
  Private key shown ONCE — user must save it
  Private key encrypted with user's PIN (AES via crypto-js)
  Encrypted key stored in localStorage

Step 3 — Confirm PIN
  POST /api/auth/pin-confirmed
  JWT access token (15min) + httpOnly refresh cookie (30 days) set
  Redirect → /onboarding
```

### Login

```
User enters Public Key + Private Key
  → POST /api/auth/login
  → Server verifies ownership
  → JWT + httpOnly refresh cookie returned
  → Token in localStorage["ventsafe-auth-token"]
  → Redirect → /vent-space
```

### Session Persistence (every page load via `AuthProvider`)

```
checkAuth() runs:
  1. Read localStorage token → GET /api/auth/me
     ✓ 200 → user loaded into Zustand
     ✗ 401 → POST /api/auth/refresh (httpOnly cookie auto-sent)
               ✓ → new token saved → retry /auth/me
               ✗ → clearAuth() → redirect /login
```

### Logout

```
clearAuth():
  Removes: auth token, user data, encrypted private key, anonymous ID
  Keeps:   public key (needed for switch-account modal UX)
  Clears Zustand state
  Redirects to /login
```

---

## Theme System

### Default

**Light mode** is the default. The user's preference is persisted in `localStorage["ventsafe-theme"]`.

### CSS Variables (`globals.css`)

| Variable | Light | Dark |
|---|---|---|
| `--bg-color` | `#eff0ff` | `#05050A` |
| `--fg-color` | `#000562` | `#ffffff` |
| `--primary-color` | `#000681` | `#5B50FF` |
| `--card-color` | `#ffffff` | `#0A0A0F` |
| `--muted-color` | `#e5e7f0` | `#111116` |
| `--border-color` | `#d1d5e4` | `rgba(255,255,255,0.1)` |

### How It Works

1. `ThemeProvider` sets `data-theme="light"` or `data-theme="dark"` on `<html>`
2. CSS selectors like `[data-theme='dark'] { ... }` override CSS variables
3. All Tailwind utility classes (`bg-ventsafe-background`, `text-ventsafe-foreground`) resolve via these variables
4. Logo visibility is controlled by `.theme-logo-light` / `.theme-logo-dark` CSS classes

### Toggle

The `<Header>` component has a theme toggle button that calls `next-themes`'s `setTheme()`.

---

## State Management

### `useAuthStore` — Auth & Session

```ts
// State
user: User | null
isAuthenticated: boolean
isLoading: boolean
isInitialized: boolean

// Actions
checkAuth()          // Validate or refresh session on page load
refreshAccessToken() // POST /auth/refresh using httpOnly cookie
clearAuth()          // Wipe session, logout
setUser(user)        // Update after login
```

### `chatStore` — Active Chat

Tracks the current WebSocket chat session (session ID, messages, typing state).

### `useVaultStore` — Key Vault

Temporarily holds the decrypted private key in memory during an active session (never persisted in plaintext).

---

## Component Architecture

### Provider Tree (in `layout.tsx`)

```
<ThemeProvider>           ← next-themes (data-theme attribute)
  <AuthProvider>          ← fires checkAuth() once on mount
    <RouteGuard>          ← redirects unauthorized users
      {page content}
    </RouteGuard>
    <Toaster />           ← global toast notifications
  </AuthProvider>
</ThemeProvider>
```

### RouteGuard Behaviour

| State | Result |
|---|---|
| `isInitialized === false` | Show loading spinner |
| Not authenticated + protected route | Redirect `/login` |
| Authenticated + auth-only page (`/login`) | Redirect `/vent-space` |
| Otherwise | Render page |

---

## Real-Time Chat

Chat is powered by **Socket.IO** for bi-directional real-time messaging.

### Flow

```
1. Student selects a counsellor → POST /api/chat/sessions
2. Frontend connects: io(WS_URL, { auth: { token } })
3. Joins room: socket.emit("join", { sessionId })
4. Send message: socket.emit("message", { sessionId, content })
5. Server broadcasts to room participants
6. Messages also persisted via REST: POST /api/chat/sessions/:id/messages
```

### Double-Blind Privacy

- Neither party sees the other's real identity
- All communication is by anonymous alias
- Session IDs are UUIDs with no PII attached

### Presence

Counsellor online/offline status is tracked by the backend socket presence handler and served via `GET /api/counsellors/online`.

---

## Blockchain & Anonymity Layer

| Technology | Purpose |
|---|---|
| `node-forge` | RSA key pair generation in browser |
| `crypto-js` | AES encryption of private key with PIN |
| `bip39` | Mnemonic seed phrase for key recovery |
| `ethers.js` / `web3.js` | Blockchain interaction for on-chain verification |
| `snarkjs` | Zero-Knowledge Proof for anonymous credential verification |

Posts are (or can be) cryptographically signed by the user's private key. The signature is verifiable on-chain against the public key, proving authorship without revealing identity.

---

## API Integration

### Base URL

```ts
// src/config/constants.ts
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
```

### Auth Header

```ts
headers: { Authorization: `Bearer ${localStorage.getItem('ventsafe-auth-token')}` }
```

### Key Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/auth/signup` | Register anonymous user |
| POST | `/api/auth/login` | Key-pair login |
| GET | `/api/auth/me` | Validate session |
| POST | `/api/auth/refresh` | Refresh access token |
| GET | `/api/posts` | Load feed |
| POST | `/api/posts` | Create vent/post |
| POST | `/api/posts/:id/react` | Like / dislike |
| GET | `/api/resources` | List resources |
| GET | `/api/counsellors/online` | Online counsellors |
| POST | `/api/counsellors/:id/follow` | Follow/unfollow |
| POST | `/api/mood` | Log mood |
| POST | `/api/chat/sessions` | Start chat |

---

## Key Design Decisions

| Decision | Rationale |
|---|---|
| No email/phone at signup | Zero PII — true anonymity by design |
| RSA key-pair authentication | Cryptographic proof without passwords |
| Private key encrypted with PIN | Server never sees raw private key |
| httpOnly cookie for refresh token | XSS-proof session management |
| Client-side RouteGuard over middleware | Avoids cross-origin cookie issues in dev |
| CSS variables + TailwindCSS v4 | Theme switching without JS-in-CSS overhead |
| Zustand over Redux | Simpler API, less boilerplate |
| Light theme as default | Most accessible default across all device types |
