import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Image as ImageIcon, MapPin, X } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { getPostById, updatePost, uploadPostImage } from '../lib/postService';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import type { Post } from '../types/database.types';

const EditPost = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [post, setPost] = useState<Post | null>(null);
  const [content, setContent] = useState('');
  const [location, setLocation] = useState('');
  const [newImages, setNewImages] = useState<File[]>([]);
  const [newImageUrls, setNewImageUrls] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [isPrivate, setIsPrivate] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingPost, setLoadingPost] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPost = async () => {
      if (!id) return;
      
      try {
        const { post: postData, error: postError } = await getPostById(id);
        if (postError) throw postError;
        
        // Check if user owns this post
        if (postData.pet?.owner_id !== user?.id) {
          navigate('/');
          return;
        }
        
        setPost(postData);
        setContent(postData.content || '');
        setLocation(postData.location || '');
        setIsPrivate(postData.is_private || false);
        setExistingImages(postData.image_urls || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load post');
      } finally {
        setLoadingPost(false);
      }
    };

    loadPost();
  }, [id, user, navigate]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const totalImages = existingImages.length + newImages.length;
    const availableSlots = 4 - totalImages;
    const imagesToAdd = files.slice(0, availableSlots);
    
    setNewImages(prev => [...prev, ...imagesToAdd]);
    
    // Create preview URLs
    imagesToAdd.forEach(file => {
      const url = URL.createObjectURL(file);
      setNewImageUrls(prev => [...prev, url]);
    });
  };

  const removeExistingImage = (index: number) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeNewImage = (index: number) => {
    setNewImages(prev => prev.filter((_, i) => i !== index));
    setNewImageUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !post) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Upload new images
      const uploadedUrls = await Promise.all(
        newImages.map(async (image) => {
          const path = `${user.id}/${Date.now()}-${image.name}`;
          const { url, error: uploadError } = await uploadPostImage(image, path);
          if (uploadError) throw uploadError;
          return url as string;
        })
      );
      
      // Combine existing and new image URLs
      const allImageUrls = [...existingImages, ...uploadedUrls];
      
      // Update post
      const { post: updatedPost, error: updateError } = await updatePost(post.id, {
        content,
        image_urls: allImageUrls,
        location,
        is_private: isPrivate,
      });
      
      if (updateError) throw updateError;
      
      // Navigate back to the post or feed
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update post');
    } finally {
      setIsLoading(false);
    }
  };

  if (loadingPost) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg">
        Post not found or you don't have permission to edit this post.
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">Edit Post</h2>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          {/* Pet info (read-only) */}
          <div className="mb-6 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center">
              <img
                src={post.pet?.avatar_url || "https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=600"}
                alt={post.pet?.name}
                className="w-10 h-10 rounded-full object-cover"
              />
              <div className="ml-3">
                <p className="font-medium text-gray-800">Posting as {post.pet?.name}</p>
                <p className="text-sm text-gray-500">{post.pet?.species}</p>
              </div>
            </div>
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
          
          {/* Images */}
          <div className="mb-6">
            <div className="flex flex-wrap gap-4 mb-4">
              {/* Existing images */}
              {existingImages.map((url, index) => (
                <div key={`existing-${index}`} className="relative">
                  <img
                    src={url}
                    alt={`Existing ${index + 1}`}
                    className="w-24 h-24 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => removeExistingImage(index)}
                    className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
              
              {/* New images */}
              {newImageUrls.map((url, index) => (
                <div key={`new-${index}`} className="relative">
                  <img
                    src={url}
                    alt={`New ${index + 1}`}
                    className="w-24 h-24 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => removeNewImage(index)}
                    className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
            
            {(existingImages.length + newImages.length) < 4 && (
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
                  <span className="text-gray-600">Add more photos</span>
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
          
          {/* Submit buttons */}
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(-1)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <LoadingSpinner size="sm" className="mr-2" />
                  Saving...
                </div>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditPost;