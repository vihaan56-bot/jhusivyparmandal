import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTenant } from '../context/TenantContext';
import { useLanguage } from '../context/LanguageContext';
import { dataService } from '../services/dataService';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, Input, Label, Select, Dialog } from '../components/ui/CustomUI';

export const MemberDirectory: React.FC = () => {
  const { tenantId } = useTenant();
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  
  const [members, setMembers] = useState<any[]>([]);
  const [searchVal, setSearchVal] = useState(searchParams.get('search') || '');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedMember, setSelectedMember] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tenantId) return;
    setLoading(true);
    dataService.getMemberships(tenantId).then(list => {
      // Only show approved/active members in directory
      setMembers(list.filter(m => m.status === 'active'));
    }).finally(() => {
      setLoading(false);
    });
  }, [tenantId]);

  // Extract unique categories for filter dropdown
  const categories = ['all', ...Array.from(new Set(members.map(m => m.category)))];

  const filteredMembers = members.filter(m => {
    const q = searchVal.toLowerCase();
    const matchQuery = 
      m.shopName.toLowerCase().includes(q) ||
      m.ownerName.toLowerCase().includes(q) ||
      m.address.toLowerCase().includes(q) ||
      (m.gstNumber && m.gstNumber.toLowerCase().includes(q));

    const matchCategory = categoryFilter === 'all' || m.category === categoryFilter;

    return matchQuery && matchCategory;
  });

  if (loading) {
    return <div className="text-center py-12">{t('loading')}</div>;
  }

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black tracking-tight">{t('directory')}</h1>
        <p className="text-muted-foreground text-sm">
          Browse and connect with registered trade businesses in the market.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <Card className="bg-card">
        <CardContent className="p-4 flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Label>Search Shop, Owner, Address or GST</Label>
            <Input
              type="text"
              placeholder="Search (e.g. Ramesh, Gold, Bara Tooti)..."
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              className="mt-1"
            />
          </div>
          <div className="w-full md:w-60">
            <Select
              label="Filter by Business Category"
              options={categories.map(cat => ({ value: cat, label: cat === 'all' ? 'All Categories' : cat }))}
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Grid of Members */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMembers.map((member) => (
          <Card 
            key={member.id} 
            className="hover:scale-[1.01] transition-all cursor-pointer border flex flex-col justify-between"
            onClick={() => setSelectedMember(member)}
          >
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start gap-2">
                <span className="text-[10px] font-black uppercase text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full">
                  {member.category}
                </span>
                <span className="text-[10px] font-mono text-muted-foreground">{member.membershipCardNumber}</span>
              </div>
              <CardTitle className="text-lg font-black text-foreground mt-2 line-clamp-1">
                {member.shopName}
              </CardTitle>
              <CardDescription className="text-xs font-semibold text-muted-foreground">
                👤 {member.ownerName}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="text-xs space-y-2 text-muted-foreground py-2 flex-1">
              <p className="line-clamp-2">📍 {member.address}</p>
              {member.gstNumber && <p className="font-mono">GST: {member.gstNumber}</p>}
            </CardContent>

            {/* Quick Contact buttons to replace WhatsApp chaos */}
            <div className="p-4 border-t bg-muted/10 grid grid-cols-2 gap-2" onClick={(e) => e.stopPropagation()}>
              <a 
                href={`tel:${member.phone.replace(/\s+/g, '')}`}
                className="inline-flex justify-center items-center py-2 border rounded-lg text-xs font-bold hover:bg-primary/5 transition-all text-center gap-1"
              >
                📞 Call Phone
              </a>
              <a 
                href={`https://wa.me/${member.phone.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex justify-center items-center py-2 border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/15 rounded-lg text-xs font-bold transition-all text-center gap-1"
              >
                💬 WhatsApp
              </a>
            </div>
          </Card>
        ))}

        {filteredMembers.length === 0 && (
          <div className="col-span-full py-12 text-center text-muted-foreground">
            No registered members found matching details.
          </div>
        )}
      </div>

      {/* Expanded Profile Dialog */}
      {selectedMember && (
        <Dialog 
          isOpen={!!selectedMember} 
          onClose={() => setSelectedMember(null)} 
          title={selectedMember.shopName}
        >
          <div className="space-y-6 text-sm">
            <div className="flex justify-between items-start border-b pb-4">
              <div>
                <span className="text-[10px] font-black uppercase text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full">
                  {selectedMember.category}
                </span>
                <h3 className="text-xl font-bold mt-2">{selectedMember.ownerName}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Card Number: {selectedMember.membershipCardNumber}</p>
              </div>
              <a 
                href={selectedMember.googleMapsLink || '#'} 
                target="_blank" 
                rel="noreferrer"
                className="text-xs text-blue-500 font-semibold hover:underline"
              >
                📍 View Map
              </a>
            </div>

            <div className="space-y-3">
              <div>
                <h4 className="font-bold text-foreground">Business Description</h4>
                <p className="text-muted-foreground leading-relaxed text-xs mt-1">
                  {selectedMember.businessDescription || 'No description provided by merchant.'}
                </p>
              </div>

              {selectedMember.gstNumber && (
                <div>
                  <h4 className="font-bold text-foreground">GST Identification</h4>
                  <span className="font-mono text-xs text-muted-foreground">{selectedMember.gstNumber}</span>
                </div>
              )}

              {/* Products list */}
              {selectedMember.products && selectedMember.products.length > 0 && (
                <div>
                  <h4 className="font-bold text-foreground">Key Products</h4>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {selectedMember.products.map((p: string, idx: number) => (
                      <span key={idx} className="bg-muted text-muted-foreground text-xs px-2.5 py-0.5 rounded-full border">
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Services list */}
              {selectedMember.services && selectedMember.services.length > 0 && (
                <div>
                  <h4 className="font-bold text-foreground">Offered Services</h4>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {selectedMember.services.map((s: string, idx: number) => (
                      <span key={idx} className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Images gallery display inside profile modal */}
            {selectedMember.businessImages && selectedMember.businessImages.length > 0 && (
              <div className="space-y-2 border-t pt-4">
                <h4 className="font-bold text-foreground">Store & Product Gallery</h4>
                <div className="grid grid-cols-2 gap-2">
                  {selectedMember.businessImages.map((img: string, idx: number) => (
                    <img 
                      key={idx} 
                      src={img} 
                      alt="Store" 
                      className="w-full h-32 object-cover rounded-lg border shadow-sm"
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="border-t pt-4 grid grid-cols-2 gap-2">
              <a 
                href={`tel:${selectedMember.phone.replace(/\s+/g, '')}`}
                className="inline-flex justify-center items-center py-2.5 bg-primary text-primary-foreground hover:bg-primary/90 font-bold rounded-lg text-sm transition-all text-center gap-1 shadow-md shadow-primary/10"
              >
                📞 Call {selectedMember.phone}
              </a>
              <a 
                href={`https://wa.me/${selectedMember.phone.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex justify-center items-center py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg text-sm transition-all text-center gap-1 shadow-md shadow-emerald-500/10"
              >
                💬 Open WhatsApp
              </a>
            </div>
          </div>
        </Dialog>
      )}

    </div>
  );
};
