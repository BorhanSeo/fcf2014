import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../utils/api';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDateShort, getYearOptions, BANGLA_MONTHS } from '../../utils/dateHelpers';
import { Card, CardBody } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Loader2, Wallet, AlertCircle, TrendingUp, TrendingDown, CalendarCheck, ArrowLeft, User, Trash2, Plus, X, Gift, PiggyBank, MessageCircle } from 'lucide-react';

export default function UserDetails() {
  const { id } = useParams();
  const [viewingUser, setViewingUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewData, setViewData] = useState({
    totalPaid: 0,
    dues: [],
    totalDueAmount: 0,
    pnl: null,
    payments: [],
    profits: []
  });

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedPaymentDate, setSelectedPaymentDate] = useState(null);
  const years = getYearOptions(2020);
  const [paymentForm, setPaymentForm] = useState({ amount: '', paidDate: new Date().toISOString().split('T')[0], note: '', method: 'CASH' });
  const [isProfitModalOpen, setIsProfitModalOpen] = useState(false);
  const [profitForm, setProfitForm] = useState({ amount: '', date: new Date().toISOString().split('T')[0], note: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const calculateDues = (joinDate, monthlyAmount, payments) => {
    const now = new Date();
    const join = new Date(joinDate);
    
    const paidMap = new Map();
    payments.filter(p => p.status === 'PAID').forEach(p => {
      const key = `${p.year}-${p.month}`;
      paidMap.set(key, (paidMap.get(key) || 0) + p.amount);
    });
    
    const dues = [];
    let startMonth = join.getMonth();
    let startYear = join.getFullYear();
    
    if (startYear < 2025 || (startYear === 2025 && startMonth < 8)) {
      startYear = 2025;
      startMonth = 8;
    }

    let current = new Date(startYear, startMonth, 1);
    while (current <= now) {
      const y = current.getFullYear();
      const m = current.getMonth() + 1;
      
      let expected = monthlyAmount;
      const paid = paidMap.get(`${y}-${m}`) || 0;
      let dueAmount = expected - paid;
      if (dueAmount < 0) dueAmount = 0;

      if (dueAmount > 0) {
        dues.push({ year: y, month: m, expected, paid, amount: dueAmount, dueDate: new Date(y, m - 1, 1) });
      }
      current.setMonth(current.getMonth() + 1);
    }
    return { dues, totalDueAmount: dues.reduce((sum, d) => sum + d.amount, 0) };
  };

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const [userRes, summaryRes] = await Promise.all([
        api.get(`/users/${id}`),
        api.get(`/users/${id}/summary`).catch(() => ({ data: { pnl: null } }))
      ]);
      
      const user = userRes.data.user;
      setViewingUser(user);
      
      const payments = user.payments || [];
      const profits = user.profits || [];
      const totalPaid = payments.filter(p => p.status === 'PAID').reduce((sum, p) => sum + p.amount, 0);
      const { dues, totalDueAmount } = calculateDues(user.joinDate, user.monthlyAmount, payments);
      
      setViewData({
        totalPaid,
        payments,
        profits,
        dues,
        totalDueAmount,
        pnl: summaryRes.data.pnl
      });
    } catch (error) {
      console.error('Error fetching view data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, [id]);

  const openPaymentModal = (due = null) => {
    const defaultYear = new Date().getFullYear();
    const defaultMonth = new Date().getMonth() + 1;
    
    setSelectedPaymentDate({
      year: due ? due.year : defaultYear,
      month: due ? due.month : defaultMonth,
      isFixed: !!due
    });
    
    setPaymentForm({
      amount: due ? due.amount.toString() : (viewingUser?.monthlyAmount || 5000).toString(),
      paidDate: new Date().toISOString().split('T')[0],
      note: '',
      method: 'CASH'
    });
    setIsPaymentModalOpen(true);
  };

  const closePaymentModal = () => {
    setIsPaymentModalOpen(false);
    setSelectedPaymentDate(null);
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPaymentDate || !viewingUser) return;
    
    setIsSubmitting(true);
    try {
      await api.post('/payments', {
        userId: viewingUser.id,
        year: selectedPaymentDate.year,
        month: selectedPaymentDate.month,
        amount: Number(paymentForm.amount),
        paidDate: paymentForm.paidDate,
        method: paymentForm.method,
        note: paymentForm.note
      });
      
      const submittedAmount = paymentForm.amount;
      const submittedMonth = selectedPaymentDate.month;
      const submittedYear = selectedPaymentDate.year;
      
      closePaymentModal();
      await fetchUserData();

      if (viewingUser?.phone) {
        if (window.confirm('পেমেন্ট সফলভাবে জমা হয়েছে! আপনি কি হোয়াটসঅ্যাপে কনফার্মেশন মেসেজ পাঠাতে চান?')) {
          const monthName = new Date(2000, submittedMonth - 1, 1).toLocaleString('bn-BD', { month: 'long' });
          const now = new Date();
          const timeString = now.toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' });
          const dateString = new Date(paymentForm.paidDate).toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' });
          
          const methodMap = {
            'CASH': 'ক্যাশ (Cash)',
            'BKASH': 'বিকাশ (bKash)',
            'NAGAD': 'নগদ (Nagad)',
            'BANK': 'ব্যাংক (Bank)',
            'OTHER': 'অন্যান্য (Other)'
          };
          const methodText = methodMap[paymentForm.method] || paymentForm.method;
          
          const message = `আসসালামু আলাইকুম ${viewingUser.name},\n\n✅ আপনার পেমেন্ট সফলভাবে গ্রহণ করা হয়েছে!\n\n📋 পেমেন্টের বিবরণ:\n▪ মাস: ${monthName} ${submittedYear}\n▪ পরিমাণ: ৳ ${submittedAmount}\n▪ মাধ্যম: ${methodText}\n▪ তারিখ: ${dateString}\n▪ সময়: ${timeString}\n\nFCF 2014 এর সাথে থাকার জন্য অসংখ্য ধন্যবাদ। 🤝`;
          
          let phone = viewingUser.phone.replace(/[^0-9+]/g, '');
          if (phone.startsWith('01')) {
            phone = '+88' + phone;
          }
          const encodedMessage = encodeURIComponent(message);
          window.open(`https://wa.me/${phone}?text=${encodedMessage}`, '_blank');
        }
      } else {
        // Optional success message if no phone number
      }
    } catch (error) {
      console.error('Payment entry error:', error);
      alert(error.response?.data?.message || 'পেমেন্ট জমা করতে সমস্যা হয়েছে');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePayment = async (paymentId) => {
    if (!window.confirm('আপনি কি নিশ্চিত যে এই পেমেন্টটি ডিলিট করতে চান?')) return;
    
    try {
      await api.delete(`/payments/${paymentId}`);
      await fetchUserData();
    } catch (error) {
      console.error('Payment delete error:', error);
      alert('পেমেন্ট ডিলিট করতে সমস্যা হয়েছে');
    }
  };

  const openProfitModal = () => {
    setProfitForm({
      amount: '',
      date: new Date().toISOString().split('T')[0],
      note: ''
    });
    setIsProfitModalOpen(true);
  };

  const closeProfitModal = () => {
    setIsProfitModalOpen(false);
  };

  const handleProfitSubmit = async (e) => {
    e.preventDefault();
    if (!viewingUser) return;
    
    setIsSubmitting(true);
    try {
      await api.post(`/users/${viewingUser.id}/profit`, {
        amount: Number(profitForm.amount),
        date: profitForm.date,
        note: profitForm.note
      });
      closeProfitModal();
      await fetchUserData();
    } catch (error) {
      console.error('Profit entry error:', error);
      alert(error.response?.data?.message || 'লাভ/বোনাস এন্ট্রি করতে সমস্যা হয়েছে');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProfit = async (profitId) => {
    if (!window.confirm('আপনি কি নিশ্চিত যে এই লাভ/বোনাস এন্ট্রিটি ডিলিট করতে চান?')) return;
    
    try {
      await api.delete(`/users/profit/${profitId}`);
      await fetchUserData();
    } catch (error) {
      console.error('Profit delete error:', error);
      alert('লাভ এন্ট্রি ডিলিট করতে সমস্যা হয়েছে');
    }
  };

  const handleSendWhatsAppReminder = () => {
    if (!viewingUser?.phone) {
      alert('এই সদস্যের কোনো ফোন নম্বর দেওয়া নেই।');
      return;
    }

    if (viewData.dues.length === 0) {
      alert('এই সদস্যের কোনো বকেয়া নেই।');
      return;
    }

    let message = `আসসালামু আলাইকুম ${viewingUser.name},\n\nআপনার FCF এর বকেয়া চাঁদার তালিকা নিচে দেওয়া হলো:\n\n`;
    
    viewData.dues.forEach(due => {
      const monthName = new Date(2000, due.month - 1, 1).toLocaleString('bn-BD', { month: 'long' });
      message += `▪ ${monthName} ${due.year}: ${due.amount} টাকা\n`;
    });

    message += `\nমোট বকেয়া: ${viewData.totalDueAmount} টাকা\n\nঅনুগ্রহ করে বকেয়া পরিশোধ করার জন্য বিনীত অনুরোধ করা হলো। ধন্যবাদ।`;

    let phone = viewingUser.phone.replace(/[^0-9+]/g, '');
    if (phone.startsWith('01')) {
      phone = '+88' + phone;
    }

    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${phone}?text=${encodedMessage}`, '_blank');
  };

  if (loading && !viewingUser) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  if (!viewingUser) {
    return (
      <div className="flex flex-col h-[80vh] items-center justify-center space-y-4">
        <p className="text-xl text-text-secondary font-bangla">ব্যবহারকারীর তথ্য পাওয়া যায়নি</p>
        <Link to="/admin/users" className="text-primary hover:underline font-bangla flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> ফিরে যান
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-border">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="w-14 h-14 shrink-0 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xl font-bold">
            {viewingUser.name.charAt(0)}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text-primary font-bangla-display flex items-center gap-2">
              {viewingUser.name} <Badge variant={viewingUser.isActive ? 'active' : 'closed'} className="text-xs">{viewingUser.isActive ? 'সক্রিয়' : 'নিষ্ক্রিয়'}</Badge>
            </h1>
            <p className="text-sm text-text-secondary mt-1">{viewingUser.email} • {viewingUser.phone || 'N/A'}</p>
          </div>
        </div>
        <Link to="/admin/users" className="flex items-center gap-2 text-text-secondary hover:text-primary transition-colors bg-surface-alt px-4 py-2 rounded-xl">
          <ArrowLeft className="w-4 h-4" /> <span className="font-bangla font-medium">ফিরে যান</span>
        </Link>
      </div>

      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="border-0 shadow-sm border-l-4 border-l-secondary bg-white">
            <CardBody className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary">
                <Wallet className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-text-muted font-bangla">মোট জমা</p>
                <p className="text-2xl font-bold text-text-primary">{formatCurrency(viewData.totalPaid)}</p>
              </div>
            </CardBody>
          </Card>
          <Card className="border-0 shadow-sm border-l-4 border-l-danger bg-white">
            <CardBody className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-danger/10 flex items-center justify-center text-danger">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-text-muted font-bangla">মোট বকেয়া</p>
                <p className="text-2xl font-bold text-text-primary">{formatCurrency(viewData.totalDueAmount)}</p>
              </div>
            </CardBody>
          </Card>
          <Card className="border-0 shadow-sm border-l-4 border-l-warning bg-white">
            <CardBody className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center text-warning">
                <TrendingDown className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-text-muted font-bangla">উনার অংশের খরচ</p>
                <p className="text-2xl font-bold text-text-primary">
                  {formatCurrency((viewData.pnl?.totalExpenses || 0) / (viewData.pnl?.activeUsersCount || 1))}
                </p>
                {viewData.pnl && (
                  <p className="text-xs text-text-muted mt-1 font-bangla">
                    মোট {viewData.pnl.activeUsersCount || 1} জন সদস্যের মধ্যে সমবণ্টন
                  </p>
                )}
              </div>
            </CardBody>
          </Card>
          <Card className="border-0 shadow-sm border-l-4 border-l-primary bg-white">
            <CardBody className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-text-muted font-bangla">মোট সম্ভাব্য লাভ</p>
                <p className={`text-2xl font-bold ${viewData.pnl?.userProfitLoss >= 0 ? 'text-secondary' : 'text-danger'}`}>
                  {viewData.pnl?.userProfitLoss >= 0 ? '+' : ''}{formatCurrency(viewData.pnl?.userProfitLoss || 0)}
                </p>
                {viewData.pnl && (
                  <p className="text-xs text-text-muted mt-1 font-bangla">
                    অটো: {formatCurrency(viewData.pnl.autoProfitLoss || 0)} | ম্যানুয়াল: {formatCurrency(viewData.pnl.manualProfit || 0)}
                  </p>
                )}
              </div>
            </CardBody>
          </Card>
          <Card className="border-0 shadow-sm border-l-4 border-l-success bg-white">
            <CardBody className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center text-success">
                <PiggyBank className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-text-muted font-bangla">সর্বমোট পাওনা</p>
                <p className="text-2xl font-bold text-text-primary">
                  {formatCurrency(viewData.totalPaid + (viewData.pnl?.userProfitLoss || 0) - (viewData.pnl?.userExpenseShare || 0))}
                </p>
                {viewData.pnl && (
                  <p className="text-xs text-text-muted mt-1 font-bangla">
                    জমা + লাভ - খরচ
                  </p>
                )}
              </div>
            </CardBody>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Dues */}
          <Card className="border-0 shadow-sm overflow-hidden">
            <div className="px-4 sm:px-6 py-4 border-b border-border bg-danger/5 text-danger font-semibold font-bangla flex flex-wrap justify-between items-center gap-3">
              <span className="text-lg">বকেয়া সমূহ</span>
              <div className="flex items-center gap-3">
                {viewData.dues.length > 0 && (
                  <button 
                    onClick={handleSendWhatsAppReminder}
                    className="flex items-center gap-1.5 bg-[#25D366] text-white px-3 py-1.5 rounded-lg text-sm hover:bg-[#1ebd5c] transition-colors cursor-pointer"
                    title="হোয়াটসঅ্যাপে রিমাইন্ডার পাঠান"
                  >
                    <MessageCircle className="w-4 h-4" /> রিমাইন্ডার
                  </button>
                )}
                <Badge variant="pending">{viewData.dues.length} মাস</Badge>
              </div>
            </div>
            <CardBody className="p-0 max-h-[400px] overflow-y-auto">
              {viewData.dues.length > 0 ? (
                <ul className="divide-y divide-border">
                  {viewData.dues.map((due, idx) => (
                    <li key={idx} className="p-4 flex justify-between items-center gap-2 hover:bg-surface-hover transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-12 h-12 shrink-0 rounded-xl bg-danger/10 text-danger flex flex-col items-center justify-center font-bangla">
                          <span className="text-sm font-bold">{due.month}</span>
                          <span className="text-xs">{due.year}</span>
                        </div>
                        <span className="font-bold text-text-primary truncate">{new Date(2000, due.month-1, 1).toLocaleString('bn-BD', {month: 'long'})} {due.year}</span>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                        <span className="font-bold text-danger text-lg">{formatCurrency(due.amount)}</span>
                        <button 
                          onClick={() => openPaymentModal(due)}
                          className="bg-primary text-white p-2 rounded-lg hover:bg-primary-dark transition-colors cursor-pointer flex items-center justify-center shadow-sm"
                          title="পেমেন্ট এন্ট্রি করুন"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="p-12 text-center text-text-muted font-bangla text-lg flex flex-col items-center justify-center">
                  <div className="w-16 h-16 bg-success/10 text-success rounded-full flex items-center justify-center mb-4">
                    <CalendarCheck className="w-8 h-8" />
                  </div>
                  কোনো বকেয়া নেই, সব ক্লিয়ার!
                </div>
              )}
            </CardBody>
          </Card>

          {/* Payments */}
          <Card className="border-0 shadow-sm overflow-hidden">
            <div className="px-4 sm:px-6 py-4 border-b border-border bg-secondary/5 text-secondary font-semibold font-bangla flex flex-wrap justify-between items-center gap-3">
              <span className="text-lg">পেমেন্ট হিস্ট্রি</span>
              <div className="flex gap-3 items-center">
                <Button size="sm" onClick={() => openPaymentModal()} className="h-8 text-xs px-2">
                  <Plus className="w-3 h-3 mr-1" /> এন্ট্রি
                </Button>
                <Badge variant="paid">{viewData.payments.filter(p=>p.status==='PAID').length} টি</Badge>
              </div>
            </div>
            <CardBody className="p-0 max-h-[400px] overflow-y-auto">
              {viewData.payments.length > 0 ? (
                <ul className="divide-y divide-border">
                  {viewData.payments.map((payment) => (
                    <li key={payment.id} className="p-4 flex justify-between items-center gap-2 hover:bg-surface-hover transition-colors group">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-12 h-12 shrink-0 rounded-xl flex flex-col items-center justify-center font-bangla ${payment.status === 'PAID' ? 'bg-secondary/10 text-secondary' : 'bg-warning/10 text-warning'}`}>
                          <span className="text-sm font-bold">{payment.month}</span>
                          <span className="text-xs">{payment.year}</span>
                        </div>
                        <div className="min-w-0">
                          <span className="font-bold text-text-primary block truncate">{new Date(2000, payment.month-1, 1).toLocaleString('bn-BD', {month: 'long'})} {payment.year}</span>
                          <p className="text-xs text-text-muted mt-1 flex flex-wrap items-center gap-1.5">
                            <span>{formatDateShort(payment.paidDate)}</span>
                            {payment.method && payment.method !== 'CASH' && (
                              <span className="px-1.5 py-0.5 bg-surface-alt text-text-secondary rounded text-[10px] uppercase font-bold tracking-wider">
                                {payment.method}
                              </span>
                            )}
                          </p>
                          {payment.note && <p className="text-[11px] text-text-muted mt-0.5 max-w-[150px] truncate">{payment.note}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                        <div className="text-right">
                          <span className="font-bold text-text-primary block text-base sm:text-lg">{formatCurrency(payment.amount)}</span>
                          {payment.status === 'PAID' ? <Badge variant="paid" className="mt-1">PAID</Badge> : <Badge variant="pending" className="mt-1">PENDING</Badge>}
                        </div>
                        <button 
                          onClick={() => handleDeletePayment(payment.id)}
                          className="opacity-0 group-hover:opacity-100 p-2 text-danger hover:bg-danger/10 rounded-lg transition-all cursor-pointer"
                          title="পেমেন্ট মুছুন"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="p-12 text-center text-text-muted font-bangla text-lg flex flex-col items-center justify-center">
                  <div className="w-16 h-16 bg-surface-alt text-text-muted rounded-full flex items-center justify-center mb-4">
                    <AlertCircle className="w-8 h-8" />
                  </div>
                  কোনো পেমেন্ট হিস্ট্রি নেই
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Profit History */}
        <Card className="border-0 shadow-sm overflow-hidden mt-6">
          <div className="px-4 sm:px-6 py-4 border-b border-border bg-primary/5 text-primary font-semibold font-bangla flex flex-wrap justify-between items-center gap-3">
            <span className="text-lg">লাভ / বোনাস হিস্ট্রি (ম্যানুয়াল)</span>
            <div className="flex gap-3 items-center">
              <Button size="sm" onClick={() => openProfitModal()} className="h-8 text-xs px-2">
                <Plus className="w-3 h-3 mr-1" /> এন্ট্রি
              </Button>
              <Badge variant="active" className="bg-primary/20 text-primary">{viewData.profits.length} টি</Badge>
            </div>
          </div>
          <CardBody className="p-0 max-h-[300px] overflow-y-auto">
            {viewData.profits.length > 0 ? (
              <ul className="divide-y divide-border grid grid-cols-1 sm:grid-cols-2">
                {viewData.profits.map((profit) => (
                  <li key={profit.id} className="p-4 flex justify-between items-center gap-2 hover:bg-surface-hover transition-colors group border-r border-border last:border-r-0">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 shrink-0 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                        <Gift className="w-6 h-6" />
                      </div>
                      <div className="min-w-0">
                        <span className="font-bold text-text-primary block truncate">{formatDateShort(profit.date)}</span>
                        {profit.note && <p className="text-xs text-text-muted mt-1 truncate">{profit.note}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                      <span className="font-bold text-primary block text-base sm:text-lg">+{formatCurrency(profit.amount)}</span>
                      <button 
                        onClick={() => handleDeleteProfit(profit.id)}
                        className="opacity-0 group-hover:opacity-100 p-2 text-danger hover:bg-danger/10 rounded-lg transition-all cursor-pointer"
                        title="এন্ট্রি মুছুন"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-12 text-center text-text-muted font-bangla text-lg flex flex-col items-center justify-center">
                <div className="w-16 h-16 bg-surface-alt text-text-muted rounded-full flex items-center justify-center mb-4">
                  <Gift className="w-8 h-8 opacity-50" />
                </div>
                কোনো ম্যানুয়াল লাভ বা বোনাস এন্ট্রি নেই
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Payment Entry Modal */}
      {isPaymentModalOpen && selectedPaymentDate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <Card className="w-full max-w-md bg-white shadow-2xl animate-slide-in relative">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-xl font-bold font-bangla flex items-center gap-2">
                <Wallet className="w-5 h-5 text-primary" /> পেমেন্ট এন্ট্রি
              </h2>
              <button onClick={closePaymentModal} className="p-2 text-text-muted hover:bg-surface-hover rounded-full transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              {selectedPaymentDate.isFixed ? (
                <div className="bg-primary/5 rounded-xl p-4 flex justify-between items-center mb-6">
                  <span className="font-bangla font-semibold text-text-primary">
                    {new Date(2000, selectedPaymentDate.month-1, 1).toLocaleString('bn-BD', {month: 'long'})} {selectedPaymentDate.year}
                  </span>
                  <span className="font-bold text-primary">{viewingUser.name}</span>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-text-secondary font-bangla block">বছর</label>
                    <select
                      className="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-text-primary font-bangla focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      value={selectedPaymentDate.year}
                      onChange={(e) => setSelectedPaymentDate({...selectedPaymentDate, year: Number(e.target.value)})}
                    >
                      {years.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-text-secondary font-bangla block">মাস</label>
                    <select
                      className="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-text-primary font-bangla focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      value={selectedPaymentDate.month}
                      onChange={(e) => setSelectedPaymentDate({...selectedPaymentDate, month: Number(e.target.value)})}
                    >
                      {BANGLA_MONTHS.map((m, idx) => <option key={idx + 1} value={idx + 1}>{m}</option>)}
                    </select>
                  </div>
                </div>
              )}
              <form id="payment-form" onSubmit={handlePaymentSubmit} className="space-y-4">
                <Input
                  label="টাকার পরিমাণ (৳)"
                  type="number"
                  min="0"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({...paymentForm, amount: e.target.value})}
                  required
                />
                <Input
                  label="জমার তারিখ"
                  type="date"
                  value={paymentForm.paidDate}
                  onChange={(e) => setPaymentForm({...paymentForm, paidDate: e.target.value})}
                  required
                />
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-text-secondary font-bangla block">পেমেন্ট মেথড</label>
                  <select
                    className="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-text-primary font-bangla focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    value={paymentForm.method}
                    onChange={(e) => setPaymentForm({...paymentForm, method: e.target.value})}
                  >
                    <option value="CASH">ক্যাশ (Cash)</option>
                    <option value="BKASH">বিকাশ (bKash)</option>
                    <option value="NAGAD">নগদ (Nagad)</option>
                    <option value="BANK">ব্যাংক (Bank)</option>
                    <option value="OTHER">অন্যান্য (Other)</option>
                  </select>
                </div>
                <Input
                  label="নোট (অপশনাল)"
                  type="text"
                  placeholder="যেমন: ট্রানজ্যাকশন আইডি"
                  value={paymentForm.note}
                  onChange={(e) => setPaymentForm({...paymentForm, note: e.target.value})}
                />
              </form>
            </div>
            <div className="p-6 border-t border-border bg-surface-alt rounded-b-2xl flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={closePaymentModal}>
                বাতিল
              </Button>
              <Button type="submit" form="payment-form" loading={isSubmitting}>
                জমা করুন
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Profit Entry Modal */}
      {isProfitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <Card className="w-full max-w-md bg-white shadow-2xl animate-slide-in relative">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-xl font-bold font-bangla flex items-center gap-2">
                <Gift className="w-5 h-5 text-primary" /> লাভ / বোনাস এন্ট্রি
              </h2>
              <button onClick={closeProfitModal} className="p-2 text-text-muted hover:bg-surface-hover rounded-full transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <div className="bg-primary/5 rounded-xl p-4 flex justify-between items-center mb-6">
                <span className="font-bangla font-semibold text-text-primary">নতুন এন্ট্রি</span>
                <span className="font-bold text-primary">{viewingUser.name}</span>
              </div>
              <form id="profit-form" onSubmit={handleProfitSubmit} className="space-y-4">
                <Input
                  label="টাকার পরিমাণ (৳)"
                  type="number"
                  min="0"
                  value={profitForm.amount}
                  onChange={(e) => setProfitForm({...profitForm, amount: e.target.value})}
                  required
                />
                <Input
                  label="তারিখ"
                  type="date"
                  value={profitForm.date}
                  onChange={(e) => setProfitForm({...profitForm, date: e.target.value})}
                  required
                />
                <Input
                  label="নোট (যেমন: বিশেষ বোনাস)"
                  type="text"
                  value={profitForm.note}
                  onChange={(e) => setProfitForm({...profitForm, note: e.target.value})}
                />
              </form>
            </div>
            <div className="p-6 border-t border-border bg-surface-alt rounded-b-2xl flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={closeProfitModal}>
                বাতিল
              </Button>
              <Button type="submit" form="profit-form" loading={isSubmitting}>
                সেভ করুন
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
