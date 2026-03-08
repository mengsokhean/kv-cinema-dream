import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Plus, Trash2, Upload, Film, ShieldAlert } from "lucide-react";

interface EpisodeInput {
  title: string;
  episode_number: number;
  video_url: string;
  thumbnail_url: string;
  is_free: boolean;
}

const AdminUpload = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Check admin role
  const { data: isAdmin, isLoading: roleLoading } = useQuery({
    queryKey: ["admin-role", user?.id],
    queryFn: async () => {
      const { data } = await supabase.rpc("has_role", {
        _user_id: user!.id,
        _role: "admin",
      });
      return !!data;
    },
    enabled: !!user,
  });

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [thumbnail, setThumbnail] = useState("");
  const [genre, setGenre] = useState("");
  const [releaseYear, setReleaseYear] = useState("");
  const [isSeries, setIsSeries] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [trailerUrl, setTrailerUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [episodes, setEpisodes] = useState<EpisodeInput[]>([]);

  const addEpisode = () => {
    setEpisodes((prev) => [
      ...prev,
      {
        title: `Episode ${prev.length + 1}`,
        episode_number: prev.length + 1,
        video_url: "",
        thumbnail_url: "",
        is_free: prev.length < 3,
      },
    ]);
  };

  const updateEpisode = (index: number, field: keyof EpisodeInput, value: string | number | boolean) => {
    setEpisodes((prev) =>
      prev.map((ep, i) => (i === index ? { ...ep, [field]: value } : ep))
    );
  };

  const removeEpisode = (index: number) => {
    setEpisodes((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadMutation = useMutation({
    mutationFn: async () => {
      // Insert movie
      const { data: movie, error: movieError } = await supabase
        .from("movies")
        .insert({
          title,
          description: description || null,
          thumbnail: thumbnail || null,
          genre: genre || null,
          release_year: releaseYear ? parseInt(releaseYear) : null,
          is_series: isSeries,
          is_premium_required: isPremium,
          trailer_url: trailerUrl || null,
          video_url: !isSeries ? videoUrl || null : null,
        })
        .select()
        .single();

      if (movieError) throw movieError;

      // Insert episodes if series
      if (isSeries && episodes.length > 0) {
        const { error: epError } = await supabase.from("episodes").insert(
          episodes.map((ep) => ({
            movie_id: movie.id,
            title: ep.title,
            episode_number: ep.episode_number,
            video_url: ep.video_url || null,
            thumbnail_url: ep.thumbnail_url || null,
            is_free: ep.is_free,
          }))
        );
        if (epError) throw epError;
      }

      return movie;
    },
    onSuccess: () => {
      toast.success("Movie uploaded successfully!");
      queryClient.invalidateQueries({ queryKey: ["movies"] });
      // Reset form
      setTitle("");
      setDescription("");
      setThumbnail("");
      setGenre("");
      setReleaseYear("");
      setIsSeries(false);
      setIsPremium(false);
      setTrailerUrl("");
      setVideoUrl("");
      setEpisodes([]);
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  if (!user || roleLoading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 pt-24 text-center text-muted-foreground">
          Loading...
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 pt-24 text-center">
          <ShieldAlert className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h1 className="font-display text-2xl mb-2">Access Denied</h1>
          <p className="text-muted-foreground text-sm">You do not have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="container mx-auto px-4 pt-24 pb-16 max-w-3xl">
        <h1 className="font-display text-3xl mb-6 flex items-center gap-3">
          <Film className="h-7 w-7 text-primary" /> Upload Movie
        </h1>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Movie Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Title *</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Movie title" />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Movie description" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Poster / Thumbnail URL</Label>
                <Input value={thumbnail} onChange={(e) => setThumbnail(e.target.value)} placeholder="https://..." />
              </div>
              <div>
                <Label>Genre</Label>
                <Input value={genre} onChange={(e) => setGenre(e.target.value)} placeholder="Action, Drama..." />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Release Year</Label>
                <Input type="number" value={releaseYear} onChange={(e) => setReleaseYear(e.target.value)} placeholder="2025" />
              </div>
              <div>
                <Label>Trailer URL</Label>
                <Input value={trailerUrl} onChange={(e) => setTrailerUrl(e.target.value)} placeholder="https://..." />
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch checked={isSeries} onCheckedChange={setIsSeries} />
                <Label>Is Series</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={isPremium} onCheckedChange={setIsPremium} />
                <Label>Premium Required</Label>
              </div>
            </div>
            {!isSeries && (
              <div>
                <Label>Video URL (for standalone movie)</Label>
                <Input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://..." />
              </div>
            )}
          </CardContent>
        </Card>

        {isSeries && (
          <Card className="mb-6">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Episodes ({episodes.length})</CardTitle>
              <Button size="sm" variant="outline" onClick={addEpisode} className="gap-1">
                <Plus className="h-4 w-4" /> Add Episode
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {episodes.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No episodes yet. Click "Add Episode" to start.</p>
              )}
              {episodes.map((ep, i) => (
                <div key={i} className="border border-border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">Episode {ep.episode_number}</span>
                    <Button size="icon" variant="ghost" onClick={() => removeEpisode(i)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Title</Label>
                      <Input value={ep.title} onChange={(e) => updateEpisode(i, "title", e.target.value)} />
                    </div>
                    <div>
                      <Label className="text-xs">Video URL</Label>
                      <Input value={ep.video_url} onChange={(e) => updateEpisode(i, "video_url", e.target.value)} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Thumbnail URL</Label>
                      <Input value={ep.thumbnail_url} onChange={(e) => updateEpisode(i, "thumbnail_url", e.target.value)} />
                    </div>
                    <div className="flex items-end gap-2 pb-1">
                      <Switch checked={ep.is_free} onCheckedChange={(v) => updateEpisode(i, "is_free", v)} />
                      <Label className="text-xs">Free</Label>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <Button
          className="w-full gradient-gold text-primary-foreground font-semibold gap-2"
          disabled={!title.trim() || uploadMutation.isPending}
          onClick={() => uploadMutation.mutate()}
        >
          <Upload className="h-4 w-4" />
          {uploadMutation.isPending ? "Uploading..." : "Upload Movie"}
        </Button>
      </div>
    </div>
  );
};

export default AdminUpload;
