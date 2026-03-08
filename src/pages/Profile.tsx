import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Crown, Mail, User, Receipt, CheckCircle2, XCircle, Clock, Loader2, Eye, Calendar, CreditCard, Hash, Camera } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Payment {
  id: string;
  plan_name: string;
  amount: number;
  status: string;
  payment_method: string;
  created_at: string;
  completed_at: string | null;
  duration_days: number;
}

const statusConfig: Record<string, { icon: React.ReactNode; label: string; className: string }> = {
  completed: { icon: <CheckCircle2 className="h-3 w-3" />, label: "Completed", className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
  pending: { icon: <Clock className="h-3 w-3" />, label: "Pending", className: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30" },
  failed: { icon: <XCircle className="h-3 w-3" />, label: "Failed", className: "bg-destructive/15 text-destructive border-destructive/30" },
};

const PAGE_SIZE = 5;

const Profile = () => {
  const { user, profile, refreshProfile } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(true);
  const [receiptPayment, setReceiptPayment] = useState<Payment | null>(null);
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }

    setUploadingAvatar(true);
    try {
      const ext = file.name.split(".").pop();
      const filePath = `${user.id}/avatar.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      const avatarUrl = `${publicUrl}?t=${Date.now()}`;

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: avatarUrl })
        .eq("id", user.id);
      if (updateError) throw updateError;

      await refreshProfile();
      toast.success("Avatar updated!");
    } catch (err: any) {
      toast.error(err.message || "Failed to upload avatar");
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  useEffect(() => {
    if (!user) return;
    const fetchPayments = async () => {
      setLoadingPayments(true);
      const from = page * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      const { data, count } = await supabase
        .from("payments")
        .select("*", { count: "exact" })
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .range(from, to);
      setPayments((data as Payment[]) || []);
      setTotalCount(count ?? 0);
      setLoadingPayments(false);
    };
    fetchPayments();
  }, [user, page]);

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="container mx-auto px-4 pt-24 pb-16 max-w-lg">
        <h1 className="font-display text-3xl tracking-wide mb-6">My Profile</h1>

        {/* Profile Card */}
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative group">
              <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center overflow-hidden">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <User className="h-6 w-6 text-muted-foreground" />
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                {uploadingAvatar ? (
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                ) : (
                  <Camera className="h-4 w-4 text-white" />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </div>
            <div>
              <p className="font-semibold text-foreground">{profile?.full_name || "User"}</p>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Mail className="h-3 w-3" /> {user?.email}
              </p>
            </div>
          </div>

          <div className="border-t border-border pt-4">
            <p className="text-sm text-muted-foreground mb-1">Membership</p>
            {profile?.is_premium ? (
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 text-sm gradient-gold text-primary-foreground px-3 py-1 rounded-full font-semibold">
                  <Crown className="h-3 w-3" /> Premium
                </span>
                {profile.subscription_expiry && (
                  <span className="text-xs text-muted-foreground">
                    until {new Date(profile.subscription_expiry).toLocaleDateString()}
                  </span>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Free plan</p>
            )}
          </div>
        </div>

        {/* Payment History */}
        <div className="mt-8">
          <div className="flex items-center gap-2 mb-4">
            <Receipt className="h-5 w-5 text-muted-foreground" />
            <h2 className="font-display text-xl tracking-wide">Payment History</h2>
          </div>

          {loadingPayments ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : payments.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-8 text-center">
              <Receipt className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No payments yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {payments.map((payment) => {
                const status = statusConfig[payment.status] || statusConfig.pending;
                return (
                  <div
                    key={payment.id}
                    className="rounded-xl border border-border bg-card p-4 flex items-center justify-between gap-4"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-foreground">{payment.plan_name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {payment.payment_method.toUpperCase()} · {new Date(payment.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-sm font-bold text-gold">${payment.amount.toFixed(2)}</span>
                      <Badge variant="outline" className={`flex items-center gap-1 text-[10px] ${status.className}`}>
                        {status.icon} {status.label}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                        onClick={() => setReceiptPayment(payment)}
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {totalCount > PAGE_SIZE && (
            <div className="flex items-center justify-between pt-3">
              <p className="text-xs text-muted-foreground">
                {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, totalCount)} of {totalCount}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
                  Previous
                </Button>
                <Button variant="outline" size="sm" disabled={(page + 1) * PAGE_SIZE >= totalCount} onClick={() => setPage(p => p + 1)}>
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Receipt Modal */}
      <Dialog open={!!receiptPayment} onOpenChange={(open) => { if (!open) setReceiptPayment(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display text-lg tracking-wide flex items-center gap-2">
              <Receipt className="h-4 w-4 text-gold" /> Payment Receipt
            </DialogTitle>
          </DialogHeader>
          {receiptPayment && (() => {
            const status = statusConfig[receiptPayment.status] || statusConfig.pending;
            return (
              <div className="space-y-4 py-2">
                <div className="text-center pb-4 border-b border-border">
                  <p className="text-3xl font-bold text-gold">${receiptPayment.amount.toFixed(2)}</p>
                  <Badge variant="outline" className={`mt-2 flex items-center gap-1 text-xs w-fit mx-auto ${status.className}`}>
                    {status.icon} {status.label}
                  </Badge>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-3">
                    <Hash className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="text-muted-foreground text-xs">Transaction ID</p>
                      <p className="font-mono text-xs text-foreground break-all">{receiptPayment.id}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Crown className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="text-muted-foreground text-xs">Plan</p>
                      <p className="text-foreground">{receiptPayment.plan_name} ({receiptPayment.duration_days} days)</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CreditCard className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="text-muted-foreground text-xs">Payment Method</p>
                      <p className="text-foreground">{receiptPayment.payment_method.toUpperCase()}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="text-muted-foreground text-xs">Created</p>
                      <p className="text-foreground">{new Date(receiptPayment.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                  {receiptPayment.completed_at && (
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                      <div>
                        <p className="text-muted-foreground text-xs">Completed</p>
                        <p className="text-foreground">{new Date(receiptPayment.completed_at).toLocaleString()}</p>
                      </div>
                    </div>
                  )}
                </div>

                <Button variant="outline" className="w-full mt-2" onClick={() => setReceiptPayment(null)}>
                  Close
                </Button>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
      <Footer />
    </div>
  );
};

export default Profile;
