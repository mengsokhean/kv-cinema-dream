import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import { Crown, Mail, User, Receipt, CheckCircle2, XCircle, Clock, Loader2, Eye, Calendar, CreditCard, Hash } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

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

const Profile = () => {
  const { user, profile } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchPayments = async () => {
      setLoadingPayments(true);
      const { data } = await supabase
        .from("payments")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setPayments((data as Payment[]) || []);
      setLoadingPayments(false);
    };
    fetchPayments();
  }, [user]);

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="container mx-auto px-4 pt-24 pb-16 max-w-lg">
        <h1 className="font-display text-3xl tracking-wide mb-6">My Profile</h1>

        {/* Profile Card */}
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center">
              <User className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <p className="font-semibold text-foreground">{profile?.username || "User"}</p>
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
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-sm font-bold text-gold">${payment.amount.toFixed(2)}</span>
                      <Badge variant="outline" className={`flex items-center gap-1 text-[10px] ${status.className}`}>
                        {status.icon} {status.label}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
