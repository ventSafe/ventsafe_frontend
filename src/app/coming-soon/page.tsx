"use client"
// src/app/coming-soon/page.tsx
// Opens in a new tab when users click "Explore Communities"
// No authentication required — anyone can see it

import { Logo } from "@/components/shared/Logo";

export default function ComingSoonPage() {
    return (
        <div className="min-h-screen bg-ventsafe-background flex flex-col items-center justify-center px-6">
            <div className="text-center space-y-8 max-w-md">
                {/* Logo */}
                <div className="flex justify-center">
                    <Logo />
                </div>

                {/* Illustration */}
                <div className="flex justify-center">
                    <svg
                        width="200"
                        height="160"
                        viewBox="0 0 200 160"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        aria-label="Coming soon illustration"
                    >
                        {/* Clock body */}
                        <circle cx="100" cy="80" r="55" fill="#EFF0FF" stroke="#000562" strokeWidth="3" />
                        <circle cx="100" cy="80" r="48" fill="white" />
                        {/* Clock hands */}
                        <line x1="100" y1="80" x2="100" y2="48" stroke="#000562" strokeWidth="3" strokeLinecap="round" />
                        <line x1="100" y1="80" x2="122" y2="95" stroke="#2D3BA8" strokeWidth="3" strokeLinecap="round" />
                        <circle cx="100" cy="80" r="4" fill="#000562" />
                        {/* Stars */}
                        <circle cx="30" cy="25" r="3" fill="#4F5FD9" opacity="0.6" />
                        <circle cx="170" cy="20" r="2" fill="#4F5FD9" opacity="0.5" />
                        <circle cx="160" cy="140" r="3" fill="#000562" opacity="0.4" />
                        <circle cx="40" cy="135" r="2" fill="#2D3BA8" opacity="0.5" />
                        {/* Sparkles */}
                        <path d="M155 45 L158 50 L163 47 L160 52 L165 55 L159 53 L157 58 L154 53 L148 55 L153 52 L150 47 L155 50 Z"
                            fill="#4F5FD9" opacity="0.7" />
                        <path d="M45 110 L47 114 L51 112 L49 116 L53 118 L48 117 L46 121 L44 117 L39 118 L43 116 L41 112 L45 114 Z"
                            fill="#000562" opacity="0.5" />
                    </svg>
                </div>

                {/* Text */}
                <div className="space-y-3">
                    <h1 className="text-ventsafe-sub-heading font-bold text-ventsafe-foreground">
                        Coming Soon
                    </h1>
                    <p className="text-sm text-ventsafe-foreground/60 leading-relaxed">
                        Communities are on the way. Soon you&apos;ll be able to connect with
                        others who understand what you&apos;re going through.
                    </p>
                </div>

                {/* Back button */}
                <button
                    onClick={() => window.close()}
                    className="px-6 py-2.5 border border-ventsafe-border cursor-pointer text-ventsafe-foreground rounded-ventsafe-tiny text-sm font-medium hover:border-ventsafe-navy transition-colors"
                >
                    Close tab
                </button>
            </div>
        </div>
    );
}