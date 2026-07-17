import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTenant } from '../context/TenantContext';
import { useLanguage } from '../context/LanguageContext';
import { dataService } from '../services/dataService';
import { 
  Button, 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  Input, 
  Select, 
  Badge 
} from '../components/ui/CustomUI';

export const PublicWebsite: React.FC = () => {
  const { tenantId, activeAssociation } = useTenant();
  const { t } = useLanguage();
  const navigate = useNavigate();

  // Dynamic Data States
  const [loading, setLoading] = useState(true);
  const [committee, setCommittee] = useState<any[]>([]);
  const [approvedShops, setApprovedShops] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [gallery, setGallery] = useState<any[]>([]);
  const [campaignsCount, setCampaignsCount] = useState(0);
  const [resolvedComplaintsCount, setResolvedComplaintsCount] = useState(0);

  // Search & Filter state for Business Directory
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Load all dynamic data via Promise.all
  useEffect(() => {
    if (!tenantId) return;
    setLoading(true);

    Promise.all([
      dataService.getMemberships(tenantId),
      dataService.getCommitteeMembers(),
      dataService.getAnnouncements(tenantId),
      dataService.getEvents(tenantId),
      dataService.getGallery(tenantId),
      dataService.getComplaints(tenantId),
      dataService.getCampaigns(tenantId),
      dataService.getMeetings(tenantId)
    ])
      .then(([membershipsList, committeeList, announcementsList, eventsList, galleryList, complaintsList, campaignsList, meetingsList]) => {
        // Filter approved/active shops
        const approved = membershipsList.filter((m: any) => m.status === 'approved' || m.status === 'active');
        setApprovedShops(approved);

        // Fetch root/admin accounts for committee
        setCommittee(committeeList);

        // Official news bulletins
        setAnnouncements(announcementsList);

        // Scheduled local events & meetings
        const normalizedMeetings = meetingsList.map((m: any) => ({
          id: m.id,
          title: m.title,
          description: m.description || m.agenda?.join(', ') || 'Committee meeting',
          date: m.dateTime,
          location: m.location || (m.isVirtual ? 'Virtual Zoom / Meet' : 'Secretariat Office'),
          type: 'meeting'
        }));

        const normalizedEvents = eventsList.map((e: any) => ({
          id: e.id,
          title: e.title,
          description: e.description,
          date: e.date || e.dateTime || e.createdAt,
          location: e.location || 'Jhusi Market',
          type: e.type || 'event'
        }));

        const combined = [...normalizedEvents, ...normalizedMeetings].sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );

        setEvents(combined);

        // Gallery pictures
        setGallery(galleryList);

        // Statistics aggregates
        const resolvedCount = complaintsList.filter((c: any) => c.status === 'resolved' || c.status === 'closed').length;
        setResolvedComplaintsCount(resolvedCount);
        setCampaignsCount(campaignsList.length);
      })
      .catch(err => {
        console.error('Failed to load dynamic public homepage statistics:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [tenantId]);

  // Extract unique categories from active database entries
  const availableCategories = ['All', ...Array.from(new Set(approvedShops.map(s => s.category)))];

  // Directory Search Filter Logic
  const filteredShops = approvedShops.filter(shop => {
    const matchesSearch = 
      shop.shopName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shop.ownerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shop.address.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || shop.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Skeleton Loader for Modern Experience
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 space-y-12 animate-pulse">
        <div className="h-64 bg-muted rounded-2xl w-full" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(n => (
            <div key={n} className="h-24 bg-muted rounded-xl" />
          ))}
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 h-96 bg-muted rounded-2xl" />
          <div className="h-96 bg-muted rounded-2xl" />
        </div>
      </div>
    );
  }

  // Header Visual Styling Helper
  const brandGradient = {
    background: `linear-gradient(135deg, ${activeAssociation?.primaryColor || '#1e3a8a'} 0%, ${activeAssociation?.secondaryColor || '#d97706'} 100%)`
  };

  return (
    <div className="bg-background text-foreground min-h-screen pb-16 space-y-16">
      
      {/* 1. Hero Jumbotron Section */}
      <div className="relative py-16 sm:py-24 text-white overflow-hidden" style={brandGradient}>
        <div className="absolute inset-0 bg-black/25" />
        <div className="max-w-6xl mx-auto px-4 relative z-10 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="grid md:grid-cols-12 gap-8 items-center">
            
            {/* Left Info: Name, Slogan & Actions */}
            <div className="md:col-span-7 space-y-6 text-center md:text-left">
              <div className="flex items-center gap-3 justify-center md:justify-start">
                <img 
                  src="/logo.png" 
                  alt="Vyapar Mandal Logo" 
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-4 border-white bg-white shadow-2xl shrink-0" 
                />
                <div>
                  <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight drop-shadow-md leading-tight">
                    {t('Jhusi Vyapar Mandal')}
                  </h1>
                  <span className="text-[10px] sm:text-xs font-bold tracking-widest uppercase text-amber-300 block mt-1">
                    {t('locationLabel')}
                  </span>
                </div>
              </div>
              
              <p className="text-white/90 text-sm sm:text-base lg:text-lg font-medium leading-relaxed drop-shadow-sm max-w-xl">
                {t('heroSubtitle')}
              </p>
              
              <div className="flex flex-wrap gap-3 justify-center md:justify-start pt-2">
                <Button 
                  size="lg" 
                  variant="glass"
                  onClick={() => navigate('/login', { state: { mode: 'signup' } })}
                  className="rounded-xl bg-white text-primary hover:bg-white/95 font-black shadow-xl cursor-pointer text-xs sm:text-sm animate-pulse hover:animate-none"
                >
                  🤝 {t('becomeMember')}
                </Button>
                <Button 
                  size="lg" 
                  variant="glass"
                  onClick={() => navigate('/login', { state: { mode: 'login' } })}
                  className="rounded-xl bg-zinc-950 text-white hover:bg-zinc-900 border border-zinc-800 font-bold shadow-xl cursor-pointer text-xs sm:text-sm"
                >
                  🔑 {t('memberPortalLogin')}
                </Button>
              </div>
            </div>

            {/* Right Banner Photo Column */}
            <div className="md:col-span-5 flex justify-center">
              <div className="relative group overflow-hidden rounded-2xl border-4 border-white/25 shadow-2xl bg-black/25 backdrop-blur aspect-[4/3] w-full max-w-[440px] hover:scale-[1.02] transition-transform duration-300">
                <img 
                  src="/banner.jpg" 
                  alt="Jhusi Vyapar Mandal Committee Banner" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 flex flex-col justify-end">
                  <span className="text-xs font-black text-amber-300 tracking-wider uppercase block">
                    {t('committeeMeetingTitle')}
                  </span>
                  <span className="text-[10px] text-white/80 font-bold block mt-0.5">
                    {t('committeeMeetingDesc')}
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* 2. Interactive Dynamic Statistics Panel */}
      <div className="max-w-6xl mx-auto px-4 -mt-10 relative z-20">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="hover:scale-[1.02] transition-transform shadow-lg border-l-4 border-l-primary bg-card">
            <CardContent className="p-5 text-center">
              <span className="text-3xl font-black text-primary tracking-tight block">
                {approvedShops.length}+
              </span>
              <span className="text-[10px] text-muted-foreground uppercase font-black tracking-wider block mt-1">
                {t('tradersNetwork')}
              </span>
            </CardContent>
          </Card>

          <Card className="hover:scale-[1.02] transition-transform shadow-lg border-l-4 border-l-red-500 bg-card">
            <CardContent className="p-5 text-center">
              <span className="text-3xl font-black text-red-600 tracking-tight block">
                {resolvedComplaintsCount}+
              </span>
              <span className="text-[10px] text-muted-foreground uppercase font-black tracking-wider block mt-1">
                {t('resolvedGrievances')}
              </span>
            </CardContent>
          </Card>

          <Card className="hover:scale-[1.02] transition-transform shadow-lg border-l-4 border-l-amber-500 bg-card">
            <CardContent className="p-5 text-center">
              <span className="text-3xl font-black text-amber-600 tracking-tight block">
                {campaignsCount}+
              </span>
              <span className="text-[10px] text-muted-foreground uppercase font-black tracking-wider block mt-1">
                {t('advocacyCampaigns')}
              </span>
            </CardContent>
          </Card>

          <Card className="hover:scale-[1.02] transition-transform shadow-lg border-l-4 border-l-emerald-500 bg-card">
            <CardContent className="p-5 text-center">
              <span className="text-3xl font-black text-emerald-600 tracking-tight block">
                {announcements.length}+
              </span>
              <span className="text-[10px] text-muted-foreground uppercase font-black tracking-wider block mt-1">
                {t('officialCirculars')}
              </span>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 2.5 About & Banner Description Section */}
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid md:grid-cols-3 gap-8 items-center bg-card p-6 sm:p-8 rounded-2xl border shadow-sm">
          <div className="md:col-span-2 space-y-4">
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground border-b pb-2 flex items-center gap-2">
              🏛️ {t('aboutUs')}
            </h2>
            <p className="text-muted-foreground leading-relaxed text-sm sm:text-base font-medium">
              {t('aboutDesc')}
            </p>
          </div>
          <div className="flex justify-center">
            <img 
              src="/logo.png" 
              alt="Vyapar Mandal Committee Logo" 
              className="w-full max-w-[240px] h-auto object-contain rounded-2xl border-4 border-primary/20 shadow-xl"
            />
          </div>
        </div>
      </div>

      {/* 3. Core Grid Layout: Notices, Events, Testimonials */}
      <div className="max-w-6xl mx-auto px-4 grid lg:grid-cols-3 gap-8">
        
        {/* Left Hand: Circulars & Upcoming Events */}
        <div className="lg:col-span-2 space-y-12">
          
          {/* Circulars Notices */}
          <section className="space-y-4">
            <h2 className="text-2xl font-black tracking-tight text-foreground border-b pb-2 flex items-center gap-2">
              📢 {t('officialCircularsNotices')}
            </h2>
            <div className="space-y-3">
              {announcements.slice(0, 3).map(ann => (
                <Card key={ann.id} className="border hover:shadow transition-shadow bg-card">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start gap-2">
                      <h4 className="font-extrabold text-sm text-foreground">{ann.title}</h4>
                      <Badge variant={ann.priority === 'high' ? 'destructive' : 'secondary'}>
                        {ann.priority.toUpperCase()}
                      </Badge>
                    </div>
                    <CardDescription className="text-[10px] text-muted-foreground flex gap-2">
                      <span>{t('byAuthor')} {ann.authorName}</span>
                      <span>•</span>
                      <span>{new Date(ann.createdAt).toLocaleDateString()}</span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-xs text-muted-foreground leading-relaxed">
                    {ann.content}
                  </CardContent>
                </Card>
              ))}
              {announcements.length === 0 && (
                <p className="text-xs text-muted-foreground italic p-4 text-center border border-dashed rounded-xl">
                  {t('noActiveCirculars')}
                </p>
              )}
            </div>
          </section>

          {/* Events Schedule */}
          <section className="space-y-4">
            <h2 className="text-2xl font-black tracking-tight text-foreground border-b pb-2 flex items-center gap-2">
              📅 {t('upcomingEventsMeetings')}
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {events.slice(0, 4).map(evt => (
                <Card key={evt.id} className="border p-4 hover:shadow transition-shadow bg-muted/10">
                  <div className="flex justify-between items-start gap-1">
                    <span className="text-xs font-black text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded">
                      {evt.type ? evt.type.toUpperCase() : 'EVENT'}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {new Date(evt.date || evt.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h4 className="font-extrabold text-sm text-foreground mt-2 line-clamp-1">{evt.title}</h4>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{evt.description}</p>
                  {evt.location && (
                    <p className="text-[10px] text-primary font-bold mt-2">📍 {evt.location}</p>
                  )}
                </Card>
              ))}
              {events.length === 0 && (
                <div className="col-span-full py-6 text-center text-xs text-muted-foreground italic border border-dashed rounded-xl">
                  {t('noScheduledMeetings')}
                </div>
              )}
            </div>
          </section>

        </div>

        {/* Right Hand: Executive Committee & Contact info */}
        <div className="space-y-8">
          
          {/* Executive Committee */}
          <section className="space-y-4">
            <h2 className="text-2xl font-black tracking-tight text-foreground border-b pb-2">
              🛡️ {t('committeeBoard')}
            </h2>
            <div className="space-y-3">
              {committee.slice(0, 5).map(member => (
                <Card key={member.uid} className="border hover:shadow bg-card">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 border text-primary flex items-center justify-center font-black text-sm uppercase">
                      {member.displayName.charAt(0)}
                    </div>
                    <div className="overflow-hidden">
                      <h4 className="font-bold text-xs truncate text-foreground">{member.displayName}</h4>
                      <span className="text-[9px] font-black text-primary uppercase tracking-wider block">
                        {member.role === 'root' ? 'ROOT ADMIN' : member.role.toUpperCase()}
                      </span>
                      {member.email && <span className="text-[9px] text-muted-foreground block truncate">{member.email}</span>}
                    </div>
                  </CardContent>
                </Card>
              ))}
              {committee.length === 0 && (
                <p className="text-xs text-muted-foreground italic text-center p-4">
                  {t('noCommitteeProfiles')}
                </p>
              )}
            </div>
          </section>

          {/* secretariat Details */}
          <Card className="bg-muted/10 border-primary/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{t('secretariatContacts')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-xs text-muted-foreground">
              <div>
                <strong className="block text-foreground">📍 {t('address')}</strong>
                <span>{activeAssociation?.address || t('Jhusi Market Area, Prayagraj')}</span>
              </div>
              <div>
                <strong className="block text-foreground">📞 {t('hotline')}</strong>
                <span>{activeAssociation?.contactPhone || '+91 99999 88888'}</span>
              </div>
              <div>
                <strong className="block text-foreground">✉️ {t('supportEmail')}</strong>
                <span>{activeAssociation?.contactEmail || 'support@vyparmandal.org'}</span>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>

      {/* 4. Dynamic Business Classifieds Directory */}
      <div className="max-w-6xl mx-auto px-4 space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-black tracking-tight text-foreground">{t('registeredTradersDirectory')}</h2>
          <p className="text-xs text-muted-foreground max-w-xl mx-auto font-medium">
            {t('directorySubtitle')}
          </p>
        </div>

        {/* Filters and Search Bar */}
        <div className="flex flex-col sm:flex-row gap-3 bg-muted/20 p-4 rounded-2xl border">
          <Input 
            placeholder={t('searchShopsPlaceholder')}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="flex-1 bg-background"
          />
          <div className="sm:w-60">
            <Select 
              options={availableCategories.map(cat => ({ value: cat, label: cat === 'All' ? t('allCategories') : t(cat) }))}
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="bg-background"
            />
          </div>
        </div>

        {/* Active Shops Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredShops.map(shop => (
            <Card key={shop.id} className="hover:scale-[1.01] transition-transform border flex flex-col justify-between shadow-sm overflow-hidden bg-card">
              
              {/* Shop Photo Header (Uses logo as fallback) */}
              <div className="w-full h-44 bg-muted/10 relative border-b overflow-hidden flex items-center justify-center">
                <img 
                  src={shop.businessImages?.[0] || '/logo.png'} 
                  alt={shop.shopName}
                  className={`w-full h-full transition-transform duration-300 ${
                    shop.businessImages?.[0] ? 'object-cover' : 'object-contain p-6 scale-90 opacity-90'
                  }`}
                />
              </div>

              <CardHeader className="pb-2">
                <div className="flex justify-between items-start gap-2">
                  <h4 className="font-extrabold text-sm text-foreground line-clamp-1">{shop.shopName}</h4>
                  <Badge variant="outline">{t(shop.category)}</Badge>
                </div>
                <CardDescription className="text-[10px] text-muted-foreground">
                  {t('ownerLabel')}: <strong>{shop.ownerName}</strong>
                </CardDescription>
              </CardHeader>
              
              <CardContent className="py-2 flex-1 space-y-2">
                <p className="text-xs text-muted-foreground line-clamp-2">📍 {shop.address}</p>
                {shop.businessDescription && (
                  <p className="text-xs text-muted-foreground bg-muted/40 p-2.5 rounded-lg italic">
                    "{shop.businessDescription}"
                  </p>
                )}
              </CardContent>

              <div className="p-4 border-t bg-muted/10 text-[10px] text-muted-foreground flex justify-between items-center">
                <span>📞 {shop.phone}</span>
                {shop.email && <span className="truncate max-w-[120px]">✉️ {shop.email}</span>}
              </div>
            </Card>
          ))}
          
          {filteredShops.length === 0 && (
            <div className="col-span-full py-12 text-center text-xs text-muted-foreground italic border border-dashed rounded-xl">
              {t('noShopsMatch')}
            </div>
          )}
        </div>
      </div>

      {/* 5. Association Gallery */}
      {gallery.length > 0 && (
        <div className="max-w-6xl mx-auto px-4 space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-black tracking-tight text-foreground">{t('officialMediaGallery')}</h2>
            <p className="text-xs text-muted-foreground font-medium">
              {t('gallerySubtitle')}
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {gallery.map(img => (
              <div key={img.id} className="relative group overflow-hidden rounded-xl border aspect-video shadow-sm">
                <img 
                  src={img.imageUrl} 
                  alt={img.title || 'Gallery image'}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                  <span className="text-[10px] font-bold text-white line-clamp-1">{img.title || 'Mandal Activity'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. Membership Benefits Grid */}
      <div className="max-w-6xl mx-auto px-4 space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-black tracking-tight text-foreground">{t('membershipBenefits')}</h2>
          <p className="text-xs text-muted-foreground font-medium">
            {t('benefitsSubtitle')}
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="border shadow-sm text-center p-6 hover:shadow-md transition-shadow">
            <span className="text-4xl block mb-3">💳</span>
            <h4 className="font-extrabold text-sm text-foreground">{t('digitalIdCard')}</h4>
            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
              {t('digitalIdCardDesc')}
            </p>
          </Card>
          <Card className="border shadow-sm text-center p-6 hover:shadow-md transition-shadow">
            <span className="text-4xl block mb-3">🛠️</span>
            <h4 className="font-extrabold text-sm text-foreground">{t('grievanceResolutions')}</h4>
            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
              {t('grievanceResolutionsDesc')}
            </p>
          </Card>
          <Card className="border shadow-sm text-center p-6 hover:shadow-md transition-shadow">
            <span className="text-4xl block mb-3">🏷️</span>
            <h4 className="font-extrabold text-sm text-foreground">{t('directoryListings')}</h4>
            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
              {t('directoryListingsDesc')}
            </p>
          </Card>
        </div>
      </div>

      {/* 7. Testimonials */}
      <div className="max-w-6xl mx-auto px-4 space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-black tracking-tight text-foreground">{t('merchantsTestimonials')}</h2>
          <p className="text-xs text-muted-foreground font-medium">
            {t('testimonialsSubtitle')}
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="border p-6 shadow-sm bg-muted/10">
            <p className="text-xs text-muted-foreground italic leading-relaxed">
              {t('testimonial1Text')}
            </p>
            <div className="mt-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-700 flex items-center justify-center font-bold text-xs">
                RK
              </div>
              <div>
                <h5 className="font-bold text-xs text-foreground">{t('testimonial1Name')}</h5>
                <span className="text-[10px] text-muted-foreground">{t('testimonial1Sub')}</span>
              </div>
            </div>
          </Card>

          <Card className="border p-6 shadow-sm bg-muted/10">
            <p className="text-xs text-muted-foreground italic leading-relaxed">
              {t('testimonial2Text')}
            </p>
            <div className="mt-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-700 flex items-center justify-center font-bold text-xs">
                VS
              </div>
              <div>
                <h5 className="font-bold text-xs text-foreground">{t('testimonial2Name')}</h5>
                <span className="text-[10px] text-muted-foreground">{t('testimonial2Sub')}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

    </div>
  );
};
export default PublicWebsite;
