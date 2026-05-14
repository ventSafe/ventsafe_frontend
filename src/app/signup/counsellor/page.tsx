"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Copy,
  Check,
  ShieldCheck,
  Download,
  ChevronDown,
  BadgeCheck,
  Lock,
} from "lucide-react";
import { Logo } from "@/components/shared/Logo";
import { Footer } from "@/components/shared/Footer";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signup, checkAccountExists } from "@/lib/auth";
import { generateSeedPhrase, deriveKeysFromSeedPhrase, encryptPrivateKey } from "@/lib/blockchain/keys";
import { STORAGE_KEYS, API_BASE_URL } from "@/config/constants";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

const DOWNLOAD_FORMATS = [
  { label: "Text File (.txt)", ext: "txt", mime: "text/plain" },
  { label: "Word Document (.doc)", ext: "doc", mime: "application/msword" },
  {
    label: "Word Document (.docx)",
    ext: "docx",
    mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  },
  { label: "PDF (.pdf)", ext: "pdf", mime: "application/pdf" },
];

type Step = "form" | "pin" | "keys";

// ── Animation variants ─────────────────────────────────────────────────────────
const slideVariants = {
  enter: (dir: number) => ({
    x: dir > 0 ? 80 : -80,
    opacity: 0,
    scale: 0.97,
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
    transition: { type: "spring" as const, stiffness: 300, damping: 30 },
  },
  exit: (dir: number) => ({
    x: dir > 0 ? -80 : 80,
    opacity: 0,
    scale: 0.97,
    transition: { duration: 0.18 },
  }),
};

const stepOrder: Step[] = ["form", "pin", "keys"];

// ── Progress bar ───────────────────────────────────────────────────────────────
function ProgressBar({ step }: { step: Step }) {
  const idx = stepOrder.indexOf(step);
  const pct = ((idx + 1) / stepOrder.length) * 100;
  const labels = ["Details", "Set PIN", "Save Keys"];

  return (
    <div className="w-full mb-10">
      <div className="flex justify-between mb-2">
        {labels.map((label, i) => (
          <motion.span
            key={label}
            animate={{ color: i <= idx ? "#000562" : "#9CA3AF" }}
            className="text-xs font-semibold"
          >
            {i + 1}. {label}
          </motion.span>
        ))}
      </div>
      <div className="h-1.5 w-full bg-ventsafe-foreground/10 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-ventsafe-foreground rounded-full"
          animate={{ width: `${pct}%` }}
          transition={{ type: "spring", stiffness: 120, damping: 20 }}
        />
      </div>
    </div>
  );
}

export default function CounsellorSignupPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("form");
  const [direction, setDirection] = useState(1);

  const [isGenerating, setIsGenerating] = useState(false);
  const [existsInDb, setExistsInDb] = useState(false);

  const [publicKey, setPublicKey] = useState("");
  const [privateKey, setPrivateKey] = useState("");
  const [seedPhrase, setSeedPhrase] = useState("");

  const [copiedPublic, setCopiedPublic] = useState(false);
  const [copiedPrivate, setCopiedPrivate] = useState(false);
  const [copiedSeed, setCopiedSeed] = useState(false);

  const [gender, setGender] = useState<"male" | "female">("male");
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState("");
  const [anonymousName, setAnonymousName] = useState("");
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);

  const [pin, setPin] = useState(["", "", "", ""]);
  const [confirmPin, setConfirmPin] = useState(["", "", "", ""]);
  const [pinError, setPinError] = useState("");

  const pinRefs = [
    useRef<HTMLInputElement>(null!),
    useRef<HTMLInputElement>(null!),
    useRef<HTMLInputElement>(null!),
    useRef<HTMLInputElement>(null!),
  ];
  const confirmPinRefs = [
    useRef<HTMLInputElement>(null!),
    useRef<HTMLInputElement>(null!),
    useRef<HTMLInputElement>(null!),
    useRef<HTMLInputElement>(null!),
  ];
  const downloadMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        downloadMenuRef.current &&
        !downloadMenuRef.current.contains(e.target as Node)
      )
        setShowDownloadMenu(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Restore state on reload
  useEffect(() => {
    const savedPublicKey = localStorage.getItem("ventsafe-counsellor-public-key");
    const savedPrivateKey = localStorage.getItem("ventsafe-counsellor-private-key");
    const savedName = localStorage.getItem("ventsafe-counsellor-anon-name");
    const savedGender = localStorage.getItem("ventsafe-counsellor-gender") as "male" | "female" | null;
    const alreadyPinned = !!localStorage.getItem("ventsafe-counsellor-encrypted-key");

    setAgreeToTerms(localStorage.getItem("ventsafe-counsellor-agreed") === "true");

    if (savedPublicKey && savedPrivateKey) {
      setPublicKey(savedPublicKey);
      setPrivateKey(savedPrivateKey);
      setAnonymousName(savedName || "");
      if (savedGender) setGender(savedGender);

      if (alreadyPinned) {
        setStep("form");
      }

      // Verify if this key actually belongs to a DB user
      checkAccountExists(savedPublicKey).then((res) => {
        if (res?.exists) setExistsInDb(true);
      });
    }
  }, []);

  const goTo = (next: Step) => {
    const curr = stepOrder.indexOf(step);
    const nxt = stepOrder.indexOf(next);
    setDirection(nxt > curr ? 1 : -1);
    setStep(next);
  };

  const deleteOldAccount = useCallback(async () => {
    const oldToken = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    if (oldToken) {
      try {
        await fetch(`${API_BASE}/auth/account`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${oldToken}` },
        });
      } catch {
        /* best-effort */
      }
    }
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER_DATA);
    localStorage.removeItem("ventsafe-counsellor-public-key");
    localStorage.removeItem("ventsafe-counsellor-private-key");
    localStorage.removeItem("ventsafe-counsellor-anon-name");
    localStorage.removeItem("ventsafe-counsellor-encrypted-key");
  }, []);

  const handleNextToPin = () => {
    if (!agreeToTerms) {
      setError("Please agree to the terms of service first.");
      return;
    }
    setError("");
    goTo("pin");
  };

  const handleGenerateKeyPair = async (isRegen = false) => {
    const pinStr = pin.join("");
    const confirmStr = confirmPin.join("");
    if (!isRegen) {
      if (pinStr.length < 4) {
        setPinError("Please enter all 4 digits.");
        return;
      }
      if (pinStr !== confirmStr) {
        setPinError("PINs don't match. Try again.");
        return;
      }
    }

    setPinError("");
    setIsGenerating(true);

    try {
      if (isRegen) await deleteOldAccount();

      // 1. Generate Mnemonic & Keys locally
      const phrase = generateSeedPhrase();
      const derived = deriveKeysFromSeedPhrase(phrase, pinStr);

      // 2. Encrypt private key with PIN if "Remember Me" is checked
      if (rememberMe) {
        const encrypted = await encryptPrivateKey(derived.privateKey, pinStr);
        localStorage.setItem("ventsafe-counsellor-encrypted-key", encrypted);
      } else {
        localStorage.removeItem("ventsafe-counsellor-encrypted-key");
      }

      // 3. Call backend signup
      const result = await signup({
        gender,
        agreeToTerms: true,
        publicKey: derived.publicKey,
        role: "counsellor_pending",
      } as any);

      if (result.success && result.data) {
        const newName = result.data.anonymousName || "";

        setPublicKey(derived.publicKey);
        setPrivateKey(derived.privateKey);
        setSeedPhrase(phrase);
        setAnonymousName(newName);

        localStorage.setItem("ventsafe-counsellor-public-key", derived.publicKey);
        if (!rememberMe) {
          localStorage.setItem("ventsafe-counsellor-private-key", derived.privateKey);
        }
        localStorage.setItem("ventsafe-counsellor-anon-name", newName);
        localStorage.setItem("ventsafe-counsellor-gender", gender);

        const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
        if (token) {
          await fetch(`${API_BASE_URL}/auth/pin-confirmed`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
          }).catch(() => { });
        }

        goTo("keys");
      } else {
        setPinError(result.error || "Failed to generate keys. Please try again.");
      }
    } catch {
      setPinError("Something went wrong. Make sure the backend server is running.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePinDigit = (
    index: number,
    value: string,
    pinArr: string[],
    setPinArr: (v: string[]) => void,
    refs: React.RefObject<HTMLInputElement | null>[],
  ) => {
    if (!value) {
      const updated = [...pinArr];
      updated[index] = "";
      setPinArr(updated);
      return;
    }
    const digits = value.replace(/\D/g, "");
    if (!digits) return;

    const updated = [...pinArr];
    if (digits.length > 1) {
      for (let i = 0; i < digits.length && index + i < 4; i++) {
        updated[index + i] = digits[i];
      }
      setPinArr(updated);
      const nextIndex = Math.min(index + digits.length, 3);
      refs[nextIndex].current?.focus();
      return;
    }

    updated[index] = digits.slice(-1);
    setPinArr(updated);
    if (index < 3) refs[index + 1].current?.focus();
  };

  const handlePinKeyDown = (
    e: React.KeyboardEvent,
    index: number,
    pinArr: string[],
    refs: React.RefObject<HTMLInputElement | null>[],
  ) => {
    if (e.key === "Backspace" && !pinArr[index] && index > 0)
      refs[index - 1].current?.focus();
  };

  const copyToClipboard = (text: string, type: "public" | "private" | "seed") => {
    navigator.clipboard.writeText(text);
    if (type === "public") {
      setCopiedPublic(true);
      setTimeout(() => setCopiedPublic(false), 2000);
    } else if (type === "private") {
      setCopiedPrivate(true);
      setTimeout(() => setCopiedPrivate(false), 2000);
    } else {
      setCopiedSeed(true);
      setTimeout(() => setCopiedSeed(false), 2000);
    }
  };

  const handleDownload = (format: (typeof DOWNLOAD_FORMATS)[0]) => {
    setShowDownloadMenu(false);
    const content = `VENTSAFE COUNSELLOR KEYS\n================================\nKEEP THIS SAFE. DO NOT SHARE WITH ANYONE.\n\nYour Anonymous Name: ${anonymousName}\nYour Gender: ${gender}\nRole: Counsellor\n\n-----SEED PHRASE (BIP39)-----\n${seedPhrase}\n-----------------------------\n\n-----BEGIN PRIVATE KEY-----\n${privateKey}\n-----END PRIVATE KEY-----\n\nYour Public Key (safe to share):\n${publicKey}\n\nGenerated: ${new Date().toLocaleString()}`;
    if (format.ext === "pdf") {
      const w = window.open("", "_blank");
      if (w) {
        w.document.write(
          `<html><head><title>VentSafe Counsellor Key</title><style>body{font-family:Arial,sans-serif;padding:40px;color:#000562;}h1{color:#000562;border-bottom:2px solid #000562;padding-bottom:10px;}.warning{background:#fff3cd;border:1px solid #ffc107;padding:15px;border-radius:8px;margin:20px 0;}.key-box{background:#eff0ff;border:1px solid #000562;padding:15px;border-radius:8px;font-family:monospace;font-size:11px;word-break:break-all;margin:10px 0;}.label{font-weight:bold;color:#000562;margin-top:15px;}</style></head><body><h1>VentSafe — Counsellor Keys</h1><div class="warning">WARNING: Keep your seed phrase and private key safe. DO NOT SHARE!</div><div class="label">Anonymous Name:</div><p>${anonymousName}</p><div class="label">Your 12-Word Seed Phrase (KEEP SECRET):</div><div class="key-box">${seedPhrase}</div><div class="label">Private Key (KEEP SECRET):</div><div class="key-box">${privateKey.replace(/\n/g, "<br>")}</div><div class="label">Public Key:</div><div class="key-box">${publicKey.replace(/\n/g, "<br>")}</div><p style="color:#666;font-size:12px;">Generated: ${new Date().toLocaleString()}</p></body></html>`,
        );
        w.document.close();
        w.print();
      }
      return;
    }
    const blob = new Blob([content], { type: format.mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ventsafe-counsellor-key.${format.ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-ventsafe-background flex flex-col">
      <header className="p-6 md:pl-25 flex items-center justify-center md:justify-start">
        <Logo />
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-xl">
          {/* Header badge */}
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex justify-center mb-6"
          >
            <div className="flex items-center gap-2 bg-ventsafe-foreground/8 border border-ventsafe-foreground/20 rounded-full px-4 py-1.5">
              <BadgeCheck className="w-4 h-4 text-ventsafe-foreground" />
              <span className="text-xs font-semibold text-ventsafe-foreground tracking-wide">
                Counsellor Registration
              </span>
            </div>
          </motion.div>

          <ProgressBar step={step} />

          <AnimatePresence mode="wait" custom={direction}>
            {/* ── STEP 1: FORM ── */}
            {step === "form" && (
              <motion.div
                key="form"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
              >
                <div className="text-center mb-8">
                  {/* Animated shield icon */}
                  <motion.div
                    initial={{ scale: 0, rotate: -20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{
                      type: "spring",
                      stiffness: 260,
                      damping: 20,
                      delay: 0.1,
                    }}
                    className="w-16 h-16 rounded-2xl bg-ventsafe-foreground flex items-center justify-center mx-auto mb-5 shadow-lg shadow-ventsafe-foreground/20"
                  >
                    <ShieldCheck className="w-8 h-8 text-white" />
                  </motion.div>

                  <motion.h1
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-ventsafe-sub-heading font-bold text-ventsafe-foreground mb-3"
                  >
                    {existsInDb ? "Welcome back" : "Join as a Counsellor"}
                  </motion.h1>

                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    className="text-sm text-ventsafe-foreground/70 max-w-sm mx-auto"
                  >
                    Your identity stays completely anonymous. Only your tier
                    badge is visible to students — never your real name or
                    email.
                  </motion.p>
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="flex flex-col items-center gap-5 mb-6"
                >
                  {/* Gender */}
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-xs text-ventsafe-foreground/50 font-medium uppercase tracking-wider">
                      Your gender
                    </span>
                    <div className="flex gap-3">
                      {(["male", "female"] as const).map((g) => (
                        <motion.button
                          key={g}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setGender(g)}
                          className={`px-7 py-2 rounded-full text-sm font-semibold border transition-all cursor-pointer capitalize ${gender === g
                              ? "bg-ventsafe-foreground text-white border-ventsafe-foreground shadow-md shadow-ventsafe-foreground/20"
                              : "bg-transparent text-ventsafe-foreground border-ventsafe-foreground/30 hover:border-ventsafe-foreground"
                            }`}
                        >
                          {g}
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {/* Terms */}
                  <div className="flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      id="agreeToTerms"
                      checked={agreeToTerms}
                      onChange={(e) => {
                        setAgreeToTerms(e.target.checked);
                        localStorage.setItem(
                          "ventsafe-counsellor-agreed",
                          String(e.target.checked),
                        );
                      }}
                      className="w-4 h-4 cursor-pointer"
                      style={{ accentColor: "#000562" }}
                    />
                    <label
                      htmlFor="agreeToTerms"
                      className="text-sm text-ventsafe-foreground/80"
                    >
                      I agree to the{" "}
                      <Link
                        href="/terms"
                        className="text-ventsafe-foreground hover:underline font-semibold"
                      >
                        Terms of Service
                      </Link>{" "}
                      and{" "}
                      <Link
                        href="/counsellor-guidelines"
                        className="text-ventsafe-foreground hover:underline font-semibold"
                      >
                        Counsellor Guidelines
                      </Link>
                    </label>
                  </div>

                  {error && (
                    <motion.p
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-red-500 text-sm text-center bg-red-50 border border-red-200 rounded-lg px-4 py-2 w-full"
                    >
                      {error}
                    </motion.p>
                  )}
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                  className="flex justify-center"
                >
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => {
                      if (existsInDb) {
                        router.push("/login/counsellor");
                      } else {
                        handleNextToPin();
                      }
                    }}
                    className="bg-ventsafe-foreground text-white px-10 py-3 rounded-full font-semibold hover:opacity-90 transition-opacity text-ventsafe-st cursor-pointer shadow-lg shadow-ventsafe-foreground/25"
                  >
                    {existsInDb ? "Log in to my Account" : "Next — Set PIN"}
                  </motion.button>
                </motion.div>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-center text-xs text-ventsafe-foreground/40 mt-4"
                >
                  Already have keys?{" "}
                  <Link
                    href="/login/counsellor"
                    className="text-ventsafe-foreground/60 hover:text-ventsafe-foreground underline"
                  >
                    Log in here
                  </Link>
                </motion.p>
              </motion.div>
            )}

            {/* ── STEP 2: PIN ── */}
            {step === "pin" && (
              <motion.div
                key="pin"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="flex flex-col items-center gap-6 mx-auto w-full max-w-[24rem]"
              >
                <div className="text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{
                      type: "spring",
                      stiffness: 260,
                      damping: 18,
                      delay: 0.1,
                    }}
                    className="w-14 h-14 rounded-full bg-ventsafe-foreground/10 border-2 border-ventsafe-foreground flex items-center justify-center mx-auto mb-4"
                  >
                    <Lock className="w-6 h-6 text-ventsafe-foreground" />
                  </motion.div>
                  <h2 className="text-xl font-bold text-ventsafe-foreground mb-2">
                    Set Your 4-Digit PIN
                  </h2>
                  <p className="text-sm text-ventsafe-foreground/60">
                    Your identity is derived using this PIN. You'll need it every time you log in.
                  </p>
                </div>

                {/* PIN inputs */}
                {[
                  {
                    label: "Enter PIN",
                    arr: pin,
                    setArr: setPin,
                    refs: pinRefs,
                  },
                  {
                    label: "Confirm PIN",
                    arr: confirmPin,
                    setArr: setConfirmPin,
                    refs: confirmPinRefs,
                  },
                ].map(({ label, arr, setArr, refs }, groupIdx) => (
                  <motion.div
                    key={label}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 + groupIdx * 0.08 }}
                    className="w-full"
                  >
                    <label className="block text-sm font-medium text-ventsafe-foreground/80 mb-3 text-center">
                      {label}
                    </label>
                    <div className="flex gap-3 justify-center">
                      {arr.map((digit, i) => (
                        <motion.input
                          key={i}
                          ref={refs[i]}
                          whileFocus={{ scale: 1.08, borderColor: "#000562" }}
                          type="password"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={(e) =>
                            handlePinDigit(i, e.target.value, arr, setArr, refs)
                          }
                          onKeyDown={(e) => handlePinKeyDown(e, i, arr, refs)}
                          className="w-14 h-14 text-center text-2xl font-bold bg-ventsafe-foreground/8 border-2 border-ventsafe-foreground/25 rounded-xl focus:border-ventsafe-foreground focus:outline-none text-ventsafe-foreground transition-all"
                        />
                      ))}
                    </div>
                  </motion.div>
                ))}

                <AnimatePresence>
                  {confirmPin.every((d) => d) && (
                    <motion.div
                      key={pin.join("") === confirmPin.join("") ? "match" : "mismatch"}
                      initial={{ opacity: 0, y: -6, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.95 }}
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                      className={`flex items-center justify-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-lg w-full ${
                        pin.join("") === confirmPin.join("")
                          ? "text-green-700 bg-green-50 border border-green-200"
                          : "text-red-600 bg-red-50 border border-red-200"
                      }`}
                    >
                      {pin.join("") === confirmPin.join("") ? (
                        <>
                          <Check className="w-4 h-4" />
                          PINs match
                        </>
                      ) : (
                        <>
                          <span className="font-bold">✗</span>
                          PINs don&apos;t match
                        </>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="w-full flex items-center justify-center gap-2 mt-2">
                  <input
                    type="checkbox"
                    id="rememberMe"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 cursor-pointer"
                    style={{ accentColor: "#000562" }}
                  />
                  <label htmlFor="rememberMe" className="text-sm text-ventsafe-foreground/80 cursor-pointer select-none">
                    Remember me on this device
                  </label>
                </div>

                {pinError && (
                  <motion.p
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-red-500 text-sm text-center"
                  >
                    {pinError}
                  </motion.p>
                )}

                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleGenerateKeyPair(false)}
                  disabled={isGenerating}
                  className="w-full bg-ventsafe-foreground text-white px-8 py-3 rounded-ventsafe-sm font-semibold hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-70 shadow-md shadow-ventsafe-foreground/20 mt-2"
                >
                  {isGenerating ? "Generating Identity..." : "Generate Identity"}
                </motion.button>

                <button
                  onClick={() => goTo("form")}
                  className="text-sm text-ventsafe-foreground/50 hover:text-ventsafe-foreground cursor-pointer transition-colors"
                >
                  ← Back
                </button>
              </motion.div>
            )}

            {/* ── STEP 3: KEYS ── */}
            {step === "keys" && (
              <motion.div
                key="keys"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="space-y-6 flex flex-col items-center mx-auto w-full max-w-[28rem]"
              >
                <div className="text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{
                      type: "spring",
                      stiffness: 260,
                      damping: 18,
                      delay: 0.1,
                    }}
                    className="w-12 h-12 rounded-full bg-green-100 border-2 border-green-500 flex items-center justify-center mx-auto mb-4"
                  >
                    <Check className="w-6 h-6 text-green-600" />
                  </motion.div>
                  <h2 className="text-2xl font-bold text-ventsafe-foreground mb-2">
                    Identity Generated
                  </h2>
                  {anonymousName && (
                    <motion.p
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="text-sm text-ventsafe-foreground/70"
                    >
                      Welcome,{" "}
                      <span className="font-bold text-ventsafe-foreground text-base">
                        {anonymousName}
                      </span>
                    </motion.p>
                  )}
                </div>

                {/* Seed Phrase */}
                <div className="w-full bg-[#f8f9fa] border border-[#e9ecef] rounded-xl p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-bold text-ventsafe-foreground">
                      Your 12-Word Seed Phrase
                    </label>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(seedPhrase, "seed")}
                      className="flex items-center gap-1.5 text-xs font-medium text-ventsafe-foreground/70 hover:text-ventsafe-foreground transition-colors cursor-pointer"
                    >
                      {copiedSeed ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedSeed ? "Copied" : "Copy"}
                    </button>
                  </div>
                  <p className="text-xs text-ventsafe-foreground/60 mb-4">
                    Write these down and keep them safe. You can use this phrase with your PIN to recover your account on any device.
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {seedPhrase.split(" ").map((word, i) => (
                      <div key={i} className="flex items-center bg-white border border-ventsafe-border/50 rounded-md px-2 py-1.5">
                        <span className="text-ventsafe-foreground/40 text-[10px] w-4 font-mono">{i + 1}.</span>
                        <span className="text-sm font-medium text-ventsafe-foreground flex-1 text-center">{word}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Download Menu */}
                <div className="w-full flex justify-center mt-2 relative" ref={downloadMenuRef}>
                  <button
                    onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                    className="flex items-center gap-2 text-sm text-ventsafe-foreground border border-ventsafe-foreground/30 px-5 py-2.5 rounded-lg hover:bg-ventsafe-foreground/10 transition-colors cursor-pointer w-full justify-center"
                  >
                    <Download className="w-4 h-4" />
                    Download Recovery Kit
                    <ChevronDown className={`w-4 h-4 transition-transform ${showDownloadMenu ? "rotate-180" : ""}`} />
                  </button>
                  <AnimatePresence>
                    {showDownloadMenu && (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="absolute bottom-full left-0 mb-1 w-full bg-white border border-ventsafe-border rounded-lg shadow-lg z-50 overflow-hidden"
                      >
                        {DOWNLOAD_FORMATS.map((format) => (
                          <button
                            key={format.ext}
                            onClick={() => handleDownload(format)}
                            className="w-full text-left px-4 py-2.5 text-sm text-ventsafe-foreground hover:bg-ventsafe-background transition-colors cursor-pointer border-b border-ventsafe-border/30 last:border-0"
                          >
                            {format.label}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="pt-4 w-full">
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => router.push("/onboarding/counsellor")}
                    className="w-full flex items-center justify-center gap-2 bg-ventsafe-foreground text-white px-8 py-3.5 rounded-ventsafe-sm font-semibold hover:opacity-90 transition-opacity cursor-pointer shadow-md shadow-ventsafe-foreground/20"
                  >
                    <BadgeCheck className="w-5 h-5" />
                    I've Saved My Keys — Continue
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <div className="mt-12">
        <Footer />
      </div>
    </div>
  );
}
