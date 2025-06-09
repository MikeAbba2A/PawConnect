import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, MessageCircle, Share2, Lock, Globe, Send } from 'lucide-react';
import { format } from 'date-fns';
import { useAuthStore } from '../../store/authStore';
import { likePost, unlikePost, deletePost } from '../../lib/postService';
import { getOrCreateConversation, sendPostShareMessage } from '../../lib/messageService';
import { getFriends } from '../../lib/friendService';
import PostOptionsMenu from './PostOptionsMenu';
import ImageCarousel from './ImageCarousel';
import CommentSection from './CommentSection';
import FollowButton from '../pets/FollowButton';
import LoadingSpinner from '../ui/LoadingSpinner';
import type { Post, Friend, User } from '../../types/database.types';

interface PostCardProps {
  post: Post;
  onPostDeleted?: (postId: string) => void;
  onPostUpdated?: (postId: string) => void;
  compact?: boolean;
}

const PostCard: React.FC<PostCardProps> = ({ post, onPostDeleted, onPostUpdated, compact = false }) => {
  const { user } = useAuthStore();
  const [liked, setLiked] = useState(post.has_liked || false);
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);
  const [commentsCount, setCommentsCount] = useState(post.comments_count || 0);
  const [isLiking, setIsLiking] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [friends, setFriends] = useState<(Friend & { user: User; friend: User })[]>([]);
  const [sharingTo, setSharingTo] = useState<string | null>(null);

  // Update state when post prop changes (e.g., after reconnection)
  useEffect(() => {
    setLiked(post.has_liked || false);
    setLikesCount(post.likes_count || 0);
    setCommentsCount(post.comments_count || 0);
  }, [post.has_liked, post.likes_count, post.comments_count]);
  
  const handleLike = async () => {
    if (!user || isLiking) return;
    
    setIsLiking(true);
    
    try {
      if (liked) {
        await unlikePost(post.id, user.id);
        setLiked(false);
        setLikesCount(prev => prev - 1);
      } else {
        await likePost(post.id, user.id);
        setLiked(true);
        setLikesCount(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    } finally {
      setIsLiking(false);
    }
  };
  
  const handleEdit = () => {
    // TODO: Implement edit functionality
    console.log('Edit post:', post.id);
  };
  
  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };
  
  const confirmDelete = async () => {
    if (!user) return;
    
    setIsDeleting(true);
    try {
      const { error } = await deletePost(post.id);
      if (error) throw error;
      
      // Notify parent component that post was deleted
      onPostDeleted?.(post.id);
    } catch (error) {
      console.error('Error deleting post:', error);
      // TODO: Show error message to user
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };
  
  const cancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  const handleCommentClick = () => {
    setShowComments(true);
  };

  const handleCommentAdded = () => {
    // Increment the comments count locally
    setCommentsCount(prev => prev + 1);
    onPostUpdated?.(post.id);
  };

  const handleCommentDeleted = () => {
    // Decrement the comments count locally
    setCommentsCount(prev => Math.max(0, prev - 1));
    onPostUpdated?.(post.id);
  };
  const handleShareClick = async () => {
    if (!user) return;
    
    try {
      const { friends: userFriends, error } = await getFriends(user.id);
      if (error) throw error;
      
      setFriends(userFriends);
      setShowShareModal(true);
    } catch (error) {
      console.error('Error loading friends:', error);
    }
  };

  const handleShareToFriend = async (friendId: string) => {
    if (!user || sharingTo) return;

    setSharingTo(friendId);
    
    try {
      // Créer ou récupérer la conversation
      const { conversationId, error: convError } = await getOrCreateConversation(user.id, friendId);
      if (convError) throw convError;

      // Envoyer le post
      const { error: shareError } = await sendPostShareMessage(
        conversationId,
        user.id,
        post.id,
        post.content || `Post de ${post.pet?.name}`,
        post.image_urls?.[0]
      );
      
      if (shareError) throw shareError;

      setShowShareModal(false);
      // TODO: Afficher un toast de confirmation
      console.log('Post partagé avec succès');
    } catch (error) {
      console.error('Error sharing post:', error);
    } finally {
      setSharingTo(null);
    }
  };
  
  return (
    <>
      <div className={`bg-white rounded-lg shadow-sm overflow-hidden ${compact ? 'text-sm' : ''}`}>
        {/* Post header */}
        <div className={`flex items-center ${compact ? 'p-3' : 'p-4'}`}>
          <div className="flex items-center flex-1">
            <Link to={`/pets/${post.pet?.id}`}>
              <img
                src={post.pet?.avatar_url || "https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=600"}
                alt={post.pet?.name}
                className={`${compact ? 'h-8 w-8' : 'h-10 w-10'} rounded-full object-cover`}
              />
            </Link>
            <div className={`${compact ? 'ml-2' : 'ml-3'} flex-1`}>
              <div className="flex items-center space-x-2">
                <Link to={`/pets/${post.pet?.id}`} className={`font-medium text-gray-800 hover:underline ${compact ? 'text-sm' : ''}`}>
                  {post.pet?.name}
                </Link>
                {!compact && (
                  <FollowButton 
                    petId={post.pet?.id || ''}
                    petName={post.pet?.name || ''}
                    ownerId={post.pet?.owner_id || ''}
                    size="sm"
                  />
                )}
              </div>
              <div className={`flex items-center text-gray-500 ${compact ? 'text-xs' : 'text-xs'}`}>
                {post.is_private ? (
                  <Lock className={`${compact ? 'w-2 h-2' : 'w-3 h-3'} mr-1`} />
                ) : (
                  <Globe className={`${compact ? 'w-2 h-2' : 'w-3 h-3'} mr-1`} />
                )}
                {post.location && `${post.location} • `}
                {format(new Date(post.created_at), 'MMM d, yyyy')}
              </div>
            </div>
          </div>
          <PostOptionsMenu 
            post={post}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </div>
        
        {/* Post content */}
        {post.content && (
          <div className={`${compact ? 'px-3 pb-2' : 'px-4 pb-3'}`}>
            <p className={`text-gray-800 ${compact ? 'text-sm line-clamp-3' : ''}`}>{post.content}</p>
          </div>
        )}
        
        {/* Post image */}
        <ImageCarousel 
          images={post.image_urls || []} 
          alt="Post image"
        />
        
        {/* Post video */}
        {post.video_url && (
          <div className="w-full">
            <video
              src={post.video_url}
              controls
              className="w-full h-auto"
            />
          </div>
        )}
        
        {/* Post stats */}
        <div className={`${compact ? 'px-3 py-1' : 'px-4 py-2'} border-t border-gray-100 flex ${compact ? 'text-xs' : 'text-sm'} text-gray-500`}>
          <div className="mr-4">
            <span>{likesCount}</span> {likesCount === 1 ? 'paw' : 'paws'}
          </div>
          <div>
            <span>{commentsCount}</span> {commentsCount === 1 ? 'comment' : 'comments'}
          </div>
        </div>
        
        {/* Post actions */}
        <div className={`${compact ? 'px-1 py-1' : 'px-2 py-2'} border-t border-gray-100 flex`}>
          <button
            onClick={handleLike}
            className={`flex-1 flex items-center justify-center ${compact ? 'p-1' : 'p-2'} rounded-md transition-colors ${
              liked ? 'text-salmon-600' : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            <Heart className={`${compact ? 'h-4 w-4' : 'h-5 w-5'} ${liked ? 'fill-salmon-600' : ''}`} />
            {!compact && <span className="ml-2">Paw</span>}
          </button>
          
          <button
            onClick={handleCommentClick}
            className={`flex-1 flex items-center justify-center ${compact ? 'p-1' : 'p-2'} text-gray-500 hover:bg-gray-50 rounded-md`}
          >
            <MessageCircle className={`${compact ? 'h-4 w-4' : 'h-5 w-5'}`} />
            {!compact && <span className="ml-2">Comment</span>}
          </button>
          
          <button 
            onClick={handleShareClick}
            className={`flex-1 flex items-center justify-center ${compact ? 'p-1' : 'p-2'} text-gray-500 hover:bg-gray-50 rounded-md`}
          >
            <Share2 className={`${compact ? 'h-4 w-4' : 'h-5 w-5'}`} />
            {!compact && <span className="ml-2">Share</span>}
          </button>
        </div>
      </div>
      
      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Supprimer le post
            </h3>
            <p className="text-gray-600 mb-4">
              Êtes-vous sûr de vouloir supprimer ce post ? Cette action est irréversible.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={cancelDelete}
                disabled={isDeleting}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {isDeleting ? 'Suppression...' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Comments modal */}
      <CommentSection
        postId={post.id}
        isOpen={showComments}
        onClose={() => setShowComments(false)}
        onCommentAdded={handleCommentAdded}
        onCommentDeleted={handleCommentDeleted}
      />
      
      {/* Share modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-96 overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800">Partager avec</h3>
                <button
                  onClick={() => setShowShareModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-xl font-bold"
                >
                  ×
                </button>
              </div>
            </div>
            
            <div className="max-h-80 overflow-y-auto">
              {friends.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-gray-500">Aucun ami disponible</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {friends.map(friendship => {
                    const friend = friendship.user_id === user?.id ? friendship.friend : friendship.user;
                    const isSharing = sharingTo === friend.id;
                    
                    return (
                      <button
                        key={friend.id}
                        onClick={() => handleShareToFriend(friend.id)}
                        disabled={isSharing}
                        className="w-full p-4 flex items-center space-x-3 hover:bg-gray-50 transition-colors disabled:opacity-50"
                      >
                        <img
                          src={friend.avatar_url || "https://images.pexels.com/photos/1767434/pexels-photo-1767434.jpeg?auto=compress&cs=tinysrgb&w=600"}
                          alt={friend.username}
                          className="w-10 h-10 rounded-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = "https://images.pexels.com/photos/1767434/pexels-photo-1767434.jpeg?auto=compress&cs=tinysrgb&w=600";
                          }}
                        />
                        <div className="flex-1 text-left">
                          <p className="font-medium text-gray-800">{friend.username}</p>
                        </div>
                        {isSharing ? (
                          <LoadingSpinner size="sm" />
                        ) : (
                          <Send className="w-4 h-4 text-gray-400" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PostCard;