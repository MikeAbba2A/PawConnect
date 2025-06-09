import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { getPostById } from '../lib/postService';
import PostCard from '../components/posts/PostCard';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import type { Post } from '../types/database.types';

const PostDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPost = async () => {
      if (!id) return;

      try {
        const { post: postData, error: postError } = await getPostById(id);
        if (postError) throw postError;

        setPost(postData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load post');
      } finally {
        setLoading(false);
      }
    };

    loadPost();
  }, [id]);

  const handlePostDeleted = () => {
    navigate('/');
  };

  const handlePostUpdated = () => {
    // Optionally refresh the post
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg">
          {error || 'Post not found'}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header with back button */}
      <div className="mb-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Retour
        </button>
      </div>

      {/* Post */}
      <PostCard
        post={post}
        onPostDeleted={handlePostDeleted}
        onPostUpdated={handlePostUpdated}
      />
    </div>
  );
};

export default PostDetail;