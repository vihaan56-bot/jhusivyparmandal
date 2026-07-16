import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTenant } from '../context/TenantContext';
import { useLanguage } from '../context/LanguageContext';
import { dataService } from '../services/dataService';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, Input, Label, Textarea, Select, Badge, Dialog } from '../components/ui/CustomUI';

export const Polls: React.FC = () => {
  const { user, membership, isAdmin } = useAuth();
  const { tenantId } = useTenant();
  const { t } = useLanguage();

  const [polls, setPolls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [userVotes, setUserVotes] = useState<Record<string, string>>({}); // pollId -> optionId

  // New Poll Form State
  const [question, setQuestion] = useState('');
  const [type, setType] = useState('opinion');
  const [optionsStr, setOptionsStr] = useState('');
  const [anonymous, setAnonymous] = useState(true);
  const [duration, setDuration] = useState('7'); // days
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!tenantId || !user) return;
    setLoading(true);

    dataService.getPolls(tenantId).then(async (pollList) => {
      setPolls(pollList);

      // Check voting status for each poll
      const votesMap: Record<string, string> = {};
      await Promise.all(
        pollList.map(async (p) => {
          const voted = await dataService.hasVoted(p.id, user.uid);
          if (voted) {
            // Find which option was selected by fetching the global votes array in mock (simplified)
            const allVotes = JSON.parse(localStorage.getItem('vyapar_votes') || '[]');
            const vote = allVotes.find((v: any) => v.pollId === p.id && v.userId === user.uid);
            votesMap[p.id] = vote ? vote.optionId : 'voted';
          }
        })
      );
      setUserVotes(votesMap);
    }).finally(() => {
      setLoading(false);
    });
  }, [tenantId, user]);

  const handleCreatePoll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question || !optionsStr || !tenantId || !user) return;
    setSubmitting(true);

    const options = optionsStr.split('\n')
      .filter(o => o.trim() !== '')
      .map((opt, idx) => ({ id: `opt_${idx}`, text: opt, votesCount: 0 }));

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + parseInt(duration));

    const poll = {
      associationId: tenantId,
      question,
      options,
      type,
      anonymous,
      expiresAt: expiresAt.toISOString(),
      status: 'active',
      createdBy: user.displayName || 'Admin',
      createdAt: new Date().toISOString()
    };

    try {
      await dataService.createPoll(poll);
      const list = await dataService.getPolls(tenantId);
      setPolls(list);
      setIsOpen(false);
      setQuestion('');
      setOptionsStr('');
    } catch (err) {
      console.error(err);
      alert('Failed to list poll');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVote = async (pollId: string, optionId: string) => {
    if (!user) return;

    try {
      const success = await dataService.voteInPoll(pollId, optionId, user.uid);
      if (success) {
        setUserVotes(prev => ({ ...prev, [pollId]: optionId }));
        const list = await dataService.getPolls(tenantId!);
        setPolls(list);
      } else {
        alert('You have already voted in this poll.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const calculatePercentage = (votes: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((votes / total) * 100);
  };

  const getTotalVotes = (options: { votesCount: number }[]) => {
    return options.reduce((acc, curr) => acc + (curr.votesCount || 0), 0);
  };

  if (loading) {
    return <div className="text-center py-12">{t('loading')}</div>;
  }

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black tracking-tight">{t('polls')}</h1>
          <p className="text-muted-foreground text-sm">
            Express opinions on market issues, cast anonymous votes, and view collective decision analytics.
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => setIsOpen(true)} className="rounded-xl font-bold shadow-lg shadow-primary/10">
            🗳️ Create Poll
          </Button>
        )}
      </div>

      {/* Poll Cards Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {polls.map((poll) => {
          const totalVotes = getTotalVotes(poll.options);
          const hasVoted = !!userVotes[poll.id];
          const isExpired = new Date(poll.expiresAt) < new Date();

          return (
            <Card key={poll.id} className={`flex flex-col justify-between ${isExpired ? 'opacity-85' : ''}`}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-center flex-wrap gap-2">
                  <Badge variant={poll.type === 'election' ? 'destructive' : 'default'}>
                    {poll.type.toUpperCase()}
                  </Badge>
                  {poll.anonymous && (
                    <span className="text-[10px] bg-zinc-500/10 text-zinc-500 border px-1.5 py-0.5 rounded">
                      🔒 Anonymous Vote
                    </span>
                  )}
                  <span className="text-[10px] text-muted-foreground">
                    {isExpired ? 'Closed' : `Ends: ${new Date(poll.expiresAt).toLocaleDateString()}`}
                  </span>
                </div>
                <CardTitle className="text-base font-extrabold mt-3 leading-snug">
                  {poll.question}
                </CardTitle>
              </CardHeader>
              
              <CardContent className="space-y-4 py-2 flex-1">
                {/* Options List */}
                <div className="space-y-3">
                  {poll.options.map((opt: any) => {
                    const pct = calculatePercentage(opt.votesCount, totalVotes);
                    const isSelected = userVotes[poll.id] === opt.id;

                    return (
                      <div key={opt.id} className="relative">
                        {/* Vote Action / Visual Stats */}
                        {hasVoted || isExpired ? (
                          <div className="w-full border rounded-lg p-3 text-xs flex justify-between items-center relative overflow-hidden bg-card select-none">
                            {/* Filling progress bar overlay */}
                            <div 
                              className={`absolute left-0 top-0 bottom-0 opacity-10 transition-all duration-500 ${
                                isSelected ? 'bg-primary' : 'bg-muted-foreground'
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                            
                            <span className={`font-semibold relative z-10 ${isSelected ? 'text-primary' : ''}`}>
                              {opt.text} {isSelected && '✓'}
                            </span>
                            <span className="font-mono text-muted-foreground shrink-0 relative z-10">
                              {opt.votesCount} votes ({pct}%)
                            </span>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleVote(poll.id, opt.id)}
                            className="w-full text-left border hover:border-primary/40 rounded-lg p-3 text-xs font-semibold hover:bg-primary/5 active:scale-[0.99] transition-all bg-card text-foreground"
                          >
                            ○ {opt.text}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>

              <div className="p-4 border-t bg-muted/10 text-xs text-muted-foreground flex justify-between items-center font-semibold">
                <span>🗳️ Total Votes Cast: {totalVotes}</span>
                <span>By: {poll.createdBy}</span>
              </div>
            </Card>
          );
        })}

        {polls.length === 0 && (
          <div className="col-span-full py-12 text-center text-muted-foreground">
            No active polls or market elections listed.
          </div>
        )}
      </div>

      {/* Create Poll Dialog */}
      <Dialog isOpen={isOpen} onClose={() => setIsOpen(false)} title="Create Opinion Poll / Market Vote">
        <form onSubmit={handleCreatePoll} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Poll Question / Vote Subject</Label>
            <Input required placeholder="e.g. Should we close Bara Tooti chowk for cars from 4 PM to 8 PM?" value={question} onChange={e => setQuestion(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Select
                label="Voting Type"
                options={[
                  { value: 'opinion', label: 'Opinion Poll' },
                  { value: 'decision', label: 'Binding Decision' },
                  { value: 'election', label: 'Committee Election' }
                ]}
                value={type}
                onChange={e => setType(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Select
                label="Poll Running Duration"
                options={[
                  { value: '3', label: '3 Days' },
                  { value: '7', label: '1 Week' },
                  { value: '14', label: '2 Weeks' }
                ]}
                value={duration}
                onChange={e => setDuration(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Poll Options (One option per line)</Label>
            <Textarea required rows={4} placeholder="e.g. Yes, block cars completely\nNo, allow full vehicle traffic\nOnly block cars on weekends" value={optionsStr} onChange={e => setOptionsStr(e.target.value)} />
          </div>

          <div className="flex items-center gap-2 py-2">
            <input 
              type="checkbox" 
              id="anon-check"
              checked={anonymous} 
              onChange={e => setAnonymous(e.target.checked)} 
              className="w-4 h-4 text-primary"
            />
            <Label htmlFor="anon-check" className="cursor-pointer select-none">Enforce Anonymous Voting (Hide trader identities)</Label>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={submitting}>
              {submitting ? 'Creating...' : 'Launch Voting Board'}
            </Button>
          </div>
        </form>
      </Dialog>

    </div>
  );
};
