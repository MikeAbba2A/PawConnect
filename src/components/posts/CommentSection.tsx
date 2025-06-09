import { useState, useEffect } from 'react';
import { Send, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { useAuthStore } from '../../store/authStore';
import { addComment, getPostComments } from '../../lib/postService';
import { deleteComment } from '../../lib/commentService';
import LoadingSpinner from '../ui/LoadingSpinner';
import type { Comment } from '../../types/database.types';

interface CommentSectionProps {
  postId: string;
  isOpen: boolean;
  onClose: () => void;
  onCommentAdded?: () => void;
  onCommentDeleted?: () => void;
}

const CommentSection: React.FC<CommentSectionProps> = ({ 
  postId, 
  isOpen, 
  onClose, 
  onCommentAdded,
  onCommentDeleted
}) => {
  const { user } = useAuthStore();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadComments();
    }
  }, [isOpen, postId]);

  const loadComments = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { comments: postComments, error: commentsError } = await getPostComments(postId);
      if (commentsError) throw commentsError;
      
      setComments(postComments);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newComment.trim() || submitting) return;

    setSubmitting(true);
    setError(null);

    try {
      const { comment, error: commentError } = await addComment(
        postId, 
        user.id, 
        newComment.trim()
      );
      
      if (commentError) throw commentError;
      
      // Add the new comment to the list
      setComments(prev => [...prev, comment]);
      setNewComment('');
      
      // Notify parent component
      onCommentAdded?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!user) return;

    try {
      const { error } = await deleteComment(commentId);
      if (error) throw error;
      
      // Remove the comment from the list
      setComments(prev => prev.filter(comment => comment.id !== commentId));
      
      // Notify parent component that a comment was deleted
      onCommentDeleted?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete comment');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">Comments</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Comments list */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner size="lg" />
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={loadComments}
                className="text-salmon-600 hover:text-salmon-700 underline"
              >
                Try again
              </button>
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No comments yet. Be the first to comment!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {comments.map(comment => (
                <div key={comment.id} className="flex space-x-3">
                  <img
                    src={comment.user?.avatar_url || "https://images.pexels.com/photos/1767434/pexels-photo-1767434.jpeg?auto=compress&cs=tinysrgb&w=600"}
                    alt={comment.user?.username}
                    className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "https://images.pexels.com/photos/1767434/pexels-photo-1767434.jpeg?auto=compress&cs=tinysrgb&w=600";
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-gray-800 text-sm">
                          {comment.user?.username}
                        </span>
                        {user?.id === comment.user_id && (
                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            className="text-gray-400 hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <p className="text-gray-700 text-sm">{comment.content}</p>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 ml-3">
                      {format(new Date(comment.created_at), 'MMM d, yyyy • h:mm a')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Comment form */}
        {user && (
          <div className="border-t border-gray-200 p-4">
            <form onSubmit={handleSubmitComment} className="flex space-x-3">
              <img
                src={user.avatar_url || "https://images.pexels.com/photos/1767434/pexels-photo-1767434.jpeg?auto=compress&cs=tinysrgb&w=600"}
                alt={user.username}
                className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = "https://images.pexels.com/photos/1767434/pexels-photo-1767434.jpeg?auto=compress&cs=tinysrgb&w=600";
                }}
              />
              <div className="flex-1 flex space-x-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Write a comment..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-salmon-200 focus:border-salmon-300"
                  disabled={submitting}
                />
                <button
                  type="submit"
                  disabled={!newComment.trim() || submitting}
                  className="p-2 bg-salmon-600 text-white rounded-full hover:bg-salmon-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {submitting ? (
                    <LoadingSpinner size="sm" color="gray" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommentSection;