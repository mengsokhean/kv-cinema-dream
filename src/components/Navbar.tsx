import { useState } from "react";
import kvLogo from "@/assets/kv-logo.png";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useWatchlist } from "@/hooks/useWatchlist";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Crown, LogOut, User, Film, Shield, Menu, X, Bookmark, Sun, Moon, Globe } from "lucide-react";

const Navbar = () => {
  const { user, profile, signOut } = useAuth();
  const { watchlistIds } = useWatchlist();
  const { lang, setLang, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const watchlistCount = user ? watchlistIds.length : 0;
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const { data: isAdmin } = useQuery({
    queryKey: ["isAdmin", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user!.id)
        .eq("role", "admin")
        .maybeSingle();
      return !!data;
    },
  });

  const closeMobile = () => setMobileOpen(false);
  const navTo = (path: string) => { navigate(path); closeMobile(); };
  const isKhmer = lang === "kh";

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass">
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <Link to="/" className="flex items-center gap-2" onClick={closeMobile}>
          <img src={kvLogo} alt="KV Movies" className="h-9 w-9 rounded-full" />
          <span className="font-display text-lg tracking-wider hidden sm:inline">
            KV<span className="text-gold">MOVIES</span>
          </span>
        </Link>

        {/* Desktop nav links */}
        <div className={`hidden md:flex items-center gap-6 ${isKhmer ? "font-khmer" : ""}`}>
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t.home}</Link>
          <Link to="/movies" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t.movies}</Link>
          <Link to="/pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t.pricing}</Link>
          <Link to="/about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t.aboutUs}</Link>
          <Link to="/contact" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t.contactUs}</Link>
        </div>

        {/* Desktop actions */}
        <div className="hidden md:flex items-center gap-2">
          {/* Theme toggle */}
          <Button variant="ghost" size="icon" onClick={toggleTheme} title={theme === "dark" ? t.lightMode : t.darkMode}>
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          {/* Language toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLang(lang === "en" ? "kh" : "en")}
            className={`text-xs font-semibold gap-1 ${isKhmer ? "font-khmer" : ""}`}
          >
            <Globe className="h-3.5 w-3.5" />
            {lang === "en" ? "EN" : "ខ្មែរ"}
          </Button>

          {user ? (
            <>
              {profile?.is_premium && (
                <span className="flex items-center gap-1 text-xs gradient-gold text-primary-foreground px-2 py-1 rounded-full font-semibold">
                  <Crown className="h-3 w-3" /> {t.premium}
                </span>
              )}
              {isAdmin && (
                <Button variant="ghost" size="icon" onClick={() => navigate("/admin")} title={t.admin}>
                  <Shield className="h-4 w-4" />
                </Button>
              )}
              <Button variant="ghost" size="icon" onClick={() => navigate("/watchlist")} title={t.watchlist} className="relative">
                <Bookmark className="h-4 w-4" />
                {watchlistCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-gold text-primary-foreground text-[10px] font-bold px-1">
                    {watchlistCount > 99 ? "99+" : watchlistCount}
                  </span>
                )}
              </Button>
              <Button variant="ghost" size="icon" className="rounded-full" onClick={() => navigate("/profile")}>
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="Avatar" className="h-8 w-8 rounded-full object-cover" />
                ) : (
                  <User className="h-4 w-4" />
                )}
              </Button>
              <Button variant="ghost" size="icon" onClick={signOut}>
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => navigate("/auth")} className={isKhmer ? "font-khmer" : ""}>
                {t.signIn}
              </Button>
              <Button size="sm" className={`gradient-gold text-primary-foreground font-semibold ${isKhmer ? "font-khmer" : ""}`} onClick={() => navigate("/auth?mode=signup")}>
                {t.signUp}
              </Button>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="md:hidden overflow-hidden border-t border-border bg-background/95 backdrop-blur-md"
          >
            <div className={`container mx-auto px-4 py-4 space-y-1 ${isKhmer ? "font-khmer" : ""}`}>
              <button onClick={() => navTo("/")} className="w-full text-left px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent/10 transition-colors">{t.home}</button>
              <button onClick={() => navTo("/movies")} className="w-full text-left px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent/10 transition-colors">{t.movies}</button>
              <button onClick={() => navTo("/pricing")} className="w-full text-left px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent/10 transition-colors">{t.pricing}</button>
              <button onClick={() => navTo("/about")} className="w-full text-left px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent/10 transition-colors">{t.aboutUs}</button>
              <button onClick={() => navTo("/contact")} className="w-full text-left px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent/10 transition-colors">{t.contactUs}</button>

              {/* Theme & Language toggles */}
              <div className="flex items-center gap-2 px-3 py-2">
                <Button variant="outline" size="sm" onClick={toggleTheme} className="flex-1 gap-1.5">
                  {theme === "dark" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
                  {theme === "dark" ? t.lightMode : t.darkMode}
                </Button>
                <Button variant="outline" size="sm" onClick={() => setLang(lang === "en" ? "kh" : "en")} className={`flex-1 gap-1.5 ${isKhmer ? "font-khmer" : ""}`}>
                  <Globe className="h-3.5 w-3.5" />
                  {lang === "en" ? "EN" : "ខ្មែរ"}
                </Button>
              </div>

              <div className="border-t border-border my-2" />

              {user ? (
                <>
                  {profile?.is_premium && (
                    <div className="px-3 py-2">
                      <span className="flex items-center gap-1 text-xs gradient-gold text-primary-foreground px-2 py-1 rounded-full font-semibold w-fit">
                        <Crown className="h-3 w-3" /> {t.premium}
                      </span>
                    </div>
                  )}
                  <button onClick={() => navTo("/watchlist")} className="w-full text-left px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent/10 transition-colors flex items-center gap-2">
                    <Bookmark className="h-4 w-4" /> {t.watchlist}
                  </button>
                  <button onClick={() => navTo("/profile")} className="w-full text-left px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent/10 transition-colors flex items-center gap-2">
                    {profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt="Avatar" className="h-6 w-6 rounded-full object-cover" />
                    ) : (
                      <User className="h-4 w-4" />
                    )}
                    {t.profile}
                  </button>
                  {isAdmin && (
                    <button onClick={() => navTo("/admin")} className="w-full text-left px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent/10 transition-colors flex items-center gap-2">
                      <Shield className="h-4 w-4" /> {t.admin}
                    </button>
                  )}
                  <button
                    onClick={() => { signOut(); closeMobile(); }}
                    className="w-full text-left px-3 py-2.5 rounded-lg text-sm text-destructive hover:bg-destructive/10 transition-colors flex items-center gap-2"
                  >
                    <LogOut className="h-4 w-4" /> {t.signOut}
                  </button>
                </>
              ) : (
                <div className="flex gap-2 px-3 pt-1">
                  <Button variant="outline" size="sm" className={`flex-1 ${isKhmer ? "font-khmer" : ""}`} onClick={() => navTo("/auth")}>
                    {t.signIn}
                  </Button>
                  <Button size="sm" className={`flex-1 gradient-gold text-primary-foreground font-semibold ${isKhmer ? "font-khmer" : ""}`} onClick={() => navTo("/auth?mode=signup")}>
                    {t.signUp}
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
