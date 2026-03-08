import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import HeroBanner from "@/components/HeroBanner";
import MovieGrid from "@/components/MovieGrid";
import ContinueWatching from "@/components/ContinueWatching";
import GenreRecommendations from "@/components/GenreRecommendations";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <HeroBanner />
      <div className="container mx-auto px-4">
        <ContinueWatching />
        <MovieGrid title="Featured" featured limit={6} />
        <GenreRecommendations />
        <MovieGrid title="All Movies" limit={18} />
      </div>
      <Footer />
    </div>
  );
};

export default Index;
