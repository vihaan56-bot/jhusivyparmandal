import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTenant } from '../context/TenantContext';
import { useLanguage } from '../context/LanguageContext';
import { dataService } from '../services/dataService';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, Input, Label, Textarea, Select, Badge, Dialog } from '../components/ui/CustomUI';

export const Expenses: React.FC = () => {
  const { user, membership, isAdmin } = useAuth();
  const { tenantId } = useTenant();
  const { t } = useLanguage();

  const [ledger, setLedger] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  // New Transaction Form State
  const [type, setType] = useState('expense');
  const [category, setCategory] = useState('Safety & Security');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!tenantId) return;
    setLoading(true);
    dataService.getExpenses(tenantId).then(setLedger).finally(() => {
      setLoading(false);
    });
  }, [tenantId]);

  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !category || !description || !tenantId || !user) return;
    setSubmitting(true);

    const transaction = {
      associationId: tenantId,
      type,
      category,
      amount: parseFloat(amount),
      description,
      date,
      recordedBy: user.displayName || 'Treasurer Officer',
      createdAt: new Date().toISOString()
    };

    try {
      await dataService.createExpense(transaction);
      const list = await dataService.getExpenses(tenantId);
      setLedger(list);
      setIsOpen(false);
      setAmount('');
      setDescription('');
    } catch (err) {
      console.error(err);
      alert('Failed to log transaction');
    } finally {
      setSubmitting(false);
    }
  };

  // Summarize Ledger
  const totalIncome = ledger.filter(item => item.type === 'income').reduce((acc, curr) => acc + curr.amount, 0);
  const totalExpenses = ledger.filter(item => item.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0);
  const netBalance = totalIncome - totalExpenses;

  const categories = {
    income: ['Membership Dues', 'Donations', 'Sponsorships', 'Stall Bookings'],
    expense: ['Safety & Security', 'Legal & Advocacy', 'Events & Catering', 'Civic Repair Works', 'Office Rent & Stationery']
  };

  if (loading) {
    return <div className="text-center py-12">{t('loading')}</div>;
  }

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black tracking-tight">{t('expenses')}</h1>
          <p className="text-muted-foreground text-sm">
            Review transparent financial ledgers, member collection records, and advocacy spending logs.
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => setIsOpen(true)} className="rounded-xl font-bold shadow-lg shadow-primary/10">
            ➕ Log Transaction
          </Button>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-emerald-500/5 border-emerald-500/20 shadow-none">
          <CardContent className="p-6 text-center space-y-1">
            <span className="text-[10px] text-emerald-600 font-black uppercase tracking-wider block">Total Association Income</span>
            <div className="text-3xl font-black text-emerald-600">₹{totalIncome.toLocaleString('en-IN')}</div>
          </CardContent>
        </Card>

        <Card className="bg-red-500/5 border-red-500/20 shadow-none">
          <CardContent className="p-6 text-center space-y-1">
            <span className="text-[10px] text-red-600 font-black uppercase tracking-wider block">Total Expenditures</span>
            <div className="text-3xl font-black text-red-600">₹{totalExpenses.toLocaleString('en-IN')}</div>
          </CardContent>
        </Card>

        <Card className="bg-primary/5 border-primary/20 shadow-none">
          <CardContent className="p-6 text-center space-y-1">
            <span className="text-[10px] text-primary font-black uppercase tracking-wider block">Net Cash Balance</span>
            <div className={`text-3xl font-black ${netBalance >= 0 ? 'text-primary' : 'text-red-500'}`}>
              ₹{netBalance.toLocaleString('en-IN')}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ledger Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Ledger Statement</CardTitle>
          <CardDescription>Audited transaction statement of accounts.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-muted/50 border-y text-muted-foreground font-black uppercase tracking-wider text-[10px]">
                  <th className="p-4">Date</th>
                  <th className="p-4">Description</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4 text-right">Officer Recorded</th>
                </tr>
              </thead>
              <tbody className="divide-y font-semibold">
                {ledger.map((item) => (
                  <tr key={item.id} className="hover:bg-muted/30">
                    <td className="p-4 font-mono">{item.date}</td>
                    <td className="p-4 text-foreground">{item.description}</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase border ${
                        item.type === 'income' 
                          ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' 
                          : 'bg-red-500/10 text-red-600 border-red-500/20'
                      }`}>
                        {item.category}
                      </span>
                    </td>
                    <td className={`p-4 font-bold text-sm ${item.type === 'income' ? 'text-emerald-600' : 'text-red-600'}`}>
                      {item.type === 'income' ? '+' : '-'} ₹{item.amount.toLocaleString('en-IN')}
                    </td>
                    <td className="p-4 text-right text-muted-foreground">{item.recordedBy}</td>
                  </tr>
                ))}

                {ledger.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-muted-foreground">
                      No financial ledger statement logged.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Log Transaction Dialog */}
      <Dialog isOpen={isOpen} onClose={() => setIsOpen(false)} title="Log Financial Transaction Entry">
        <form onSubmit={handleCreateTransaction} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Select
                label="Transaction Type"
                options={[
                  { value: 'expense', label: 'Debit / Expense' },
                  { value: 'income', label: 'Credit / Income' }
                ]}
                value={type}
                onChange={e => {
                  setType(e.target.value);
                  setCategory(categories[e.target.value as 'income' | 'expense'][0]);
                }}
              />
            </div>
            <div className="space-y-1.5">
              <Select
                label="Accounting Category"
                options={type === 'income' 
                  ? categories.income.map(c => ({ value: c, label: c }))
                  : categories.expense.map(c => ({ value: c, label: c }))
                }
                value={category}
                onChange={e => setCategory(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Amount (INR ₹)</Label>
              <Input required type="number" placeholder="e.g. 15000" value={amount} onChange={e => setAmount(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Date of Transaction</Label>
              <Input required type="date" value={date} onChange={e => setDate(e.target.value)} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Transaction Description / Narration</Label>
            <Textarea required placeholder="Specify vendor name, billing references, and approval items..." value={description} onChange={e => setDescription(e.target.value)} />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={submitting}>
              {submitting ? 'Logging...' : 'Publish Ledger Entry'}
            </Button>
          </div>
        </form>
      </Dialog>

    </div>
  );
};
