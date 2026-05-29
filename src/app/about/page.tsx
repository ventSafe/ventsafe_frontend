"use client";

import { motion } from "framer-motion";
import { Shield, EyeOff, Heart, Users, Globe } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/shared/Footer";

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.2
    }
  }
};

const HeroIllustration = () => (
  <svg viewBox="0 0 400 400" className="w-full h-full max-w-md mx-auto" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="var(--primary-color)" stopOpacity="0.1" />
        <stop offset="100%" stopColor="var(--primary-color)" stopOpacity="0.5" />
      </linearGradient>
      <linearGradient id="grad2" x1="100%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="currentColor" stopOpacity="0.1" />
        <stop offset="100%" stopColor="currentColor" stopOpacity="0.3" />
      </linearGradient>
    </defs>
    <motion.circle cx="200" cy="200" r="120" fill="url(#grad1)" 
      animate={{ scale: [1, 1.05, 1], y: [0, -10, 0] }} 
      transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} />
    <motion.circle cx="240" cy="160" r="80" fill="url(#grad2)" className="text-ventsafe-primary"
      animate={{ scale: [1, 1.1, 1], x: [0, -10, 0] }} 
      transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 0.5 }} />
    <motion.path d="M140,240 C140,140 260,140 260,240" stroke="var(--primary-color)" strokeWidth="4" fill="none" strokeLinecap="round"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 2, ease: "easeInOut", delay: 0.5 }} />
    <motion.circle cx="140" cy="240" r="8" fill="var(--primary-color)" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 2.2 }} />
    <motion.circle cx="260" cy="240" r="8" fill="var(--primary-color)" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 2.2 }} />
  </svg>
);

const MissionIllustration = () => (
  <svg viewBox="0 0 400 400" className="w-full h-full max-w-sm mx-auto" xmlns="http://www.w3.org/2000/svg">
    <motion.path d="M50 200 Q 200 50 350 200" stroke="var(--primary-color)" strokeOpacity="0.3" strokeWidth="2" fill="none" />
    <motion.path d="M50 200 Q 200 350 350 200" stroke="var(--primary-color)" strokeOpacity="0.3" strokeWidth="2" fill="none" />
    <motion.circle cx="200" cy="200" r="80" fill="currentColor" className="text-ventsafe-primary opacity-5"
      animate={{ scale: [1, 1.1, 1] }}
      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} />
    <motion.rect x="160" y="160" width="80" height="80" rx="20" fill="var(--primary-color)" fillOpacity="0.1" stroke="var(--primary-color)" strokeWidth="2" 
      animate={{ rotate: [0, 90, 180, 270, 360] }}
      transition={{ duration: 12, repeat: Infinity, ease: "linear" }} />
    <motion.circle cx="200" cy="200" r="20" fill="var(--primary-color)" />
  </svg>
);

const TeamIllustration = () => (
  <svg viewBox="0 0 400 400" className="w-full h-full max-w-md mx-auto" xmlns="http://www.w3.org/2000/svg">
    <g stroke="var(--primary-color)" strokeWidth="2" fill="none">
      <motion.circle cx="200" cy="200" r="120" strokeOpacity="0.2" strokeDasharray="8 12" 
        animate={{ rotate: 360 }} transition={{ duration: 40, repeat: Infinity, ease: "linear" }} />
      <motion.circle cx="200" cy="200" r="160" strokeOpacity="0.1" strokeDasharray="4 16"
        animate={{ rotate: -360 }} transition={{ duration: 50, repeat: Infinity, ease: "linear" }} />
      
      {/* Connections to center */}
      {[0, 60, 120, 180, 240, 300].map((angle, i) => {
        const rad = angle * Math.PI / 180;
        const x = 200 + Math.cos(rad) * 120;
        const y = 200 + Math.sin(rad) * 120;
        return (
          <motion.line key={`line-${i}`} x1="200" y1="200" x2={x} y2={y} strokeOpacity="0.3"
            initial={{ pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1, duration: 0.8 }} />
        )
      })}
      {/* Nodes */}
      {[0, 60, 120, 180, 240, 300].map((angle, i) => {
        const rad = angle * Math.PI / 180;
        const x = 200 + Math.cos(rad) * 120;
        const y = 200 + Math.sin(rad) * 120;
        return (
          <motion.circle key={`node-${i}`} cx={x} cy={y} r="10" fill="var(--primary-color)" strokeWidth="0"
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 + 0.3, duration: 0.5 }} />
        )
      })}
      {/* Center node */}
      <motion.circle cx="200" cy="200" r="24" fill="var(--card-color)" strokeWidth="4" />
      <motion.circle cx="200" cy="200" r="12" fill="var(--primary-color)" strokeWidth="0" />
    </g>
  </svg>
);

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-ventsafe-background text-ventsafe-foreground font-sans overflow-hidden transition-colors duration-300">
      <Header />
      
      {/* Background Dot Grid */}
      <div 
        className="fixed inset-0 z-0 opacity-[0.15] dark:opacity-20 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(currentColor 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          maskImage: 'linear-gradient(to bottom, black 10%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, black 10%, transparent 100%)'
        }}
      />
      
      {/* Section 1: Hero */}
      <section className="relative py-24 border-b border-ventsafe-border/30 z-10 pt-32">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-[400px] bg-ventsafe-primary/10 rounded-full blur-[120px] pointer-events-none z-0" />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-6xl mx-auto grid md:grid-cols-2 items-center gap-12">
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="text-left"
            >
              <h1 className="text-5xl md:text-6xl font-medium tracking-tight mb-6 text-ventsafe-foreground/90">
                About VentSafe
              </h1>
              <p className="text-xl text-ventsafe-foreground/60 leading-relaxed">
                We are building a sanctuary for authentic expression, free from judgment, fully protected by advanced cryptographic privacy.
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <HeroIllustration />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Section 2: Our Mission */}
      <section className="py-24 relative z-10">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto grid md:grid-cols-2 items-center gap-12">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="order-2 md:order-1"
            >
              <MissionIllustration />
            </motion.div>
            <motion.div 
              variants={fadeIn}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              className="space-y-6 order-1 md:order-2"
            >
              <div className="inline-flex items-center justify-center w-12 h-12 bg-ventsafe-foreground/5 border border-ventsafe-border rounded-xl mb-2">
                <Heart className="w-6 h-6 text-ventsafe-foreground/70" />
              </div>
              <h2 className="text-3xl md:text-4xl font-medium text-ventsafe-foreground/90">Our Mission</h2>
              <p className="text-lg text-ventsafe-foreground/60 leading-relaxed">
                At VentSafe, our mission is to empower individuals to share their burdens without fear. We believe that mental wellness begins with being heard. By providing a truly anonymous and secure platform, we bridge the gap between those who need to speak and professional counsellors ready to listen.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Section 3: Core Values */}
      <section className="py-24 bg-ventsafe-background/50 border-y border-ventsafe-border/30 relative z-10">
        <div className="absolute inset-0 bg-ventsafe-primary/5 blur-[100px] pointer-events-none" />
        
        <div className="container mx-auto px-4 relative z-10">
          <motion.div 
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="max-w-5xl mx-auto"
          >
            <motion.div variants={fadeIn} className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-medium text-ventsafe-foreground/90">Our Core Values</h2>
              <p className="text-ventsafe-foreground/60 mt-4 text-lg">The principles that guide every line of code we write.</p>
            </motion.div>
            
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { icon: Shield, title: "Absolute Security", desc: "Military-grade encryption ensures your conversations belong only to you and your counsellor." },
                { icon: EyeOff, title: "True Anonymity", desc: "No tracking, no identifiable data. Your identity is protected by zero-knowledge architecture." },
                { icon: Users, title: "Compassionate Care", desc: "Connecting you with verified professionals who genuinely care about your mental well-being." }
              ].map((value, i) => (
                <motion.div 
                  key={i}
                  variants={fadeIn}
                  className="bg-ventsafe-card border border-ventsafe-border rounded-2xl p-8 relative overflow-hidden group hover:border-ventsafe-border/80 transition-colors shadow-sm"
                >
                  <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-ventsafe-primary to-transparent opacity-0 group-hover:opacity-50 transition-opacity" />
                  
                  <div className="w-12 h-12 bg-ventsafe-foreground/5 border border-ventsafe-border rounded-xl flex items-center justify-center mb-6">
                    <value.icon className="w-6 h-6 text-ventsafe-primary" />
                  </div>
                  <h3 className="text-xl font-medium mb-3 text-ventsafe-foreground/90">{value.title}</h3>
                  <p className="text-ventsafe-foreground/60 leading-relaxed text-sm">{value.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Section 4: Who We Are */}
      <section className="py-24 relative z-10">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-12">
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="md:w-1/2 space-y-6"
            >
              <h2 className="text-3xl md:text-4xl font-medium text-ventsafe-foreground/90">Who We Are</h2>
              <p className="text-lg text-ventsafe-foreground/60 leading-relaxed">
                VentSafe was founded by a collective of security engineers and mental health advocates who recognized a critical flaw in modern communication: the lack of a truly safe space. 
              </p>
              <p className="text-lg text-ventsafe-foreground/60 leading-relaxed">
                We've combined cutting-edge cryptographic protocols with an intuitive, user-centric design to create a platform where privacy isn't just a policy—it's mathematically guaranteed.
              </p>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="md:w-1/2 w-full"
            >
              <div className="bg-ventsafe-card border border-ventsafe-border rounded-3xl p-8 relative overflow-hidden group shadow-sm">
                <div className="absolute -inset-4 bg-ventsafe-primary/5 blur-[20px] pointer-events-none" />
                <div className="relative z-10">
                  <TeamIllustration />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Section 5: Our Vision */}
      <section className="py-24 bg-ventsafe-background border-t border-ventsafe-border/30 relative overflow-hidden z-10">
        <div className="absolute inset-0 opacity-[0.15] dark:opacity-20 pointer-events-none"
             style={{
               backgroundImage: 'radial-gradient(currentColor 1px, transparent 1px)',
               backgroundSize: '24px 24px',
               maskImage: 'radial-gradient(circle at center, black, transparent 70%)',
               WebkitMaskImage: 'radial-gradient(circle at center, black, transparent 70%)',
               color: 'var(--primary-color)'
             }} 
        />
        
        <div className="container mx-auto px-4 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mx-auto text-center space-y-8"
          >
            <div className="inline-flex items-center justify-center p-4 bg-ventsafe-foreground/5 border border-ventsafe-border rounded-2xl mb-2 backdrop-blur-sm shadow-sm">
              <Globe className="w-8 h-8 text-ventsafe-primary" />
            </div>
            <h2 className="text-3xl md:text-5xl font-medium text-ventsafe-foreground/90">A Stigma-Free Future</h2>
            <p className="text-xl text-ventsafe-foreground/60 leading-relaxed">
              We envision a world where seeking help is as normal as taking a breath. A world where everyone has access to a safe sanctuary, free from judgment, monitoring, and fear.
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
