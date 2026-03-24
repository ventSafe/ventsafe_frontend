"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BadgeCheck, GraduationCap, User, FileText,
  Stethoscope, ChevronRight, ChevronLeft, Check,
  Sparkles, BookOpen, Heart, Brain, Users,
  Briefcase, Home, AlertTriangle, Pill, Shield,
} from "lucide-react";
import { Logo } from "@/components/shared/Logo";
import { useRouter } from "next/navigation";
import { STORAGE_KEYS } from "@/config/constants";
import { Footer } from "@/components/shared/Footer";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

// ── Specialisations ────────────────────────────────────────────────────────────
const SPECIALISATIONS = [
  { label: "Anxiety",           icon: Brain },
  { label: "Depression",        icon: Heart },
  { label: "Academic Stress",   icon: GraduationCap },
  { label: "Relationships",     icon: Users },
  { label: "Family Issues",     icon: Home },
  { label: "Grief & Loss",      icon: Heart },
  { label: "Career Anxiety",    icon: Briefcase },
  { label: "Loneliness",        icon: User },
  { label: "Trauma",            icon: Shield },
  { label: "Substance Use",     icon: Pill },
  { label: "Self-harm",         icon: AlertTriangle },
  { label: "Crisis Support",    icon: AlertTriangle },
];

type OnboardingStep = "tier" | "details" | "verification" | "specialisations" | "statement" | "submitted";

const STEP_ORDER: OnboardingStep[] = ["tier", "details", "verification", "specialisations", "statement", "submitted"];
const STEP_LABELS = ["Choose Tier", "Your Details", "Verification", "Specialisations", "Statement"];

// ── Animation variants ─────────────────────────────────────────────────────────
const slideVariants = {
  enter: (dir: number) => ({
    x: dir > 0 ? 100 : -100,
    opacity: 0,
    scale: 0.96,
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
    transition: { type: "spring" as const, stiffness: 280, damping: 28 },
  },
  exit: (dir: number) => ({
    x: dir > 0 ? -100 : 100,
    opacity: 0,
    scale: 0.96,
    transition: { duration: 0.2 },
  }),
};

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};

const itemVariants = {
  hidden:  { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 260, damping: 24 } },
};

// ── Progress bar ───────────────────────────────────────────────────────────────
function OnboardingProgress({ step }: { step: OnboardingStep }) {
  if (step === "submitted") return null;
  const idx = STEP_ORDER.indexOf(step);
  const pct = (idx / (STEP_LABELS.length)) * 100;

  return (
    <div className="w-full mb-8">
      <div className="flex justify-between mb-2.5">
        {STEP_LABELS.map((label, i) => (
          <motion.span
            key={label}
            animate={{
              color: i < idx ? "#059669" : i === idx ? "#000562" : "#9CA3AF",
              fontWeight: i === idx ? 700 : 400,
            }}
            className="text-xs hidden sm:block"
          >
            {i < idx ? "✓ " : `${i + 1}. `}{label}
          </motion.span>
        ))}
      </div>
      <div className="h-2 w-full bg-ventsafe-foreground/10 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: "linear-gradient(90deg, #000562, #4B55C8)" }}
          animate={{ width: `${pct}%` }}
          transition={{ type: "spring", stiffness: 100, damping: 20 }}
        />
      </div>
      <p className="text-xs text-ventsafe-foreground/50 mt-1.5 sm:hidden">
        Step {idx + 1} of {STEP_LABELS.length}: {STEP_LABELS[idx]}
      </p>
    </div>
  );
}

export default function CounsellorOnboardingPage() {
  const router = useRouter();
  const [step, setStep]         = useState<OnboardingStep>("tier");
  const [direction, setDirection] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError]   = useState("");

  // Form state
  const [tier, setTier]                   = useState<"volunteer" | "professional" | "">("");
  const [realName, setRealName]           = useState("");
  const [email, setEmail]                 = useState("");
  const [institution, setInstitution]     = useState("");   // volunteer
  const [licenseNumber, setLicenseNumber] = useState("");   // professional
  const [documentUrl, setDocumentUrl]     = useState("");
  const [selectedSpecs, setSelectedSpecs] = useState<string[]>([]);
  const [statement, setStatement]         = useState("");

  const [errors, setErrors] = useState<Record<string, string>>({});

  const goTo = (next: OnboardingStep) => {
    const curr = STEP_ORDER.indexOf(step);
    const nxt  = STEP_ORDER.indexOf(next);
    setDirection(nxt > curr ? 1 : -1);
    setStep(next);
  };

  const validateStep = (): boolean => {
    const e: Record<string, string> = {};
    if (step === "tier") {
      if (!tier) e.tier = "Please select a tier.";
    }
    if (step === "details") {
      if (!realName.trim()) e.realName = "Full name is required.";
      if (!email.trim() || !email.includes("@")) e.email = "A valid email is required.";
      if (tier === "volunteer" && !institution.trim()) e.institution = "Institution is required.";
    }
    if (step === "verification") {
      if (tier === "professional" && !licenseNumber.trim()) e.licenseNumber = "License number is required.";
    }
    if (step === "specialisations") {
      if (selectedSpecs.length === 0) e.specs = "Select at least one specialisation.";
    }
    if (step === "statement") {
      if (statement.trim().length < 50) e.statement = "Statement must be at least 50 characters.";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    if (!validateStep()) return;
    const curr = STEP_ORDER.indexOf(step);
    if (curr < STEP_ORDER.length - 2) {
      goTo(STEP_ORDER[curr + 1]);
    }
  };

  const handleBack = () => {
    const curr = STEP_ORDER.indexOf(step);
    if (curr > 0) goTo(STEP_ORDER[curr - 1]);
  };

  const toggleSpec = (label: string) => {
    setSelectedSpecs((prev) =>
      prev.includes(label) ? prev.filter((s) => s !== label) : [...prev, label]
    );
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;
    setIsSubmitting(true);
    setSubmitError("");

    try {
      const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      if (!token) throw new Error("Not authenticated. Please go back and log in.");

      const res = await fetch(`${API_BASE}/counsellor/apply`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          tier,
          realName,
          email,
          institution:    tier === "volunteer"    ? institution    : undefined,
          licenseNumber:  tier === "professional" ? licenseNumber  : undefined,
          documentUrl:    documentUrl || undefined,
          specialisations: selectedSpecs,
          statement,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Submission failed.");

      goTo("submitted");
    } catch (err: any) {
      setSubmitError(err.message || "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = (field: string) =>
    `w-full px-4 py-3 bg-ventsafe-foreground/5 border rounded-ventsafe-sm text-ventsafe-foreground text-sm focus:outline-none focus:border-ventsafe-foreground transition-colors ${
      errors[field] ? "border-red-400" : "border-ventsafe-foreground/20"
    }`;

  return (
    <div className="min-h-screen bg-ventsafe-background flex flex-col">
      <header className="p-6 md:pl-25 flex items-center justify-center md:justify-start">
        <Logo />
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-2xl">

          {/* Header */}
          {step !== "submitted" && (
            <motion.div
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-6"
            >
              <div className="flex justify-center mb-3">
                <div className="flex items-center gap-2 bg-ventsafe-foreground/8 border border-ventsafe-foreground/20 rounded-full px-4 py-1.5">
                  <Sparkles className="w-4 h-4 text-ventsafe-foreground" />
                  <span className="text-xs font-semibold text-ventsafe-foreground tracking-wide">
                    Counsellor Onboarding
                  </span>
                </div>
              </div>
              <h1 className="text-2xl font-bold text-ventsafe-foreground mb-1">
                Tell us about yourself
              </h1>
              <p className="text-sm text-ventsafe-foreground/50">
                This information is kept private — only the admin can see it for verification.
              </p>
            </motion.div>
          )}

          <OnboardingProgress step={step} />

          <AnimatePresence mode="wait" custom={direction}>

            {/* ── STEP 1: TIER ── */}
            {step === "tier" && (
              <motion.div
                key="tier"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
              >
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="space-y-4"
                >
                  <motion.h2 variants={itemVariants} className="text-lg font-bold text-ventsafe-foreground text-center mb-6">
                    What type of counsellor are you?
                  </motion.h2>

                  {/* Volunteer card */}
                  <motion.button
                    variants={itemVariants}
                    whileHover={{ scale: 1.015, y: -2 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => setTier("volunteer")}
                    className={`w-full p-5 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                      tier === "volunteer"
                        ? "border-ventsafe-foreground bg-ventsafe-foreground/8 shadow-lg shadow-ventsafe-foreground/10"
                        : "border-ventsafe-foreground/15 bg-white hover:border-ventsafe-foreground/40"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <motion.div
                        animate={{
                          backgroundColor: tier === "volunteer" ? "#000562" : "#EFF0FF",
                        }}
                        className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                      >
                        <GraduationCap
                          className={`w-6 h-6 ${tier === "volunteer" ? "text-white" : "text-ventsafe-foreground"}`}
                        />
                      </motion.div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-ventsafe-foreground">Volunteer Counsellor</h3>
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                            Student
                          </span>
                        </div>
                        <p className="text-sm text-ventsafe-foreground/60 mb-3">
                          A fellow student who has completed mental health first aid training and wants to support peers.
                        </p>
                        <ul className="space-y-1">
                          {["University student", "Mental health first aid certificate", "Written statement of intent"].map((req) => (
                            <li key={req} className="flex items-center gap-1.5 text-xs text-ventsafe-foreground/70">
                              <Check className="w-3 h-3 text-ventsafe-foreground" />
                              {req}
                            </li>
                          ))}
                        </ul>
                      </div>
                      {tier === "volunteer" && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        >
                          <Check className="w-5 h-5 text-ventsafe-foreground" />
                        </motion.div>
                      )}
                    </div>
                  </motion.button>

                  {/* Professional card */}
                  <motion.button
                    variants={itemVariants}
                    whileHover={{ scale: 1.015, y: -2 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => setTier("professional")}
                    className={`w-full p-5 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                      tier === "professional"
                        ? "border-ventsafe-foreground bg-ventsafe-foreground/8 shadow-lg shadow-ventsafe-foreground/10"
                        : "border-ventsafe-foreground/15 bg-white hover:border-ventsafe-foreground/40"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <motion.div
                        animate={{
                          backgroundColor: tier === "professional" ? "#000562" : "#EFF0FF",
                        }}
                        className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                      >
                        <Stethoscope
                          className={`w-6 h-6 ${tier === "professional" ? "text-white" : "text-ventsafe-foreground"}`}
                        />
                      </motion.div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-ventsafe-foreground">Professional Counsellor</h3>
                          <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
                            Certified
                          </span>
                        </div>
                        <p className="text-sm text-ventsafe-foreground/60 mb-3">
                          A licensed mental health professional (MDCN or equivalent Nigerian body) with verified credentials.
                        </p>
                        <ul className="space-y-1">
                          {["Valid mental health license", "MDCN / NLNG registration", "Professional certificate upload"].map((req) => (
                            <li key={req} className="flex items-center gap-1.5 text-xs text-ventsafe-foreground/70">
                              <Check className="w-3 h-3 text-ventsafe-foreground" />
                              {req}
                            </li>
                          ))}
                        </ul>
                      </div>
                      {tier === "professional" && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        >
                          <Check className="w-5 h-5 text-ventsafe-foreground" />
                        </motion.div>
                      )}
                    </div>
                  </motion.button>

                  {errors.tier && (
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-500 text-sm text-center">
                      {errors.tier}
                    </motion.p>
                  )}
                </motion.div>

                <NavButtons onNext={handleNext} showBack={false} />
              </motion.div>
            )}

            {/* ── STEP 2: DETAILS ── */}
            {step === "details" && (
              <motion.div
                key="details"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
              >
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="space-y-4"
                >
                  <motion.h2 variants={itemVariants} className="text-lg font-bold text-ventsafe-foreground mb-2">
                    Personal Details
                  </motion.h2>
                  <motion.p variants={itemVariants} className="text-sm text-ventsafe-foreground/50 mb-5">
                    This information is encrypted and never shown publicly. Only admins can see it for verification.
                  </motion.p>

                  <motion.div variants={itemVariants}>
                    <label className="block text-sm font-semibold text-ventsafe-foreground mb-1.5">
                      Full Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Your real full name"
                      value={realName}
                      onChange={(e) => setRealName(e.target.value)}
                      className={inputClass("realName")}
                    />
                    {errors.realName && <p className="text-red-500 text-xs mt-1">{errors.realName}</p>}
                  </motion.div>

                  <motion.div variants={itemVariants}>
                    <label className="block text-sm font-semibold text-ventsafe-foreground mb-1.5">
                      Email Address <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={inputClass("email")}
                    />
                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                    <p className="text-xs text-ventsafe-foreground/40 mt-1">
                      Used to notify you when your application is reviewed.
                    </p>
                  </motion.div>

                  {tier === "volunteer" && (
                    <motion.div variants={itemVariants}>
                      <label className="block text-sm font-semibold text-ventsafe-foreground mb-1.5">
                        University / Institution <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. University of Lagos"
                        value={institution}
                        onChange={(e) => setInstitution(e.target.value)}
                        className={inputClass("institution")}
                      />
                      {errors.institution && <p className="text-red-500 text-xs mt-1">{errors.institution}</p>}
                    </motion.div>
                  )}
                </motion.div>

                <NavButtons onNext={handleNext} onBack={handleBack} />
              </motion.div>
            )}

            {/* ── STEP 3: VERIFICATION ── */}
            {step === "verification" && (
              <motion.div
                key="verification"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
              >
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="space-y-4"
                >
                  <motion.h2 variants={itemVariants} className="text-lg font-bold text-ventsafe-foreground mb-2">
                    Verification Documents
                  </motion.h2>
                  <motion.p variants={itemVariants} className="text-sm text-ventsafe-foreground/50 mb-5">
                    {tier === "volunteer"
                      ? "Upload your mental health first aid certificate to a Google Drive or Dropbox folder and paste the link below."
                      : "Provide your professional license number and a link to your certificate or registration document."}
                  </motion.p>

                  {tier === "professional" && (
                    <motion.div variants={itemVariants}>
                      <label className="block text-sm font-semibold text-ventsafe-foreground mb-1.5">
                        License / Registration Number <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. MDCN/2024/12345"
                        value={licenseNumber}
                        onChange={(e) => setLicenseNumber(e.target.value)}
                        className={inputClass("licenseNumber")}
                      />
                      {errors.licenseNumber && <p className="text-red-500 text-xs mt-1">{errors.licenseNumber}</p>}
                    </motion.div>
                  )}

                  <motion.div variants={itemVariants}>
                    <label className="block text-sm font-semibold text-ventsafe-foreground mb-1.5">
                      Document Link{" "}
                      <span className="text-ventsafe-foreground/40 font-normal text-xs">(optional but recommended)</span>
                    </label>
                    <input
                      type="url"
                      placeholder="https://drive.google.com/your-certificate"
                      value={documentUrl}
                      onChange={(e) => setDocumentUrl(e.target.value)}
                      className={inputClass("documentUrl")}
                    />
                    <p className="text-xs text-ventsafe-foreground/40 mt-1">
                      Paste a Google Drive or Dropbox link to your certificate. Make sure the link is publicly viewable.
                    </p>
                  </motion.div>

                  <motion.div
                    variants={itemVariants}
                    className="bg-blue-50 border border-blue-200 rounded-xl p-4"
                  >
                    <p className="text-xs text-blue-800">
                      <span className="font-bold">📁 How to share a Google Drive link: </span>
                      Upload your document → Right-click → Share → Change to "Anyone with the link" → Copy link.
                    </p>
                  </motion.div>
                </motion.div>

                <NavButtons onNext={handleNext} onBack={handleBack} />
              </motion.div>
            )}

            {/* ── STEP 4: SPECIALISATIONS ── */}
            {step === "specialisations" && (
              <motion.div
                key="specialisations"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
              >
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <motion.h2 variants={itemVariants} className="text-lg font-bold text-ventsafe-foreground mb-1">
                    Your Specialisations
                  </motion.h2>
                  <motion.p variants={itemVariants} className="text-sm text-ventsafe-foreground/50 mb-5">
                    Select the areas you feel most comfortable supporting students with. You can select multiple.
                  </motion.p>

                  <motion.div
                    variants={containerVariants}
                    className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4"
                  >
                    {SPECIALISATIONS.map(({ label, icon: Icon }, i) => {
                      const selected = selectedSpecs.includes(label);
                      return (
                        <motion.button
                          key={label}
                          variants={itemVariants}
                          custom={i}
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => toggleSpec(label)}
                          className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-sm font-medium transition-all cursor-pointer ${
                            selected
                              ? "border-ventsafe-foreground bg-ventsafe-foreground text-white shadow-md shadow-ventsafe-foreground/20"
                              : "border-ventsafe-foreground/15 bg-white text-ventsafe-foreground hover:border-ventsafe-foreground/40"
                          }`}
                        >
                          <Icon className="w-4 h-4 shrink-0" />
                          <span className="text-xs">{label}</span>
                          {selected && (
                            <motion.span
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="ml-auto"
                            >
                              <Check className="w-3 h-3" />
                            </motion.span>
                          )}
                        </motion.button>
                      );
                    })}
                  </motion.div>

                  {selectedSpecs.length > 0 && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-xs text-ventsafe-foreground/50 text-center"
                    >
                      {selectedSpecs.length} selected
                    </motion.p>
                  )}

                  {errors.specs && (
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-500 text-sm text-center mt-2">
                      {errors.specs}
                    </motion.p>
                  )}
                </motion.div>

                <NavButtons onNext={handleNext} onBack={handleBack} />
              </motion.div>
            )}

            {/* ── STEP 5: STATEMENT ── */}
            {step === "statement" && (
              <motion.div
                key="statement"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
              >
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="space-y-4"
                >
                  <motion.h2 variants={itemVariants} className="text-lg font-bold text-ventsafe-foreground mb-1">
                    Your Statement
                  </motion.h2>
                  <motion.p variants={itemVariants} className="text-sm text-ventsafe-foreground/50 mb-4">
                    Tell us why you want to be a counsellor on VentSafe. What motivates you to support students?
                    Minimum 50 characters.
                  </motion.p>

                  <motion.div variants={itemVariants} className="relative">
                    <textarea
                      placeholder="I want to support students because..."
                      value={statement}
                      onChange={(e) => setStatement(e.target.value)}
                      rows={7}
                      className={`w-full px-4 py-3 bg-ventsafe-foreground/5 border rounded-ventsafe-sm text-ventsafe-foreground text-sm focus:outline-none focus:border-ventsafe-foreground transition-colors resize-none ${
                        errors.statement ? "border-red-400" : "border-ventsafe-foreground/20"
                      }`}
                    />
                    <div className="flex items-center justify-between mt-1">
                      <span className={`text-xs ${statement.length < 50 ? "text-red-400" : "text-green-600"}`}>
                        {statement.length} / 50 minimum
                      </span>
                      {statement.length >= 50 && (
                        <motion.span
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="text-xs text-green-600 font-medium flex items-center gap-1"
                        >
                          <Check className="w-3 h-3" /> Good to go
                        </motion.span>
                      )}
                    </div>
                  </motion.div>

                  {errors.statement && (
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-500 text-sm">
                      {errors.statement}
                    </motion.p>
                  )}

                  {submitError && (
                    <motion.p
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-lg px-4 py-3"
                    >
                      {submitError}
                    </motion.p>
                  )}
                </motion.div>

                <div className="flex gap-3 mt-8">
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={handleBack}
                    className="flex items-center gap-1.5 px-5 py-3 rounded-ventsafe-sm border border-ventsafe-foreground/20 text-ventsafe-foreground text-sm font-medium hover:bg-ventsafe-foreground/5 transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" /> Back
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="flex-1 flex items-center justify-center gap-2 bg-ventsafe-foreground text-white px-6 py-3 rounded-ventsafe-sm font-semibold hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-60 shadow-md shadow-ventsafe-foreground/20"
                  >
                    {isSubmitting ? (
                      <>
                        <motion.span
                          animate={{ rotate: 360 }}
                          transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                          className="inline-block"
                        >
                          ⟳
                        </motion.span>
                        Submitting...
                      </>
                    ) : (
                      <>
                        <BadgeCheck className="w-5 h-5" />
                        Submit Application
                      </>
                    )}
                  </motion.button>
                </div>
              </motion.div>
            )}

            {/* ── SUBMITTED ── */}
            {step === "submitted" && (
              <motion.div
                key="submitted"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 22 }}
                className="flex flex-col items-center text-center py-8 px-4"
              >
                {/* Animated checkmark circle */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.1 }}
                  className="relative mb-6"
                >
                  <div className="w-24 h-24 rounded-full bg-ventsafe-foreground flex items-center justify-center shadow-xl shadow-ventsafe-foreground/30">
                    <motion.div
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ delay: 0.3, duration: 0.5 }}
                    >
                      <BadgeCheck className="w-12 h-12 text-white" />
                    </motion.div>
                  </div>

                  {/* Orbiting particles */}
                  {[0, 60, 120, 180, 240, 300].map((angle, i) => (
                    <motion.div
                      key={i}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{
                        scale: [0, 1, 0],
                        opacity: [0, 1, 0],
                        x: Math.cos((angle * Math.PI) / 180) * 52,
                        y: Math.sin((angle * Math.PI) / 180) * 52,
                      }}
                      transition={{ delay: 0.4 + i * 0.08, duration: 0.6 }}
                      className="absolute top-1/2 left-1/2 w-2.5 h-2.5 rounded-full bg-ventsafe-foreground -translate-x-1/2 -translate-y-1/2"
                    />
                  ))}
                </motion.div>

                <motion.h2
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="text-2xl font-bold text-ventsafe-foreground mb-3"
                >
                  Application Submitted! 🎉
                </motion.h2>

                <motion.p
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="text-sm text-ventsafe-foreground/60 max-w-md mb-2"
                >
                  Thank you for applying to join VentSafe as a counsellor. Your application is now under review.
                </motion.p>

                <motion.p
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.65 }}
                  className="text-sm text-ventsafe-foreground/60 max-w-md mb-8"
                >
                  You will receive an email notification once a decision has been made. This typically takes <strong>2–5 business days</strong>.
                </motion.p>

                {/* Info cards */}
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.75 }}
                  className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-lg mb-8"
                >
                  {[
                    { icon: BookOpen, label: "Application submitted",   color: "bg-blue-50 border-blue-200 text-blue-700" },
                    { icon: Shield,   label: "Under admin review",       color: "bg-amber-50 border-amber-200 text-amber-700" },
                    { icon: Check,    label: "Email when approved",      color: "bg-green-50 border-green-200 text-green-700" },
                  ].map(({ icon: Icon, label, color }) => (
                    <div key={label} className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-medium ${color}`}>
                      <Icon className="w-5 h-5" />
                      {label}
                    </div>
                  ))}
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.85 }}
                  className="flex flex-col sm:flex-row gap-3 w-full max-w-sm"
                >
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => router.push("/onboarding/counsellor/status")}
                    className="flex-1 bg-ventsafe-foreground text-white px-6 py-3 rounded-ventsafe-sm font-semibold hover:opacity-90 transition-opacity cursor-pointer shadow-md shadow-ventsafe-foreground/20"
                  >
                    Check Status
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => router.push("/vent-space")}
                    className="flex-1 border border-ventsafe-foreground/20 text-ventsafe-foreground px-6 py-3 rounded-ventsafe-sm font-semibold hover:bg-ventsafe-foreground/5 transition-colors cursor-pointer"
                  >
                    Browse as Student
                  </motion.button>
                </motion.div>
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

// ── Shared nav buttons ─────────────────────────────────────────────────────────
function NavButtons({
  onNext,
  onBack,
  showBack = true,
}: {
  onNext: () => void;
  onBack?: () => void;
  showBack?: boolean;
}) {
  return (
    <div className={`flex gap-3 mt-8 ${showBack ? "justify-between" : "justify-end"}`}>
      {showBack && onBack && (
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onBack}
          className="flex items-center gap-1.5 px-5 py-3 rounded-ventsafe-sm border border-ventsafe-foreground/20 text-ventsafe-foreground text-sm font-medium hover:bg-ventsafe-foreground/5 transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" /> Back
        </motion.button>
      )}
      <motion.button
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.97 }}
        onClick={onNext}
        className="flex items-center gap-2 bg-ventsafe-foreground text-white px-6 py-3 rounded-ventsafe-sm font-semibold hover:opacity-90 transition-opacity cursor-pointer shadow-md shadow-ventsafe-foreground/20 ml-auto"
      >
        Continue <ChevronRight className="w-4 h-4" />
      </motion.button>
    </div>
  );
}