import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Movie } from "@/types/database";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Film, CreditCard, Crown, Users, Plus, Pencil, Trash2,
  ShieldAlert, Upload, X, ListVideo, Loader2, CheckCircle2,
  Clock, XCircle, Play, Lock, Menu, LayoutDashboard, LogOut, Eye,
} from "lucide-react";
import { toast } from "sonner";
import InlineEpisodeEditor, { type EpisodeDraft, createEpisodeDraft } from "@/components/InlineEpisodeEditor";
import { cn } from "@/lib/utils";



type Section = "movies" | "payments" | "premium-users" | "payment-requests";

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
  title: "", description: "", genre: "", release_year: null, rating: null,
  thumbnail: "", trailer_url: "", video_url: "",
  is_featured: false, is_premium_required: false, is_series: false,
};

/* ───────────────────── Sidebar ───────────────────── */
const sidebarItems: { id: Section; label: string; icon: React.ElementType }[] = [
  { id: "movies", label: "Movies", icon: Film },
  { id: "payment-requests", label: "VIP Requests", icon: Upload },
  { id: "payments", label: "Payments", icon: CreditCard },
  { id: "premium-users", label: "Premium Users", icon: Crown },
];

const AdminDashboard = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [section, setSection] = useState<Section>("movies");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  // Access control: role-based via user_roles table
  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate("/", { replace: true });
      return;
    }
    const checkAdmin = async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();
      if (!data) {
        navigate("/", { replace: true });
      } else {
        setIsAdmin(true);
      }
    };
    checkAdmin();
  }, [user, loading, navigate]);

  if (loading || isAdmin === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 flex flex-col border-r border-border bg-[hsl(var(--surface))] transition-all duration-300",
          sidebarOpen ? "w-64" : "w-16"
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center gap-3 px-4 border-b border-border shrink-0">
          <LayoutDashboard className="h-6 w-6 text-primary shrink-0" />
          {sidebarOpen && (
            <span className="font-display text-xl tracking-wider text-foreground">Admin</span>
          )}
        </div>

        {/* Nav */}
        <ScrollArea className="flex-1 py-4">
          <nav className="space-y-1 px-2">
            {sidebarItems.map((item) => {
              const active = section === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setSection(item.id)}
                  className={cn(
                    "w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-[hsl(var(--surface-hover))] hover:text-foreground"
                  )}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  {sidebarOpen && <span>{item.label}</span>}
                </button>
              );
            })}
          </nav>
        </ScrollArea>

        {/* Footer */}
        <div className="border-t border-border p-3">
          <button
            onClick={() => { signOut(); navigate("/"); }}
            className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-[hsl(var(--surface-hover))] transition-colors"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {sidebarOpen && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className={cn("flex-1 transition-all duration-300", sidebarOpen ? "ml-64" : "ml-16")}>
        {/* Top bar */}
        <header className="h-16 flex items-center gap-4 px-6 border-b border-border sticky top-0 z-20 bg-background/80 backdrop-blur-md">
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            className="p-2 rounded-lg hover:bg-[hsl(var(--surface-hover))] transition-colors"
          >
            <Menu className="h-5 w-5" />
          </button>
          <h1 className="font-display text-2xl tracking-wide capitalize">
            {section.replace("-", " ")}
          </h1>
        </header>

        {/* Content */}
        <main className="p-6">
          {section === "movies" && <MoviesSection />}
          {section === "payment-requests" && <PaymentRequestsSection />}
          {section === "payments" && <PaymentsSection />}
          {section === "premium-users" && <PremiumUsersSection />}
        </main>
      </div>
    </div>
  );
};

/* ═══════════════════════ Movies Section ═══════════════════════ */
const MoviesSection = () => {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<MovieForm>(emptyForm);
  const [episodeDrafts, setEpisodeDrafts] = useState<EpisodeDraft[]>([]);
  const [deletedEpisodeIds, setDeletedEpisodeIds] = useState<string[]>([]);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [episodeManagerId, setEpisodeManagerId] = useState<{ id: string; title: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Select an image file"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Max 5MB"); return; }
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
    const { error } = await supabase.storage.from("movie-thumbnails").upload(fileName, file, { contentType: file.type });
    if (error) throw error;
    return supabase.storage.from("movie-thumbnails").getPublicUrl(fileName).data.publicUrl;
  };

  const { data: movies, isLoading } = useQuery({
    queryKey: ["admin-movies"],
    queryFn: async () => {
      const { data, error } = await supabase.from("movies").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as Movie[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (movie: MovieForm & { id?: string }) => {
      const payload = {
        title: movie.title, description: movie.description || null, genre: movie.genre || null,
        release_year: movie.release_year, rating: movie.rating != null ? String(movie.rating) : null, thumbnail: movie.thumbnail || null,
        trailer_url: movie.trailer_url || null,
        is_featured: movie.is_featured, is_premium_required: movie.is_premium_required, is_series: movie.is_series,
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
      if (movie.is_series && movieId) {
        if (deletedEpisodeIds.length > 0) {
          await supabase.from("episodes").delete().in("id", deletedEpisodeIds);
        }
        for (const ep of episodeDrafts) {
          if (!ep.title.trim() || !ep.episode_number) continue;
          const epPayload = { movie_id: movieId, title: ep.title, episode_number: ep.episode_number, video_url: ep.video_url || null, is_free: ep.is_free };
          if (ep.id) {
            await supabase.from("episodes").update(epPayload).eq("id", ep.id);
          } else {
            await supabase.from("episodes").insert(epPayload);
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
      title: movie.title, description: movie.description || "", genre: movie.genre || "",
      release_year: movie.release_year, rating: movie.rating, thumbnail: movie.thumbnail || "",
      trailer_url: movie.trailer_url || "", video_url: movie.video_url || "",
      is_featured: movie.is_featured, is_premium_required: movie.is_premium_required, is_series: movie.is_series,
    });
    clearThumbnailFile();
    setDeletedEpisodeIds([]);
    if (movie.thumbnail) setThumbnailPreview(movie.thumbnail);
    if (movie.is_series) {
      const { data } = await supabase.from("episodes").select("*").eq("movie_id", movie.id).order("episode_number", { ascending: true });
      setEpisodeDrafts((data || []).map((ep) => createEpisodeDraft({ id: ep.id, title: ep.title, episode_number: ep.episode_number, video_url: ep.video_url || "", is_free: ep.is_free })));
    } else {
      setEpisodeDrafts([]);
    }
    setDialogOpen(true);
  };

  const handleEpisodeChange = (newEpisodes: EpisodeDraft[]) => {
    const currentKeys = new Set(newEpisodes.map((e) => e._key));
    const removed = episodeDrafts.filter((e) => !currentKeys.has(e._key) && e.id);
    if (removed.length > 0) setDeletedEpisodeIds((p) => [...p, ...removed.map((r) => r.id!)]);
    setEpisodeDrafts(newEpisodes);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error("Title is required"); return; }
    if (form.is_series && episodeDrafts.length > 0) {
      const invalid = episodeDrafts.find((ep) => !ep.title.trim() || !ep.episode_number);
      if (invalid) { toast.error("All episodes need title and number"); return; }
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
          <h2 className="font-display text-2xl tracking-wide">Movie Catalog</h2>
          <p className="text-sm text-muted-foreground">Add, edit, and manage movies & series</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="gradient-gold text-primary-foreground font-semibold gap-1">
              <Plus className="h-4 w-4" /> Add Movie
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
                  <div><Label>Genre</Label><Input value={form.genre} onChange={(e) => setForm({ ...form, genre: e.target.value })} placeholder="Action..." /></div>
                  <div><Label>Year</Label><Input type="number" value={form.release_year ?? ""} onChange={(e) => setForm({ ...form, release_year: e.target.value ? Number(e.target.value) : null })} /></div>
                  <div><Label>Rating (0-10)</Label><Input type="number" step="0.1" min="0" max="10" value={form.rating ?? ""} onChange={(e) => setForm({ ...form, rating: e.target.value ? Number(e.target.value) : null })} /></div>
                </div>
              </div>

              <div className="h-px bg-border" />

              {/* Media */}
              <div className="space-y-4">
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Media</div>
                <div>
                  <Label>Thumbnail</Label>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
                  <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-border rounded-lg p-4 cursor-pointer hover:border-primary/50 transition-colors text-center mt-1">
                    {thumbnailPreview ? (
                      <div className="relative">
                        <img src={thumbnailPreview} alt="" className="w-full h-32 object-cover rounded-md" />
                        <button type="button" onClick={(e) => { e.stopPropagation(); clearThumbnailFile(); setForm({ ...form, thumbnail: "" }); }} className="absolute top-1 right-1 bg-background/80 rounded-full p-1"><X className="h-4 w-4" /></button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <Upload className="h-6 w-6" />
                        <span className="text-sm">Click to upload image</span>
                        <span className="text-xs">Max 5MB</span>
                      </div>
                    )}
                  </div>
                  {!thumbnailFile && (
                    <>
                      <div className="flex items-center gap-2 my-2"><div className="h-px flex-1 bg-border" /><span className="text-xs text-muted-foreground">or paste URL</span><div className="h-px flex-1 bg-border" /></div>
                      <Input value={form.thumbnail} onChange={(e) => { setForm({ ...form, thumbnail: e.target.value }); setThumbnailPreview(e.target.value || null); }} placeholder="https://..." />
                    </>
                  )}
                </div>
                <div><Label>Trailer URL</Label><Input value={form.trailer_url} onChange={(e) => setForm({ ...form, trailer_url: e.target.value })} placeholder="https://..." /></div>
                {!form.is_series && <div><Label>Video URL (Full Movie)</Label><Input value={form.video_url} onChange={(e) => setForm({ ...form, video_url: e.target.value })} placeholder="https://..." /></div>}
              </div>

              <div className="h-px bg-border" />

              {/* Settings */}
              <div className="space-y-4">
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Settings</div>
                <div className="flex items-center gap-6 flex-wrap">
                  <div className="flex items-center gap-2"><Switch checked={form.is_featured} onCheckedChange={(v) => setForm({ ...form, is_featured: v })} /><Label>Featured</Label></div>
                  <div className="flex items-center gap-2"><Switch checked={form.is_premium_required} onCheckedChange={(v) => setForm({ ...form, is_premium_required: v })} /><Label>Premium Only</Label></div>
                  <div className="flex items-center gap-2"><Switch checked={form.is_series} onCheckedChange={(v) => { setForm({ ...form, is_series: v }); if (!v) { setEpisodeDrafts([]); setDeletedEpisodeIds([]); } }} /><Label>Series</Label></div>
                </div>
              </div>

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

      {/* Movie Table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead className="hidden md:table-cell">Genre</TableHead>
              <TableHead className="hidden md:table-cell">Year</TableHead>
              <TableHead>Premium</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Featured</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
            ) : !movies?.length ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No movies yet</TableCell></TableRow>
            ) : (
              movies.map((movie) => (
                <TableRow key={movie.id}>
                  <TableCell className="font-medium max-w-[200px] truncate">{movie.title}</TableCell>
                  <TableCell className="hidden md:table-cell">{movie.genre || "—"}</TableCell>
                  <TableCell className="hidden md:table-cell">{movie.release_year || "—"}</TableCell>
                  <TableCell>{movie.is_premium_required ? "✓" : "—"}</TableCell>
                  <TableCell>
                    {movie.is_series ? (
                      <span className="inline-flex items-center gap-1 text-xs bg-primary/15 text-primary px-2 py-0.5 rounded-full font-medium">
                        <ListVideo className="h-3 w-3" /> Series
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">Movie</span>
                    )}
                  </TableCell>
                  <TableCell>{movie.is_featured ? "✓" : "—"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(movie)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => { if (confirm("Delete this movie?")) deleteMutation.mutate(movie.id); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
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

/* ═══════════════════════ Payments Section ═══════════════════════ */
interface PaymentRow {
  id: string; user_id: string; username: string | null; email: string | null;
  plan_name: string; amount: number; payment_method: string; status: string;
  duration_days: number; created_at: string; completed_at: string | null;
}

const PaymentsSection = () => {
  const queryClient = useQueryClient();

  const { data: payments, isLoading } = useQuery({
    queryKey: ["admin-payments"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_list_payments");
      if (error) throw error;
      return data as PaymentRow[];
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (paymentId: string) => {
      const { error } = await supabase.rpc("admin_verify_payment", { p_payment_id: paymentId });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-payments"] });
      queryClient.invalidateQueries({ queryKey: ["admin-premium-users"] });
      toast.success("Payment approved & premium activated!");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const pendingPayments = payments?.filter((p) => p.status === "pending") || [];
  const otherPayments = payments?.filter((p) => p.status !== "pending") || [];

  const statusIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle2 className="h-4 w-4 text-emerald-400" />;
      case "pending": return <Clock className="h-4 w-4 text-primary" />;
      default: return <XCircle className="h-4 w-4 text-destructive" />;
    }
  };

  return (
    <div className="space-y-8">
      {/* Pending Payments - Highlighted */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <h2 className="font-display text-2xl tracking-wide">Pending Approvals</h2>
          {pendingPayments.length > 0 && (
            <Badge className="gradient-gold text-primary-foreground">{pendingPayments.length}</Badge>
          )}
        </div>
        <div className="rounded-lg border border-primary/30 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow><TableHead>User</TableHead><TableHead>Plan</TableHead><TableHead>Amount</TableHead><TableHead>Method</TableHead><TableHead className="hidden md:table-cell">Date</TableHead><TableHead className="text-right">Action</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
              ) : !pendingPayments.length ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No pending payments 🎉</TableCell></TableRow>
              ) : (
                pendingPayments.map((p) => (
                  <TableRow key={p.id} className="bg-primary/5">
                    <TableCell>
                      <div><p className="text-sm font-medium">{p.username || "—"}</p><p className="text-xs text-muted-foreground">{p.email || "—"}</p></div>
                    </TableCell>
                    <TableCell className="text-sm">{p.plan_name}</TableCell>
                    <TableCell className="text-sm font-medium text-primary">${p.amount}</TableCell>
                    <TableCell className="text-xs uppercase">{p.payment_method}</TableCell>
                    <TableCell className="hidden md:table-cell text-xs text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        className="gradient-gold text-primary-foreground text-xs font-semibold"
                        disabled={approveMutation.isPending}
                        onClick={() => {
                          if (confirm(`Approve payment for ${p.username || p.email}?\nThis will activate their premium subscription.`))
                            approveMutation.mutate(p.id);
                        }}
                      >
                        {approveMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Approve"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* All Payments History */}
      <div className="space-y-4">
        <h2 className="font-display text-2xl tracking-wide">Payment History</h2>
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow><TableHead>Status</TableHead><TableHead>User</TableHead><TableHead>Plan</TableHead><TableHead>Amount</TableHead><TableHead className="hidden md:table-cell">Date</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {!otherPayments.length ? (
                <TableRow><TableCell colSpan={5} className="text-center py-6 text-muted-foreground">No completed payments</TableCell></TableRow>
              ) : (
                otherPayments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell><div className="flex items-center gap-1.5">{statusIcon(p.status)}<Badge variant={p.status === "completed" ? "default" : "destructive"} className="text-[10px]">{p.status}</Badge></div></TableCell>
                    <TableCell><p className="text-sm font-medium">{p.username || "—"}</p></TableCell>
                    <TableCell className="text-sm">{p.plan_name}</TableCell>
                    <TableCell className="text-sm font-medium">${p.amount}</TableCell>
                    <TableCell className="hidden md:table-cell text-xs text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</TableCell>
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

/* ═══════════════════════ Premium Users Section ═══════════════════════ */
const PremiumUsersSection = () => {
  const { data: users, isLoading } = useQuery({
    queryKey: ["admin-premium-users"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_list_premium_users");
      if (error) throw error;
      return data as { user_id: string; username: string | null; email: string | null; is_premium: boolean; subscription_expiry: string | null; created_at: string }[];
    },
  });

  const isExpired = (expiry: string | null) => expiry ? new Date(expiry) < new Date() : false;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-2xl tracking-wide">Premium Users</h2>
        <p className="text-sm text-muted-foreground">{users?.length || 0} subscriber{(users?.length || 0) !== 1 ? "s" : ""}</p>
      </div>
      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader><TableRow><TableHead>User</TableHead><TableHead>Email</TableHead><TableHead>Status</TableHead><TableHead>Expires</TableHead><TableHead>Joined</TableHead></TableRow></TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
            ) : !users?.length ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No premium users</TableCell></TableRow>
            ) : (
              users.map((u) => (
                <TableRow key={u.user_id}>
                  <TableCell><div className="flex items-center gap-2"><Crown className="h-4 w-4 text-primary" /><span className="font-medium text-sm">{u.username || "—"}</span></div></TableCell>
                  <TableCell className="text-sm text-muted-foreground">{u.email || "—"}</TableCell>
                  <TableCell>{isExpired(u.subscription_expiry) ? <span className="text-xs bg-destructive/20 text-destructive px-2 py-0.5 rounded-full font-semibold">Expired</span> : <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-semibold">Active</span>}</TableCell>
                  <TableCell className="text-sm">{u.subscription_expiry ? new Date(u.subscription_expiry).toLocaleDateString() : "—"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{new Date(u.created_at).toLocaleDateString()}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

/* ═══════════════════════ Payment Requests Section ═══════════════════════ */
const PaymentRequestsSection = () => {
  const queryClient = useQueryClient();

  const { data: requests, isLoading } = useQuery({
    queryKey: ["admin-payment-requests"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_list_payment_requests");
      if (error) throw error;
      return data as { id: string; user_id: string; username: string | null; email: string | null; amount: number; receipt_url: string | null; status: string; created_at: string }[];
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (requestId: string) => {
      const { error } = await supabase.rpc("admin_approve_payment_request", { p_request_id: requestId });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-payment-requests"] });
      queryClient.invalidateQueries({ queryKey: ["admin-premium-users"] });
      toast.success("VIP request approved! User is now premium.");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const rejectMutation = useMutation({
    mutationFn: async (requestId: string) => {
      const { error } = await supabase.rpc("admin_reject_payment_request", { p_request_id: requestId });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-payment-requests"] });
      toast.success("Payment request rejected.");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const pending = requests?.filter((r) => r.status === "pending") || [];
  const processed = requests?.filter((r) => r.status !== "pending") || [];

  return (
    <div className="space-y-8">
      {/* Receipt Preview Modal */}
      {previewUrl && (
        <Dialog open={!!previewUrl} onOpenChange={() => setPreviewUrl(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Payment Receipt</DialogTitle>
            </DialogHeader>
            <img src={previewUrl} alt="Receipt" className="w-full rounded-lg" />
          </DialogContent>
        </Dialog>
      )}

      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <h2 className="font-display text-2xl tracking-wide">Pending VIP Requests</h2>
          {pending.length > 0 && (
            <Badge className="gradient-gold text-primary-foreground">{pending.length}</Badge>
          )}
        </div>
        <div className="rounded-lg border border-primary/30 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Receipt</TableHead>
                <TableHead className="hidden md:table-cell">Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
              ) : !pending.length ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No pending requests 🎉</TableCell></TableRow>
              ) : (
                pending.map((r) => (
                  <TableRow key={r.id} className="bg-primary/5">
                    <TableCell>
                      <div><p className="text-sm font-medium">{r.username || "—"}</p><p className="text-xs text-muted-foreground">{r.email || "—"}</p></div>
                    </TableCell>
                    <TableCell className="text-sm font-medium text-gold">${r.amount}</TableCell>
                    <TableCell>
                      {r.receipt_url ? (
                        <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={() => setPreviewUrl(r.receipt_url)}>
                          <Eye className="h-3 w-3" /> View
                        </Button>
                      ) : "—"}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs text-destructive border-destructive/30 hover:bg-destructive/10"
                          disabled={rejectMutation.isPending}
                          onClick={() => {
                            if (confirm(`Reject payment from ${r.username || r.email}?`))
                              rejectMutation.mutate(r.id);
                          }}
                        >
                          {rejectMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Reject"}
                        </Button>
                        <Button
                          size="sm"
                          className="gradient-gold text-primary-foreground text-xs font-semibold"
                          disabled={approveMutation.isPending}
                          onClick={() => {
                            if (confirm(`Approve VIP for ${r.username || r.email}?`))
                              approveMutation.mutate(r.id);
                          }}
                        >
                          {approveMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Approve"}
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

      {/* Processed */}
      <div className="space-y-4">
        <h2 className="font-display text-2xl tracking-wide">Processed Requests</h2>
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow><TableHead>User</TableHead><TableHead>Amount</TableHead><TableHead>Status</TableHead><TableHead>Date</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {!processed.length ? (
                <TableRow><TableCell colSpan={4} className="text-center py-6 text-muted-foreground">No processed requests</TableCell></TableRow>
              ) : (
                processed.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell><p className="text-sm font-medium">{r.username || r.email || "—"}</p></TableCell>
                    <TableCell className="text-sm">${r.amount}</TableCell>
                    <TableCell>
                      <Badge variant="default" className="text-[10px]">
                        <CheckCircle2 className="h-3 w-3 mr-1" /> {r.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</TableCell>
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

export default AdminDashboard;
