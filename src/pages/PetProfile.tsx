import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getPetById } from '../lib/petService';
import { getPetPosts } from '../lib/postService';
import { useAuthStore } from '../store/authStore';
import PostCard from '../components/posts/PostCard';
import FollowButton from '../components/pets/FollowButton';
import Button from '../components/ui/Button';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import type { Pet, Post } from '../types/database.types';

const PetProfile = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [pet, setPet] = useState<Pet | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const handlePostDeleted = (postId: string) => {
    setPosts(current => current.filter(post => post.id !== postId));
  };

  const handlePostUpdated = (postId: string) => {
    // Optionally refresh the specific post
  };

  useEffect(() => {
    const loadPetProfile = async () => {
      if (!id) return;
      
      try {
        console.log('Loading pet profile for ID:', id);
        const { pet, error: petError } = await getPetById(id);
        if (petError) throw petError;
        
        console.log('Pet data loaded:', {
          id: pet.id,
          name: pet.name,
          avatar_url: pet.avatar_url,
          banner_url: pet.banner_url
        });
        setPet(pet);
        
        // Load pet's posts
        const { posts: petPosts, error: postsError } = await getPetPosts(id);
        if (postsError) {
          console.error('Error loading posts:', postsError);
        } else {
          console.log('Pet posts loaded:', petPosts);
          setPosts(petPosts);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load pet profile');
      } finally {
        setLoading(false);
      }
    };

    loadPetProfile();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !pet) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg">
        {error || 'Pet not found'}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Banner */}
      <div className="relative h-48 rounded-lg overflow-hidden mb-4">
        <img
          src={pet.banner_url || "https://images.pexels.com/photos/406014/pexels-photo-406014.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"}
          alt="Profile banner"
          className="w-full h-full object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            console.log('Banner image failed to load:', pet.banner_url);
            target.src = "https://images.pexels.com/photos/406014/pexels-photo-406014.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2";
          }}
          onLoad={() => {
            console.log('Banner image loaded successfully:', pet.banner_url);
          }}
        />
      </div>

      {/* Profile info */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex items-start">
          <img
            src={pet.avatar_url || "https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=600"}
            alt={pet.name}
            className="w-24 h-24 rounded-full border-4 border-white shadow-md -mt-12"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              console.error('Avatar image failed to load:', pet.avatar_url);
              console.error('Error details:', e);
              target.src = "https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=600";
            }}
            onLoad={() => {
              console.log('Avatar image loaded successfully:', pet.avatar_url);
            }}
          />
          <div className="ml-4 flex-1">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-800">{pet.name}</h1>
              <div className="flex space-x-2">
                {user?.id === pet.owner_id ? (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => navigate(`/pets/${pet.id}/edit`)}
                  >
                    Edit Profile
                  </Button>
                ) : (
                  <FollowButton 
                    petId={pet.id}
                    petName={pet.name}
                    ownerId={pet.owner_id}
                    size="sm"
                  />
                )}
              </div>
            </div>
            <p className="text-gray-600 mt-1">
              {pet.breed ? `${pet.species} • ${pet.breed}` : pet.species}
            </p>
            {pet.birth_date && (
              <p className="text-gray-500 text-sm mt-1">
                Born {new Date(pet.birth_date).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>

        {pet.description && (
          <p className="text-gray-700 mt-4">{pet.description}</p>
        )}

        <div className="flex gap-4 mt-4 pt-4 border-t border-gray-100">
          <div className="text-center">
            <div className="font-semibold text-gray-800">{posts.length}</div>
            <div className="text-sm text-gray-500">Posts</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-gray-800">0</div>
            <div className="text-sm text-gray-500">Followers</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-gray-800">0</div>
            <div className="text-sm text-gray-500">Following</div>
          </div>
        </div>
      </div>

      {/* Posts */}
      <div className="space-y-4">
        {posts.map(post => (
          <PostCard 
            key={post.id} 
            post={post} 
            onPostDeleted={handlePostDeleted}
            onPostUpdated={handlePostUpdated}
          />
        ))}
        
        {posts.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No posts yet</h3>
            <p className="text-gray-600">
              {user?.id === pet.owner_id
                ? "Share your pet's first update!"
                : `${pet.name} hasn't posted anything yet.`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PetProfile;