import { useState, useEffect } from 'react';
import { Grid, List } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { getFeedPosts } from '../lib/postService';
import PostCard from '../components/posts/PostCard';
import CreatePostButton from '../components/posts/CreatePostButton';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import type { Post } from '../types/database.types';

const Feed = () => {
  const { user } = useAuthStore();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  const loadPosts = async (pageNum = 1, append = false) => {
    if (!user) return;
    
    console.log('🔍 Feed: Loading posts for user:', user.username, 'page:', pageNum);
    setLoading(true);
    setError(null);
    
    try {
      const { posts: newPosts, error: postsError } = await getFeedPosts(user.id, pageNum);
      
      if (postsError) throw new Error(postsError.message);
      
      console.log('🔍 Feed: Received posts:', newPosts);
      
      if (append) {
        setPosts(current => [...current, ...newPosts]);
      } else {
        setPosts(newPosts);
      }
      
      setHasMore(newPosts.length === 10); // Assuming 10 is the limit per page
    } catch (err) {
      console.error('🔍 Feed: Error loading posts:', err);
      setError(err instanceof Error ? err.message : 'Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    if (loading || !hasMore) return;
    const nextPage = page + 1;
    setPage(nextPage);
    loadPosts(nextPage, true);
  };
  
  const handlePostDeleted = (postId: string) => {
    setPosts(current => current.filter(post => post.id !== postId));
  };

  const handlePostUpdated = (postId: string) => {
    // Optionally refresh the specific post or the entire feed
    // For now, we'll just let the comment count update locally
  };

  useEffect(() => {
    if (user) {
      loadPosts();
    }
  }, [user]);

  return (
    <div className="max-w-2xl mx-auto">
      {/* View Mode Toggle */}
      <div className="mb-4 flex justify-end">
        <div className="bg-white rounded-lg shadow-sm p-1 flex">
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-md transition-colors ${
              viewMode === 'list'
                ? 'bg-salmon-100 text-salmon-600'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
            title="Affichage liste"
          >
            <List className="w-5 h-5" />
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-md transition-colors ${
              viewMode === 'grid'
                ? 'bg-salmon-100 text-salmon-600'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
            title="Affichage mosaïque"
          >
            <Grid className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="mb-4">
        <CreatePostButton />
      </div>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg mb-4">
          {error}
          <button
            onClick={() => loadPosts()}
            className="ml-2 text-salmon-600 hover:text-salmon-700 underline"
          >
            Try again
          </button>
        </div>
      )}
      
      {posts.length === 0 && !loading && !error ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Your feed is empty</h3>
          <p className="text-gray-600 mb-4">
            Follow some pets or create your own pet profile to see posts here.
          </p>
        </div>
      ) : (
        <div className={viewMode === 'grid' ? 'grid grid-cols-2 gap-4' : 'space-y-4'}>
          {posts.map(post => (
            <PostCard 
              key={post.id} 
              post={post} 
              onPostDeleted={handlePostDeleted}
              onPostUpdated={handlePostUpdated}
              compact={viewMode === 'grid'}
            />
          ))}
          
          {loading && viewMode === 'list' && (
            <div className="flex justify-center p-4">
              <LoadingSpinner />
            </div>
          )}
          
          {hasMore && !loading && viewMode === 'list' && (
            <div className="flex justify-center p-4">
              <button
                onClick={loadMore}
                className="px-4 py-2 bg-salmon-100 text-salmon-700 rounded-full hover:bg-salmon-200 transition-colors"
              >
                Load more
              </button>
            </div>
          )}
        </div>
      )}
      
      {/* Grid mode loading and load more */}
      {viewMode === 'grid' && (
        <>
          {loading && (
            <div className="flex justify-center p-4 col-span-2">
              <LoadingSpinner />
            </div>
          )}
          
          {hasMore && !loading && (
            <div className="flex justify-center p-4 col-span-2">
              <button
                onClick={loadMore}
                className="px-4 py-2 bg-salmon-100 text-salmon-700 rounded-full hover:bg-salmon-200 transition-colors"
              >
                Load more
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Feed;