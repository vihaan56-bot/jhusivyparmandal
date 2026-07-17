import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTenant } from '../context/TenantContext';
import { useLanguage } from '../context/LanguageContext';
import { dataService } from '../services/dataService';
import { QRCard } from '../components/QRCard';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, Dialog, Input, Label, Badge } from '../components/ui/CustomUI';

export const Dashboard: React.FC = () => {
  const { user, role, shops, loading: authLoading } = useAuth();
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
  const [selectedShopForCard, setSelectedShopForCard] = useState<any | null>(null);

  // Shop Register/Edit Modals
  const [isAddShopOpen, setIsAddShopOpen] = useState(false);
  const [isEditingShop, setIsEditingShop] = useState(false);
  const [editingShopId, setEditingShopId] = useState('');
  
  const [newShopName, setNewShopName] = useState('');
  const [newShopCategory, setNewShopCategory] = useState('Textiles');
  const [newShopAddress, setNewShopAddress] = useState('');
  const [newShopGST, setNewShopGST] = useState('');
  const [newShopDesc, setNewShopDesc] = useState('');
  const [newShopProducts, setNewShopProducts] = useState('');
  const [newShopPhoto, setNewShopPhoto] = useState('');

  // Payment Checkout
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [submittingShop, setSubmittingShop] = useState(false);

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
      setAnnouncements(anns.slice(0, 3));
      setMeetings(meets.filter(m => new Date(m.dateTime) > new Date()).slice(0, 2));
      setComplaints(comps.filter(c => c.status !== 'resolved' && c.status !== 'closed').slice(0, 2));
      setCampaigns(camps.filter(c => c.status === 'active').slice(0, 2));
      setPromotions(posts.slice(0, 3));
    }).finally(() => {
      setLoading(false);
    });
  }, [tenantId]);

  const handleEditShopClick = (shop: any) => {
    setIsEditingShop(true);
    setEditingShopId(shop.id);
    setNewShopName(shop.shopName);
    setNewShopCategory(shop.category);
    setNewShopAddress(shop.address);
    setNewShopGST(shop.gstNumber || '');
    setNewShopDesc(shop.businessDescription || '');
    setNewShopProducts(shop.products ? shop.products.join(', ') : '');
    setNewShopPhoto(shop.businessImages?.[0] || '');
    setIsAddShopOpen(true);
  };

  const handleOpenAddShop = () => {
    setIsEditingShop(false);
    setEditingShopId('');
    setNewShopName('');
    setNewShopCategory('Textiles');
    setNewShopAddress('');
    setNewShopGST('');
    setNewShopDesc('');
    setNewShopProducts('');
    setNewShopPhoto('');
    setIsAddShopOpen(true);
  };

  const handleSaveShopSubmit = async () => {
    if (!newShopName || !newShopAddress) return;
    setIsCheckoutOpen(false);
    setSubmittingShop(true);
    
    const shopId = isEditingShop ? editingShopId : `${tenantId}_shop_${Date.now()}`;
    const shopData = {
      id: shopId,
      associationId: tenantId!,
      userId: user!.uid,
      status: 'pending', // Sent for review
      shopName: newShopName,
      category: newShopCategory,
      ownerName: user!.displayName,
      phone: user!.phoneNumber || '',
      email: user!.email,
      address: newShopAddress,
      gstNumber: newShopGST || '',
      businessDescription: newShopDesc || 'Shop registered via portal',
      businessImages: newShopPhoto ? [newShopPhoto] : [],
      products: newShopProducts.split(',').map(p => p.trim()).filter(Boolean),
      services: [],
      membershipExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      membershipCardNumber: `SB-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      createdAt: new Date().toISOString()
    };

    try {
      await dataService.createOrUpdateMembership(shopData);
      
      await dataService.logAction(
        tenantId!, 
        user!.uid, 
        user!.displayName, 
        isEditingShop ? 'SHOP_MODIFY' : 'SHOP_ADD', 
        `${isEditingShop ? 'Modified' : 'Registered'} shop "${newShopName}"`
      );

      alert(isEditingShop ? 'Shop resubmitted successfully for review.' : 'Shop registered and subscription payment verified! Status is pending.');
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert('Failed to register shop.');
    } finally {
      setSubmittingShop(false);
    }
  };

  const handleProceedToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newShopName || !newShopAddress) return;
    
    setIsAddShopOpen(false);
    
    if (isEditingShop) {
      // Direct update for resubmission (already paid)
      handleSaveShopSubmit();
    } else {
      // Trigger checkout for new shops
      setIsCheckoutOpen(true);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin text-3xl">🔄</div>
          <p className="text-sm text-muted-foreground">{t('loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Welcome & Banner */}
      <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
        <div>
          <h1 className="text-3xl font-black tracking-tight">{t('welcome')}, {user?.displayName}!</h1>
          <p className="text-muted-foreground text-sm">
            {t('Here is what is happening in the market today.')}
          </p>
        </div>
      </div>

      {/* 🛡️ Administrative Portal Dashboard Workspace (For Root & Admin) */}
      {(role === 'root' || role === 'admin') && (
        <Card className="border-l-4 border-l-red-500 shadow-md bg-red-500/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-black text-red-700">🛡️ Operational Administration Portal</CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              You are logged in as {role.toUpperCase()}. Use this portal to manage trade association operations, review member applications, and supervise staff.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                onClick={() => navigate('/admin')} 
                className="bg-red-600 hover:bg-red-700 text-white font-bold text-sm rounded-xl py-5 shadow-lg shadow-red-500/10 flex items-center gap-2"
              >
                ⚙️ Open Admin Control Panel
              </Button>
              <Button 
                variant="outline" 
                onClick={() => navigate('/directory')} 
                className="font-bold text-sm rounded-xl py-5 flex items-center gap-2 border-red-200 text-red-700 hover:bg-red-50"
              >
                📞 View Member Directory
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 🏪 My Registered Shops Section (Member dashboard custom panel) */}
      {role === 'member' && (
        <Card className="border-l-4 border-l-primary shadow-md">
          <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3">
            <div>
              <CardTitle>🏪 My Registered Shops ({shops.length})</CardTitle>
              <CardDescription>Add new shops or track approval feedback status of submitted applications.</CardDescription>
            </div>
            <Button 
              onClick={handleOpenAddShop}
              className="bg-primary hover:bg-primary/95 text-white font-bold text-xs"
            >
              ➕ Register New Shop
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid sm:grid-cols-2 gap-4">
              {shops.map((shop) => (
                <div key={shop.id} className="border rounded-xl p-4 space-y-2 bg-muted/10 relative hover:shadow transition-shadow">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <h4 className="font-extrabold text-sm text-foreground">{shop.shopName}</h4>
                      <p className="text-[10px] text-muted-foreground">{shop.category} • Card: {shop.membershipCardNumber}</p>
                    </div>
                    <Badge 
                      variant={
                        shop.status === 'approved' ? 'success' : 
                        shop.status === 'pending' ? 'outline' : 
                        shop.status === 'needs_changes' ? 'outline' : 'destructive'
                      }
                      className="text-[9px] font-black"
                    >
                      {shop.status.toUpperCase()}
                    </Badge>
                  </div>
                  
                  <p className="text-xs text-muted-foreground line-clamp-2">📍 {shop.address}</p>
                  
                  {shop.status === 'approved' && (
                    <div className="flex gap-2 pt-2 border-t mt-2">
                      <Button size="sm" variant="outline" onClick={() => { setSelectedShopForCard(shop); setIsCardOpen(true); }} className="text-[10px] font-bold">
                        💳 View Digital Card
                      </Button>
                    </div>
                  )}

                  {shop.status === 'needs_changes' && (
                    <div className="space-y-2 pt-2 border-t mt-2">
                      <div className="p-2 bg-amber-500/10 text-amber-700 text-[10px] rounded border border-amber-500/20 font-medium leading-relaxed">
                        <strong>Admin Feedback:</strong> {shop.needsChangesReason}
                      </div>
                      <Button 
                        size="sm" 
                        onClick={() => handleEditShopClick(shop)} 
                        className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold text-[10px]"
                      >
                        ✏️ Modify & Resubmit
                      </Button>
                    </div>
                  )}

                  {shop.status === 'rejected' && shop.rejectionReason && (
                    <div className="p-2 bg-red-500/10 text-red-700 text-[10px] rounded border border-red-500/20 font-medium mt-2 leading-relaxed">
                      <strong>Rejection Reason:</strong> {shop.rejectionReason}
                    </div>
                  )}

                  {shop.status === 'suspended' && shop.suspensionReason && (
                    <div className="p-2 bg-red-500/10 text-red-700 text-[10px] rounded border border-red-500/20 font-medium mt-2 leading-relaxed">
                      <strong>Suspension Details:</strong> {shop.suspensionReason}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {shops.length === 0 && (
              <div className="py-8 text-center text-xs text-muted-foreground border border-dashed rounded-xl">
                No shops registered under your account yet. Click "Register New Shop" to get started!
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Grid: Quick Action Buttons */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button 
          onClick={() => navigate(`/complaints`)}
          className="p-5 rounded-xl border bg-card hover:bg-red-500/5 hover:border-red-500/20 text-left transition-all active:scale-[0.98] group flex flex-col justify-between h-28 cursor-pointer"
        >
          <span className="text-2xl group-hover:scale-110 transition-transform">🛠️</span>
          <div>
            <h4 className="font-bold text-sm text-foreground">File Complaint</h4>
            <p className="text-[10px] text-muted-foreground truncate">Report sewers, wiring, roads</p>
          </div>
        </button>

        <button 
          onClick={() => navigate(`/business`)}
          className="p-5 rounded-xl border bg-card hover:bg-sky-500/5 hover:border-sky-500/20 text-left transition-all active:scale-[0.98] group flex flex-col justify-between h-28 cursor-pointer"
        >
          <span className="text-2xl group-hover:scale-110 transition-transform">🏷️</span>
          <div>
            <h4 className="font-bold text-sm text-foreground">Post Promotion</h4>
            <p className="text-[10px] text-muted-foreground truncate">Advertise store offers, hiring</p>
          </div>
        </button>

        <button 
          onClick={() => navigate(`/directory`)}
          className="p-5 rounded-xl border bg-card hover:bg-emerald-500/5 hover:border-emerald-500/20 text-left transition-all active:scale-[0.98] group flex flex-col justify-between h-28 cursor-pointer"
        >
          <span className="text-2xl group-hover:scale-110 transition-transform">📞</span>
          <div>
            <h4 className="font-bold text-sm text-foreground">Search Directory</h4>
            <p className="text-[10px] text-muted-foreground truncate">Lookup local shops & categories</p>
          </div>
        </button>

        <button 
          onClick={() => navigate(`/announcements`)}
          className="p-5 rounded-xl border bg-card hover:bg-amber-500/5 hover:border-amber-500/20 text-left transition-all active:scale-[0.98] group flex flex-col justify-between h-28 cursor-pointer"
        >
          <span className="text-2xl group-hover:scale-110 transition-transform">📢</span>
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
          <Card>
            <CardHeader className="flex flex-row justify-between items-center pb-4">
              <div>
                <CardTitle>📢 {t('latestAnnouncements')}</CardTitle>
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
                    <span>•</span>
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

          <Card>
            <CardHeader className="flex flex-row justify-between items-center pb-4">
              <div>
                <CardTitle>🏷️  {t('recentPromotions')}</CardTitle>
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
                      🏢 {post.shopName}
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
          <Card>
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base">📅 {t('upcomingMeetings')}</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              {meetings.map((meet) => (
                <div key={meet.id} className="space-y-2 border-l-2 border-primary pl-3 py-1">
                  <h4 className="font-bold text-sm text-foreground line-clamp-1">{meet.title}</h4>
                  <p className="text-xs text-muted-foreground line-clamp-1">📍 {meet.venue}</p>
                  <p className="text-[10px] text-primary font-semibold">
                    ⏰ {new Date(meet.dateTime).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
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

          <Card>
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base text-red-500">🛠️  {t('recentComplaints')}</CardTitle>
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
                  <p className="text-[10px] text-muted-foreground line-clamp-1">📍 {comp.location.addressString}</p>
                </div>
              ))}
              {complaints.length === 0 && (
                <div className="text-center text-xs text-muted-foreground py-4">
                  {t('noComplaints')}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base text-purple-500">✊ {t('activeCampaigns')}</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              {campaigns.map((camp) => (
                <div key={camp.id} className="space-y-1">
                  <h4 className="font-bold text-xs text-foreground line-clamp-1">{camp.title}</h4>
                  <p className="text-[10px] text-muted-foreground line-clamp-2">{camp.description}</p>
                  <p className="text-[9px] font-black text-purple-600 mt-1 uppercase">
                    👥 {camp.participantsCount} Traders Participating
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
      {selectedShopForCard && (
        <Dialog isOpen={isCardOpen} onClose={() => { setIsCardOpen(false); setSelectedShopForCard(null); }} title="Digital Shopkeeper Card">
          <QRCard membership={selectedShopForCard} />
        </Dialog>
      )}

      {/* REGISTER NEW SHOP FORM MODAL */}
      {isAddShopOpen && (
        <Dialog isOpen={isAddShopOpen} onClose={() => setIsAddShopOpen(false)} title={isEditingShop ? '✏️ Edit Shop details' : '🏪 Register New Shop'}>
          <form onSubmit={handleProceedToPayment} className="space-y-4 text-sm text-foreground">
            <div className="space-y-1.5">
              <Label>Shop / Firm Name</Label>
              <Input 
                required 
                placeholder="e.g. Balaji Textiles" 
                value={newShopName} 
                onChange={e => setNewShopName(e.target.value)} 
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Business Category</Label>
                <select 
                  value={newShopCategory} 
                  onChange={e => setNewShopCategory(e.target.value)}
                  className="w-full bg-card border rounded p-2 text-sm text-foreground focus:ring-1 focus:ring-primary outline-none font-semibold"
                >
                  <option value="Textiles">Textiles & Cloth (कपड़ा और वस्त्र)</option>
                  <option value="Electronics">Electronics & Mobiles (इलेक्ट्रॉनिक्स और मोबाइल)</option>
                  <option value="Groceries">Kirana & Groceries (किराना और ग्रोसरी)</option>
                  <option value="Jewellery">Jewellery & Gold (आभूषण और सोना)</option>
                  <option value="Stationery">Stationery & Printing (स्टेशनरी और प्रिंटिंग)</option>
                  <option value="Hardware">Hardware & Tools (हार्डवेयर और उपकरण)</option>
                  <option value="Other">Other (अन्य)</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>GST Number (Optional)</Label>
                <Input 
                  placeholder="e.g. 09AAAAA1111A1Z1" 
                  value={newShopGST} 
                  onChange={e => setNewShopGST(e.target.value)} 
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Shop Address Location</Label>
              <Input 
                required 
                placeholder="e.g. Shop 42, Main Bazaar, Jhusi" 
                value={newShopAddress} 
                onChange={e => setNewShopAddress(e.target.value)} 
              />
            </div>

            <div className="space-y-1.5">
              <Label>Business Description</Label>
              <textarea 
                placeholder="Briefly describe what your shop sells or provides..."
                value={newShopDesc}
                onChange={e => setNewShopDesc(e.target.value)}
                rows={2}
                className="w-full bg-card border rounded p-2 text-sm text-foreground focus:ring-1 focus:ring-primary outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Products / Services (Comma separated)</Label>
              <Input 
                placeholder="e.g. Shirts, Pants, Suitings" 
                value={newShopProducts} 
                onChange={e => setNewShopProducts(e.target.value)} 
              />
            </div>

            <div className="space-y-1.5">
              <Label>Shop Photo</Label>
              <div className="flex gap-4 items-center">
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setNewShopPhoto(reader.result as string);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="hidden" 
                  id="shop-photo-upload"
                />
                <label 
                  htmlFor="shop-photo-upload"
                  className="px-4 py-2 border rounded-xl hover:bg-muted text-xs font-bold cursor-pointer transition-colors shrink-0 bg-background"
                >
                  📸 Choose Image
                </label>
                {newShopPhoto ? (
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden border">
                    <img src={newShopPhoto} alt="Shop Preview" className="w-full h-full object-cover" />
                    <button 
                      type="button" 
                      onClick={() => setNewShopPhoto('')}
                      className="absolute top-0.5 right-0.5 bg-black/70 text-white rounded-full w-4 h-4 flex items-center justify-center text-[9px] hover:bg-black"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-xl border flex items-center justify-center bg-muted/30 text-muted-foreground text-[10px] uppercase font-bold text-center p-1 leading-tight">
                    No Photo
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2 justify-end border-t pt-4">
              <Button type="button" variant="outline" onClick={() => setIsAddShopOpen(false)} className="font-bold">
                Cancel
              </Button>
              <Button type="submit" className="bg-primary hover:bg-primary/95 text-white font-bold">
                {isEditingShop ? '✓ Resubmit changes' : '⚡ Proceed to Payment'}
              </Button>
            </div>
          </form>
        </Dialog>
      )}

      {/* SIMULATED UPI CHECKOUT OVERLAY */}
      {isCheckoutOpen && (
        <Dialog isOpen={isCheckoutOpen} onClose={() => setIsCheckoutOpen(false)} title="Mandal Membership Subscription Fee">
          <div className="space-y-4 text-foreground text-sm">
            <div className="bg-primary/5 rounded-xl border p-4 text-center space-y-2">
              <h4 className="font-extrabold text-base text-primary">Jhusi Vyapar Mandal, Prayagraj</h4>
              <p className="text-xs text-muted-foreground">Annual Membership Subscription Fee</p>
              <div className="text-3xl font-black text-foreground pt-2">₹1,100 <span className="text-xs font-normal text-muted-foreground">/ year</span></div>
            </div>

            <div className="space-y-3.5 pt-2">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Scan the mock QR code below using any UPI app or click the mock pay button to simulate transaction success.
              </p>

              <div className="w-40 h-40 border border-dashed rounded-lg flex flex-col items-center justify-center bg-muted/20 mx-auto p-2">
                <div className="w-full h-full border border-primary/20 rounded flex flex-col items-center justify-center gap-1 font-mono text-[9px] text-primary bg-white shadow-sm">
                  <span>[ UPI QR CODE ]</span>
                  <span className="font-sans text-[8px] text-muted-foreground font-semibold">merchant@upi</span>
                </div>
              </div>

              <div className="p-3 bg-amber-500/5 text-amber-600 rounded-lg text-[10px] border border-amber-500/15 leading-tight font-medium">
                ⚠️ Note: This is a simulated checkout sandbox. No real currency will be charged.
              </div>
            </div>

            <div className="flex gap-2 border-t pt-4">
              <Button type="button" variant="outline" className="flex-1 font-bold" onClick={() => setIsCheckoutOpen(false)}>
                Cancel
              </Button>
              <Button type="button" className="flex-1 font-bold bg-primary hover:bg-primary/95 text-white" onClick={handleSaveShopSubmit} disabled={submittingShop}>
                {submittingShop ? 'Processing...' : '⚡ Simulate Success'}
              </Button>
            </div>
          </div>
        </Dialog>
      )}

    </div>
  );
};
