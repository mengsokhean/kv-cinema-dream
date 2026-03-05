import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
import { Plus, Pencil, Trash2, ShieldAlert, Upload, ImageIcon, X } from "lucide-react";
import { toast } from "sonner";

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
};

const Admin = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<MovieForm>(emptyForm);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }
    setThumbnailFile(file);
    setThumbnailPreview(URL.createObjectURL(file));
    setForm({ ...form, thumbnail: "" }); // clear URL if uploading
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
    const { data: urlData } = supabase.storage
      .from("movie-thumbnails")
      .getPublicUrl(fileName);
    return urlData.publicUrl;
  };

  // Check admin role
  const { data: isAdmin, isLoading: roleLoading } = useQuery({
    queryKey: ["isAdmin", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user!.id)
        .eq("role", "admin")
        .maybeSingle();
      return !!data;
    },
  });

  const { data: movies, isLoading } = useQuery({
    queryKey: ["admin-movies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("movies")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
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
      };

      if (movie.id) {
        const { error } = await supabase.from("movies").update(payload).eq("id", movie.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("movies").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-movies"] });
      queryClient.invalidateQueries({ queryKey: ["movies"] });
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
    clearThumbnailFile();
  };

  const openEdit = (movie: any) => {
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
    });
    clearThumbnailFile();
    if (movie.thumbnail) setThumbnailPreview(movie.thumbnail);
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error("Title is required");
      return;
    }
    let finalForm = { ...form };
    if (thumbnailFile) {
      try {
        setUploading(true);
        const url = await uploadThumbnail(thumbnailFile);
        finalForm.thumbnail = url;
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
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-4xl tracking-wide">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage your movie catalog</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="gradient-gold text-primary-foreground font-semibold">
                <Plus className="h-4 w-4 mr-1" /> Add Movie
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingId ? "Edit Movie" : "Add Movie"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-2">
                <div>
                  <Label>Title *</Label>
                  <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Genre</Label>
                    <Input value={form.genre} onChange={(e) => setForm({ ...form, genre: e.target.value })} placeholder="Action, Drama..." />
                  </div>
                  <div>
                    <Label>Release Year</Label>
                    <Input type="number" value={form.release_year ?? ""} onChange={(e) => setForm({ ...form, release_year: e.target.value ? Number(e.target.value) : null })} />
                  </div>
                </div>
                <div>
                  <Label>Rating (0-10)</Label>
                  <Input type="number" step="0.1" min="0" max="10" value={form.rating ?? ""} onChange={(e) => setForm({ ...form, rating: e.target.value ? Number(e.target.value) : null })} />
                </div>
                <div>
                  <Label>Thumbnail</Label>
                  <div className="space-y-3">
                    {/* Upload area */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileSelect}
                    />
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-border rounded-lg p-4 cursor-pointer hover:border-gold/50 transition-colors text-center"
                    >
                      {thumbnailPreview ? (
                        <div className="relative">
                          <img
                            src={thumbnailPreview}
                            alt="Thumbnail preview"
                            className="w-full h-32 object-cover rounded-md"
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              clearThumbnailFile();
                              setForm({ ...form, thumbnail: "" });
                            }}
                            className="absolute top-1 right-1 bg-background/80 rounded-full p-1"
                          >
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
                    {/* OR URL fallback */}
                    {!thumbnailFile && (
                      <div className="flex items-center gap-2">
                        <div className="h-px flex-1 bg-border" />
                        <span className="text-xs text-muted-foreground">or paste URL</span>
                        <div className="h-px flex-1 bg-border" />
                      </div>
                    )}
                    {!thumbnailFile && (
                      <Input
                        value={form.thumbnail}
                        onChange={(e) => {
                          setForm({ ...form, thumbnail: e.target.value });
                          if (e.target.value) setThumbnailPreview(e.target.value);
                          else setThumbnailPreview(null);
                        }}
                        placeholder="https://..."
                      />
                    )}
                  </div>
                </div>
                <div>
                  <Label>Trailer URL</Label>
                  <Input value={form.trailer_url} onChange={(e) => setForm({ ...form, trailer_url: e.target.value })} placeholder="https://..." />
                </div>
                <div>
                  <Label>Video URL (Full Movie)</Label>
                  <Input value={form.video_url} onChange={(e) => setForm({ ...form, video_url: e.target.value })} placeholder="https://..." />
                </div>
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <Switch checked={form.is_featured} onCheckedChange={(v) => setForm({ ...form, is_featured: v })} />
                    <Label>Featured</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={form.is_premium_required} onCheckedChange={(v) => setForm({ ...form, is_premium_required: v })} />
                    <Label>Premium Only</Label>
                  </div>
                </div>
                <Button type="submit" className="w-full gradient-gold text-primary-foreground font-semibold" disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? "Saving..." : editingId ? "Update Movie" : "Add Movie"}
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
                <TableHead>Featured</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
              ) : movies?.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No movies yet</TableCell></TableRow>
              ) : (
                movies?.map((movie) => (
                  <TableRow key={movie.id}>
                    <TableCell className="font-medium max-w-[200px] truncate">{movie.title}</TableCell>
                    <TableCell className="hidden md:table-cell">{movie.genre || "—"}</TableCell>
                    <TableCell className="hidden md:table-cell">{movie.release_year || "—"}</TableCell>
                    <TableCell className="hidden sm:table-cell">{movie.rating ?? "—"}</TableCell>
                    <TableCell>{movie.is_premium_required ? "✓" : "—"}</TableCell>
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
      </div>
    </div>
  );
};

export default Admin;
