import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { getYearOptions } from '../../utils/dateHelpers';
import { Card, CardBody } from '../../components/ui/Card';

// Skeleton row
const SkeletonRow = () => (
  <tr className="animate-pulse">
    <td className="py-3 px-4"><div className="h-4 bg-gray-200 rounded w-24" /></td>
    {Array.from({length: 12}, (_, i) => (
      <td key={i} className="py-3 px-2 text-center"><div className="h-4 bg-gray-200 rounded w-8 mx-auto" /></td>
    ))}
    <td className="py-3 px-4"><div className="h-4 bg-gray-200 rounded w-16 mx-auto" /></td>
  </tr>
);

export default function DuesStatus() {
  const [paymentSummary, setPaymentSummary] = useState([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const years = getYearOptions(2020);

  useEffect(() => {
    const fetchData = async (year) => {
      setLoading(true);
      try {
        // Single API call — /payments/summary already includes payments data
        // and /users already includes totalDue
        const psRes = await api.get('/payments/summary', { params: { year } });
        setPaymentSummary(psRes.data.summary || []);
      } catch (error) {
        console.error('Error fetching dues status:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData(selectedYear);
  }, [selectedYear]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-text-primary font-bangla-display">মাসিক বকেয়া স্ট্যাটাস</h1>
          <p className="text-sm text-text-secondary font-bangla mt-1">মেম্বারদের মাস-ভিত্তিক জমা ও বকেয়া রিপোর্ট</p>
        </div>
        <select 
          value={selectedYear} 
          onChange={(e) => setSelectedYear(Number(e.target.value))}
          className="border border-border rounded-xl px-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 text-text-primary font-bangla cursor-pointer"
        >
          {years.map(y => (
            <option key={y} value={y}>{y} সাল</option>
          ))}
        </select>
      </div>

      <Card className="mt-6">
        <div className="px-5 py-4 border-b border-border bg-surface-alt/30">
          <h3 className="font-semibold font-bangla text-lg">মেম্বারদের মাস-ভিত্তিক জমা ও বকেয়া (Month-wise Status)</h3>
        </div>
        <CardBody className="p-0 overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-primary/5 border-b-2 border-primary">
                <th className="py-3 px-4 font-bold text-sm min-w-[150px]">মেম্বার (Member)</th>
                {Array.from({length: 12}, (_, i) => i + 1).map(m => (
                  <th key={m} className="py-3 px-2 font-bold text-xs text-center">
                    {new Date(2000, m-1, 1).toLocaleString('bn-BD', { month: 'short' })}
                  </th>
                ))}
                <th className="py-3 px-4 font-bold text-sm text-center min-w-[120px] border-l-2 border-primary bg-danger/10 text-danger">মোট বকেয়া</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                Array.from({length: 5}, (_, i) => <SkeletonRow key={i} />)
              ) : (
                paymentSummary.map((user) => {
                  const joinDate = new Date(user.joinDate);
                  const joinYear = joinDate.getFullYear();
                  const joinMonth = joinDate.getMonth() + 1;
                  const now = new Date();
                  const currentYear = now.getFullYear();
                  const currentMonth = now.getMonth() + 1;

                  // Calculate totalDue from payment data
                  let totalDue = 0;
                  const startYear2 = Math.max(joinYear, 2025);
                  const startMonth2 = (startYear2 === 2025 && joinMonth <= 9) ? 9 : joinMonth;
                  
                  for (let m = 1; m <= 12; m++) {
                    const isBeforeJoin = selectedYear < joinYear || (selectedYear === joinYear && m < joinMonth);
                    const isFuture = selectedYear > currentYear || (selectedYear === currentYear && m > currentMonth);
                    const isBeforeSystemStart = selectedYear < 2025 || (selectedYear === 2025 && m < 9);
                    
                    if (!isBeforeJoin && !isFuture && !isBeforeSystemStart) {
                      const payment = user.payments?.find(p => p.month === m && p.status === 'PAID');
                      const paid = payment ? payment.amount : 0;
                      const due = Math.max(0, user.monthlyAmount - paid);
                      totalDue += due;
                    }
                  }

                  return (
                    <tr key={user.id} className="hover:bg-surface-hover transition-colors">
                      <td className="py-3 px-4 font-medium font-bangla border-r border-border/50">
                        {user.name}
                      </td>
                      {Array.from({length: 12}, (_, i) => i + 1).map(month => {
                        const isBeforeJoin = selectedYear < joinYear || (selectedYear === joinYear && month < joinMonth);
                        const isFuture = selectedYear > currentYear || (selectedYear === currentYear && month > currentMonth);
                        
                        if (isBeforeJoin) {
                          return <td key={month} className="py-3 px-2 text-center text-xs text-text-muted bg-surface-alt/30">-</td>;
                        }
                        if (isFuture) {
                          return <td key={month} className="py-3 px-2 text-center text-xs text-text-muted">-</td>;
                        }

                        const payment = user.payments?.find(p => p.month === month && p.status === 'PAID');
                        const paid = payment ? payment.amount : 0;
                        const isBeforeSystemStart = selectedYear < 2025 || (selectedYear === 2025 && month < 9);
                        let expected = isBeforeSystemStart ? 0 : user.monthlyAmount;
                        let due = Math.max(0, expected - paid);

                        if (paid === 0 && due === 0) {
                          return <td key={month} className="py-3 px-2 text-center text-xs text-text-muted bg-surface-alt/10">-</td>;
                        }

                        return (
                          <td key={month} className="py-3 px-2 text-center text-xs border-r border-border/20 last:border-0">
                            {due > 0 ? (
                              <div className="flex flex-col items-center">
                                {paid > 0 && <span className="text-secondary font-bold text-[10px] mb-1" title={`Paid: ৳${paid}`}>✓ {paid / 1000}k</span>}
                                <span className="inline-flex items-center justify-center w-full h-full text-danger font-bold bg-danger/5 rounded px-1" title={`Due: ৳${due}`}>
                                  বকেয়া {paid > 0 ? `(${due})` : ''}
                                </span>
                              </div>
                            ) : (
                              <span className="inline-flex items-center justify-center w-full h-full text-secondary font-bold" title={`Paid: ৳${paid}`}>
                                ✓ {paid / 1000}k
                              </span>
                            )}
                          </td>
                        );
                      })}
                      <td className="py-3 px-4 text-center font-bold text-danger border-l-2 border-primary/20 bg-danger/5">
                        {totalDue > 0 ? `৳${totalDue}` : '-'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </CardBody>
      </Card>
    </div>
  );
}
