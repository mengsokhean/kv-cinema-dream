import { useState } from "react";
import Navbar from "@/components/Navbar";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Phone, MapPin, Clock, Send, Loader2, Facebook, MessageCircle } from "lucide-react";
import { toast } from "sonner";

const Contact = () => {
  const { t } = useLanguage();
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    // Simulate send delay
    await new Promise((r) => setTimeout(r, 1500));
    setSending(false);
    toast.success(t.messageSent);
    setForm({ name: "", email: "", subject: "", message: "" });
  };

  const contactInfo = [
    { icon: Mail, label: t.email, value: "support@kvmovies.net" },
    { icon: Phone, label: t.phone, value: "+855 12 345 678" },
    { icon: MapPin, label: t.address, value: "Phnom Penh, Cambodia" },
    { icon: Clock, label: t.workingHours, value: t.workingHoursValue },
  ];

  const faqs = [
    { q: t.faq1Q, a: t.faq1A },
    { q: t.faq2Q, a: t.faq2A },
    { q: t.faq3Q, a: t.faq3A },
  ];

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="container mx-auto px-4 pt-24 pb-16 max-w-5xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="font-display text-4xl md:text-5xl tracking-wide mb-3">{t.contactTitle}</h1>
          <p className="text-lg text-gold font-medium mb-2">{t.contactSubtitle}</p>
          <p className="text-muted-foreground max-w-xl mx-auto">{t.contactDesc}</p>
        </div>

        <div className="grid lg:grid-cols-5 gap-8 mb-16">
          {/* Contact Form */}
          <div className="lg:col-span-3">
            <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-card p-6 md:p-8 space-y-5">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">{t.yourName}</label>
                  <Input
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">{t.yourEmail}</label>
                  <Input
                    required
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="john@example.com"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">{t.subject}</label>
                <Input
                  required
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  placeholder="How can we help?"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">{t.message}</label>
                <Textarea
                  required
                  rows={5}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder="Tell us more..."
                />
              </div>
              <Button
                type="submit"
                disabled={sending}
                className="w-full gradient-gold text-primary-foreground font-semibold"
              >
                {sending ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-2" /> {t.sending}</>
                ) : (
                  <><Send className="h-4 w-4 mr-2" /> {t.sendMessage}</>
                )}
              </Button>
            </form>
          </div>

          {/* Contact Info Sidebar */}
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="font-display text-xl tracking-wide mb-4">{t.getInTouch}</h3>
              <div className="space-y-4">
                {contactInfo.map((item) => (
                  <div key={item.label} className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-gold/10 flex items-center justify-center shrink-0 mt-0.5">
                      <item.icon className="h-4 w-4 text-gold" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{item.label}</p>
                      <p className="text-sm font-medium">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="font-display text-xl tracking-wide mb-4">{t.followUs}</h3>
              <div className="flex gap-3">
                <a href="#" className="w-10 h-10 rounded-lg bg-gold/10 hover:bg-gold/20 flex items-center justify-center transition-colors">
                  <Facebook className="h-4 w-4 text-gold" />
                </a>
                <a href="#" className="w-10 h-10 rounded-lg bg-gold/10 hover:bg-gold/20 flex items-center justify-center transition-colors">
                  <MessageCircle className="h-4 w-4 text-gold" />
                </a>
                <a href="#" className="w-10 h-10 rounded-lg bg-gold/10 hover:bg-gold/20 flex items-center justify-center transition-colors">
                  <Mail className="h-4 w-4 text-gold" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="max-w-3xl mx-auto">
          <h2 className="font-display text-3xl tracking-wide text-center mb-8">{t.faq}</h2>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-5">
                <h4 className="font-semibold mb-2">{faq.q}</h4>
                <p className="text-sm text-muted-foreground">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <footer className="border-t border-border py-8 mt-12">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          © 2026 kvmovies.net — {t.allRightsReserved}
        </div>
      </footer>
    </div>
  );
};

export default Contact;
