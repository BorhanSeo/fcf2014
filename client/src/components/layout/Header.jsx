import { useAuth } from '../../context/AuthContext';
import { Bell, Search, Menu } from 'lucide-react';

export default function Header() {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-border">
      <div className="flex items-center justify-between h-14 px-4 md:px-6">
        <div className="flex items-center gap-3 md:hidden">
          <div className="w-8 h-8 flex items-center justify-center">
            <img src="/logo.png" alt="FCF 2014" className="w-full h-full object-contain" />
          </div>
          <span className="font-bold text-primary">FCF 2014</span>
        </div>

        <div className="hidden md:block">
          <h2 className="text-lg font-semibold text-text-primary">
            স্বাগতম, <a href="/profile" className="font-bangla hover:text-primary transition-colors">{user?.name}</a> 👋
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button className="p-2 rounded-xl text-text-secondary hover:bg-surface-hover transition-colors cursor-pointer">
            <Search className="w-5 h-5" />
          </button>
          <button className="p-2 rounded-xl text-text-secondary hover:bg-surface-hover transition-colors relative cursor-pointer">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full"></span>
          </button>
        </div>
      </div>
    </header>
  );
}
