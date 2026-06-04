import { useAuth } from '../../context/AuthContext';
import { Bell, Search, Check, Circle } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import api from '../../utils/api';
import { formatDateShort } from '../../utils/dateHelpers';

export default function Header() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    fetchNotifications();
    
    // Polling every 1 minute
    const interval = setInterval(fetchNotifications, 60000);
    
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      clearInterval(interval);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data.notifications);
      setUnreadCount(res.data.unreadCount);
    } catch (error) {
      console.error('Failed to fetch notifications', error);
    }
  };

  const markAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark read', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all read', error);
    }
  };

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
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 rounded-xl text-text-secondary hover:bg-surface-hover transition-colors relative cursor-pointer"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-danger text-white text-[10px] font-bold flex items-center justify-center rounded-full border border-white">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl shadow-primary/10 border border-border overflow-hidden z-50 animate-scale-in origin-top-right">
                <div className="flex items-center justify-between p-4 border-b border-border bg-surface-alt/50">
                  <h3 className="font-bold text-text-primary font-bangla">নোটিফিকেশন</h3>
                  {unreadCount > 0 && (
                    <button 
                      onClick={markAllAsRead}
                      className="text-xs text-primary hover:text-primary-dark font-bangla font-medium transition-colors"
                    >
                      সব মার্ক রিড
                    </button>
                  )}
                </div>
                
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length > 0 ? (
                    <div className="divide-y divide-border">
                      {notifications.map(notification => (
                        <div 
                          key={notification.id} 
                          onClick={() => !notification.isRead && markAsRead(notification.id)}
                          className={`p-4 transition-colors cursor-pointer flex gap-3 ${notification.isRead ? 'bg-white hover:bg-surface-hover' : 'bg-primary/5 hover:bg-primary/10'}`}
                        >
                          <div className="mt-1">
                            {notification.isRead ? <Check className="w-4 h-4 text-text-muted" /> : <Circle className="w-4 h-4 text-primary fill-primary" />}
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold text-text-primary font-bangla">{notification.title}</h4>
                            <p className="text-xs text-text-secondary font-bangla mt-1">{notification.message}</p>
                            <span className="text-[10px] text-text-muted mt-2 block">{formatDateShort(notification.createdAt)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-text-muted font-bangla text-sm">
                      কোনো নোটিফিকেশন নেই
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
