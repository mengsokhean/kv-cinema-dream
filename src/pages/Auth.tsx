import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Mail, KeyRound, Sparkles, Chrome, User, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

type AuthTab = "password" | "magic-link" | "otp";

const Auth = () => {
  const [searchParams] = useSearchParams();
  const [isSignUp, setIsSignUp] = useState(searchParams.get("mode") === "signup");
  const [activeTab, setActiveTab] = useState<AuthTab>("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);

  // បន្ថែមតែ First Name និង Last Name
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const { user, loading: authLoading, signIn, signUp, signInWithMagicLink, signInWithOtp, verifyOtp } = useAuth();
  const { lang, t } = useLanguage();
  const isKhmer = lang === "kh";
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate("/", { replace: true });
  }, [user, navigate]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
          <p className="text-sm text-muted-foreground">{t.loading}</p>
        </div>
      </div>
    );
  }

  const validateEmail = (val: string) => {
    if (!val.trim()) return "";
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim()) ? "" : "Email មិនត្រឹមត្រូវ";
  };

  const validatePassword = (val: string) => {
    if (!val) return "";
    // បន្ធូរបន្ថយមកត្រឹម ៦ ខ្ទង់ជា Standard របស់ Supabase
    return val.length < 6 ? "Password ត្រូវមានយ៉ាងតិច ៦ ខ្ទង់" : "";
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const eErr = validateEmail(email);
    const pErr = validatePassword(password);
    setEmailError(eErr);
    setPasswordError(pErr);

    if (eErr || pErr || !email.trim() || !password.trim()) return;

    setLoading(true);
    try {
      if (isSignUp) {
        // បញ្ជូនទិន្នន័យឈ្មោះទៅកាន់ Supabase Auth
        const { emailConfirmationRequired } = await signUp(email.trim(), password, {
          full_name: `${firstName.trim()} ${lastName.trim()}`.trim(),
        });
        toast.success(emailConfirmationRequired ? t.accountCreatedConfirm : t.accountCreatedSignedIn);
        if (!emailConfirmationRequired) navigate("/");
      } else {
        await signIn(email.trim(), password);
        toast.success(t.welcomeBack + "!");
        navigate("/");
      }
    } catch (err: any) {
      toast.error(err.message || "មានបញ្ហាអ្វីមួយបានកើតឡើង");
    } finally {
      setLoading(false);
    }
  };

  const tabs: { key: AuthTab; label: string; icon: React.ReactNode }[] = [
    { key: "password", label: t.emailPassword, icon: <KeyRound className="h-4 w-4" /> },
    { key: "magic-link", label: t.magicLink, icon: <Sparkles className="h-4 w-4" /> },
    { key: "otp", label: t.emailCode, icon: <Mail className="h-4 w-4" /> },
  ];

  if (showForgot) {
    return (
      <div className={`min-h-screen flex items-center justify-center px-4 ${isKhmer ? "font-khmer" : ""}`}>
        <div className="w-full max-w-sm space-y-8">
          <div className="text-center">
            <img src="/favicon.png" alt="KV Movies" className="h-16 w-16 rounded-full mx-auto mb-4" />
            <h2 className="font-display text-2xl">{t.resetPassword}</h2>
          </div>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setForgotLoading(true);
              const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail.trim());
              if (error) toast.error(error.message);
              else {
                toast.success("ពិនិត្យ Email របស់អ្នក");
                setShowForgot(false);
              }
              setForgotLoading(false);
            }}
            className="space-y-4"
          >
            <Input
              type="email"
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              placeholder="Email"
              required
            />
            <Button type="submit" className="w-full gradient-gold font-semibold" disabled={forgotLoading}>
              {forgotLoading ? t.sending : t.sendResetLink}
            </Button>
          </form>
          <button onClick={() => setShowForgot(false)} className="w-full text-sm text-gold">
            {t.backToSignIn}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex items-center justify-center px-4 ${isKhmer ? "font-khmer" : ""}`}>
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <img src="/favicon.png" alt="KV Movies" className="h-16 w-16 rounded-full mx-auto mb-4" />
          <h2 className="font-display text-2xl">{isSignUp ? t.createAccount : t.welcomeBack}</h2>
        </div>

        {/* Form ចុះឈ្មោះ ឬចូលប្រើ */}
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          {isSignUp && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>First Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="First"
                    className="pl-9"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Last Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Last"
                    className="pl-9"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>Email</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required />
          </div>

          <div className="space-y-2">
            <Label>Password</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min 6 characters"
              required
            />
            {passwordError && <p className="text-xs text-destructive">{passwordError}</p>}
            {isSignUp && <p className="text-xs text-muted-foreground">Password example: yourname123 (letters + numbers, min 6)</p>}
          </div>

          {!isSignUp && (
            <div className="text-right">
              <button type="button" onClick={() => setShowForgot(true)} className="text-xs text-gold">
                {t.forgotPassword}
              </button>
            </div>
          )}

          <Button type="submit" className="w-full gradient-gold font-bold" disabled={loading}>
            {loading ? t.loading : isSignUp ? t.signUp : t.signIn}
          </Button>

          <p className="text-center text-sm">
            {isSignUp ? t.alreadyHaveAccount : t.dontHaveAccount}{" "}
            <button type="button" onClick={() => setIsSignUp(!isSignUp)} className="text-gold font-bold underline">
              {isSignUp ? t.signIn : t.signUp}
            </button>
          </p>
        </form>

        <div className="relative flex items-center gap-4">
          <div className="flex-1 border-t border-muted" />
          <span className="text-xs text-muted-foreground">OR</span>
          <div className="flex-1 border-t border-muted" />
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full flex items-center gap-2"
          onClick={async () => {
            const { error } = await lovable.auth.signInWithOAuth("google", {
              redirect_uri: window.location.origin,
            });
            if (error) toast.error(error.message || "Google sign-in failed");
          }}
        >
          <Chrome className="h-5 w-5" />
          Continue with Google
        </Button>
      </div>
    </div>
  );
};

export default Auth;
