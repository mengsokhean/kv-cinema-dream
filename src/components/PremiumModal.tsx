import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Crown, Play, Sparkles, Shield, X } from "lucide-react";

interface PremiumModalProps {
  open: boolean;
  onClose: () => void;
}

const PremiumModal = ({ open, onClose }: PremiumModalProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const benefits = [
    { icon: Play, label: "Unlimited episodes & movies" },
    { icon: Sparkles, label: "Exclusive premium content" },
    { icon: Shield, label: "Ad-free HD streaming" },
  ];

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden border-gold/20 bg-card">
        {/* Hero gradient header */}
        <div className="relative px-6 pt-10 pb-8 text-center bg-gradient-to-b from-gold/15 via-gold/5 to-transparent">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1 rounded-full hover:bg-muted transition-colors"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
          <div className="w-16 h-16 rounded-full bg-gold/20 flex items-center justify-center mx-auto mb-4 ring-4 ring-gold/10">
            <Crown className="h-8 w-8 text-gold" />
          </div>
          <h2 className="font-display text-2xl tracking-wide mb-2">
            Unlock Premium
          </h2>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">
            This content is available exclusively for premium subscribers.
          </p>
        </div>

        {/* Benefits */}
        <div className="px-6 pb-2 space-y-3">
          {benefits.map((b, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gold/10 flex items-center justify-center shrink-0">
                <b.icon className="h-4 w-4 text-gold" />
              </div>
              <span className="text-sm text-foreground">{b.label}</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="px-6 pb-6 pt-4 space-y-3">
          <Button
            className="w-full gradient-gold text-primary-foreground font-semibold gap-2 h-11"
            onClick={() => {
              onClose();
              navigate("/pricing");
            }}
          >
            <Crown className="h-4 w-4" /> Subscribe Now
          </Button>
          {!user && (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                onClose();
                navigate("/auth");
              }}
            >
              Sign in to your account
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PremiumModal;
