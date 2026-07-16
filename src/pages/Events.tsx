import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTenant } from '../context/TenantContext';
import { useLanguage } from '../context/LanguageContext';
import { dataService } from '../services/dataService';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, Input, Label, Textarea, Select, Badge, Dialog } from '../components/ui/CustomUI';

export const Events: React.FC = () => {
  const { user, membership, isAdmin } = useAuth();
  const { tenantId } = useTenant();
  const { t } = useLanguage();

  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedEvt, setSelectedEvt] = useState<any | null>(null);

  // New Event Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('seminar');
  const [dateTime, setDateTime] = useState('');
  const [venue, setVenue] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // QR Scanning Simulation
  const [qrValue, setQrValue] = useState('');
  const [scanResult, setScanResult] = useState<string | null>(null);

  useEffect(() => {
    if (!tenantId) return;
    setLoading(true);
    dataService.getEvents(tenantId).then(setEvents).finally(() => {
      setLoading(false);
    });
  }, [tenantId]);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !dateTime || !venue || !tenantId) return;
    setSubmitting(true);

    const evt = {
      associationId: tenantId,
      title,
      description,
      type,
      dateTime,
      venue,
      images: [
        type === 'blood_donation' ? 'https://images.unsplash.com/photo-1615461066841-6116ecdcee90?auto=format&fit=crop&w=400&q=80' :
        type === 'festival' ? 'https://images.unsplash.com/photo-1504196606672-aef5c9cefc92?auto=format&fit=crop&w=400&q=80' :
        'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=400&q=80'
      ], // Auto fill realistic image based on type for gorgeous UI
      registrations: [],
      createdAt: new Date().toISOString()
    };

    try {
      await dataService.createEvent(evt);
      const list = await dataService.getEvents(tenantId);
      setEvents(list);
      setIsOpen(false);
      setTitle('');
      setDescription('');
      setVenue('');
    } catch (err) {
      console.error(err);
      alert('Failed to list event');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegister = async (eventId: string) => {
    if (!user || !tenantId) return;

    try {
      await dataService.registerForEvent(eventId, user.uid, user.displayName);
      const list = await dataService.getEvents(tenantId);
      setEvents(list);
      alert('Registered successfully!');
    } catch (err) {
      console.error(err);
    }
  };

  const handleQRCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvt || !qrValue.trim() || !tenantId) return;
    setScanResult(null);

    try {
      // Decode QR input (simulating scanning the JSON from QRCard or Event ticket)
      let parsedUserId = qrValue;
      try {
        const decoded = JSON.parse(qrValue);
        parsedUserId = decoded.userId || decoded.id; // supports both global uid or card code
      } catch (err) {
        // use raw value if not json
      }

      // Check-in
      const success = await dataService.checkInEventQR(selectedEvt.id, parsedUserId);
      if (success) {
        setScanResult(`✅ Check-in Success! Member ID: ${parsedUserId} is verified and marked present.`);
        const list = await dataService.getEvents(tenantId);
        setEvents(list);
        
        // Update local detail dialog
        const refreshedEvt = list.find((e: any) => e.id === selectedEvt.id);
        setSelectedEvt(refreshedEvt);
      } else {
        setScanResult(`❌ Verification Failed. Member ID: ${parsedUserId} has not registered for this event.`);
      }
      setQrValue('');
    } catch (err) {
      console.error(err);
      setScanResult('❌ Scan Error: Invalid QR metadata payload.');
    }
  };

  const isUserRegistered = (evt: any) => {
    return user && evt.registrations?.some((r: any) => r.userId === user.uid);
  };

  const isUserCheckedIn = (evt: any) => {
    return user && evt.registrations?.some((r: any) => r.userId === user.uid && r.checkedIn);
  };

  const getEventBadge = (t: string) => {
    switch (t) {
      case 'blood_donation': return <Badge variant="destructive">Blood Donation Camp</Badge>;
      case 'festival': return <Badge variant="default" className="bg-orange-500 hover:bg-orange-600 text-white">Festival / Mela</Badge>;
      case 'business_meet': return <Badge variant="default">Business Meet</Badge>;
      case 'election': return <Badge variant="secondary">Election Assembly</Badge>;
      case 'training': return <Badge variant="success">Training Workshop</Badge>;
      default: return <Badge variant="outline">{t}</Badge>;
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
          <h1 className="text-3xl font-black tracking-tight">{t('events')}</h1>
          <p className="text-muted-foreground text-sm">
            Participate in merchant assemblies, blood donation drives, training workshops, and scan QR check-ins.
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => setIsOpen(true)} className="rounded-xl font-bold shadow-lg shadow-primary/10">
            🎉 List Event
          </Button>
        )}
      </div>

      {/* Events Listing */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map((evt) => (
          <Card key={evt.id} className="hover:shadow-lg transition-all flex flex-col justify-between overflow-hidden">
            {evt.images && evt.images.length > 0 && (
              <img src={evt.images[0]} alt="Event header" className="w-full h-44 object-cover" />
            )}
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                {getEventBadge(evt.type)}
                <span className="text-[10px] text-muted-foreground font-mono">{new Date(evt.dateTime).toLocaleDateString()}</span>
              </div>
              <CardTitle className="text-base font-extrabold mt-3 line-clamp-1">{evt.title}</CardTitle>
              <CardDescription className="text-xs font-semibold text-primary">
                📍 Venue: {evt.venue}
              </CardDescription>
            </CardHeader>
            <CardContent className="py-2 text-xs text-muted-foreground flex-1">
              <p className="line-clamp-3 leading-relaxed">{evt.description}</p>
            </CardContent>
            
            <div className="p-4 border-t bg-muted/10 flex gap-2" onClick={(e) => e.stopPropagation()}>
              <Button 
                onClick={() => setSelectedEvt(evt)}
                variant="outline" 
                size="sm" 
                className="w-full font-bold"
              >
                ℹ️ View Details
              </Button>

              {isUserRegistered(evt) ? (
                <Button 
                  disabled 
                  variant="secondary" 
                  size="sm" 
                  className="w-full font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                >
                  {isUserCheckedIn(evt) ? 'Checked In ✓' : 'Registered ✓'}
                </Button>
              ) : (
                <Button 
                  onClick={() => handleRegister(evt.id)}
                  variant="primary" 
                  size="sm" 
                  className="w-full font-bold"
                >
                  🤝 RSVP / Register
                </Button>
              )}
            </div>
          </Card>
        ))}

        {events.length === 0 && (
          <div className="col-span-full py-12 text-center text-muted-foreground">
            No active public events scheduled. Check back later!
          </div>
        )}
      </div>

      {/* List Event Dialog */}
      <Dialog isOpen={isOpen} onClose={() => setIsOpen(false)} title="List Association Public Event">
        <form onSubmit={handleCreateEvent} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Event Title</Label>
            <Input required placeholder="e.g. Annual Vyapar Diwali Exhibition Mela" value={title} onChange={e => setTitle(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Select
                label="Event Assembly Type"
                options={[
                  { value: 'seminar', label: 'Compliance Seminar' },
                  { value: 'blood_donation', label: 'Blood Donation Camp' },
                  { value: 'festival', label: 'Festival / Celebration' },
                  { value: 'business_meet', label: 'Business B2B Meet' },
                  { value: 'election', label: 'Committee Election' }
                ]}
                value={type}
                onChange={e => setType(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Date & Time</Label>
              <Input required type="datetime-local" value={dateTime} onChange={e => setDateTime(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Event Location Venue</Label>
            <Input required placeholder="e.g. Police Booth Ground, Main Market Road" value={venue} onChange={e => setVenue(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Full Event Description & RSVP instructions</Label>
            <Textarea required rows={4} placeholder="Provide complete event details like agenda, chief guests, seating details, timing..." value={description} onChange={e => setDescription(e.target.value)} />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={submitting}>
              {submitting ? 'Publishing...' : 'List Public Event'}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Expanded Event Details & QR Check-In Dialog */}
      {selectedEvt && (
        <Dialog 
          isOpen={!!selectedEvt} 
          onClose={() => { setSelectedEvt(null); setScanResult(null); }} 
          title={selectedEvt.title}
        >
          <div className="space-y-6 text-sm">
            <div className="flex justify-between items-start border-b pb-4">
              <div>
                <span className="text-[10px] font-black uppercase text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full">
                  {selectedEvt.type}
                </span>
                <p className="text-xs text-muted-foreground mt-2">Scheduled: <strong>{new Date(selectedEvt.dateTime).toLocaleString('en-IN')}</strong></p>
                <p className="text-xs text-muted-foreground mt-0.5">Location: <strong>{selectedEvt.venue}</strong></p>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-foreground">RSVP Description:</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {selectedEvt.description}
              </p>
            </div>

            {/* QR Check-in Simulation for verification desk */}
            {isAdmin && (
              <div className="p-4 border rounded-xl bg-muted/20 space-y-4">
                <h4 className="font-bold text-xs border-b pb-1 text-foreground">🎛️ Event Check-In Desk (QR Simulation)</h4>
                <p className="text-[10px] text-muted-foreground">
                  Paste member's global User ID below (e.g. <code>user_member_vijay</code> or <code>phone_+919555544444</code>) to check them in.
                </p>
                
                <form onSubmit={handleQRCheckIn} className="flex gap-2">
                  <Input 
                    required
                    placeholder="User ID or Member Card Payload..." 
                    value={qrValue} 
                    onChange={e => setQrValue(e.target.value)}
                    className="text-xs h-9 bg-card"
                  />
                  <Button type="submit" size="sm" className="h-9 shrink-0 font-bold">Verify QR</Button>
                </form>

                {scanResult && (
                  <p className="text-xs font-semibold p-2.5 rounded-lg bg-card border">
                    {scanResult}
                  </p>
                )}
              </div>
            )}

            {/* Attendance list inside details */}
            <div className="space-y-3 border-t pt-4">
              <h4 className="font-bold text-foreground">👥 RSVP Attendance ({selectedEvt.registrations?.length || 0} Registered)</h4>
              <div className="max-h-40 overflow-y-auto space-y-1.5">
                {selectedEvt.registrations && selectedEvt.registrations.map((r: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center p-2 border rounded bg-card text-xs">
                    <span>👤 {r.userName}</span>
                    {r.checkedIn ? (
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        Checked In ✓
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-muted-foreground">Registered</span>
                    )}
                  </div>
                ))}
                {(!selectedEvt.registrations || selectedEvt.registrations.length === 0) && (
                  <p className="text-xs text-muted-foreground text-center py-2">No traders registered for this event yet.</p>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => { setSelectedEvt(null); setScanResult(null); }} className="w-full">
                Close Event Info
              </Button>
            </div>
          </div>
        </Dialog>
      )}

    </div>
  );
};
