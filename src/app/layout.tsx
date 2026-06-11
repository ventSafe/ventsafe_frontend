import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { Providers } from "@/components/providers/ThemeProvider";
import { Montserrat } from "next/font/google";
import { Toaster } from "sonner";
import { NetworkStatus } from "@/components/shared/NetworkStatus";

// Configure the Montserrat font with variable option
const montserrat = Montserrat({
  subsets: ['latin'],
  display: 'swap', // 'swap' ensures text is visible immediately with a fallback font
  variable: '--font-montserrat', // Define the CSS variable name
});


export const metadata: Metadata = {
  title: "VentSafe — Anonymous Mental Health Platform",
  description:
    "A safe, anonymous platform for Nigerian tertiary institution students to express their mental health struggles, seek help, and receive support without fear of judgment. Features AI-powered crisis detection and blockchain-secured anonymity.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={montserrat.variable} suppressHydrationWarning>
      <body className="font-ventsafe-font" suppressHydrationWarning>
        <Providers>
          <NetworkStatus />
          {/* AuthProvider runs checkAuth() once on every page load */}
          <AuthProvider>{children}</AuthProvider>
          <Toaster position="top-center" richColors />
        </Providers>
      </body>
    </html>
  );
}
