import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { getUnreadNotificationsCount } from '../../lib/notificationService';
import NotificationDropdown from './NotificationDropdown';

const NotificationBell = () => {
  const { user } = useAuthStore();
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!user) return;

    const loadUnreadCount = async () => {
      const { count, error } = await getUnreadNotificationsCount(user.id);
      if (!error) {
        setUnreadCount(count);
      }
    };

    loadUnreadCount();

    // Rafraîchir le compteur toutes les 30 secondes
    const interval = setInterval(loadUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const handleNotificationRead = () => {
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const handleAllRead = () => {
    setUnreadCount(0);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-full text-gray-600 hover:bg-gray-100 relative"
      >
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <NotificationDropdown
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onNotificationRead={handleNotificationRead}
        onAllRead={handleAllRead}
      />
    </div>
  );
};

export default NotificationBell;