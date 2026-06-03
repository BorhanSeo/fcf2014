import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDateShort } from '../../utils/dateHelpers';
import { Card, CardBody, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Loader2, Plus, TrendingUp, Save, Trash2 } from 'lucide-react';

export default function InvestmentManager() {
  const [investments, setInvestments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  
  // Form State
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [type, setType] = useState('ব্যবসা');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchInvestments = async () => {
    try {
      setLoading(true);
      const res = await api.get('/investments');
      setInvestments(res.data.investments);
    } catch (error) {
      console.error('Error fetching investments:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvestments();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/investments', {
        title, amount: parseFloat(amount), date, type, note
      });
      setShowForm(false);
      setTitle(''); setAmount(''); setNote('');
      fetchInvestments();
    } catch (error) {
      console.error('Error creating investment:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteInvestment = async (id) => {
    if (!window.confirm('আপনি কি নিশ্চিত যে এই বিনিয়োগটি মুছে ফেলতে চান?')) return;
    try {
      await api.delete(`/investments/${id}`);
      fetchInvestments();
    } catch (error) {
      console.error('Error deleting investment:', error);
      alert('বিনিয়োগ মুছতে সমস্যা হয়েছে');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary font-bangla-display">বিনিয়োগ ব্যবস্থাপনা</h1>
          <p className="text-sm text-text-secondary font-bangla mt-1">ফান্ডের সকল বিনিয়োগ এবং আয়ের হিসাব</p>
        </div>
        <Button icon={Plus} onClick={() => setShowForm(!showForm)}>
          {showForm ? 'বাতিল করুন' : 'নতুন বিনিয়োগ'}
        </Button>
      </div>

      {showForm && (
        <Card className="border-l-4 border-l-secondary animate-slide-in">
          <CardHeader>
            <CardTitle>নতুন বিনিয়োগ যোগ করুন</CardTitle>
          </CardHeader>
          <CardBody>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="বিনিয়োগের নাম/খাত" required value={title} onChange={e => setTitle(e.target.value)} />
                <Input label="পরিমাণ (৳)" type="number" required value={amount} onChange={e => setAmount(e.target.value)} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="তারিখ" type="date" required value={date} onChange={e => setDate(e.target.value)} />
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-text-primary font-bangla">ধরন</label>
                  <select
                    value={type} onChange={e => setType(e.target.value)}
                    className="w-full bg-white border border-border rounded-xl px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-primary focus:ring-1 font-bangla"
                  >
                    <option value="ব্যবসা">ব্যবসা</option>
                    <option value="শেয়ার বাজার">শেয়ার বাজার</option>
                    <option value="এফডিআর">এফডিআর</option>
                    <option value="অন্যান্য">অন্যান্য</option>
                  </select>
                </div>
              </div>
              <Input label="নোট" value={note} onChange={e => setNote(e.target.value)} />
              <div className="flex justify-end pt-2">
                <Button type="submit" loading={submitting} icon={Save} variant="secondary">সংরক্ষণ করুন</Button>
              </div>
            </form>
          </CardBody>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full py-12 flex justify-center">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : investments.length > 0 ? (
          investments.map((inv) => (
            <Card key={inv.id} className="flex flex-col">
              <CardBody className="flex-1 p-5">
                <div className="flex justify-between items-start mb-3">
                  <Badge variant={inv.status === 'ACTIVE' ? 'active' : 'closed'}>{inv.status}</Badge>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-text-muted">{formatDateShort(inv.date)}</span>
                    <button 
                      onClick={() => handleDeleteInvestment(inv.id)}
                      className="p-1 text-danger hover:bg-danger/10 rounded transition-colors"
                      title="মুছে ফেলুন"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <h3 className="text-lg font-bold text-text-primary font-bangla mb-1">{inv.title}</h3>
                <p className="text-sm text-text-secondary font-bangla mb-4">{inv.type}</p>
                
                <div className="space-y-2 pt-3 border-t border-border">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-text-muted font-bangla">বিনিয়োগের পরিমাণ:</span>
                    <span className="font-bold text-text-primary">{formatCurrency(inv.amount)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-text-muted font-bangla">মোট আয়/রিটার্ন:</span>
                    <span className="font-bold text-secondary">{formatCurrency(inv.returnAmount)}</span>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))
        ) : (
          <div className="col-span-full py-12 text-center text-text-muted font-bangla">
            কোনো বিনিয়োগের তথ্য পাওয়া যায়নি।
          </div>
        )}
      </div>
    </div>
  );
}
