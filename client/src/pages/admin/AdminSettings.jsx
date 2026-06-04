import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Card, CardBody } from '../../components/ui/Card';
import api from '../../utils/api';
import {
  Settings as SettingsIcon, User, Lock, Bell, Shield, Save,
  Eye, EyeOff, CheckCircle, AlertCircle, Users, Loader2
} from 'lucide-react';

export default function AdminSettings() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  // User roles state
  const [usersList, setUsersList] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [updatingUserRole, setUpdatingUserRole] = useState(null);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await api.get('/users');
      setUsersList(res.data.users);
    } catch (e) {
      showMessage('ইউজার তালিকা লোড করতে ব্যর্থ হয়েছে', 'error');
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'roles' && usersList.length === 0) {
      fetchUsers();
    }
  }, [activeTab]);

  const handleRoleChange = async (userId, userName, newRole) => {
    if (userId === user.id) {
      showMessage('আপনি নিজের রোল পরিবর্তন করতে পারবেন না', 'error');
      return;
    }
    if (!window.confirm(`আপনি কি নিশ্চিত যে "${userName}" এর রোল পরিবর্তন করে "${newRole === 'SUPER_ADMIN' ? 'অ্যাডমিন' : 'সদস্য'}" করতে চান?`)) {
      return;
    }
    setUpdatingUserRole(userId);
    try {
      await api.put(`/users/${userId}`, { role: newRole });
      showMessage(`"${userName}" এর রোল সফলভাবে পরিবর্তন হয়েছে`);
      setUsersList(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } catch (e) {
      showMessage(e.response?.data?.message || 'রোল পরিবর্তন ব্যর্থ হয়েছে', 'error');
    } finally {
      setUpdatingUserRole(null);
    }
  };

  // Profile form
  const [profile, setProfile] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });

  // Password form
  const [passwords, setPasswords] = useState({
    current: '',
    newPassword: '',
    confirm: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false, newPassword: false, confirm: false,
  });

  const showMessage = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 4000);
  };

  const handleProfileSave = async () => {
    setSaving(true);
    try {
      await api.put(`/users/${user.id}`, profile);
      showMessage('প্রোফাইল সফলভাবে আপডেট হয়েছে');
      // Update local storage
      const stored = JSON.parse(localStorage.getItem('sanchoy_user') || '{}');
      localStorage.setItem('sanchoy_user', JSON.stringify({ ...stored, ...profile }));
    } catch (e) {
      showMessage(e.response?.data?.message || 'আপডেট ব্যর্থ হয়েছে', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwords.newPassword !== passwords.confirm) {
      showMessage('নতুন পাসওয়ার্ড মিলছে না', 'error');
      return;
    }
    if (passwords.newPassword.length < 4) {
      showMessage('পাসওয়ার্ড কমপক্ষে ৪ অক্ষরের হতে হবে', 'error');
      return;
    }
    setSaving(true);
    try {
      await api.put(`/users/${user.id}`, { password: passwords.newPassword });
      showMessage('পাসওয়ার্ড সফলভাবে পরিবর্তন হয়েছে');
      setPasswords({ current: '', newPassword: '', confirm: '' });
    } catch (e) {
      showMessage(e.response?.data?.message || 'পাসওয়ার্ড পরিবর্তন ব্যর্থ', 'error');
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'প্রোফাইল', icon: User },
    { id: 'security', label: 'সিকিউরিটি', icon: Lock },
    { id: 'roles', label: 'ইউজার রোল', icon: Users },
    { id: 'system', label: 'সিস্টেম তথ্য', icon: Shield },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary font-bangla-display flex items-center gap-3">
          <SettingsIcon className="w-7 h-7 text-primary" />
          সেটিংস
        </h1>
        <p className="text-sm text-text-secondary font-bangla mt-1">অ্যাকাউন্ট ও সিস্টেম সেটিংস পরিচালনা করুন</p>
      </div>

      {/* Toast Message */}
      {message && (
        <div className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium animate-fade-in ${
          message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span className="font-bangla">{message.text}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border pb-0">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-t-xl transition-all cursor-pointer ${
              activeTab === tab.id
                ? 'bg-primary text-white shadow-md shadow-primary/20'
                : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span className="font-bangla">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <Card>
          <div className="px-5 py-4 border-b border-border bg-surface-alt/30">
            <h3 className="font-semibold font-bangla text-lg">প্রোফাইল সেটিংস</h3>
            <p className="text-xs text-text-muted font-bangla mt-1">আপনার নাম, ইমেইল ও ফোন নম্বর আপডেট করুন</p>
          </div>
          <CardBody className="p-6 space-y-5">
            {/* Avatar */}
            <div className="flex items-center gap-4 pb-4 border-b border-border/50">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/20">
                <span className="text-2xl font-bold text-white">{user?.name?.charAt(0)}</span>
              </div>
              <div>
                <p className="font-bold text-text-primary text-lg font-bangla">{user?.name}</p>
                <p className="text-sm text-text-muted">{user?.email}</p>
                <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                  {user?.role === 'ADMIN' ? 'অ্যাডমিন' : 'সদস্য'}
                </span>
              </div>
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5 font-bangla">নাম</label>
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  className="w-full border border-border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5 font-bangla">ইমেইল</label>
                <input
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  className="w-full border border-border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5 font-bangla">ফোন নম্বর</label>
                <input
                  type="text"
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  className="w-full border border-border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={handleProfileSave}
                disabled={saving}
                className="flex items-center gap-2 bg-primary hover:bg-primary-600 text-white px-6 py-2.5 rounded-xl font-medium transition-all disabled:opacity-50 cursor-pointer shadow-md shadow-primary/20"
              >
                <Save className="w-4 h-4" />
                <span className="font-bangla">{saving ? 'সেভ হচ্ছে...' : 'সেভ করুন'}</span>
              </button>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <Card>
          <div className="px-5 py-4 border-b border-border bg-surface-alt/30">
            <h3 className="font-semibold font-bangla text-lg">পাসওয়ার্ড পরিবর্তন</h3>
            <p className="text-xs text-text-muted font-bangla mt-1">আপনার অ্যাকাউন্টের নিরাপত্তা বাড়াতে নতুন পাসওয়ার্ড সেট করুন</p>
          </div>
          <CardBody className="p-6 space-y-5 max-w-lg">
            {[
              { key: 'current', label: 'বর্তমান পাসওয়ার্ড', placeholder: 'আপনার বর্তমান পাসওয়ার্ড' },
              { key: 'newPassword', label: 'নতুন পাসওয়ার্ড', placeholder: 'নতুন পাসওয়ার্ড লিখুন' },
              { key: 'confirm', label: 'নতুন পাসওয়ার্ড নিশ্চিত করুন', placeholder: 'আবার নতুন পাসওয়ার্ড লিখুন' },
            ].map(field => (
              <div key={field.key}>
                <label className="block text-sm font-medium text-text-primary mb-1.5 font-bangla">{field.label}</label>
                <div className="relative">
                  <input
                    type={showPasswords[field.key] ? 'text' : 'password'}
                    value={passwords[field.key]}
                    onChange={(e) => setPasswords({ ...passwords, [field.key]: e.target.value })}
                    placeholder={field.placeholder}
                    className="w-full border border-border rounded-xl px-4 py-2.5 pr-12 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({ ...showPasswords, [field.key]: !showPasswords[field.key] })}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary cursor-pointer"
                  >
                    {showPasswords[field.key] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            ))}

            <div className="flex justify-end pt-2">
              <button
                onClick={handlePasswordChange}
                disabled={saving || !passwords.newPassword || !passwords.confirm}
                className="flex items-center gap-2 bg-primary hover:bg-primary-600 text-white px-6 py-2.5 rounded-xl font-medium transition-all disabled:opacity-50 cursor-pointer shadow-md shadow-primary/20"
              >
                <Lock className="w-4 h-4" />
                <span className="font-bangla">{saving ? 'পরিবর্তন হচ্ছে...' : 'পাসওয়ার্ড পরিবর্তন করুন'}</span>
              </button>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Roles Tab */}
      {activeTab === 'roles' && (
        <Card>
          <div className="px-5 py-4 border-b border-border bg-surface-alt/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold font-bangla text-lg">ব্যবহারকারী রোল ব্যবস্থাপনা</h3>
              <p className="text-xs text-text-muted font-bangla mt-1">সদস্যদের রোল পরিবর্তন করে অ্যাডমিন বা সাধারণ সদস্য হিসেবে সেট করুন</p>
            </div>
            <div className="w-full sm:w-64">
              <input
                type="text"
                placeholder="সদস্য খুঁজুন..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full border border-border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-bangla"
              />
            </div>
          </div>
          <CardBody className="p-0">
            {loadingUsers ? (
              <div className="py-12 text-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
                <p className="text-sm text-text-muted font-bangla mt-2">ব্যবহারকারী তালিকা লোড হচ্ছে...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-surface-alt/20 border-b border-border">
                      <th className="px-6 py-3 text-sm font-semibold text-text-secondary font-bangla">নাম ও যোগাযোগ</th>
                      <th className="px-6 py-3 text-sm font-semibold text-text-secondary font-bangla">বর্তমান রোল</th>
                      <th className="px-6 py-3 text-sm font-semibold text-text-secondary font-bangla text-right">রোল পরিবর্তন</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {usersList.filter(u => 
                      u.name.toLowerCase().includes(userSearch.toLowerCase()) || 
                      u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
                      (u.phone && u.phone.includes(userSearch))
                    ).length === 0 ? (
                      <tr>
                        <td colSpan="3" className="px-6 py-8 text-center text-text-muted font-bangla text-sm">
                          কোনো ব্যবহারকারী পাওয়া যায়নি
                        </td>
                      </tr>
                    ) : (
                      usersList
                        .filter(u => 
                          u.name.toLowerCase().includes(userSearch.toLowerCase()) || 
                          u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
                          (u.phone && u.phone.includes(userSearch))
                        )
                        .map((u) => (
                          <tr key={u.id} className="hover:bg-surface-hover/30 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-white font-bangla text-sm
                                  ${u.role === 'SUPER_ADMIN' ? 'bg-primary' : 'bg-secondary'}
                                `}>
                                  {u.name.charAt(0)}
                                </div>
                                <div>
                                  <p className="font-semibold text-sm font-bangla text-text-primary">{u.name}</p>
                                  <p className="text-xs text-text-muted mt-0.5">{u.email} {u.phone && `• ${u.phone}`}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold font-bangla
                                ${u.role === 'SUPER_ADMIN' ? 'bg-primary/10 text-primary' : 'bg-secondary/10 text-secondary'}
                              `}>
                                {u.role === 'SUPER_ADMIN' ? 'অ্যাডমিন' : 'সদস্য'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="inline-flex items-center gap-2 justify-end w-full">
                                {updatingUserRole === u.id && (
                                  <Loader2 className="w-4 h-4 text-primary animate-spin" />
                                )}
                                <select
                                  value={u.role}
                                  disabled={updatingUserRole === u.id || u.id === user.id}
                                  onChange={(e) => handleRoleChange(u.id, u.name, e.target.value)}
                                  className="border border-border rounded-xl px-3 py-1.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-bangla bg-white cursor-pointer disabled:opacity-50"
                                >
                                  <option value="USER">সদস্য (USER)</option>
                                  <option value="SUPER_ADMIN">অ্যাডমিন (SUPER_ADMIN)</option>
                                </select>
                              </div>
                            </td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {/* System Info Tab */}
      {activeTab === 'system' && (
        <Card>
          <div className="px-5 py-4 border-b border-border bg-surface-alt/30">
            <h3 className="font-semibold font-bangla text-lg">সিস্টেম তথ্য</h3>
          </div>
          <CardBody className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { label: 'অ্যাপ্লিকেশন', value: 'FCF 2014 - Group Savings Tracker' },
                { label: 'ভার্সন', value: 'v2.0.0 (Optimized)' },
                { label: 'ব্যাকেন্ড', value: 'Node.js + Express + Prisma ORM' },
                { label: 'ডাটাবেস', value: 'PostgreSQL (Supabase)' },
                { label: 'ফ্রন্টেন্ড', value: 'React + Vite + TailwindCSS' },
                { label: 'হোস্টিং', value: 'Vercel (Seoul Region)' },
                { label: 'লগইন ইউজার', value: user?.name },
                { label: 'রোল', value: user?.role === 'ADMIN' ? 'অ্যাডমিন' : 'সদস্য' },
              ].map((item, i) => (
                <div key={i} className="flex justify-between items-center py-3 px-4 rounded-xl bg-surface-alt/50 border border-border/50">
                  <span className="text-sm text-text-secondary font-bangla">{item.label}</span>
                  <span className="text-sm font-medium text-text-primary">{item.value}</span>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
