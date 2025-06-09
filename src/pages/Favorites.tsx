import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Search } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { getFollowedPets } from '../lib/followService';
import FollowButton from '../components/pets/FollowButton';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import type { Follow, Pet } from '../types/database.types';

const Favorites = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [followedPets, setFollowedPets] = useState<(Follow & { followed_pet: Pet })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (user) {
      loadFollowedPets();
    }
  }, [user]);

  const loadFollowedPets = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const { follows, error: followsError } = await getFollowedPets(user.id);
      if (followsError) throw followsError;

      setFollowedPets(follows);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load followed pets');
    } finally {
      setLoading(false);
    }
  };

  const handleUnfollow = (petId: string) => {
    // Remove the pet from the list when unfollowed
    setFollowedPets(prev => prev.filter(follow => follow.followed_pet.id !== petId));
  };

  // Filter pets based on search term
  const filteredPets = followedPets.filter(follow =>
    follow.followed_pet.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    follow.followed_pet.species.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (follow.followed_pet.breed && follow.followed_pet.breed.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center mb-4">
          <Heart className="w-8 h-8 text-salmon-600 mr-3" />
          <h1 className="text-3xl font-bold text-gray-800">Mes Favoris</h1>
        </div>
        <p className="text-gray-600">
          Découvrez les dernières nouvelles de tous les animaux que vous suivez
        </p>
      </div>

      {/* Search bar */}
      {followedPets.length > 0 && (
        <div className="mb-6">
          <div className="relative max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Rechercher un animal..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-salmon-200 focus:border-salmon-300"
            />
          </div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg mb-6">
          {error}
          <button
            onClick={loadFollowedPets}
            className="ml-2 text-salmon-600 hover:text-salmon-700 underline"
          >
            Réessayer
          </button>
        </div>
      )}

      {/* Content */}
      {followedPets.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            Aucun animal suivi
          </h3>
          <p className="text-gray-600 mb-6">
            Commencez à suivre des animaux pour voir leurs profils ici. 
            Explorez les posts dans votre feed et cliquez sur "Suivre" sur les animaux qui vous plaisent !
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-salmon-600 text-white rounded-lg hover:bg-salmon-700 transition-colors"
          >
            Explorer le feed
          </button>
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-800">{followedPets.length}</div>
                  <div className="text-sm text-gray-500">
                    {followedPets.length === 1 ? 'Animal suivi' : 'Animaux suivis'}
                  </div>
                </div>
                {searchTerm && (
                  <div className="text-center">
                    <div className="text-2xl font-bold text-salmon-600">{filteredPets.length}</div>
                    <div className="text-sm text-gray-500">Résultats</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Pets grid */}
          {filteredPets.length === 0 && searchTerm ? (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                Aucun résultat trouvé
              </h3>
              <p className="text-gray-600">
                Aucun animal ne correspond à votre recherche "{searchTerm}"
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredPets.map(follow => (
                <div
                  key={follow.id}
                  className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                >
                  {/* Pet image */}
                  <div 
                    className="relative h-48 cursor-pointer"
                    onClick={() => navigate(`/pets/${follow.followed_pet.id}`)}
                  >
                    <img
                      src={follow.followed_pet.avatar_url || "https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=600"}
                      alt={follow.followed_pet.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=600";
                      }}
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 transition-all duration-200" />
                  </div>

                  {/* Pet info */}
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 
                          className="font-bold text-gray-800 text-lg cursor-pointer hover:text-salmon-600 transition-colors truncate"
                          onClick={() => navigate(`/pets/${follow.followed_pet.id}`)}
                        >
                          {follow.followed_pet.name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {follow.followed_pet.species}
                          {follow.followed_pet.breed && ` • ${follow.followed_pet.breed}`}
                        </p>
                      </div>
                    </div>

                    {/* Description */}
                    {follow.followed_pet.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {follow.followed_pet.description}
                      </p>
                    )}

                    {/* Birth date */}
                    {follow.followed_pet.birth_date && (
                      <p className="text-xs text-gray-500 mb-3">
                        Né(e) le {new Date(follow.followed_pet.birth_date).toLocaleDateString('fr-FR')}
                      </p>
                    )}

                    {/* Follow date */}
                    <p className="text-xs text-gray-400 mb-3">
                      Suivi depuis le {new Date(follow.created_at).toLocaleDateString('fr-FR')}
                    </p>

                    {/* Actions */}
                    <div className="flex space-x-2">
                      <button
                        onClick={() => navigate(`/pets/${follow.followed_pet.id}`)}
                        className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                      >
                        Voir profil
                      </button>
                      <div onClick={() => handleUnfollow(follow.followed_pet.id)}>
                        <FollowButton
                          petId={follow.followed_pet.id}
                          petName={follow.followed_pet.name}
                          ownerId={follow.followed_pet.owner_id}
                          size="sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Favorites;