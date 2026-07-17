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
  Label, 
  Textarea, 
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
      dataService.getCampaigns(tenantId)
    ])
      .then(([membershipsList, committeeList, announcementsList, eventsList, galleryList, complaintsList, campaignsList]) => {
        // Filter approved/active shops
        const approved = membershipsList.filter((m: any) => m.status === 'approved' || m.status === 'active');
        setApprovedShops(approved);

        // Fetch root/admin accounts for committee
        setCommittee(committeeList);

        // Official news bulletins
        setAnnouncements(announcementsList);

        // Scheduled local events & meetings
        setEvents(eventsList);

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
      <div className="relative py-24 text-white overflow-hidden" style={brandGradient}>
        <div className="absolute inset-0 bg-black/20" />
        <div className="max-w-5xl mx-auto px-4 text-center space-y-6 relative z-10 animate-in fade-in slide-in-from-top-4 duration-300">
          {activeAssociation?.logoUrl && (
            <img 
              src={activeAssociation.logoUrl} 
              alt="Logo" 
              className="w-24 h-24 rounded-full mx-auto object-cover border-4 border-white bg-white shadow-2xl" 
            />
          )}
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight drop-shadow">
            {activeAssociation?.name}
          </h1>
          <p className="text-white/90 text-sm sm:text-lg max-w-2xl mx-auto font-semibold leading-relaxed">
            Unifying local merchants, building commercial infrastructure, and resolving grievances to accelerate trade and business.
          </p>
          <div className="flex flex-wrap gap-3 justify-center pt-4">
            <Button 
              size="lg" 
              onClick={() => navigate('/login')}
              className="rounded-xl bg-white text-primary hover:bg-white/95 font-black shadow-xl cursor-pointer"
            >
              🔑 Member Portal Login
            </Button>
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
                Traders Network
              </span>
            </CardContent>
          </Card>

          <Card className="hover:scale-[1.02] transition-transform shadow-lg border-l-4 border-l-red-500 bg-card">
            <CardContent className="p-5 text-center">
              <span className="text-3xl font-black text-red-600 tracking-tight block">
                {resolvedComplaintsCount}+
              </span>
              <span className="text-[10px] text-muted-foreground uppercase font-black tracking-wider block mt-1">
                Resolved Grievances
              </span>
            </CardContent>
          </Card>

          <Card className="hover:scale-[1.02] transition-transform shadow-lg border-l-4 border-l-amber-500 bg-card">
            <CardContent className="p-5 text-center">
              <span className="text-3xl font-black text-amber-600 tracking-tight block">
                {campaignsCount}+
              </span>
              <span className="text-[10px] text-muted-foreground uppercase font-black tracking-wider block mt-1">
                Advocacy Campaigns
              </span>
            </CardContent>
          </Card>

          <Card className="hover:scale-[1.02] transition-transform shadow-lg border-l-4 border-l-emerald-500 bg-card">
            <CardContent className="p-5 text-center">
              <span className="text-3xl font-black text-emerald-600 tracking-tight block">
                {announcements.length}+
              </span>
              <span className="text-[10px] text-muted-foreground uppercase font-black tracking-wider block mt-1">
                Official Circulars
              </span>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 3. Core Grid Layout: Notices, Events, Testimonials */}
      <div className="max-w-6xl mx-auto px-4 grid lg:grid-cols-3 gap-8">
        
        {/* Left Hand: Circulars & Upcoming Events */}
        <div className="lg:col-span-2 space-y-12">
          
          {/* Circulars Notices */}
          <section className="space-y-4">
            <h2 className="text-2xl font-black tracking-tight text-foreground border-b pb-2 flex items-center gap-2">
              📢 Official Circulars & Notices
            </h2>
            <div className="space-y-3">
              {announcements.slice(0, 3).map(ann => (
                <Card key={ann.id} className="border hover:shadow transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start gap-2">
                      <h4 className="font-extrabold text-sm text-foreground">{ann.title}</h4>
                      <Badge variant={ann.priority === 'high' ? 'destructive' : 'secondary'}>
                        {ann.priority.toUpperCase()}
                      </Badge>
                    </div>
                    <CardDescription className="text-[10px] text-muted-foreground flex gap-2">
                      <span>By: {ann.authorName}</span>
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
                  No active circulars on the board.
                </p>
              )}
            </div>
          </section>

          {/* Events Schedule */}
          <section className="space-y-4">
            <h2 className="text-2xl font-black tracking-tight text-foreground border-b pb-2 flex items-center gap-2">
              📅 Upcoming Events & Meetings
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
                  No scheduled meetings or public trade events active.
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
              🛡️ Committee Board
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
                  No committee profiles listed.
                </p>
              )}
            </div>
          </section>

          {/* secretariat Details */}
          <Card className="bg-muted/10 border-primary/10">
            <CardHeader>
              <CardTitle className="text-sm">Secretariat Contacts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-xs text-muted-foreground">
              <div>
                <strong className="block text-foreground">📍 Address</strong>
                <span>{activeAssociation?.address || 'Jhusi Market Area, Prayagraj'}</span>
              </div>
              <div>
                <strong className="block text-foreground">📞 Hotline</strong>
                <span>{activeAssociation?.contactPhone || '+91 99999 88888'}</span>
              </div>
              <div>
                <strong className="block text-foreground">✉️ Support Email</strong>
                <span>{activeAssociation?.contactEmail || 'support@vyparmandal.org'}</span>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>

      {/* 4. Dynamic Business Classifieds Directory */}
      <div className="max-w-6xl mx-auto px-4 space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-black tracking-tight text-foreground">🏪 Registered Traders Directory</h2>
          <p className="text-xs text-muted-foreground max-w-xl mx-auto">
            Discover and contact verified local trade outlets, shops, and wholesale firms in Jhusi market area.
          </p>
        </div>

        {/* Filters and Search Bar */}
        <div className="flex flex-col sm:flex-row gap-3 bg-muted/20 p-4 rounded-2xl border">
          <Input 
            placeholder="Search shops by name, owner, or address..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="flex-1 bg-background"
          />
          <div className="sm:w-60">
            <Select 
              options={availableCategories.map(cat => ({ value: cat, label: cat }))}
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="bg-background"
            />
          </div>
        </div>

        {/* Active Shops Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredShops.map(shop => (
            <Card key={shop.id} className="hover:scale-[1.01] transition-transform border flex flex-col justify-between shadow-sm">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start gap-2">
                  <h4 className="font-extrabold text-sm text-foreground line-clamp-1">{shop.shopName}</h4>
                  <Badge variant="outline">{shop.category}</Badge>
                </div>
                <CardDescription className="text-[10px] text-muted-foreground">
                  Owner: <strong>{shop.ownerName}</strong>
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
              No registered shops match the search criteria.
            </div>
          )}
        </div>
      </div>

      {/* 5. Association Gallery */}
      {gallery.length > 0 && (
        <div className="max-w-6xl mx-auto px-4 space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-black tracking-tight text-foreground">📸 Official Media Gallery</h2>
            <p className="text-xs text-muted-foreground">
              Sneak peek into our recent trade events, assemblies, and official delegations.
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
          <h2 className="text-3xl font-black tracking-tight text-foreground">🛡️ Membership Benefits</h2>
          <p className="text-xs text-muted-foreground">
            What you unlock when you become an approved member of Jhusi Vyapar Mandal.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="border shadow-sm text-center p-6 hover:shadow-md transition-shadow">
            <span className="text-4xl block mb-3">💳</span>
            <h4 className="font-extrabold text-sm text-foreground">Digital Identity Card</h4>
            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
              Receive a verified QR-enabled digital membership card to establish your credentials as an official trade vendor.
            </p>
          </Card>
          <Card className="border shadow-sm text-center p-6 hover:shadow-md transition-shadow">
            <span className="text-4xl block mb-3">🛠️</span>
            <h4 className="font-extrabold text-sm text-foreground">Grievance Resolutions</h4>
            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
              Raise civic drainage, electrical, security or garbage concerns directly to officers, ensuring immediate allocation to municipal offices.
            </p>
          </Card>
          <Card className="border shadow-sm text-center p-6 hover:shadow-md transition-shadow">
            <span className="text-4xl block mb-3">🏷️</span>
            <h4 className="font-extrabold text-sm text-foreground">Business Directory Listings</h4>
            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
              List your shop in the public directory to gain visibility amongst local consumers and network with other business houses.
            </p>
          </Card>
        </div>
      </div>

      {/* 7. Testimonials */}
      <div className="max-w-6xl mx-auto px-4 space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-black tracking-tight text-foreground">💬 Merchants Testimonials</h2>
          <p className="text-xs text-muted-foreground">
            Feedback from registered traders who resolved issues using our digital portal.
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="border p-6 shadow-sm bg-muted/10">
            <p className="text-xs text-muted-foreground italic leading-relaxed">
              "The Vyapar Mandal helped resolve a critical parking bottleneck outside my textile showroom by coordinating with municipal authorities. The digital grievance tracking works flawlessly!"
            </p>
            <div className="mt-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-700 flex items-center justify-center font-bold text-xs">
                RK
              </div>
              <div>
                <h5 className="font-bold text-xs text-foreground">Ramesh Kumar</h5>
                <span className="text-[10px] text-muted-foreground">Owner, Balaji Textiles</span>
              </div>
            </div>
          </Card>

          <Card className="border p-6 shadow-sm bg-muted/10">
            <p className="text-xs text-muted-foreground italic leading-relaxed">
              "The digital membership card was issued instantly. It makes trade coordination and official paperwork very simple. Truly a modern digital upgrade for local shops."
            </p>
            <div className="mt-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-700 flex items-center justify-center font-bold text-xs">
                VS
              </div>
              <div>
                <h5 className="font-bold text-xs text-foreground">Vijay Sen</h5>
                <span className="text-[10px] text-muted-foreground">Owner, Vijay Groceries</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
export default PublicWebsite;
