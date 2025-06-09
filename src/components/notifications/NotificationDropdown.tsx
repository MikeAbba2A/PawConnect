import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, CheckCheck, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { useAuthStore } from '../../store/authStore';
import { 
  getUserNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead,
  deleteNotification 
} from '../../lib/notificationService';
import LoadingSpinner from '../ui/LoadingSpinner';
import type { Notification } from '../../types/database.types';

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  onNotificationRead: () => void;
  onAllRead: () => void;
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  isOpen,
  onClose,
  onNotificationRead,
  onAllRead
}) => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fermer le dropdown quand on clique à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Charger les notifications quand le dropdown s'ouvre
  useEffect(() => {
    if (isOpen && user) {
      loadNotifications();
    }
  }, [isOpen, user]);

  const loadNotifications = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const { notifications: userNotifications, error: notifError } = await getUserNotifications(user.id);
      if (notifError) throw notifError;

      setNotifications(userNotifications);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    // Marquer comme lu si pas encore lu
    if (!notification.is_read) {
      await markNotificationAsRead(notification.id);
      setNotifications(prev => 
        prev.map(n => n.id === notification.id ? { ...n, is_read: true } : n)
      );
      onNotificationRead();
    }

    // Rediriger selon le type de notification
    onClose();
    
    if (notification.type === 'friend_request') {
      // Pour les demandes d'ami, on pourrait rediriger vers une page dédiée
      // ou simplement fermer la notification
      console.log('Friend request notification clicked');
    } else if (notification.post_id) {
      navigate(`/posts/${notification.post_id}`);
    }
  };

  const handleMarkAsRead = async (notificationId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    const { error } = await markNotificationAsRead(notificationId);
    if (!error) {
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
      onNotificationRead();
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!user) return;

    const { error } = await markAllNotificationsAsRead(user.id);
    if (!error) {
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      onAllRead();
    }
  };

  const handleDeleteNotification = async (notificationId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    const { error } = await deleteNotification(notificationId);
    if (!error) {
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    }
  };

  if (!isOpen) return null;

  const unreadNotifications = notifications.filter(n => !n.is_read);

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-hidden"
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-800">Notifications</h3>
          {unreadNotifications.length > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="text-sm text-salmon-600 hover:text-salmon-700 flex items-center"
            >
              <CheckCheck className="w-4 h-4 mr-1" />
              Tout marquer comme lu
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-h-80 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner size="lg" />
          </div>
        ) : error ? (
          <div className="p-4 text-center">
            <p className="text-red-600 mb-2">{error}</p>
            <button
              onClick={loadNotifications}
              className="text-salmon-600 hover:text-salmon-700 underline"
            >
              Réessayer
            </button>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center">
            <Bell className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500">Aucune notification</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications.map(notification => (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                  !notification.is_read ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-start space-x-3">
                  {/* Show pet image for follow and new_post notifications, user image for others */}
                  {(notification.type === 'follow' || notification.type === 'new_post') && notification.post?.pet ? (
                    <img
                      src={notification.post.pet.avatar_url || "https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=600"}
                      alt={notification.post.pet.name}
                      className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=600";
                      }}
                    />
                  ) : (
                    <img
                      src={notification.from_user?.avatar_url || "https://images.pexels.com/photos/1767434/pexels-photo-1767434.jpeg?auto=compress&cs=tinysrgb&w=600"}
                      alt={notification.from_user?.username}
                      className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "https://images.pexels.com/photos/1767434/pexels-photo-1767434.jpeg?auto=compress&cs=tinysrgb&w=600";
                      }}
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800">{notification.message}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {format(new Date(notification.created_at), 'MMM d, yyyy • h:mm a')}
                    </p>
                    {!notification.is_read && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2"></div>
                    )}
                  </div>
                  <div className="flex items-center space-x-1">
                    {!notification.is_read && (
                      <button
                        onClick={(e) => handleMarkAsRead(notification.id, e)}
                        className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                        title="Marquer comme lu"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={(e) => handleDeleteNotification(notification.id, e)}
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationDropdown;