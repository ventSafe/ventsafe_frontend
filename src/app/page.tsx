import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/shared/Footer";
import { Hero } from "@/components/layout/Hero";

export default function Home() {
  return (
    <div className="min-h-screen bg-ventsafe-background transition-colors">
      <Header />
      <main>
        <Hero />
      </main>
      <Footer />
    </div>
  );
}
