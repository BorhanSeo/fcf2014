import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDateShort, getYearOptions, BANGLA_MONTHS } from '../../utils/dateHelpers';
import { Card, CardBody, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Loader2, Plus, Receipt, Save, Trash2, Calendar, CalendarDays, TrendingDown } from 'lucide-react';

export default function ExpenseManager() {
  const { isAdmin, settings } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  
  // Access check
  if (!isAdmin && settings?.user_view_expenses !== 'true') {
    return <Navigate to="/dashboard" replace />;
  }

  const now = new Date();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Form State
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState('Operating Expense');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const res = await api.get('/expenses');
      setExpenses(res.data.expenses);
    } catch (error) {
      console.error('Error fetching expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/expenses', {
        title, amount: parseFloat(amount), date, category, note
      });
      setShowForm(false);
      setTitle(''); setAmount(''); setNote('');
      setCurrentPage(1);
      fetchExpenses();
    } catch (error) {
      console.error('Error creating expense:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteExpense = async (id) => {
    if (!window.confirm('আপনি কি নিশ্চিত যে এই খরচটি মুছে ফেলতে চান?')) return;
    try {
      await api.delete(`/expenses/${id}`);
      setCurrentPage(1);
      fetchExpenses();
    } catch (error) {
      console.error('Error deleting expense:', error);
      alert('খরচ মুছতে সমস্যা হয়েছে');
    }
  };

  // Calculate summaries based on current period
  const allTimeExpense = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  
  const currentYearExpense = expenses.filter(exp => {
    const d = new Date(exp.date);
    return d.getFullYear() === now.getFullYear();
  }).reduce((sum, exp) => sum + exp.amount, 0);

  const currentMonthExpense = expenses.filter(exp => {
    const d = new Date(exp.date);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  }).reduce((sum, exp) => sum + exp.amount, 0);

  // Sorting: latest first
  const sortedExpenses = [...expenses].sort((a, b) => new Date(b.date) - new Date(a.date));

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentExpenses = sortedExpenses.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sortedExpenses.length / itemsPerPage);

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary font-bangla-display">খরচ ব্যবস্থাপনা</h1>
          <p className="text-sm text-text-secondary font-bangla mt-1">ফান্ডের যাবতীয় খরচের হিসাব</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          {isAdmin && (
            <Button icon={Plus} variant="danger" onClick={() => setShowForm(!showForm)}>
              {showForm ? 'বাতিল করুন' : 'নতুন খরচ'}
            </Button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-danger bg-white">
          <CardBody className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-danger/10 flex items-center justify-center text-danger">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-text-muted font-bangla">চলতি মাসের খরচ</p>
              <h3 className="text-2xl font-bold text-text-primary mt-1">{formatCurrency(currentMonthExpense)}</h3>
            </div>
          </CardBody>
        </Card>
        <Card className="border-l-4 border-l-orange-500 bg-white">
          <CardBody className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
              <CalendarDays className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-text-muted font-bangla">চলতি বছরের খরচ</p>
              <h3 className="text-2xl font-bold text-text-primary mt-1">{formatCurrency(currentYearExpense)}</h3>
            </div>
          </CardBody>
        </Card>
        <Card className="border-l-4 border-l-primary bg-white">
          <CardBody className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <TrendingDown className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-text-muted font-bangla">সর্বমোট খরচ</p>
              <h3 className="text-2xl font-bold text-text-primary mt-1">{formatCurrency(allTimeExpense)}</h3>
            </div>
          </CardBody>
        </Card>
      </div>

      {showForm && (
        <Card className="border-l-4 border-l-danger animate-slide-in">
          <CardHeader>
            <CardTitle>নতুন খরচ</CardTitle>
          </CardHeader>
          <CardBody>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="খরচের বিবরণ" required value={title} onChange={e => setTitle(e.target.value)} />
                <Input label="পরিমাণ (৳)" type="number" required value={amount} onChange={e => setAmount(e.target.value)} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="তারিখ" type="date" required value={date} onChange={e => setDate(e.target.value)} />
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-text-primary font-bangla">ক্যাটাগরি</label>
                  <select
                    value={category} onChange={e => setCategory(e.target.value)}
                    className="w-full bg-white border border-border rounded-xl px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-danger focus:ring-1 font-bangla"
                  >
                    <option value="Operating Expense">অপারেটিং খরচ</option>
                    <option value="Administrative">প্রশাসনিক খরচ</option>
                    <option value="Entertainment">আপ্যায়ন</option>
                    <option value="Other">অন্যান্য</option>
                  </select>
                </div>
              </div>
              <Input label="নোট" value={note} onChange={e => setNote(e.target.value)} />
              <div className="flex justify-end pt-2">
                <Button type="submit" loading={submitting} icon={Save} variant="danger">সংরক্ষণ করুন</Button>
              </div>
            </form>
          </CardBody>
        </Card>
      )}

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-surface-alt/50 border-b border-border">
                <th className="px-6 py-4 text-sm font-semibold text-text-secondary font-bangla">তারিখ</th>
                <th className="px-6 py-4 text-sm font-semibold text-text-secondary font-bangla">বিবরণ</th>
                <th className="px-6 py-4 text-sm font-semibold text-text-secondary font-bangla">ক্যাটাগরি</th>
                <th className="px-6 py-4 text-sm font-semibold text-text-secondary font-bangla text-right">পরিমাণ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center">
                    <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
                  </td>
                </tr>
              ) : currentExpenses.length > 0 ? (
                currentExpenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-surface-hover transition-colors">
                    <td className="px-6 py-4 text-sm text-text-primary">{formatDateShort(expense.date)}</td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-sm font-bangla">{expense.title}</p>
                      {expense.note && <p className="text-xs text-text-muted mt-0.5">{expense.note}</p>}
                    </td>
                    <td className="px-6 py-4 text-sm text-text-secondary">{expense.category}</td>
                    <td className="px-6 py-4 text-sm font-bold text-danger text-right">
                      <div className="flex items-center justify-end gap-3">
                        <span>{formatCurrency(expense.amount)}</span>
                        {isAdmin && (
                          <button 
                            onClick={() => handleDeleteExpense(expense.id)}
                            className="p-1.5 text-danger hover:bg-danger/10 rounded transition-colors"
                            title="মুছে ফেলুন"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-text-muted font-bangla">
                    কোনো খরচের রেকর্ড পাওয়া যায়নি।
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between border-t border-border px-6 py-4 bg-surface-alt/20 gap-4">
            <p className="text-sm text-text-secondary font-bangla">
              মোট <span className="font-semibold text-text-primary">{expenses.length}</span> টি খরচের মধ্যে{' '}
              <span className="font-semibold text-text-primary">{indexOfFirstItem + 1}</span> -{' '}
              <span className="font-semibold text-text-primary">
                {Math.min(indexOfLastItem, expenses.length)}
              </span>{' '}
              দেখানো হচ্ছে
            </p>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                className="font-bangla"
              >
                পূর্ববর্তী
              </Button>
              <div className="flex items-center gap-1.5">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                  if (page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1) {
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-8 h-8 rounded-lg text-sm font-semibold flex items-center justify-center transition-all ${
                          currentPage === page
                            ? 'bg-danger text-white shadow-sm'
                            : 'text-text-secondary hover:bg-surface-hover border border-border bg-white'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  }
                  if (page === 2 && currentPage > 3) {
                    return <span key="left-dots" className="text-text-muted px-1">...</span>;
                  }
                  if (page === totalPages - 1 && currentPage < totalPages - 2) {
                    return <span key="right-dots" className="text-text-muted px-1">...</span>;
                  }
                  return null;
                })}
              </div>
              <Button
                size="sm"
                variant="outline"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                className="font-bangla"
              >
                পরবর্তী
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
