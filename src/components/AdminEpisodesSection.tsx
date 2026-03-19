import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil, Trash2, Play, Lock, Image, Upload, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface EpisodeRow {
  id: string;
  title: string | null;
  episode_number: number;
  video_url: string;
  thumbnail_url: string | null;
  is_free: boolean | null;
  quality: string | null;
  status: string | null;
  movie_id: string | null;
  created_at: string | null;
  movie_title?: string;
}

interface EpisodeForm {
  title: string;
  episode_number: number | null;
  video_url: string;
  thumbnail_url: string;
  is_free: boolean;
  quality: string;
  status: string;
  movie_id: string;
}

const emptyForm: EpisodeForm = {
  title: "",
  episode_number: null,
  video_url: "",
  thumbnail_url: "",
  is_free: false,
  quality: "HD",
  status: "published",
  movie_id: "",
};

const AdminEpisodesSection = () => {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<EpisodeForm>(emptyForm);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: seriesMovies } = useQuery({
    queryKey: ["admin-series-movies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("movies")
        .select("id, title")
        .eq("is_series", true)
        .order("title");
      if (error) throw error;
      return data;
    },
  });

  const { data: episodes, isLoading } = useQuery({
    queryKey: ["admin-all-episodes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("episodes")
        .select("*, movies!episodes_movie_id_fkey(title)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []).map((ep: any) => ({
        ...ep,
        movie_title: ep.movies?.title || "Unknown",
      })) as EpisodeRow[];
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Select an image file"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Max 5MB"); return; }
    setThumbnailFile(file);
    setThumbnailPreview(URL.createObjectURL(file));
    setForm({ ...form, thumbnail_url: "" });
  };

  const clearThumbnailFile = () => {
    setThumbnailFile(null);
    setThumbnailPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const uploadThumbnail = async (file: File): Promise<string> => {
    const ext = file.name.split(".").pop();
    const fileName = `ep_${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("movie-thumbnails").upload(fileName, file, { contentType: file.type });
    if (error) throw error;
    return supabase.storage.from("movie-thumbnails").getPublicUrl(fileName).data.publicUrl;
  };

  const saveMutation = useMutation({
    mutationFn: async (ep: EpisodeForm & { id?: string }) => {
      if (!ep.episode_number) throw new Error("Episode number is required");
      if (!ep.movie_id) throw new Error("TV Show is required");
      if (!ep.video_url.trim()) throw new Error("Video URL is required");

      const payload: Record<string, unknown> = {
        movie_id: ep.movie_id,
        title: ep.title || null,
        episode_number: ep.episode_number,
        video_url: ep.video_url,
        thumbnail_url: ep.thumbnail_url || null,
        is_free: ep.is_free,
        quality: ep.quality,
        status: ep.status,
      };

      if (ep.id) {
        const { error } = await supabase.from("episodes").update(payload).eq("id", ep.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("episodes").insert(payload as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-all-episodes"] });
      queryClient.invalidateQueries({ queryKey: ["episodes"] });
      queryClient.invalidateQueries({ queryKey: ["movies"] });
      toast.success(editingId ? "Episode updated" : "Episode added");
      resetForm();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("episodes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-all-episodes"] });
      queryClient.invalidateQueries({ queryKey: ["episodes"] });
      toast.success("Episode deleted");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setDialogOpen(false);
    clearThumbnailFile();
  };

  const openEdit = (ep: EpisodeRow) => {
    setEditingId(ep.id);
    setForm({
      title: ep.title || "",
      episode_number: ep.episode_number,
      video_url: ep.video_url || "",
      thumbnail_url: ep.thumbnail_url || "",
      is_free: !!ep.is_free,
      quality: ep.quality || "HD",
      status: ep.status || "published",
      movie_id: ep.movie_id || "",
    });
    clearThumbnailFile();
    if (ep.thumbnail_url) setThumbnailPreview(ep.thumbnail_url);
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error("Title is required"); return; }
    if (!form.episode_number) { toast.error("Episode number is required"); return; }
    if (!form.movie_id) { toast.error("Select a TV Show"); return; }
    if (!form.video_url.trim()) { toast.error("Video URL is required"); return; }

    let finalForm = { ...form };
    if (thumbnailFile) {
      try {
        setUploading(true);
        finalForm.thumbnail_url = await uploadThumbnail(thumbnailFile);
      } catch (err: any) {
        toast.error("Upload failed: " + err.message);
        return;
      } finally {
        setUploading(false);
      }
    }
    saveMutation.mutate({ ...finalForm, id: editingId ?? undefined });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl tracking-wide">All Episodes</h2>
          <p className="text-sm text-muted-foreground">
            {episodes?.length || 0} episode{(episodes?.length || 0) !== 1 ? "s" : ""} across all shows
          </p>
        </div>
        <Button
          className="gradient-gold text-primary-foreground font-semibold gap-1"
          onClick={() => { resetForm(); setDialogOpen(true); }}
        >
          <Plus className="h-4 w-4" /> Add Episode
        </Button>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) resetForm(); setDialogOpen(open); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">{editingId ? "Edit Episode" : "Add New Episode"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-5 mt-2">
            {/* TV Show */}
            <div>
              <Label>TV Show *</Label>
              <Select value={form.movie_id} onValueChange={(v) => setForm({ ...form, movie_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select a TV show..." /></SelectTrigger>
                <SelectContent>
                  {seriesMovies?.map((m) => (
                    <SelectItem key={m.id} value={m.id}>{m.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Episode # & Title */}
            <div className="grid grid-cols-[100px_1fr] gap-3">
              <div>
                <Label>Episode #*</Label>
                <Input
                  type="number" min={1}
                  value={form.episode_number ?? ""}
                  onChange={(e) => setForm({ ...form, episode_number: e.target.value ? Number(e.target.value) : null })}
                />
              </div>
              <div>
                <Label>Title *</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Episode title" />
              </div>
            </div>

            <div className="h-px bg-border" />

            {/* Video URL */}
            <div>
              <Label>Video URL *</Label>
              <Input
                value={form.video_url}
                onChange={(e) => setForm({ ...form, video_url: e.target.value })}
                placeholder="https://drive.google.com/... or any video link"
              />
              <p className="text-xs text-muted-foreground mt-1">Paste a link from Google Drive, Dropbox, or any external storage</p>
            </div>

            {/* Thumbnail */}
            <div>
              <Label>Thumbnail</Label>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-border rounded-lg p-4 cursor-pointer hover:border-primary/50 transition-colors text-center mt-1"
              >
                {thumbnailPreview ? (
                  <div className="relative">
                    <img src={thumbnailPreview} alt="" className="w-full h-32 object-cover rounded-md" />
                    <button type="button" onClick={(e) => { e.stopPropagation(); clearThumbnailFile(); setForm({ ...form, thumbnail_url: "" }); }} className="absolute top-1 right-1 bg-background/80 rounded-full p-1">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Upload className="h-6 w-6" />
                    <span className="text-sm">Click to upload thumbnail</span>
                    <span className="text-xs">Max 5MB</span>
                  </div>
                )}
              </div>
              {!thumbnailFile && (
                <>
                  <div className="flex items-center gap-2 my-2">
                    <div className="h-px flex-1 bg-border" />
                    <span className="text-xs text-muted-foreground">or paste URL</span>
                    <div className="h-px flex-1 bg-border" />
                  </div>
                  <Input
                    value={form.thumbnail_url}
                    onChange={(e) => { setForm({ ...form, thumbnail_url: e.target.value }); setThumbnailPreview(e.target.value || null); }}
                    placeholder="https://..."
                  />
                </>
              )}
            </div>

            <div className="h-px bg-border" />

            {/* Quality, Access, Status */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Quality</Label>
                <Select value={form.quality} onValueChange={(v) => setForm({ ...form, quality: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SD">SD</SelectItem>
                    <SelectItem value="HD">HD</SelectItem>
                    <SelectItem value="FHD">Full HD</SelectItem>
                    <SelectItem value="4K">4K</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Access Level</Label>
                <div className="flex items-center gap-2 mt-2">
                  <Switch checked={form.is_free} onCheckedChange={(v) => setForm({ ...form, is_free: v })} />
                  <span className="text-sm">{form.is_free ? "Free" : "Premium"}</span>
                </div>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button type="submit" className="w-full gradient-gold text-primary-foreground font-semibold" disabled={saveMutation.isPending || uploading}>
              {uploading ? "Uploading..." : saveMutation.isPending ? "Saving..." : editingId ? "Update Episode" : "Add Episode"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Episodes Table */}
      <div className="rounded-lg border border-border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Thumb</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>TV Show</TableHead>
              <TableHead>Access</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Quality</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : !episodes?.length ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No episodes yet. Add your first episode above.
                </TableCell>
              </TableRow>
            ) : (
              episodes.map((ep) => (
                <TableRow key={ep.id}>
                  <TableCell>
                    {ep.thumbnail_url ? (
                      <img src={ep.thumbnail_url} alt="" className="w-12 h-8 object-cover rounded" />
                    ) : (
                      <div className="w-12 h-8 bg-muted rounded flex items-center justify-center">
                        <Image className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm truncate max-w-[180px]">{ep.title || "Untitled"}</p>
                      <p className="text-xs text-muted-foreground">Ep #{ep.episode_number}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground truncate max-w-[140px] block">{ep.movie_title}</span>
                  </TableCell>
                  <TableCell>
                    {ep.is_free ? (
                      <Badge variant="outline" className="text-[10px] gap-1 border-emerald-500/30 text-emerald-500">
                        <Play className="h-2.5 w-2.5" /> Free
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] gap-1 border-primary/30 text-primary">
                        <Lock className="h-2.5 w-2.5" /> Premium
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {ep.status === "draft" ? (
                      <Badge variant="secondary" className="text-[10px]">Draft</Badge>
                    ) : (
                      <Badge className="text-[10px] bg-emerald-500/20 text-emerald-500 border-0">Published</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-xs font-mono text-muted-foreground">{ep.quality || "HD"}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(ep)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                        if (confirm("Delete this episode?")) deleteMutation.mutate(ep.id);
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
  );
};

export default AdminEpisodesSection;
