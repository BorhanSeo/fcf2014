import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDateShort } from '../../utils/dateHelpers';
import { Card, CardBody } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Wallet, AlertCircle, TrendingUp, TrendingDown, Loader2, PiggyBank } from 'lucide-react';



export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState({
    payments: [],
    summary: { totalPaid: 0, totalDue: 0, count: 0 },
    dues: [],
    totalDueAmount: 0,
    pnl: null
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [paymentsRes, duesRes, pnlRes] = await Promise.all([
          api.get('/payments/my'),
          api.get('/payments/my/dues'),
          api.get(`/users/my-summary`).catch(() => ({ data: { pnl: { sharePercentage: 0, userProfitLoss: 0 } } })) // We'll add this endpoint
        ]);

        setData({
          payments: paymentsRes.data.payments,
          summary: paymentsRes.data.summary,
          dues: duesRes.data.dues,
          totalDueAmount: duesRes.data.totalDue,
          pnl: pnlRes.data.pnl
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary font-bangla-display">আমার ড্যাশবোর্ড</h1>
          <p className="text-sm text-text-secondary font-bangla mt-1">আপনার আর্থিক সারসংক্ষেপ</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Paid */}
        <Card className="border-l-4 border-l-secondary shadow-sm">
          <CardBody className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center flex-shrink-0">
              <Wallet className="w-6 h-6 text-secondary" />
            </div>
            <div>
              <p className="text-sm font-medium text-text-muted font-bangla">মোট জমা</p>
              <h3 className="text-2xl font-bold text-text-primary mt-1">{formatCurrency(data.summary.totalPaid)}</h3>
            </div>
          </CardBody>
        </Card>

        {/* Total Due */}
        <Card className="border-l-4 border-l-danger shadow-sm">
          <CardBody className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-danger/10 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-6 h-6 text-danger" />
            </div>
            <div>
              <p className="text-sm font-medium text-text-muted font-bangla">বকেয়া পরিমাণ</p>
              <h3 className="text-2xl font-bold text-text-primary mt-1">{formatCurrency(data.totalDueAmount)}</h3>
            </div>
          </CardBody>
        </Card>

        {/* Expense Share */}
        <Card className="border-l-4 border-l-warning shadow-sm">
          <CardBody className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center flex-shrink-0 text-warning">
              <TrendingDown className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-text-muted font-bangla">আপনার অংশের খরচ</p>
              <h3 className="text-2xl font-bold text-text-primary mt-1">
                {formatCurrency(data.pnl?.userExpenseShare || 0)}
              </h3>
              {data.pnl && (
                <p className="text-[10px] text-text-secondary mt-1 font-bangla">
                  মোট {data.pnl.activeUsersCount || 1} জনের মধ্যে সমবণ্টন
                </p>
              )}
            </div>
          </CardBody>
        </Card>

        {/* Profit Share */}
        <Card className="border-l-4 border-l-primary shadow-sm bg-primary/5">
          <CardBody className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-text-muted font-bangla">সম্ভাব্য লাভ/ক্ষতি</p>
              <h3 className={`text-xl font-bold mt-1 ${data.pnl?.userProfitLoss >= 0 ? 'text-secondary' : 'text-danger'}`}>
                {data.pnl?.userProfitLoss >= 0 ? '+' : ''}{formatCurrency(data.pnl?.userProfitLoss || 0)}
              </h3>
              <p className="text-[10px] text-text-secondary mt-1 font-bangla">
                শেয়ার: {(data.pnl?.sharePercentage || 0).toFixed(2)}%
                {data.pnl && ` (অটো: ${formatCurrency(data.pnl.autoProfitLoss || 0)} |  ম্যানু: ${formatCurrency(data.pnl.manualProfit || 0)})`}
              </p>
            </div>
          </CardBody>
        </Card>

        {/* Total Receivable */}
        <Card className="border-l-4 border-l-success shadow-sm">
          <CardBody className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center flex-shrink-0 text-success">
              <PiggyBank className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-text-muted font-bangla">সর্বমোট পাওনা</p>
              <h3 className="text-2xl font-bold text-text-primary mt-1">
                {formatCurrency(data.summary.totalPaid + (data.pnl?.userProfitLoss || 0) - (data.pnl?.userExpenseShare || 0))}
              </h3>
              <p className="text-xs text-text-secondary mt-1 font-bangla">জমা + লাভ - খরচ</p>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Recent Activity & Next Due */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Next Dues List */}
        <Card>
          <div className="px-5 py-4 border-b border-border flex justify-between items-center bg-surface-alt/30">
            <h3 className="font-semibold font-bangla">পরবর্তী বকেয়া</h3>
            <Badge variant="pending">{data.dues.length} টি</Badge>
          </div>
          <CardBody className="p-0">
            {data.dues.length > 0 ? (
              <ul className="divide-y divide-border">
                {data.dues.slice(0, 3).map((due, idx) => (
                  <li key={idx} className="p-4 flex justify-between items-center hover:bg-surface-hover transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-danger/10 text-danger flex flex-col items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold">{due.month}</span>
                        <span className="text-[10px]">{due.year}</span>
                      </div>
                      <div>
                        <p className="font-medium font-bangla text-sm">মাসিক চাঁদা</p>
                        <p className="text-xs text-text-secondary font-bangla mt-0.5">ডিউ ডেট: {formatDateShort(due.dueDate)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-danger">{formatCurrency(due.amount)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-8 text-center text-text-muted font-bangla">
                আপনার কোনো বকেয়া নেই। দারুণ!
              </div>
            )}
          </CardBody>
        </Card>

        {/* Recent Payments */}
        <Card>
          <div className="px-5 py-4 border-b border-border flex justify-between items-center bg-surface-alt/30">
            <h3 className="font-semibold font-bangla">সাম্প্রতিক পেমেন্ট</h3>
          </div>
          <CardBody className="p-0">
            {data.payments.length > 0 ? (
              <ul className="divide-y divide-border">
                {data.payments.slice(0, 3).map((payment) => (
                  <li key={payment.id} className="p-4 flex justify-between items-center hover:bg-surface-hover transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-secondary/10 text-secondary flex flex-col items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold">{payment.month}</span>
                        <span className="text-[10px]">{payment.year}</span>
                      </div>
                      <div>
                        <p className="font-medium font-bangla text-sm">পেমেন্ট সম্পন্ন</p>
                        <p className="text-xs text-text-secondary mt-0.5">{formatDateShort(payment.paidDate)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-text-primary">{formatCurrency(payment.amount)}</p>
                      <Badge variant="paid" className="mt-1">PAID</Badge>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-8 text-center text-text-muted font-bangla">
                এখনো কোনো পেমেন্ট জমা হয়নি।
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
