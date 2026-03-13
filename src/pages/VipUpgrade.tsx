import { useState, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Crown, Upload, Loader2, CheckCircle2, ImageIcon } from "lucide-react";
import { toast } from "sonner";

const ABA_QR_URL = "https://kvlywvwyxijifxpuhexf.supabase.co/storage/v1/object/public/assets//photo_2026-03-13_10-32-56.jpg";

const VipUpgrade = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

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

  const handleSubmit = async () => {
    if (!user) {
      navigate("/auth");
      return;
    }
    if (!file) {
      toast.error("Please upload your payment screenshot");
      return;
    }

    setSubmitting(true);
    try {
      // Upload receipt to storage
      const ext = file.name.split(".").pop();
      const filePath = `${user.id}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("receipts")
        .upload(filePath, file, { contentType: file.type });
      if (uploadError) throw uploadError;

      // Store just the path (bucket is now private)
      const receiptPath = filePath;
      // Insert payment request
      const { error: insertError } = await supabase
        .from("payment_requests")
        .insert({
          user_id: user.id,
          amount: 4.99,
          receipt_url: receiptPath,
          status: "pending",
        });
      if (insertError) throw insertError;

      // Notify admin via Telegram (fire-and-forget)
      supabase.functions.invoke("telegram-notify", {
        body: {
          type: "INSERT",
          record: {
            user_id: user.id,
            amount: 4.99,
            duration_days: 30,
            receipt_url: receiptPath,
          },
        },
      }).catch((err) => console.error("Telegram notify failed:", err));

      setSubmitted(true);
      toast.success("Payment request submitted! We'll verify it shortly.");
    } catch (err: any) {
      toast.error(err.message || "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 pt-24 pb-16 max-w-md text-center">
          <div className="rounded-xl border border-gold/30 bg-card p-8 space-y-4">
            <div className="w-16 h-16 rounded-full bg-gold/10 border-2 border-gold flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-8 w-8 text-gold" />
            </div>
            <h1 className="font-display text-2xl tracking-wide">Request Submitted!</h1>
            <p className="text-sm text-muted-foreground">
              Your payment screenshot has been uploaded. Our admin will verify and approve your VIP upgrade shortly.
            </p>
            <Button variant="outline" onClick={() => navigate("/")}>
              Back to Home
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="container mx-auto px-4 pt-24 pb-16 max-w-md">
        <div className="text-center mb-8">
          <span className="inline-flex items-center gap-1.5 text-xs gradient-gold text-primary-foreground px-3 py-1 rounded-full font-semibold mb-4">
            <Crown className="h-3 w-3" /> VIP Upgrade
          </span>
          <h1 className="font-display text-3xl md:text-4xl tracking-wide mb-2">
            Upgrade to <span className="text-gold">VIP</span>
          </h1>
          <p className="text-sm text-muted-foreground">
            Scan the QR code below to pay, then upload your screenshot
          </p>
        </div>

        {profile?.is_premium && (
          <div className="text-center mb-6 p-4 rounded-lg border border-gold/30 bg-gold/5">
            <p className="text-gold font-semibold">✨ You're already a VIP member!</p>
          </div>
        )}

        <div className="rounded-xl border border-border bg-card p-6 space-y-6">
          {/* QR Code */}
          <div className="text-center space-y-4">
            <h2 className="font-display text-xl tracking-wide text-gold">Scan to Pay with ABA</h2>
            <div className="flex justify-center">
              <div className="rounded-xl overflow-hidden border-2 border-gold/20 bg-white p-3">
                <img
                  src={ABA_QR_URL}
                  alt="ABA KHQR Payment"
                  className="w-64 h-64 object-contain"
                />
              </div>
            </div>
            <p className="text-sm text-muted-foreground">ABA Bank KHQR · $4.99</p>
            <div className="text-sm text-muted-foreground space-y-1 mt-2 text-left mx-auto max-w-xs">
              <p><span className="font-semibold text-foreground">Bank:</span> ABA Bank</p>
              <p><span className="font-semibold text-foreground">Account Name:</span> THY SENG</p>
              <p><span className="font-semibold text-foreground">Account Number:</span> 000 405 722</p>
            </div>
          </div>

          <div className="h-px bg-border" />

          {/* Upload */}
          <div className="space-y-3">
            <h2 className="font-display text-lg tracking-wide text-center">Step 2: Upload Screenshot</h2>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-border rounded-xl p-6 cursor-pointer hover:border-gold/50 transition-colors text-center"
            >
              {preview ? (
                <img src={preview} alt="Receipt" className="max-h-48 mx-auto rounded-lg object-contain" />
              ) : (
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <ImageIcon className="h-8 w-8" />
                  <span className="text-sm">Click to upload payment screenshot</span>
                  <span className="text-xs">PNG, JPG up to 10MB</span>
                </div>
              )}
            </div>
          </div>

          {/* Submit */}
          <Button
            className="w-full gradient-gold text-primary-foreground font-semibold"
            disabled={submitting || !file}
            onClick={handleSubmit}
          >
            {submitting ? (
              <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Submitting...</>
            ) : (
              <><Upload className="h-4 w-4 mr-2" /> Submit Payment Request</>
            )}
          </Button>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default VipUpgrade;
