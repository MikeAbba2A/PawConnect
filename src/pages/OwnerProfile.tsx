import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, PlusSquare } from 'lucide-react';
import { getUserById } from '../lib/userService';
import { getUserPets } from '../lib/petService';
import { useAuthStore } from '../store/authStore';
import FriendRequestButton from '../components/friends/FriendRequestButton';
import FollowButton from '../components/pets/FollowButton';
import Button from '../components/ui/Button';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import type { User, Pet } from '../types/database.types';

const OwnerProfile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuthStore();
  const [owner, setOwner] = useState<User | null>(null);
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadOwnerProfile = async () => {
      if (!id) return;
      
      try {
        // Load owner information
        const { user: ownerData, error: ownerError } = await getUserById(id);
        if (ownerError) throw ownerError;
        
        setOwner(ownerData);
        
        // Load owner's pets
        const { pets: ownerPets, error: petsError } = await getUserPets(id);
        if (petsError) throw petsError;
        
        setPets(ownerPets);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load owner profile');
      } finally {
        setLoading(false);
      }
    };

    loadOwnerProfile();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !owner) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="mb-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Retour
          </button>
        </div>
        <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg">
          {error || 'Profil utilisateur non trouvé'}
        </div>
      </div>
    );
  }

  // If viewing own profile, redirect to main profile page
  if (currentUser?.id === owner.id) {
    navigate('/profile');
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto">
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

      {/* Profile header */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <img
              src={owner.avatar_url || "https://images.pexels.com/photos/1767434/pexels-photo-1767434.jpeg?auto=compress&cs=tinysrgb&w=600"}
              alt={owner.username}
              className="w-24 h-24 rounded-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = "https://images.pexels.com/photos/1767434/pexels-photo-1767434.jpeg?auto=compress&cs=tinysrgb&w=600";
              }}
            />
            <div className="ml-6">
              <h1 className="text-2xl font-bold text-gray-800">{owner.username}</h1>
              <p className="text-gray-600 mt-1">{owner.bio || 'Aucune bio disponible'}</p>
              {(owner.ville || owner.pays) && (
                <div className="flex items-center mt-2 text-sm text-gray-500">
                  <span>📍</span>
                  <span className="ml-1">
                    {[owner.ville, owner.code_postal, owner.pays].filter(Boolean).join(', ')}
                  </span>
                </div>
              )}
              <div className="flex items-center mt-3 text-sm text-gray-500">
                <span className="mr-4">
                  <span className="font-semibold text-gray-800">{pets.length}</span> {pets.length === 1 ? 'animal' : 'animaux'}
                </span>
                <span>
                  Membre depuis {new Date(owner.created_at).toLocaleDateString('fr-FR', { 
                    month: 'long', 
                    year: 'numeric' 
                  })}
                </span>
              </div>
            </div>
          </div>
          
          {/* Friend request button */}
          <FriendRequestButton 
            targetUserId={owner.id}
            targetUsername={owner.username}
          />
        </div>
      </div>

      {/* Pets section */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-800">
            Les animaux de {owner.username}
          </h2>
        </div>

        {pets.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600">{owner.username} n'a pas encore ajouté d'animaux</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pets.map(pet => (
              <div
                key={pet.id}
                onClick={() => navigate(`/pets/${pet.id}`)}
                className="block bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
              >
                <img
                  src={pet.avatar_url || "https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=600"}
                  alt={pet.name}
                  className="w-full h-48 object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = "https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=600";
                  }}
                />
                <div className="p-4">
                  <h3 className="font-bold text-gray-800">{pet.name}</h3>
                  <p className="text-sm text-gray-600">
                    {pet.species} • {pet.breed || 'Race inconnue'}
                  </p>
                  {pet.birth_date && (
                    <p className="text-xs text-gray-500 mt-1">
                      Né(e) le {new Date(pet.birth_date).toLocaleDateString('fr-FR')}
                    </p>
                  )}
                  <div className="mt-2">
                    <FollowButton 
                      petId={pet.id}
                      petName={pet.name}
                      ownerId={pet.owner_id}
                      size="sm"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OwnerProfile;