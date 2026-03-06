import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Crown, LogOut, User, Film, Shield, Menu, X, Bookmark } from "lucide-react";

const Navbar = () => {
  const { user, profile, signOut } = useAuth();
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

  const navTo = (path: string) => {
    navigate(path);
    closeMobile();
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass">
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <Link to="/" className="flex items-center gap-2" onClick={closeMobile}>
          <Film className="h-7 w-7 text-gold" />
          <span className="font-display text-2xl tracking-wider text-foreground">
            KV<span className="text-gold">MOVIES</span>
          </span>
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-6">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Home</Link>
          <Link to="/movies" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Movies</Link>
          <Link to="/pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Pricing</Link>
        </div>

        {/* Desktop actions */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <>
              {profile?.is_premium && (
                <span className="flex items-center gap-1 text-xs gradient-gold text-primary-foreground px-2 py-1 rounded-full font-semibold">
                  <Crown className="h-3 w-3" /> Premium
                </span>
              )}
              {isAdmin && (
                <Button variant="ghost" size="icon" onClick={() => navigate("/admin")} title="Admin Dashboard">
                  <Shield className="h-4 w-4" />
                </Button>
              )}
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
              <Button variant="ghost" size="sm" onClick={() => navigate("/auth")}>
                Sign In
              </Button>
              <Button size="sm" className="gradient-gold text-primary-foreground font-semibold" onClick={() => navigate("/auth?mode=signup")}>
                Sign Up
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
            <div className="container mx-auto px-4 py-4 space-y-1">
              <button onClick={() => navTo("/")} className="w-full text-left px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
                Home
              </button>
              <button onClick={() => navTo("/movies")} className="w-full text-left px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
                Movies
              </button>
              <button onClick={() => navTo("/pricing")} className="w-full text-left px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
                Pricing
              </button>

              <div className="border-t border-border my-2" />

              {user ? (
                <>
                  {profile?.is_premium && (
                    <div className="px-3 py-2">
                      <span className="flex items-center gap-1 text-xs gradient-gold text-primary-foreground px-2 py-1 rounded-full font-semibold w-fit">
                        <Crown className="h-3 w-3" /> Premium
                      </span>
                    </div>
                  )}
                  <button onClick={() => navTo("/profile")} className="w-full text-left px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors flex items-center gap-2">
                    {profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt="Avatar" className="h-6 w-6 rounded-full object-cover" />
                    ) : (
                      <User className="h-4 w-4" />
                    )}
                    Profile
                  </button>
                  {isAdmin && (
                    <button onClick={() => navTo("/admin")} className="w-full text-left px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors flex items-center gap-2">
                      <Shield className="h-4 w-4" /> Admin
                    </button>
                  )}
                  <button
                    onClick={() => { signOut(); closeMobile(); }}
                    className="w-full text-left px-3 py-2.5 rounded-lg text-sm text-destructive hover:bg-destructive/10 transition-colors flex items-center gap-2"
                  >
                    <LogOut className="h-4 w-4" /> Sign Out
                  </button>
                </>
              ) : (
                <div className="flex gap-2 px-3 pt-1">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => navTo("/auth")}>
                    Sign In
                  </Button>
                  <Button size="sm" className="flex-1 gradient-gold text-primary-foreground font-semibold" onClick={() => navTo("/auth?mode=signup")}>
                    Sign Up
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
