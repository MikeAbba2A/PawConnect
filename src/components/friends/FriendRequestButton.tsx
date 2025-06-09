import { useState, useEffect } from 'react';
import { UserPlus, UserCheck, UserX, Clock, MessageCircle } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { 
  sendFriendRequest, 
  removeFriend, 
  checkFriendshipStatus 
} from '../../lib/friendService';
import { getOrCreateConversation } from '../../lib/messageService';
import Button from '../ui/Button';
import LoadingSpinner from '../ui/LoadingSpinner';
import type { Friend } from '../../types/database.types';
import { useNavigate } from 'react-router-dom';

interface FriendRequestButtonProps {
  targetUserId: string;
  targetUsername: string;
  className?: string;
}

type FriendshipStatus = 'none' | 'pending_sent' | 'pending_received' | 'friends';

const FriendRequestButton: React.FC<FriendRequestButtonProps> = ({ 
  targetUserId, 
  targetUsername,
  className = '' 
}) => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [status, setStatus] = useState<FriendshipStatus>('none');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [friendship, setFriendship] = useState<Friend | null>(null);

  useEffect(() => {
    if (user && targetUserId && user.id !== targetUserId) {
      checkStatus();
    } else {
      setLoading(false);
    }
  }, [user, targetUserId]);

  const checkStatus = async () => {
    if (!user) return;

    try {
      const { friendship: friendshipData, error: checkError } = await checkFriendshipStatus(user.id, targetUserId);
      
      if (checkError) throw checkError;

      if (!friendshipData) {
        setStatus('none');
        setFriendship(null);
      } else {
        setFriendship(friendshipData);
        
        if (friendshipData.status === 'accepted') {
          setStatus('friends');
        } else if (friendshipData.status === 'pending') {
          // Check who sent the request
          if (friendshipData.user_id === user.id) {
            setStatus('pending_sent');
          } else {
            setStatus('pending_received');
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check friendship status');
    } finally {
      setLoading(false);
    }
  };

  const handleSendRequest = async () => {
    if (!user || actionLoading) return;

    setActionLoading(true);
    setError(null);

    try {
      const { error: sendError } = await sendFriendRequest(user.id, targetUserId);
      if (sendError) throw sendError;

      setStatus('pending_sent');
      
      // Show success message
      // TODO: Add toast notification
      console.log(`Demande d'ami envoyée à ${targetUsername}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send friend request');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveFriend = async () => {
    if (!user || !friendship || actionLoading) return;

    setActionLoading(true);
    setError(null);

    try {
      const { error: removeError } = await removeFriend(user.id, targetUserId);
      if (removeError) throw removeError;

      setStatus('none');
      setFriendship(null);
      
      // Show success message
      console.log(`Ami supprimé: ${targetUsername}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove friend');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!user || actionLoading) return;

    console.log('🔍 handleSendMessage called for user:', targetUserId);
    
    setError(null);

    try {
      // Créer ou récupérer la conversation
      console.log('🔍 Creating conversation between:', user.id, 'and', targetUserId);
      const { conversationId, error: convError } = await getOrCreateConversation(user.id, targetUserId);
      if (convError) throw convError;

      console.log('🔍 Conversation created/found:', conversationId);
      
      // Rediriger vers la page de messages avec la conversation sélectionnée
      navigate(`/messages?conversation=${conversationId}`);
      console.log('🔍 Navigating to messages with conversation:', conversationId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start conversation');
      console.error('Error starting conversation:', err);
    }
  };
  // Don't show button for own profile
  if (!user || user.id === targetUserId) {
    return null;
  }

  if (loading) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <LoadingSpinner size="sm" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={className}>
        <p className="text-red-600 text-sm">{error}</p>
        <Button
          variant="outline"
          size="sm"
          onClick={checkStatus}
          className="mt-1"
        >
          Réessayer
        </Button>
      </div>
    );
  }

  // Debug: Log current status
  console.log('🔍 FriendRequestButton status:', status, 'for user:', targetUsername);

  const getButtonContent = () => {
    switch (status) {
      case 'none':
        return {
          icon: UserPlus,
          text: 'Ajouter ami',
          variant: 'primary' as const,
          onClick: handleSendRequest
        };
      
      case 'pending_sent':
        return {
          icon: Clock,
          text: 'Demande envoyée',
          variant: 'outline' as const,
          onClick: handleRemoveFriend,
          disabled: false
        };
      
      case 'pending_received':
        return {
          icon: UserCheck,
          text: 'Répondre à la demande',
          variant: 'secondary' as const,
          onClick: () => {
            // TODO: Open friend request modal or navigate to notifications
            console.log('Navigate to friend requests');
          }
        };
      
      case 'friends':
        return {
          icon: UserCheck,
          text: 'Amis',
          variant: 'secondary' as const,
          onClick: handleRemoveFriend
        };
      
      default:
        return null;
    }
  };

  const buttonContent = getButtonContent();
  if (!buttonContent) return null;

  const Icon = buttonContent.icon;

  return (
    <div className={`flex flex-col space-y-2 ${className}`}>
      <Button
        variant={buttonContent.variant}
        size="sm"
        onClick={buttonContent.onClick}
        disabled={actionLoading || buttonContent.disabled}
      >
        {actionLoading ? (
          <LoadingSpinner size="sm" className="mr-2" />
        ) : (
          <Icon className="w-4 h-4 mr-2" />
        )}
        {buttonContent.text}
      </Button>
      
      {/* Bouton Message - seulement si ils sont amis */}
      {status === 'friends' && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleSendMessage}
          disabled={actionLoading}
          className="bg-white hover:bg-gray-50 text-salmon-600 border-salmon-600 hover:border-salmon-700"
        >
          {actionLoading ? (
            <LoadingSpinner size="sm" className="mr-2" />
          ) : (
            <MessageCircle className="w-4 h-4 mr-2" />
          )}
          Message
        </Button>
      )}
    </div>
  );
};

export default FriendRequestButton;