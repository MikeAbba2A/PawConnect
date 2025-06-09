import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Image as ImageIcon, Video, MapPin, X } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { getUserPets } from '../lib/petService';
import { createPost, uploadPostImage } from '../lib/postService';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import type { Pet } from '../types/database.types';

const CreatePost = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [pets, setPets] = useState<Pet[]>([]);
  const [selectedPet, setSelectedPet] = useState<string>('');
  const [content, setContent] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [location, setLocation] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingPets, setLoadingPets] = useState(true);

  useEffect(() => {
    const loadPets = async () => {
      if (!user) return;
      
      try {
        const { pets: userPets, error: petsError } = await getUserPets(user.id);
        if (petsError) throw petsError;
        
        setPets(userPets);
        if (userPets.length > 0) {
          setSelectedPet(userPets[0].id);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load pets');
      } finally {
        setLoadingPets(false);
      }
    };

    loadPets();
  }, [user]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newImages = files.slice(0, 4 - images.length); // Max 4 images
    
    setImages(prev => [...prev, ...newImages]);
    
    // Create preview URLs
    newImages.forEach(file => {
      const url = URL.createObjectURL(file);
      setImageUrls(prev => [...prev, url]);
    });
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImageUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedPet) return;
    
    console.log('🔍 CreatePost: Submitting post for pet:', selectedPet, 'content:', content);
    setIsLoading(true);
    setError(null);
    
    try {
      // Upload images first
      const uploadedUrls = await Promise.all(
        images.map(async (image) => {
          const path = `${user.id}/${Date.now()}-${image.name}`;
          const { url, error: uploadError } = await uploadPostImage(image, path);
          if (uploadError) throw uploadError;
          return url as string;
        })
      );
      
      console.log('🔍 CreatePost: Images uploaded:', uploadedUrls);
      
      // Create post
      const { post, error: postError } = await createPost({
        pet_id: selectedPet,
        content,
        image_urls: uploadedUrls,
        location,
        post_type: 'standard',
        is_private: isPrivate
      });
      
      if (postError) throw postError;
      
      console.log('🔍 CreatePost: Post created successfully:', post);
      
      // Navigate to the feed
      navigate('/');
    } catch (err) {
      console.error('🔍 CreatePost: Error creating post:', err);
      setError(err instanceof Error ? err.message : 'Failed to create post');
    } finally {
      setIsLoading(false);
    }
  };

  if (loadingPets) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (pets.length === 0) {
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Create a Post</h2>
        <p className="text-gray-600 mb-4">
          You need to create a pet profile before you can make a post.
        </p>
        <Button onClick={() => navigate('/pets/create')}>
          Create Pet Profile
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">Create a Post</h2>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          {/* Pet selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Post as
            </label>
            <select
              value={selectedPet}
              onChange={(e) => setSelectedPet(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-salmon-200 focus:border-salmon-300"
              required
            >
              {pets.map(pet => (
                <option key={pet.id} value={pet.id}>
                  {pet.name}
                </option>
              ))}
            </select>
          </div>
          
          {/* Content */}
          <div className="mb-6">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's your pet up to?"
              className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-salmon-200 focus:border-salmon-300 min-h-[120px]"
            />
          </div>
          
          {/* Image upload */}
          <div className="mb-6">
            <div className="flex flex-wrap gap-4 mb-4">
              {imageUrls.map((url, index) => (
                <div key={index} className="relative">
                  <img
                    src={url}
                    alt={`Upload ${index + 1}`}
                    className="w-24 h-24 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
            
            {images.length < 4 && (
              <div>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  className="hidden"
                  id="image-upload"
                />
                <label
                  htmlFor="image-upload"
                  className="flex items-center justify-center px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-salmon-300"
                >
                  <ImageIcon className="w-5 h-5 mr-2 text-gray-500" />
                  <span className="text-gray-600">Add photos</span>
                </label>
              </div>
            )}
          </div>
          
          {/* Location */}
          <div className="mb-6">
            <div className="flex items-center">
              <MapPin className="w-5 h-5 text-gray-400 mr-2" />
              <Input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Add location"
              />
            </div>
          </div>
          
          {/* Privacy setting */}
          <div className="mb-6">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h3 className="font-medium text-gray-800">Confidentialité du post</h3>
                <p className="text-sm text-gray-600">
                  {isPrivate 
                    ? "Seuls vous et vos amis pourrez voir ce post" 
                    : "Tout le monde pourra voir ce post"
                  }
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPrivate}
                  onChange={(e) => setIsPrivate(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-salmon-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-salmon-600"></div>
                <span className="ml-3 text-sm font-medium text-gray-700">
                  {isPrivate ? 'Privé' : 'Public'}
                </span>
              </label>
            </div>
          </div>
          
          {/* Submit button */}
          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <LoadingSpinner size="sm" className="mr-2" />
                Creating post...
              </div>
            ) : (
              'Create Post'
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default CreatePost;