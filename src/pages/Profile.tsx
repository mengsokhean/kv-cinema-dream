import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import { Crown, Mail, User } from "lucide-react";

const Profile = () => {
  const { user, profile } = useAuth();

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="container mx-auto px-4 pt-24 max-w-lg">
        <h1 className="font-display text-3xl tracking-wide mb-6">My Profile</h1>
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
      </div>
    </div>
  );
};

export default Profile;
