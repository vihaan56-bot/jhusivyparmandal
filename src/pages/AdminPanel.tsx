import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTenant } from '../context/TenantContext';
import { useLanguage } from '../context/LanguageContext';
import { dataService } from '../services/dataService';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, Input, Label, Select, Badge } from '../components/ui/CustomUI';

export const AdminPanel: React.FC = () => {
  const { user, membership } = useAuth();
  const { tenantId, activeAssociation } = useTenant();
  const { t } = useLanguage();

  const [members, setMembers] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'membership' | 'branding' | 'logs'>('membership');

  // Branding Editor Form State
  const [assocName, setAssocName] = useState(activeAssociation?.name || '');
  const [assocPhone, setAssocPhone] = useState(activeAssociation?.contactPhone || '');
  const [assocEmail, setAssocEmail] = useState(activeAssociation?.contactEmail || '');
  const [assocLogo, setAssocLogo] = useState(activeAssociation?.logoUrl || '');
  const [primaryColor, setPrimaryColor] = useState(activeAssociation?.primaryColor || '#0284c7');
  const [secondaryColor, setSecondaryColor] = useState(activeAssociation?.secondaryColor || '#f59e0b');

  useEffect(() => {
    if (!tenantId) return;
    setLoading(true);

    Promise.all([
      dataService.getMemberships(tenantId),
      dataService.getAuditLogs(tenantId)
    ]).then(([membersList, logs]) => {
      setMembers(membersList);
      setAuditLogs(logs);
    }).finally(() => {
      setLoading(false);
    });
  }, [tenantId]);

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

  const handleApproveMembership = async (membId: string, applicantName: string) => {
    if (!tenantId || !user) return;
    const targetMemb = members.find(m => m.id === membId);
    if (!targetMemb) return;

    const updatedMemb = { ...targetMemb, status: 'active' };

    try {
      await dataService.createOrUpdateMembership(updatedMemb);
      await dataService.logAction(tenantId, user.uid, user.displayName || 'Admin', 'MEMBERSHIP_APPROVE', `Approved membership for ${applicantName} (${targetMemb.shopName})`);
      
      const refreshedMembList = await dataService.getMemberships(tenantId);
      const refreshedLogs = await dataService.getAuditLogs(tenantId);
      setMembers(refreshedMembList);
      setAuditLogs(refreshedLogs);
      alert('Membership approved successfully!');
    } catch (err) {
      console.error(err);
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
      await dataService.logAction(tenantId, user.uid, user.displayName || 'Admin', 'BRANDING_UPDATE', `Updated association settings and styling config`);
      
      // Force trigger context reload by updating local variables
      // (This will auto-reload because the TenantContext listens to change, but let's notify)
      alert('Association branding updated! Changes will apply immediately.');
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert('Failed to update branding settings');
    }
  };

  const pendingMembers = members.filter(m => m.status === 'pending');

  if (loading) {
    return <div className="text-center py-12">{t('loading')}</div>;
  }

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black tracking-tight">{t('admin')}</h1>
        <p className="text-muted-foreground text-sm">
          Approve pending traders, update custom color branding in real time, and inspect logs.
        </p>
      </div>

      {/* Tabs Menu */}
      <div className="flex gap-2 border-b pb-2">
        <button
          onClick={() => setActiveTab('membership')}
          className={`px-4 py-2 font-bold text-xs uppercase border-b-2 transition-all ${
            activeTab === 'membership' 
              ? 'border-primary text-primary' 
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          📝 Member Approvals ({pendingMembers.length})
        </button>
        <button
          onClick={() => setActiveTab('branding')}
          className={`px-4 py-2 font-bold text-xs uppercase border-b-2 transition-all ${
            activeTab === 'branding' 
              ? 'border-primary text-primary' 
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          🎨 Custom Theme Settings
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`px-4 py-2 font-bold text-xs uppercase border-b-2 transition-all ${
            activeTab === 'logs' 
              ? 'border-primary text-primary' 
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          📂 Audit Event Logs
        </button>
      </div>

      {/* Tabs Content */}
      <div className="space-y-6">
        
        {/* Membership approvals */}
        {activeTab === 'membership' && (
          <div className="space-y-4">
            <h3 className="text-lg font-extrabold text-foreground">Pending Applications</h3>
            
            {pendingMembers.map((memb) => (
              <Card key={memb.id}>
                <CardContent className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-extrabold text-sm sm:text-base">{memb.shopName}</h4>
                      <Badge variant="secondary">{memb.category}</Badge>
                      {memb.paymentStatus && (
                        <Badge variant={memb.paymentStatus === 'paid_simulated' ? 'success' : 'outline'}>
                          💰 {memb.paymentStatus === 'paid_simulated' ? 'Fee Paid (₹1,100)' : 'Exempt'}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">Owner: <strong>{memb.ownerName}</strong> ({memb.phone}) • {memb.email}</p>
                    <p className="text-xs text-muted-foreground">Location: {memb.address}</p>
                    {memb.businessDescription && (
                      <p className="text-xs text-muted-foreground/80 leading-relaxed bg-muted/30 p-2.5 rounded-lg border font-medium mt-2">
                        {memb.businessDescription}
                      </p>
                    )}
                  </div>
                  <Button 
                    onClick={() => handleApproveMembership(memb.id, memb.ownerName)}
                    className="w-full md:w-auto font-bold bg-emerald-500 hover:bg-emerald-600 shadow-md shadow-emerald-500/10 shrink-0"
                  >
                    ✓ Approve Account
                  </Button>
                </CardContent>
              </Card>
            ))}

            {pendingMembers.length === 0 && (
              <div className="py-12 text-center text-muted-foreground">
                No pending membership applications registered. All traders are verified!
              </div>
            )}
          </div>
        )}

        {/* Branding Config */}
        {activeTab === 'branding' && (
          <Card className="max-w-2xl">
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

        {/* Logs */}
        {activeTab === 'logs' && (
          <Card>
            <CardHeader>
              <CardTitle>📂 Audit Security Event logs</CardTitle>
              <CardDescription>Real time logging of administrative updates.</CardDescription>
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
                        <td className="p-4 text-foreground font-bold">{log.userName}</td>
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
                          No audit event logs generated.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

      </div>

    </div>
  );
};
