import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDateShort, getMonthName, getYearOptions } from '../../utils/dateHelpers';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Loader2, Filter, Plus, X } from 'lucide-react';

export default function PaymentHistory() {
  const [payments, setPayments] = useState([]);
  const [summary, setSummary] = useState({ totalPaid: 0, totalDue: 0, count: 0 });
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState('');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  
  // Add payment modal state
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    year: new Date().getFullYear().toString(),
    month: (new Date().getMonth() + 1).toString(),
    amount: '',
    method: 'CASH',
    note: ''
  });

  const years = getYearOptions(2020);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const res = await api.get('/payments/my', { params: { year } });
      setPayments(res.data.payments);
      setSummary(res.data.summary);
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
    fetchPayments();
  }, [year]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      await api.post('/payments/submit', formData);
      setShowModal(false);
      setFormData({ ...formData, amount: '', note: '' });
      fetchPayments();
    } catch (error) {
      alert(error.response?.data?.message || 'পেমেন্ট যোগ করতে সমস্যা হয়েছে');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Pagination logic
  const totalPages = Math.ceil(payments.length / itemsPerPage);
  const currentPayments = payments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary font-bangla-display">পেমেন্ট হিস্ট্রি</h1>
          <p className="text-sm text-text-secondary font-bangla mt-1">আপনার সকল পেমেন্টের তালিকা</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowModal(true)}
            className="hidden sm:flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-xl transition-colors font-bangla text-sm shadow-sm"
          >
            <Plus className="w-4 h-4" />
            পেমেন্ট যোগ করুন
          </button>
          
          <div className="flex items-center gap-3 bg-white p-2 rounded-xl border border-border shadow-sm">
            <Filter className="w-5 h-5 text-text-muted ml-2" />
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="bg-transparent border-none focus:ring-0 text-sm font-bangla cursor-pointer pr-8"
            >
              <option value="">সব বছর</option>
              {years.map(y => (
                <option key={y} value={y}>{y} সাল</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-secondary/10 border border-secondary/20 rounded-2xl p-4">
          <p className="text-sm font-medium text-secondary font-bangla">মোট জমা</p>
          <h3 className="text-2xl font-bold text-secondary mt-1">{formatCurrency(summary.totalPaid)}</h3>
        </div>
        <div className="bg-text-muted/10 border border-border rounded-2xl p-4">
          <p className="text-sm font-medium text-text-secondary font-bangla">মোট কিস্তি</p>
          <h3 className="text-2xl font-bold text-text-primary mt-1">{summary.count} টি</h3>
        </div>
      </div>

      <Card>
        {/* Desktop View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-surface-alt/50 border-b border-border">
                <th className="px-6 py-4 text-sm font-semibold text-text-secondary font-bangla">মাস/বছর</th>
                <th className="px-6 py-4 text-sm font-semibold text-text-secondary font-bangla">তারিখ</th>
                <th className="px-6 py-4 text-sm font-semibold text-text-secondary font-bangla">পরিমাণ</th>
                <th className="px-6 py-4 text-sm font-semibold text-text-secondary font-bangla text-right">স্ট্যাটাস</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center">
                    <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
                  </td>
                </tr>
              ) : currentPayments.length > 0 ? (
                currentPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-surface-hover transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-surface-alt flex flex-col items-center justify-center flex-shrink-0 border border-border">
                          <span className="text-xs font-bold text-text-primary">{payment.month}</span>
                          <span className="text-[10px] text-text-secondary">{payment.year}</span>
                        </div>
                        <div>
                          <p className="font-semibold text-sm font-bangla">{getMonthName(payment.month)} {payment.year}</p>
                          <p className="text-xs text-text-muted">{payment.note || 'মাসিক চাঁদা'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-text-primary">{formatDateShort(payment.paidDate)}</td>
                    <td className="px-6 py-4 text-sm font-bold text-text-primary">{formatCurrency(payment.amount)}</td>
                    <td className="px-6 py-4 text-right">
                      <Badge variant={payment.status.toLowerCase()}>{payment.status}</Badge>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-text-muted font-bangla">
                    কোনো পেমেন্ট রেকর্ড পাওয়া যায়নি।
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View */}
        <div className="block md:hidden divide-y divide-border">
          {loading ? (
            <div className="px-6 py-12 text-center">
              <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
            </div>
          ) : currentPayments.length > 0 ? (
            currentPayments.map((payment) => (
              <div key={payment.id} className="p-4 hover:bg-surface-hover/30 transition-colors flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-surface-alt flex flex-col items-center justify-center border border-border flex-shrink-0">
                      <span className="text-[10px] font-bold text-text-primary">{payment.month}</span>
                      <span className="text-[8px] text-text-secondary">{payment.year}</span>
                    </div>
                    <div>
                      <p className="font-semibold text-sm font-bangla">{getMonthName(payment.month)} {payment.year}</p>
                      <p className="text-[11px] text-text-muted">{payment.note || 'মাসিক চাঁদা'}</p>
                    </div>
                  </div>
                  <Badge variant={payment.status.toLowerCase()}>{payment.status}</Badge>
                </div>
                <div className="flex items-center justify-between mt-1 pt-1 border-t border-border/30">
                  <span className="text-xs text-text-muted">তারিখ: {formatDateShort(payment.paidDate)}</span>
                  <span className="text-sm font-bold text-text-primary">{formatCurrency(payment.amount)}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="px-6 py-12 text-center text-text-muted font-bangla text-sm">
              কোনো পেমেন্ট রেকর্ড পাওয়া যায়নি।
            </div>
          )}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-surface-alt/30">
            <p className="text-sm text-text-muted font-bangla">
              মোট {payments.length} টির মধ্যে {((currentPage - 1) * itemsPerPage) + 1} থেকে {Math.min(currentPage * itemsPerPage, payments.length)} দেখাচ্ছে
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm font-bangla border border-border rounded-lg bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface-hover transition-colors text-text-secondary"
              >
                পূর্ববর্তী
              </button>
              <span className="text-sm font-semibold text-primary px-2">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm font-bangla border border-border rounded-lg bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface-hover transition-colors text-text-secondary"
              >
                পরবর্তী
              </button>
            </div>
          </div>
        )}
      </Card>

      {/* Mobile Floating Action Button (FAB) */}
      <button
        onClick={() => setShowModal(true)}
        className="sm:hidden fixed bottom-20 right-6 z-40 bg-primary text-white w-14 h-14 rounded-full shadow-lg shadow-primary/40 flex items-center justify-center hover:bg-primary/90 active:scale-95 transition-all"
        title="পেমেন্ট যোগ করুন"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Add Payment Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center p-5 border-b border-border bg-surface-alt/30">
              <h2 className="text-xl font-bold font-bangla text-text-primary">নতুন পেমেন্ট যোগ করুন</h2>
              <button 
                onClick={() => setShowModal(false)}
                className="text-text-muted hover:text-danger transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-text-secondary font-bangla">বছর</label>
                  <select 
                    value={formData.year}
                    onChange={(e) => setFormData({...formData, year: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-bangla"
                    required
                  >
                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-text-secondary font-bangla">মাস</label>
                  <select 
                    value={formData.month}
                    onChange={(e) => setFormData({...formData, month: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-bangla"
                    required
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                      <option key={m} value={m}>{getMonthName(m)}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="space-y-1">
                <label className="text-sm font-medium text-text-secondary font-bangla">পরিমাণ (৳)</label>
                <input 
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  placeholder="যেমন: 500"
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-bangla"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-text-secondary font-bangla">পেমেন্ট মেথড</label>
                <select 
                  value={formData.method}
                  onChange={(e) => setFormData({...formData, method: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-bangla"
                >
                  <option value="CASH">ক্যাশ</option>
                  <option value="BKASH">বিকাশ</option>
                  <option value="NAGAD">নগদ</option>
                  <option value="BANK">ব্যাংক</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-text-secondary font-bangla">নোট (ঐচ্ছিক)</label>
                <input 
                  type="text"
                  value={formData.note}
                  onChange={(e) => setFormData({...formData, note: e.target.value})}
                  placeholder="যেমন: মাসিক চাঁদা"
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-bangla"
                />
              </div>
              
              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-border text-text-secondary font-medium font-bangla hover:bg-surface-hover transition-colors"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-primary text-white font-medium font-bangla hover:bg-primary/90 transition-colors flex justify-center items-center"
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'সাবমিট করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
