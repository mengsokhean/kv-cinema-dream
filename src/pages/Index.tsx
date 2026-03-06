import Navbar from "@/components/Navbar";
import HeroBanner from "@/components/HeroBanner";
import MovieGrid from "@/components/MovieGrid";
import ContinueWatching from "@/components/ContinueWatching";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <HeroBanner />
      <div className="container mx-auto px-4">
        <ContinueWatching />
        <MovieGrid title="Featured" featured limit={6} />
        <MovieGrid title="All Movies" limit={18} />
      </div>
      <footer className="border-t border-border py-8 mt-12">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          © 2026 kvmovies.net — All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default Index;
