import Navbar from "@/components/Navbar";
import MovieGrid from "@/components/MovieGrid";

const Movies = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="container mx-auto px-4 pt-24">
        <h1 className="font-display text-4xl tracking-wide mb-2">Browse Movies</h1>
        <p className="text-muted-foreground mb-8">Explore our entire collection</p>
        <MovieGrid />
      </div>
    </div>
  );
};

export default Movies;
