import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTenant } from '../context/TenantContext';
import { useLanguage } from '../context/LanguageContext';
import { dataService } from '../services/dataService';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, Input, Label, Textarea, Select, Badge, Dialog } from '../components/ui/CustomUI';

export const MediaGallery: React.FC = () => {
  const { user, membership, isAdmin } = useAuth();
  const { tenantId } = useTenant();
  const { t } = useLanguage();

  const [gallery, setGallery] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [activeAlbum, setActiveAlbum] = useState('all');

  // Form State
  const [albumName, setAlbumName] = useState('Advocacy');
  const [type, setType] = useState('photo');
  const [mediaUrl, setMediaUrl] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!tenantId) return;
    setLoading(true);
    dataService.getGallery(tenantId).then(setGallery).finally(() => {
      setLoading(false);
    });
  }, [tenantId]);

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mediaUrl || !description || !tenantId) return;
    setSubmitting(true);

    const item = {
      associationId: tenantId,
      albumName,
      type,
      mediaUrl,
      description,
      createdAt: new Date().toISOString()
    };

    try {
      await dataService.createGalleryItem(item);
      const list = await dataService.getGallery(tenantId);
      setGallery(list);
      setIsOpen(false);
      setMediaUrl('');
      setDescription('');
    } catch (err) {
      console.error(err);
      alert('Failed to save gallery item');
    } finally {
      setSubmitting(false);
    }
  };

  const albums = ['all', ...Array.from(new Set(gallery.map(g => g.albumName)))];

  const filteredGallery = gallery.filter(g => 
    activeAlbum === 'all' || g.albumName === activeAlbum
  );

  if (loading) {
    return <div className="text-center py-12">{t('loading')}</div>;
  }

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black tracking-tight">{t('gallery')}</h1>
          <p className="text-muted-foreground text-sm">
            Press cuttings, photos of civic movements, executive gatherings, and media highlights.
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => setIsOpen(true)} className="rounded-xl font-bold shadow-lg shadow-primary/10">
            📷 Upload Media
          </Button>
        )}
      </div>

      {/* Album Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2 border-b">
        {albums.map((alb) => (
          <button
            key={alb}
            onClick={() => setActiveAlbum(alb)}
            className={`px-4 py-1.5 rounded-full text-xs font-black uppercase border transition-all ${
              activeAlbum === alb 
                ? 'bg-primary text-primary-foreground border-primary shadow-md shadow-primary/10' 
                : 'bg-card text-muted-foreground hover:text-foreground'
            }`}
          >
            {alb}
          </button>
        ))}
      </div>

      {/* Media Grid */}
      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
        {filteredGallery.map((item) => (
          <Card key={item.id} className="overflow-hidden flex flex-col justify-between hover:shadow-lg transition-all group">
            <div className="relative overflow-hidden shrink-0">
              <img 
                src={item.mediaUrl} 
                alt={item.description} 
                className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500" 
              />
              <span className="absolute top-3 left-3 bg-black/60 backdrop-blur text-white text-[9px] font-black uppercase px-2 py-0.5 rounded border border-white/10">
                {item.type}
              </span>
            </div>
            
            <CardHeader className="pb-3 pt-3 flex-1 flex flex-col justify-between">
              <div>
                <h4 className="font-extrabold text-xs text-muted-foreground uppercase">{item.albumName}</h4>
                <p className="text-xs text-foreground mt-1.5 font-medium leading-relaxed">{item.description}</p>
              </div>
              <span className="text-[9px] text-muted-foreground font-mono mt-3">
                {new Date(item.createdAt).toLocaleDateString()}
              </span>
            </CardHeader>
          </Card>
        ))}

        {filteredGallery.length === 0 && (
          <div className="col-span-full py-12 text-center text-muted-foreground">
            No media artifacts found in this album.
          </div>
        )}
      </div>

      {/* Upload Media Dialog */}
      <Dialog isOpen={isOpen} onClose={() => setIsOpen(false)} title="Upload Media Attachment / Clip">
        <form onSubmit={handleCreateItem} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Select
                label="Album Classification"
                options={[
                  { value: 'Advocacy', label: 'Advocacy & MCD Campaigns' },
                  { value: 'Press Clippings', label: 'Newspaper Print Cuts' },
                  { value: 'Assemblies', label: 'Committee Meetings' },
                  { value: 'Festivals', label: 'Market Festivals' }
                ]}
                value={albumName}
                onChange={e => setAlbumName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Select
                label="Media Type"
                options={[
                  { value: 'photo', label: 'Market Photo' },
                  { value: 'newspaper', label: 'Newspaper Cutout' },
                  { value: 'video', label: 'Video Embed URL' }
                ]}
                value={type}
                onChange={e => setType(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Image URL / CDN Path</Label>
            <Input required placeholder="https://images.unsplash.com/photo-..." value={mediaUrl} onChange={e => setMediaUrl(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label>Caption & Description</Label>
            <Textarea required rows={3} placeholder="Provide visual description and date..." value={description} onChange={e => setDescription(e.target.value)} />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={submitting}>
              {submitting ? 'Uploading...' : 'Save Media Item'}
            </Button>
          </div>
        </form>
      </Dialog>

    </div>
  );
};
