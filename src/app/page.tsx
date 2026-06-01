import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/shared/Footer";
import { Hero } from "@/components/layout/Hero";

export default function Home() {
  return (
    <div className="min-h-screen bg-ventsafe-background transition-colors relative overflow-hidden">
      {/* Background Dot Grid */}
      <div 
        className="dot-grid-bg fixed inset-0 z-0 pointer-events-none"
      />
      <Header />
      <main className="relative z-10">
        <Hero />
      </main>
      <Footer />
    </div>
  );
}
