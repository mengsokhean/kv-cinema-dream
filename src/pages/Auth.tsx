import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Film, Mail, KeyRound, Sparkles, Chrome, User, Phone } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

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
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  
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
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim()) ? "" : "Please enter a valid email address";
  };

  const validatePassword = (val: string) => {
    if (!val) return "";
    return val.length < 1 ? "Password is required" : "";
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
        const { emailConfirmationRequired } = await signUp(email.trim(), password, {
          full_name: fullName.trim() || undefined,
          username: username.trim() || undefined,
          phone_number: phoneNumber.trim() || undefined,
          
        });
        toast.success(emailConfirmationRequired ? t.accountCreatedConfirm : t.accountCreatedSignedIn);
        navigate("/");
      } else {
        await signIn(email.trim(), password);
        toast.success(t.welcomeBack + "!");
        navigate("/");
      }
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    const eErr = validateEmail(email);
    setEmailError(eErr);
    if (eErr || !email.trim()) return;
    setLoading(true);
    try {
      await signInWithMagicLink(email.trim());
      toast.success(t.magicLinkSent);
    } catch (err: any) {
      toast.error(err.message || "Failed to send magic link");
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const eErr = validateEmail(email);
    setEmailError(eErr);
    if (eErr || !email.trim()) return;
    setLoading(true);
    try {
      await signInWithOtp(email.trim());
      setOtpSent(true);
      toast.success(t.codeSent);
    } catch (err: any) {
      toast.error(err.message || "Failed to send code");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length !== 6) return;
    setLoading(true);
    try {
      await verifyOtp(email.trim(), otpCode);
      toast.success(t.welcome);
      navigate("/");
    } catch (err: any) {
      toast.error(err.message || "Invalid code");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) return;
    setForgotLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast.success(t.checkEmailReset);
      setShowForgot(false);
      setForgotEmail("");
    } catch (err: any) {
      toast.error(err.message || "Failed to send reset email");
    } finally {
      setForgotLoading(false);
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
            <div className="flex items-center justify-center mb-4">
              <img src="/favicon.png" alt="KV Movies" className="h-16 w-16 rounded-full" />
            </div>
            <h2 className="font-display text-2xl">{t.resetPassword}</h2>
            <p className="text-sm text-muted-foreground mt-2">{t.resetPasswordDesc}</p>
          </div>
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="forgot-email">{t.email}</Label>
              <Input id="forgot-email" type="email" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} placeholder="you@example.com" required />
            </div>
            <Button type="submit" className="w-full gradient-gold text-primary-foreground font-semibold" disabled={forgotLoading}>
              {forgotLoading ? t.sending : t.sendResetLink}
            </Button>
          </form>
          <p className="text-center text-sm text-muted-foreground">
            <button onClick={() => setShowForgot(false)} className="text-gold hover:underline">{t.backToSignIn}</button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex items-center justify-center px-4 ${isKhmer ? "font-khmer" : ""}`}>
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <img src="/favicon.png" alt="KV Movies" className="h-16 w-16 rounded-full" />
            </div>
          <h2 className="font-display text-2xl">
            {activeTab === "password" ? (isSignUp ? t.createAccount : t.welcomeBack) : t.signIn}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {activeTab === "password"
              ? t.useEmailPassword
              : activeTab === "magic-link"
              ? t.emailSignInLink
              : t.emailDigitCode}
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex rounded-lg border border-border p-1 gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); setOtpSent(false); setOtpCode(""); }}
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium transition-all ${
                activeTab === tab.key
                  ? "bg-gold/15 text-gold border border-gold/30"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Email / Password Form */}
        {activeTab === "password" && (
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            {isSignUp && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="fullName">{t.fullName}</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="John Doe" className="pl-9" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username">{t.username}</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="johndoe123" className="pl-9" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">{t.phoneNumber}</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="phoneNumber" type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="+855 12 345 678" className="pl-9" />
                  </div>
                </div>
              </>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">{t.email}</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setEmailError(""); }}
                onBlur={() => setEmailError(validateEmail(email))}
                placeholder="you@example.com"
                required
                className={emailError ? "border-destructive" : ""}
              />
              {emailError && <p className="text-sm text-destructive">{emailError}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t.password}</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setPasswordError(""); }}
                onBlur={() => setPasswordError(validatePassword(password))}
                placeholder="••••••••"
                minLength={6}
                required
                className={passwordError ? "border-destructive" : ""}
              />
              {passwordError && <p className="text-sm text-destructive">{passwordError}</p>}
            </div>
            {!isSignUp && (
              <div className="text-right">
                <button type="button" onClick={() => setShowForgot(true)} className="text-xs text-gold hover:underline">
                  {t.forgotPassword}
                </button>
              </div>
            )}
            <Button type="submit" className="w-full gradient-gold text-primary-foreground font-semibold" disabled={loading || !!emailError || !!passwordError}>
              {loading ? t.loading : isSignUp ? t.signUp : t.signIn}
            </Button>
            <div className="relative flex items-center my-2">
              <div className="flex-1 border-t border-border" />
              <span className="px-3 text-xs text-muted-foreground">{t.or}</span>
              <div className="flex-1 border-t border-border" />
            </div>
            <Button
              type="button"
              variant="outline"
              className="w-full gap-2"
              disabled={loading}
              onClick={async () => {
                setLoading(true);
                try {
                  const { error } = await supabase.auth.signInWithOAuth({
                    provider: 'google',
                    options: {
                      redirectTo: window.location.origin,
                      queryParams: { prompt: "select_account" },
                    },
                  });
                  if (error) throw error;
                } catch (err: any) {
                  toast.error(err.message || "Google sign-in failed");
                } finally {
                  setLoading(false);
                }
              }}
            >
              <Chrome className="h-4 w-4" /> {t.continueWithGoogle}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              {isSignUp ? t.alreadyHaveAccount : t.dontHaveAccount}{" "}
              <button onClick={() => setIsSignUp(!isSignUp)} className="text-gold hover:underline">
                {isSignUp ? t.signIn : t.signUp}
              </button>
            </p>
          </form>
        )}

        {/* Magic Link Form */}
        {activeTab === "magic-link" && (
          <form onSubmit={handleMagicLink} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="magic-email">{t.email}</Label>
              <Input
                id="magic-email"
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setEmailError(""); }}
                onBlur={() => setEmailError(validateEmail(email))}
                placeholder="you@example.com"
                required
                className={emailError ? "border-destructive" : ""}
              />
              {emailError && <p className="text-sm text-destructive">{emailError}</p>}
            </div>
            <Button type="submit" className="w-full gradient-gold text-primary-foreground font-semibold" disabled={loading || !!emailError}>
              {loading ? t.sending : t.sendMagicLink}
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              {t.noPasswordNeeded}
            </p>
          </form>
        )}

        {/* OTP Form */}
        {activeTab === "otp" && (
          <>
            {!otpSent ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="otp-email">{t.email}</Label>
                  <Input
                    id="otp-email"
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setEmailError(""); }}
                    onBlur={() => setEmailError(validateEmail(email))}
                    placeholder="you@example.com"
                    required
                    className={emailError ? "border-destructive" : ""}
                  />
                  {emailError && <p className="text-sm text-destructive">{emailError}</p>}
                </div>
                <Button type="submit" className="w-full gradient-gold text-primary-foreground font-semibold" disabled={loading || !!emailError}>
                  {loading ? t.sending : t.sendCode}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-5">
                <div className="text-center space-y-2">
                  <p className="text-sm text-muted-foreground">{t.enterCode}</p>
                  <p className="text-sm font-medium text-gold">{email}</p>
                </div>
                <div className="flex justify-center">
                  <InputOTP maxLength={6} value={otpCode} onChange={setOtpCode}>
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                <Button type="submit" className="w-full gradient-gold text-primary-foreground font-semibold" disabled={loading || otpCode.length !== 6}>
                  {loading ? t.verifying : t.verifySignIn}
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                  {t.didntReceive}{" "}
                  <button type="button" onClick={() => { setOtpSent(false); setOtpCode(""); }} className="text-gold hover:underline">
                    {t.resendCode}
                  </button>
                </p>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Auth;
