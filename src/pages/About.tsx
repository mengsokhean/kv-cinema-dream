import Navbar from "@/components/Navbar";
import { useLanguage } from "@/contexts/LanguageContext";
import { Film, Target, Eye, Sparkles, DollarSign, Globe, ShieldCheck } from "lucide-react";

const About = () => {
  const { t } = useLanguage();

  const reasons = [
    { icon: Sparkles, title: t.reason1Title, desc: t.reason1Desc },
    { icon: DollarSign, title: t.reason2Title, desc: t.reason2Desc },
    { icon: Globe, title: t.reason3Title, desc: t.reason3Desc },
    { icon: ShieldCheck, title: t.reason4Title, desc: t.reason4Desc },
  ];

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="container mx-auto px-4 pt-24 pb-16 max-w-4xl">
        {/* Hero */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 mb-4">
            <Film className="h-8 w-8 text-gold" />
            <span className="font-display text-3xl tracking-wider">
              KV<span className="text-gold">MOVIES</span>
            </span>
          </div>
          <h1 className="font-display text-4xl md:text-5xl tracking-wide mb-3">{t.aboutTitle}</h1>
          <p className="text-lg text-gold font-medium">{t.aboutSubtitle}</p>
        </div>

        {/* Description */}
        <div className="space-y-4 text-muted-foreground leading-relaxed mb-16 max-w-3xl mx-auto">
          <p>{t.aboutDesc1}</p>
          <p>{t.aboutDesc2}</p>
        </div>

        {/* Mission & Vision */}
        <div className="grid md:grid-cols-2 gap-6 mb-16">
          <div className="rounded-xl border border-border bg-card p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg gradient-gold flex items-center justify-center">
                <Target className="h-5 w-5 text-primary-foreground" />
              </div>
              <h2 className="font-display text-2xl tracking-wide">{t.ourMission}</h2>
            </div>
            <p className="text-muted-foreground leading-relaxed">{t.missionText}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg gradient-gold flex items-center justify-center">
                <Eye className="h-5 w-5 text-primary-foreground" />
              </div>
              <h2 className="font-display text-2xl tracking-wide">{t.ourVision}</h2>
            </div>
            <p className="text-muted-foreground leading-relaxed">{t.visionText}</p>
          </div>
        </div>

        {/* Why Choose Us */}
        <div className="mb-16">
          <h2 className="font-display text-3xl tracking-wide text-center mb-8">{t.whyChooseUs}</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {reasons.map((r) => (
              <div key={r.title} className="rounded-xl border border-border bg-card p-6 hover:border-gold/30 transition-colors">
                <r.icon className="h-8 w-8 text-gold mb-3" />
                <h3 className="font-semibold text-lg mb-1">{r.title}</h3>
                <p className="text-sm text-muted-foreground">{r.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          © 2026 kvmovies.net — {t.allRightsReserved}
        </div>
      </footer>
    </div>
  );
};

export default About;
