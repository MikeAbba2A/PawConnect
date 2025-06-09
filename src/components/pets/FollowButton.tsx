import { useState, useEffect } from 'react';
import { Heart, HeartOff } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { followPet, unfollowPet, isFollowingPet } from '../../lib/followService';
import Button from '../ui/Button';
import LoadingSpinner from '../ui/LoadingSpinner';

interface FollowButtonProps {
  petId: string;
  petName: string;
  ownerId: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const FollowButton: React.FC<FollowButtonProps> = ({ 
  petId, 
  petName, 
  ownerId,
  className = '',
  size = 'sm'
}) => {
  const { user } = useAuthStore();
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user && petId && user.id !== ownerId) {
      checkFollowStatus();
    } else {
      setLoading(false);
    }
  }, [user, petId, ownerId]);

  const checkFollowStatus = async () => {
    if (!user) return;

    try {
      const { isFollowing: followStatus, error: checkError } = await isFollowingPet(user.id, petId);
      
      if (checkError) throw checkError;
      setIsFollowing(followStatus);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check follow status');
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!user || actionLoading) return;

    setActionLoading(true);
    setError(null);

    try {
      if (isFollowing) {
        const { error: unfollowError } = await unfollowPet(user.id, petId);
        if (unfollowError) throw unfollowError;
        setIsFollowing(false);
      } else {
        const { error: followError } = await followPet(user.id, petId);
        if (followError) throw followError;
        setIsFollowing(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update follow status');
    } finally {
      setActionLoading(false);
    }
  };

  // Don't show button for own pets or if not logged in
  if (!user || user.id === ownerId) {
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
        <p className="text-red-600 text-xs">{error}</p>
      </div>
    );
  }

  return (
    <Button
      variant={isFollowing ? "secondary" : "outline"}
      size={size}
      onClick={handleFollow}
      disabled={actionLoading}
      className={`${className} ${isFollowing ? 'bg-green-600 hover:bg-green-700 text-white' : 'border-green-600 text-green-600 hover:bg-green-50'}`}
    >
      {actionLoading ? (
        <LoadingSpinner size="sm" className="mr-2" />
      ) : isFollowing ? (
        <HeartOff className="w-4 h-4 mr-2" />
      ) : (
        <Heart className="w-4 h-4 mr-2" />
      )}
      {isFollowing ? 'Suivi' : 'Suivre'}
    </Button>
  );
};

export default FollowButton;