import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Crown, Check, Loader2, Clock, CheckCircle2, XCircle, Upload, ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useRef } from "react";

// ✅ FIX: Real ABA QR Code URL
const ABA_QR_URL =
  "https://kvlywvwyxijifxpuhexf.supabase.co/storage/v1/object/public/assets/photo_2026-03-13_10-32-56.jpg";

type PaymentStatus = "idle" | "uploading" | "pending" | "completed" | "failed";

const Pricing = () => {
  const { user, profile, refreshProfile } = useAuth();
  const { lang, t } = useLanguage();
  const isKhmer = lang === "kh";
  const [selectedPayment, setSelectedPayment] = useState<"aba" | "acleda">("aba");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<{
    nameKey: string;
    price: string;
    amount: number;
    period: string;
    popular?: boolean;
    featureKeys: readonly string[];
    duration_days: number;
  } | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("idle");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
      featureKeys: [
        "feature4K",
        "featureAllMovies",
        "featureCancelAnytime",
        "feature3Devices",
        "featurePrioritySupport",
      ] as const,
      duration_days: 365,
    },
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      toast.error("Max file size is 10MB");
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handlePayClick = (plan: (typeof plans)[0]) => {
    if (!user) {
      navigate("/auth");
      return;
    }
    setSelectedPlan(plan);
    setPaymentStatus("idle");
    setFile(null);
    setPreview(null);
    setModalOpen(true);
  };

  // ✅ FIX: Upload to receipts bucket + insert into payment_requests
  const submitPayment = useCallback(async () => {
    if (!user || !selectedPlan || !file) return;
    setPaymentStatus("uploading");
    try {
      // Upload receipt
      const ext = file.name.split(".").pop();
      const filePath = `${user.id}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("receipts")
        .upload(filePath, file, { contentType: file.type });
      if (uploadError) throw uploadError;

      // Get public URL
      // ✅ FIX: Store only the file path, not full URL
      const receiptUrl = filePath;
      // ✅ FIX: Insert into payment_requests (correct table)
      const { error: insertError } = await supabase.from("payment_requests").insert({
        user_id: user.id,
        amount: selectedPlan.amount,
        receipt_url: receiptUrl,
        duration_days: selectedPlan.duration_days,
        status: "pending",
      });
      if (insertError) throw insertError;

      // Notify Telegram
      supabase.functions
        .invoke("telegram-notify", {
          body: {
            type: "INSERT",
            record: {
              user_id: user.id,
              amount: selectedPlan.amount,
              duration_days: selectedPlan.duration_days,
              receipt_url: receiptUrl,
            },
          },
        })
        .catch((err) => console.error("Telegram notify failed:", err));

      setPaymentStatus("pending");
      toast.success("Payment submitted! Admin will verify shortly.");
    } catch (err: any) {
      setPaymentStatus("failed");
      toast.error(err.message || "Failed to submit payment");
    }
  }, [user, selectedPlan, file]);

  const closeModal = () => {
    if (paymentStatus === "uploading") return;
    setModalOpen(false);
    setPaymentStatus("idle");
    setFile(null);
    setPreview(null);
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
      <Dialog
        open={modalOpen}
        onOpenChange={(open) => {
          if (!open) closeModal();
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-xl tracking-wide">
              {selectedPayment === "aba" ? t.abaBankTransfer : t.acledaBankTransfer}
            </DialogTitle>
          </DialogHeader>

          {/* IDLE / UPLOADING — Show QR + Upload */}
          {(paymentStatus === "idle" || paymentStatus === "uploading") && (
            <div className="space-y-6 py-4">
              {selectedPayment === "aba" ? (
                <div className="flex flex-col items-center gap-3">
                  {/* ✅ FIX: Real ABA QR Code */}
                  <div className="rounded-xl overflow-hidden border-2 border-gold/20 bg-white p-2">
                    <img src={ABA_QR_URL} alt="ABA KHQR" className="w-48 h-48 object-contain" />
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1 text-left w-full bg-card border border-border rounded-lg p-3">
                    <p>
                      <span className="font-semibold text-foreground">Bank:</span> ABA Bank
                    </p>
                    <p>
                      <span className="font-semibold text-foreground">Name:</span> THY SENG
                    </p>
                    <p>
                      <span className="font-semibold text-foreground">Number:</span> 000 405 722
                    </p>
                    <p>
                      <span className="font-semibold text-foreground">Amount:</span>{" "}
                      <span className="text-gold font-bold">{selectedPlan?.price}</span>
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 text-sm">
                  <div className="p-4 rounded-lg bg-card border border-border space-y-2">
                    <p>
                      <span className="text-muted-foreground">{t.bank}:</span>{" "}
                      <span className="font-medium">ACLEDA Bank</span>
                    </p>
                    <p>
                      <span className="text-muted-foreground">{t.account}:</span>{" "}
                      <span className="font-medium font-mono">0001-2345-6789</span>
                    </p>
                    <p>
                      <span className="text-muted-foreground">{t.name}:</span>{" "}
                      <span className="font-medium">KVMovies Co., Ltd</span>
                    </p>
                    <p>
                      <span className="text-muted-foreground">{t.amount}:</span>{" "}
                      <span className="font-medium text-gold">{selectedPlan?.price}</span>
                    </p>
                  </div>
                </div>
              )}

              {/* Upload screenshot */}
              <div className="space-y-2">
                <p className="text-sm font-semibold text-center">Upload Payment Screenshot</p>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-border rounded-xl p-4 cursor-pointer hover:border-gold/50 transition-colors text-center"
                >
                  {preview ? (
                    <img src={preview} alt="Receipt" className="max-h-32 mx-auto rounded-lg object-contain" />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <ImageIcon className="h-6 w-6" />
                      <span className="text-xs">Click to upload screenshot</span>
                    </div>
                  )}
                </div>
              </div>

              <Button
                className="w-full gradient-gold text-primary-foreground font-semibold"
                onClick={submitPayment}
                disabled={paymentStatus === "uploading" || !file}
              >
                {paymentStatus === "uploading" ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" /> Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" /> Submit Payment
                  </>
                )}
              </Button>
            </div>
          )}

          {/* PENDING */}
          {paymentStatus === "pending" && (
            <div className="flex flex-col items-center gap-6 py-8">
              <div className="w-20 h-20 rounded-full bg-gold/10 border-2 border-gold flex items-center justify-center">
                <Clock className="h-10 w-10 text-gold" />
              </div>
              <div className="text-center">
                <h3 className="font-display text-lg mb-1">Waiting for Approval</h3>
                <p className="text-sm text-muted-foreground">
                  Admin will verify your payment and activate your VIP shortly.
                </p>
              </div>
              <Button variant="outline" onClick={closeModal}>
                Close
              </Button>
            </div>
          )}

          {/* COMPLETED */}
          {paymentStatus === "completed" && (
            <div className="flex flex-col items-center gap-6 py-8">
              <div className="w-20 h-20 rounded-full bg-emerald-500/10 border-2 border-emerald-500 flex items-center justify-center">
                <CheckCircle2 className="h-10 w-10 text-emerald-500" />
              </div>
              <div className="text-center">
                <h3 className="font-display text-lg mb-1">{t.paymentSuccessful}</h3>
                <p className="text-sm text-muted-foreground">{t.welcomePremium}</p>
              </div>
              <Button className="gradient-gold text-primary-foreground font-semibold" onClick={closeModal}>
                {t.startWatching}
              </Button>
            </div>
          )}

          {/* FAILED */}
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
                <Button variant="outline" onClick={closeModal}>
                  {t.cancel}
                </Button>
                <Button
                  className="gradient-gold text-primary-foreground font-semibold"
                  onClick={() => {
                    setPaymentStatus("idle");
                    setFile(null);
                    setPreview(null);
                  }}
                >
                  {t.tryAgain}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      <Footer />
    </div>
  );
};

export default Pricing;
