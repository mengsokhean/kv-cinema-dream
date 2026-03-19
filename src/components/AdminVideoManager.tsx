// File: src/components/AdminVideoManager.tsx
import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Upload, X } from 'lucide-react';
import VideoPlayer from './VideoPlayer';

interface VideoForm {
  title: string;
  description: string;
  video_url: string;
  thumbnail_url: string;
  video_type: 'file' | 'youtube' | 'gdrive' | 'vimeo';
  quality: 'SD' | 'HD' | 'FHD' | '4K';
  is_published: boolean;
  is_premium: boolean;
  duration_seconds: number | null;
}

const emptyForm: VideoForm = {
  title: '',
  description: '',
  video_url: '',
  thumbnail_url: '',
  video_type: 'file',
  quality: 'HD',
  is_published: false,
  is_premium: false,
  duration_seconds: null,
};

export const AdminVideoManager: React.FC = () => {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<VideoForm>(emptyForm);
  const [uploadingFile, setUploadingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch videos
  const { data: videos, isLoading } = useQuery({
    queryKey: ['admin-videos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // Save video mutation
  const saveMutation = useMutation({
    mutationFn: async (formData: VideoForm & { id?: string }) => {
      const payload = {
        title: formData.title,
        description: formData.description || null,
        video_url: formData.video_url,
        thumbnail_url: formData.thumbnail_url || null,
        video_type: formData.video_type,
        quality: formData.quality,
        is_published: formData.is_published,
        is_premium: formData.is_premium,
        duration_seconds: formData.duration_seconds,
        updated_at: new Date().toISOString(),
      };

      if (formData.id) {
        const { error } = await supabase
          .from('videos')
          .update(payload)
          .eq('id', formData.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('videos')
          .insert({
            ...payload,
            created_by: (await supabase.auth.getUser()).data.user?.id,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-videos'] });
      toast.success(editingId ? 'Video updated' : 'Video added');
      setDialogOpen(false);
      resetForm();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  // Delete video mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('videos').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-videos'] });
      toast.success('Video deleted');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingFile(true);

      if (!file.type.startsWith('video/')) {
        toast.error('Please select a video file');
        return;
      }

      if (file.size > 500 * 1024 * 1024) {
        toast.error('File must be less than 500MB');
        return;
      }

      const fileName = `${crypto.randomUUID()}-${file.name}`;
      const { error } = await supabase.storage
        .from('videos')
        .upload(fileName, file);

      if (error) throw error;

      const { data } = supabase.storage.from('videos').getPublicUrl(fileName);
      setForm({ ...form, video_url: data.publicUrl, video_type: 'file' });
      toast.success('Video uploaded to storage');
    } catch (err: any) {
      toast.error('Upload failed: ' + err.message);
    } finally {
      setUploadingFile(false);
    }
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error('Title is required');
      return;
    }
    if (!form.video_url.trim()) {
      toast.error('Video URL is required');
      return;
    }
    saveMutation.mutate({ ...form, id: editingId ?? undefined });
  };

  const openEdit = (video: any) => {
    setEditingId(video.id);
    setForm({
      title: video.title,
      description: video.description || '',
      video_url: video.video_url,
      thumbnail_url: video.thumbnail_url || '',
      video_type: video.video_type,
      quality: video.quality,
      is_published: video.is_published,
      is_premium: video.is_premium,
      duration_seconds: video.duration_seconds,
    });
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl">Video Manager</h2>
          <p className="text-sm text-muted-foreground">
            Add and manage videos from multiple sources
          </p>
        </div>
        <Dialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> Add Video
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingId ? 'Edit Video' : 'Add New Video'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Basic Info */}
              <div className="space-y-4">
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Video Details
                </div>
                <div>
                  <Label>Title *</Label>
                  <Input
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="Video title"
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={form.description}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
                    placeholder="Video description"
                    rows={3}
                  />
                </div>
              </div>

              <div className="h-px bg-border" />

              {/* Video Source */}
              <div className="space-y-4">
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Video Source
                </div>

                <div>
                  <Label>Video Type *</Label>
                  <Select
                    value={form.video_type}
                    onValueChange={(v) =>
                      setForm({ ...form, video_type: v as any })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="file">Direct File (MP4, WebM)</SelectItem>
                      <SelectItem value="gdrive">Google Drive</SelectItem>
                      <SelectItem value="youtube">YouTube</SelectItem>
                      <SelectItem value="vimeo">Vimeo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {form.video_type === 'file' ? (
                  <div>
                    <Label>Upload Video File</Label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="video/*"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-border rounded-lg p-4 cursor-pointer hover:border-primary/50 transition-colors text-center"
                    >
                      {form.video_url ? (
                        <div className="flex items-center justify-between">
                          <span className="text-sm truncate">
                            {form.video_url.split('/').pop()}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setForm({ ...form, video_url: '' });
                            }}
                            className="p-1"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                          <Upload className="h-6 w-6" />
                          <span className="text-sm">Click to upload video</span>
                          <span className="text-xs">Max 500MB</span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div>
                    <Label>Video URL *</Label>
                    <Input
                      value={form.video_url}
                      onChange={(e) =>
                        setForm({ ...form, video_url: e.target.value })
                      }
                      placeholder={
                        form.video_type === 'gdrive'
                          ? 'https://drive.google.com/file/d/FILE_ID/view'
                          : form.video_type === 'youtube'
                          ? 'https://www.youtube.com/watch?v=...'
                          : 'https://vimeo.com/...'
                      }
                    />
                  </div>
                )}
              </div>

              <div className="h-px bg-border" />

              {/* Media Info */}
              <div className="space-y-4">
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Media Info
                </div>
                <div>
                  <Label>Thumbnail URL (Optional)</Label>
                  <Input
                    value={form.thumbnail_url}
                    onChange={(e) =>
                      setForm({ ...form, thumbnail_url: e.target.value })
                    }
                    placeholder="https://..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Duration (seconds)</Label>
                    <Input
                      type="number"
                      value={form.duration_seconds ?? ''}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          duration_seconds: e.target.value
                            ? Number(e.target.value)
                            : null,
                        })
                      }
                      placeholder="e.g., 3600"
                    />
                  </div>
                  <div>
                    <Label>Quality</Label>
                    <Select
                      value={form.quality}
                      onValueChange={(v) =>
                        setForm({ ...form, quality: v as any })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SD">SD (480p)</SelectItem>
                        <SelectItem value="HD">HD (720p)</SelectItem>
                        <SelectItem value="FHD">FHD (1080p)</SelectItem>
                        <SelectItem value="4K">4K (2160p)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="h-px bg-border" />

              {/* Settings */}
              <div className="space-y-4">
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Settings
                </div>
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={form.is_published}
                      onCheckedChange={(v) =>
                        setForm({ ...form, is_published: v })
                      }
                    />
                    <Label>Published</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={form.is_premium}
                      onCheckedChange={(v) =>
                        setForm({ ...form, is_premium: v })
                      }
                    />
                    <Label>Premium Only</Label>
                  </div>
                </div>
              </div>

              {/* Preview */}
              {form.video_url && (
                <>
                  <div className="h-px bg-border" />
                  <div>
                    <Label className="mb-2 block">Preview</Label>
                    <VideoPlayer
                      videoUrl={form.video_url}
                      videoType={form.video_type}
                      title={form.title}
                      thumbnail={form.thumbnail_url}
                    />
                  </div>
                </>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={saveMutation.isPending || uploadingFile}
              >
                {uploadingFile
                  ? 'Uploading...'
                  : saveMutation.isPending
                  ? 'Saving...'
                  : editingId
                  ? 'Update'
                  : 'Create'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Videos Table */}
      <div className="rounded-lg border border-border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead className="hidden md:table-cell">Type</TableHead>
              <TableHead className="hidden md:table-cell">Quality</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Loading...
                </TableCell>
              </TableRow>
            ) : !videos?.length ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No videos yet
                </TableCell>
              </TableRow>
            ) : (
              videos.map((video: any) => (
                <TableRow key={video.id}>
                  <TableCell className="font-medium max-w-[200px] truncate">
                    {video.title}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-xs uppercase">
                    {video.video_type}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-xs">
                    {video.quality}
                  </TableCell>
                  <TableCell>
                    {video.is_published ? (
                      <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">
                        Published
                      </span>
                    ) : (
                      <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-full">
                        Draft
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(video)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (confirm('Delete this video?')) {
                            deleteMutation.mutate(video.id);
                          }
                        }}
                      >
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

export default AdminVideoManager;