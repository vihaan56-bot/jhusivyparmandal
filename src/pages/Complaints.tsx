import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTenant } from '../context/TenantContext';
import { useLanguage } from '../context/LanguageContext';
import { dataService } from '../services/dataService';
import { aiService } from '../services/aiService';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, Input, Label, Textarea, Select, Badge, Dialog } from '../components/ui/CustomUI';

export const Complaints: React.FC = () => {
  const { user, role, isAdmin } = useAuth();
  const { tenantId } = useTenant();
  const { t } = useLanguage();

  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedComp, setSelectedComp] = useState<any | null>(null);

  // New Complaint Form
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('road');
  const [description, setDescription] = useState('');
  const [locationStr, setLocationStr] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [aiFeedback, setAiFeedback] = useState<string | null>(null);

  // Comment State
  const [commentText, setCommentText] = useState('');

  // Admin Assignment State
  const [assigneeId, setAssigneeId] = useState('user_secretary');
  const [assigneeName, setAssigneeName] = useState('Sunil Gupta (Secretary)');
  const [statusVal, setStatusVal] = useState('submitted');

  useEffect(() => {
    if (!tenantId) return;
    setLoading(true);
    dataService.getComplaints(tenantId).then(setComplaints).finally(() => {
      setLoading(false);
    });
  }, [tenantId]);

  const handleCreateComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !locationStr || !tenantId || !user) return;
    setSubmitting(true);

    const comp = {
      associationId: tenantId,
      userId: user.uid,
      userName: user.displayName || 'Mandal Member',
      category,
      title,
      description,
      status: 'submitted',
      photos: [
        category === 'garbage' ? 'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&w=400&q=80' :
        category === 'electricity' ? 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=400&q=80' :
        'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=400&q=80'
      ], // Auto fill realistic image based on category for gorgeous UI
      location: { addressString: locationStr },
      comments: [],
      createdAt: new Date().toISOString()
    };

    try {
      await dataService.createComplaint(comp);
      const list = await dataService.getComplaints(tenantId);
      setComplaints(list);
      setIsOpen(false);
      setTitle('');
      setDescription('');
      setLocationStr('');
      setAiFeedback(null);
    } catch (err) {
      console.error(err);
      alert('Failed to submit complaint');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAICategorize = async () => {
    if (!title.trim() && !description.trim()) return;
    const res = await aiService.categorizeComplaint(title, description);
    setCategory(res.category);
    setAiFeedback(`💡 AI Analysis: Categorized as ${res.category.toUpperCase()} (${res.priority.toUpperCase()} Priority).`);
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !selectedComp || !user || !tenantId) return;

    const newComment = {
      id: `comm_${Date.now()}`,
      userId: user.uid,
      userName: user.displayName || 'Member',
      userRole: role.toUpperCase(),
      text: commentText,
      createdAt: new Date().toISOString()
    };

    const updatedComments = [...(selectedComp.comments || []), newComment];

    try {
      await dataService.updateComplaint(selectedComp.id, { comments: updatedComments });
      const list = await dataService.getComplaints(tenantId);
      setComplaints(list);
      
      // Update local state in-dialog
      setSelectedComp({ ...selectedComp, comments: updatedComments });
      setCommentText('');
    } catch (err) {
      console.error(err);
      alert('Failed to post comment');
    }
  };

  const handleAdminUpdate = async () => {
    if (!selectedComp || !tenantId) return;

    const updates: any = { status: statusVal };
    if (statusVal === 'assigned') {
      updates.assignedToId = assigneeId;
      updates.assignedToName = assigneeName;
    }

    try {
      await dataService.updateComplaint(selectedComp.id, updates);
      const list = await dataService.getComplaints(tenantId);
      setComplaints(list);
      setSelectedComp({ ...selectedComp, ...updates });
      alert('Status updated successfully');
    } catch (err) {
      console.error(err);
      alert('Failed to update status');
    }
  };

  const getStatusColor = (s: string) => {
    switch (s) {
      case 'submitted': return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
      case 'assigned': return 'bg-sky-500/10 text-sky-600 border-sky-500/20';
      case 'in_progress': return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
      case 'resolved': return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
      case 'closed': return 'bg-zinc-500/10 text-zinc-600 border-zinc-500/20';
      default: return 'bg-zinc-500/10 text-zinc-600';
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
          <h1 className="text-3xl font-black tracking-tight">{t('complaints')}</h1>
          <p className="text-muted-foreground text-sm">
            Raise issues regarding drainage clog, electrical hazards, garbage heaps, or security directly to officers.
          </p>
        </div>
        <Button onClick={() => setIsOpen(true)} className="rounded-xl font-bold shadow-lg shadow-primary/10">
          🛠️ Log Grievance
        </Button>
      </div>

      {/* Grid of Complaints */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {complaints.map((comp) => (
          <Card 
            key={comp.id} 
            className="hover:scale-[1.01] transition-all cursor-pointer border flex flex-col justify-between"
            onClick={() => {
              setSelectedComp(comp);
              setStatusVal(comp.status);
              if (comp.assignedToId) {
                setAssigneeId(comp.assignedToId);
                setAssigneeName(comp.assignedToName);
              }
            }}
          >
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black uppercase text-red-600 bg-red-500/10 border border-red-500/20 px-2.5 py-0.5 rounded-full">
                  {comp.category}
                </span>
                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${getStatusColor(comp.status)}`}>
                  {comp.status.replace('_', ' ')}
                </span>
              </div>
              <CardTitle className="text-base font-extrabold mt-3 line-clamp-1">{comp.title}</CardTitle>
              <CardDescription className="text-xs font-semibold text-muted-foreground flex justify-between items-center pt-1">
                <span>By: {comp.userName}</span>
                <span className="font-mono text-[10px]">{new Date(comp.createdAt).toLocaleDateString()}</span>
              </CardDescription>
            </CardHeader>
            
            <CardContent className="py-2 text-xs text-muted-foreground flex-1 space-y-3">
              <p className="line-clamp-2 leading-relaxed">{comp.description}</p>
              {comp.photos && comp.photos.length > 0 && (
                <img src={comp.photos[0]} alt="Issue" className="w-full h-32 object-cover rounded-lg border shadow-sm" />
              )}
            </CardContent>

            <div className="p-4 border-t bg-muted/10 text-xs text-muted-foreground flex justify-between items-center">
              <span>📍 {comp.location.addressString}</span>
              <span className="font-semibold text-primary">💬 {comp.comments?.length || 0} Discussions</span>
            </div>
          </Card>
        ))}

        {complaints.length === 0 && (
          <div className="col-span-full py-12 text-center text-muted-foreground">
            No complaints logged. Excellent! The market is clean.
          </div>
        )}
      </div>

      {/* Lodge Complaint Dialog */}
      <Dialog isOpen={isOpen} onClose={() => setIsOpen(false)} title="Lodge Market Grievance Complaint">
        <form onSubmit={handleCreateComplaint} className="space-y-4">
          <div className="space-y-1.5 flex justify-between items-center">
            <Label>Complaint Headline</Label>
            <button 
              type="button" 
              onClick={handleAICategorize}
              className="text-xs bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 px-2.5 py-1 rounded font-bold transition-all"
            >
              🤖 AI Categorize
            </button>
          </div>
          <Input required placeholder="e.g. Open sewer manhole in Gali No. 4 causing accidents" value={title} onChange={e => setTitle(e.target.value)} />
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Select
                label="Complaint Category"
                options={[
                  { value: 'road', label: 'Road Repair / Potholes' },
                  { value: 'electricity', label: 'Electricity / Wiring' },
                  { value: 'garbage', label: 'Garbage Accumulation' },
                  { value: 'drainage', label: 'Sewerage / Drainage Block' },
                  { value: 'parking', label: 'Parking Blockage' },
                  { value: 'water', label: 'Water Contamination' },
                  { value: 'security', label: 'Safety & Security Guard' },
                  { value: 'other', label: 'Other Grievance' }
                ]}
                value={category}
                onChange={e => setCategory(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Precise Location landmark</Label>
              <Input required placeholder="e.g. Near Gupta Toys Gali Exit" value={locationStr} onChange={e => setLocationStr(e.target.value)} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Complete Grievance Description</Label>
            <Textarea required rows={4} placeholder="Describe the size, impact, and days of delay. The more details, the faster it will be assigned..." value={description} onChange={e => setDescription(e.target.value)} />
          </div>

          {aiFeedback && (
            <p className="text-xs font-semibold p-2.5 rounded-lg bg-primary/5 text-primary border border-primary/10">
              {aiFeedback}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={submitting}>
              {submitting ? 'Lodging Complaint...' : 'File Grievance Ticket'}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Expanded Complaint Details Dialog */}
      {selectedComp && (
        <Dialog 
          isOpen={!!selectedComp} 
          onClose={() => setSelectedComp(null)} 
          title={`Ticket: ${selectedComp.title}`}
        >
          <div className="space-y-6 text-sm">
            <div className="flex justify-between items-start border-b pb-4">
              <div>
                <span className="text-[10px] font-black uppercase text-red-600 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full">
                  {selectedComp.category}
                </span>
                <p className="text-xs text-muted-foreground mt-2">Raised by: <strong>{selectedComp.userName}</strong> on {new Date(selectedComp.createdAt).toLocaleDateString()}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Assigned To: <strong>{selectedComp.assignedToName || 'Unassigned'}</strong></p>
              </div>
              <span className={`text-xs font-bold uppercase px-3 py-1 rounded border ${getStatusColor(selectedComp.status)}`}>
                {selectedComp.status.replace('_', ' ')}
              </span>
            </div>

            <div className="space-y-4">
              <p className="text-muted-foreground leading-relaxed text-xs">
                {selectedComp.description}
              </p>
              {selectedComp.photos && selectedComp.photos.length > 0 && (
                <img src={selectedComp.photos[0]} alt="Ticket visual" className="w-full h-48 object-cover rounded-xl border" />
              )}
            </div>

            {/* Admin Management Section */}
            {isAdmin && (
              <div className="p-4 border rounded-xl bg-muted/20 space-y-4">
                <h4 className="font-bold text-xs border-b pb-1 text-foreground">🛠️ Officer Action Workspace</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Select
                      label="Assign Officer"
                      options={[
                        { value: 'user_president', label: 'Mohan Lal (President)' },
                        { value: 'user_secretary', label: 'Sunil Gupta (Secretary)' },
                        { value: 'user_treasurer', label: 'Alok Verma (Treasurer)' }
                      ]}
                      value={assigneeId}
                      onChange={(e) => {
                        setAssigneeId(e.target.value);
                        const names: Record<string, string> = {
                          'user_president': 'Mohan Lal (President)',
                          'user_secretary': 'Sunil Gupta (Secretary)',
                          'user_treasurer': 'Alok Verma (Treasurer)'
                        };
                        setAssigneeName(names[e.target.value]);
                      }}
                    />
                  </div>

                  <div className="space-y-1">
                    <Select
                      label="Set Resolution Status"
                      options={[
                        { value: 'submitted', label: 'Submitted' },
                        { value: 'assigned', label: 'Assigned' },
                        { value: 'in_progress', label: 'In Progress' },
                        { value: 'resolved', label: 'Resolved' },
                        { value: 'closed', label: 'Closed / Archived' }
                      ]}
                      value={statusVal}
                      onChange={(e) => setStatusVal(e.target.value)}
                    />
                  </div>
                </div>

                <Button size="sm" onClick={handleAdminUpdate} className="w-full font-bold">
                  💾 Update Ticket Allocation
                </Button>
              </div>
            )}

            {/* Comments Thread Section */}
            <div className="space-y-4 border-t pt-4">
              <h4 className="font-bold text-xs text-foreground">💬 Discussion Thread ({selectedComp.comments?.length || 0})</h4>
              
              <div className="space-y-3 max-h-40 overflow-y-auto">
                {selectedComp.comments && selectedComp.comments.map((comm: any) => (
                  <div key={comm.id} className="p-2.5 rounded bg-muted/40 border">
                    <div className="flex justify-between items-center text-[10px] text-muted-foreground mb-1">
                      <span><strong>{comm.userName}</strong> ({comm.userRole})</span>
                      <span>{new Date(comm.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="text-xs leading-relaxed text-foreground">{comm.text}</p>
                  </div>
                ))}
                {(!selectedComp.comments || selectedComp.comments.length === 0) && (
                  <p className="text-xs text-muted-foreground text-center py-2">
                    No replies or discussions posted. Write the first response below.
                  </p>
                )}
              </div>

              {/* Add Comment Input */}
              <form onSubmit={handlePostComment} className="flex gap-2">
                <Input 
                  required
                  placeholder="Post brief progress or comment..." 
                  value={commentText} 
                  onChange={e => setCommentText(e.target.value)}
                  className="text-xs h-9"
                />
                <Button type="submit" size="sm" className="h-9 font-bold">
                  Send
                </Button>
              </form>
            </div>
            
            <div className="flex justify-end pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setSelectedComp(null)} className="w-full">
                Close Grievance Detail
              </Button>
            </div>
          </div>
        </Dialog>
      )}

    </div>
  );
};
