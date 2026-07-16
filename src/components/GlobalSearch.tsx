import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useTenant } from '../context/TenantContext';
import { dataService } from '../services/dataService';

interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  category: 'member' | 'announcement' | 'campaign' | 'complaint' | 'meeting' | 'business_post';
  link: string;
}

export const GlobalSearch: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { t } = useLanguage();
  const { tenantId } = useTenant();
  const navigate = useNavigate();
  const [queryVal, setQueryVal] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQueryVal('');
      setResults([]);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    if (!queryVal.trim() || !tenantId) {
      setResults([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      const q = queryVal.toLowerCase();
      const accumResults: SearchResult[] = [];

      try {
        // 1. Query Members
        const members = await dataService.getMemberships(tenantId);
        members.forEach(m => {
          if (
            m.shopName.toLowerCase().includes(q) ||
            m.ownerName.toLowerCase().includes(q) ||
            m.category.toLowerCase().includes(q)
          ) {
            accumResults.push({
              id: m.id,
              title: m.shopName,
              subtitle: `Member: ${m.ownerName} (${m.category})`,
              category: 'member',
              link: `/directory?search=${encodeURIComponent(m.shopName)}`
            });
          }
        });

        // 2. Query Announcements
        const anns = await dataService.getAnnouncements(tenantId);
        anns.forEach(a => {
          if (a.title.toLowerCase().includes(q) || a.content.toLowerCase().includes(q)) {
            accumResults.push({
              id: a.id,
              title: a.title,
              subtitle: `Announcement â€¢ ${new Date(a.createdAt).toLocaleDateString()}`,
              category: 'announcement',
              link: `/announcements`
            });
          }
        });

        // 3. Query Campaigns
        const camps = await dataService.getCampaigns(tenantId);
        camps.forEach(c => {
          if (c.title.toLowerCase().includes(q) || c.description.toLowerCase().includes(q)) {
            accumResults.push({
              id: c.id,
              title: c.title,
              subtitle: `Campaign â€¢ Status: ${c.status}`,
              category: 'campaign',
              link: `/campaigns`
            });
          }
        });

        // 4. Query Complaints
        const comps = await dataService.getComplaints(tenantId);
        comps.forEach(c => {
          if (c.title.toLowerCase().includes(q) || c.description.toLowerCase().includes(q)) {
            accumResults.push({
              id: c.id,
              title: c.title,
              subtitle: `Complaint â€¢ Raised by: ${c.userName} (${c.status})`,
              category: 'complaint',
              link: `/complaints`
            });
          }
        });

        // 5. Query Meetings
        const meets = await dataService.getMeetings(tenantId);
        meets.forEach(m => {
          if (m.title.toLowerCase().includes(q) || m.agenda.some((a: string) => a.toLowerCase().includes(q))) {
            accumResults.push({
              id: m.id,
              title: m.title,
              subtitle: `Meeting â€¢ Venue: ${m.venue}`,
              category: 'meeting',
              link: `/meetings`
            });
          }
        });

        // 6. Query Business classifieds
        const posts = await dataService.getBusinessPosts(tenantId);
        posts.forEach(p => {
          if (p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)) {
            accumResults.push({
              id: p.id,
              title: p.title,
              subtitle: `Business Offer â€¢ ${p.shopName}`,
              category: 'business_post',
              link: `/business`
            });
          }
        });

        setResults(accumResults.slice(0, 15)); // Limit to 15 total items
      } catch (err) {
        console.error('Error during global search query:', err);
      }
    }, 200);

    return () => clearTimeout(delayDebounce);
  }, [queryVal, tenantId]);

  if (!isOpen) return null;

  const getBadgeColor = (category: string) => {
    switch (category) {
      case 'member': return 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20';
      case 'announcement': return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
      case 'campaign': return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20';
      case 'complaint': return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20';
      case 'meeting': return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
      default: return 'bg-zinc-500/10 text-zinc-600 border-zinc-500/20';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      {/* Palette Wrapper */}
      <div className="bg-card text-card-foreground border shadow-2xl rounded-xl w-full max-w-2xl overflow-hidden relative z-10 animate-in fade-in slide-in-from-top-4 duration-200">
        <div className="flex items-center border-b px-4 py-3 bg-muted/30">
          <span className="text-xl mr-2 text-muted-foreground">ðŸ”</span>
          <input
            ref={inputRef}
            type="text"
            placeholder="Search files, meetings, announcements, shops, complaints..."
            className="w-full bg-transparent border-0 focus:outline-none focus:ring-0 text-base"
            value={queryVal}
            onChange={(e) => setQueryVal(e.target.value)}
          />
          <button 
            onClick={onClose} 
            className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded border shadow-sm"
          >
            ESC
          </button>
        </div>

        {/* Results Box */}
        <div className="max-h-[60vh] overflow-y-auto p-2">
          {queryVal.trim() === '' ? (
            <div className="p-8 text-center text-muted-foreground text-sm space-y-2">
              <p>Type to search the entire Vyapar Mandal Operating System.</p>
              <div className="flex gap-2 justify-center text-xs text-muted-foreground/60">
                <span>âš¡ Member Directory</span>
                <span>â€¢</span>
                <span>ðŸ“‹ Complaints</span>
                <span>â€¢</span>
                <span>ðŸ¤ Campaigns</span>
              </div>
            </div>
          ) : results.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              No results found matching "{queryVal}"
            </div>
          ) : (
            <div className="space-y-1">
              {results.map((res) => (
                <div
                  key={res.id}
                  onClick={() => {
                    navigate(res.link);
                    onClose();
                  }}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-primary/5 dark:hover:bg-primary/10 cursor-pointer transition-colors border border-transparent hover:border-primary/20"
                >
                  <div>
                    <h5 className="font-semibold text-sm line-clamp-1">{res.title}</h5>
                    <p className="text-xs text-muted-foreground line-clamp-1">{res.subtitle}</p>
                  </div>
                  <span className={`text-[10px] uppercase font-black px-2 py-0.5 rounded border ${getBadgeColor(res.category)}`}>
                    {res.category.replace('_', ' ')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

