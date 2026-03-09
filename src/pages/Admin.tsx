import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Movie } from "@/types/database";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Pencil, Trash2, ShieldAlert, Upload, X, ListVideo, CreditCard, Crown, Film } from "lucide-react";
import { toast } from "sonner";
import InlineEpisodeEditor, { type EpisodeDraft, createEpisodeDraft } from "@/components/InlineEpisodeEditor";
import AdminPayments from "@/components/AdminPayments";
import AdminPremiumUsers from "@/components/AdminPremiumUsers";

interface MovieForm {
  title: string;
  description: string;
  genre: string;
  release_year: number | null;
  rating: number | null;
  thumbnail: string;
  trailer_url: string;
  video_url: string;
  is_featured: boolean;
  is_premium_required: boolean;
  is_series: boolean;
}

const emptyForm: MovieForm = {
  title: "",
  description: "",
  genre: "",
  release_year: null,
  rating: null,
  thumbnail: "",
  trailer_url: "",
  video_url: "",
  is_featured: false,
  is_premium_required: false,
  is_series: false,
};

const Admin = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<MovieForm>(emptyForm);
  const [episodeDrafts, setEpisodeDrafts] = useState<EpisodeDraft[]>([]);
  const [deletedEpisodeIds, setDeletedEpisodeIds] = useState<string[]>([]);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Please select an image file"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Image must be less than 5MB"); return; }
    setThumbnailFile(file);
    setThumbnailPreview(URL.createObjectURL(file));
    setForm({ ...form, thumbnail: "" });
  };

  const clearThumbnailFile = () => {
    setThumbnailFile(null);
    setThumbnailPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const uploadThumbnail = async (file: File): Promise<string> => {
    const ext = file.name.split(".").pop();
    const fileName = `${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage
      .from("movie-thumbnails")
      .upload(fileName, file, { contentType: file.type });
    if (error) throw error;
    const { data: urlData } = supabase.storage.from("movie-thumbnails").getPublicUrl(fileName);
    return urlData.publicUrl;
  };

  const { data: isAdmin, isLoading: roleLoading } = useQuery({
    queryKey: ["isAdmin", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("user_roles").select("role")
        .eq("user_id", user!.id).eq("role", "admin").maybeSingle();
      return !!data;
    },
  });

  const { data: movies, isLoading } = useQuery({
    queryKey: ["admin-movies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("movies").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Tables<"movies">[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (movie: MovieForm & { id?: string }) => {
      const payload = {
        title: movie.title,
        description: movie.description || null,
        genre: movie.genre || null,
        release_year: movie.release_year,
        rating: movie.rating,
        thumbnail: movie.thumbnail || null,
        trailer_url: movie.trailer_url || null,
        video_url: movie.video_url || null,
        is_featured: movie.is_featured,
        is_premium_required: movie.is_premium_required,
        is_series: movie.is_series,
      };

      let movieId = movie.id;

      if (movie.id) {
        const { error } = await supabase.from("movies").update(payload).eq("id", movie.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("movies").insert(payload).select("id").single();
        if (error) throw error;
        movieId = data.id;
      }

      // Save episodes if series
      if (movie.is_series && movieId) {
        // Delete removed episodes
        if (deletedEpisodeIds.length > 0) {
          const { error } = await supabase.from("episodes").delete().in("id", deletedEpisodeIds);
          if (error) throw error;
        }

        // Upsert episodes
        for (const ep of episodeDrafts) {
          if (!ep.title.trim() || !ep.episode_number) continue;
          const epPayload = {
            movie_id: movieId,
            title: ep.title,
            episode_number: ep.episode_number,
            video_url: ep.video_url || null,
            is_free: ep.is_free,
          };
          if (ep.id) {
            const { error } = await supabase.from("episodes").update(epPayload).eq("id", ep.id);
            if (error) throw error;
          } else {
            const { error } = await supabase.from("episodes").insert(epPayload);
            if (error) throw error;
          }
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-movies"] });
      queryClient.invalidateQueries({ queryKey: ["movies"] });
      queryClient.invalidateQueries({ queryKey: ["episodes"] });
      toast.success(editingId ? "Movie updated" : "Movie added");
      setDialogOpen(false);
      resetForm();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("movies").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-movies"] });
      queryClient.invalidateQueries({ queryKey: ["movies"] });
      toast.success("Movie deleted");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setEpisodeDrafts([]);
    setDeletedEpisodeIds([]);
    clearThumbnailFile();
  };

  const openEdit = async (movie: any) => {
    setEditingId(movie.id);
    setForm({
      title: movie.title,
      description: movie.description || "",
      genre: movie.genre || "",
      release_year: movie.release_year,
      rating: movie.rating,
      thumbnail: movie.thumbnail || "",
      trailer_url: movie.trailer_url || "",
      video_url: movie.video_url || "",
      is_featured: movie.is_featured,
      is_premium_required: movie.is_premium_required,
      is_series: movie.is_series,
    });
    clearThumbnailFile();
    setDeletedEpisodeIds([]);
    if (movie.thumbnail) setThumbnailPreview(movie.thumbnail);

    // Load existing episodes for series
    if (movie.is_series) {
      const { data } = await supabase
        .from("episodes").select("*")
        .eq("movie_id", movie.id).order("episode_number", { ascending: true });
      setEpisodeDrafts(
        (data || []).map((ep) =>
          createEpisodeDraft({
            id: ep.id,
            title: ep.title,
            episode_number: ep.episode_number,
            video_url: ep.video_url || "",
            is_free: ep.is_free,
          })
        )
      );
    } else {
      setEpisodeDrafts([]);
    }

    setDialogOpen(true);
  };

  const handleEpisodeChange = (newEpisodes: EpisodeDraft[]) => {
    // Track deleted episodes that had DB ids
    const currentKeys = new Set(newEpisodes.map((e) => e._key));
    const removed = episodeDrafts.filter((e) => !currentKeys.has(e._key) && e.id);
    if (removed.length > 0) {
      setDeletedEpisodeIds((prev) => [...prev, ...removed.map((r) => r.id!)]);
    }
    setEpisodeDrafts(newEpisodes);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error("Title is required"); return; }

    // Validate episodes if series
    if (form.is_series && episodeDrafts.length > 0) {
      const invalid = episodeDrafts.find((ep) => !ep.title.trim() || !ep.episode_number);
      if (invalid) { toast.error("All episodes need a title and number"); return; }
      const nums = episodeDrafts.map((ep) => ep.episode_number);
      if (new Set(nums).size !== nums.length) { toast.error("Episode numbers must be unique"); return; }
    }

    let finalForm = { ...form };
    if (thumbnailFile) {
      try {
        setUploading(true);
        finalForm.thumbnail = await uploadThumbnail(thumbnailFile);
      } catch (err: any) {
        toast.error("Upload failed: " + err.message);
        setUploading(false);
        return;
      } finally {
        setUploading(false);
      }
    }
    saveMutation.mutate({ ...finalForm, id: editingId ?? undefined });
  };

  if (loading || roleLoading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 pt-24 text-center text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 pt-24 flex flex-col items-center gap-4">
          <ShieldAlert className="h-16 w-16 text-destructive" />
          <h1 className="font-display text-3xl">Access Denied</h1>
          <p className="text-muted-foreground">You need admin privileges to access this page.</p>
          <Button onClick={() => navigate("/")} variant="outline">Go Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="container mx-auto px-4 pt-24 pb-12">
        <div className="mb-8">
          <h1 className="font-display text-4xl tracking-wide">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage movies, payments, and users</p>
        </div>

        <Tabs defaultValue="movies" className="space-y-6">
          <TabsList className="bg-card border border-border">
            <TabsTrigger value="movies" className="gap-1.5 data-[state=active]:bg-gold/10 data-[state=active]:text-gold">
              <Film className="h-4 w-4" /> Movies
            </TabsTrigger>
            <TabsTrigger value="payments" className="gap-1.5 data-[state=active]:bg-gold/10 data-[state=active]:text-gold">
              <CreditCard className="h-4 w-4" /> Payments
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-1.5 data-[state=active]:bg-gold/10 data-[state=active]:text-gold">
              <Crown className="h-4 w-4" /> Premium Users
            </TabsTrigger>
          </TabsList>

          <TabsContent value="movies">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-display text-2xl tracking-wide">Movie Catalog</h2>
            <p className="text-sm text-muted-foreground">Add, edit, and manage movies & series</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="gradient-gold text-primary-foreground font-semibold">
                <Plus className="h-4 w-4 mr-1" /> Add Movie
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-xl">{editingId ? "Edit Movie" : "Add New Movie"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-5 mt-2">
                {/* Basic Info */}
                <div className="space-y-4">
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Basic Info</div>
                  <div>
                    <Label>Title *</Label>
                    <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label>Genre</Label>
                      <Input value={form.genre} onChange={(e) => setForm({ ...form, genre: e.target.value })} placeholder="Action..." />
                    </div>
                    <div>
                      <Label>Year</Label>
                      <Input type="number" value={form.release_year ?? ""} onChange={(e) => setForm({ ...form, release_year: e.target.value ? Number(e.target.value) : null })} />
                    </div>
                    <div>
                      <Label>Rating (0-10)</Label>
                      <Input type="number" step="0.1" min="0" max="10" value={form.rating ?? ""} onChange={(e) => setForm({ ...form, rating: e.target.value ? Number(e.target.value) : null })} />
                    </div>
                  </div>
                </div>

                <div className="h-px bg-border" />

                {/* Media */}
                <div className="space-y-4">
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Media</div>
                  <div>
                    <Label>Thumbnail</Label>
                    <div className="space-y-3">
                      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-border rounded-lg p-4 cursor-pointer hover:border-gold/50 transition-colors text-center"
                      >
                        {thumbnailPreview ? (
                          <div className="relative">
                            <img src={thumbnailPreview} alt="Thumbnail preview" className="w-full h-32 object-cover rounded-md" />
                            <button type="button" onClick={(e) => { e.stopPropagation(); clearThumbnailFile(); setForm({ ...form, thumbnail: "" }); }} className="absolute top-1 right-1 bg-background/80 rounded-full p-1">
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-2 text-muted-foreground">
                            <Upload className="h-6 w-6" />
                            <span className="text-sm">Click to upload image</span>
                            <span className="text-xs">Max 5MB • JPG, PNG, WebP</span>
                          </div>
                        )}
                      </div>
                      {!thumbnailFile && (
                        <>
                          <div className="flex items-center gap-2">
                            <div className="h-px flex-1 bg-border" />
                            <span className="text-xs text-muted-foreground">or paste URL</span>
                            <div className="h-px flex-1 bg-border" />
                          </div>
                          <Input value={form.thumbnail} onChange={(e) => { setForm({ ...form, thumbnail: e.target.value }); setThumbnailPreview(e.target.value || null); }} placeholder="https://..." />
                        </>
                      )}
                    </div>
                  </div>
                  <div>
                    <Label>Trailer URL</Label>
                    <Input value={form.trailer_url} onChange={(e) => setForm({ ...form, trailer_url: e.target.value })} placeholder="https://..." />
                  </div>
                  {!form.is_series && (
                    <div>
                      <Label>Video URL (Full Movie)</Label>
                      <Input value={form.video_url} onChange={(e) => setForm({ ...form, video_url: e.target.value })} placeholder="https://..." />
                    </div>
                  )}
                </div>

                <div className="h-px bg-border" />

                {/* Settings */}
                <div className="space-y-4">
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Settings</div>
                  <div className="flex items-center gap-6 flex-wrap">
                    <div className="flex items-center gap-2">
                      <Switch checked={form.is_featured} onCheckedChange={(v) => setForm({ ...form, is_featured: v })} />
                      <Label>Featured</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch checked={form.is_premium_required} onCheckedChange={(v) => setForm({ ...form, is_premium_required: v })} />
                      <Label>Premium Only</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={form.is_series}
                        onCheckedChange={(v) => {
                          setForm({ ...form, is_series: v });
                          if (!v) { setEpisodeDrafts([]); setDeletedEpisodeIds([]); }
                        }}
                      />
                      <Label>Series</Label>
                    </div>
                  </div>
                </div>

                {/* Inline Episode Editor */}
                {form.is_series && (
                  <>
                    <div className="h-px bg-border" />
                    <InlineEpisodeEditor episodes={episodeDrafts} onChange={handleEpisodeChange} />
                  </>
                )}

                <Button type="submit" className="w-full gradient-gold text-primary-foreground font-semibold" disabled={saveMutation.isPending || uploading}>
                  {uploading ? "Uploading..." : saveMutation.isPending ? "Saving..." : editingId ? "Update Movie" : "Add Movie"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead className="hidden md:table-cell">Genre</TableHead>
                <TableHead className="hidden md:table-cell">Year</TableHead>
                <TableHead className="hidden sm:table-cell">Rating</TableHead>
                <TableHead>Premium</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Featured</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
              ) : movies?.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No movies yet</TableCell></TableRow>
              ) : (
                movies?.map((movie) => (
                  <TableRow key={movie.id}>
                    <TableCell className="font-medium max-w-[200px] truncate">{movie.title}</TableCell>
                    <TableCell className="hidden md:table-cell">{movie.genre || "—"}</TableCell>
                    <TableCell className="hidden md:table-cell">{movie.release_year || "—"}</TableCell>
                    <TableCell className="hidden sm:table-cell">{movie.rating ?? "—"}</TableCell>
                    <TableCell>{movie.is_premium_required ? "✓" : "—"}</TableCell>
                    <TableCell>
                      {movie.is_series ? (
                        <span className="inline-flex items-center gap-1 text-xs bg-gold/15 text-gold px-2 py-0.5 rounded-full font-medium">
                          <ListVideo className="h-3 w-3" /> Series
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">Movie</span>
                      )}
                    </TableCell>
                    <TableCell>{movie.is_featured ? "✓" : "—"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(movie)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => {
                          if (confirm("Delete this movie?")) deleteMutation.mutate(movie.id);
                        }}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
          </TabsContent>

          <TabsContent value="payments">
            <AdminPayments />
          </TabsContent>

          <TabsContent value="users">
            <AdminPremiumUsers />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
