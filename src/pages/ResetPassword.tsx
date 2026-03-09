import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Film, KeyRound } from "lucide-react";
import { toast } from "sonner";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);
  const navigate = useNavigate();
  const { lang, t } = useLanguage();
  const isKhmer = lang === "kh";

  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    if (hashParams.get("type") === "recovery") {
      setIsRecovery(true);
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsRecovery(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error(t.passwordsNoMatch);
      return;
    }
    if (password.length < 6) {
      toast.error(t.passwordMinLength);
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success(t.passwordUpdated);
      navigate("/");
    } catch (err: any) {
      toast.error(err.message || t.failedUpdatePassword);
    } finally {
      setLoading(false);
    }
  };

  if (!isRecovery) {
    return (
      <div className={`min-h-screen flex items-center justify-center px-4 ${isKhmer ? "font-khmer" : ""}`}>
        <div className="w-full max-w-sm text-center space-y-4">
          <Film className="h-8 w-8 text-gold mx-auto" />
          <h2 className="font-display text-2xl">{t.invalidResetLink}</h2>
          <p className="text-sm text-muted-foreground">{t.invalidResetLinkDesc}</p>
          <Button variant="outline" onClick={() => navigate("/auth")}>
            {t.backToSignIn}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex items-center justify-center px-4 ${isKhmer ? "font-khmer" : ""}`}>
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <img src="/favicon.png" alt="KV Movies" className="h-8 w-8 rounded-md" />
            <span className="font-display text-3xl tracking-wider">
              KV<span className="text-gold">MOVIES</span>
            </span>
          </div>
          <h2 className="font-display text-2xl flex items-center justify-center gap-2">
            <KeyRound className="h-5 w-5" /> {t.setNewPassword}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">{t.newPassword}</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              minLength={6}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">{t.confirmPassword}</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              minLength={6}
              required
            />
          </div>
          <Button type="submit" className="w-full gradient-gold text-primary-foreground font-semibold" disabled={loading}>
            {loading ? t.updating : t.updatePassword}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
