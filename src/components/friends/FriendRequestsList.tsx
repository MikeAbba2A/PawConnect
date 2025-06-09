import { useState, useEffect } from 'react';
import { Check, X, User } from 'lucide-react';
import { format } from 'date-fns';
import { useAuthStore } from '../../store/authStore';
import { 
  getFriendRequests, 
  acceptFriendRequest, 
  rejectFriendRequest 
} from '../../lib/friendService';
import Button from '../ui/Button';
import LoadingSpinner from '../ui/LoadingSpinner';
import type { Friend, User as UserType } from '../../types/database.types';

interface FriendRequestsListProps {
  onRequestHandled?: () => void;
}

const FriendRequestsList: React.FC<FriendRequestsListProps> = ({ onRequestHandled }) => {
  const { user } = useAuthStore();
  const [requests, setRequests] = useState<(Friend & { user: UserType })[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadRequests();
    }
  }, [user]);

  const loadRequests = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const { requests: friendRequests, error: requestsError } = await getFriendRequests(user.id);
      if (requestsError) throw requestsError;

      setRequests(friendRequests);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load friend requests');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (requestId: string) => {
    setProcessingIds(prev => new Set(prev).add(requestId));

    try {
      const { error: acceptError } = await acceptFriendRequest(requestId);
      if (acceptError) throw acceptError;

      // Remove the request from the list
      setRequests(prev => prev.filter(req => req.id !== requestId));
      
      // Notify parent component
      onRequestHandled?.();
      
     
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to accept friend request');
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
    }
  };

  const handleReject = async (requestId: string) => {
    setProcessingIds(prev => new Set(prev).add(requestId));

    try {
      const { error: rejectError } = await rejectFriendRequest(requestId);
      if (rejectError) throw rejectError;

      // Remove the request from the list
      setRequests(prev => prev.filter(req => req.id !== requestId));
      
      // Notify parent component
      onRequestHandled?.();
      
    
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject friend request');
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">{error}</p>
        <Button
          variant="outline"
          size="sm"
          onClick={loadRequests}
        >
          Réessayer
        </Button>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="text-center py-8">
        <User className="w-12 h-12 text-gray-300 mx-auto mb-2" />
        <p className="text-gray-500">Aucune demande d'ami en attente</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {requests.map(request => (
        <div key={request.id} className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <img
                src={request.user.avatar_url || "https://images.pexels.com/photos/1767434/pexels-photo-1767434.jpeg?auto=compress&cs=tinysrgb&w=600"}
                alt={request.user.username}
                className="w-10 h-10 rounded-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = "https://images.pexels.com/photos/1767434/pexels-photo-1767434.jpeg?auto=compress&cs=tinysrgb&w=600";
                }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="space-y-1">
                <h3 className="font-medium text-gray-800 text-sm">{request.user.username}</h3>
                <p className="text-xs text-gray-600">Demande d'ami</p>
                <p className="text-xs text-gray-500">
                  {format(new Date(request.created_at), 'dd MMM yyyy')}
                </p>
              </div>
              
              <div className="flex space-x-2 mt-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleAccept(request.id)}
                  disabled={processingIds.has(request.id)}
                  className="px-2 py-1 text-xs h-7"
                >
                  {processingIds.has(request.id) ? (
                    <LoadingSpinner size="sm" className="mr-1" />
                  ) : (
                    <Check className="w-3 h-3 mr-1" />
                  )}
                  Accepter
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleReject(request.id)}
                  disabled={processingIds.has(request.id)}
                  className="px-2 py-1 text-xs h-7"
                >
                  <X className="w-3 h-3 mr-1" />
                  Refuser
                </Button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default FriendRequestsList;