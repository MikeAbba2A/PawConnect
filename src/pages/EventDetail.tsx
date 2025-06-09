import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  Users, 
  Share2, 
  Edit,
  Trash2,
  UserPlus,
  UserMinus,
  MessageCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useAuthStore } from '../store/authStore';
import { 
  getEventById, 
  joinEvent, 
  leaveEvent, 
  deleteEvent,
  getEventParticipants 
} from '../lib/eventService';
import { getFriends } from '../lib/friendService';
import { getOrCreateConversation, sendTextMessage } from '../lib/messageService';
import EventShareModal from '../components/events/EventShareModal';
import Button from '../components/ui/Button';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import type { Event, EventParticipant, Friend, User } from '../types/database.types';

const EventDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [event, setEvent] = useState<Event | null>(null);
  const [participants, setParticipants] = useState<EventParticipant[]>([]);
  const [friends, setFriends] = useState<(Friend & { user: User; friend: User })[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [invitingFriends, setInvitingFriends] = useState<Set<string>>(new Set());
  const [showShareModal, setShowShareModal] = useState(false);

  useEffect(() => {
    if (id) {
      loadEventData();
    }
  }, [id, user]);

  const loadEventData = async () => {
    if (!id) return;

    setLoading(true);
    setError(null);

    try {
      // Load event details
      const { event: eventData, error: eventError } = await getEventById(id, user?.id);
      if (eventError) throw eventError;

      setEvent(eventData);

      // Load participants
      const { participants: participantsData, error: participantsError } = await getEventParticipants(id);
      if (participantsError) throw participantsError;

      setParticipants(participantsData);

      // Load friends for invitations (only if user is organizer)
      if (user && eventData.organizer_id === user.id) {
        const { friends: friendsData, error: friendsError } = await getFriends(user.id);
        if (!friendsError) {
          setFriends(friendsData);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load event');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinEvent = async () => {
    if (!user || !event || actionLoading) return;

    setActionLoading(true);
    try {
      const { error } = await joinEvent(event.id, user.id);
      if (error) throw error;

      // Update local state
      setEvent(prev => prev ? { 
        ...prev, 
        is_participating: true,
        participants_count: (prev.participants_count || 0) + 1
      } : null);

      // Reload participants list
      loadEventData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join event');
    } finally {
      setActionLoading(false);
    }
  };

  const handleLeaveEvent = async () => {
    if (!user || !event || actionLoading) return;

    setActionLoading(true);
    try {
      const { error } = await leaveEvent(event.id, user.id);
      if (error) throw error;

      // Update local state
      setEvent(prev => prev ? { 
        ...prev, 
        is_participating: false,
        participants_count: Math.max(0, (prev.participants_count || 0) - 1)
      } : null);

      // Reload participants list
      loadEventData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to leave event');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteEvent = async () => {
    if (!event || !user) return;

    setActionLoading(true);
    try {
      const { error } = await deleteEvent(event.id);
      if (error) throw error;

      navigate('/events');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete event');
    } finally {
      setActionLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleInviteFriend = async (friendId: string) => {
    if (!user || !event || invitingFriends.has(friendId)) return;

    setInvitingFriends(prev => new Set(prev).add(friendId));

    try {
      // Create or get conversation
      const { conversationId, error: convError } = await getOrCreateConversation(user.id, friendId);
      if (convError) throw convError;

      // Send invitation message
      const inviteMessage = `🎉 Je t'invite à rejoindre l'événement "${event.title}" ! 
📅 ${formatEventDate(event.date_start, event.date_end)}
📍 ${event.location || 'Lieu à confirmer'}

Tu peux voir les détails et t'inscrire ici : ${window.location.href}`;

      const { error: messageError } = await sendTextMessage(conversationId, user.id, inviteMessage);
      if (messageError) throw messageError;

      // Show success feedback
      console.log('Invitation envoyée avec succès');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send invitation');
    } finally {
      setInvitingFriends(prev => {
        const newSet = new Set(prev);
        newSet.delete(friendId);
        return newSet;
      });
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

  const isOrganizer = user && event && user.id === event.organizer_id;
  const canJoin = user && event && !event.is_participating && 
    (!event.max_participants || (event.participants_count || 0) < event.max_participants);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="mb-4">
          <button
            onClick={() => navigate('/events')}
            className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Retour aux événements
          </button>
        </div>
        <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg">
          {error || 'Événement non trouvé'}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/events')}
          className="flex items-center text-gray-600 hover:text-gray-800 transition-colors mb-4"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Retour aux événements
        </button>
      </div>

      {/* Event Image */}
      <div className="relative h-64 md:h-80 rounded-lg overflow-hidden mb-6">
        <img
          src={event.image_url || "https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=1200"}
          alt={event.title}
          className="w-full h-full object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = "https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=1200";
          }}
        />
        <div className="absolute inset-0 bg-black bg-opacity-40" />
        <div className="absolute bottom-4 left-4 right-4">
          <div className="flex items-center mb-2">
            <span 
              className="px-3 py-1 text-sm font-medium text-white rounded-full"
              style={{ backgroundColor: event.event_type_info?.color || '#6B7280' }}
            >
              {event.event_type_info?.icon} {event.event_type_info?.name}
            </span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">{event.title}</h1>
          <div className="flex items-center text-white text-sm">
            <img
              src={event.organizer?.avatar_url || "https://images.pexels.com/photos/1767434/pexels-photo-1767434.jpeg?auto=compress&cs=tinysrgb&w=600"}
              alt={event.organizer?.username}
              className="w-6 h-6 rounded-full object-cover mr-2"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = "https://images.pexels.com/photos/1767434/pexels-photo-1767434.jpeg?auto=compress&cs=tinysrgb&w=600";
              }}
            />
            Organisé par {event.organizer?.username}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Event Info */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="space-y-4">
              <div className="flex items-start">
                <Calendar className="w-5 h-5 text-gray-400 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-medium text-gray-800">Date et heure</h3>
                  <p className="text-gray-600">{formatEventDate(event.date_start, event.date_end)}</p>
                </div>
              </div>

              {event.location && (
                <div className="flex items-start">
                  <MapPin className="w-5 h-5 text-gray-400 mr-3 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-medium text-gray-800">Lieu</h3>
                    <p className="text-gray-600">{event.location}</p>
                    {event.address && (
                      <p className="text-sm text-gray-500 mt-1">{event.address}</p>
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-start">
                <Users className="w-5 h-5 text-gray-400 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-medium text-gray-800">Participants</h3>
                  <p className="text-gray-600">
                    {event.participants_count || 0} participant{(event.participants_count || 0) !== 1 ? 's' : ''}
                    {event.max_participants && ` / ${event.max_participants} maximum`}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          {event.description && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-medium text-gray-800 mb-3">Description</h3>
              <div className="prose prose-sm max-w-none">
                <p className="text-gray-700 whitespace-pre-wrap">{event.description}</p>
              </div>
            </div>
          )}

          {/* Participants List */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-medium text-gray-800 mb-4">
              Participants ({participants.length})
            </h3>
            {participants.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                Aucun participant pour le moment
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {participants.map(participant => (
                  <div key={participant.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <img
                      src={participant.user?.avatar_url || "https://images.pexels.com/photos/1767434/pexels-photo-1767434.jpeg?auto=compress&cs=tinysrgb&w=600"}
                      alt={participant.user?.username}
                      className="w-10 h-10 rounded-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "https://images.pexels.com/photos/1767434/pexels-photo-1767434.jpeg?auto=compress&cs=tinysrgb&w=600";
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-800 truncate">
                        {participant.user?.username}
                        {participant.user_id === event.organizer_id && (
                          <span className="ml-2 text-xs bg-salmon-100 text-salmon-800 px-2 py-1 rounded-full">
                            Organisateur
                          </span>
                        )}
                      </p>
                      <p className="text-sm text-gray-500">
                        Inscrit le {format(new Date(participant.created_at), 'dd MMM', { locale: fr })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Action Buttons */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="space-y-3">
              {isOrganizer ? (
                <>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => navigate(`/events/${event.id}/edit`)}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Modifier l'événement
                  </Button>
                  <Button
                    variant="secondary"
                    className="w-full"
                    onClick={() => setShowInviteModal(true)}
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Inviter des amis
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full text-red-600 border-red-300 hover:bg-red-50"
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Supprimer l'événement
                  </Button>
                </>
              ) : (
                <>
                  {event.is_participating ? (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={handleLeaveEvent}
                      disabled={actionLoading}
                    >
                      {actionLoading ? (
                        <LoadingSpinner size="sm" className="mr-2" />
                      ) : (
                        <UserMinus className="w-4 h-4 mr-2" />
                      )}
                      Se désinscrire
                    </Button>
                  ) : canJoin ? (
                    <Button
                      className="w-full"
                      onClick={handleJoinEvent}
                      disabled={actionLoading}
                    >
                      {actionLoading ? (
                        <LoadingSpinner size="sm" className="mr-2" />
                      ) : (
                        <UserPlus className="w-4 h-4 mr-2" />
                      )}
                      Participer
                    </Button>
                  ) : (
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-gray-600 text-sm">
                        {event.max_participants && (event.participants_count || 0) >= event.max_participants
                          ? 'Événement complet'
                          : 'Vous participez déjà à cet événement'
                        }
                      </p>
                    </div>
                  )}
                  
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setShowShareModal(true)}
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Inviter des amis
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Organizer Info */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-medium text-gray-800 mb-4">Organisateur</h3>
            <div className="flex items-center space-x-3">
              <img
                src={event.organizer?.avatar_url || "https://images.pexels.com/photos/1767434/pexels-photo-1767434.jpeg?auto=compress&cs=tinysrgb&w=600"}
                alt={event.organizer?.username}
                className="w-12 h-12 rounded-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = "https://images.pexels.com/photos/1767434/pexels-photo-1767434.jpeg?auto=compress&cs=tinysrgb&w=600";
                }}
              />
              <div className="flex-1">
                <p className="font-medium text-gray-800">{event.organizer?.username}</p>
                {event.organizer?.bio && (
                  <p className="text-sm text-gray-600 mt-1">{event.organizer.bio}</p>
                )}
              </div>
            </div>
            {!isOrganizer && (
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-3"
                onClick={() => navigate(`/users/${event.organizer_id}`)}
              >
                Voir le profil
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Supprimer l'événement
            </h3>
            <p className="text-gray-600 mb-4">
              Êtes-vous sûr de vouloir supprimer cet événement ? Cette action est irréversible et tous les participants seront notifiés.
            </p>
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={actionLoading}
              >
                Annuler
              </Button>
              <Button
                variant="outline"
                className="text-red-600 border-red-300 hover:bg-red-50"
                onClick={handleDeleteEvent}
                disabled={actionLoading}
              >
                {actionLoading ? 'Suppression...' : 'Supprimer'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Invite Friends Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-96 overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800">Inviter des amis</h3>
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-xl font-bold"
                >
                  ×
                </button>
              </div>
            </div>
            
            <div className="max-h-80 overflow-y-auto p-4">
              {friends.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">Aucun ami à inviter</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {friends.map(friendship => {
                    const friend = friendship.user_id === user?.id ? friendship.friend : friendship.user;
                    const isInviting = invitingFriends.has(friend.id);
                    
                    return (
                      <div key={friend.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <img
                            src={friend.avatar_url || "https://images.pexels.com/photos/1767434/pexels-photo-1767434.jpeg?auto=compress&cs=tinysrgb&w=600"}
                            alt={friend.username}
                            className="w-8 h-8 rounded-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = "https://images.pexels.com/photos/1767434/pexels-photo-1767434.jpeg?auto=compress&cs=tinysrgb&w=600";
                            }}
                          />
                          <span className="font-medium text-gray-800">{friend.username}</span>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleInviteFriend(friend.id)}
                          disabled={isInviting}
                        >
                          {isInviting ? (
                            <LoadingSpinner size="sm" />
                          ) : (
                            <>
                              <MessageCircle className="w-4 h-4 mr-1" />
                              Inviter
                            </>
                          )}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      <EventShareModal
        event={event}
        currentUserId={user?.id || ''}
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
      />
    </div>
  );
};

export default EventDetail;