import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTenant } from '../context/TenantContext';
import { useLanguage } from '../context/LanguageContext';
import { dataService } from '../services/dataService';
import { aiService } from '../services/aiService';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, Input, Label, Textarea, Select, Badge, Dialog } from '../components/ui/CustomUI';

export const Campaigns: React.FC = () => {
  const { user, membership, isAdmin } = useAuth();
  const { tenantId } = useTenant();
  const { t } = useLanguage();

  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [isOpen, setIsOpen] = useState(false);
  const [isMemoOpen, setIsMemoOpen] = useState(false);
  const [memoText, setMemoText] = useState('');
  const [selectedCamp, setSelectedCamp] = useState<any | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('active');
  const [submitting, setSubmitting] = useState(false);

  // Timeline Milestone Add State
  const [isTimelineOpen, setIsTimelineOpen] = useState(false);
  const [milestoneDate, setMilestoneDate] = useState('');
  const [milestoneTitle, setMilestoneTitle] = useState('');
  const [milestoneDesc, setMilestoneDesc] = useState('');

  useEffect(() => {
    if (!tenantId) return;
    setLoading(true);
    dataService.getCampaigns(tenantId).then(setCampaigns).finally(() => {
      setLoading(false);
    });
  }, [tenantId]);

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !tenantId) return;
    setSubmitting(true);

    const camp = {
      associationId: tenantId,
      title,
      description,
      timeline: [],
      photos: [],
      videos: [],
      govLetters: [],
      documents: [],
      participantsCount: 1,
      mediaCoverage: [],
      status,
      createdAt: new Date().toISOString()
    };

    try {
      await dataService.createCampaign(camp);
      const list = await dataService.getCampaigns(tenantId);
      setCampaigns(list);
      setIsOpen(false);
      setTitle('');
      setDescription('');
    } catch (err) {
      console.error(err);
      alert('Failed to launch campaign');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCamp || !milestoneDate || !milestoneTitle || !tenantId) return;

    const newMilestone = {
      date: milestoneDate,
      title: milestoneTitle,
      description: milestoneDesc
    };

    const updatedTimeline = [...(selectedCamp.timeline || []), newMilestone].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    try {
      await dataService.updateCampaign(selectedCamp.id, { timeline: updatedTimeline });
      const list = await dataService.getCampaigns(tenantId);
      setCampaigns(list);
      setIsTimelineOpen(false);
      setSelectedCamp(null);
      setMilestoneDate('');
      setMilestoneTitle('');
      setMilestoneDesc('');
    } catch (err) {
      console.error(err);
      alert('Failed to update timeline');
    }
  };

  const triggerAIMemo = async (camp: any) => {
    setSelectedCamp(camp);
    const memo = await aiService.generateMemorandum(camp.title, camp.description);
    setMemoText(memo);
    setIsMemoOpen(true);
  };

  const getCampaignStatusBadge = (s: string) => {
    switch (s) {
      case 'active': return <Badge variant="success">Active Advocacy</Badge>;
      case 'completed': return <Badge variant="default">Completed / Victory</Badge>;
      case 'planned': return <Badge variant="secondary">Planned Drive</Badge>;
      default: return <Badge variant="outline">{s}</Badge>;
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
          <h1 className="text-3xl font-black tracking-tight">{t('campaigns')}</h1>
          <p className="text-muted-foreground text-sm">
            Track organized civic campaigns, signature drives, MCD petitions, and structural development logs.
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => setIsOpen(true)} className="rounded-xl font-bold shadow-lg shadow-primary/10">
            ✊ Launch Campaign
          </Button>
        )}
      </div>

      {/* Campaigns Listing */}
      <div className="space-y-8">
        {campaigns.map((camp) => (
          <Card key={camp.id} className="shadow-md">
            <CardHeader className="border-b bg-muted/10">
              <div className="flex justify-between items-start gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    {getCampaignStatusBadge(camp.status)}
                    <span className="text-xs text-muted-foreground">👤 {camp.participantsCount} Members signed</span>
                  </div>
                  <CardTitle className="text-lg font-extrabold mt-2 text-foreground">{camp.title}</CardTitle>
                </div>
                
                {/* AI Memo generator shortcut */}
                {isAdmin && (
                  <Button size="sm" onClick={() => triggerAIMemo(camp)} className="bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg text-xs">
                    🤖 Write AI Memo
                  </Button>
                )}
              </div>
            </CardHeader>
            
            <CardContent className="p-6 space-y-6">
              <p className="text-sm leading-relaxed text-muted-foreground">{camp.description}</p>
              
              {/* Grid: Timeline & Letters */}
              <div className="grid md:grid-cols-2 gap-6 pt-4 border-t">
                {/* Column 1: Milestones Timeline */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center border-b pb-2">
                    <h4 className="font-bold text-sm text-foreground">📍 Milestones & Timeline</h4>
                    {isAdmin && (
                      <button 
                        onClick={() => { setSelectedCamp(camp); setIsTimelineOpen(true); }}
                        className="text-xs text-primary font-bold hover:underline"
                      >
                        + Add Step
                      </button>
                    )}
                  </div>
                  
                  <div className="relative pl-4 space-y-4 before:absolute before:left-1 before:top-2 before:bottom-2 before:w-[2px] before:bg-muted">
                    {camp.timeline && camp.timeline.map((step: any, idx: number) => (
                      <div key={idx} className="relative before:absolute before:-left-[17px] before:top-1.5 before:w-2.5 before:h-2.5 before:rounded-full before:bg-primary before:border-2 before:border-card">
                        <span className="text-[10px] font-mono text-primary font-bold">{step.date}</span>
                        <h5 className="font-extrabold text-xs text-foreground mt-0.5">{step.title}</h5>
                        <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">{step.description}</p>
                      </div>
                    ))}
                    {(!camp.timeline || camp.timeline.length === 0) && (
                      <div className="text-xs text-muted-foreground py-2">
                        No timeline steps added yet.
                      </div>
                    )}
                  </div>
                </div>

                {/* Column 2: Government letters & Press clips */}
                <div className="space-y-6">
                  {/* Govt Letters */}
                  <div className="space-y-2">
                    <h4 className="font-bold text-sm text-foreground border-b pb-2">📂 Government Correspondence</h4>
                    <div className="space-y-1.5">
                      {camp.govLetters && camp.govLetters.map((letDoc: any, idx: number) => (
                        <a 
                          key={idx} 
                          href={letDoc.url} 
                          className="flex items-center justify-between p-2 rounded border bg-card hover:bg-muted transition-colors text-xs"
                        >
                          <span className="font-medium truncate">{letDoc.title}</span>
                          <span className="text-[9px] text-muted-foreground font-mono">{letDoc.date}</span>
                        </a>
                      ))}
                      {(!camp.govLetters || camp.govLetters.length === 0) && (
                        <div className="text-xs text-muted-foreground py-2">
                          No government letters uploaded.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Press Coverage */}
                  <div className="space-y-2">
                    <h4 className="font-bold text-sm text-foreground border-b pb-2">📰 Newspaper & Press Coverage</h4>
                    <div className="space-y-1.5">
                      {camp.mediaCoverage && camp.mediaCoverage.map((media: any, idx: number) => (
                        <a 
                          key={idx} 
                          href={media.url} 
                          className="flex justify-between items-center p-2 rounded border bg-card hover:bg-muted transition-colors text-xs"
                        >
                          <span className="font-medium truncate">{media.title}</span>
                          <span className="text-[9px] text-primary font-bold uppercase">{media.source}</span>
                        </a>
                      ))}
                      {(!camp.mediaCoverage || camp.mediaCoverage.length === 0) && (
                        <div className="text-xs text-muted-foreground py-2">
                          No press mentions recorded.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {campaigns.length === 0 && (
          <div className="py-12 text-center text-muted-foreground">
            No active civic or commercial campaigns listed.
          </div>
        )}
      </div>

      {/* Campaign Create Dialog */}
      <Dialog isOpen={isOpen} onClose={() => setIsOpen(false)} title="Launch Advocacy / Civic Campaign">
        <form onSubmit={handleCreateCampaign} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Campaign Title</Label>
            <Input required placeholder="e.g. Parking Lot Allocation at Main Bazaar Gate" value={title} onChange={e => setTitle(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Select 
              label="Intended Initial Status"
              options={[
                { value: 'active', label: 'Active Lobbying' },
                { value: 'planned', label: 'Future Planned Drive' },
                { value: 'completed', label: 'Completed Campaign' }
              ]}
              value={status}
              onChange={e => setStatus(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Brief details & targets of the Campaign</Label>
            <Textarea required rows={4} placeholder="Describe the current issue, what changes the Vyapar Mandal is demanding, and which government bodies are being petitioned..." value={description} onChange={e => setDescription(e.target.value)} />
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={submitting}>
              {submitting ? 'Launching...' : 'Initialize Campaign'}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Add Milestone Step Dialog */}
      <Dialog isOpen={isTimelineOpen} onClose={() => setIsTimelineOpen(false)} title={`Add Step to: ${selectedCamp?.title}`}>
        <form onSubmit={handleAddMilestone} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Date of milestone</Label>
            <Input required type="date" value={milestoneDate} onChange={e => setMilestoneDate(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Milestone Action Title</Label>
            <Input required placeholder="e.g. Met with MCD Deputy Commissioner" value={milestoneTitle} onChange={e => setMilestoneTitle(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Brief descriptive update</Label>
            <Textarea rows={3} placeholder="Provide outcome details, next steps, or signature counts..." value={milestoneDesc} onChange={e => setMilestoneDesc(e.target.value)} />
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => { setIsTimelineOpen(false); setSelectedCamp(null); }}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Append Milestone
            </Button>
          </div>
        </form>
      </Dialog>

      {/* AI Memorandum Dialog Panel */}
      <Dialog isOpen={isMemoOpen} onClose={() => { setIsMemoOpen(false); setSelectedCamp(null); }} title="AI Generated Memorandum to Govt Division">
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Review and copy the formal memorandum below. You can submit this letter officially on the association letterhead.
          </p>
          <Textarea 
            readOnly 
            rows={12} 
            className="font-mono text-xs p-3 border bg-muted/20" 
            value={memoText}
          />
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                navigator.clipboard.writeText(memoText);
                alert('Memorandum copied to clipboard!');
              }}
            >
              📋 Copy to Clipboard
            </Button>
            <Button type="button" onClick={() => { setIsMemoOpen(false); setSelectedCamp(null); }}>
              Close Dialog
            </Button>
          </div>
        </div>
      </Dialog>

    </div>
  );
};
