"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Copy,
  Check,
  ShieldCheck,
  Download,
  ChevronDown,
  RefreshCw,
} from "lucide-react";
import { Logo } from "@/components/shared/Logo";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { Footer } from "@/components/shared/Footer";
import Link from "next/link";
import { signup, checkAccountExists } from "@/lib/auth";
import { generateSeedPhrase, deriveKeysFromSeedPhrase, encryptPrivateKey } from "@/lib/blockchain/keys";
import { useRouter } from "next/navigation";
import { STORAGE_KEYS, API_BASE_URL } from "@/config/constants";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

const DOWNLOAD_FORMATS = [
  { label: "Text File (.txt)", ext: "txt", mime: "text/plain" },
  { label: "PDF (.pdf)", ext: "pdf", mime: "application/pdf" },
];

type Step = "form" | "pin" | "keys";

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("form");
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
    const savedGender = localStorage.getItem("ventsafe-signup-gender") as "male" | "female" | null;
    setAgreeToTerms(localStorage.getItem("ventsafe-signup-agreed") === "true");
    if (savedGender) setGender(savedGender);
  }, []);

  const handleNextToPin = () => {
    if (!agreeToTerms) {
      setError("Please agree to the terms of service first.");
      return;
    }
    setError("");
    setStep("pin");
  };

  const handleGenerateKeyPair = async () => {
    const pinStr = pin.join("");
    const confirmStr = confirmPin.join("");

    if (pinStr.length < 4) {
      setPinError("Please enter all 4 digits.");
      return;
    }
    if (pinStr !== confirmStr) {
      setPinError("PINs don't match. Try again.");
      return;
    }

    setPinError("");
    setIsGenerating(true);

    try {
      // 1. Generate Mnemonic & Keys locally
      const phrase = generateSeedPhrase();
      const derived = deriveKeysFromSeedPhrase(phrase, pinStr);

      // 2. Encrypt private key with PIN if "Remember Me" is checked
      if (rememberMe) {
        const encrypted = await encryptPrivateKey(derived.privateKey, pinStr);
        localStorage.setItem(STORAGE_KEYS.ENCRYPTED_PRIVATE_KEY, encrypted);
      } else {
        localStorage.removeItem(STORAGE_KEYS.ENCRYPTED_PRIVATE_KEY);
      }

      // 3. Call backend signup
      const result = await signup({
        gender,
        agreeToTerms: true,
        publicKey: derived.publicKey,
      });

      if (result.success && result.data) {
        const newName = result.data.anonymousName || "";

        setPublicKey(derived.publicKey);
        setPrivateKey(derived.privateKey);
        setSeedPhrase(phrase);
        setAnonymousName(newName);

        // Tell DB the PIN is set
        const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
        if (token) {
          await fetch(`${API_BASE_URL}/auth/pin-confirmed`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
          });
        }

        setStep("keys");
      } else {
        setPinError(result.error || "Failed to create account. Please try again.");
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
      if (nextIndex < 4 && digits.length < 4) {
        refs[nextIndex].current?.focus();
      } else {
        refs[3].current?.focus();
      }
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
    const content = `VENTSAFE KEYS\n====================\nKEEP THIS SAFE. DO NOT SHARE WITH ANYONE.\n\nYour Anonymous Name: ${anonymousName}\nYour Gender: ${gender}\n\n-----SEED PHRASE (BIP39)-----\n${seedPhrase}\n-----------------------------\n\n-----BEGIN PRIVATE KEY-----\n${privateKey}\n-----END PRIVATE KEY-----\n\nYour Public Key (safe to share):\n${publicKey}\n\nGenerated: ${new Date().toLocaleString()}`;
    if (format.ext === "pdf") {
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(
          `<html><head><title>VentSafe Keys</title><style>body{font-family:Arial,sans-serif;padding:40px;color:#000562;}h1{color:#000562;border-bottom:2px solid #000562;padding-bottom:10px;}.warning{background:#fff3cd;border:1px solid #ffc107;padding:15px;border-radius:8px;margin:20px 0;}.key-box{background:#eff0ff;border:1px solid #000562;padding:15px;border-radius:8px;font-family:monospace;font-size:14px;word-break:break-all;margin:10px 0;}.label{font-weight:bold;color:#000562;margin-top:15px;}</style></head><body><h1>VentSafe — Your Keys</h1><div class="warning">WARNING: Keep your seed phrase and private key safe. DO NOT SHARE!</div><div class="label">Your Anonymous Name:</div><p>${anonymousName}</p><div class="label">Your 12-Word Seed Phrase (KEEP SECRET):</div><div class="key-box">${seedPhrase}</div><div class="label">Your Private Key (KEEP SECRET):</div><div class="key-box">${privateKey}</div><div class="label">Your Public Key:</div><div class="key-box">${publicKey}</div><p style="color:#666;font-size:12px;">Generated: ${new Date().toLocaleString()}</p></body></html>`,
        );
        printWindow.document.close();
        printWindow.print();
      }
      return;
    }
    const blob = new Blob([content], { type: format.mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ventsafe-keys.${format.ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-ventsafe-background flex flex-col">
      <header className="p-6 md:pl-25 flex items-center justify-between w-full relative">
        <div className="flex-1 flex justify-center md:justify-start">
          <Logo />
        </div>
        <div className="absolute right-6 top-6">
          <ThemeToggle />
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 pt-24 pb-24">
        <div className="w-full max-w-xl">
          <AnimatePresence mode="wait">
            {/* ── STEP 1: FORM ── */}
            {step === "form" && (
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <div className="text-center mb-8">
                  <h1 className="text-ventsafe-sub-heading font-bold text-ventsafe-foreground mb-3">
                    {existsInDb ? "Welcome back" : <span>Create Your <span className="text-ventsafe-foreground">Anonymous Key</span></span>}
                  </h1>
                  <p className="text-sm text-ventsafe-foreground/80 mb-1">
                    Generate a{" "}
                    <span className="font-bold text-ventsafe-foreground">
                      Secure
                    </span>{" "}
                    identity to access personalized features like{" "}
                    <span className="font-bold text-ventsafe-foreground">
                      Mood Tracking
                    </span>
                    . No names or emails needed.
                  </p>
                  <div className="flex items-center justify-center gap-2 text-sm text-ventsafe-foreground mt-3">
                    <ShieldCheck className="w-5 h-5" />
                    <span className="border h-6" />
                    <span>Your identity is completely decentralized!</span>
                  </div>
                </div>

                <div className="flex flex-col items-center gap-4 mb-6">
                  <div className="flex gap-4">
                    {(["male", "female"] as const).map((g) => (
                      <button
                        key={g}
                        onClick={() => {
                          setGender(g);
                          localStorage.setItem("ventsafe-signup-gender", g);
                        }}
                        className={`px-6 py-2 rounded-full text-sm font-medium border transition-all cursor-pointer capitalize ${gender === g ? "bg-ventsafe-foreground text-ventsafe-background border-ventsafe-foreground" : "bg-transparent text-ventsafe-foreground border-ventsafe-foreground/40 hover:border-ventsafe-foreground"}`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="agreeToTerms"
                      checked={agreeToTerms}
                      onChange={(e) => {
                        setAgreeToTerms(e.target.checked);
                        localStorage.setItem(
                          "ventsafe-signup-agreed",
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
                        className="text-ventsafe-foreground hover:underline font-medium"
                      >
                        Terms of Service
                      </Link>
                    </label>
                  </div>
                  {error && (
                    <p className="text-red-500 text-sm text-center">{error}</p>
                  )}
                </div>

                <div className="flex justify-center">
                  <button
                    onClick={() => {
                      if (existsInDb) {
                        router.push("/login");
                      } else {
                        handleNextToPin();
                      }
                    }}
                    className="bg-ventsafe-foreground text-ventsafe-background px-10 py-2.5 rounded-full font-medium hover:opacity-90 transition-opacity text-ventsafe-st cursor-pointer"
                  >
                    {existsInDb ? "Log in to my Account" : "Next — Set PIN"}
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── STEP 2: PIN ── */}
            {step === "pin" && (
              <motion.div
                key="pin"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex flex-col items-center gap-6 mx-auto w-full max-w-[24rem]"
              >
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-ventsafe-foreground/10 border-2 border-ventsafe-foreground flex items-center justify-center mx-auto mb-4">
                    <ShieldCheck className="w-6 h-6 text-ventsafe-foreground" />
                  </div>
                  <h2 className="text-xl font-bold text-ventsafe-foreground mb-2">
                    Set Your 4-Digit PIN
                  </h2>
                  <p className="text-sm text-ventsafe-foreground/70">
                    Your identity is derived using this PIN. You'll need it every time you log in.
                  </p>
                </div>

                <div className="w-full">
                  <label className="block text-sm font-medium text-ventsafe-foreground/80 mb-3 text-center">
                    Enter PIN
                  </label>
                  <div className="flex gap-3 justify-center">
                    {pin.map((digit, i) => (
                      <input
                        key={i}
                        ref={pinRefs[i]}
                        type="password"
                        inputMode="numeric"
                        value={digit}
                        onChange={(e) =>
                          handlePinDigit(i, e.target.value, pin, setPin, pinRefs)
                        }
                        onKeyDown={(e) => handlePinKeyDown(e, i, pin, pinRefs)}
                        className="w-14 h-14 text-center text-2xl font-bold bg-ventsafe-foreground/10 border-2 border-ventsafe-foreground/30 rounded-xl focus:border-ventsafe-foreground focus:outline-none text-ventsafe-foreground transition-colors"
                      />
                    ))}
                  </div>
                </div>

                <div className="w-full">
                  <label className="block text-sm font-medium text-ventsafe-foreground/80 mb-3 text-center">
                    Confirm PIN
                  </label>
                  <div className="flex gap-3 justify-center">
                    {confirmPin.map((digit, i) => (
                      <input
                        key={i}
                        ref={confirmPinRefs[i]}
                        type="password"
                        inputMode="numeric"
                        value={digit}
                        onChange={(e) =>
                          handlePinDigit(i, e.target.value, confirmPin, setConfirmPin, confirmPinRefs)
                        }
                        onKeyDown={(e) =>
                          handlePinKeyDown(e, i, confirmPin, confirmPinRefs)
                        }
                        className="w-14 h-14 text-center text-2xl font-bold bg-ventsafe-foreground/10 border-2 border-ventsafe-foreground/30 rounded-xl focus:border-ventsafe-foreground focus:outline-none text-ventsafe-foreground transition-colors"
                      />
                    ))}
                  </div>
                </div>

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

                <button
                  onClick={handleGenerateKeyPair}
                  disabled={isGenerating}
                  className="w-full bg-ventsafe-foreground text-ventsafe-background px-8 py-3 rounded-ventsafe-sm font-semibold hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-70 mt-2"
                >
                  {isGenerating ? "Generating Keys..." : "Generate Identity"}
                </button>

                <button
                  onClick={() => setStep("form")}
                  className="text-sm text-ventsafe-foreground/60 hover:text-ventsafe-foreground cursor-pointer"
                >
                  ← Back
                </button>
              </motion.div>
            )}

            {/* ── STEP 3: KEYS ── */}
            {step === "keys" && (
              <motion.div
                key="keys"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6 flex flex-col items-center justify-center mx-auto w-full max-w-[28rem]"
              >
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-green-100 border-2 border-green-500 flex items-center justify-center mx-auto mb-4">
                    <Check className="w-6 h-6 text-green-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-ventsafe-foreground mb-2">
                    Identity Generated
                  </h2>
                  {anonymousName && (
                    <p className="text-sm text-ventsafe-foreground/70">
                      Welcome,{" "}
                      <span className="font-bold text-ventsafe-foreground text-base">
                        {anonymousName}
                      </span>
                    </p>
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
                      <div key={i} className="flex items-center bg-ventsafe-card border border-ventsafe-border/50 rounded-md px-2 py-1.5">
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
                        className="absolute bottom-full left-0 mb-1 w-full bg-ventsafe-card border border-ventsafe-border rounded-lg shadow-lg z-50 overflow-hidden"
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
                  <Link
                    href="/login"
                    className="w-full flex items-center justify-center bg-ventsafe-foreground text-ventsafe-background px-8 py-3.5 rounded-ventsafe-sm font-semibold hover:opacity-90 transition-opacity text-ventsafe-st cursor-pointer"
                  >
                    I've Saved My Keys — Proceed to Login
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main >

      <div className="mt-12">
        <Footer />
      </div>
    </div >
  );
}
