import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Crown, LogOut, User, Film, Shield } from "lucide-react";

const Navbar = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

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

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass">
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <Link to="/" className="flex items-center gap-2">
          <Film className="h-7 w-7 text-gold" />
          <span className="font-display text-2xl tracking-wider text-foreground">
            KV<span className="text-gold">MOVIES</span>
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-6">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Home</Link>
          <Link to="/movies" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Movies</Link>
          <Link to="/pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Pricing</Link>
        </div>

        <div className="flex items-center gap-3">
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
      </div>
    </nav>
  );
};

export default Navbar;
