import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTenant } from '../context/TenantContext';
import { useLanguage } from '../context/LanguageContext';
import { dataService } from '../services/dataService';
import { aiService } from '../services/aiService';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, Input, Label, Textarea, Select, Badge, Dialog } from '../components/ui/CustomUI';

export const Announcements: React.FC = () => {
  const { user, role, isAdmin } = useAuth();
  const { tenantId } = useTenant();
  const { t } = useLanguage();

  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [isOpen, setIsOpen] = useState(false);
  const [isAIWriterOpen, setIsAIWriterOpen] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState('medium');
  const [pinned, setPinned] = useState(false);
  const [pushNotification, setPushNotification] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // AI Writer Form State
  const [aiBullet1, setAiBullet1] = useState('');
  const [aiBullet2, setAiBullet2] = useState('');
  const [aiBullet3, setAiBullet3] = useState('');
  const [aiTone, setAiTone] = useState<'formal' | 'urgent' | 'polite'>('formal');
  const [aiGenerating, setAiGenerating] = useState(false);

  useEffect(() => {
    if (!tenantId) return;
    setLoading(true);
    dataService.getAnnouncements(tenantId).then(setAnnouncements).finally(() => {
      setLoading(false);
    });
  }, [tenantId]);

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content || !tenantId || !user) return;
    setSubmitting(true);

    const ann = {
      associationId: tenantId,
      title,
      content,
      attachments: [],
      priority,
      pinned,
      pushNotification,
      status: 'published',
      authorId: user.uid,
      authorName: user.displayName || 'Officer Bearer',
      authorRole: role.replace('_', ' ').toUpperCase(),
      createdAt: new Date().toISOString()
    };

    try {
      await dataService.createAnnouncement(ann);
      const list = await dataService.getAnnouncements(tenantId);
      setAnnouncements(list);
      setIsOpen(false);
      setTitle('');
      setContent('');
      setPinned(false);
      setPushNotification(false);
    } catch (err) {
      console.error(err);
      alert('Failed to publish announcement');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAIGenerate = async () => {
    const bullets = [aiBullet1, aiBullet2, aiBullet3].filter(b => b.trim() !== '');
    if (bullets.length === 0) return;
    setAiGenerating(true);

    try {
      const generatedText = await aiService.writeNotice(
        bullets,
        aiTone,
        user?.displayName || 'Officer Bearer',
        role.replace('_', ' ').toUpperCase() || 'Committee Member'
      );
      setContent(generatedText);
      setIsAIWriterOpen(false);
      setAiBullet1('');
      setAiBullet2('');
      setAiBullet3('');
    } catch (err) {
      console.error(err);
      alert('AI Generation failed');
    } finally {
      setAiGenerating(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">{t('loading')}</div>;
  }

  // Pinned items first, then by date desc
  const sortedAnnouncements = [...announcements].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black tracking-tight">{t('announcements')}</h1>
          <p className="text-muted-foreground text-sm">
            Official announcements, warnings, security updates, and regulatory orders from the committee.
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => setIsOpen(true)} className="rounded-xl font-bold shadow-lg shadow-primary/10">
            📢 {t('Publish Notice')}
          </Button>
        )}
      </div>

      {/* Timeline display */}
      <div className="space-y-4">
        {sortedAnnouncements.map((ann) => (
          <Card key={ann.id} className={`border ${ann.pinned ? 'border-primary/40 ring-1 ring-primary/10' : ''}`}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start gap-4">
                <div className="flex items-center gap-2 flex-wrap">
                  {ann.pinned && (
                    <span className="bg-primary text-primary-foreground text-[9px] font-black uppercase px-2 py-0.5 rounded-full flex items-center gap-1">
                      📌 Pinned
                    </span>
                  )}
                  {ann.priority === 'high' && (
                    <span className="bg-red-500/15 border border-red-500/20 text-red-500 text-[9px] font-black uppercase px-2 py-0.5 rounded-full">
                      Urgent
                    </span>
                  )}
                  <h3 className="font-extrabold text-sm sm:text-base text-foreground leading-tight">
                    {ann.title}
                  </h3>
                </div>
                <span className="text-[10px] text-muted-foreground font-mono shrink-0">
                  {new Date(ann.createdAt).toLocaleDateString()}
                </span>
              </div>
              <CardDescription className="text-[10px] text-muted-foreground flex gap-1.5 pt-1">
                <span>Published by: <strong>{ann.authorName}</strong></span>
                <span>•</span>
                <span>Role: <strong>{ann.authorRole}</strong></span>
              </CardDescription>
            </CardHeader>
            <CardContent className="py-4 text-xs sm:text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
              {ann.content}
            </CardContent>
          </Card>
        ))}

        {announcements.length === 0 && (
          <div className="py-12 text-center text-muted-foreground">
            No official circulars or announcements active on the board.
          </div>
        )}
      </div>

      {/* Creation Modal Dialog */}
      <Dialog isOpen={isOpen} onClose={() => setIsOpen(false)} title="Publish Official Circular Notice">
        <form onSubmit={handlePost} className="space-y-4">
          <div className="space-y-1.5 flex justify-between items-center">
            <Label>Notice Headline / Title</Label>
            <button 
              type="button" 
              onClick={() => setIsAIWriterOpen(true)}
              className="text-xs bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 px-2.5 py-1 rounded font-bold transition-all"
            >
              🤖 Use AI Notice Writer
            </button>
          </div>
          <Input required placeholder="e.g. CCTV Security mandate in Gali Qutubuddin" value={title} onChange={e => setTitle(e.target.value)} />
          
          <div className="space-y-1.5">
            <Label>Announcement Body Content</Label>
            <Textarea required rows={6} placeholder="Provide complete formal text..." value={content} onChange={e => setContent(e.target.value)} />
          </div>

          <div className="grid grid-cols-3 gap-4 border-t pt-4">
            <div className="space-y-1.5">
              <Select
                label="Priority Level"
                options={[
                  { value: 'low', label: 'Low priority' },
                  { value: 'medium', label: 'Medium priority' },
                  { value: 'high', label: 'High priority' }
                ]}
                value={priority}
                onChange={e => setPriority(e.target.value)}
              />
            </div>
            
            <div className="flex items-center gap-2 pt-6">
              <input 
                type="checkbox" 
                id="pin-check"
                checked={pinned} 
                onChange={e => setPinned(e.target.checked)} 
                className="w-4 h-4 text-primary"
              />
              <Label htmlFor="pin-check" className="cursor-pointer select-none">Pin Notice</Label>
            </div>

            <div className="flex items-center gap-2 pt-6">
              <input 
                type="checkbox" 
                id="push-check"
                checked={pushNotification} 
                onChange={e => setPushNotification(e.target.checked)} 
                className="w-4 h-4 text-primary"
              />
              <Label htmlFor="push-check" className="cursor-pointer select-none">Push Alert</Label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={submitting}>
              {submitting ? 'Publishing...' : 'Publish Announcement'}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* AI Writer Dialog Overlay */}
      <Dialog isOpen={isAIWriterOpen} onClose={() => setIsAIWriterOpen(false)} title="AI Notice Writer Helper">
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Provide a few raw bullet points. The AI will immediately draft a beautifully structured, formal trade association letter.
          </p>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Bullet Point 1 (Core Subject)</Label>
              <Input placeholder="e.g. GST workshop this Saturday at 4pm" value={aiBullet1} onChange={e => setAiBullet1(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Bullet Point 2 (Requirement)</Label>
              <Input placeholder="e.g. Senior CA Aggarwal will attend, bring laptops" value={aiBullet2} onChange={e => setAiBullet2(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Bullet Point 3 (Extra details)</Label>
              <Input placeholder="e.g. Free tea and snacks for registered members" value={aiBullet3} onChange={e => setAiBullet3(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Select 
                label="Letter Tone / Style"
                options={[
                  { value: 'formal', label: 'Formal / Official Letter' },
                  { value: 'urgent', label: 'Urgent / Important Alert' },
                  { value: 'polite', label: 'Polite / Advisory invitation' }
                ]}
                value={aiTone}
                onChange={e => setAiTone(e.target.value as any)}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => setIsAIWriterOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleAIGenerate} disabled={aiGenerating || !aiBullet1.trim()}>
              {aiGenerating ? 'Drafting Letter...' : 'Draft Official Circular'}
            </Button>
          </div>
        </div>
      </Dialog>

    </div>
  );
};
