import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTenant } from '../context/TenantContext';
import { useLanguage } from '../context/LanguageContext';
import { dataService } from '../services/dataService';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, Input, Label, Select, Badge, Dialog } from '../components/ui/CustomUI';

export const DocumentLibrary: React.FC = () => {
  const { user, membership, isAdmin } = useAuth();
  const { tenantId } = useTenant();
  const { t } = useLanguage();

  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');

  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('circular');
  const [fileSize, setFileSize] = useState('450 KB');
  const [version, setVersion] = useState('1.0');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!tenantId) return;
    setLoading(true);
    dataService.getDocuments(tenantId).then(setDocuments).finally(() => {
      setLoading(false);
    });
  }, [tenantId]);

  const handleCreateDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !tenantId) return;
    setSubmitting(true);

    const docInfo = {
      associationId: tenantId,
      title,
      category,
      fileUrl: '#',
      fileSize,
      fileType: 'pdf',
      version,
      downloadCount: 0,
      createdAt: new Date().toISOString()
    };

    try {
      await dataService.createDocument(docInfo);
      const list = await dataService.getDocuments(tenantId);
      setDocuments(list);
      setIsOpen(false);
      setTitle('');
    } catch (err) {
      console.error(err);
      alert('Failed to register document');
    } finally {
      setSubmitting(false);
    }
  };

  const incrementDownload = async (docId: string) => {
    const list = [...documents];
    const idx = list.findIndex(d => d.id === docId);
    if (idx !== -1) {
      list[idx].downloadCount = (list[idx].downloadCount || 0) + 1;
      setDocuments(list);
      
      // Update in DB (simplified mock update)
      if (tenantId) {
        try {
          // Mock or DB increment
          const allDocs = JSON.parse(localStorage.getItem('vyapar_documents') || '[]');
          const docItem = allDocs.find((d: any) => d.id === docId);
          if (docItem) {
            docItem.downloadCount = (docItem.downloadCount || 0) + 1;
            localStorage.setItem('vyapar_documents', JSON.stringify(allDocs));
          }
        } catch (err) {
          console.error(err);
        }
      }
    }
  };

  const categories = ['all', 'constitution', 'membership_form', 'gov_order', 'circular'];

  const filteredDocs = documents.filter(docItem => 
    activeCategory === 'all' || docItem.category === activeCategory
  );

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black tracking-tight">{t('documents')}</h1>
          <p className="text-muted-foreground text-sm">
            Download constitution flyers, blank membership forms, GSTR schedules, and local municipal circular orders.
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => setIsOpen(true)} className="rounded-xl font-bold shadow-lg shadow-primary/10">
            ➕ Register File
          </Button>
        )}
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 border-b">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-1.5 rounded-full text-xs font-black uppercase border transition-all ${
              activeCategory === cat 
                ? 'bg-primary text-primary-foreground border-primary shadow-md shadow-primary/10' 
                : 'bg-card text-muted-foreground hover:text-foreground'
            }`}
          >
            {cat.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Documents List */}
      <div className="space-y-4">
        {filteredDocs.map((docItem) => (
          <Card key={docItem.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-start gap-4">
                <div className="text-3xl shrink-0">📄</div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-extrabold text-sm sm:text-base text-foreground leading-snug">{docItem.title}</h3>
                    <Badge variant="outline">{docItem.category.replace('_', ' ')}</Badge>
                  </div>
                  <div className="text-[10px] text-muted-foreground flex gap-3 mt-1.5 font-mono">
                    <span>Size: {docItem.fileSize}</span>
                    <span>•</span>
                    <span>Version: {docItem.version}</span>
                    <span>•</span>
                    <span>Downloads: {docItem.downloadCount || 0}</span>
                  </div>
                </div>
              </div>

              <div className="w-full sm:w-auto shrink-0 flex items-center justify-end">
                <a 
                  href={docItem.fileUrl} 
                  onClick={() => incrementDownload(docItem.id)}
                  className="w-full sm:w-auto inline-flex justify-center items-center py-2.5 px-5 bg-secondary text-secondary-foreground hover:bg-secondary/80 font-bold rounded-lg text-xs transition-all border shadow-sm"
                >
                  📥 Download PDF
                </a>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredDocs.length === 0 && (
          <div className="py-12 text-center text-muted-foreground">
            No downloadable documents listed in this section.
          </div>
        )}
      </div>

      {/* Register File Dialog */}
      <Dialog isOpen={isOpen} onClose={() => setIsOpen(false)} title="Register Association File / Form">
        <form onSubmit={handleCreateDocument} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Document / Flyer Title</Label>
            <Input required placeholder="e.g. GSTR Compliance Circular Dec 2026" value={title} onChange={e => setTitle(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Select
                label="File Category"
                options={[
                  { value: 'circular', label: 'Mandal Circular' },
                  { value: 'constitution', label: 'Association Constitution' },
                  { value: 'membership_form', label: 'Membership Forms' },
                  { value: 'gov_order', label: 'Municipal Government Circular' }
                ]}
                value={category}
                onChange={e => setCategory(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>File Size</Label>
              <Input required placeholder="e.g. 1.2 MB or 450 KB" value={fileSize} onChange={e => setFileSize(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Version Tag</Label>
            <Input required placeholder="e.g. 1.0 or 2.1" value={version} onChange={e => setVersion(e.target.value)} />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={submitting}>
              {submitting ? 'Registering...' : 'Publish Document'}
            </Button>
          </div>
        </form>
      </Dialog>

    </div>
  );
};
