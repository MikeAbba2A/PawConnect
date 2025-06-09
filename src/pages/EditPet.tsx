import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { getPetById, updatePet, uploadPetImage } from '../lib/petService';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import type { Pet } from '../types/database.types';

const EditPet = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [pet, setPet] = useState<Pet | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingPet, setLoadingPet] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    species: '',
    breed: '',
    birthDate: '',
    gender: '',
    description: '',
  });
  
  const [avatar, setAvatar] = useState<File | null>(null);
  const [banner, setBanner] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);

  useEffect(() => {
    const loadPet = async () => {
      if (!id) return;
      
      try {
        const { pet: petData, error: petError } = await getPetById(id);
        if (petError) throw petError;
        
        // Check if user owns this pet
        if (petData.owner_id !== user?.id) {
          navigate('/');
          return;
        }
        
        setPet(petData);
        setFormData({
          name: petData.name,
          species: petData.species,
          breed: petData.breed || '',
          birthDate: petData.birth_date || '',
          gender: petData.gender,
          description: petData.description || '',
        });
        setAvatarPreview(petData.avatar_url);
        setBannerPreview(petData.banner_url);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load pet');
      } finally {
        setLoadingPet(false);
      }
    };

    loadPet();
  }, [id, user, navigate]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'banner') => {
    const file = e.target.files?.[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      if (type === 'avatar') {
        setAvatar(file);
        setAvatarPreview(previewUrl);
      } else {
        setBanner(file);
        setBannerPreview(previewUrl);
      }
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !pet) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      let avatarUrl = pet.avatar_url;
      let bannerUrl = pet.banner_url;
      
      // Upload new avatar if selected
      if (avatar) {
        const { url, error: uploadError } = await uploadPetImage(
          avatar,
          `${user.id}/avatar-${Date.now()}.${avatar.name.split('.').pop()}`
        );
        if (uploadError) {
          throw new Error('Failed to upload avatar');
        }
        avatarUrl = url;
      }
      
      // Upload new banner if selected
      if (banner) {
        const { url, error: uploadError } = await uploadPetImage(
          banner,
          `${user.id}/banner-${Date.now()}.${banner.name.split('.').pop()}`
        );
        if (uploadError) {
          throw new Error('Failed to upload banner');
        }
        bannerUrl = url;
      }
      
      // Update pet
      const { pet: updatedPet, error: updateError } = await updatePet(pet.id, {
        name: formData.name,
        species: formData.species,
        breed: formData.breed || null,
        birth_date: formData.birthDate || null,
        gender: formData.gender as 'male' | 'female' | 'unknown',
        description: formData.description || null,
        avatar_url: avatarUrl,
        banner_url: bannerUrl,
      });
      
      if (updateError) throw updateError;
      
      // Navigate back to pet profile
      navigate(`/pets/${pet.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update pet');
    } finally {
      setIsLoading(false);
    }
  };

  if (loadingPet) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!pet) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg">
        Pet not found or you don't have permission to edit this pet.
      </div>
    );
  }
  
  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-sm p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Edit {pet.name}'s Profile</h1>
      
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Avatar section */}
        <div className="flex items-center space-x-6">
          <div className="relative">
            <img
              src={avatarPreview || "https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=600"}
              alt="Pet avatar"
              className="w-24 h-24 rounded-full object-cover border-4 border-gray-200"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = "https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=600";
              }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Profile Picture
            </label>
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => handleFileChange(e, 'avatar')}
              className="text-sm"
            />
          </div>
        </div>

        {/* Banner section */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Banner Image
          </label>
          {bannerPreview && (
            <div className="mb-2">
              <img
                src={bannerPreview}
                alt="Banner preview"
                className="w-full h-32 object-cover rounded-lg"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = "https://images.pexels.com/photos/406014/pexels-photo-406014.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2";
                }}
              />
            </div>
          )}
          <Input
            type="file"
            accept="image/*"
            onChange={(e) => handleFileChange(e, 'banner')}
            className="text-sm"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Name*
          </label>
          <Input
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
            placeholder="Your pet's name"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Species*
          </label>
          <Input
            name="species"
            value={formData.species}
            onChange={handleInputChange}
            required
            placeholder="e.g., Dog, Cat, Rabbit"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Breed
          </label>
          <Input
            name="breed"
            value={formData.breed}
            onChange={handleInputChange}
            placeholder="e.g., Golden Retriever, Persian"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Birth Date
          </label>
          <Input
            type="date"
            name="birthDate"
            value={formData.birthDate}
            onChange={handleInputChange}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Gender*
          </label>
          <select
            name="gender"
            value={formData.gender}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-salmon-200 focus:border-salmon-300"
          >
            <option value="">Select gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="unknown">Unknown</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows={4}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-salmon-200 focus:border-salmon-300"
            placeholder="Tell us about your pet..."
          />
        </div>
        
        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(`/pets/${pet.id}`)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center">
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
  );
};

export default EditPet;