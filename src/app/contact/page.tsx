"use client";

import { motion } from "framer-motion";
import { Mail, MessageSquare, MapPin, Send, ArrowRight } from "lucide-react";
import { useState } from "react";

import { Header } from "@/components/layout/Header";

export default function ContactPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-ventsafe-background text-ventsafe-foreground relative flex flex-col items-center pb-24 font-sans transition-colors duration-300">
      <Header />
      {/* Background Dot Grid */}
      <div 
        className="absolute inset-0 z-0 opacity-[0.15] dark:opacity-20 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(currentColor 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          maskImage: 'linear-gradient(to bottom, black 20%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, black 20%, transparent 100%)'
        }}
      />
      
      {/* Top ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-[400px] bg-ventsafe-primary/10 rounded-full blur-[120px] pointer-events-none z-0" />

      <div className="container mx-auto px-4 relative z-10 pt-32">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="max-w-3xl mx-auto text-center mb-20"
        >
          <h1 className="text-4xl md:text-5xl font-medium tracking-tight mb-6 text-ventsafe-foreground/90">
            Ready to Take Control of Your Support?
          </h1>
          <p className="text-lg text-ventsafe-foreground/60">
            Have questions, feedback, or need assistance? Reach out to our team. We're here to help you navigate VentSafe securely.
          </p>
        </motion.div>

        <div className="max-w-5xl mx-auto grid lg:grid-cols-5 gap-8">
          {/* Contact Info (Style of Hexora Accordion/Cards) */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-2 space-y-6"
          >
            <div className="bg-ventsafe-card border border-ventsafe-border rounded-2xl p-8 relative overflow-hidden group hover:border-ventsafe-border/80 transition-colors shadow-sm">
              {/* Subtle inner grid for card */}
              <div 
                className="absolute inset-0 z-0 opacity-[0.05] dark:opacity-10 pointer-events-none"
                style={{
                  backgroundImage: 'radial-gradient(currentColor 1px, transparent 1px)',
                  backgroundSize: '16px 16px',
                  maskImage: 'linear-gradient(to right, black, transparent)',
                  WebkitMaskImage: 'linear-gradient(to right, black, transparent)'
                }}
              />
              <div className="relative z-10">
                <h3 className="text-xl font-medium mb-8 text-ventsafe-foreground/90">Contact Information</h3>
                
                <div className="space-y-8">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-ventsafe-foreground/5 border border-ventsafe-border flex items-center justify-center shrink-0">
                      <Mail className="w-5 h-5 text-ventsafe-foreground/70" />
                    </div>
                    <div>
                      <h4 className="font-medium text-ventsafe-foreground/90">Email Us</h4>
                      <p className="text-ventsafe-foreground/60 text-sm mt-1 hover:text-ventsafe-primary transition-colors cursor-pointer">support@ventsafe.app</p>
                      <p className="text-ventsafe-foreground/60 text-sm hover:text-ventsafe-primary transition-colors cursor-pointer">hello@ventsafe.app</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-ventsafe-foreground/5 border border-ventsafe-border flex items-center justify-center shrink-0">
                      <MessageSquare className="w-5 h-5 text-ventsafe-foreground/70" />
                    </div>
                    <div>
                      <h4 className="font-medium text-ventsafe-foreground/90">Live Support</h4>
                      <p className="text-ventsafe-foreground/60 text-sm mt-1">Available 24/7 for critical issues</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-ventsafe-foreground/5 border border-ventsafe-border flex items-center justify-center shrink-0">
                      <MapPin className="w-5 h-5 text-ventsafe-foreground/70" />
                    </div>
                    <div>
                      <h4 className="font-medium text-ventsafe-foreground/90">Headquarters</h4>
                      <p className="text-ventsafe-foreground/60 text-sm mt-1">128 Privacy Lane, SecurCity</p>
                      <p className="text-ventsafe-foreground/60 text-sm">Crypto State, CS 90210</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Contact Form */}
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="lg:col-span-3"
          >
            <div className="bg-ventsafe-card border border-ventsafe-border rounded-2xl p-8 relative overflow-hidden group shadow-sm">
              {/* Bottom Glow inside form card (Hexora CTA style) */}
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-ventsafe-primary to-transparent opacity-60" />
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-2/3 h-[40px] bg-ventsafe-primary blur-[30px] opacity-20 dark:opacity-40 pointer-events-none" />

              {/* Inner Dot Grid for Form */}
              <div 
                className="absolute inset-0 z-0 opacity-[0.03] dark:opacity-5 pointer-events-none"
                style={{
                  backgroundImage: 'radial-gradient(currentColor 1px, transparent 1px)',
                  backgroundSize: '16px 16px',
                }}
              />

              {submitted ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute inset-0 bg-ventsafe-card flex flex-col items-center justify-center p-8 text-center z-20"
                >
                  <div className="w-16 h-16 bg-ventsafe-primary/10 text-ventsafe-primary border border-ventsafe-primary/20 rounded-2xl flex items-center justify-center mb-6">
                    <Send className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-medium mb-2 text-ventsafe-foreground/90">Message Sent</h3>
                  <p className="text-ventsafe-foreground/60 mb-8">
                    Thanks for reaching out. We'll get back to you securely.
                  </p>
                  <button 
                    onClick={() => setSubmitted(false)}
                    className="px-6 py-2.5 bg-ventsafe-foreground/5 border border-ventsafe-border text-ventsafe-foreground/80 rounded-lg font-medium hover:bg-ventsafe-foreground/10 hover:text-ventsafe-foreground transition-colors text-sm"
                  >
                    Send Another Message
                  </button>
                </motion.div>
              ) : null}

              <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label htmlFor="name" className="text-sm font-medium text-ventsafe-foreground/70">Full Name</label>
                    <input 
                      id="name"
                      required
                      type="text" 
                      placeholder="John Doe"
                      className="w-full px-4 py-3 bg-ventsafe-background border border-ventsafe-border rounded-lg text-ventsafe-foreground placeholder:text-ventsafe-foreground/30 focus:outline-none focus:border-ventsafe-primary/50 focus:ring-1 focus:ring-ventsafe-primary/50 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium text-ventsafe-foreground/70">Email Address</label>
                    <input 
                      id="email"
                      required
                      type="email" 
                      placeholder="john@example.com"
                      className="w-full px-4 py-3 bg-ventsafe-background border border-ventsafe-border rounded-lg text-ventsafe-foreground placeholder:text-ventsafe-foreground/30 focus:outline-none focus:border-ventsafe-primary/50 focus:ring-1 focus:ring-ventsafe-primary/50 transition-all"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="subject" className="text-sm font-medium text-ventsafe-foreground/70">Subject</label>
                  <input 
                    id="subject"
                    required
                    type="text" 
                    placeholder="How can we help?"
                    className="w-full px-4 py-3 bg-ventsafe-background border border-ventsafe-border rounded-lg text-ventsafe-foreground placeholder:text-ventsafe-foreground/30 focus:outline-none focus:border-ventsafe-primary/50 focus:ring-1 focus:ring-ventsafe-primary/50 transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="message" className="text-sm font-medium text-ventsafe-foreground/70">Message</label>
                  <textarea 
                    id="message"
                    required
                    rows={5}
                    placeholder="Write your message here..."
                    className="w-full px-4 py-3 bg-ventsafe-background border border-ventsafe-border rounded-lg text-ventsafe-foreground placeholder:text-ventsafe-foreground/30 focus:outline-none focus:border-ventsafe-primary/50 focus:ring-1 focus:ring-ventsafe-primary/50 transition-all resize-none"
                  />
                </div>

                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 bg-ventsafe-primary hover:bg-ventsafe-primary/90 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none group shadow-sm shadow-ventsafe-primary/30"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      Send Message <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
