import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { createPet, uploadPetImage } from '../lib/petService';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import LoadingSpinner from '../components/ui/LoadingSpinner';

const CreatePet = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
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
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'banner') => {
    const file = e.target.files?.[0];
    if (file) {
      if (type === 'avatar') setAvatar(file);
      else setBanner(file);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      let avatarUrl = null;
      let bannerUrl = null;
      
      if (avatar) {
        const { url, error: uploadError } = await uploadPetImage(
          avatar,
          `${user.id}/avatar-${Date.now()}.${avatar.name.split('.').pop()}`
        );
        if (uploadError) {
          console.error('Avatar upload error:', uploadError);
          throw new Error('Failed to upload avatar');
        }
        console.log('Avatar uploaded successfully, URL:', url);
        avatarUrl = url;
      }
      
      if (banner) {
        const { url, error: uploadError } = await uploadPetImage(
          banner,
          `${user.id}/banner-${Date.now()}.${banner.name.split('.').pop()}`
        );
        if (uploadError) {
          console.error('Banner upload error:', uploadError);
          throw new Error('Failed to upload banner');
        }
        console.log('Banner uploaded successfully, URL:', url);
        bannerUrl = url;
      }
      
      console.log('Creating pet with avatar_url:', avatarUrl, 'banner_url:', bannerUrl);
      
      const { pet, error: createError } = await createPet({
        owner_id: user.id,
        name: formData.name,
        species: formData.species,
        breed: formData.breed || null,
        birth_date: formData.birthDate || null,
        gender: formData.gender as 'male' | 'female' | 'unknown',
        description: formData.description || null,
        avatar_url: avatarUrl,
        banner_url: bannerUrl,
      });
      
      if (createError) throw createError;
      
      navigate(`/pets/${pet.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create pet');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-sm p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Add a New Pet</h1>
      
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
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
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Profile Picture
          </label>
          <Input
            type="file"
            accept="image/*"
            onChange={(e) => handleFileChange(e, 'avatar')}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Banner Image
          </label>
          <Input
            type="file"
            accept="image/*"
            onChange={(e) => handleFileChange(e, 'banner')}
          />
        </div>
        
        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(-1)}
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
                Creating...
              </div>
            ) : (
              'Create Pet'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreatePet;