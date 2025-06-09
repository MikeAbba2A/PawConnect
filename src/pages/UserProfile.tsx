import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { getUserPets } from '../lib/petService';
import { PlusSquare } from 'lucide-react';
import Button from '../components/ui/Button';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import type { Pet } from '../types/database.types';

const UserProfile = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleEditProfile = () => {
    console.log('🔍 Edit Profile button clicked!');
    console.log('🔍 Current user:', user);
    console.log('🔍 Navigate function:', navigate);
    console.log('🔍 About to navigate to /edit-profile');
    
    try {
      navigate('/edit-profile');
      console.log('🔍 Navigation called successfully');
    } catch (error) {
      console.error('🔍 Navigation error:', error);
    }
  };
  useEffect(() => {
    const loadPets = async () => {
      if (!user) return;
      
      try {
        const { pets: userPets, error: petsError } = await getUserPets(user.id);
        if (petsError) throw petsError;
        setPets(userPets);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load pets');
      } finally {
        setLoading(false);
      }
    };

    loadPets();
  }, [user]);

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Profile header */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex items-center">
          <img
            src={user.avatar_url || "https://images.pexels.com/photos/1767434/pexels-photo-1767434.jpeg?auto=compress&cs=tinysrgb&w=600"}
            alt={user.username}
            className="w-24 h-24 rounded-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = "https://images.pexels.com/photos/1767434/pexels-photo-1767434.jpeg?auto=compress&cs=tinysrgb&w=600";
            }}
          />
          <div className="ml-6">
            <h1 className="text-2xl font-bold text-gray-800">{user.username}</h1>
            <p className="text-gray-600">{user.bio || 'No bio yet'}</p>
            {(user.ville || user.pays) && (
              <div className="flex items-center mt-2 text-sm text-gray-500">
                <span>📍</span>
                <span className="ml-1">
                  {[user.ville, user.code_postal, user.pays].filter(Boolean).join(', ')}
                </span>
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={handleEditProfile}
            >
              Edit Profile
            </Button>
          </div>
        </div>
      </div>

      {/* Pets section */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-800">My Pets</h2>
          <Link to="/pets/create">
            <Button variant="primary" size="sm">
              <PlusSquare className="w-4 h-4 mr-2" />
              Add Pet
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner size="lg" />
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-600">{error}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => window.location.reload()}
            >
              Try Again
            </Button>
          </div>
        ) : pets.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">You haven't added any pets yet</p>
            <Link to="/pets/create">
              <Button variant="primary">Add Your First Pet</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pets.map(pet => (
              <Link
                key={pet.id}
                to={`/pets/${pet.id}`}
                className="block bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
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
                    {pet.species} • {pet.breed || 'Unknown breed'}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfile;