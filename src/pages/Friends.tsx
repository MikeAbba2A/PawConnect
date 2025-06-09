import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Search, MessageCircle } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { getFriends } from '../lib/friendService';
import { getOrCreateConversation } from '../lib/messageService';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import type { Friend, User } from '../types/database.types';

const Friends = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [friends, setFriends] = useState<(Friend & { user: User; friend: User })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

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

  // Filter friends based on search term
  const filteredFriends = friends.filter(friendship => {
    const friend = friendship.user_id === user?.id ? friendship.friend : friendship.user;
    return friend.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
           (friend.bio && friend.bio.toLowerCase().includes(searchTerm.toLowerCase()));
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center mb-4">
          <Users className="w-8 h-8 text-salmon-600 mr-3" />
          <h1 className="text-3xl font-bold text-gray-800">Mes Amis</h1>
        </div>
        <p className="text-gray-600">
          Restez en contact avec tous vos amis propriétaires d'animaux
        </p>
      </div>

      {/* Search bar */}
      {friends.length > 0 && (
        <div className="mb-6">
          <div className="relative max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Rechercher un ami..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-salmon-200 focus:border-salmon-300"
            />
          </div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg mb-6">
          {error}
          <button
            onClick={loadFriends}
            className="ml-2 text-salmon-600 hover:text-salmon-700 underline"
          >
            Réessayer
          </button>
        </div>
      )}

      {/* Content */}
      {friends.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            Aucun ami pour le moment
          </h3>
          <p className="text-gray-600 mb-6">
            Commencez à vous faire des amis en explorant les profils d'autres propriétaires d'animaux
            et en leur envoyant des demandes d'ami !
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-salmon-600 text-white rounded-lg hover:bg-salmon-700 transition-colors"
          >
            Explorer le feed
          </button>
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-800">{friends.length}</div>
                  <div className="text-sm text-gray-500">
                    {friends.length === 1 ? 'Ami' : 'Amis'}
                  </div>
                </div>
                {searchTerm && (
                  <div className="text-center">
                    <div className="text-2xl font-bold text-salmon-600">{filteredFriends.length}</div>
                    <div className="text-sm text-gray-500">Résultats</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Friends grid */}
          {filteredFriends.length === 0 && searchTerm ? (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                Aucun résultat trouvé
              </h3>
              <p className="text-gray-600">
                Aucun ami ne correspond à votre recherche "{searchTerm}"
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredFriends.map(friendship => {
                const friend = friendship.user_id === user?.id ? friendship.friend : friendship.user;
                
                return (
                  <div
                    key={friend.id}
                    className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                  >
                    {/* Friend avatar */}
                    <div 
                      className="relative h-48 cursor-pointer bg-gradient-to-br from-salmon-100 to-salmon-50 flex items-center justify-center"
                      onClick={() => handleViewProfile(friend.id)}
                    >
                      <img
                        src={friend.avatar_url || "https://images.pexels.com/photos/1767434/pexels-photo-1767434.jpeg?auto=compress&cs=tinysrgb&w=600"}
                        alt={friend.username}
                        className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = "https://images.pexels.com/photos/1767434/pexels-photo-1767434.jpeg?auto=compress&cs=tinysrgb&w=600";
                        }}
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 transition-all duration-200 rounded-t-lg" />
                    </div>

                    {/* Friend info */}
                    <div className="p-4">
                      <div className="text-center mb-3">
                        <h3 
                          className="font-bold text-gray-800 text-lg cursor-pointer hover:text-salmon-600 transition-colors"
                          onClick={() => handleViewProfile(friend.id)}
                        >
                          {friend.username}
                        </h3>
                        {friend.bio && (
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {friend.bio}
                          </p>
                        )}
                      </div>

                      {/* Friendship date */}
                      <p className="text-xs text-gray-400 mb-4 text-center">
                        Amis depuis le {new Date(friendship.created_at).toLocaleDateString('fr-FR')}
                      </p>

                      {/* Actions */}
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleViewProfile(friend.id)}
                          className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                        >
                          Voir profil
                        </button>
                        <button
                          onClick={() => handleSendMessage(friend.id)}
                          className="px-3 py-2 bg-salmon-600 text-white rounded-lg hover:bg-salmon-700 transition-colors"
                          title="Envoyer un message"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Friends;