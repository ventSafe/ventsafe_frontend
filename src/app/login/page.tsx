"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { LogoutModal } from "@/components/shared/LogoutModal";
import { motion } from "framer-motion";
import { Logo } from "@/components/shared/Logo";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Footer } from "@/components/shared/Footer";
import { login } from "@/lib/auth";
import { useAuthStore } from "@/store/useAuthStore";
import { decryptPrivateKey, encryptPrivateKey, deriveKeysFromSeedPhrase } from "@/lib/blockchain/keys";
import { API_BASE_URL, STORAGE_KEYS } from "@/config/constants";
import { ShieldCheck, User as UserIcon } from "lucide-react";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect");
  const { setUser } = useAuthStore();

  const [isRecognized, setIsRecognized] = useState(false);
  const [recognizedPublicKey, setRecognizedPublicKey] = useState("");
  const [recognizedEncryptedKey, setRecognizedEncryptedKey] = useState("");
  const [recognizedName, setRecognizedName] = useState("");

  const [seedPhrase, setSeedPhrase] = useState("");
  const [pin, setPin] = useState(["", "", "", ""]);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState("");
  const [rememberMe, setRememberMe] = useState(true);

  // Name change prompt state (shown after login for returning users)
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const [pendingRedirect, setPendingRedirect] = useState("");
  const [pendingGender, setPendingGender] = useState<"male" | "female">("male");
  const [pendingName, setPendingName] = useState("");

  const pinRefs = [
    useRef<HTMLInputElement>(null!),
    useRef<HTMLInputElement>(null!),
    useRef<HTMLInputElement>(null!),
    useRef<HTMLInputElement>(null!),
  ];

  useEffect(() => {
    // Check if user is recognized on this device
    const storedEncryptedKey = localStorage.getItem(STORAGE_KEYS.ENCRYPTED_PRIVATE_KEY) || localStorage.getItem("ventsafe-counsellor-encrypted-key");
    const storedPublicKey = localStorage.getItem(STORAGE_KEYS.PUBLIC_KEY) || localStorage.getItem("ventsafe-counsellor-public-key");
    const storedName = localStorage.getItem("ventsafe-anon-name") || localStorage.getItem("ventsafe-counsellor-anon-name");

    if (storedEncryptedKey && storedPublicKey) {
      setIsRecognized(true);
      setRecognizedPublicKey(storedPublicKey);
      setRecognizedEncryptedKey(storedEncryptedKey);
      setRecognizedName(storedName || "User");
    }
  }, []);

  const handlePinDigit = (index: number, value: string) => {
    if (!value) {
      const updated = [...pin];
      updated[index] = "";
      setPin(updated);
      return;
    }
    const digits = value.replace(/\D/g, "");
    if (!digits) return;

    const updated = [...pin];
    if (digits.length > 1) {
      for (let i = 0; i < digits.length && index + i < 4; i++) {
        updated[index + i] = digits[i];
      }
      setPin(updated);
      const nextIndex = Math.min(index + digits.length, 3);
      pinRefs[nextIndex].current?.focus();
      return;
    }

    updated[index] = digits.slice(-1);
    setPin(updated);
    if (index < 3) pinRefs[index + 1].current?.focus();
  };

  const handlePinKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "Backspace" && !pin[index] && index > 0) {
      pinRefs[index - 1].current?.focus();
    }
    // Auto-submit when Enter pressed and all 4 digits filled
    if (e.key === "Enter") {
      e.preventDefault();
      if (pin.join("").length === 4) {
        void handleLogin(e as unknown as React.FormEvent);
      }
    }
  };

  const handleSwitchUser = () => {
    setIsRecognized(false);
    setPin(["", "", "", ""]);
    setError("");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const pinStr = pin.join("");
    if (pinStr.length < 4) {
      setError("Please enter your 4-digit PIN.");
      return;
    }

    if (!isRecognized && !seedPhrase.trim()) {
      setError("Please enter your 12-word seed phrase.");
      return;
    }

    setIsLoggingIn(true);

    try {
      let keyToUse = "";
      let pubKeyToUse = "";

      if (isRecognized) {
        // Use stored encrypted key
        try {
          keyToUse = await decryptPrivateKey(recognizedEncryptedKey, pinStr);
          pubKeyToUse = recognizedPublicKey;
        } catch {
          setError("Wrong PIN. Please try again.");
          setIsLoggingIn(false);
          return;
        }
      } else {
        // Derive keys from seed phrase + PIN
        try {
          const derived = deriveKeysFromSeedPhrase(seedPhrase.trim(), pinStr);
          keyToUse = derived.privateKey;
          pubKeyToUse = derived.publicKey;

          if (rememberMe) {
            const encrypted = await encryptPrivateKey(keyToUse, pinStr);
            localStorage.setItem(STORAGE_KEYS.ENCRYPTED_PRIVATE_KEY, encrypted);
            localStorage.setItem(STORAGE_KEYS.PUBLIC_KEY, pubKeyToUse);
          }
        } catch {
          setError("Failed to derive keys. Make sure your seed phrase is correct.");
          setIsLoggingIn(false);
          return;
        }
      }

      // Login with public key + private key
      const result = await login({ publicKey: pubKeyToUse, privateKey: keyToUse });

      if (result.success && result.data) {
        const user = result.data as any;
        const isNewUser = user?.isNewUser;

        // ── Role gate: reject counsellor keys on student login page ──────────
        if (user?.role === "counselor" || user?.role === "counsellor_pending") {
          // Do NOT call setUser — keep the user unauthenticated
          localStorage.removeItem("ventsafe-anon-name");
          setError("These keys belong to a counsellor account. Please use the counsellor login page.");
          setIsLoggingIn(false);
          return;
        }

        localStorage.removeItem("ventsafe-anon-name");
        if (user?.anonymousName) {
          localStorage.setItem("ventsafe-anon-name", user.anonymousName);
        }

        // Only authenticate once we've confirmed this is a student account
        setUser(user);

        const savedRedirect = localStorage.getItem("ventsafe-redirect-after-login");
        localStorage.removeItem("ventsafe-redirect-after-login");

        const destination = isNewUser
          ? "/welcome"
          : redirectTo && redirectTo.startsWith("/") && !redirectTo.startsWith("/login")
            ? redirectTo
            : savedRedirect && savedRedirect.startsWith("/") && !savedRedirect.startsWith("/login")
              ? savedRedirect
              : "/vent-space";

        if (isNewUser) {
          router.push("/welcome");
        } else {
          setPendingRedirect(destination);
          setPendingGender((user?.gender as "male" | "female") || "male");
          setPendingName(user?.anonymousName || "");
          setShowNamePrompt(true);
        }
      } else {
        setError(result.error || "Login failed. Please check your credentials and try again.");
      }
    } catch (err) {
      setError("Something went wrong. Make sure the backend server is running.");
    } finally {
      setIsLoggingIn(false);
      setPin(["", "", "", ""]);
    }
  };

  return (
    <div className="min-h-screen bg-ventsafe-background flex flex-col">
      <header className="p-6">
        <Logo />
      </header>

      <main className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-md">

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="text-center mb-8"
          >
            <h1 className="text-4xl font-bold text-ventsafe-foreground mb-3">
              {isRecognized ? "Welcome Back" : "Log In"}
            </h1>
            <p className="text-sm text-ventsafe-foreground/80">
              {isRecognized ? "Enter your PIN to unlock your identity." : "Enter your seed phrase and PIN to continue."}
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 300, damping: 30 }}>
            <form onSubmit={handleLogin} className="space-y-6 flex flex-col items-center">

              {isRecognized ? (
                <div className="w-full max-w-xs flex flex-col items-center bg-ventsafe-card border border-ventsafe-border/50 rounded-xl p-6 shadow-sm mb-2">
                  <div className="w-16 h-16 rounded-full bg-ventsafe-foreground/10 flex items-center justify-center mb-4">
                    <UserIcon className="w-8 h-8 text-ventsafe-foreground" />
                  </div>
                  <h2 className="text-lg font-bold text-ventsafe-foreground">{recognizedName}</h2>
                  <button type="button" onClick={handleSwitchUser} className="text-xs text-ventsafe-foreground/60 hover:text-ventsafe-foreground mt-2 underline cursor-pointer">
                    Not you? Log in with another account
                  </button>
                </div>
              ) : (
                <div className="w-full max-w-xs">
                  <label className="block text-sm font-medium text-ventsafe-foreground/80 mb-1.5">
                    12-Word Seed Phrase
                  </label>
                  <textarea
                    value={seedPhrase}
                    onChange={(e) => setSeedPhrase(e.target.value)}
                    placeholder="Enter your 12 words separated by spaces"
                    required
                    rows={3}
                    className="w-full px-4 py-3 bg-ventsafe-foreground/10 border border-ventsafe-foreground rounded-lg text-ventsafe-foreground text-sm focus:outline-none focus:ring-1 focus:ring-ventsafe-foreground resize-none"
                  />
                  <div className="flex items-center gap-2 mt-3 justify-center">
                    <input
                      type="checkbox"
                      id="rememberMe"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 cursor-pointer"
                      style={{ accentColor: "#000562" }}
                    />
                    <label htmlFor="rememberMe" className="text-sm text-ventsafe-foreground cursor-pointer select-none">
                      Remember me on this device
                    </label>
                  </div>
                </div>
              )}

              {/* PIN Entry */}
              <div className="w-full max-w-xs">
                <label className="block text-sm font-medium text-ventsafe-foreground/80 mb-3 text-center">
                  Enter Your 4-Digit PIN
                </label>
                <div className="flex gap-3 justify-center">
                  {pin.map((digit, i) => (
                    <input
                      key={i}
                      ref={pinRefs[i]}
                      type="password"
                      inputMode="numeric"
                      value={digit}
                      onChange={(e) => handlePinDigit(i, e.target.value)}
                      onKeyDown={(e) => handlePinKeyDown(e, i)}
                      className="w-14 h-14 text-center text-2xl font-bold bg-ventsafe-foreground/10 border-2 border-ventsafe-foreground/30 rounded-xl focus:border-ventsafe-foreground focus:outline-none text-ventsafe-foreground transition-colors"
                    />
                  ))}
                </div>
                {isRecognized && (
                  <p className="text-xs text-ventsafe-foreground/50 text-center mt-2 flex items-center justify-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    PIN decrypts your stored identity locally
                  </p>
                )}
              </div>

              {/* Error */}
              {error && (
                <div className="w-full max-w-xs p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm text-center">{error}</p>
                </div>
              )}

              {/* Login Button */}
              <div className="w-full max-w-xs pt-2">
                <button
                  type="submit"
                  disabled={isLoggingIn || (!isRecognized && !seedPhrase) || pin.some(d => !d)}
                  className="w-full cursor-pointer bg-ventsafe-foreground text-ventsafe-background px-8 py-3 rounded-lg font-medium hover:opacity-90 transition-opacity text-sm disabled:opacity-70"
                >
                  {isLoggingIn ? "Unlocking..." : "Unlock Identity & Log In"}
                </button>
              </div>

              <p className="text-sm text-ventsafe-foreground/70">
                Need a new identity?{" "}
                <Link href="/signup" className="text-ventsafe-navy hover:underline font-medium">
                  Create one
                </Link>
              </p>

              <p className="text-sm text-ventsafe-foreground/70 mt-[-10px]">
                Not a student?{" "}
                <Link href="/login/counsellor" className="text-ventsafe-navy hover:underline font-medium">
                  Counsellor login
                </Link>
              </p>
            </form>
          </motion.div>

        </div>
      </main>

      <Footer />

      {/* Name change prompt for returning users (just confirmation, doesn't actually change anything) */}
      <LogoutModal
        isOpen={showNamePrompt}
        currentName={pendingName}
        onConfirm={() => {
          setShowNamePrompt(false);
          router.push(pendingRedirect || "/vent-space");
        }}
        onCancel={() => {
          setShowNamePrompt(false);
          router.push(pendingRedirect || "/vent-space");
        }}
      />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-ventsafe-background flex items-center justify-center text-ventsafe-foreground">Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}