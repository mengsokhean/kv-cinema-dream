import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Crown } from "lucide-react";

interface PremiumUser {
  user_id: string;
  username: string | null;
  email: string | null;
  is_premium: boolean;
  subscription_expiry: string | null;
  created_at: string;
}

const AdminPremiumUsers = () => {
  const { data: users, isLoading } = useQuery({
    queryKey: ["admin-premium-users"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_list_premium_users");
      if (error) throw error;
      return data as PremiumUser[];
    },
  });

  const isExpired = (expiry: string | null) => {
    if (!expiry) return false;
    return new Date(expiry) < new Date();
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-2xl tracking-wide">Premium Users</h2>
        <p className="text-sm text-muted-foreground">
          {users?.length || 0} active premium subscriber{(users?.length || 0) !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Expires</TableHead>
              <TableHead>Joined</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Loading...</TableCell>
              </TableRow>
            ) : !users?.length ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No premium users yet</TableCell>
              </TableRow>
            ) : (
              users.map((u) => {
                const expired = isExpired(u.subscription_expiry);
                return (
                  <TableRow key={u.user_id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Crown className="h-4 w-4 text-gold" />
                        <span className="font-medium text-sm">{u.username || "—"}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{u.email || "—"}</TableCell>
                    <TableCell>
                      {expired ? (
                        <span className="text-xs bg-destructive/20 text-destructive px-2 py-0.5 rounded-full font-semibold">Expired</span>
                      ) : (
                        <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-semibold">Active</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {u.subscription_expiry
                        ? new Date(u.subscription_expiry).toLocaleDateString()
                        : "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(u.created_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AdminPremiumUsers;
