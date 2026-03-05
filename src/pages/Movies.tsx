import { useState } from "react";
import Navbar from "@/components/Navbar";
import MovieGrid from "@/components/MovieGrid";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";

const GENRES = ["All", "Sci-Fi", "Action", "Horror", "Drama", "Comedy", "Thriller", "Romance", "Animation", "Fantasy"];

const Movies = () => {
  const [search, setSearch] = useState("");
  const [genre, setGenre] = useState("All");

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="container mx-auto px-4 pt-24">
        <h1 className="font-display text-4xl tracking-wide mb-2">Browse Movies</h1>
        <p className="text-muted-foreground mb-6">Explore our entire collection</p>

        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search movies..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-card border-border"
            />
          </div>
          <Select value={genre} onValueChange={setGenre}>
            <SelectTrigger className="w-full sm:w-44 bg-card border-border">
              <SelectValue placeholder="Genre" />
            </SelectTrigger>
            <SelectContent>
              {GENRES.map((g) => (
                <SelectItem key={g} value={g}>{g}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <MovieGrid search={search} genre={genre === "All" ? undefined : genre} />
      </div>
    </div>
  );
};

export default Movies;
