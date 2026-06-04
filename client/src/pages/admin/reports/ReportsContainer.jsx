import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../utils/api';
import { getYearOptions, getMonthName } from '../../../utils/dateHelpers';
import { Button } from '../../../components/ui/Button';
import { Loader2, Printer, Download, Filter } from 'lucide-react';

// Report Components
import BalanceSheet from './BalanceSheet';
import IncomeExpenditure from './IncomeExpenditure';
import ReceiptPayment from './ReceiptPayment';
import FixedAssets from './FixedAssets';
import UserPnL from './UserPnL';

export default function ReportsContainer() {
  const { isAdmin, settings } = useAuth();
  
  // Access check
  if (!isAdmin && settings?.user_view_reports !== 'true') {
    return <Navigate to="/dashboard" replace />;
  }
  const [activeReport, setActiveReport] = useState('balance-sheet');
  const [period, setPeriod] = useState('yearly');
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const years = getYearOptions(2020);

  const reportsList = [
    { id: 'balance-sheet', title: 'Balance Sheet' },
    { id: 'income-expenditure', title: 'Income & Expenditure' },
    { id: 'receipt-payment', title: 'Receipt & Payment' },
    { id: 'fixed-assets', title: 'Fixed Assets Schedule' },
    ...(isAdmin ? [{ id: 'user-pnl', title: 'Per User P&L' }] : [])
  ];

  const fetchReport = async () => {
    setLoading(true);
    setData(null);
    try {
      const endpoint = activeReport === 'user-pnl' ? 'user-pnl/all' : activeReport;
      const res = await api.get(`/reports/${endpoint}`, {
        params: { period, year, month: period === 'monthly' ? month : undefined }
      });
      setData(res.data);
    } catch (error) {
      console.error('Error fetching report:', error);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [activeReport, period, year, month]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-text-primary font-bangla-display">আর্থিক বিবরণী (Reports)</h1>
          <p className="text-sm text-text-secondary font-bangla mt-1">সব ধরনের ফাইন্যান্সিয়াল স্টেটমেন্ট দেখুন বা প্রিন্ট করুন</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button icon={Printer} variant="secondary" onClick={handlePrint}>Print</Button>
          <Button icon={Download} variant="outline" onClick={handlePrint}>Save PDF</Button>
        </div>
      </div>

      {/* Filters & Tabs - Hidden in Print View */}
      <div className="bg-white p-4 rounded-2xl border border-border shadow-sm print:hidden">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Tabs */}
          <div className="flex-1 flex flex-wrap gap-2">
            {reportsList.map(report => (
              <button
                key={report.id}
                onClick={() => {
                  if (activeReport !== report.id) {
                    setData(null);
                    setActiveReport(report.id);
                  }
                }}
                className={`px-4 py-2 rounded-lg text-sm font-semibold font-bangla transition-colors ${
                  activeReport === report.id
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-surface-alt text-text-secondary hover:bg-surface-hover hover:text-text-primary'
                }`}
              >
                {report.title}
              </button>
            ))}
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3 pl-0 lg:pl-6 lg:border-l border-border">
            <Filter className="w-5 h-5 text-text-muted" />
            
            <select
              value={period}
              onChange={e => { setData(null); setPeriod(e.target.value); }}
              className="bg-surface-alt border border-border rounded-lg px-3 py-2 text-sm font-bangla focus:outline-none focus:border-primary"
            >
              <option value="yearly">Yearly</option>
              <option value="monthly">Monthly</option>
            </select>

            {period === 'monthly' && (
              <select
                value={month}
                onChange={e => { setData(null); setMonth(e.target.value); }}
                className="bg-surface-alt border border-border rounded-lg px-3 py-2 text-sm font-bangla focus:outline-none focus:border-primary"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                  <option key={m} value={m}>{getMonthName(m, 'en')}</option>
                ))}
              </select>
            )}

            <select
              value={year}
              onChange={e => { setData(null); setYear(e.target.value); }}
              className="bg-surface-alt border border-border rounded-lg px-3 py-2 text-sm font-bangla focus:outline-none focus:border-primary"
            >
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Report Content area */}
      <div className="relative min-h-[500px]">
        {loading ? (
          <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 flex items-center justify-center rounded-2xl border border-border print:hidden">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
          </div>
        ) : null}

        {activeReport === 'balance-sheet' && <BalanceSheet data={data} />}
        {activeReport === 'income-expenditure' && <IncomeExpenditure data={data} />}
        {activeReport === 'receipt-payment' && <ReceiptPayment data={data} />}
        {activeReport === 'fixed-assets' && <FixedAssets data={data} />}
        {activeReport === 'user-pnl' && <UserPnL data={data} />}
      </div>
    </div>
  );
}
