import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import HeroBanner from "@/components/HeroBanner";
import MovieGrid from "@/components/MovieGrid";
import ContinueWatching from "@/components/ContinueWatching";
import GenreRecommendations from "@/components/GenreRecommendations";
import { useLanguage } from "@/contexts/LanguageContext";

const Index = () => {
  const { lang, t } = useLanguage();
  const isKhmer = lang === "kh";

  return (
    <div className={`min-h-screen ${isKhmer ? "font-khmer" : ""}`}>
      <Navbar />
      <HeroBanner />
      <div className="container mx-auto px-4">
        <ContinueWatching />
        <MovieGrid title={t.featured} featured limit={6} />
        <GenreRecommendations />
        <MovieGrid title={t.allMovies} limit={18} />
      </div>
      <Footer />
    </div>
  );
};

export default Index;
