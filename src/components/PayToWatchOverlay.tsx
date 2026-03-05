import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Lock, Crown } from "lucide-react";

const PayToWatchOverlay = () => {
  const navigate = useNavigate();

  return (
    <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-card flex items-center justify-center">
      <div className="absolute inset-0 bg-gradient-to-t from-background to-background/80" />
      <div className="relative text-center p-8">
        <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
          <Lock className="h-7 w-7 text-gold" />
        </div>
        <h3 className="font-display text-2xl tracking-wide mb-2">Premium Content</h3>
        <p className="text-muted-foreground text-sm mb-6 max-w-sm">
          This movie is available exclusively for premium members. Upgrade your plan to enjoy unlimited access.
        </p>
        <Button
          className="gradient-gold text-primary-foreground font-semibold gap-2"
          onClick={() => navigate("/pricing")}
        >
          <Crown className="h-4 w-4" /> Upgrade to Premium
        </Button>
      </div>
    </div>
  );
};

export default PayToWatchOverlay;
