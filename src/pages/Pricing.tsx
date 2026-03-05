import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Crown, Check, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const plans = [
  {
    name: "Monthly",
    price: "$4.99",
    period: "month",
    features: ["HD Streaming", "All Movies", "Cancel Anytime", "1 Device"],
    duration_days: 30,
  },
  {
    name: "Yearly",
    price: "$39.99",
    period: "year",
    popular: true,
    features: ["4K Streaming", "All Movies", "Cancel Anytime", "3 Devices", "Priority Support"],
    duration_days: 365,
  },
];

const Pricing = () => {
  const { user, profile, refreshProfile } = useAuth();
  const [processing, setProcessing] = useState<string | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<"aba" | "acleda">("aba");
  const navigate = useNavigate();

  const handlePayment = async (plan: typeof plans[0]) => {
    if (!user) {
      navigate("/auth");
      return;
    }
    setProcessing(plan.name);
    try {
      const { data, error } = await supabase.functions.invoke("simulate-payment", {
        body: {
          user_id: user.id,
          plan_name: plan.name,
          duration_days: plan.duration_days,
          payment_method: selectedPayment,
        },
      });
      if (error) throw error;
      await refreshProfile();
      toast.success("Payment successful! You're now a Premium member 🎬");
    } catch (err: any) {
      toast.error(err.message || "Payment failed. Please try again.");
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="container mx-auto px-4 pt-24 pb-16 max-w-4xl">
        <div className="text-center mb-12">
          <span className="inline-flex items-center gap-1.5 text-xs gradient-gold text-primary-foreground px-3 py-1 rounded-full font-semibold mb-4">
            <Crown className="h-3 w-3" /> Premium Plans
          </span>
          <h1 className="font-display text-4xl md:text-5xl tracking-wide mb-3">
            Unlock <span className="text-gold">Everything</span>
          </h1>
          <p className="text-muted-foreground">Choose your plan and enjoy unlimited premium content.</p>
        </div>

        {profile?.is_premium && (
          <div className="text-center mb-8 p-4 rounded-lg border border-gold/30 bg-gold/5">
            <p className="text-gold font-semibold">✨ You're already a Premium member!</p>
            {profile.subscription_expiry && (
              <p className="text-sm text-muted-foreground mt-1">
                Expires: {new Date(profile.subscription_expiry).toLocaleDateString()}
              </p>
            )}
          </div>
        )}

        {/* Payment Method Selector */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <button
            onClick={() => setSelectedPayment("aba")}
            className={`px-6 py-3 rounded-lg border text-sm font-semibold transition-all ${
              selectedPayment === "aba"
                ? "border-gold bg-gold/10 text-gold"
                : "border-border bg-card text-muted-foreground hover:border-gold/30"
            }`}
          >
            ABA Pay (KHQR)
          </button>
          <button
            onClick={() => setSelectedPayment("acleda")}
            className={`px-6 py-3 rounded-lg border text-sm font-semibold transition-all ${
              selectedPayment === "acleda"
                ? "border-gold bg-gold/10 text-gold"
                : "border-border bg-card text-muted-foreground hover:border-gold/30"
            }`}
          >
            ACLEDA Bank
          </button>
        </div>

        {/* Plans */}
        <div className="grid md:grid-cols-2 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-xl p-6 border transition-all ${
                plan.popular
                  ? "border-gold/50 bg-gold/5 shadow-[0_0_40px_-15px_hsl(45_100%_51%/0.3)]"
                  : "border-border bg-card"
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] gradient-gold text-primary-foreground px-3 py-1 rounded-full font-bold uppercase tracking-wider">
                  Most Popular
                </span>
              )}
              <h3 className="font-display text-2xl tracking-wide mb-1">{plan.name}</h3>
              <div className="mb-4">
                <span className="text-3xl font-bold text-gold">{plan.price}</span>
                <span className="text-muted-foreground text-sm">/{plan.period}</span>
              </div>
              <ul className="space-y-2 mb-6">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-foreground/80">
                    <Check className="h-4 w-4 text-gold" /> {f}
                  </li>
                ))}
              </ul>
              <Button
                className={`w-full font-semibold ${
                  plan.popular ? "gradient-gold text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}
                onClick={() => handlePayment(plan)}
                disabled={!!processing}
              >
                {processing === plan.name ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  `Pay with ${selectedPayment === "aba" ? "ABA (KHQR)" : "ACLEDA"}`
                )}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Pricing;
