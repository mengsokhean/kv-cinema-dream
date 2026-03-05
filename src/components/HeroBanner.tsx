import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Play, Crown } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";

const HeroBanner = () => {
  const navigate = useNavigate();

  return (
    <section className="relative h-[85vh] flex items-end overflow-hidden">
      <img
        src={heroBg}
        alt="KVMovies cinema"
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-background/80 to-transparent" />

      <div className="relative container mx-auto px-4 pb-20 max-w-3xl">
        <span className="inline-flex items-center gap-1.5 text-xs gradient-gold text-primary-foreground px-3 py-1 rounded-full font-semibold mb-4">
          <Crown className="h-3 w-3" /> Premium Streaming
        </span>
        <h1 className="font-display text-5xl md:text-7xl leading-tight tracking-wide mb-4">
          Unlimited Movies, <br />
          <span className="text-gold">Anytime.</span>
        </h1>
        <p className="text-muted-foreground text-lg mb-8 max-w-lg">
          Stream the latest blockbusters, exclusive content, and timeless classics — all in one place.
        </p>
        <div className="flex gap-3">
          <Button
            size="lg"
            className="gradient-gold text-primary-foreground font-semibold gap-2"
            onClick={() => navigate("/movies")}
          >
            <Play className="h-4 w-4" /> Browse Movies
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="border-border text-foreground hover:bg-secondary"
            onClick={() => navigate("/pricing")}
          >
            View Plans
          </Button>
        </div>
      </div>
    </section>
  );
};

export default HeroBanner;
