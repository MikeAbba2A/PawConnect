import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Users, Image as ImageIcon, X, ArrowLeft } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { createEvent, getEventTypes, uploadEventImage } from '../lib/eventService';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import type { EventType } from '../types/database.types';

const CreateEvent = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingTypes, setLoadingTypes] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_type: '',
    date_start: '',
    time_start: '',
    date_end: '',
    time_end: '',
    location: '',
    address: '',
    max_participants: '',
    is_public: true,
  });
  
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    loadEventTypes();
  }, []);

  const loadEventTypes = async () => {
    try {
      const { eventTypes: types, error: typesError } = await getEventTypes();
      if (typesError) throw typesError;
      
      setEventTypes(types);
      if (types.length > 0) {
        setFormData(prev => ({ ...prev, event_type: types[0].id }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load event types');
    } finally {
      setLoadingTypes(false);
    }
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };
  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  };

  const removeImage = () => {
    setImage(null);
    setImagePreview(null);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      let imageUrl = null;
      
      // Upload image if selected
      if (image) {
        const { url, error: uploadError } = await uploadEventImage(
          image,
          `${user.id}/event-${Date.now()}.${image.name.split('.').pop()}`
        );
        if (uploadError) {
          throw new Error('Failed to upload image');
        }
        imageUrl = url;
      }
      
      // Combine date and time
      const dateStart = formData.time_start 
        ? `${formData.date_start}T${formData.time_start}:00`
        : `${formData.date_start}T09:00:00`;
      
      const dateEnd = formData.date_end && formData.time_end
        ? `${formData.date_end}T${formData.time_end}:00`
        : formData.date_end
        ? `${formData.date_end}T18:00:00`
        : null;
      
      // Create event
      const { event, error: createError } = await createEvent({
        title: formData.title,
        description: formData.description || null,
        event_type: formData.event_type,
        organizer_id: user.id,
        date_start: dateStart,
        date_end: dateEnd,
        location: formData.location || null,
        address: formData.address || null,
        max_participants: formData.max_participants ? parseInt(formData.max_participants) : null,
        is_public: formData.is_public,
        is_active: true,
        image_url: imageUrl,
      });
      
      if (createError) throw createError;
      
      navigate(`/events/${event.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create event');
    } finally {
      setIsLoading(false);
    }
  };

  if (loadingTypes) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }
  
  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/events')}
          className="flex items-center text-gray-600 hover:text-gray-800 transition-colors mb-4"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Retour aux événements
        </button>
        <h1 className="text-2xl font-bold text-gray-800">Publier un événement</h1>
        <p className="text-gray-600 mt-1">
          Organisez un événement pour la communauté des propriétaires d'animaux
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-800 border-b border-gray-200 pb-2">
              Informations générales
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Titre de l'événement*
              </label>
              <Input
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                placeholder="Ex: Promenade collective au parc"
                className="text-lg"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type d'événement*
              </label>
              <select
                name="event_type"
                value={formData.event_type}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-salmon-200 focus:border-salmon-300"
              >
                {eventTypes.map(type => (
                  <option key={type.id} value={type.id}>
                    {type.icon} {type.name}
                  </option>
                ))}
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
                placeholder="Décrivez votre événement, ce qui est prévu, ce qu'il faut apporter..."
              />
            </div>
          </div>

          {/* Date and Time */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-800 border-b border-gray-200 pb-2 flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              Date et heure
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date de début*
                </label>
                <Input
                  type="date"
                  name="date_start"
                  value={formData.date_start}
                  onChange={handleInputChange}
                  required
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Heure de début
                </label>
                <Input
                  type="time"
                  name="time_start"
                  value={formData.time_start}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date de fin (optionnel)
                </label>
                <Input
                  type="date"
                  name="date_end"
                  value={formData.date_end}
                  onChange={handleInputChange}
                  min={formData.date_start || new Date().toISOString().split('T')[0]}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Heure de fin
                </label>
                <Input
                  type="time"
                  name="time_end"
                  value={formData.time_end}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-800 border-b border-gray-200 pb-2 flex items-center">
              <MapPin className="w-5 h-5 mr-2" />
              Lieu
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lieu/Ville
              </label>
              <Input
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                placeholder="Ex: Paris, Lyon, Marseille..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Adresse complète (optionnel)
              </label>
              <Input
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="Ex: 123 Rue de la Paix, 75001 Paris"
              />
            </div>
          </div>

          {/* Participants */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-800 border-b border-gray-200 pb-2 flex items-center">
              <Users className="w-5 h-5 mr-2" />
              Participants
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre maximum de participants (optionnel)
              </label>
              <Input
                type="number"
                name="max_participants"
                value={formData.max_participants}
                onChange={handleInputChange}
                min="1"
                placeholder="Laissez vide pour aucune limite"
              />
            </div>
          </div>

          {/* Image */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-800 border-b border-gray-200 pb-2 flex items-center">
              <ImageIcon className="w-5 h-5 mr-2" />
              Image de l'événement
            </h3>
            
            {imagePreview ? (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Aperçu"
                  className="w-full h-48 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  id="image-upload"
                />
                <label
                  htmlFor="image-upload"
                  className="flex items-center justify-center px-4 py-8 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-salmon-300 transition-colors"
                >
                  <div className="text-center">
                    <ImageIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <span className="text-gray-600">Cliquez pour ajouter une image</span>
                    <p className="text-sm text-gray-400 mt-1">PNG, JPG jusqu'à 5MB</p>
                  </div>
                </label>
              </div>
            )}
          </div>

          {/* Privacy */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-800 border-b border-gray-200 pb-2">
              Confidentialité
            </h3>
            
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-800">Événement public</h4>
                <p className="text-sm text-gray-600">
                  {formData.is_public 
                    ? "Tout le monde peut voir et rejoindre cet événement" 
                    : "Seules les personnes invitées peuvent voir cet événement"
                  }
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="is_public"
                  checked={formData.is_public}
                  onChange={handleInputChange}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-salmon-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-salmon-600"></div>
              </label>
            </div>
          </div>
          
          {/* Submit button */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/events')}
              disabled={isLoading}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center">
                  <LoadingSpinner size="sm" className="mr-2" />
                  Création...
                </div>
              ) : (
                'Créer l\'événement'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateEvent;