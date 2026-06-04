import { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import api from '../../utils/api';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDateShort } from '../../utils/dateHelpers';
import { Card, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Loader2, Plus, Edit2, Shield, User, UserX, UserCheck, X, Trash2 } from 'lucide-react';

import { useAuth } from '../../context/AuthContext';

export default function UserManagement() {
  const { user: currentUser, updateUser, isAdmin, settings } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Access check
  if (!isAdmin && settings?.user_view_users !== 'true') {
    return <Navigate to="/dashboard" replace />;
  }
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', monthlyAmount: '', joinDate: '', password: ''
  });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/users');
      setUsers(res.data.users);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleActive = async (user) => {
    const action = user.isActive ? 'নিষ্ক্রিয়' : 'সক্রিয়';
    if (!window.confirm(`আপনি কি নিশ্চিত যে এই অ্যাকাউন্টটি ${action} করতে চান?`)) {
      return;
    }
    
    try {
      await api.patch(`/users/${user.id}/toggle`);
      fetchUsers();
    } catch (error) {
      console.error('Toggle error:', error);
      alert('স্ট্যাটাস আপডেট করতে সমস্যা হয়েছে');
    }
  };

  const handleDeleteUser = async (user) => {
    if (!window.confirm(`সতর্কতা: আপনি কি নিশ্চিত যে "${user.name}" কে মুছে ফেলতে চান? \nএটি ডিলিট করলে ইউজারের সব পেমেন্ট এবং তথ্য চিরতরে মুছে যাবে!`)) {
      return;
    }
    
    try {
      await api.delete(`/users/${user.id}`);
      fetchUsers();
    } catch (error) {
      console.error('Delete error:', error);
      alert(error.response?.data?.message || 'ব্যবহারকারী মুছতে সমস্যা হয়েছে');
    }
  };

  const openModal = (user = null) => {
    if (user) {
      setSelectedUser(user);
      setFormData({
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        monthlyAmount: user.monthlyAmount || '',
        joinDate: user.joinDate ? new Date(user.joinDate).toISOString().split('T')[0] : '',
        password: '' // Don't show existing password
      });
    } else {
      setSelectedUser(null);
      setFormData({ name: '', email: '', phone: '', monthlyAmount: '', joinDate: '', password: '' });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        monthlyAmount: Number(formData.monthlyAmount),
      };

      if (selectedUser) {
        // Edit
        if (!payload.password) delete payload.password; // Don't update password if empty
        const res = await api.put(`/users/${selectedUser.id}`, payload);
        
        // If the admin updated their own profile, update the AuthContext
        if (currentUser && currentUser.id === selectedUser.id) {
          updateUser(res.data.user);
        }
      } else {
        // Create
        await api.post('/users', payload);
      }
      
      closeModal();
      fetchUsers();
    } catch (error) {
      console.error('Save error:', error);
      alert(error.response?.data?.message || 'সংরক্ষণ করতে সমস্যা হয়েছে');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in relative">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary font-bangla-display">সদস্য ব্যবস্থাপনা</h1>
          <p className="text-sm text-text-secondary font-bangla mt-1">সব সদস্যের তালিকা ও তথ্য</p>
        </div>
        {isAdmin && <Button icon={Plus} onClick={() => openModal()}>নতুন সদস্য যোগ করুন</Button>}
      </div>

      {/* Desktop view (table) */}
      <div className="hidden md:block">
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-surface-alt/50 border-b border-border">
                  <th className="px-6 py-4 text-sm font-semibold text-text-secondary font-bangla">সদস্যের নাম</th>
                  <th className="px-6 py-4 text-sm font-semibold text-text-secondary font-bangla">যোগাযোগ</th>
                  <th className="px-6 py-4 text-sm font-semibold text-text-secondary font-bangla">মাসিক চাঁদা</th>
                  <th className="px-6 py-4 text-sm font-semibold text-text-secondary font-bangla text-right">মোট বকেয়া</th>
                  <th className="px-6 py-4 text-sm font-semibold text-text-secondary font-bangla text-right">সর্বমোট পাওনা</th>
                  <th className="px-6 py-4 text-sm font-semibold text-text-secondary font-bangla text-center">স্ট্যাটাস</th>
                  {isAdmin && <th className="px-6 py-4 text-sm font-semibold text-text-secondary font-bangla text-right">অ্যাকশন</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan={isAdmin ? 7 : 6} className="px-6 py-12 text-center">
                      <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className={`hover:bg-surface-hover transition-colors ${!user.isActive ? 'opacity-60 bg-surface-alt/30' : ''}`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold font-bangla text-white
                            ${user.role === 'SUPER_ADMIN' ? 'bg-primary' : 'bg-secondary'}
                          `}>
                            {user.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-semibold text-sm font-bangla flex items-center gap-1">
                              {isAdmin ? (
                                <Link to={`/admin/users/${user.id}`} className="hover:text-primary hover:underline transition-colors">
                                  {user.name}
                                </Link>
                              ) : (
                                <span>{user.name}</span>
                              )}
                              {user.role === 'SUPER_ADMIN' && <Shield className="w-3 h-3 text-primary" />}
                            </p>
                            <p className="text-xs text-text-muted mt-0.5">যোগدان: {formatDateShort(user.joinDate)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-text-primary">{user.phone || 'N/A'}</p>
                        <p className="text-xs text-text-muted">{user.email}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold text-text-primary">{formatCurrency(user.monthlyAmount)}</p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {user.totalDue > 0 ? (
                          <p className="text-sm font-bold text-danger">{formatCurrency(user.totalDue)}</p>
                        ) : (
                          <p className="text-sm text-text-muted">নেই</p>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <p className="text-sm font-bold text-primary">{formatCurrency(user.totalReceivable || 0)}</p>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Badge variant={user.isActive ? 'active' : 'closed'}>
                          {user.isActive ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                        </Badge>
                      </td>
                      {isAdmin && (
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              title="এডিট"
                              onClick={() => openModal(user)}
                              className="p-2 text-text-secondary hover:text-primary hover:bg-primary/10 rounded-lg transition-colors cursor-pointer"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button 
                              title={user.isActive ? 'নিষ্ক্রিয় করুন' : 'সক্রিয় করুন'}
                              onClick={() => handleToggleActive(user)}
                              className={`p-2 rounded-lg transition-colors cursor-pointer ${
                                user.isActive 
                                  ? 'text-secondary hover:bg-secondary/10' 
                                  : 'text-warning hover:bg-warning/10'
                              }`}
                            >
                              {user.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                            </button>
                            {currentUser?.id !== user.id && (
                              <button 
                                title="মুছে ফেলুন"
                                onClick={() => handleDeleteUser(user)}
                                className="p-2 text-danger hover:bg-danger/10 rounded-lg transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Mobile view (cards list) */}
      <div className="md:hidden space-y-4">
        {loading ? (
          <Card className="p-8 text-center">
            <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
          </Card>
        ) : users.length > 0 ? (
          users.map((user) => (
            <Card key={user.id} className={`p-5 relative ${!user.isActive ? 'opacity-65 bg-surface-alt/30' : ''}`}>
              {/* Top Section: Avatar & Name & Status */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold font-bangla text-white text-base
                    ${user.role === 'SUPER_ADMIN' ? 'bg-primary' : 'bg-secondary'}
                  `}>
                    {user.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-sm font-bangla flex items-center gap-1 text-text-primary">
                      {isAdmin ? (
                        <Link to={`/admin/users/${user.id}`} className="hover:text-primary hover:underline transition-colors">
                          {user.name}
                        </Link>
                      ) : (
                        <span>{user.name}</span>
                      )}
                      {user.role === 'SUPER_ADMIN' && <Shield className="w-3 h-3 text-primary" />}
                    </p>
                    <p className="text-xs text-text-muted mt-0.5 font-bangla">যোগদান: {formatDateShort(user.joinDate)}</p>
                  </div>
                </div>
                <Badge variant={user.isActive ? 'active' : 'closed'}>
                  {user.isActive ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                </Badge>
              </div>

              {/* Contact Info Section */}
              <div className="mt-4 pt-3 border-t border-border/50 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="text-text-muted font-bangla">ফোন</p>
                  <p className="font-semibold text-text-primary mt-0.5">{user.phone || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-text-muted font-bangla">ইমেইল</p>
                  <p className="font-semibold text-text-primary mt-0.5 truncate">{user.email}</p>
                </div>
              </div>

              {/* Financial Metrics Section */}
              <div className="mt-4 p-3 bg-surface-alt rounded-xl grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-[10px] text-text-secondary font-bangla">মাসিক চাঁদা</p>
                  <p className="text-xs font-bold text-text-primary mt-0.5">{formatCurrency(user.monthlyAmount)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-text-secondary font-bangla">মোট বকেয়া</p>
                  {user.totalDue > 0 ? (
                    <p className="text-xs font-bold text-danger mt-0.5">{formatCurrency(user.totalDue)}</p>
                  ) : (
                    <p className="text-xs text-text-muted mt-0.5 font-bangla">নেই</p>
                  )}
                </div>
                <div>
                  <p className="text-[10px] text-text-secondary font-bangla">সর্বমোট পাওনা</p>
                  <p className="text-xs font-bold text-primary mt-0.5">{formatCurrency(user.totalReceivable || 0)}</p>
                </div>
              </div>

              {/* Actions (Admin Only) */}
              {isAdmin && (
                <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-end gap-2">
                  <button 
                    title="এডিট"
                    onClick={() => openModal(user)}
                    className="px-2.5 py-1.5 text-xs text-text-secondary hover:text-primary hover:bg-primary/10 rounded-lg border border-border flex items-center gap-1 transition-colors cursor-pointer font-bangla"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    এডিট
                  </button>
                  <button 
                    title={user.isActive ? 'নিষ্ক্রিয় করুন' : 'সক্রিয় করুন'}
                    onClick={() => handleToggleActive(user)}
                    className={`px-2.5 py-1.5 text-xs rounded-lg border flex items-center gap-1 transition-colors cursor-pointer font-bangla ${
                      user.isActive 
                        ? 'text-secondary border-secondary/20 hover:bg-secondary/10' 
                        : 'text-warning border-warning/20 hover:bg-warning/10'
                    }`}
                  >
                    {user.isActive ? (
                      <>
                        <UserX className="w-3.5 h-3.5" />
                        নিষ্ক্রিয়
                      </>
                    ) : (
                      <>
                        <UserCheck className="w-3.5 h-3.5" />
                        সক্রিয়
                      </>
                    )}
                  </button>
                  {currentUser?.id !== user.id && (
                    <button 
                      title="মুছে ফেলুন"
                      onClick={() => handleDeleteUser(user)}
                      className="p-1.5 text-danger hover:bg-danger/10 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}
            </Card>
          ))
        ) : (
          <Card className="p-8 text-center text-text-muted font-bangla">
            কোনো সদস্যের রেকর্ড পাওয়া যায়নি।
          </Card>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <Card className="w-full max-w-lg bg-white shadow-2xl animate-slide-in relative max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-border flex-shrink-0">
              <h2 className="text-xl font-bold font-bangla">
                {selectedUser ? 'সদস্যের তথ্য আপডেট করুন' : 'নতুন সদস্য যোগ করুন'}
              </h2>
              <button onClick={closeModal} className="p-2 text-text-muted hover:bg-surface-hover rounded-full transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <form id="user-form" onSubmit={handleSave} className="space-y-4">
                <Input
                  label="পূর্ণ নাম"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
                
                <Input
                  label="ইমেইল অ্যাড্রেস"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="ফোন নম্বর"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                  <Input
                    label="মাসিক চাঁদা (৳)"
                    type="number"
                    min="0"
                    value={formData.monthlyAmount}
                    onChange={(e) => setFormData({...formData, monthlyAmount: e.target.value})}
                    required
                  />
                </div>
                
                <Input
                  label="যোগদানের তারিখ"
                  type="date"
                  value={formData.joinDate}
                  onChange={(e) => setFormData({...formData, joinDate: e.target.value})}
                  required
                />

                <div className="pt-2 border-t border-border mt-4">
                  <Input
                    label={selectedUser ? "নতুন পাসওয়ার্ড (পরিবর্তন না করতে চাইলে ফাঁকা রাখুন)" : "পাসওয়ার্ড"}
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    required={!selectedUser}
                  />
                </div>
              </form>
            </div>
            
            <div className="p-6 border-t border-border bg-surface-alt rounded-b-2xl flex justify-end gap-3 flex-shrink-0">
              <Button type="button" variant="outline" onClick={closeModal}>
                বাতিল
              </Button>
              <Button type="submit" form="user-form" loading={isSubmitting}>
                {selectedUser ? 'আপডেট করুন' : 'যোগ করুন'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
