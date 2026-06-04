import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDateShort, getMonthName, getYearOptions } from '../../utils/dateHelpers';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Loader2, Filter } from 'lucide-react';

export default function PaymentHistory() {
  const [payments, setPayments] = useState([]);
  const [summary, setSummary] = useState({ totalPaid: 0, totalDue: 0, count: 0 });
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState('');

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
    fetchPayments();
  }, [year]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary font-bangla-display">পেমেন্ট হিস্ট্রি</h1>
          <p className="text-sm text-text-secondary font-bangla mt-1">আপনার সকল পেমেন্টের তালিকা</p>
        </div>

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
        <div className="overflow-x-auto">
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
              ) : payments.length > 0 ? (
                payments.map((payment) => (
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
      </Card>
    </div>
  );
}
