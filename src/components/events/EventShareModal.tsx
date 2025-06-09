import { useState, useEffect } from 'react';
import { X, Send, Users, Check } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { getFriendsNotParticipating, sendEventInvitation } from '../../lib/eventService';
import Button from '../ui/Button';
import LoadingSpinner from '../ui/LoadingSpinner';
import type { Event, Friend, User } from '../../types/database.types';

interface EventShareModalProps {
  event: Event;
  currentUserId: string;
  isOpen: boolean;
  onClose: () => void;
}

const EventShareModal: React.FC<EventShareModalProps> = ({
  event,
  currentUserId,
  isOpen,
  onClose
}) => {
  const [friends, setFriends] = useState<(Friend & { user: User; friend: User })[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFriends, setSelectedFriends] = useState<Set<string>>(new Set());
  const [invitingFriends, setInvitingFriends] = useState<Set<string>>(new Set());
  const [invitedFriends, setInvitedFriends] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadFriendsNotParticipating();
    }
  }, [isOpen, event.id, currentUserId]);

  const loadFriendsNotParticipating = async () => {
    setLoading(true);
    setError(null);

    try {
      const { friends: nonParticipatingFriends, error: friendsError } = await getFriendsNotParticipating(
        currentUserId,
        event.id
      );
      
      if (friendsError) throw friendsError;
      setFriends(nonParticipatingFriends);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des amis');
    } finally {
      setLoading(false);
    }
  };

  const formatEventDate = (dateStart: string, dateEnd?: string) => {
    const start = new Date(dateStart);
    const end = dateEnd ? new Date(dateEnd) : null;

    if (end && format(start, 'yyyy-MM-dd') !== format(end, 'yyyy-MM-dd')) {
      return `Du ${format(start, 'dd MMM', { locale: fr })} au ${format(end, 'dd MMM yyyy', { locale: fr })}`;
    } else if (end) {
      return `${format(start, 'dd MMM yyyy', { locale: fr })} de ${format(start, 'HH:mm')} à ${format(end, 'HH:mm')}`;
    } else {
      return format(start, 'dd MMM yyyy à HH:mm', { locale: fr });
    }
  };

  const handleFriendToggle = (friendId: string) => {
    const newSelected = new Set(selectedFriends);
    if (newSelected.has(friendId)) {
      newSelected.delete(friendId);
    } else {
      newSelected.add(friendId);
    }
    setSelectedFriends(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedFriends.size === friends.length) {
      setSelectedFriends(new Set());
    } else {
      const allFriendIds = friends.map(friendship => 
        friendship.user_id === currentUserId ? friendship.friend_id : friendship.user_id
      );
      setSelectedFriends(new Set(allFriendIds));
    }
  };

  const handleInviteFriend = async (friendId: string) => {
    if (invitingFriends.has(friendId) || invitedFriends.has(friendId)) return;

    setInvitingFriends(prev => new Set(prev).add(friendId));

    try {
      const { error: inviteError } = await sendEventInvitation(
        event.id,
        event.title,
        formatEventDate(event.date_start, event.date_end),
        event.location || '',
        currentUserId,
        friendId
      );

      if (inviteError) throw inviteError;

      setInvitedFriends(prev => new Set(prev).add(friendId));
      setSelectedFriends(prev => {
        const newSet = new Set(prev);
        newSet.delete(friendId);
        return newSet;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'envoi de l\'invitation');
    } finally {
      setInvitingFriends(prev => {
        const newSet = new Set(prev);
        newSet.delete(friendId);
        return newSet;
      });
    }
  };

  const handleInviteSelected = async () => {
    if (selectedFriends.size === 0) return;

    const friendsToInvite = Array.from(selectedFriends);
    
    // Invite all selected friends in parallel
    const invitePromises = friendsToInvite.map(friendId => handleInviteFriend(friendId));
    await Promise.all(invitePromises);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800">Inviter des amis</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Invitez vos amis à "{event.title}"
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <LoadingSpinner size="lg" />
            </div>
          ) : error ? (
            <div className="p-4 text-center">
              <p className="text-red-600 mb-4">{error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={loadFriendsNotParticipating}
              >
                Réessayer
              </Button>
            </div>
          ) : friends.length === 0 ? (
            <div className="p-8 text-center">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-700 mb-2">
                Tous vos amis participent déjà !
              </h3>
              <p className="text-gray-500">
                Tous vos amis sont déjà inscrits à cet événement ou vous n'avez pas d'amis à inviter.
              </p>
            </div>
          ) : (
            <>
              {/* Select all section */}
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    {friends.length} ami{friends.length > 1 ? 's' : ''} disponible{friends.length > 1 ? 's' : ''}
                  </span>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleSelectAll}
                      className="text-sm text-salmon-600 hover:text-salmon-700 font-medium"
                    >
                      {selectedFriends.size === friends.length ? 'Tout désélectionner' : 'Tout sélectionner'}
                    </button>
                    {selectedFriends.size > 0 && (
                      <Button
                        size="sm"
                        onClick={handleInviteSelected}
                        disabled={Array.from(selectedFriends).some(id => invitingFriends.has(id))}
                      >
                        Inviter ({selectedFriends.size})
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Friends list */}
              <div className="divide-y divide-gray-100">
                {friends.map(friendship => {
                  const friend = friendship.user_id === currentUserId ? friendship.friend : friendship.user;
                  const isSelected = selectedFriends.has(friend.id);
                  const isInviting = invitingFriends.has(friend.id);
                  const isInvited = invitedFriends.has(friend.id);

                  return (
                    <div key={friend.id} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center space-x-3">
                        {/* Checkbox */}
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleFriendToggle(friend.id)}
                          disabled={isInviting || isInvited}
                          className="w-4 h-4 text-salmon-600 border-gray-300 rounded focus:ring-salmon-500"
                        />

                        {/* Friend info */}
                        <img
                          src={friend.avatar_url || "https://images.pexels.com/photos/1767434/pexels-photo-1767434.jpeg?auto=compress&cs=tinysrgb&w=600"}
                          alt={friend.username}
                          className="w-10 h-10 rounded-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = "https://images.pexels.com/photos/1767434/pexels-photo-1767434.jpeg?auto=compress&cs=tinysrgb&w=600";
                          }}
                        />
                        
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-800 truncate">{friend.username}</p>
                          {friend.bio && (
                            <p className="text-sm text-gray-500 truncate">{friend.bio}</p>
                          )}
                        </div>

                        {/* Action button */}
                        <div className="flex-shrink-0">
                          {isInvited ? (
                            <div className="flex items-center text-green-600">
                              <Check className="w-4 h-4 mr-1" />
                              <span className="text-sm font-medium">Invité</span>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleInviteFriend(friend.id)}
                              disabled={isInviting}
                              className="flex items-center px-3 py-1 text-sm bg-salmon-600 text-white rounded-lg hover:bg-salmon-700 disabled:opacity-50 transition-colors"
                            >
                              {isInviting ? (
                                <LoadingSpinner size="sm" className="mr-1" />
                              ) : (
                                <Send className="w-3 h-3 mr-1" />
                              )}
                              Inviter
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {friends.length > 0 && !loading && (
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <p className="text-xs text-gray-500 text-center">
              Les invitations seront envoyées par message privé
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventShareModal;