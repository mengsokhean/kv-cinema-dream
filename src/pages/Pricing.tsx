import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Crown, Check, Loader2, QrCode, Clock, CheckCircle2, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

type PaymentStatus = "idle" | "creating" | "pending" | "completed" | "failed";

const Pricing = () => {
  const { user, profile, refreshProfile } = useAuth();
  const { lang, t } = useLanguage();
  const isKhmer = lang === "kh";
  const [selectedPayment, setSelectedPayment] = useState<"aba" | "acleda">("aba");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<{ nameKey: string; price: string; amount: number; period: string; popular?: boolean; featureKeys: string[]; duration_days: number } | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("idle");
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const navigate = useNavigate();

  const plans = [
    {
      nameKey: "planMonthly" as const,
      price: "$4.99",
      amount: 4.99,
      period: t.perMonth,
      featureKeys: ["featureHD", "featureAllMovies", "featureCancelAnytime", "feature1Device"] as const,
      duration_days: 30,
    },
    {
      nameKey: "planYearly" as const,
      price: "$39.99",
      amount: 39.99,
      period: t.perYear,
      popular: true,
      featureKeys: ["feature4K", "featureAllMovies", "featureCancelAnytime", "feature3Devices", "featurePrioritySupport"] as const,
      duration_days: 365,
    },
  ];

  useEffect(() => {
    if (!paymentId || paymentStatus !== "pending") return;
    const channel = supabase
      .channel(`payment-${paymentId}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "payments", filter: `id=eq.${paymentId}` }, async (payload) => {
        const newStatus = payload.new.status;
        if (newStatus === "completed") {
          setPaymentStatus("completed");
          await refreshProfile();
          toast.success(t.welcomePremium);
        } else if (newStatus === "failed") {
          setPaymentStatus("failed");
          toast.error(t.paymentFailedDesc);
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [paymentId, paymentStatus, refreshProfile, t]);

  const handlePayClick = (plan: typeof plans[0]) => {
    if (!user) { navigate("/auth"); return; }
    setSelectedPlan(plan);
    setPaymentStatus("idle");
    setPaymentId(null);
    setModalOpen(true);
  };

  const initiatePayment = useCallback(async () => {
    if (!user || !selectedPlan) return;
    setPaymentStatus("creating");
    try {
      const { data: payment, error: insertError } = await supabase
        .from("payments")
        .insert({
          user_id: user.id,
          plan_name: (t as any)[selectedPlan.nameKey] || selectedPlan.nameKey,
          amount: selectedPlan.amount,
          payment_method: selectedPayment,
          duration_days: selectedPlan.duration_days,
          status: "pending",
        })
        .select()
        .single();
      if (insertError) throw insertError;
      setPaymentId(payment.id);
      setPaymentStatus("pending");
      toast.info(t.checkingPayment);
    } catch (err: any) {
      setPaymentStatus("failed");
      toast.error(err.message || t.paymentFailedDesc);
    }
  }, [user, selectedPlan, selectedPayment, t]);

  const checkManually = useCallback(async () => {
    if (!paymentId) return;
    try {
      const { data, error } = await supabase.from("payments").select("status").eq("id", paymentId).single();
      if (error) throw error;
      if (data?.status === "completed") {
        setPaymentStatus("completed");
        await refreshProfile();
        toast.success(t.welcomePremium);
      } else if (data?.status === "failed") {
        setPaymentStatus("failed");
        toast.error(t.paymentFailedDesc);
      } else {
        toast.info(t.checkingPayment);
      }
    } catch {
      toast.error(t.paymentFailedDesc);
    }
  }, [paymentId, refreshProfile, t]);

  const closeModal = () => {
    setModalOpen(false);
    setPaymentStatus("idle");
    setPaymentId(null);
    setSelectedPlan(null);
  };

  return (
    <div className={`min-h-screen ${isKhmer ? "font-khmer" : ""}`}>
      <Navbar />
      <div className="container mx-auto px-4 pt-24 pb-16 max-w-4xl">
        <div className="text-center mb-12">
          <span className="inline-flex items-center gap-1.5 text-xs gradient-gold text-primary-foreground px-3 py-1 rounded-full font-semibold mb-4">
            <Crown className="h-3 w-3" /> {t.pricingBadge}
          </span>
          <h1 className="font-display text-4xl md:text-5xl tracking-wide mb-3">
            {t.pricingTitle} <span className="text-gold">{t.pricingTitleHighlight}</span>
          </h1>
          <p className="text-muted-foreground">{t.pricingSubtitle}</p>
        </div>

        {profile?.is_premium && (
          <div className="text-center mb-8 p-4 rounded-lg border border-gold/30 bg-gold/5">
            <p className="text-gold font-semibold">✨ {t.alreadyPremium}</p>
            {profile.subscription_expiry && (
              <p className="text-sm text-muted-foreground mt-1">
                {t.expires}: {new Date(profile.subscription_expiry).toLocaleDateString()}
              </p>
            )}
          </div>
        )}

        {/* Payment Method Selector */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <button
            onClick={() => setSelectedPayment("aba")}
            className={`px-6 py-3 rounded-lg border text-sm font-semibold transition-all ${selectedPayment === "aba" ? "border-gold bg-gold/10 text-gold" : "border-border bg-card text-muted-foreground hover:border-gold/30"}`}
          >
            {t.abaKHQR}
          </button>
          <button
            onClick={() => setSelectedPayment("acleda")}
            className={`px-6 py-3 rounded-lg border text-sm font-semibold transition-all ${selectedPayment === "acleda" ? "border-gold bg-gold/10 text-gold" : "border-border bg-card text-muted-foreground hover:border-gold/30"}`}
          >
            {t.acledaBank}
          </button>
        </div>

        {/* Plans */}
        <div className="grid md:grid-cols-2 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.nameKey}
              className={`relative rounded-xl p-6 border transition-all ${plan.popular ? "border-gold/50 bg-gold/5 shadow-[0_0_40px_-15px_hsl(45_100%_51%/0.3)]" : "border-border bg-card"}`}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] gradient-gold text-primary-foreground px-3 py-1 rounded-full font-bold uppercase tracking-wider">
                  {t.mostPopular}
                </span>
              )}
              <h3 className="font-display text-2xl tracking-wide mb-1">{(t as any)[plan.nameKey]}</h3>
              <div className="mb-4">
                <span className="text-3xl font-bold text-gold">{plan.price}</span>
                <span className="text-muted-foreground text-sm">/{plan.period}</span>
              </div>
              <ul className="space-y-2 mb-6">
                {plan.featureKeys.map((fk) => (
                  <li key={fk} className="flex items-center gap-2 text-sm text-foreground/80">
                    <Check className="h-4 w-4 text-gold" /> {(t as any)[fk]}
                  </li>
                ))}
              </ul>
              <Button
                className={`w-full font-semibold ${plan.popular ? "gradient-gold text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}
                onClick={() => handlePayClick(plan)}
              >
                {t.payWith} {selectedPayment === "aba" ? t.abaKHQR : t.acledaBank}
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Payment Modal */}
      <Dialog open={modalOpen} onOpenChange={(open) => { if (!open && paymentStatus !== "pending") closeModal(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-xl tracking-wide">
              {selectedPayment === "aba" ? t.abaBankTransfer : t.acledaBankTransfer}
            </DialogTitle>
          </DialogHeader>

          {(paymentStatus === "idle" || paymentStatus === "creating") && (
            <div className="space-y-6 py-4">
              {selectedPayment === "aba" ? (
                <div className="flex flex-col items-center gap-4">
                  <div className="w-48 h-48 bg-card border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-3">
                    <QrCode className="h-16 w-16 text-gold" />
                    <span className="text-xs text-muted-foreground text-center px-4">{t.khqrPlaceholder}</span>
                  </div>
                  <p className="text-sm text-muted-foreground text-center">{t.scanQR}</p>
                </div>
              ) : (
                <div className="space-y-4 text-sm">
                  <div className="p-4 rounded-lg bg-card border border-border space-y-2">
                    <p><span className="text-muted-foreground">{t.bank}:</span> <span className="font-medium">ACLEDA Bank</span></p>
                    <p><span className="text-muted-foreground">{t.account}:</span> <span className="font-medium font-mono">0001-2345-6789</span></p>
                    <p><span className="text-muted-foreground">{t.name}:</span> <span className="font-medium">KVMovies Co., Ltd</span></p>
                    <p><span className="text-muted-foreground">{t.amount}:</span> <span className="font-medium text-gold">{selectedPlan?.price}</span></p>
                  </div>
                  <p className="text-muted-foreground text-center">{t.transferInstructions}</p>
                </div>
              )}
              <div className="text-center">
                <p className="text-lg font-bold text-gold mb-4">
                  {selectedPlan ? (t as any)[selectedPlan.nameKey] : ""} — {selectedPlan?.price}
                  <span className="text-muted-foreground text-sm font-normal">/{selectedPlan?.period}</span>
                </p>
                <Button className="w-full gradient-gold text-primary-foreground font-semibold" onClick={initiatePayment} disabled={paymentStatus === "creating"}>
                  {paymentStatus === "creating" ? (
                    <><Loader2 className="h-4 w-4 animate-spin mr-2" /> {t.creatingPayment}</>
                  ) : (
                    t.iHavePaid
                  )}
                </Button>
              </div>
            </div>
          )}

          {paymentStatus === "pending" && (
            <div className="flex flex-col items-center gap-6 py-4">
              {selectedPayment === "aba" && (
                <div className="w-48 h-48 bg-card border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-3">
                  <QrCode className="h-16 w-16 text-gold" />
                  <span className="text-xs text-muted-foreground text-center px-4">{t.khqrPlaceholder}</span>
                </div>
              )}
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 text-gold animate-spin" />
                <span className="text-sm font-medium">{t.checkingPayment}</span>
              </div>
              <p className="text-xs text-muted-foreground text-center">{t.dontClose}</p>
              <Button variant="outline" size="sm" onClick={checkManually} className="mt-2">{t.checkManually}</Button>
            </div>
          )}

          {paymentStatus === "completed" && (
            <div className="flex flex-col items-center gap-6 py-8">
              <div className="w-20 h-20 rounded-full bg-emerald-500/10 border-2 border-emerald-500 flex items-center justify-center">
                <CheckCircle2 className="h-10 w-10 text-emerald-500" />
              </div>
              <div className="text-center">
                <h3 className="font-display text-lg mb-1">{t.paymentSuccessful}</h3>
                <p className="text-sm text-muted-foreground">{t.welcomePremium}</p>
              </div>
              <Button className="gradient-gold text-primary-foreground font-semibold" onClick={closeModal}>{t.startWatching}</Button>
            </div>
          )}

          {paymentStatus === "failed" && (
            <div className="flex flex-col items-center gap-6 py-8">
              <div className="w-20 h-20 rounded-full bg-destructive/10 border-2 border-destructive flex items-center justify-center">
                <XCircle className="h-10 w-10 text-destructive" />
              </div>
              <div className="text-center">
                <h3 className="font-display text-lg mb-1">{t.paymentFailed}</h3>
                <p className="text-sm text-muted-foreground">{t.paymentFailedDesc}</p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={closeModal}>{t.cancel}</Button>
                <Button className="gradient-gold text-primary-foreground font-semibold" onClick={() => { setPaymentStatus("idle"); setPaymentId(null); }}>{t.tryAgain}</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Pricing;
