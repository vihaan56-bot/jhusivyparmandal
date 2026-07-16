import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTenant } from '../context/TenantContext';
import { useLanguage } from '../context/LanguageContext';
import { dataService } from '../services/dataService';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, Input, Label, Textarea, Select, Badge, Dialog } from '../components/ui/CustomUI';

export const BusinessFeed: React.FC = () => {
  const { user, membership, isMember } = useAuth();
  const { tenantId } = useTenant();
  const { t } = useLanguage();

  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [type, setType] = useState('offer');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState('7'); // days
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!tenantId) return;
    setLoading(true);
    dataService.getBusinessPosts(tenantId).then(list => {
      // Filter out posts that are already expired
      const now = new Date();
      setPosts(list.filter(p => new Date(p.expiresAt) > now));
    }).finally(() => {
      setLoading(false);
    });
  }, [tenantId]);

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !tenantId || !user || !membership) return;
    setSubmitting(true);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + parseInt(duration));

    const post = {
      associationId: tenantId,
      userId: user.uid,
      type,
      title,
      description,
      shopName: membership.shopName || 'Merchant Shop',
      contactPhone: membership.phone || '+91 99999 99999',
      images: [],
      expiresAt: expiresAt.toISOString(),
      createdAt: new Date().toISOString()
    };

    try {
      await dataService.createBusinessPost(post);
      const list = await dataService.getBusinessPosts(tenantId);
      const now = new Date();
      setPosts(list.filter(p => new Date(p.expiresAt) > now));
      setIsOpen(false);
      setTitle('');
      setDescription('');
    } catch (err) {
      console.error(err);
      alert('Failed to submit post');
    } finally {
      setSubmitting(false);
    }
  };

  const getPostTypeBadge = (t: string) => {
    switch (t) {
      case 'offer': return <Badge variant="default">Promo</Badge>;
      case 'discount': return <Badge variant="success">Discount</Badge>;
      case 'festival_sale': return <Badge variant="default" className="bg-amber-500 hover:bg-amber-600 text-white">Festival Sale</Badge>;
      case 'hiring': return <Badge variant="destructive">Hiring</Badge>;
      case 'distributor': return <Badge variant="secondary">Distributor Needed</Badge>;
      default: return <Badge variant="outline">{t}</Badge>;
    }
  };

  if (loading) {
    return <div className="text-center py-12">{t('loading')}</div>;
  }

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black tracking-tight">{t('businessFeed')}</h1>
          <p className="text-muted-foreground text-sm">
            Exclusive commercial offers, trade discounts, wholesale hiring, and business updates.
          </p>
        </div>
        {isMember && (
          <Button onClick={() => setIsOpen(true)} className="shadow-lg shadow-primary/10 rounded-xl font-bold">
            ➕ Add Post
          </Button>
        )}
      </div>

      {/* Grid of Feed Items */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map((post) => (
          <Card key={post.id} className="flex flex-col justify-between hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                {getPostTypeBadge(post.type)}
                <span className="text-[10px] text-muted-foreground">Exp: {new Date(post.expiresAt).toLocaleDateString()}</span>
              </div>
              <CardTitle className="text-base font-extrabold mt-3 line-clamp-1">{post.title}</CardTitle>
              <CardDescription className="text-xs font-semibold">🏪 {post.shopName}</CardDescription>
            </CardHeader>
            <CardContent className="py-2 text-xs text-muted-foreground flex-1">
              <p className="leading-relaxed whitespace-pre-wrap line-clamp-4">{post.description}</p>
            </CardContent>
            <div className="p-4 border-t bg-muted/10 flex justify-between items-center text-xs">
              <span className="text-muted-foreground">📞 {post.contactPhone}</span>
              <a 
                href={`https://wa.me/${post.contactPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hi, I saw your post "${post.title}" on the Vyapar Mandal app.`)}`}
                target="_blank" 
                rel="noreferrer"
                className="text-xs font-black text-emerald-600 bg-emerald-500/10 px-2.5 py-1.5 rounded-lg border border-emerald-500/20 hover:bg-emerald-500/15"
              >
                Inquire Offer
              </a>
            </div>
          </Card>
        ))}

        {posts.length === 0 && (
          <div className="col-span-full py-12 text-center text-muted-foreground">
            No active business promotions found. Members can post offers using the "Add Post" button.
          </div>
        )}
      </div>

      {/* Creation Modal Dialog */}
      <Dialog isOpen={isOpen} onClose={() => setIsOpen(false)} title="Create Business Classified Post">
        <form onSubmit={handlePost} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Post Title (क्या ऑफर है?)</Label>
            <Input required placeholder="e.g. Diwali Handloom sale - flat 30% off" value={title} onChange={e => setTitle(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Select
                label="Offer Category"
                options={[
                  { value: 'offer', label: 'Commercial Promo' },
                  { value: 'discount', label: 'Trade Discount' },
                  { value: 'festival_sale', label: 'Festival Clearance' },
                  { value: 'hiring', label: 'Hiring Staff' },
                  { value: 'distributor', label: 'Distributor Search' },
                  { value: 'business_news', label: 'New Arrival / News' }
                ]}
                value={type}
                onChange={e => setType(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Select
                label="Post Expiration Duration"
                options={[
                  { value: '3', label: '3 Days' },
                  { value: '7', label: '1 Week' },
                  { value: '15', label: '15 Days' },
                  { value: '30', label: '30 Days' }
                ]}
                value={duration}
                onChange={e => setDuration(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Details & Contact Instructions</Label>
            <Textarea required placeholder="Provide details like pricing, min order quantity, shop address, and calling times..." value={description} onChange={e => setDescription(e.target.value)} />
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={submitting}>
              {submitting ? 'Posting...' : 'Publish Advertisement'}
            </Button>
          </div>
        </form>
      </Dialog>

    </div>
  );
};
