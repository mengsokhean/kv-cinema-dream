import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { CheckCircle2, Clock, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface PaymentRow {
  id: string;
  user_id: string;
  username: string | null;
  email: string | null;
  plan_name: string;
  amount: number;
  payment_method: string;
  status: string;
  duration_days: number;
  created_at: string;
  completed_at: string | null;
}

const AdminPayments = () => {
  const queryClient = useQueryClient();

  const { data: payments, isLoading } = useQuery({
    queryKey: ["admin-payments"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_list_payments");
      if (error) throw error;
      return data as PaymentRow[];
    },
  });

  const verifyMutation = useMutation({
    mutationFn: async (paymentId: string) => {
      const { error } = await supabase.rpc("admin_verify_payment", {
        p_payment_id: paymentId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-payments"] });
      queryClient.invalidateQueries({ queryKey: ["admin-premium-users"] });
      toast.success("Payment verified & premium activated!");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const statusIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle2 className="h-4 w-4 text-emerald-400" />;
      case "pending": return <Clock className="h-4 w-4 text-gold" />;
      default: return <XCircle className="h-4 w-4 text-destructive" />;
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-2xl tracking-wide">Payment Management</h2>
        <p className="text-sm text-muted-foreground">Verify pending payments manually when users send screenshots via Telegram.</p>
      </div>

      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Status</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Method</TableHead>
              <TableHead className="hidden md:table-cell">Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Loading...</TableCell>
              </TableRow>
            ) : !payments?.length ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No payments yet</TableCell>
              </TableRow>
            ) : (
              payments.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      {statusIcon(p.status)}
                      <Badge
                        variant={p.status === "completed" ? "default" : p.status === "pending" ? "secondary" : "destructive"}
                        className="text-[10px]"
                      >
                        {p.status}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm font-medium truncate max-w-[150px]">{p.username || "—"}</p>
                      <p className="text-xs text-muted-foreground truncate max-w-[150px]">{p.email || "—"}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{p.plan_name}</TableCell>
                  <TableCell className="text-sm font-medium text-gold">${p.amount}</TableCell>
                  <TableCell className="text-xs uppercase">{p.payment_method}</TableCell>
                  <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                    {new Date(p.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    {p.status === "pending" ? (
                      <Button
                        size="sm"
                        className="gradient-gold text-primary-foreground text-xs font-semibold"
                        disabled={verifyMutation.isPending}
                        onClick={() => {
                          if (confirm(`Verify payment for ${p.username || p.email}?\nThis will activate their premium subscription.`)) {
                            verifyMutation.mutate(p.id);
                          }
                        }}
                      >
                        {verifyMutation.isPending ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          "Verify"
                        )}
                      </Button>
                    ) : p.status === "completed" ? (
                      <span className="text-xs text-emerald-400">✓ Verified</span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AdminPayments;
