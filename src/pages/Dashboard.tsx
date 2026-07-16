import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTenant } from '../context/TenantContext';
import { useLanguage } from '../context/LanguageContext';
import { dataService } from '../services/dataService';
import { QRCard } from '../components/QRCard';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, Dialog } from '../components/ui/CustomUI';

export const Dashboard: React.FC = () => {
  const { user, membership, isAdmin } = useAuth();
  const { tenantId, activeAssociation } = useTenant();
  const { t } = useLanguage();
  const navigate = useNavigate();

  // State aggregates
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [meetings, setMeetings] = useState<any[]>([]);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [promotions, setPromotions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Card Modal
  const [isCardOpen, setIsCardOpen] = useState(false);

  useEffect(() => {
    if (!tenantId) return;
    setLoading(true);

    Promise.all([
      dataService.getAnnouncements(tenantId),
      dataService.getMeetings(tenantId),
      dataService.getComplaints(tenantId),
      dataService.getCampaigns(tenantId),
      dataService.getBusinessPosts(tenantId)
    ]).then(([anns, meets, comps, camps, posts]) => {
      // Sort and slice recent items
      setAnnouncements(anns.slice(0, 3));
      setMeetings(meets.filter(m => new Date(m.dateTime) > new Date()).slice(0, 2));
      setComplaints(comps.filter(c => c.status !== 'resolved' && c.status !== 'closed').slice(0, 2));
      setCampaigns(camps.filter(c => c.status === 'active').slice(0, 2));
      setPromotions(posts.slice(0, 3));
    }).finally(() => {
      setLoading(false);
    });
  }, [tenantId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin text-3xl">ðŸ”„</div>
          <p className="text-sm text-muted-foreground">{t('loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Welcome & Membership Banner */}
      <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
        <div>
          <h1 className="text-3xl font-black tracking-tight">{t('welcome')}, {user?.displayName}!</h1>
          <p className="text-muted-foreground text-sm">
            {t('Here is what is happening in the market today.')}
          </p>
        </div>
        
        {/* Quick Membership Status Card */}
        {membership && (
          <div className="flex items-center gap-3 bg-card border rounded-xl px-4 py-2.5 shadow-sm text-sm">
            <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 font-bold shrink-0">
              âœ“
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground font-black uppercase tracking-wider block">Membership Expiry</span>
              <span className="font-bold text-foreground">{membership.membershipExpiry}</span>
            </div>
            <Button size="sm" variant="outline" onClick={() => setIsCardOpen(true)} className="ml-2">
              ðŸªª {t('View Card')}
            </Button>
          </div>
        )}
      </div>

      {/* Grid: Quick Action Buttons */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button 
          onClick={() => navigate(`/complaints`)}
          className="p-5 rounded-xl border bg-card hover:bg-red-500/5 hover:border-red-500/20 text-left transition-all active:scale-[0.98] group flex flex-col justify-between h-28"
        >
          <span className="text-2xl group-hover:scale-110 transition-transform">ðŸ› ï¸</span>
          <div>
            <h4 className="font-bold text-sm text-foreground">File Complaint</h4>
            <p className="text-[10px] text-muted-foreground truncate">Report sewers, wiring, roads</p>
          </div>
        </button>

        <button 
          onClick={() => navigate(`/business`)}
          className="p-5 rounded-xl border bg-card hover:bg-sky-500/5 hover:border-sky-500/20 text-left transition-all active:scale-[0.98] group flex flex-col justify-between h-28"
        >
          <span className="text-2xl group-hover:scale-110 transition-transform">ðŸ·ï¸</span>
          <div>
            <h4 className="font-bold text-sm text-foreground">Post Promotion</h4>
            <p className="text-[10px] text-muted-foreground truncate">Advertise store offers, hiring</p>
          </div>
        </button>

        <button 
          onClick={() => navigate(`/directory`)}
          className="p-5 rounded-xl border bg-card hover:bg-emerald-500/5 hover:border-emerald-500/20 text-left transition-all active:scale-[0.98] group flex flex-col justify-between h-28"
        >
          <span className="text-2xl group-hover:scale-110 transition-transform">ðŸ“ž</span>
          <div>
            <h4 className="font-bold text-sm text-foreground">Search Directory</h4>
            <p className="text-[10px] text-muted-foreground truncate">Lookup local shops & categories</p>
          </div>
        </button>

        <button 
          onClick={() => navigate(`/announcements`)}
          className="p-5 rounded-xl border bg-card hover:bg-amber-500/5 hover:border-amber-500/20 text-left transition-all active:scale-[0.98] group flex flex-col justify-between h-28"
        >
          <span className="text-2xl group-hover:scale-110 transition-transform">ðŸ“¢</span>
          <div>
            <h4 className="font-bold text-sm text-foreground">Notice Board</h4>
            <p className="text-[10px] text-muted-foreground truncate">Check official updates</p>
          </div>
        </button>
      </div>

      {/* Main Aggregated Content Columns */}
      <div className="grid lg:grid-cols-3 gap-6">
        
        {/* Left Side: Announcements & Meetings */}
        <div className="lg:col-span-2 space-y-6">
          {/* Announcements Card */}
          <Card>
            <CardHeader className="flex flex-row justify-between items-center pb-4">
              <div>
                <CardTitle>ðŸ“¢ {t('latestAnnouncements')}</CardTitle>
                <CardDescription>Important official notices from Vyapar committee.</CardDescription>
              </div>
              <Button size="sm" variant="ghost" onClick={() => navigate(`/announcements`)}>
                {t('viewAll')}
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {announcements.map((ann) => (
                <div key={ann.id} className="border-b last:border-b-0 pb-4 last:pb-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-extrabold text-sm text-foreground">{ann.title}</h4>
                    {ann.priority === 'high' && (
                      <span className="bg-red-500/15 border border-red-500/20 text-red-500 text-[9px] font-black uppercase px-2 py-0.5 rounded-full">
                        Urgent
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{ann.content}</p>
                  <div className="text-[10px] text-muted-foreground flex gap-2">
                    <span>By {ann.authorName} ({ann.authorRole})</span>
                    <span>â€¢</span>
                    <span>{new Date(ann.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
              {announcements.length === 0 && (
                <div className="text-center text-xs text-muted-foreground py-4">
                  {t('noAnnouncements')}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Business Promotions Classified feed preview */}
          <Card>
            <CardHeader className="flex flex-row justify-between items-center pb-4">
              <div>
                <CardTitle>ðŸ·ï¸ {t('recentPromotions')}</CardTitle>
                <CardDescription>Festival discounts, clearance sales, and wholesale hiring posts.</CardDescription>
              </div>
              <Button size="sm" variant="ghost" onClick={() => navigate(`/business`)}>
                {t('viewAll')}
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-3 gap-4">
                {promotions.map((post) => (
                  <div key={post.id} className="border rounded-xl p-3 flex flex-col justify-between hover:shadow-md transition-all">
                    <div>
                      <span className="text-[9px] font-black uppercase tracking-wider text-primary border-primary/20 border px-1.5 py-0.5 rounded bg-primary/5">
                        {post.type.replace('_', ' ')}
                      </span>
                      <h4 className="font-extrabold text-xs text-foreground mt-2 line-clamp-1">{post.title}</h4>
                      <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">{post.description}</p>
                    </div>
                    <div className="border-t pt-2 mt-3 text-[10px] text-muted-foreground truncate">
                      ðŸª {post.shopName}
                    </div>
                  </div>
                ))}
              </div>
              {promotions.length === 0 && (
                <div className="text-center text-xs text-muted-foreground py-4">
                  No promotional offers running today.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Side: Upcoming Meetings, Active Campaigns, and Complaints */}
        <div className="space-y-6">
          {/* Upcoming Meetings */}
          <Card>
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base">ðŸ“… {t('upcomingMeetings')}</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              {meetings.map((meet) => (
                <div key={meet.id} className="space-y-2 border-l-2 border-primary pl-3 py-1">
                  <h4 className="font-bold text-sm text-foreground line-clamp-1">{meet.title}</h4>
                  <p className="text-xs text-muted-foreground line-clamp-1">ðŸ“ {meet.venue}</p>
                  <p className="text-[10px] text-primary font-semibold">
                    â° {new Date(meet.dateTime).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                  </p>
                </div>
              ))}
              {meetings.length === 0 && (
                <div className="text-center text-xs text-muted-foreground py-4">
                  {t('noMeetings')}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pending Complaints */}
          <Card>
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base text-red-500">ðŸ› ï¸ {t('recentComplaints')}</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              {complaints.map((comp) => (
                <div key={comp.id} className="space-y-1.5 pb-3 border-b last:border-b-0">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-black uppercase text-red-600 bg-red-500/10 border border-red-500/20 px-1.5 py-0.5 rounded">
                      {comp.category}
                    </span>
                    <span className="text-[9px] font-bold text-muted-foreground uppercase">{comp.status}</span>
                  </div>
                  <h4 className="font-bold text-xs text-foreground line-clamp-1">{comp.title}</h4>
                  <p className="text-[10px] text-muted-foreground line-clamp-1">ðŸ“ {comp.location.addressString}</p>
                </div>
              ))}
              {complaints.length === 0 && (
                <div className="text-center text-xs text-muted-foreground py-4">
                  {t('noComplaints')}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Active Campaigns */}
          <Card>
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base text-purple-500">âœŠ {t('activeCampaigns')}</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              {campaigns.map((camp) => (
                <div key={camp.id} className="space-y-1">
                  <h4 className="font-bold text-xs text-foreground line-clamp-1">{camp.title}</h4>
                  <p className="text-[10px] text-muted-foreground line-clamp-2">{camp.description}</p>
                  <p className="text-[9px] font-black text-purple-600 mt-1 uppercase">
                    ðŸ‘¥ {camp.participantsCount} Traders Participating
                  </p>
                </div>
              ))}
              {campaigns.length === 0 && (
                <div className="text-center text-xs text-muted-foreground py-4">
                  {t('noCampaigns')}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

      </div>

      {/* QR Code Member Card Dialog */}
      {membership && (
        <Dialog isOpen={isCardOpen} onClose={() => setIsCardOpen(false)} title="Digital Membership Card">
          <QRCard membership={membership} />
        </Dialog>
      )}

    </div>
  );
};

