import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, CreditCard, Receipt, Users, TrendingUp, FileText } from 'lucide-react';

export default function BottomNav() {
  const { isAdmin } = useAuth();

  const adminLinks = [
    { to: '/admin', icon: LayoutDashboard, label: 'হোম' },
    { to: '/admin/users', icon: Users, label: 'সদস্য' },
    { to: '/admin/investments', icon: TrendingUp, label: 'বিনিয়োগ' },
    { to: '/admin/reports', icon: FileText, label: 'রিপোর্ট' },
  ];

  const userLinks = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'হোম' },
    { to: '/payments', icon: CreditCard, label: 'পেমেন্ট' },
    { to: '/dues', icon: Receipt, label: 'বকেয়া' },
  ];

  const links = isAdmin ? adminLinks : userLinks;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-border z-50 safe-area-bottom">
      <div className="flex items-center justify-around h-16">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === '/admin' || link.to === '/dashboard'}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-0.5 px-2 py-1 rounded-lg transition-colors ${
                isActive ? 'text-primary' : 'text-text-muted'
              }`
            }
          >
            <link.icon className="w-5 h-5" />
            <span className="text-[10px] font-bangla font-medium">{link.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
