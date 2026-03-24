"use client";

import { useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { LogoutModal } from "@/components/shared/LogoutModal";
import { motion } from "framer-motion";
import { Logo } from "@/components/shared/Logo";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Footer } from "@/components/shared/Footer";
import { login } from "@/lib/auth";
import { useAuthStore } from "@/store/useAuthStore";
import { decryptPrivateKey, encryptPrivateKey, getStoredEncryptedPrivateKey } from "@/lib/blockchain/keys";
import { API_BASE_URL, STORAGE_KEYS } from "@/config/constants";
import { ShieldCheck } from "lucide-react";

export default function CounsellorLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect");
  const { setUser } = useAuthStore();
  const [showFields, setShowFields] = useState(false);
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [publicKey, setPublicKey] = useState("");
  const [privateKey, setPrivateKey] = useState("");
  const [pin, setPin] = useState(["", "", "", ""]);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState("");
  const [showForgotPin, setShowForgotPin] = useState(false);
  const [newPin, setNewPin] = useState(["", "", "", ""]);
  const [confirmNewPin, setConfirmNewPin] = useState(["", "", "", ""]);
  const [pinResetError, setPinResetError] = useState("");
  const [pinResetSuccess, setPinResetSuccess] = useState(false);
  const [isResettingPin, setIsResettingPin] = useState(false);

  // Name change prompt state
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const [pendingRedirect, setPendingRedirect] = useState("");
  const [pendingGender, setPendingGender] = useState<"male" | "female">("male");
  const [pendingName, setPendingName] = useState("");
  const newPinRefs = [useRef<HTMLInputElement>(null!), useRef<HTMLInputElement>(null!), useRef<HTMLInputElement>(null!), useRef<HTMLInputElement>(null!)];
  const confirmNewPinRefs = [useRef<HTMLInputElement>(null!), useRef<HTMLInputElement>(null!), useRef<HTMLInputElement>(null!), useRef<HTMLInputElement>(null!)];
  const pinRefs = [
    useRef<HTMLInputElement>(null!),
    useRef<HTMLInputElement>(null!),
    useRef<HTMLInputElement>(null!),
    useRef<HTMLInputElement>(null!),
  ];

  const handlePinDigit = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const updated = [...pin];
    updated[index] = value.slice(-1);
    setPin(updated);
    if (value && index < 3) pinRefs[index + 1].current?.focus();
  };

  const handlePinKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "Backspace" && !pin[index] && index > 0) {
      pinRefs[index - 1].current?.focus();
    }
  };

  const handlePinDigitNew = (index: number, value: string, arr: string[], setArr: (v: string[]) => void, refs: React.RefObject<HTMLInputElement | null>[]) => {
    if (!/^\d*$/.test(value)) return;
    const updated = [...arr];
    updated[index] = value.slice(-1);
    setArr(updated);
    if (value && index < 3) refs[index + 1].current?.focus();
  };

  const handleResetPin = async () => {
    const newPinStr = newPin.join("");
    const confirmStr = confirmNewPin.join("");
    if (newPinStr.length < 4) { setPinResetError("Please enter all 4 digits."); return; }
    if (newPinStr !== confirmStr) { setPinResetError("PINs don\'t match."); return; }
    if (!privateKey.trim()) { setPinResetError("Please paste your private key first."); return; }

    setPinResetError("");
    setIsResettingPin(true);

    try {
      // Verify keys against backend first
      const res = await fetch(`${API_BASE_URL}/auth/verify-keys`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publicKey: publicKey.trim(), privateKey: privateKey.trim() }),
      });
      const data = await res.json();

      if (!data.success || !data.data?.valid) {
        setPinResetError("Key pair invalid. Please check your keys.");
        setIsResettingPin(false);
        return;
      }

      // Re-encrypt private key with new PIN
      // Save to the correct storage — counsellor or student
      const encrypted = await encryptPrivateKey(privateKey.trim(), newPinStr);
      const isCounsellor = !!localStorage.getItem("ventsafe-counsellor-encrypted-key");
      if (isCounsellor) {
        localStorage.setItem("ventsafe-counsellor-encrypted-key", encrypted);
      } else {
        localStorage.setItem(STORAGE_KEYS.ENCRYPTED_PRIVATE_KEY, encrypted);
      }

      setPinResetSuccess(true);
      setNewPin(["", "", "", ""]);
      setConfirmNewPin(["", "", "", ""]);
      setTimeout(() => { setShowForgotPin(false); setPinResetSuccess(false); }, 2000);
    } catch (err) {
      setPinResetError("Something went wrong. Please try again.");
    } finally {
      setIsResettingPin(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const pinStr = pin.join("");
    if (pinStr.length < 4) {
      setError("Please enter your 4-digit PIN.");
      return;
    }

    setIsLoggingIn(true);

    try {
      // Step 1: Try to decrypt stored private key with PIN (if available)
      // If user pasted their private key manually, use that directly
      let keyToUse = privateKey.trim();

      if (!keyToUse) {
        // No manually pasted key — try decrypting from localStorage
        // Check both student and counsellor encrypted key storage
        // Counsellor login — only read counsellor encrypted key
        const encryptedKey = localStorage.getItem("ventsafe-counsellor-encrypted-key");

        if (!encryptedKey) {
          setError("No stored key found. Please paste your private key.");
          setIsLoggingIn(false);
          return;
        }
        try {
          keyToUse = await decryptPrivateKey(encryptedKey, pinStr);
        } catch {
          setError("Wrong PIN. Please try again.");
          setIsLoggingIn(false);
          return;
        }
      }

      // Step 2: Login with public key + decrypted private key
      const result = await login({ publicKey: publicKey.trim(), privateKey: keyToUse });

      if (result.success && result.data) {
        // result.data is the spread user object — fields are directly on it
        const user = result.data as any;
        const isNewUser = user?.isNewUser;

        // Always update stored names on login
        localStorage.removeItem("ventsafe-anon-name");
        localStorage.removeItem("ventsafe-counsellor-anon-name");
        if (user?.anonymousName) {
          localStorage.setItem("ventsafe-anon-name", user.anonymousName);
          localStorage.setItem("ventsafe-counsellor-anon-name", user.anonymousName);
        }

        // Update auth store immediately
        setUser(user);

        // Cross-role check — counsellor login page should not accept student keys
        if (user?.role === "student") {
          setError("These keys belong to a student account. Please use the student login page.");
          setIsLoggingIn(false);
          return;
        }

        // counsellor_pending → go to onboarding status
        if (user?.role === "counsellor_pending") {
          router.push("/onboarding/counsellor/status");
          return;
        }

        // Determine destination
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
          // Returning counsellor — show name change prompt
          setPendingRedirect(destination);
          setPendingGender((user?.gender as "male" | "female") || "male");
          setPendingName(user?.anonymousName || "");
          setShowNamePrompt(true);
        }
      } else {
        setError(result.error || "Login failed. Please check your keys and try again.");
      }
    } catch (err) {
      setError("Something went wrong. Make sure the backend server is running.");
    } finally {
      setIsLoggingIn(false);
      // Clear PIN from memory
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

          {/* Title */}
          <motion.div
            animate={{ y: showFields ? -5 : 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="text-center mb-8"
          >
            <h1 className="text-4xl font-bold text-ventsafe-foreground mb-3">
              Counsellor Login
            </h1>
            <p className="text-sm text-ventsafe-foreground/80">
              Enter your counsellor keys + PIN to continue.
            </p>
          </motion.div>

          {/* Login Form */}
          {showFields && (
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 300, damping: 30 }}>
              <form onSubmit={handleLogin} className="space-y-5 flex flex-col items-center">

                {/* Public Key */}
                <div className="w-80">
                  <label className="block text-sm font-medium text-ventsafe-foreground/80 mb-1.5">
                    Public Key
                  </label>
                  <input
                    type="text"
                    value={publicKey}
                    onChange={(e) => setPublicKey(e.target.value)}
                    placeholder="Paste your public key"
                    required
                    className="w-full px-4 py-3 bg-ventsafe-foreground/10 border border-ventsafe-foreground rounded-lg text-ventsafe-foreground text-sm focus:outline-none focus:ring-1 focus:ring-ventsafe-foreground"
                  />
                  {publicKey.length > 50 && (
                    <p className="mt-1 text-xs text-ventsafe-foreground/50 truncate">
                      {publicKey.substring(0, 32)}...{publicKey.slice(-16)}
                    </p>
                  )}
                </div>

                {/* Private Key */}
                <div className="w-80">
                  <label className="block text-sm font-medium text-ventsafe-foreground/80 mb-1.5">
                    Private Key
                  </label>
                  <input
                    type={showPrivateKey ? "text" : "password"}
                    value={privateKey}
                    onChange={(e) => setPrivateKey(e.target.value)}
                    placeholder="Paste your private key"
                    required
                    className="w-full px-4 py-3 bg-ventsafe-foreground/10 border border-ventsafe-foreground rounded-lg text-ventsafe-foreground text-sm focus:outline-none focus:ring-1 focus:ring-ventsafe-foreground"
                  />
                  {/* Checkbox to show private key */}
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="checkbox"
                      id="showPrivateKey"
                      checked={showPrivateKey}
                      onChange={(e) => setShowPrivateKey(e.target.checked)}
                      className="w-4 h-4 cursor-pointer"
                      style={{ accentColor: "#1e28a0" }}
                    />
                    <label htmlFor="showPrivateKey" className="text-sm text-ventsafe-foreground cursor-pointer">
                      Show Private Key
                    </label>
                  </div>
                </div>

                {/* PIN Entry */}
                <div className="w-80">
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
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handlePinDigit(i, e.target.value)}
                        onKeyDown={(e) => handlePinKeyDown(e, i)}
                        className="w-14 h-14 text-center text-2xl font-bold bg-ventsafe-foreground/10 border-2 border-ventsafe-foreground/30 rounded-xl focus:border-ventsafe-foreground focus:outline-none text-ventsafe-foreground transition-colors"
                      />
                    ))}
                  </div>
                  <p className="text-xs text-ventsafe-foreground/50 text-center mt-2 flex items-center justify-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    PIN decrypts your stored key locally — never sent to server
                  </p>
                </div>

                {/* Forgot PIN link */}
                <div className="w-80 text-right">
                  <button type="button" onClick={() => setShowForgotPin(true)} className="text-xs text-ventsafe-foreground/50 hover:text-ventsafe-foreground cursor-pointer underline">
                    Forgot PIN?
                  </button>
                </div>

                {/* Forgot PIN modal */}
                {showForgotPin && (
                  <div className="w-80 p-4 bg-white border border-ventsafe-foreground/20 rounded-xl shadow-lg space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-ventsafe-foreground">Reset Your PIN</h3>
                      <button onClick={() => { setShowForgotPin(false); setPinResetError(""); }} className="text-ventsafe-foreground/40 hover:text-ventsafe-foreground cursor-pointer text-lg leading-none">×</button>
                    </div>
                    <p className="text-xs text-ventsafe-foreground/60">Paste both keys above, then set a new PIN below. Your keys will be re-encrypted.</p>

                    <div>
                      <label className="block text-xs font-medium text-ventsafe-foreground/70 mb-2 text-center">New PIN</label>
                      <div className="flex gap-2 justify-center">
                        {newPin.map((d, i) => (
                          <input key={i} ref={newPinRefs[i]} type="password" inputMode="numeric" maxLength={1} value={d}
                            onChange={(e) => handlePinDigitNew(i, e.target.value, newPin, setNewPin, newPinRefs)}
                            onKeyDown={(e) => { if (e.key === "Backspace" && !newPin[i] && i > 0) newPinRefs[i-1].current?.focus(); }}
                            className="w-11 h-11 text-center text-xl font-bold bg-ventsafe-foreground/10 border-2 border-ventsafe-foreground/30 rounded-lg focus:border-ventsafe-foreground focus:outline-none text-ventsafe-foreground" />
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-ventsafe-foreground/70 mb-2 text-center">Confirm New PIN</label>
                      <div className="flex gap-2 justify-center">
                        {confirmNewPin.map((d, i) => (
                          <input key={i} ref={confirmNewPinRefs[i]} type="password" inputMode="numeric" maxLength={1} value={d}
                            onChange={(e) => handlePinDigitNew(i, e.target.value, confirmNewPin, setConfirmNewPin, confirmNewPinRefs)}
                            onKeyDown={(e) => { if (e.key === "Backspace" && !confirmNewPin[i] && i > 0) confirmNewPinRefs[i-1].current?.focus(); }}
                            className="w-11 h-11 text-center text-xl font-bold bg-ventsafe-foreground/10 border-2 border-ventsafe-foreground/30 rounded-lg focus:border-ventsafe-foreground focus:outline-none text-ventsafe-foreground" />
                        ))}
                      </div>
                    </div>

                    {pinResetError && <p className="text-red-500 text-xs text-center">{pinResetError}</p>}
                    {pinResetSuccess && <p className="text-green-600 text-xs text-center font-medium">✓ PIN updated successfully!</p>}

                    <button onClick={handleResetPin} disabled={isResettingPin}
                      className="w-full bg-ventsafe-foreground text-white py-2.5 rounded-lg text-sm font-medium hover:opacity-90 cursor-pointer disabled:opacity-60">
                      {isResettingPin ? "Saving..." : "Save New PIN"}
                    </button>
                  </div>
                )}

                {/* Error */}
                {error && (
                  <div className="w-80 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-600 text-sm text-center">{error}</p>
                  </div>
                )}

                {/* Login Button */}
                <div className="w-80 pt-1">
                  <button
                    type="submit"
                    disabled={isLoggingIn || !publicKey || !privateKey || pin.some(d => !d)}
                    className="w-full cursor-pointer bg-ventsafe-foreground text-ventsafe-background px-8 py-3 rounded-lg font-medium hover:opacity-90 transition-opacity text-sm disabled:opacity-70"
                  >
                    {isLoggingIn ? "Verifying..." : "Log In"}
                  </button>
                </div>

                <p className="text-sm text-ventsafe-foreground/70">
                  Not a counsellor?{" "}
                  <Link href="/login" className="text-ventsafe-navy hover:underline font-medium">
                    Student login
                  </Link>
                </p>
              </form>
            </motion.div>
          )}

          {/* Continue Button */}
          {!showFields && (
            <motion.div className="flex justify-center">
              <button
                onClick={() => setShowFields(true)}
                className="bg-ventsafe-foreground text-ventsafe-background px-10 py-3 rounded-full font-medium hover:opacity-90 transition-opacity text-sm cursor-pointer"
              >
                Continue
              </button>
            </motion.div>
          )}
        </div>
      </main>

      <Footer />

      <LogoutModal
        isOpen={showNamePrompt}
        currentName={pendingName}
        gender={pendingGender}
        onConfirm={() => {
          setShowNamePrompt(false);
          router.push(pendingRedirect || "/vent-space");
        }}
        onCancel={() => {
          setShowNamePrompt(false);
          router.push(pendingRedirect || "/vent-space");
        }}
        mode="login"
      />
    </div>
  );
}