import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Play, Crown, Search } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import heroBg from "@/assets/hero-bg.jpg";

const HeroBanner = () => {
  const navigate = useNavigate();
  const { lang, t } = useLanguage();
  const [query, setQuery] = useState("");
  const isKhmer = lang === "kh";

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/movies?search=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <section className={`relative h-[85vh] flex items-end overflow-hidden ${isKhmer ? "font-khmer" : ""}`}>
      <img
        src={heroBg}
        alt="KVMovies cinema"
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-background/80 to-transparent" />

      <div className="relative container mx-auto px-4 pb-20 max-w-3xl">
        <span className="inline-flex items-center gap-1.5 text-xs gradient-gold text-primary-foreground px-3 py-1 rounded-full font-semibold mb-4">
          <Crown className="h-3 w-3" /> {t.premiumStreaming}
        </span>
        <h1 className="font-display text-5xl md:text-7xl leading-tight tracking-wide mb-4">
          {t.unlimitedMovies} <br />
          <span className="text-gold">{t.anytime}</span>
        </h1>
        <p className="text-muted-foreground text-lg mb-6 max-w-lg">
          {t.heroDesc}
        </p>

        <form onSubmit={handleSearch} className="flex items-center gap-2 mb-8 max-w-lg">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full h-11 pl-10 pr-4 rounded-lg bg-card/80 backdrop-blur-sm border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/30 transition-all"
            />
          </div>
          <Button
            type="submit"
            size="default"
            className="gradient-gold text-primary-foreground font-semibold h-11 px-5"
          >
            {t.search}
          </Button>
        </form>

        <div className="flex gap-3">
          <Button
            size="lg"
            className="gradient-gold text-primary-foreground font-semibold gap-2"
            onClick={() => navigate("/movies")}
          >
            <Play className="h-4 w-4" /> {t.browseMovies}
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="border-border text-foreground hover:bg-secondary"
            onClick={() => navigate("/pricing")}
          >
            {t.viewPlans}
          </Button>
        </div>
      </div>
    </section>
  );
};

export default HeroBanner;
