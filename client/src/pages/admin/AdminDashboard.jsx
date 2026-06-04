import { useState, useEffect, useCallback } from 'react';
import api from '../../utils/api';
import { formatCurrency } from '../../utils/formatCurrency';
import { getYearOptions } from '../../utils/dateHelpers';
import { Card, CardBody } from '../../components/ui/Card';
import { Landmark, Users } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

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
  const years = getYearOptions(2020);

  const fetchDashboard = useCallback(async (year) => {
    setLoading(true);
    try {
      // ★ SINGLE API call — returns everything needed
      const res = await api.get('/reports/admin-dashboard', { params: { year } });
      setData(res.data);
    } catch (e) {
      console.error('Dashboard error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard(selectedYear);
  }, [selectedYear, fetchDashboard]);

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

      {/* Total FCF Fund Banner */}
      {loading ? <SkeletonBanner /> : (
        <div className="bg-gradient-to-r from-primary to-secondary rounded-2xl p-6 text-white shadow-lg shadow-primary/20 flex flex-col xl:flex-row items-center justify-between">
          <div className="flex items-center gap-5">
            <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm">
              <Landmark className="w-8 h-8 text-white" />
            </div>
            <div>
              <p className="text-primary-100 font-medium font-bangla text-sm">সর্বমোট ফান্ড (Total FCF Fund)</p>
              <h2 className="text-3xl md:text-4xl font-bold mt-1 tracking-tight">{formatCurrency(totalFCFFund)}</h2>
            </div>
          </div>
          <div className="mt-5 xl:mt-0 flex flex-wrap gap-4 md:gap-6 text-sm font-bangla bg-black/10 px-6 py-4 rounded-xl backdrop-blur-sm border border-white/10">
            <div>
              <p className="text-primary-100 mb-1">মোট মেম্বার ফান্ড</p>
              <p className="font-bold text-lg">{formatCurrency(membersFund)}</p>
            </div>
            <div className="w-px bg-white/20 hidden md:block" />
            <div>
              <p className="text-primary-100 mb-1">মোট আয়</p>
              <p className="font-bold text-lg text-green-300">+{formatCurrency(cumulativeIncome)}</p>
            </div>
            <div className="w-px bg-white/20 hidden md:block" />
            <div>
              <p className="text-primary-100 mb-1">মোট খরচ</p>
              <p className="font-bold text-lg text-red-300">-{formatCurrency(cumulativeExpenses)}</p>
            </div>
          </div>
        </div>
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
                <div style={{ height: Math.max(300, duesChartData.length * 40) }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={duesChartData} margin={{ top: 10, right: 30, left: 10, bottom: 0 }} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e9ecef" />
                      <XAxis type="number" tick={{ fontSize: 11, fill: '#6c757d' }} axisLine={false} tickLine={false} tickFormatter={(val) => `৳${val / 1000}k`} />
                      <YAxis dataKey="name" type="category" width={110} tick={{ fontSize: 11, fill: '#6c757d', fontFamily: 'Hind Siliguri' }} axisLine={false} tickLine={false} />
                      <Tooltip cursor={{ fill: '#f1f3f5' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} itemStyle={{ color: '#ef4444', fontWeight: 'bold' }} />
                      <Bar dataKey="Due" fill="#ef4444" radius={[0, 4, 4, 0]} barSize={20} />
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
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e9ecef" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6c757d', fontFamily: 'Hind Siliguri' }} axisLine={false} tickLine={false} angle={-45} textAnchor="end" />
                    <YAxis tick={{ fontSize: 11, fill: '#6c757d' }} axisLine={false} tickLine={false} tickFormatter={(val) => `৳${val / 1000}k`} />
                    <Tooltip cursor={{ fill: '#f1f3f5' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} itemStyle={{ color: '#00A48D', fontWeight: 'bold' }} />
                    <Bar dataKey="Paid" fill="#00A48D" radius={[4, 4, 0, 0]} barSize={32} />
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
