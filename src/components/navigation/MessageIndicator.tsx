import { useState, useEffect, useRef } from 'react';
import { MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { getUserConversations, subscribeToConversations } from '../../lib/messageService';

const MessageIndicator = () => {
  const { user } = useAuthStore();
  const [unreadCount, setUnreadCount] = useState(0);
  const subscriptionRef = useRef<any>(null);

  useEffect(() => {
    if (!user) return;

    const loadUnreadCount = async () => {
      try {
        const { conversations, error } = await getUserConversations(user.id);
        if (error) throw error;

        // Calculer le total des messages non lus
        const totalUnread = conversations.reduce((total, conv) => {
          return total + (conv.unread_count || 0);
        }, 0);

        setUnreadCount(totalUnread);
      } catch (err) {
        console.error('Error loading unread messages count:', err);
      }
    };

    loadUnreadCount();

    // Nettoyer l'ancienne souscription avant d'en créer une nouvelle
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
      subscriptionRef.current = null;
    }

    // S'abonner aux mises à jour des conversations pour mettre à jour le compteur en temps réel
    const channel = subscribeToConversations(user.id, (updatedConversation) => {
      // Recharger le compteur quand une conversation est mise à jour
      loadUnreadCount();
    });

    // S'abonner au canal
    subscriptionRef.current = channel.subscribe();

    // Rafraîchir le compteur toutes les 30 secondes
    const interval = setInterval(loadUnreadCount, 30000);

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
      clearInterval(interval);
    };
  }, [user?.id]); // Dépendance uniquement sur user.id

  return (
    <Link to="/messages" className="p-2 rounded-full text-gray-600 hover:bg-gray-100 relative">
      <MessageCircle className="h-6 w-6" />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-salmon-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </Link>
  );
};

export default MessageIndicator;