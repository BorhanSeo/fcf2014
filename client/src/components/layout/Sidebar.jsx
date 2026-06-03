import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, Users, CreditCard, TrendingUp, Receipt,
  FileText, LogOut, PiggyBank, ChevronLeft, ChevronRight, Calendar,
  Wallet, Landmark
} from 'lucide-react';
import { useState } from 'react';

export default function Sidebar() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const adminLinks = [
    { to: '/admin', icon: LayoutDashboard, label: 'ড্যাশবোর্ড' },
    { to: '/admin/dues-status', icon: Calendar, label: 'মাসিক বকেয়া' },
    { to: '/admin/users', icon: Users, label: 'সদস্য ব্যবস্থাপনা' },
    { to: '/admin/investments', icon: TrendingUp, label: 'বিনিয়োগ' },
    { to: '/admin/incomes', icon: Wallet, label: 'আয় / মুনাফা' },
    { to: '/admin/expenses', icon: Receipt, label: 'খরচ' },
    { to: '/admin/assets', icon: Landmark, label: 'সম্পদ' },
    { to: '/admin/reports', icon: FileText, label: 'রিপোর্ট' },
  ];

  const userLinks = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'ড্যাশবোর্ড' },
    { to: '/payments', icon: CreditCard, label: 'পেমেন্ট হিস্ট্রি' },
    { to: '/dues', icon: Receipt, label: 'বকেয়া পেমেন্ট' },
    { to: '/profile', icon: Users, label: 'প্রোফাইল' },
  ];

  const links = isAdmin ? adminLinks : userLinks;

  return (
    <aside
      className={`hidden md:flex flex-col bg-white border-r border-border h-screen sticky top-0 transition-all duration-300 ${
        collapsed ? 'w-[72px]' : 'w-[260px]'
      }`}
    >
      {/* Brand */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-border">
        <div className="w-10 h-10 flex items-center justify-center flex-shrink-0">
          <img src="/logo.png" alt="FCF 2014" className="w-full h-full object-contain" />
        </div>
        {!collapsed && (
          <div className="animate-fade-in">
            <h1 className="text-lg font-bold text-primary leading-tight">FCF 2014</h1>
            <p className="text-[10px] text-text-secondary -mt-1">Group Savings Tracker</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === '/admin' || link.to === '/dashboard'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                isActive
                  ? 'bg-primary text-white shadow-md shadow-primary/20'
                  : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
              }`
            }
          >
            <link.icon className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span className="font-bangla">{link.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User info + Collapse */}
      <div className="border-t border-border p-3 space-y-2">
        {!collapsed && (
          <div className="flex items-center gap-3 px-2 animate-fade-in">
            <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center">
              <span className="text-sm font-bold text-secondary font-bangla">
                {user?.name?.charAt(0)}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-text-primary truncate font-bangla">{user?.name}</p>
              <p className="text-xs text-text-muted truncate">{user?.email}</p>
            </div>
          </div>
        )}
        <div className="flex items-center gap-2">
          <button
            onClick={handleLogout}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm text-danger hover:bg-danger/5 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            {!collapsed && <span className="font-bangla">লগআউট</span>}
          </button>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 rounded-xl text-text-muted hover:bg-surface-hover transition-colors cursor-pointer"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </aside>
  );
}
