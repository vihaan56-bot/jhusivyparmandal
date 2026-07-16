import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTenant } from '../context/TenantContext';
import { useLanguage } from '../context/LanguageContext';
import { dataService } from '../services/dataService';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, Input, Label, Textarea, Select } from '../components/ui/CustomUI';

export const PublicWebsite: React.FC = () => {
  const { tenantId, activeAssociation } = useTenant();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [committee, setCommittee] = useState<any[]>([]);

  // Membership form state
  const [shopName, setShopName] = useState('');
  const [category, setCategory] = useState('Textiles');
  const [ownerName, setOwnerName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [desc, setDesc] = useState('');
  const [isSubmittingMember, setIsSubmittingMember] = useState(false);
  const [membFeedback, setMembFeedback] = useState<string | null>(null);

  // Complaint form state
  const [compTitle, setCompTitle] = useState('');
  const [compCat, setCompCat] = useState('road');
  const [compDesc, setCompDesc] = useState('');
  const [compLoc, setCompLoc] = useState('');
  const [isSubmittingComp, setIsSubmittingComp] = useState(false);
  const [compFeedback, setCompFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (tenantId) {
      dataService.getMemberships(tenantId).then(members => {
        // Filter out administrative / committee roles
        const executiveRoles = ['president', 'vice_president', 'secretary', 'treasurer', 'committee'];
        const commList = members.filter(m => executiveRoles.includes(m.role));
        setCommittee(commList);
      });
    }
  }, [tenantId]);

  const handleMemberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopName || !ownerName || !phone || !tenantId) return;
    setIsSubmittingMember(true);
    setMembFeedback(null);

    const membership = {
      id: `${tenantId}_user_visitor_${Date.now()}`,
      associationId: tenantId,
      userId: `user_visitor_${Date.now()}`,
      role: 'business_member',
      status: 'pending', // Pending approval by admin
      shopName,
      category,
      ownerName,
      phone,
      email,
      address,
      businessDescription: desc,
      businessImages: [],
      products: [],
      services: [],
      membershipExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 year expiry
      membershipCardNumber: `PENDING-${Math.floor(1000 + Math.random() * 9000)}`,
      createdAt: new Date().toISOString()
    };

    try {
      await dataService.createOrUpdateMembership(membership);
      setMembFeedback('âœ… Your membership application has been submitted successfully! The committee will review and contact you shortly.');
      setShopName('');
      setOwnerName('');
      setPhone('');
      setEmail('');
      setAddress('');
      setDesc('');
    } catch (err) {
      console.error(err);
      setMembFeedback('âŒ There was an error submitting your form. Please try again.');
    } finally {
      setIsSubmittingMember(false);
    }
  };

  const handleComplaintSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!compTitle || !compDesc || !compLoc || !tenantId) return;
    setIsSubmittingComp(true);
    setCompFeedback(null);

    const complaint = {
      associationId: tenantId,
      userId: 'public_visitor',
      userName: 'Public Visitor',
      category: compCat,
      title: compTitle,
      description: compDesc,
      status: 'submitted',
      photos: [],
      location: { addressString: compLoc },
      comments: [],
      createdAt: new Date().toISOString()
    };

    try {
      await dataService.createComplaint(complaint);
      setCompFeedback('âœ… Your complaint has been logged and assigned. You can contact the association office to track progress.');
      setCompTitle('');
      setCompDesc('');
      setCompLoc('');
    } catch (err) {
      console.error(err);
      setCompFeedback('âŒ Failed to log complaint. Please try again.');
    } finally {
      setIsSubmittingComp(false);
    }
  };

  return (
    <div className="bg-background text-foreground space-y-16 pb-16">
      
      {/* Hero Header Jumbotron */}
      <div 
        className="relative py-24 text-white overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${activeAssociation?.primaryColor || '#0284c7'} 0%, ${activeAssociation?.secondaryColor || '#f59e0b'} 100%)`
        }}
      >
        <div className="absolute inset-0 bg-black/20" />
        <div className="max-w-5xl mx-auto px-4 text-center space-y-6 relative z-10">
          <img 
            src={activeAssociation?.logoUrl} 
            alt="Logo" 
            className="w-24 h-24 rounded-full mx-auto object-cover border-4 border-white bg-white shadow-2xl" 
          />
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
            {activeAssociation?.name}
          </h1>
          <p className="text-white/90 text-sm sm:text-lg max-w-2xl mx-auto font-medium">
            Advocating for merchants, building civic infrastructure, and boosting local economy. Discover our members, submit complaints, or become an official member below.
          </p>
          <div className="flex gap-3 justify-center pt-2">
            <a href="#become-member">
              <Button size="lg" className="rounded-full bg-white text-primary hover:bg-white/95 font-bold shadow-lg shadow-black/10">
                🤝 {t('Become Member')}
              </Button>
            </a>
            <Button 
              size="lg" 
              onClick={() => navigate(`/login`, { state: { mode: 'signup' } })}
              className="rounded-full bg-zinc-950 text-white hover:bg-zinc-900 font-bold border border-zinc-800 shadow-lg cursor-pointer"
            >
              🔑 {t('Create Account / Login')}
            </Button>
            <a href="#complaints">
              <Button size="lg" variant="glass" className="rounded-full font-bold">
                  🛠️ {t('Submit Complaint')}
              </Button>
            </a>
          </div>
        </div>
      </div>

      {/* Grid: Executive & Achievements */}
      <div className="max-w-6xl mx-auto px-4 grid md:grid-cols-3 gap-8">
        
        {/* About & Stats */}
        <div className="md:col-span-2 space-y-8">
          <section className="space-y-4">
            <h2 className="text-3xl font-black tracking-tight text-foreground border-b pb-2">
              About Our Association
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              We are a unified trade association dedicated to representing local businesses. We collaborate closely with civic bodies to maintain parking structures, repair commercial lanes, resolve security issues, and handle business compliance seminars.
            </p>
            <div className="grid grid-cols-3 gap-4 pt-4">
              <div className="p-4 border rounded-xl text-center bg-card shadow-sm">
                <div className="text-2xl font-black text-primary">500+</div>
                <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mt-1">Traders</div>
              </div>
              <div className="p-4 border rounded-xl text-center bg-card shadow-sm">
                <div className="text-2xl font-black text-primary">12+</div>
                <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mt-1">Campaigns</div>
              </div>
              <div className="p-4 border rounded-xl text-center bg-card shadow-sm">
                <div className="text-2xl font-black text-primary">95%</div>
                <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mt-1">Resolved</div>
              </div>
            </div>
          </section>

          {/* Committee Board */}
          <section className="space-y-4">
            <h2 className="text-3xl font-black tracking-tight text-foreground border-b pb-2">
              Executive Committee
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {committee.map((comm) => (
                <Card key={comm.id} className="text-center p-4 hover:shadow-lg transition-shadow">
                  <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-primary mx-auto text-xl uppercase mb-3">
                    {comm.ownerName.charAt(0)}
                  </div>
                  <h4 className="font-extrabold text-sm line-clamp-1">{comm.ownerName}</h4>
                  <p className="text-[10px] font-black text-primary uppercase tracking-wider mt-0.5">{comm.role}</p>
                  <p className="text-[10px] text-muted-foreground mt-1 line-clamp-1">{comm.shopName}</p>
                </Card>
              ))}
              {committee.length === 0 && (
                <div className="col-span-full py-6 text-center text-muted-foreground text-sm">
                  No committee profiles listed.
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Contact Info Widget */}
        <div className="space-y-6">
          <Card className="bg-muted/10 border-primary/10">
            <CardHeader>
              <CardTitle>Mandal Secretariat</CardTitle>
              <CardDescription>Official correspondence office details.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <div>
                <strong className="block text-foreground">📍 Address</strong>
                <span>{activeAssociation?.address}</span>
              </div>
              <div>
                <strong className="block text-foreground">📞 Phone Contacts</strong>
                <span>{activeAssociation?.contactPhone}</span>
              </div>
              <div>
                <strong className="block text-foreground">✉️ Email Support</strong>
                <span>{activeAssociation?.contactEmail}</span>
              </div>
              <div className="border-t pt-4 space-y-2">
                <Button onClick={() => navigate(`/login`)} className="w-full font-bold cursor-pointer">
                  🔑 Member Login
                </Button>
                <Button onClick={() => navigate(`/login`, { state: { mode: 'signup' } })} variant="outline" className="w-full font-bold cursor-pointer">
                  🤝 Create New Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* become member form section */}
      <div id="become-member" className="max-w-6xl mx-auto px-4">
        <Card className="max-w-3xl mx-auto shadow-2xl">
          <CardHeader className="bg-primary/5 border-b">
            <CardTitle>🤝 Apply for Association Membership</CardTitle>
            <CardDescription>Join our trade association to unlock business promotions, global directory search, and voting rights.</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleMemberSubmit} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Shop Name (फर्म का नाम)</Label>
                  <Input required placeholder="e.g. Balaji Textiles" value={shopName} onChange={e => setShopName(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Select 
                    label="Business Category (व्यवसाय श्रेणी)"
                    options={[
                      { value: 'Textiles', label: 'Textiles & Cloth' },
                      { value: 'Electronics', label: 'Electronics & Mobiles' },
                      { value: 'Groceries', label: 'Kirana & Groceries' },
                      { value: 'Jewellery', label: 'Jewellery & Gold' },
                      { value: 'Stationery', label: 'Stationery & Printing' },
                      { value: 'Hardware', label: 'Hardware & Tools' }
                    ]}
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Owner Name (मालिक का नाम)</Label>
                  <Input required placeholder="e.g. Ramesh Kumar" value={ownerName} onChange={e => setOwnerName(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Phone Number (मोबाइल नंबर)</Label>
                  <Input required placeholder="e.g. +91 99999 88888" value={phone} onChange={e => setPhone(e.target.value)} />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Email (वैकल्पिक)</Label>
                  <Input type="email" placeholder="e.g. email@domain.com" value={email} onChange={e => setEmail(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Shop Address (दुकान का पता)</Label>
                  <Input required placeholder="e.g. Shop 24, Main Gali No 2" value={address} onChange={e => setAddress(e.target.value)} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Business Description (व्यापार विवरण)</Label>
                <Textarea placeholder="Describe the products you sell or services you offer..." value={desc} onChange={e => setDesc(e.target.value)} />
              </div>
              {membFeedback && <p className="text-sm font-semibold p-3 rounded-lg bg-primary/10 border border-primary/20">{membFeedback}</p>}
              <Button type="submit" disabled={isSubmittingMember} className="w-full">
                {isSubmittingMember ? 'Submitting...' : 'Submit Application'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* complaint form section */}
      <div id="complaints" className="max-w-6xl mx-auto px-4">
        <Card className="max-w-3xl mx-auto shadow-2xl border-destructive/20">
          <CardHeader className="bg-destructive/5 border-b">
            <CardTitle className="text-destructive">🛠️ Log Public Civic Complaint</CardTitle>
            <CardDescription>File grievances regarding sewer blocks, parking hazards, street light failures, or garbage dumps directly to the committee.</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleComplaintSubmit} className="space-y-4">
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2 space-y-1.5">
                  <Label>Complaint Headline (शिकायत का शीर्षक)</Label>
                  <Input required placeholder="e.g. Potholes clogging Bara Tooti market" value={compTitle} onChange={e => setCompTitle(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Select 
                    label="Grievance Category"
                    options={[
                      { value: 'road', label: 'Road / Pothole' },
                      { value: 'drainage', label: 'Drainage / Sewer' },
                      { value: 'garbage', label: 'Garbage Dump' },
                      { value: 'electricity', label: 'Electricity / Transformer' },
                      { value: 'parking', label: 'Parking Hazard' },
                      { value: 'security', label: 'Security issue' }
                    ]}
                    value={compCat}
                    onChange={e => setCompCat(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Precise Location / Shop landmark (घटना स्थल / दुकान लैंडमार्क)</Label>
                <Input required placeholder="e.g. Gali Qutubuddin exit, opposite Kirana store" value={compLoc} onChange={e => setCompLoc(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Complaint Description (शिकायत का पूरा विवरण)</Label>
                <Textarea required placeholder="Describe the severity of the issue, length of neglect, and impact on shops..." value={compDesc} onChange={e => setCompDesc(e.target.value)} />
              </div>
              {compFeedback && <p className="text-sm font-semibold p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive">{compFeedback}</p>}
              <Button type="submit" variant="destructive" disabled={isSubmittingComp} className="w-full">
                {isSubmittingComp ? 'Filing Complaint...' : 'File Official Complaint'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

    </div>
  );
};

