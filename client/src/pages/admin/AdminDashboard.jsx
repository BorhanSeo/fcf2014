import { useState, useEffect, useCallback } from 'react';
import api from '../../utils/api';
import { formatCurrency } from '../../utils/formatCurrency';
import { getYearOptions } from '../../utils/dateHelpers';
import { Card, CardBody } from '../../components/ui/Card';
import { Landmark, Users, TrendingUp, TrendingDown, CheckCircle, XCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { getMonthName, formatDateShort } from '../../utils/dateHelpers';

// ─── Skeleton placeholders ──────────────────────────────────────
const SkeletonBanner = () => (
  <div className="animate-pulse bg-gradient-to-r from-gray-300 to-gray-200 rounded-2xl p-6 h-28" />
);
const SkeletonChart = () => (
  <div className="animate-pulse bg-white rounded-2xl p-5 shadow-sm border border-gray-100 h-[400px]">
    <div className="h-5 bg-gray-200 rounded w-40 mb-4" />
    <div className="flex items-end gap-3 h-64 pt-4">
      {[60, 90, 40, 75, 55, 85, 45, 70, 50, 80].map((h, i) => (
        <div key={i} className="bg-gray-200 rounded-t flex-1" style={{ height: `${h}%` }} />
      ))}
    </div>
  </div>
);

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [pendingPayments, setPendingPayments] = useState([]);
  const years = getYearOptions(2020);

  const fetchDashboard = useCallback(async (year) => {
    setLoading(true);
    try {
      // Parallel fetch — previously sequential (2 round trips → 1)
      const [dashRes, pendingRes] = await Promise.all([
        api.get('/reports/admin-dashboard', { params: { year } }),
        api.get('/payments/pending'),
      ]);
      setData(dashRes.data);
      setPendingPayments(pendingRes.data.pendingPayments || []);
    } catch (e) {
      console.error('Dashboard error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard(selectedYear);
  }, [selectedYear, fetchDashboard]);

  const handleApprove = async (id) => {
    if (!window.confirm('আপনি কি এই পেমেন্টটি অনুমোদন করতে চান?')) return;
    // Optimistic: remove from pending list instantly
    setPendingPayments(prev => prev.filter(p => p.id !== id));
    try {
      await api.post(`/payments/${id}/approve`);
      fetchDashboard(selectedYear);
    } catch (error) {
      alert('অনুমোদন করতে সমস্যা হয়েছে');
      fetchDashboard(selectedYear); // Revert on error
    }
  };

  const handleReject = async (id) => {
    if (!window.confirm('আপনি কি এই পেমেন্টটি বাতিল করতে চান?')) return;
    // Optimistic: remove from pending list instantly
    setPendingPayments(prev => prev.filter(p => p.id !== id));
    try {
      await api.post(`/payments/${id}/reject`);
      fetchDashboard(selectedYear);
    } catch (error) {
      alert('বাতিল করতে সমস্যা হয়েছে');
      fetchDashboard(selectedYear); // Revert on error
    }
  };

  const balanceSheet = data?.balanceSheet;
  const summary = data?.summary || [];

  const membersFund = balanceSheet?.liabilitiesAndEquity?.membersFund || 0;
  const cumulativeIncome = balanceSheet?.cumulative?.totalIncome || 0;
  const cumulativeExpenses = balanceSheet?.cumulative?.totalExpenses || 0;
  const totalFCFFund = membersFund + cumulativeIncome - cumulativeExpenses;

  const chartData = summary
    .map(u => ({ name: u.name, Paid: u.totalPaid }))
    .sort((a, b) => b.Paid - a.Paid);

  const duesChartData = summary
    .filter(u => u.totalDue > 0)
    .map(u => ({ name: u.name, Due: u.totalDue }))
    .sort((a, b) => b.Due - a.Due);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-text-primary font-bangla-display">অ্যাডমিন ড্যাশবোর্ড</h1>
          <p className="text-sm text-text-secondary font-bangla mt-1">সামগ্রিক আর্থিক সারসংক্ষেপ</p>
        </div>
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(Number(e.target.value))}
          className="border border-border rounded-xl px-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 text-text-primary font-bangla cursor-pointer"
        >
          {years.map(y => <option key={y} value={y}>{y} সাল</option>)}
        </select>
      </div>

      {/* Total FCF Fund Banner & Group Fund Details Cards */}
      {loading ? (
        <div className="space-y-4">
          <SkeletonBanner />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="animate-pulse bg-white rounded-2xl p-5 h-24" />
            <div className="animate-pulse bg-white rounded-2xl p-5 h-24" />
            <div className="animate-pulse bg-white rounded-2xl p-5 h-24" />
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-primary to-secondary rounded-2xl p-6 text-white shadow-lg shadow-primary/20 flex items-center justify-between">
            <div className="flex items-center gap-5">
              <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm">
                <Landmark className="w-8 h-8 text-white" />
              </div>
              <div>
                <p className="text-primary-100 font-medium font-bangla text-sm">সর্বমোট ফান্ড (Total FCF Fund)</p>
                <h2 className="text-3xl md:text-4xl font-bold mt-1 tracking-tight">{formatCurrency(totalFCFFund)}</h2>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Members Fund Card */}
            <div className="rounded-2xl border border-blue-100 bg-blue-50/40 shadow-sm overflow-hidden">
              <div className="p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0 text-blue-700">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-blue-800/80 font-bangla">মোট মেম্বার ফান্ড</p>
                  <h3 className="text-2xl font-bold text-blue-900 mt-1">
                    {formatCurrency(membersFund)}
                  </h3>
                </div>
              </div>
            </div>

            {/* Cumulative Income Card */}
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 shadow-sm overflow-hidden">
              <div className="p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0 text-emerald-700">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-emerald-800/80 font-bangla">মোট আয়</p>
                  <h3 className="text-2xl font-bold text-emerald-900 mt-1">
                    +{formatCurrency(cumulativeIncome)}
                  </h3>
                </div>
              </div>
            </div>

            {/* Cumulative Expenses Card */}
            <div className="rounded-2xl border border-rose-100 bg-rose-50/40 shadow-sm overflow-hidden">
              <div className="p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-rose-100 flex items-center justify-center flex-shrink-0 text-rose-700">
                  <TrendingDown className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-rose-800/80 font-bangla">মোট খরচ</p>
                  <h3 className="text-2xl font-bold text-rose-900 mt-1">
                    -{formatCurrency(cumulativeExpenses)}
                  </h3>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pending Payments Section */}
      {!loading && pendingPayments.length > 0 && (
        <Card className="border-l-4 border-l-warning mt-6">
          <div className="px-5 py-4 border-b border-border bg-warning/5 flex items-center justify-between">
            <h3 className="font-bold font-bangla text-warning-dark">অপেক্ষমান পেমেন্ট ({pendingPayments.length})</h3>
          </div>
          {/* Desktop View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-surface-alt/30 border-b border-border">
                  <th className="px-5 py-3 text-sm font-semibold text-text-secondary font-bangla">সদস্য</th>
                  <th className="px-5 py-3 text-sm font-semibold text-text-secondary font-bangla">মাস/বছর</th>
                  <th className="px-5 py-3 text-sm font-semibold text-text-secondary font-bangla">পরিমাণ</th>
                  <th className="px-5 py-3 text-sm font-semibold text-text-secondary font-bangla">পদ্ধতি</th>
                  <th className="px-5 py-3 text-sm font-semibold text-text-secondary font-bangla text-right">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {pendingPayments.map(p => (
                  <tr key={p.id} className="hover:bg-surface-hover transition-colors">
                    <td className="px-5 py-3">
                      <p className="font-bold text-sm text-text-primary font-bangla">{p.user?.name}</p>
                      <p className="text-xs text-text-muted">{p.user?.phone || 'No phone'}</p>
                    </td>
                    <td className="px-5 py-3">
                      <p className="font-semibold text-sm font-bangla">{getMonthName(p.month)} {p.year}</p>
                      <p className="text-xs text-text-muted">{formatDateShort(p.createdAt)}</p>
                    </td>
                    <td className="px-5 py-3 font-bold text-text-primary">{formatCurrency(p.amount)}</td>
                    <td className="px-5 py-3">
                      <span className="text-xs font-semibold px-2 py-1 rounded bg-surface-alt border border-border">
                        {p.method}
                      </span>
                      {p.note && <p className="text-[10px] text-text-muted mt-1 truncate max-w-[120px]" title={p.note}>{p.note}</p>}
                    </td>
                    <td className="px-5 py-3 text-right flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handleApprove(p.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-success/10 text-success hover:bg-success hover:text-white rounded-lg transition-colors text-sm font-bangla font-medium"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>অনুমোদন</span>
                      </button>
                      <button 
                        onClick={() => handleReject(p.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-danger/10 text-danger hover:bg-danger hover:text-white rounded-lg transition-colors text-sm font-bangla font-medium"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>বাতিল</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile View */}
          <div className="block md:hidden divide-y divide-border">
            {pendingPayments.map(p => (
              <div key={p.id} className="p-4 hover:bg-surface-hover/30 transition-colors flex flex-col gap-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-text-primary font-bangla">{p.user?.name}</h4>
                    <p className="text-xs text-text-muted">{p.user?.phone || 'No phone'}</p>
                  </div>
                  <span className="text-sm font-bold text-text-primary">{formatCurrency(p.amount)}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <div>
                    <p className="font-semibold font-bangla text-text-secondary">{getMonthName(p.month)} {p.year}</p>
                    <p className="text-text-muted mt-0.5">{formatDateShort(p.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-surface-alt border border-border">
                      {p.method}
                    </span>
                    {p.note && <p className="text-[10px] text-text-muted mt-1 max-w-[120px] truncate" title={p.note}>{p.note}</p>}
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/30">
                  <button 
                    onClick={() => handleApprove(p.id)}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-success/10 text-success hover:bg-success hover:text-white rounded-lg transition-colors text-xs font-bangla font-medium"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>অনুমোদন</span>
                  </button>
                  <button 
                    onClick={() => handleReject(p.id)}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-danger/10 text-danger hover:bg-danger hover:text-white rounded-lg transition-colors text-xs font-bangla font-medium"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>বাতিল</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Dues Chart */}
        {loading ? <SkeletonChart /> : (
          <Card className="lg:col-span-1">
            <div className="px-5 py-4 border-b border-border flex justify-between items-center bg-surface-alt/30">
              <h3 className="font-semibold font-bangla text-danger">যাদের বকেয়া আছে</h3>
              <Users className="w-5 h-5 text-danger" />
            </div>
            <CardBody className="p-4 h-[350px] overflow-y-auto">
              {duesChartData.length > 0 ? (
                <div style={{ height: Math.max(300, duesChartData.length * 45) }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={duesChartData} margin={{ top: 10, right: 30, left: 10, bottom: 0 }} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e9ecef" />
                      <XAxis type="number" tick={{ fontSize: 11, fill: '#6c757d' }} axisLine={false} tickLine={false} tickFormatter={(val) => `৳${val / 1000}k`} />
                      <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 11, fill: '#6c757d', fontFamily: 'Hind Siliguri' }} axisLine={false} tickLine={false} interval={0} />
                      <Tooltip cursor={{ fill: '#f1f3f5' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} itemStyle={{ color: '#ef4444', fontWeight: 'bold' }} />
                      <Bar dataKey="Due" fill="#ef4444" radius={[0, 4, 4, 0]} barSize={20} animationDuration={1500} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-text-muted font-bangla">কোনো বকেয়া নেই!</div>
              )}
            </CardBody>
          </Card>
        )}

        {/* Member Contribution Chart */}
        {loading ? <SkeletonChart /> : (
          <Card className="lg:col-span-1">
            <div className="px-5 py-4 border-b border-border flex justify-between items-center bg-surface-alt/30">
              <h3 className="font-semibold font-bangla">মেম্বারদের জমার তুলনামূলক চিত্র</h3>
              <Users className="w-5 h-5 text-text-muted" />
            </div>
            <CardBody className="p-4 h-[350px] overflow-x-auto">
              <div style={{ width: Math.max(400, chartData.length * 60), height: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e9ecef" />
                    <XAxis dataKey="name" height={70} tick={{ fontSize: 11, fill: '#6c757d', fontFamily: 'Hind Siliguri' }} axisLine={false} tickLine={false} angle={-45} textAnchor="end" interval={0} />
                    <YAxis tick={{ fontSize: 11, fill: '#6c757d' }} axisLine={false} tickLine={false} tickFormatter={(val) => `৳${val / 1000}k`} />
                    <Tooltip cursor={{ fill: '#f1f3f5' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} itemStyle={{ color: '#00A48D', fontWeight: 'bold' }} />
                    <Bar dataKey="Paid" fill="#00A48D" radius={[4, 4, 0, 0]} barSize={32} animationDuration={1500} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  );
}
