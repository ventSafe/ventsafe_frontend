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
import { Footer } from "@/components/shared/Footer";
import Link from "next/link";
import { signup, checkAccountExists } from "@/lib/auth";
import { encryptPrivateKey } from "@/lib/blockchain/keys";
import { useRouter } from "next/navigation";
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

type Step = "form" | "keys" | "pin";

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("form");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isSavingPin, setIsSavingPin] = useState(false);
  const [isPinComplete, setIsPinComplete] = useState(false);
  const [existsInDb, setExistsInDb] = useState(false);

  const [publicKey, setPublicKey] = useState("");
  const [privateKey, setPrivateKey] = useState("");
  const [copiedPublic, setCopiedPublic] = useState(false);
  const [copiedPrivate, setCopiedPrivate] = useState(false);
  const [gender, setGender] = useState<"male" | "female">("male");
  const [agreeToTerms, setAgreeToTerms] = useState(false);
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
    const savedPublicKey = localStorage.getItem("ventsafe-signup-public-key");
    const savedPrivateKey = localStorage.getItem("ventsafe-signup-private-key");
    const savedName = localStorage.getItem("ventsafe-signup-anon-name");
    const savedGender = localStorage.getItem("ventsafe-signup-gender") as
      | "male"
      | "female"
      | null;
    const alreadyPinned = !!localStorage.getItem(
      STORAGE_KEYS.ENCRYPTED_PRIVATE_KEY,
    );

    setIsPinComplete(alreadyPinned);
    setAgreeToTerms(localStorage.getItem("ventsafe-signup-agreed") === "true");

    if (savedPublicKey && savedPrivateKey) {
      setPublicKey(savedPublicKey);
      setPrivateKey(savedPrivateKey);
      setAnonymousName(savedName || "");
      if (savedGender) setGender(savedGender);
      setStep(alreadyPinned ? "form" : "keys");

      // Verify if this key actually belongs to a DB user
      checkAccountExists(savedPublicKey).then((res) => {
        if (res?.exists) setExistsInDb(true);
      });
    }
  }, []);

  // Delete old account before regenerating — keeps DB clean
  const deleteOldAccount = useCallback(async () => {
    const oldToken = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    if (oldToken) {
      try {
        await fetch(`${API_BASE}/auth/account`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${oldToken}` },
        });
      } catch {
        // Best-effort — don't block regeneration
      }
    }
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER_DATA);
    localStorage.removeItem(STORAGE_KEYS.PUBLIC_KEY);
    localStorage.removeItem(STORAGE_KEYS.ANONYMOUS_ID);
    localStorage.removeItem(STORAGE_KEYS.ENCRYPTED_PRIVATE_KEY);
  }, []);

  const handleGenerateKeyPair = async (isRegen = false) => {
    if (!isRegen && !agreeToTerms) {
      setError("Please agree to the terms of service first.");
      return;
    }
    setError("");
    isRegen ? setIsRegenerating(true) : setIsGenerating(true);

    try {
      if (isRegen) await deleteOldAccount();

      const result = await signup({ gender, agreeToTerms: true });

      if (result.success && result.data) {
        const newPublicKey = result.data.publicKey;
        const newPrivateKey = result.data.privateKey;
        const newName = result.data.anonymousName || "";

        setPublicKey(newPublicKey);
        setPrivateKey(newPrivateKey);
        setAnonymousName(newName);
        setIsPinComplete(false);
        setPin(["", "", "", ""]);
        setConfirmPin(["", "", "", ""]);
        setPinError("");

        localStorage.setItem("ventsafe-signup-public-key", newPublicKey);
        localStorage.setItem("ventsafe-signup-private-key", newPrivateKey);
        localStorage.setItem("ventsafe-signup-anon-name", newName);
        localStorage.setItem("ventsafe-signup-gender", gender);
        localStorage.removeItem(STORAGE_KEYS.ENCRYPTED_PRIVATE_KEY);

        setStep("keys");
      } else {
        setError(result.error || "Failed to generate keys. Please try again.");
      }
    } catch {
      setError(
        "Something went wrong. Make sure the backend server is running.",
      );
    } finally {
      setIsGenerating(false);
      setIsRegenerating(false);
    }
  };

  const handlePinDigit = (
    index: number,
    value: string,
    pinArr: string[],
    setPinArr: (v: string[]) => void,
    refs: React.RefObject<HTMLInputElement | null>[],
  ) => {
    if (!/^\d*$/.test(value)) return;
    const updated = [...pinArr];
    updated[index] = value.slice(-1);
    setPinArr(updated);
    if (value && index < 3) refs[index + 1].current?.focus();
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

  const handleSavePin = async () => {
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
    setIsSavingPin(true);
    try {
      // 1. Encrypt private key with PIN — stays in browser only
      const encrypted = await encryptPrivateKey(privateKey, pinStr);
      localStorage.setItem(STORAGE_KEYS.ENCRYPTED_PRIVATE_KEY, encrypted);
      localStorage.removeItem("ventsafe-signup-private-key");

      // 2. Tell the DB the PIN has been set — updates signup_status to 'pin_set'
      const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      if (token) {
        const res = await fetch(`${API_BASE_URL}/auth/pin-confirmed`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          // Non-blocking — PIN is still saved locally even if this fails
          console.warn(
            "Could not update signup status in DB — will retry on next login.",
          );
        }
      }

      setIsPinComplete(true);
    } catch {
      setPinError("Failed to encrypt your key. Please try again.");
    } finally {
      setIsSavingPin(false);
      setPin(["", "", "", ""]);
      setConfirmPin(["", "", "", ""]);
    }
  };

  const copyToClipboard = (text: string, type: "public" | "private") => {
    navigator.clipboard.writeText(text);
    if (type === "public") {
      setCopiedPublic(true);
      setTimeout(() => setCopiedPublic(false), 2000);
    } else {
      setCopiedPrivate(true);
      setTimeout(() => setCopiedPrivate(false), 2000);
    }
  };

  const handleDownload = (format: (typeof DOWNLOAD_FORMATS)[0]) => {
    setShowDownloadMenu(false);
    const content = `VENTSAFE PRIVATE KEY\n====================\nKEEP THIS SAFE. DO NOT SHARE WITH ANYONE.\n\nYour Anonymous Name: ${anonymousName}\nYour Gender: ${gender}\n\n-----BEGIN PRIVATE KEY-----\n${privateKey}\n-----END PRIVATE KEY-----\n\nYour Public Key (safe to share):\n${publicKey}\n\nGenerated: ${new Date().toLocaleString()}`;
    if (format.ext === "pdf") {
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(
          `<html><head><title>VentSafe Private Key</title><style>body{font-family:Arial,sans-serif;padding:40px;color:#000562;}h1{color:#000562;border-bottom:2px solid #000562;padding-bottom:10px;}.warning{background:#fff3cd;border:1px solid #ffc107;padding:15px;border-radius:8px;margin:20px 0;}.key-box{background:#eff0ff;border:1px solid #000562;padding:15px;border-radius:8px;font-family:monospace;font-size:11px;word-break:break-all;margin:10px 0;}.label{font-weight:bold;color:#000562;margin-top:15px;}</style></head><body><h1>VentSafe — Your Keys</h1><div class="warning">WARNING: Keep this private key safe. DO NOT SHARE!</div><div class="label">Your Anonymous Name:</div><p>${anonymousName}</p><div class="label">Your Private Key (KEEP SECRET):</div><div class="key-box">${privateKey.replace(/\n/g, "<br>")}</div><div class="label">Your Public Key:</div><div class="key-box">${publicKey.replace(/\n/g, "<br>")}</div><p style="color:#666;font-size:12px;">Generated: ${new Date().toLocaleString()}</p></body></html>`,
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
    a.download = `ventsafe-private-key.${format.ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-ventsafe-background flex flex-col">
      <header className="p-6 md:pl-25 flex items-center justify-center md:justify-start">
        <Logo />
      </header>

      <main className="flex-1 flex items-center justify-center px-6 pt-24">
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
                  <h1 className="text-ventsafe-sub-heading font-bold text-ventsafe-black mb-3">
                    {existsInDb ? "Welcome back" : <span>Create Your <span className="text-ventsafe-foreground">Anonymous Key</span></span>}
                  </h1>
                  <p className="text-sm text-ventsafe-black mb-1">
                    Generate a{" "}
                    <span className="font-bold text-ventsafe-foreground">
                      Secure
                    </span>{" "}
                    key pair to access personalized features like{" "}
                    <span className="font-bold text-ventsafe-foreground">
                      Mood Tracking
                    </span>
                    . No names or emails needed.
                  </p>
                  <div className="flex items-center justify-center gap-2 text-sm text-ventsafe-foreground mt-3">
                    <ShieldCheck className="w-5 h-5" />
                    <span className="border h-6" />
                    <span>Save your private key safely!</span>
                  </div>
                </div>

                <div className="flex flex-col items-center gap-4 mb-6">
                  <div className="flex gap-4">
                    {(["male", "female"] as const).map((g) => (
                      <button
                        key={g}
                        onClick={() => setGender(g)}
                        className={`px-6 py-2 rounded-full text-sm font-medium border transition-all cursor-pointer capitalize ${gender === g ? "bg-ventsafe-foreground text-white border-ventsafe-foreground" : "bg-transparent text-ventsafe-foreground border-ventsafe-foreground/40 hover:border-ventsafe-foreground"}`}
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
                      className="text-sm text-ventsafe-black"
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
                        handleGenerateKeyPair(false);
                      }
                    }}
                    disabled={isGenerating}
                    className="bg-ventsafe-foreground text-white px-10 py-2.5 rounded-full font-medium hover:opacity-90 transition-opacity text-ventsafe-st disabled:opacity-70 cursor-pointer"
                  >
                    {isGenerating ? "Generating..." : (existsInDb ? "Log in to my Account" : "Generate Key Pair")}
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── STEP 2: KEYS ── */}
            {step === "keys" && (
              <motion.div
                key="keys"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4 flex flex-col items-center justify-center mx-auto w-full max-w-[24rem]"
              >
                {/* Gender selector — always visible so user can correct mistakes */}
                <div className="w-full flex flex-col items-center gap-2">
                  <p className="text-xs text-ventsafe-foreground/60">
                    Wrong gender? Change it and click Regenerate.
                  </p>
                  <div className="flex gap-3">
                    {(["male", "female"] as const).map((g) => (
                      <button
                        key={g}
                        onClick={() => setGender(g)}
                        className={`px-5 py-1.5 rounded-full text-sm font-medium border transition-all cursor-pointer capitalize ${gender === g ? "bg-ventsafe-foreground text-white border-ventsafe-foreground" : "bg-transparent text-ventsafe-foreground border-ventsafe-foreground/40 hover:border-ventsafe-foreground"}`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Name + Regenerate */}
                <div className="w-full flex items-center justify-between">
                  {anonymousName && (
                    <p className="text-sm text-ventsafe-foreground/70">
                      Your name:{" "}
                      <span className="font-bold text-ventsafe-foreground text-base">
                        {anonymousName}
                      </span>
                    </p>
                  )}
                  <button
                    onClick={() => handleGenerateKeyPair(true)}
                    disabled={isRegenerating}
                    className="flex items-center gap-1.5 text-xs text-ventsafe-foreground border border-ventsafe-foreground/30 px-3 py-1.5 rounded-full hover:bg-ventsafe-foreground/10 transition-colors cursor-pointer disabled:opacity-50 ml-auto"
                  >
                    <RefreshCw
                      className={`w-3 h-3 ${isRegenerating ? "animate-spin" : ""}`}
                    />
                    {isRegenerating ? "Regenerating..." : "Regenerate"}
                  </button>
                </div>

                {error && (
                  <p className="text-red-500 text-sm text-center w-full">
                    {error}
                  </p>
                )}

                {/* Public Key */}
                <div className="w-full">
                  <label className="block text-xs font-medium text-ventsafe-foreground/70 mb-1.5">
                    Your public key
                  </label>
                  <div className="relative">
                    <div className="w-full px-4 py-3 pr-10 bg-ventsafe-foreground/18 border border-ventsafe-foreground rounded-ventsafe-sm">
                      <input
                        title="public key"
                        type="text"
                        value={
                          publicKey ? `${publicKey.substring(0, 40)}...` : ""
                        }
                        readOnly
                        className="w-full bg-transparent text-ventsafe-st text-ventsafe-foreground focus:outline-none p-0"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(publicKey, "public")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 hover:bg-ventsafe-border cursor-pointer rounded transition-colors"
                    >
                      {copiedPublic ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4 text-ventsafe-foreground" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Private Key */}
                <div className="w-full">
                  <label className="block text-xs font-medium text-ventsafe-foreground/70 mb-1.5">
                    Your private key{" "}
                    <span className="text-ventsafe-foreground font-bold">
                      (KEEP SECRET!)
                    </span>
                  </label>
                  <div className="relative">
                    <input
                      title="private key"
                      type="password"
                      value={privateKey}
                      readOnly
                      className="w-full px-4 py-3 pr-10 bg-ventsafe-foreground/18 border border-ventsafe-foreground rounded-ventsafe-sm text-ventsafe-foreground text-ventsafe-st focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => copyToClipboard(privateKey, "private")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 hover:bg-ventsafe-border cursor-pointer rounded transition-colors"
                    >
                      {copiedPrivate ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4 text-ventsafe-foreground" />
                      )}
                    </button>
                  </div>
                  <div className="relative mt-2" ref={downloadMenuRef}>
                    <button
                      onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                      className="flex items-center gap-2 text-sm text-ventsafe-foreground border border-ventsafe-foreground/30 px-3 py-1.5 rounded-lg hover:bg-ventsafe-foreground/10 transition-colors cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      Download private key
                      <ChevronDown
                        className={`w-4 h-4 transition-transform ${showDownloadMenu ? "rotate-180" : ""}`}
                      />
                    </button>
                    <AnimatePresence>
                      {showDownloadMenu && (
                        <motion.div
                          initial={{ opacity: 0, y: -8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          className="absolute top-full left-0 mt-1 w-52 bg-white border border-ventsafe-border rounded-lg shadow-lg z-50 overflow-hidden"
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
                </div>

                {/* Warning */}
                <div className="flex items-start gap-2">
                  <ShieldCheck className="h-5 w-5 text-ventsafe-foreground shrink-0 mt-0.5" />
                  <p className="text-ventsafe-btn-sm text-ventsafe-black">
                    <span className="font-bold text-ventsafe-foreground">
                      WARNING!{" "}
                    </span>
                    Copy and save your private key. It's your only way to log
                    in.{" "}
                    <span className="font-semibold text-ventsafe-foreground">
                      DO NOT SHARE WITH ANYONE!
                    </span>
                  </p>
                </div>

                <div className="pt-2 w-full">
                  <button
                    onClick={() => setStep("pin")}
                    className="w-full flex items-center justify-center bg-ventsafe-foreground text-ventsafe-background px-8 py-3 rounded-ventsafe-sm font-semibold hover:opacity-90 transition-opacity text-ventsafe-st cursor-pointer"
                  >
                    Next — Set Your PIN
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── STEP 3: PIN ── */}
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
                    Your private key will be encrypted with this PIN using
                    AES-256. You'll need it every time you log in.
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
                        maxLength={1}
                        value={digit}
                        onChange={(e) =>
                          handlePinDigit(
                            i,
                            e.target.value,
                            pin,
                            setPin,
                            pinRefs,
                          )
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
                        maxLength={1}
                        value={digit}
                        onChange={(e) =>
                          handlePinDigit(
                            i,
                            e.target.value,
                            confirmPin,
                            setConfirmPin,
                            confirmPinRefs,
                          )
                        }
                        onKeyDown={(e) =>
                          handlePinKeyDown(e, i, confirmPin, confirmPinRefs)
                        }
                        className="w-14 h-14 text-center text-2xl font-bold bg-ventsafe-foreground/10 border-2 border-ventsafe-foreground/30 rounded-xl focus:border-ventsafe-foreground focus:outline-none text-ventsafe-foreground transition-colors"
                      />
                    ))}
                  </div>
                </div>

                {pinError && (
                  <p className="text-red-500 text-sm text-center">{pinError}</p>
                )}

                {pin.every((d) => d) && confirmPin.every((d) => d) && (
                  <p
                    className={`text-sm font-medium ${pin.join("") === confirmPin.join("") ? "text-green-600" : "text-red-500"}`}
                  >
                    {pin.join("") === confirmPin.join("")
                      ? "✓ PINs match"
                      : "✗ PINs don't match"}
                  </p>
                )}

                {!isPinComplete ? (
                  <button
                    onClick={handleSavePin}
                    disabled={isSavingPin}
                    className="w-full bg-ventsafe-foreground text-ventsafe-background px-8 py-3 rounded-ventsafe-sm font-semibold hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-70"
                  >
                    {isSavingPin ? "Encrypting..." : "Save PIN & Secure My Key"}
                  </button>
                ) : (
                  <div className="w-full space-y-3">
                    <div className="flex items-center justify-center gap-2 text-green-600">
                      <Check className="w-5 h-5" />
                      <span className="text-sm font-medium">
                        Private key encrypted successfully!
                      </span>
                    </div>
                    <Link
                      href="/login"
                      className="w-full flex items-center justify-center bg-ventsafe-foreground text-ventsafe-background px-8 py-3 rounded-ventsafe-sm font-semibold hover:opacity-90 transition-opacity cursor-pointer"
                    >
                      Proceed to Login
                    </Link>
                  </div>
                )}

                <button
                  onClick={() => setStep("keys")}
                  className="text-sm text-ventsafe-foreground/60 hover:text-ventsafe-foreground cursor-pointer"
                >
                  ← Back to keys
                </button>
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
