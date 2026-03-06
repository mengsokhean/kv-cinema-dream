import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, GripVertical, Play, Lock } from "lucide-react";

export interface EpisodeDraft {
  _key: string; // local key for React
  id?: string; // DB id if editing existing
  title: string;
  episode_number: number | null;
  video_url: string;
  is_free: boolean;
}

interface InlineEpisodeEditorProps {
  episodes: EpisodeDraft[];
  onChange: (episodes: EpisodeDraft[]) => void;
}

let keyCounter = 0;
export const createEpisodeDraft = (overrides?: Partial<EpisodeDraft>): EpisodeDraft => ({
  _key: `ep_${++keyCounter}_${Date.now()}`,
  title: "",
  episode_number: null,
  video_url: "",
  is_free: false,
  ...overrides,
});

const InlineEpisodeEditor = ({ episodes, onChange }: InlineEpisodeEditorProps) => {
  const updateEpisode = (key: string, field: keyof EpisodeDraft, value: any) => {
    onChange(episodes.map((ep) => (ep._key === key ? { ...ep, [field]: value } : ep)));
  };

  const removeEpisode = (key: string) => {
    onChange(episodes.filter((ep) => ep._key !== key));
  };

  const addEpisode = () => {
    const nextNum = episodes.length > 0
      ? Math.max(...episodes.map((e) => e.episode_number || 0)) + 1
      : 1;
    onChange([...episodes, createEpisodeDraft({ episode_number: nextNum })]);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold">Manage Episodes</Label>
        <Button type="button" size="sm" variant="outline" onClick={addEpisode} className="gap-1">
          <Plus className="h-3.5 w-3.5" /> Add Episode
        </Button>
      </div>

      {episodes.length === 0 && (
        <div className="border border-dashed border-border rounded-lg p-6 text-center text-muted-foreground text-sm">
          No episodes yet. Click "Add Episode" to get started.
        </div>
      )}

      <div className="space-y-2">
        {episodes.map((ep) => (
          <div
            key={ep._key}
            className="border border-border rounded-lg p-3 bg-muted/30 space-y-2"
          >
            <div className="flex items-center gap-2">
              <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="flex items-center gap-1.5 shrink-0">
                {ep.is_free ? (
                  <Play className="h-3.5 w-3.5 text-green-500" />
                ) : (
                  <Lock className="h-3.5 w-3.5 text-gold" />
                )}
              </div>
              <span className="text-xs font-mono text-muted-foreground shrink-0 w-8">
                #{ep.episode_number || "—"}
              </span>
              <span className="text-sm font-medium truncate flex-1">
                {ep.title || "Untitled Episode"}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0"
                onClick={() => removeEpisode(ep._key)}
              >
                <Trash2 className="h-3.5 w-3.5 text-destructive" />
              </Button>
            </div>

            <div className="grid grid-cols-[80px_1fr] gap-2">
              <div>
                <Input
                  type="number"
                  min={1}
                  placeholder="#"
                  value={ep.episode_number ?? ""}
                  onChange={(e) =>
                    updateEpisode(ep._key, "episode_number", e.target.value ? Number(e.target.value) : null)
                  }
                  className="h-8 text-sm"
                />
              </div>
              <div>
                <Input
                  placeholder="Episode title"
                  value={ep.title}
                  onChange={(e) => updateEpisode(ep._key, "title", e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Input
                placeholder="Video URL (https://...)"
                value={ep.video_url}
                onChange={(e) => updateEpisode(ep._key, "video_url", e.target.value)}
                className="h-8 text-sm flex-1"
              />
              <div className="flex items-center gap-1.5 shrink-0">
                <Checkbox
                  id={`free-${ep._key}`}
                  checked={ep.is_free}
                  onCheckedChange={(v) => updateEpisode(ep._key, "is_free", !!v)}
                />
                <label htmlFor={`free-${ep._key}`} className="text-xs text-muted-foreground cursor-pointer">
                  Free
                </label>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default InlineEpisodeEditor;
