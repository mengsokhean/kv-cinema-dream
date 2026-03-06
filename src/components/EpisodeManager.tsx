import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Pencil, Trash2, Play, Lock } from "lucide-react";
import { toast } from "sonner";

interface EpisodeForm {
  title: string;
  episode_number: number | null;
  video_url: string;
  is_free: boolean;
}

const emptyEpisodeForm: EpisodeForm = {
  title: "",
  episode_number: null,
  video_url: "",
  is_free: false,
};

interface EpisodeManagerProps {
  movieId: string;
  movieTitle: string;
  open: boolean;
  onClose: () => void;
}

const EpisodeManager = ({ movieId, movieTitle, open, onClose }: EpisodeManagerProps) => {
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<EpisodeForm>(emptyEpisodeForm);

  const { data: episodes, isLoading } = useQuery({
    queryKey: ["admin-episodes", movieId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("episodes")
        .select("*")
        .eq("movie_id", movieId)
        .order("episode_number", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  const saveMutation = useMutation({
    mutationFn: async (ep: EpisodeForm & { id?: string }) => {
      if (!ep.episode_number) throw new Error("Episode number is required");
      const payload = {
        movie_id: movieId,
        title: ep.title,
        episode_number: ep.episode_number,
        video_url: ep.video_url || null,
        is_free: ep.is_free,
      };
      if (ep.id) {
        const { error } = await supabase.from("episodes").update(payload).eq("id", ep.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("episodes").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-episodes", movieId] });
      queryClient.invalidateQueries({ queryKey: ["episodes", movieId] });
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
      queryClient.invalidateQueries({ queryKey: ["admin-episodes", movieId] });
      queryClient.invalidateQueries({ queryKey: ["episodes", movieId] });
      toast.success("Episode deleted");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const resetForm = () => {
    setForm(emptyEpisodeForm);
    setEditingId(null);
    setFormOpen(false);
  };

  const openEdit = (ep: any) => {
    setEditingId(ep.id);
    setForm({
      title: ep.title,
      episode_number: ep.episode_number,
      video_url: ep.video_url || "",
      is_free: ep.is_free,
    });
    setFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error("Title is required");
    if (!form.episode_number) return toast.error("Episode number is required");
    saveMutation.mutate({ ...form, id: editingId ?? undefined });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { onClose(); resetForm(); } }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Episodes — {movieTitle}</DialogTitle>
        </DialogHeader>

        {/* Add/Edit form */}
        {formOpen ? (
          <form onSubmit={handleSubmit} className="space-y-3 border border-border rounded-lg p-4">
            <h4 className="font-semibold text-sm">{editingId ? "Edit Episode" : "Add Episode"}</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Episode # *</Label>
                <Input
                  type="number"
                  min={1}
                  value={form.episode_number ?? ""}
                  onChange={(e) => setForm({ ...form, episode_number: e.target.value ? Number(e.target.value) : null })}
                />
              </div>
              <div>
                <Label>Title *</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Video URL</Label>
              <Input value={form.video_url} onChange={(e) => setForm({ ...form, video_url: e.target.value })} placeholder="https://..." />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.is_free} onCheckedChange={(v) => setForm({ ...form, is_free: v })} />
              <Label>Free episode (accessible without premium)</Label>
            </div>
            <div className="flex gap-2">
              <Button type="submit" size="sm" className="gradient-gold text-primary-foreground font-semibold" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? "Saving..." : editingId ? "Update" : "Add"}
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={resetForm}>Cancel</Button>
            </div>
          </form>
        ) : (
          <Button size="sm" variant="outline" onClick={() => setFormOpen(true)} className="w-fit">
            <Plus className="h-4 w-4 mr-1" /> Add Episode
          </Button>
        )}

        {/* Episode list */}
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">#</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Access</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={4} className="text-center py-6 text-muted-foreground">Loading...</TableCell></TableRow>
              ) : !episodes?.length ? (
                <TableRow><TableCell colSpan={4} className="text-center py-6 text-muted-foreground">No episodes yet</TableCell></TableRow>
              ) : (
                episodes.map((ep) => (
                  <TableRow key={ep.id}>
                    <TableCell className="font-mono">{ep.episode_number}</TableCell>
                    <TableCell className="font-medium">{ep.title}</TableCell>
                    <TableCell>
                      {ep.is_free ? (
                        <span className="flex items-center gap-1 text-xs text-green-500"><Play className="h-3 w-3" /> Free</span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-gold"><Lock className="h-3 w-3" /> Premium</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(ep)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => {
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
      </DialogContent>
    </Dialog>
  );
};

export default EpisodeManager;
