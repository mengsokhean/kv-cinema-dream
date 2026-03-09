import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { Film, Facebook, MessageCircle, Mail } from "lucide-react";

const Footer = () => {
  const { lang, t } = useLanguage();
  const isKhmer = lang === "kh";

  return (
    <footer className={`border-t border-border bg-card/50 mt-16 ${isKhmer ? "font-khmer" : ""}`}>
      <div className="container mx-auto px-4 py-12">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <img src="/favicon.png" alt="KV Movies" className="h-8 w-8 rounded-full" />
              <span className="font-display text-xl tracking-wider text-foreground">
                KV<span className="text-gold">MOVIES</span>
              </span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              {lang === "en"
                ? "Cambodia's premier movie streaming platform. Watch unlimited HD & 4K content anytime, anywhere."
                : "វេទិកាស្ទ្រីមភាពយន្តឈានមុខគេរបស់កម្ពុជា។ មើលមាតិកា HD និង 4K គ្មានដែនកំណត់គ្រប់ពេល។"}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-sm uppercase tracking-wider mb-4 text-foreground">
              {lang === "en" ? "Quick Links" : "តំណភ្ជាប់រហ័ស"}
            </h4>
            <ul className="space-y-2.5">
              <li><Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t.home}</Link></li>
              <li><Link to="/movies" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t.movies}</Link></li>
              <li><Link to="/pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t.pricing}</Link></li>
              <li><Link to="/watchlist" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t.watchlist}</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold text-sm uppercase tracking-wider mb-4 text-foreground">
              {lang === "en" ? "Company" : "ក្រុមហ៊ុន"}
            </h4>
            <ul className="space-y-2.5">
              <li><Link to="/about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t.aboutUs}</Link></li>
              <li><Link to="/contact" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t.contactUs}</Link></li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h4 className="font-semibold text-sm uppercase tracking-wider mb-4 text-foreground">
              {t.followUs}
            </h4>
            <div className="flex gap-3">
              <a href="#" className="w-9 h-9 rounded-lg bg-gold/10 hover:bg-gold/20 flex items-center justify-center transition-colors">
                <Facebook className="h-4 w-4 text-gold" />
              </a>
              <a href="#" className="w-9 h-9 rounded-lg bg-gold/10 hover:bg-gold/20 flex items-center justify-center transition-colors">
                <MessageCircle className="h-4 w-4 text-gold" />
              </a>
              <a href="#" className="w-9 h-9 rounded-lg bg-gold/10 hover:bg-gold/20 flex items-center justify-center transition-colors">
                <Mail className="h-4 w-4 text-gold" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-border mt-10 pt-6 text-center">
          <p className="text-xs text-muted-foreground">
            © 2026 kvmovies.net — {t.allRightsReserved}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
