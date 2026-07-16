import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTenant } from '../context/TenantContext';
import { useLanguage } from '../context/LanguageContext';
import { dataService } from '../services/dataService';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, Input, Label, Textarea, Select, Badge, Dialog } from '../components/ui/CustomUI';

export const Meetings: React.FC = () => {
  const { user, membership, isAdmin } = useAuth();
  const { tenantId } = useTenant();
  const { t } = useLanguage();

  const [meetings, setMeetings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedMeet, setSelectedMeet] = useState<any | null>(null);

  // New Meeting Form State
  const [title, setTitle] = useState('');
  const [dateTime, setDateTime] = useState('');
  const [agendaStr, setAgendaStr] = useState('');
  const [venue, setVenue] = useState('');
  const [isVirtual, setIsVirtual] = useState(false);
  const [virtualLink, setVirtualLink] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Meeting Details edit state (minutes, actions)
  const [minutes, setMinutes] = useState('');
  const [aiSummary, setAiSummary] = useState('');
  
  // Action item append state
  const [actionTask, setActionTask] = useState('');
  const [actionAssignee, setActionAssignee] = useState('Sunil Gupta');
  const [actionDueDate, setActionDueDate] = useState('');

  useEffect(() => {
    if (!tenantId) return;
    setLoading(true);
    dataService.getMeetings(tenantId).then(setMeetings).finally(() => {
      setLoading(false);
    });
  }, [tenantId]);

  const handleCreateMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !dateTime || !venue || !tenantId) return;
    setSubmitting(true);

    const agenda = agendaStr.split('\n').filter(a => a.trim() !== '');

    const meet = {
      associationId: tenantId,
      title,
      dateTime,
      agenda,
      venue,
      isVirtual,
      virtualLink: isVirtual ? virtualLink : '',
      attendance: [],
      minutes: '',
      actionItems: [],
      attachments: [],
      aiSummary: '',
      createdAt: new Date().toISOString()
    };

    try {
      await dataService.createMeeting(meet);
      const list = await dataService.getMeetings(tenantId);
      setMeetings(list);
      setIsOpen(false);
      setTitle('');
      setDateTime('');
      setAgendaStr('');
      setVenue('');
      setIsVirtual(false);
      setVirtualLink('');
    } catch (err) {
      console.error(err);
      alert('Failed to schedule meeting');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateMinutes = async () => {
    if (!selectedMeet || !tenantId) return;

    try {
      await dataService.updateMeeting(selectedMeet.id, { minutes, aiSummary });
      const list = await dataService.getMeetings(tenantId);
      setMeetings(list);
      setSelectedMeet({ ...selectedMeet, minutes, aiSummary });
      alert('Minutes saved successfully');
    } catch (err) {
      console.error(err);
      alert('Failed to save minutes');
    }
  };

  const handleAIGenerateMinutes = () => {
    if (!selectedMeet) return;
    const aiNotes = `AI Generated Meeting Minutes:\n\nThe meeting on "${selectedMeet.title}" covered: ${selectedMeet.agenda.join(', ')}.\nKey Decisions: Agreed to coordinate sewer repairs with MCD. President Mohan Lal approved security updates and CCTV layouts. Funding of watchmen finalized.\nNext Session: Scheduled for review next month.`;
    setMinutes(aiNotes);
    setAiSummary('Meeting focused on market safety watchmen hiring and MCD drain tenders. Action items assigned to Secretary Sunil.');
  };

  const handleAddActionItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMeet || !actionTask || !actionDueDate || !tenantId) return;

    const newItem = {
      task: actionTask,
      assignee: actionAssignee,
      dueDate: actionDueDate,
      completed: false
    };

    const updatedActions = [...(selectedMeet.actionItems || []), newItem];

    try {
      await dataService.updateMeeting(selectedMeet.id, { actionItems: updatedActions });
      const list = await dataService.getMeetings(tenantId);
      setMeetings(list);
      setSelectedMeet({ ...selectedMeet, actionItems: updatedActions });
      setActionTask('');
      setActionDueDate('');
    } catch (err) {
      console.error(err);
      alert('Failed to append action item');
    }
  };

  const toggleActionItem = async (idx: number) => {
    if (!selectedMeet || !tenantId) return;
    
    const updatedActions = [...(selectedMeet.actionItems || [])];
    updatedActions[idx].completed = !updatedActions[idx].completed;

    try {
      await dataService.updateMeeting(selectedMeet.id, { actionItems: updatedActions });
      const list = await dataService.getMeetings(tenantId);
      setMeetings(list);
      setSelectedMeet({ ...selectedMeet, actionItems: updatedActions });
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return <div className="text-center py-12">{t('loading')}</div>;
  }

  // Split into upcoming and past meetings
  const now = new Date();
  const upcomingMeetings = meetings.filter(m => new Date(m.dateTime) >= now);
  const pastMeetings = meetings.filter(m => new Date(m.dateTime) < now);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black tracking-tight">{t('meetings')}</h1>
          <p className="text-muted-foreground text-sm">
            Schedule committee gatherings, maintain minute summaries, log actions, and view AI reviews.
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => setIsOpen(true)} className="rounded-xl font-bold shadow-lg shadow-primary/10">
            📅 Schedule Meeting
          </Button>
        )}
      </div>

      {/* Grid: Upcoming & Past */}
      <div className="grid lg:grid-cols-2 gap-8">
        
        {/* Upcoming Meetings Column */}
        <div className="space-y-4">
          <h2 className="text-xl font-black text-foreground border-b pb-2">Upcoming Sessions</h2>
          {upcomingMeetings.map((meet) => (
            <Card 
              key={meet.id} 
              className="hover:scale-[1.01] transition-all cursor-pointer border border-primary/20"
              onClick={() => {
                setSelectedMeet(meet);
                setMinutes(meet.minutes || '');
                setAiSummary(meet.aiSummary || '');
              }}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-extrabold">{meet.title}</CardTitle>
                <CardDescription className="text-xs text-primary font-semibold">
                  ⏰ {new Date(meet.dateTime).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                </CardDescription>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground space-y-2">
                <p>📍 Venue: <strong>{meet.venue}</strong></p>
                {meet.isVirtual && <p>🔗 Link: <span className="text-blue-500 underline truncate">{meet.virtualLink}</span></p>}
                <div className="border-t pt-2 mt-2">
                  <span className="font-bold block text-foreground">Agenda Highlights:</span>
                  <ul className="list-disc pl-4 mt-1 space-y-1">
                    {meet.agenda.map((a: string, idx: number) => (
                      <li key={idx} className="line-clamp-1">{a}</li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          ))}
          {upcomingMeetings.length === 0 && (
            <div className="text-sm text-muted-foreground text-center py-6">
              No meetings scheduled for this week.
            </div>
          )}
        </div>

        {/* Past Meetings Column */}
        <div className="space-y-4">
          <h2 className="text-xl font-black text-muted-foreground border-b pb-2">Past Archives</h2>
          {pastMeetings.map((meet) => (
            <Card 
              key={meet.id} 
              className="hover:scale-[1.01] transition-all cursor-pointer border bg-muted/5 opacity-85 hover:opacity-100"
              onClick={() => {
                setSelectedMeet(meet);
                setMinutes(meet.minutes || '');
                setAiSummary(meet.aiSummary || '');
              }}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-extrabold">{meet.title}</CardTitle>
                <CardDescription className="text-xs">
                  ⏰ {new Date(meet.dateTime).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground space-y-1">
                <p>📍 Venue: {meet.venue}</p>
                {meet.aiSummary && <p className="text-purple-600 font-semibold mt-2">💡 AI: {meet.aiSummary}</p>}
              </CardContent>
            </Card>
          ))}
          {pastMeetings.length === 0 && (
            <div className="text-sm text-muted-foreground text-center py-6">
              No previous meetings logs found.
            </div>
          )}
        </div>

      </div>

      {/* Schedule Meeting Dialog */}
      <Dialog isOpen={isOpen} onClose={() => setIsOpen(false)} title="Schedule Committee Meeting">
        <form onSubmit={handleCreateMeeting} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Meeting Subject Title</Label>
            <Input required placeholder="e.g. Budget Allocation & Flag Hoisting planning" value={title} onChange={e => setTitle(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Date & Time</Label>
              <Input required type="datetime-local" value={dateTime} onChange={e => setDateTime(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Venue / Room</Label>
              <Input required placeholder="e.g. Office Hall Room 3" value={venue} onChange={e => setVenue(e.target.value)} />
            </div>
          </div>
          
          <div className="border p-3 rounded-lg space-y-3 bg-muted/10">
            <div className="flex items-center gap-2">
              <input 
                type="checkbox" 
                id="virt-check"
                checked={isVirtual} 
                onChange={e => setIsVirtual(e.target.checked)} 
                className="w-4 h-4"
              />
              <Label htmlFor="virt-check" className="cursor-pointer select-none">Is this a Virtual Meeting?</Label>
            </div>
            {isVirtual && (
              <div className="space-y-1.5 animate-in fade-in duration-200">
                <Label>Google Meet / Zoom URL Link</Label>
                <Input placeholder="https://meet.google.com/..." value={virtualLink} onChange={e => setVirtualLink(e.target.value)} />
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Agenda Bullet points (One per line)</Label>
            <Textarea required rows={4} placeholder="e.g. Approve safety watchmen budget\nSewer reconstruction update\nFlag hosting schedule" value={agendaStr} onChange={e => setAgendaStr(e.target.value)} />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={submitting}>
              {submitting ? 'Scheduling...' : 'Post Meeting Schedule'}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Expanded Meeting Details Dialog */}
      {selectedMeet && (
        <Dialog 
          isOpen={!!selectedMeet} 
          onClose={() => setSelectedMeet(null)} 
          title={selectedMeet.title}
        >
          <div className="space-y-6 text-sm">
            <div className="flex justify-between items-start border-b pb-4">
              <div>
                <p className="text-xs text-muted-foreground">Scheduled: <strong>{new Date(selectedMeet.dateTime).toLocaleString('en-IN')}</strong></p>
                <p className="text-xs text-muted-foreground mt-0.5">Location: <strong>{selectedMeet.venue}</strong></p>
              </div>
              {selectedMeet.isVirtual && (
                <a href={selectedMeet.virtualLink} target="_blank" rel="noreferrer" className="text-xs bg-sky-500 text-white font-bold px-3 py-1 rounded-full shadow hover:bg-sky-600">
                  Join Call 💻
                </a>
              )}
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-foreground">Agenda list:</h4>
              <ul className="list-decimal pl-5 space-y-1 text-xs text-muted-foreground">
                {selectedMeet.agenda.map((a: string, idx: number) => (
                  <li key={idx}>{a}</li>
                ))}
              </ul>
            </div>

            {/* Action Items List */}
            <div className="space-y-3 border-t pt-4">
              <h4 className="font-bold text-foreground flex justify-between items-center">
                <span>📋 Action items & Delegation</span>
                <span className="text-[10px] text-muted-foreground">Toggle to complete</span>
              </h4>
              
              <div className="space-y-2">
                {selectedMeet.actionItems && selectedMeet.actionItems.map((item: any, idx: number) => (
                  <div 
                    key={idx} 
                    onClick={() => isAdmin && toggleActionItem(idx)}
                    className={`flex justify-between items-center p-2 rounded border text-xs cursor-pointer select-none transition-colors ${
                      item.completed 
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 line-through opacity-85' 
                        : 'bg-card hover:bg-muted text-foreground'
                    }`}
                  >
                    <div>
                      <span className="font-bold mr-2">🎯 {item.assignee}:</span>
                      <span>{item.task}</span>
                    </div>
                    <span className="text-[9px] font-mono text-muted-foreground shrink-0 ml-4">Due: {item.dueDate}</span>
                  </div>
                ))}
                {(!selectedMeet.actionItems || selectedMeet.actionItems.length === 0) && (
                  <p className="text-xs text-muted-foreground text-center py-1">No action tasks assigned.</p>
                )}
              </div>

              {/* Add Action Item Form (Admins only) */}
              {isAdmin && (
                <form onSubmit={handleAddActionItem} className="p-3 border rounded-xl bg-muted/10 space-y-3 mt-2">
                  <h5 className="font-bold text-[10px] uppercase text-muted-foreground">Add Action Task</h5>
                  <div className="grid grid-cols-2 gap-3">
                    <Input required placeholder="Task details..." value={actionTask} onChange={e => setActionTask(e.target.value)} className="text-xs h-9" />
                    <Input required type="date" value={actionDueDate} onChange={e => setActionDueDate(e.target.value)} className="text-xs h-9" />
                  </div>
                  <div className="flex gap-2">
                    <Select
                      options={[
                        { value: 'Mohan Lal', label: 'Mohan Lal (President)' },
                        { value: 'Sunil Gupta', label: 'Sunil Gupta (Secretary)' },
                        { value: 'Alok Verma', label: 'Alok Verma (Treasurer)' }
                      ]}
                      value={actionAssignee}
                      onChange={e => setActionAssignee(e.target.value)}
                      className="text-xs h-9"
                    />
                    <Button type="submit" size="sm" className="h-9 shrink-0 font-bold">Assign Task</Button>
                  </div>
                </form>
              )}
            </div>

            {/* Minutes & AI summaries */}
            <div className="space-y-4 border-t pt-4">
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-foreground">✍️ Minutes of Meeting</h4>
                {isAdmin && (
                  <button 
                    onClick={handleAIGenerateMinutes}
                    className="text-xs bg-purple-600/10 text-purple-600 border border-purple-600/20 px-2 py-0.5 rounded font-bold hover:bg-purple-600/15"
                  >
                    🤖 Generate Minutes via AI
                  </button>
                )}
              </div>

              {isAdmin ? (
                <div className="space-y-3">
                  <Textarea 
                    rows={4} 
                    placeholder="Type the official discussion minutes summary..." 
                    value={minutes} 
                    onChange={e => setMinutes(e.target.value)}
                    className="text-xs"
                  />
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground">AI Review Highlights</Label>
                    <Input 
                      placeholder="AI Quick Summary..." 
                      value={aiSummary} 
                      onChange={e => setAiSummary(e.target.value)}
                      className="text-xs h-9"
                    />
                  </div>
                  <Button size="sm" onClick={handleUpdateMinutes} className="w-full font-bold">
                    💾 Save Minute Details
                  </Button>
                </div>
              ) : (
                <div className="space-y-3 bg-muted/20 p-3 rounded-lg text-xs leading-relaxed">
                  <p><strong>Official Minutes:</strong></p>
                  <p className="text-muted-foreground whitespace-pre-wrap">{selectedMeet.minutes || 'Minutes not uploaded yet.'}</p>
                  {selectedMeet.aiSummary && (
                    <div className="border-t pt-2.5 mt-2.5">
                      <p className="text-purple-600 font-bold">💡 AI Summarized Highlights:</p>
                      <p className="text-muted-foreground mt-1">{selectedMeet.aiSummary}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setSelectedMeet(null)} className="w-full">
                Close Meeting Detail
              </Button>
            </div>
          </div>
        </Dialog>
      )}

    </div>
  );
};
