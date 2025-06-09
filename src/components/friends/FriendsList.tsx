import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, User } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { getFriends } from '../../lib/friendService';
import { getOrCreateConversation } from '../../lib/messageService';
import LoadingSpinner from '../ui/LoadingSpinner';
import type { Friend, User as UserType } from '../../types/database.types';

const FriendsList = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [friends, setFriends] = useState<(Friend & { user: UserType; friend: UserType })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadFriends();
    }
  }, [user]);

  const loadFriends = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const { friends: userFriends, error: friendsError } = await getFriends(user.id);
      if (friendsError) throw friendsError;

      setFriends(userFriends);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load friends');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (friendId: string) => {
    if (!user) return;

    try {
      const { conversationId, error: convError } = await getOrCreateConversation(user.id, friendId);
      if (convError) throw convError;

      navigate(`/messages?conversation=${conversationId}`);
    } catch (err) {
      console.error('Error starting conversation:', err);
    }
  };

  const handleViewProfile = (friendId: string) => {
    navigate(`/users/${friendId}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <LoadingSpinner size="sm" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-4">
        <p className="text-red-600 text-xs mb-2">{error}</p>
        <button
          onClick={loadFriends}
          className="text-salmon-600 hover:text-salmon-700 text-xs underline"
        >
          Réessayer
        </button>
      </div>
    );
  }

  if (friends.length === 0) {
    return (
      <div className="text-center py-4">
        <User className="w-8 h-8 text-gray-300 mx-auto mb-2" />
        <p className="text-gray-500 text-xs">Aucun ami pour le moment</p>
      </div>
    );
  }

  // Show only first 5 friends in sidebar, with option to see more
  const displayedFriends = friends.slice(0, 5);
  const hasMore = friends.length > 5;

  return (
    <div className="space-y-2">
      {displayedFriends.map(friendship => {
        const friend = friendship.user_id === user?.id ? friendship.friend : friendship.user;
        
        return (
          <div key={friend.id} className="group">
            <div className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-50 transition-colors">
              <img
                src={friend.avatar_url || "https://images.pexels.com/photos/1767434/pexels-photo-1767434.jpeg?auto=compress&cs=tinysrgb&w=600"}
                alt={friend.username}
                className="w-8 h-8 rounded-full object-cover cursor-pointer"
                onClick={() => handleViewProfile(friend.id)}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = "https://images.pexels.com/photos/1767434/pexels-photo-1767434.jpeg?auto=compress&cs=tinysrgb&w=600";
                }}
              />
              <div className="flex-1 min-w-0">
                <p 
                  className="text-sm font-medium text-gray-800 truncate cursor-pointer hover:text-salmon-600 transition-colors"
                  onClick={() => handleViewProfile(friend.id)}
                >
                  {friend.username}
                </p>
              </div>
              <button
                onClick={() => handleSendMessage(friend.id)}
                className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-salmon-600 transition-all"
                title="Envoyer un message"
              >
                <MessageCircle className="w-4 h-4" />
              </button>
            </div>
          </div>
        );
      })}
      
      {hasMore && (
        <div className="pt-2">
          <button
            onClick={() => navigate('/friends')}
            className="w-full text-xs text-salmon-600 hover:text-salmon-700 text-center py-1"
          >
            Voir tous les amis ({friends.length})
          </button>
        </div>
      )}
    </div>
  );
};

export default FriendsList;