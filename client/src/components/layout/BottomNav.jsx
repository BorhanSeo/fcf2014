import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, CreditCard, Receipt, Users, User, TrendingUp,
  FileText, Menu, X, Wallet, Landmark, Settings, LogOut, Calendar
} from 'lucide-react';

export default function BottomNav() {
  const { user, logout, isAdmin, settings } = useAuth();
  const navigate = useNavigate();
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setIsMoreOpen(false);
    navigate('/login');
  };

  // Main tabs (always visible at bottom)
  const adminMainLinks = [
    { to: '/admin', icon: LayoutDashboard, label: 'হোম' },
    { to: '/admin/dues-status', icon: Calendar, label: 'বকেয়া' },
    { to: '/admin/users', icon: Users, label: 'সদস্য' },
  ];

  const userMainLinks = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'হোম' },
    { to: '/payments', icon: CreditCard, label: 'পেমেন্ট' },
    { to: '/dues', icon: Receipt, label: 'বকেয়া' },
  ];

  const mainLinks = isAdmin ? adminMainLinks : userMainLinks;

  // More links (inside slide-up menu)
  const adminMoreLinks = [
    { to: '/admin/investments', icon: TrendingUp, label: 'বিনিয়োগ' },
    { to: '/admin/incomes', icon: Wallet, label: 'আয় / মুনাফা' },
    { to: '/admin/expenses', icon: Receipt, label: 'খরচ' },
    { to: '/admin/assets', icon: Landmark, label: 'সম্পদ' },
    { to: '/admin/reports', icon: FileText, label: 'রিপোর্ট' },
    { to: '/admin/settings', icon: Settings, label: 'সেটিংস' },
  ];

  const userMoreLinks = [
    { to: '/profile', icon: User, label: 'প্রোফাইল' },
  ];

  if (settings?.user_view_users === 'true') {
    userMoreLinks.push({ to: '/users', icon: Users, label: 'সদস্য তালিকা' });
  }
  if (settings?.user_view_investments === 'true') {
    userMoreLinks.push({ to: '/investments', icon: TrendingUp, label: 'বিনিয়োগ' });
  }
  if (settings?.user_view_incomes === 'true') {
    userMoreLinks.push({ to: '/incomes', icon: Wallet, label: 'আয় / মুনাফা' });
  }
  if (settings?.user_view_expenses === 'true') {
    userMoreLinks.push({ to: '/expenses', icon: Receipt, label: 'খরচ' });
  }
  if (settings?.user_view_assets === 'true') {
    userMoreLinks.push({ to: '/assets', icon: Landmark, label: 'সম্পদ' });
  }
  if (settings?.user_view_reports === 'true') {
    userMoreLinks.push({ to: '/reports', icon: FileText, label: 'রিপোর্ট' });
  }

  const moreLinks = isAdmin ? adminMoreLinks : userMoreLinks;

  return (
    <>
      {/* Backdrop */}
      {isMoreOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40 animate-fade-in"
          onClick={() => setIsMoreOpen(false)}
        />
      )}

      {/* Slide-up Bottom Sheet */}
      <div
        className={`md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-border rounded-t-3xl shadow-2xl p-6 pb-10 z-50 transition-transform duration-300 ease-out transform ${
          isMoreOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        {/* Handle bar */}
        <div className="w-12 h-1 bg-border rounded-full mx-auto mb-5" />

        {/* User Summary / Header */}
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold font-bangla">
            {user?.name?.charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-semibold text-text-primary truncate font-bangla">{user?.name}</h4>
            <p className="text-xs text-text-muted truncate">{user?.email}</p>
          </div>
          <button
            onClick={() => setIsMoreOpen(false)}
            className="p-1.5 rounded-full hover:bg-surface-hover transition-colors text-text-muted cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Grid of Links */}
        <div className="grid grid-cols-3 gap-y-6 gap-x-4 mb-6">
          {moreLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={() => setIsMoreOpen(false)}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center p-3 rounded-2xl transition-all duration-200 border ${
                  isActive
                    ? 'bg-primary/5 border-primary/20 text-primary font-semibold'
                    : 'border-transparent text-text-secondary hover:bg-surface-hover hover:text-text-primary'
                }`
              }
            >
              <div className="w-10 h-10 rounded-xl bg-surface-alt flex items-center justify-center mb-1.5 transition-colors">
                <link.icon className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bangla text-center leading-tight truncate w-full">{link.label}</span>
            </NavLink>
          ))}
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-danger/20 text-danger bg-danger/5 hover:bg-danger/10 transition-colors font-bangla font-semibold cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          লগআউট
        </button>
      </div>

      {/* Bottom Nav Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-border z-40 safe-area-bottom">
        <div className="flex items-center justify-around h-16">
          {mainLinks.map((link) => {
            const IconComponent = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/admin' || link.to === '/dashboard'}
                onClick={() => setIsMoreOpen(false)}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center gap-0.5 px-2 py-1 rounded-lg transition-colors ${
                    isActive && !isMoreOpen ? 'text-primary' : 'text-text-muted'
                  }`
                }
              >
                <IconComponent className="w-5 h-5" />
                <span className="text-[10px] font-bangla font-medium">{link.label}</span>
              </NavLink>
            );
          })}

          {/* More trigger */}
          <button
            onClick={() => setIsMoreOpen(!isMoreOpen)}
            className={`flex flex-col items-center justify-center gap-0.5 px-2 py-1 rounded-lg transition-colors cursor-pointer ${
              isMoreOpen ? 'text-primary' : 'text-text-muted'
            }`}
          >
            <Menu className="w-5 h-5" />
            <span className="text-[10px] font-bangla font-medium">আরও</span>
          </button>
        </div>
      </nav>
    </>
  );
}
