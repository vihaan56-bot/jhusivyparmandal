import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTenant } from '../context/TenantContext';
import { useLanguage } from '../context/LanguageContext';
import { dataService } from '../services/dataService';
import { rbacService } from '../services/rbacService';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, Input, Label, Select, Badge } from '../components/ui/CustomUI';

// Image compression utility helper using canvas
const compressImage = (base64Str: string, maxWidth = 800, maxHeight = 600, quality = 0.7): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      } else {
        resolve(base64Str);
      }
    };
    img.onerror = () => {
      resolve(base64Str);
    };
  });
};

export const AdminPanel: React.FC = () => {
  const { user, role } = useAuth();
  const { tenantId, activeAssociation } = useTenant();
  const { t } = useLanguage();

  const isRoot = rbacService.canManageAdmins(role);
  const canManageOps = rbacService.canManageShops(role);

  const [members, setMembers] = useState<any[]>([]);
  const [adminsList, setAdminsList] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Tab states
  const [activeTab, setActiveTab] = useState<'membership' | 'branding' | 'committee' | 'carousel' | 'testimonials' | 'admins' | 'logs'>(
    canManageOps ? 'membership' : 'admins'
  );

  // Shop Filter
  const [shopFilter, setShopFilter] = useState<'pending' | 'approved' | 'needs_changes' | 'suspended' | 'all'>('pending');

  // Shop Feedback Actions
  const [selectedShop, setSelectedShop] = useState<any | null>(null);
  const [actionType, setActionType] = useState<'rejected' | 'needs_changes' | 'suspended' | null>(null);
  const [feedbackReason, setFeedbackReason] = useState('');
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

  // Admin Creation Form States
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminPhone, setAdminPhone] = useState('');
  const [creatingAdmin, setCreatingAdmin] = useState(false);

  // Admin Password Reset States
  const [resettingPasswordAdmin, setResettingPasswordAdmin] = useState<any | null>(null);
  const [newAdminPassword, setNewAdminPassword] = useState('');

  // Branding Editor Form State
  const [assocName, setAssocName] = useState(activeAssociation?.name || '');
  const [assocPhone, setAssocPhone] = useState(activeAssociation?.contactPhone || '');
  const [assocEmail, setAssocEmail] = useState(activeAssociation?.contactEmail || '');
  const [assocLogo, setAssocLogo] = useState(activeAssociation?.logoUrl || '');
  const [primaryColor, setPrimaryColor] = useState(activeAssociation?.primaryColor || '#0284c7');
  const [secondaryColor, setSecondaryColor] = useState(activeAssociation?.secondaryColor || '#f59e0b');

  // Executive Committee form/list states
  const [committeeMembers, setCommitteeMembers] = useState<any[]>([]);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberDesignation, setNewMemberDesignation] = useState('');
  const [newMemberShop, setNewMemberShop] = useState('');
  const [newMemberImage, setNewMemberImage] = useState('');
  const [submittingMember, setSubmittingMember] = useState(false);

  // Slideshow Carousel list states
  const [carouselImages, setCarouselImages] = useState<any[]>([]);
  const [carouselCaption, setCarouselCaption] = useState('');
  const [uploadingSlide, setUploadingSlide] = useState(false);

  // Testimonials form/list states
  const [testimonialsList, setTestimonialsList] = useState<any[]>([]);
  const [newTestiQuote, setNewTestiQuote] = useState('');
  const [newTestiAuthor, setNewTestiAuthor] = useState('');
  const [newTestiSubtitle, setNewTestiSubtitle] = useState('');
  const [submittingTesti, setSubmittingTesti] = useState(false);

  // Load Admin Data
  useEffect(() => {
    if (!tenantId) return;
    setLoading(true);

    const loadData = async () => {
      try {
        const [membersList, logs, committeeList, carouselList, testimonialList] = await Promise.all([
          dataService.getMemberships(tenantId),
          dataService.getAuditLogs(tenantId),
          dataService.getExecutiveCommittee(tenantId),
          dataService.getCarouselImages(tenantId),
          dataService.getTestimonials(tenantId)
        ]);
        setMembers(membersList);
        setAuditLogs(logs);
        setCommitteeMembers(committeeList);
        setCarouselImages(carouselList);
        setTestimonialsList(testimonialList);

        if (isRoot) {
          const admins = await dataService.getAdminUsers();
          setAdminsList(admins);
        }
      } catch (err) {
        console.error('Error loading admin panel data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [tenantId, isRoot]);

  // Sync state if active association changes
  useEffect(() => {
    if (activeAssociation) {
      setAssocName(activeAssociation.name);
      setAssocPhone(activeAssociation.contactPhone);
      setAssocEmail(activeAssociation.contactEmail);
      setAssocLogo(activeAssociation.logoUrl);
      setPrimaryColor(activeAssociation.primaryColor);
      setSecondaryColor(activeAssociation.secondaryColor);
    }
  }, [activeAssociation]);

  // Block unauthorized users immediately
  if (!user || (!canManageOps && !isRoot)) {
    return (
      <div className="py-16 text-center max-w-md mx-auto space-y-4">
        <div className="text-4xl">🚫</div>
        <h2 className="text-xl font-extrabold text-red-600">Access Denied</h2>
        <p className="text-sm text-muted-foreground">
          You do not have administrative privileges to access the operation dashboard.
        </p>
      </div>
    );
  }

  // Admin user CRUD actions (Root only)
  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminEmail || !adminPassword || !adminName) return;
    setCreatingAdmin(true);

    try {
      await dataService.createAdminUser({
        email: adminEmail,
        password: adminPassword,
        displayName: adminName,
        phoneNumber: adminPhone
      });

      // Log Action
      await dataService.logAction(
        tenantId!,
        user.uid,
        user.displayName || 'Root',
        'ADMIN_CREATE',
        `Created Admin user: ${adminName} (${adminEmail})`
      );

      // Refresh list
      const admins = await dataService.getAdminUsers();
      setAdminsList(admins);

      const logs = await dataService.getAuditLogs(tenantId!);
      setAuditLogs(logs);

      // Reset Form
      setAdminEmail('');
      setAdminPassword('');
      setAdminName('');
      setAdminPhone('');
      alert('Admin account created successfully.');
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to create Admin account.');
    } finally {
      setCreatingAdmin(false);
    }
  };

  const handleToggleAdminStatus = async (targetUid: string, currentDisabled: boolean) => {
    if (!confirm(`Are you sure you want to ${currentDisabled ? 'enable' : 'disable'} this Admin account?`)) return;

    try {
      await dataService.toggleAdminUserStatus(targetUid, !currentDisabled);
      
      const targetAdmin = adminsList.find(a => a.uid === targetUid);

      await dataService.logAction(
        tenantId!,
        user.uid,
        user.displayName || 'Root',
        currentDisabled ? 'ADMIN_ENABLE' : 'ADMIN_DISABLE',
        `${currentDisabled ? 'Enabled' : 'Disabled'} Admin account for ${targetAdmin?.displayName || 'N/A'}`
      );

      const admins = await dataService.getAdminUsers();
      setAdminsList(admins);
      alert('Admin status updated successfully.');
    } catch (err: any) {
      console.error(err);
      alert('Failed to update status.');
    }
  };

  const handleDeleteAdmin = async (targetUid: string) => {
    if (!confirm('Are you sure you want to delete this Admin account? This action is permanent.')) return;

    try {
      await dataService.deleteAdminUser(targetUid);
      
      const targetAdmin = adminsList.find(a => a.uid === targetUid);

      await dataService.logAction(
        tenantId!,
        user.uid,
        user.displayName || 'Root',
        'ADMIN_DELETE',
        `Deleted Admin account for ${targetAdmin?.displayName || 'N/A'}`
      );

      const admins = await dataService.getAdminUsers();
      setAdminsList(admins);
      alert('Admin account deleted successfully.');
    } catch (err: any) {
      console.error(err);
      alert('Failed to delete Admin account.');
    }
  };

  const handleResetAdminPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resettingPasswordAdmin || newAdminPassword.length < 6) return;

    try {
      await dataService.resetAdminUserPassword(resettingPasswordAdmin.uid, newAdminPassword, resettingPasswordAdmin.email);

      await dataService.logAction(
        tenantId!,
        user.uid,
        user.displayName || 'Root',
        'ADMIN_PASSWORD_RESET',
        `Reset password and forced update for Admin: ${resettingPasswordAdmin.displayName}`
      );

      setResettingPasswordAdmin(null);
      setNewAdminPassword('');
      alert('Password reset link sent to admin email successfully.');
    } catch (err: any) {
      console.error(err);
      alert('Failed to send reset link.');
    }
  };

  // Shop action triggers
  const handleApproveMembership = async (membId: string, applicantName: string) => {
    if (!tenantId || !user) return;
    const targetMemb = members.find(m => m.id === membId);
    if (!targetMemb) return;

    const updatedMemb = { ...targetMemb, status: 'approved' };

    try {
      await dataService.createOrUpdateMembership(updatedMemb);
      await dataService.logAction(
        tenantId, 
        user.uid, 
        user.displayName || 'Admin', 
        'SHOP_APPROVE', 
        `Approved shop registry for ${applicantName} (${targetMemb.shopName})`
      );

      // Trigger user notification
      await dataService.createNotification({
        associationId: tenantId,
        recipientId: targetMemb.userId,
        title: `🏪 Shop Approved!`,
        body: `Congratulations! Your shop "${targetMemb.shopName}" has been approved and is now active on our directory portal.`,
        read: false,
        link: '/dashboard',
        type: 'shop_status',
        createdAt: new Date().toISOString()
      });
      
      const refreshedMembList = await dataService.getMemberships(tenantId);
      const refreshedLogs = await dataService.getAuditLogs(tenantId);
      setMembers(refreshedMembList);
      setAuditLogs(refreshedLogs);
      alert('Shop approved successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to approve shop');
    }
  };

  const handleOpenFeedbackModal = (shop: any, type: 'rejected' | 'needs_changes' | 'suspended') => {
    setSelectedShop(shop);
    setActionType(type);
    setFeedbackReason('');
    setIsFeedbackOpen(true);
  };

  const handleShopAction = async (membId: string, type: 'approved' | 'rejected' | 'needs_changes' | 'suspended', reason?: string) => {
    if (!tenantId || !user) return;
    const targetMemb = members.find(m => m.id === membId);
    if (!targetMemb) return;

    const updatedMemb = { 
      ...targetMemb, 
      status: type,
      rejectionReason: type === 'rejected' ? reason : targetMemb.rejectionReason || '',
      needsChangesReason: type === 'needs_changes' ? reason : targetMemb.needsChangesReason || '',
      suspensionReason: type === 'suspended' ? reason : targetMemb.suspensionReason || ''
    };

    try {
      await dataService.createOrUpdateMembership(updatedMemb);
      
      // Log Action
      await dataService.logAction(
        tenantId, 
        user.uid, 
        user.displayName || 'Admin', 
        `SHOP_${type.toUpperCase()}`, 
        `${type.toUpperCase()} shop "${targetMemb.shopName}" owned by ${targetMemb.ownerName}. Reason: ${reason || 'N/A'}`
      );

      // Trigger user notification
      await dataService.createNotification({
        associationId: tenantId,
        recipientId: targetMemb.userId,
        title: `🏪 Shop Status Updated: ${type.toUpperCase()}`,
        body: `Your shop "${targetMemb.shopName}" status is now "${type}"${reason ? `. Feedback: ${reason}` : ''}`,
        read: false,
        link: '/dashboard',
        type: 'shop_status',
        createdAt: new Date().toISOString()
      });

      // Reload lists
      const refreshedMembList = await dataService.getMemberships(tenantId);
      const refreshedLogs = await dataService.getAuditLogs(tenantId);
      setMembers(refreshedMembList);
      setAuditLogs(refreshedLogs);
      
      setIsFeedbackOpen(false);
      setFeedbackReason('');
      setSelectedShop(null);
      alert(`Shop ${type} successfully.`);
    } catch (err) {
      console.error(err);
      alert('Action failed.');
    }
  };

  const handleUpdateBranding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId || !user || !activeAssociation) return;

    const updatedAssoc = {
      ...activeAssociation,
      name: assocName,
      contactPhone: assocPhone,
      contactEmail: assocEmail,
      logoUrl: assocLogo,
      primaryColor,
      secondaryColor
    };

    try {
      await dataService.createAssociation(updatedAssoc);
      await dataService.logAction(
        tenantId, 
        user.uid, 
        user.displayName || 'Admin', 
        'BRANDING_UPDATE', 
        `Updated association settings and styling config`
      );
      
      alert('Association branding updated! Changes will apply immediately.');
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert('Failed to update branding settings');
    }
  };

  // Executive Committee Handlers
  const handleCreateCommitteeMemberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId || !newMemberName || !newMemberDesignation) return;
    setSubmittingMember(true);
    try {
      const newMemb = {
        associationId: tenantId,
        name: newMemberName,
        designation: newMemberDesignation,
        shopName: newMemberShop || '',
        image: newMemberImage || ''
      };
      await dataService.createCommitteeMember(newMemb);
      await dataService.logAction(
        tenantId,
        user.uid,
        user.displayName || 'Admin',
        'COMMITTEE_MEMBER_ADD',
        `Added committee member: ${newMemberName} (${newMemberDesignation})`
      );

      // Refresh list
      const list = await dataService.getExecutiveCommittee(tenantId);
      setCommitteeMembers(list);

      // Reset form
      setNewMemberName('');
      setNewMemberDesignation('');
      setNewMemberShop('');
      setNewMemberImage('');
      alert('Committee member added successfully!');
    } catch (err: any) {
      console.error(err);
      alert('Failed to add committee member.');
    } finally {
      setSubmittingMember(false);
    }
  };

  const handleDeleteCommitteeMemberClick = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove "${name}" from the Executive Committee?`)) return;
    try {
      await dataService.deleteCommitteeMember(id);
      await dataService.logAction(
        tenantId!,
        user.uid,
        user.displayName || 'Admin',
        'COMMITTEE_MEMBER_DELETE',
        `Removed committee member: ${name}`
      );

      // Refresh list
      const list = await dataService.getExecutiveCommittee(tenantId!);
      setCommitteeMembers(list);
      alert('Committee member removed.');
    } catch (err: any) {
      console.error(err);
      alert('Failed to delete committee member.');
    }
  };

  // Slideshow Carousel Handlers
  const handleAddCarouselImageSubmit = async (imageBase64: string) => {
    if (!tenantId) return;
    if (carouselImages.length >= 10) {
      alert('Maximum limit of 10 slideshow images reached. Please delete an image first.');
      return;
    }
    setUploadingSlide(true);
    try {
      await dataService.addCarouselImage(tenantId, imageBase64, carouselCaption);
      await dataService.logAction(
        tenantId,
        user.uid,
        user.displayName || 'Admin',
        'CAROUSEL_IMAGE_ADD',
        `Added a new slideshow carousel slide`
      );

      // Refresh list
      const list = await dataService.getCarouselImages(tenantId);
      setCarouselImages(list);
      setCarouselCaption('');
      alert('Slideshow image added successfully!');
    } catch (err: any) {
      console.error(err);
      alert('Failed to add slideshow image.');
    } finally {
      setUploadingSlide(false);
    }
  };

  const handleDeleteCarouselImageClick = async (id: string) => {
    if (!confirm('Are you sure you want to delete this slideshow image?')) return;
    try {
      await dataService.deleteCarouselImage(id);
      await dataService.logAction(
        tenantId!,
        user.uid,
        user.displayName || 'Admin',
        'CAROUSEL_IMAGE_DELETE',
        `Deleted a slideshow carousel slide`
      );

      // Refresh list
      const list = await dataService.getCarouselImages(tenantId!);
      setCarouselImages(list);
      alert('Slideshow image deleted.');
    } catch (err: any) {
      console.error(err);
      alert('Failed to delete slideshow image.');
    }
  };

  // Testimonials Handlers
  const handleCreateTestimonialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId || !newTestiQuote || !newTestiAuthor) return;
    setSubmittingTesti(true);
    try {
      const newTesti = {
        associationId: tenantId,
        quote: newTestiQuote,
        authorName: newTestiAuthor,
        authorSubtitle: newTestiSubtitle || ''
      };
      await dataService.createTestimonial(newTesti);
      await dataService.logAction(
        tenantId,
        user.uid,
        user.displayName || 'Admin',
        'TESTIMONIAL_ADD',
        `Added testimonial by: ${newTestiAuthor}`
      );

      // Refresh list
      const list = await dataService.getTestimonials(tenantId);
      setTestimonialsList(list);

      // Reset form
      setNewTestiQuote('');
      setNewTestiAuthor('');
      setNewTestiSubtitle('');
      alert('Testimonial added successfully!');
    } catch (err: any) {
      console.error(err);
      alert('Failed to add testimonial.');
    } finally {
      setSubmittingTesti(false);
    }
  };

  const handleDeleteTestimonialClick = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete the testimonial from "${name}"?`)) return;
    try {
      await dataService.deleteTestimonial(id);
      await dataService.logAction(
        tenantId!,
        user.uid,
        user.displayName || 'Admin',
        'TESTIMONIAL_DELETE',
        `Deleted testimonial from: ${name}`
      );

      // Refresh list
      const list = await dataService.getTestimonials(tenantId!);
      setTestimonialsList(list);
      alert('Testimonial deleted.');
    } catch (err: any) {
      console.error(err);
      alert('Failed to delete testimonial.');
    }
  };

  const filteredShops = members.filter(m => {
    if (shopFilter === 'all') return true;
    return m.status === shopFilter;
  });

  const pendingCount = members.filter(m => m.status === 'pending').length;

  if (loading) {
    return <div className="text-center py-12">{t('loading')}</div>;
  }

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight">{t('admin')}</h1>
          <p className="text-muted-foreground text-sm">
            Manage members, register traders, assign system theme palettes, and audit security events.
          </p>
        </div>
        <Badge className="font-extrabold text-xs py-1 px-3" variant="outline">
          ⚙️ Role: {role.toUpperCase()}
        </Badge>
      </div>

      {/* Tabs Menu */}
      <div className="flex gap-1.5 border-b pb-2 overflow-x-auto">
        {canManageOps && (
          <>
            <button
              onClick={() => setActiveTab('membership')}
              className={`px-4 py-2 font-bold text-xs whitespace-nowrap uppercase border-b-2 transition-all ${
                activeTab === 'membership' 
                  ? 'border-primary text-primary' 
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              🏪 Shop Approvals ({pendingCount})
            </button>
            <button
              onClick={() => setActiveTab('branding')}
              className={`px-4 py-2 font-bold text-xs whitespace-nowrap uppercase border-b-2 transition-all ${
                activeTab === 'branding' 
                  ? 'border-primary text-primary' 
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              🎨 Theme Branding
            </button>
            <button
              onClick={() => setActiveTab('committee')}
              className={`px-4 py-2 font-bold text-xs whitespace-nowrap uppercase border-b-2 transition-all ${
                activeTab === 'committee' 
                  ? 'border-primary text-primary' 
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              👤 Committee Board ({committeeMembers.length})
            </button>
            <button
              onClick={() => setActiveTab('carousel')}
              className={`px-4 py-2 font-bold text-xs whitespace-nowrap uppercase border-b-2 transition-all ${
                activeTab === 'carousel' 
                  ? 'border-primary text-primary' 
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              🖼️ Carousel Slides ({carouselImages.length}/10)
            </button>
            <button
              onClick={() => setActiveTab('testimonials')}
              className={`px-4 py-2 font-bold text-xs whitespace-nowrap uppercase border-b-2 transition-all ${
                activeTab === 'testimonials' 
                  ? 'border-primary text-primary' 
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              💬 Testimonials ({testimonialsList.length})
            </button>
          </>
        )}
        {isRoot && (
          <>
            <button
              onClick={() => setActiveTab('admins')}
              className={`px-4 py-2 font-bold text-xs whitespace-nowrap uppercase border-b-2 transition-all ${
                activeTab === 'admins' 
                  ? 'border-primary text-primary' 
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              🛡️ Admin Management ({adminsList.length})
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`px-4 py-2 font-bold text-xs whitespace-nowrap uppercase border-b-2 transition-all ${
                activeTab === 'logs' 
                  ? 'border-primary text-primary' 
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              📂 Audit logs
            </button>
          </>
        )}
      </div>

      {/* Tabs Content */}
      <div className="space-y-6">
        
        {/* 1. SHOP REGISTRY APPROVALS */}
        {activeTab === 'membership' && canManageOps && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <h3 className="text-lg font-extrabold text-foreground">Registered Trader Shops</h3>
              <div className="flex items-center gap-2">
                <Label className="text-xs whitespace-nowrap">Filter Status:</Label>
                <select 
                  value={shopFilter} 
                  onChange={e => setShopFilter(e.target.value as any)}
                  className="bg-card border rounded p-1.5 text-xs font-bold text-foreground"
                >
                  <option value="pending">Pending ({pendingCount})</option>
                  <option value="approved">Approved</option>
                  <option value="needs_changes">Needs Changes</option>
                  <option value="suspended">Suspended</option>
                  <option value="all">All registered</option>
                </select>
              </div>
            </div>
            
            {filteredShops.map((memb) => (
              <Card key={memb.id} className="border-l-4 border-l-primary">
                <CardContent className="p-6 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-extrabold text-base">{memb.shopName}</h4>
                      <Badge variant="secondary">{memb.category}</Badge>
                      <Badge 
                        variant={
                          memb.status === 'approved' ? 'success' : 
                          memb.status === 'pending' ? 'outline' : 
                          memb.status === 'needs_changes' ? 'outline' : 'destructive'
                        }
                      >
                        {memb.status.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Owner: <strong>{memb.ownerName}</strong> ({memb.phone}) • {memb.email}
                    </p>
                    <p className="text-xs text-muted-foreground">Location: {memb.address}</p>
                    
                    {memb.businessDescription && (
                      <p className="text-xs text-muted-foreground/80 bg-muted/40 p-2 rounded-lg border font-medium mt-1 leading-relaxed">
                        {memb.businessDescription}
                      </p>
                    )}

                    {memb.needsChangesReason && memb.status === 'needs_changes' && (
                      <div className="bg-amber-500/10 border border-amber-500/20 text-amber-700 text-xs p-2.5 rounded-lg">
                        <strong>Requested Feedback:</strong> {memb.needsChangesReason}
                      </div>
                    )}
                    {memb.rejectionReason && memb.status === 'rejected' && (
                      <div className="bg-red-500/10 border border-red-500/20 text-red-700 text-xs p-2.5 rounded-lg">
                        <strong>Rejection Reason:</strong> {memb.rejectionReason}
                      </div>
                    )}
                    {memb.suspensionReason && memb.status === 'suspended' && (
                      <div className="bg-red-500/10 border border-red-500/20 text-red-700 text-xs p-2.5 rounded-lg">
                        <strong>Suspension Reason:</strong> {memb.suspensionReason}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap gap-2 w-full lg:w-auto shrink-0 border-t lg:border-t-0 pt-4 lg:pt-0">
                    {(memb.status === 'pending' || memb.status === 'needs_changes' || memb.status === 'suspended') && (
                      <Button 
                        onClick={() => handleApproveMembership(memb.id, memb.ownerName)}
                        className="flex-1 lg:flex-initial font-bold bg-emerald-500 hover:bg-emerald-600 text-white shadow-md text-xs py-1.5 px-3"
                      >
                        ✓ Approve
                      </Button>
                    )}
                    {memb.status === 'pending' && (
                      <Button 
                        onClick={() => handleOpenFeedbackModal(memb, 'needs_changes')}
                        variant="outline"
                        className="flex-1 lg:flex-initial font-bold text-amber-600 border-amber-500/20 hover:bg-amber-500/10 text-xs py-1.5 px-3"
                      >
                        ⚠️ Request Changes
                      </Button>
                    )}
                    {(memb.status === 'pending' || memb.status === 'needs_changes') && (
                      <Button 
                        onClick={() => handleOpenFeedbackModal(memb, 'rejected')}
                        className="flex-1 lg:flex-initial font-bold bg-red-500 hover:bg-red-600 text-white text-xs py-1.5 px-3"
                      >
                        ✕ Reject
                      </Button>
                    )}
                    {memb.status === 'approved' && (
                      <Button 
                        onClick={() => handleOpenFeedbackModal(memb, 'suspended')}
                        className="flex-1 lg:flex-initial font-bold bg-zinc-600 hover:bg-zinc-700 text-white text-xs py-1.5 px-3"
                      >
                        ⏸ Suspend Shop
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}

            {filteredShops.length === 0 && (
              <div className="py-12 text-center text-muted-foreground border border-dashed rounded-xl">
                No registered shops match this status filter.
              </div>
            )}
          </div>
        )}

        {/* 2. BRANDING DESIGN TOOL */}
        {activeTab === 'branding' && canManageOps && (
          <Card className="max-w-2xl shadow-lg border-primary/10">
            <CardHeader>
              <CardTitle>🎨 Theme & Branding Workshop</CardTitle>
              <CardDescription>Adjust variables. Saving will instantly update colors and styles globally for this Vyapar Mandal.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateBranding} className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Association Name</Label>
                  <Input required value={assocName} onChange={e => setAssocName(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Contact Phone</Label>
                    <Input required value={assocPhone} onChange={e => setAssocPhone(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Contact Email</Label>
                    <Input required type="email" value={assocEmail} onChange={e => setAssocEmail(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Logo Image URL</Label>
                  <Input required value={assocLogo} onChange={e => setAssocLogo(e.target.value)} />
                </div>
                
                <div className="grid grid-cols-2 gap-4 border-t pt-4">
                  <div className="space-y-1.5">
                    <Label>Primary Theme Color</Label>
                    <div className="flex gap-2">
                      <Input 
                        type="color" 
                        value={primaryColor} 
                        onChange={e => setPrimaryColor(e.target.value)}
                        className="w-12 h-10 p-1 cursor-pointer shrink-0"
                      />
                      <Input 
                        value={primaryColor} 
                        onChange={e => setPrimaryColor(e.target.value)}
                        className="font-mono text-xs uppercase"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Secondary Theme Color</Label>
                    <div className="flex gap-2">
                      <Input 
                        type="color" 
                        value={secondaryColor} 
                        onChange={e => setSecondaryColor(e.target.value)}
                        className="w-12 h-10 p-1 cursor-pointer shrink-0"
                      />
                      <Input 
                        value={secondaryColor} 
                        onChange={e => setSecondaryColor(e.target.value)}
                        className="font-mono text-xs uppercase"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <Button type="submit" className="w-full font-bold shadow-lg shadow-primary/10">
                    💾 Save Branding Configuration
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* 3. ROOT ONLY ADMIN ACCOUNTS MANAGER */}
        {activeTab === 'admins' && isRoot && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            
            {/* Create Admin Form */}
            <Card className="xl:col-span-1 border border-primary/20 shadow">
              <CardHeader>
                <CardTitle>➕ Create Admin Account</CardTitle>
                <CardDescription>
                  Register a new Administrator who can manage all trader shops, announcements, events, and complaints.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateAdmin} className="space-y-3.5">
                  <div className="space-y-1">
                    <Label>Full Name</Label>
                    <Input 
                      required 
                      placeholder="e.g. Secretary Mohan" 
                      value={adminName} 
                      onChange={e => setAdminName(e.target.value)} 
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Email ID</Label>
                    <Input 
                      required 
                      type="email" 
                      placeholder="e.g. mohan@vyapar.org" 
                      value={adminEmail} 
                      onChange={e => setAdminEmail(e.target.value)} 
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Mobile Number</Label>
                    <Input 
                      placeholder="+91 98765 43210" 
                      value={adminPhone} 
                      onChange={e => setAdminPhone(e.target.value)} 
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Temp Password</Label>
                    <Input 
                      required 
                      type="password" 
                      placeholder="Min 6 characters" 
                      value={adminPassword} 
                      onChange={e => setAdminPassword(e.target.value)} 
                    />
                  </div>
                  <Button 
                    type="submit" 
                    disabled={creatingAdmin}
                    className="w-full font-bold shadow bg-primary hover:bg-primary/95 mt-2"
                  >
                    {creatingAdmin ? 'Provisioning Auth Account...' : '⚡ Create Admin User'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Admins Table list */}
            <Card className="xl:col-span-2 shadow">
              <CardHeader>
                <CardTitle>🛡️ Active Administrative Staff</CardTitle>
                <CardDescription>List of accounts with operational manager permissions.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-muted border-y text-muted-foreground font-black uppercase text-[10px]">
                        <th className="p-4">Staff Details</th>
                        <th className="p-4">Contact Info</th>
                        <th className="p-4">Account Status</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y font-semibold text-muted-foreground">
                      {adminsList.map((admin) => (
                        <tr key={admin.uid} className="hover:bg-muted/30">
                          <td className="p-4">
                            <div className="font-bold text-foreground text-sm">{admin.displayName}</div>
                            <div className="text-[10px] text-muted-foreground font-mono">{admin.uid}</div>
                          </td>
                          <td className="p-4">
                            <div>{admin.email}</div>
                            <div className="text-[10px] text-muted-foreground font-normal">{admin.phoneNumber || 'No phone'}</div>
                          </td>
                          <td className="p-4">
                            <Badge variant={admin.disabled ? 'destructive' : 'success'}>
                              {admin.disabled ? 'Disabled' : 'Active'}
                            </Badge>
                            {admin.needsPasswordChange && (
                              <div className="text-[9px] text-amber-600 mt-1 font-bold">⚠️ Needs Reset</div>
                            )}
                          </td>
                          <td className="p-4 text-right space-x-1.5 whitespace-nowrap">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => handleToggleAdminStatus(admin.uid, !!admin.disabled)}
                              className="text-[10px] py-1 px-2 font-bold"
                            >
                              {admin.disabled ? 'Enable' : 'Disable'}
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => setResettingPasswordAdmin(admin)}
                              className="text-[10px] py-1 px-2 font-bold text-amber-600 border-amber-500/20"
                            >
                              Reset Pass
                            </Button>
                            <Button 
                              size="sm" 
                              onClick={() => handleDeleteAdmin(admin.uid)}
                              className="text-[10px] py-1 px-2 font-bold bg-red-500 hover:bg-red-600 text-white"
                            >
                              Delete
                            </Button>
                          </td>
                        </tr>
                      ))}

                      {adminsList.length === 0 && (
                        <tr>
                          <td colSpan={4} className="p-8 text-center text-muted-foreground">
                            No Admin user accounts loaded. Use the left form to provision one.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 4. AUDIT EVENT LOGS (Root only) */}
        {activeTab === 'logs' && isRoot && (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>📂 Audit Security Event logs</CardTitle>
              <CardDescription>System registry recording of key administrative and credential actions.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-muted border-y text-muted-foreground font-black uppercase tracking-wider text-[10px]">
                      <th className="p-4">Timestamp</th>
                      <th className="p-4">User</th>
                      <th className="p-4">Action Event</th>
                      <th className="p-4">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y font-semibold text-muted-foreground">
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-muted/30">
                        <td className="p-4 font-mono text-[10px] whitespace-nowrap">{new Date(log.timestamp).toLocaleString()}</td>
                        <td className="p-4 text-foreground font-bold">{log.userName || log.actorName || 'System'}</td>
                        <td className="p-4">
                          <span className="bg-zinc-500/10 text-zinc-500 border px-1.5 py-0.5 rounded font-mono text-[9px] font-black uppercase">
                            {log.action}
                          </span>
                        </td>
                        <td className="p-4 text-foreground font-medium">{log.details}</td>
                      </tr>
                    ))}

                    {auditLogs.length === 0 && (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-muted-foreground">
                          No audit event logs generated yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 2.5 EXECUTIVE COMMITTEE MANAGEMENT */}
        {activeTab === 'committee' && canManageOps && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-3 gap-6">
              
              {/* Add Member form */}
              <Card className="bg-card">
                <CardHeader>
                  <CardTitle className="text-sm font-bold">👤 Add Executive Member</CardTitle>
                  <CardDescription className="text-[10px]">Add designated members/chairman profiles.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreateCommitteeMemberSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                      <Label>Full Name</Label>
                      <Input 
                        required
                        placeholder="e.g. Mohan Lal"
                        value={newMemberName}
                        onChange={e => setNewMemberName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Designation / Role</Label>
                      <Input 
                        required
                        placeholder="e.g. Chairman / General Secretary"
                        value={newMemberDesignation}
                        onChange={e => setNewMemberDesignation(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Shop Name (Optional)</Label>
                      <Input 
                        placeholder="e.g. Mohan Saree Kendra"
                        value={newMemberShop}
                        onChange={e => setNewMemberShop(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Profile Picture</Label>
                      <div className="flex gap-3 items-center">
                        <input 
                          type="file" 
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = async () => {
                                try {
                                  const compressed = await compressImage(reader.result as string, 400, 400, 0.7);
                                  setNewMemberImage(compressed);
                                } catch (err) {
                                  console.error(err);
                                  setNewMemberImage(reader.result as string);
                                }
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="hidden" 
                          id="committee-photo-upload"
                        />
                        <label 
                          htmlFor="committee-photo-upload"
                          className="px-3 py-2 border rounded-xl hover:bg-muted text-[10px] font-bold cursor-pointer transition-colors bg-background"
                        >
                          📸 Choose Image
                        </label>
                        {newMemberImage ? (
                          <div className="relative w-12 h-12 rounded-full overflow-hidden border">
                            <img src={newMemberImage} alt="Preview" className="w-full h-full object-cover" />
                            <button 
                              type="button" 
                              onClick={() => setNewMemberImage('')}
                              className="absolute top-0.5 right-0.5 bg-black/70 text-white rounded-full w-4 h-4 flex items-center justify-center text-[8px]"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded-full border flex items-center justify-center bg-muted/30 text-[9px] font-bold text-center">
                            Logo
                          </div>
                        )}
                      </div>
                    </div>
                    <Button type="submit" className="w-full font-bold bg-primary hover:bg-primary/95 text-white" disabled={submittingMember}>
                      {submittingMember ? 'Adding...' : '✓ Add to Committee'}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Members List */}
              <div className="md:col-span-2 space-y-3">
                <h3 className="text-base font-extrabold text-foreground">Current Committee Members (Up to 5 displayed on main page)</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  {committeeMembers.map(member => (
                    <Card key={member.id} className="bg-card hover:shadow-sm border">
                      <CardContent className="p-4 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <img 
                            src={member.image || '/logo.png'} 
                            alt={member.name}
                            className="w-12 h-12 rounded-full object-cover border bg-muted"
                          />
                          <div>
                            <h4 className="font-extrabold text-xs text-foreground">{member.name}</h4>
                            <span className="text-[9px] font-black text-primary uppercase block mt-0.5">{member.designation}</span>
                            {member.shopName && <span className="text-[9px] text-muted-foreground block truncate">{member.shopName}</span>}
                          </div>
                        </div>
                        <Button 
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteCommitteeMemberClick(member.id, member.name)}
                          className="text-red-500 hover:text-red-600 border-red-100 hover:bg-red-50 text-[10px] py-1 px-2.5 rounded-lg"
                        >
                          Delete
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                  {committeeMembers.length === 0 && (
                    <p className="text-xs text-muted-foreground italic col-span-full text-center py-8">
                      No committee member profiles registered yet.
                    </p>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* 2.6 HOMEPAGE CAROUSEL MANAGEMENT */}
        {activeTab === 'carousel' && canManageOps && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-3 gap-6">
              
              {/* Add carousel item card */}
              <Card className="bg-card">
                <CardHeader>
                  <CardTitle className="text-sm font-bold">🖼️ Upload Carousel Slide</CardTitle>
                  <CardDescription className="text-[10px]">Add images to display in homepage top scroll (up to 10 max).</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <Label>Short Caption (Optional)</Label>
                    <Input 
                      placeholder="e.g. Core Committee Meet"
                      value={carouselCaption}
                      onChange={e => setCarouselCaption(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Slide Image File</Label>
                    <div className="flex flex-col gap-2">
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = async () => {
                              try {
                                const compressed = await compressImage(reader.result as string, 1000, 750, 0.75);
                                handleAddCarouselImageSubmit(compressed);
                              } catch (err) {
                                console.error('Image compression failed:', err);
                                handleAddCarouselImageSubmit(reader.result as string);
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        disabled={carouselImages.length >= 10 || uploadingSlide}
                        className="text-xs border rounded p-2 bg-background w-full"
                      />
                      <span className="text-[9px] text-muted-foreground italic">
                        Files will be optimized and saved locally/in Firestore.
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Carousel Slides List */}
              <div className="md:col-span-2 space-y-3">
                <h3 className="text-base font-extrabold text-foreground">Slideshow Slides ({carouselImages.length}/10)</h3>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {carouselImages.map(slide => (
                    <Card key={slide.id} className="overflow-hidden border bg-card flex flex-col justify-between">
                      <div className="w-full h-24 bg-muted relative overflow-hidden flex items-center justify-center border-b">
                        <img 
                          src={slide.imageUrl} 
                          alt={slide.caption}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="p-3 space-y-2">
                        <p className="text-[10px] font-bold text-foreground line-clamp-1">{slide.caption}</p>
                        <Button 
                          type="button"
                          variant="outline"
                          onClick={() => handleDeleteCarouselImageClick(slide.id)}
                          className="w-full text-red-500 hover:text-red-600 hover:bg-red-50 text-[10px] py-1"
                        >
                          ✕ Delete Slide
                        </Button>
                      </div>
                    </Card>
                  ))}
                  {carouselImages.length === 0 && (
                    <p className="text-xs text-muted-foreground italic col-span-full text-center py-8">
                      No carousel slideshow images uploaded yet. Default logo/banner will be shown.
                    </p>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* 2.7 MERCHANTS TESTIMONIALS MANAGEMENT */}
        {activeTab === 'testimonials' && canManageOps && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-3 gap-6">
              
              {/* Add testimonial form */}
              <Card className="bg-card">
                <CardHeader>
                  <CardTitle className="text-sm font-bold">💬 Add Merchant Testimonial</CardTitle>
                  <CardDescription className="text-[10px]">Add quote/feedback from active members.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreateTestimonialSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                      <Label>Testimonial Quote Text</Label>
                      <textarea 
                        required
                        placeholder="e.g. The digital membership card is fantastic..."
                        value={newTestiQuote}
                        onChange={e => setNewTestiQuote(e.target.value)}
                        rows={3}
                        className="w-full bg-card border rounded p-2 text-sm text-foreground focus:ring-1 focus:ring-primary outline-none font-semibold"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Author Merchant Name</Label>
                      <Input 
                        required
                        placeholder="e.g. Ramesh Kumar"
                        value={newTestiAuthor}
                        onChange={e => setNewTestiAuthor(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Shop / Subtitle Details</Label>
                      <Input 
                        placeholder="e.g. Owner, Balaji Textiles"
                        value={newTestiSubtitle}
                        onChange={e => setNewTestiSubtitle(e.target.value)}
                      />
                    </div>
                    <Button type="submit" className="w-full font-bold bg-primary hover:bg-primary/95 text-white" disabled={submittingTesti}>
                      {submittingTesti ? 'Adding...' : '✓ Add Testimonial'}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Testimonials List */}
              <div className="md:col-span-2 space-y-3">
                <h3 className="text-base font-extrabold text-foreground">Current Testimonials</h3>
                <div className="space-y-3">
                  {testimonialsList.map(testi => (
                    <Card key={testi.id} className="bg-card border p-4 flex justify-between items-start gap-4">
                      <div className="space-y-1.5 flex-1">
                        <p className="text-xs text-muted-foreground italic">"{testi.quote}"</p>
                        <div className="text-[10px] font-bold text-foreground">
                          {testi.authorName} <span className="text-muted-foreground font-normal">({testi.authorSubtitle})</span>
                        </div>
                      </div>
                      <Button 
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteTestimonialClick(testi.id, testi.authorName)}
                        className="text-red-500 hover:text-red-600 border-red-100 hover:bg-red-50 text-[10px] py-1 px-2.5 rounded-lg shrink-0"
                      >
                        Delete
                      </Button>
                    </Card>
                  ))}
                  {testimonialsList.length === 0 && (
                    <p className="text-xs text-muted-foreground italic text-center py-8">
                      No merchant testimonials loaded yet.
                    </p>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

      </div>

      {/* FEEDBACK MODAL DIALOG */}
      {isFeedbackOpen && selectedShop && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <Card className="w-full max-w-md shadow-2xl bg-card border border-primary/20 animate-in fade-in zoom-in-95 duration-150">
            <CardHeader>
              <CardTitle className="capitalize text-lg font-black">
                {actionType === 'needs_changes' ? 'Request Shop Changes' : `${actionType?.slice(0, -1)} Shop`}
              </CardTitle>
              <CardDescription>
                Provide detailed feedback/reason for the shop "{selectedShop.shopName}". This will be visible to the shop owner.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Feedback Reason</Label>
                <textarea 
                  required
                  placeholder="e.g. GST document is blurry / business address needs verification"
                  value={feedbackReason}
                  onChange={e => setFeedbackReason(e.target.value)}
                  rows={3}
                  className="w-full bg-card border rounded p-2 text-sm text-foreground focus:ring-1 focus:ring-primary outline-none"
                />
              </div>
              <div className="flex gap-2 justify-end border-t pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsFeedbackOpen(false);
                    setSelectedShop(null);
                    setFeedbackReason('');
                  }}
                  className="font-bold"
                >
                  Cancel
                </Button>
                <Button 
                  type="button" 
                  className="bg-primary hover:bg-primary/95 text-white font-bold"
                  disabled={!feedbackReason.trim()}
                  onClick={() => handleShopAction(selectedShop.id, actionType!, feedbackReason)}
                >
                  Confirm Submit
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ADMIN RESET PASSWORD MODAL DIALOG */}
      {resettingPasswordAdmin && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <Card className="w-full max-w-md shadow-2xl bg-card border border-primary/20 animate-in fade-in zoom-in-95 duration-150">
            <CardHeader>
              <CardTitle className="text-lg font-black">🔑 Reset Admin Password</CardTitle>
              <CardDescription>
                Enter a new password for Admin "{resettingPasswordAdmin.displayName}". They will be forced to change it on their next login.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleResetAdminPasswordSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label>New Temporary Password</Label>
                  <Input 
                    required
                    type="password"
                    placeholder="Minimum 6 characters"
                    value={newAdminPassword}
                    onChange={e => setNewAdminPassword(e.target.value)}
                  />
                </div>
                <div className="flex gap-2 justify-end border-t pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setResettingPasswordAdmin(null);
                      setNewAdminPassword('');
                    }}
                    className="font-bold"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    className="bg-primary hover:bg-primary/95 text-white font-bold"
                    disabled={newAdminPassword.length < 6}
                  >
                    Reset Password
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

    </div>
  );
};
