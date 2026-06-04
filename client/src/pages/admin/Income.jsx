import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Plus, Trash2, Calendar, DollarSign, Tag, FileText } from 'lucide-react';
import api from '../../utils/api';

import { Button } from '../../components/ui/Button';

const Income = () => {
  const { isAdmin, settings } = useAuth();
  const [incomes, setIncomes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Access check
  if (!isAdmin && settings?.user_view_incomes !== 'true') {
    return <Navigate to="/dashboard" replace />;
  }

  const [formData, setFormData] = useState({
    source: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    category: 'Business',
    note: ''
  });

  const categories = [
    { value: 'Business', label: 'বিজনেস প্রোফিট (Business Profit)' },
    { value: 'Interest', label: 'ব্যাংক ইন্টারেস্ট (Bank Interest)' },
    { value: 'Other', label: 'অন্যান্য আয় (Other Income)' }
  ];

  const fetchIncomes = async () => {
    try {
      const response = await api.get('/incomes');
      setIncomes(response.data.incomes);
    } catch (error) {
      console.error('Error fetching incomes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncomes();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/incomes', formData);
      setIsModalOpen(false);
      setFormData({
        source: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        category: 'Business',
        note: ''
      });
      fetchIncomes();
    } catch (error) {
      alert(error.response?.data?.message || 'আয় এন্ট্রি করতে সমস্যা হয়েছে');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('আপনি কি নিশ্চিত যে এই আয়টি মুছে ফেলতে চান?')) {
      try {
        await api.delete(`/incomes/${id}`);
        fetchIncomes();
      } catch (error) {
        alert(error.response?.data?.message || 'আয় মুছতে সমস্যা হয়েছে');
      }
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-text-primary font-bangla">আয় / মুনাফা এন্ট্রি</h1>
          <p className="text-text-secondary font-bangla">বিজনেস প্রোফিট বা অন্যান্য আয়ের হিসাব রাখুন</p>
        </div>
        {isAdmin && (
          <Button 
            icon={Plus} 
            onClick={() => setIsModalOpen(true)}
          >
            নতুন আয় এন্ট্রি
          </Button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 font-bangla text-gray-600">
                <th className="p-4 font-semibold">আয়ের উৎস</th>
                <th className="p-4 font-semibold">ক্যাটাগরি</th>
                <th className="p-4 font-semibold">পরিমাণ</th>
                <th className="p-4 font-semibold">তারিখ</th>
                <th className="p-4 font-semibold">নোট</th>
                {isAdmin && <th className="p-4 font-semibold text-right">অ্যাকশন</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {incomes.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 6 : 5} className="p-8 text-center text-gray-500 font-bangla">কোনো আয় পাওয়া যায়নি</td>
                </tr>
              ) : (
                incomes.map((inc) => (
                  <tr key={inc.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-4 font-medium text-gray-800">{inc.source}</td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 text-sm rounded-full bg-primary-50 text-primary-700 font-bangla">
                        {categories.find(c => c.value === inc.category)?.label || inc.category}
                      </span>
                    </td>
                    <td className="p-4 font-semibold text-green-600">৳ {inc.amount.toLocaleString('en-IN')}</td>
                    <td className="p-4 text-gray-600 font-bangla">
                      {new Date(inc.date).toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </td>
                    <td className="p-4 text-gray-500 text-sm">{inc.note || '-'}</td>
                    {isAdmin && (
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleDelete(inc.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="ডিলিট"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-xl">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800 font-bangla">নতুন আয় এন্ট্রি</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 font-bangla">আয়ের উৎস / বিবরণ *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <FileText size={18} />
                  </div>
                  <input
                    type="text"
                    required
                    value={formData.source}
                    onChange={(e) => setFormData({...formData, source: e.target.value})}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all"
                    placeholder="যেমন: জানুয়ারি মাসের প্রোফিট"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 font-bangla">ক্যাটাগরি *</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                      <Tag size={18} />
                    </div>
                    <select
                      required
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all font-bangla"
                    >
                      {categories.map(c => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 font-bangla">পরিমাণ (৳) *</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                      <DollarSign size={18} />
                    </div>
                    <input
                      type="number"
                      required
                      min="0"
                      value={formData.amount}
                      onChange={(e) => setFormData({...formData, amount: e.target.value})}
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 font-bangla">তারিখ *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Calendar size={18} />
                  </div>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 font-bangla">নোট বা মন্তব্য (ঐচ্ছিক)</label>
                <textarea
                  value={formData.note}
                  onChange={(e) => setFormData({...formData, note: e.target.value})}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all"
                  rows="2"
                  placeholder="অতিরিক্ত কোনো তথ্য থাকলে লিখুন..."
                ></textarea>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-bangla font-medium"
                >
                  বাতিল করুন
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors font-bangla font-medium shadow-sm shadow-primary/30"
                >
                  সেভ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Income;
