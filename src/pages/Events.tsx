import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Users, Plus, Filter, Search } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useAuthStore } from '../store/authStore';
import { getEvents, getEventTypes } from '../lib/eventService';
import Button from '../components/ui/Button';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import type { Event, EventType } from '../types/database.types';

const Events = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [selectedType, setSelectedType] = useState<string>('');
  const [searchLocation, setSearchLocation] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadData();
  }, [selectedType, searchLocation]);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Load event types
      const { eventTypes: types, error: typesError } = await getEventTypes();
      if (typesError) throw typesError;
      setEventTypes(types);

      // Load events with filters
      const { events: eventsData, error: eventsError } = await getEvents({
        type: selectedType || undefined,
        location: searchLocation || undefined,
        limit: 20
      });
      if (eventsError) throw eventsError;

      setEvents(eventsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const getEventTypeInfo = (typeId: string) => {
    return eventTypes.find(type => type.id === typeId);
  };

  const formatEventDate = (dateStart: string, dateEnd?: string) => {
    const start = new Date(dateStart);
    const end = dateEnd ? new Date(dateEnd) : null;

    if (end && format(start, 'yyyy-MM-dd') !== format(end, 'yyyy-MM-dd')) {
      return `${format(start, 'dd MMM', { locale: fr })} - ${format(end, 'dd MMM yyyy', { locale: fr })}`;
    } else if (end) {
      return `${format(start, 'dd MMM yyyy', { locale: fr })} • ${format(start, 'HH:mm')} - ${format(end, 'HH:mm')}`;
    } else {
      return format(start, 'dd MMM yyyy • HH:mm', { locale: fr });
    }
  };

  const clearFilters = () => {
    setSelectedType('');
    setSearchLocation('');
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Calendar className="w-8 h-8 text-salmon-600 mr-3" />
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Événements</h1>
              <p className="text-gray-600">
                Découvrez et participez aux événements pour animaux près de chez vous
              </p>
            </div>
          </div>
          <Button onClick={() => navigate('/events/create')}>
            <Plus className="w-4 h-4 mr-2" />
            Créer un événement
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-gray-800">Filtres</h3>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="md:hidden flex items-center text-salmon-600 hover:text-salmon-700"
          >
            <Filter className="w-4 h-4 mr-1" />
            Filtres
          </button>
        </div>

        <div className={`space-y-4 ${showFilters ? 'block' : 'hidden md:block'}`}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Type filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type d'événement
              </label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-salmon-200 focus:border-salmon-300"
              >
                <option value="">Tous les types</option>
                {eventTypes.map(type => (
                  <option key={type.id} value={type.id}>
                    {type.icon} {type.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Location filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lieu
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Rechercher un lieu..."
                  value={searchLocation}
                  onChange={(e) => setSearchLocation(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-salmon-200 focus:border-salmon-300"
                />
              </div>
            </div>

            {/* Clear filters */}
            <div className="flex items-end">
              <button
                onClick={clearFilters}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Effacer les filtres
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg mb-6">
          {error}
          <button
            onClick={loadData}
            className="ml-2 text-salmon-600 hover:text-salmon-700 underline"
          >
            Réessayer
          </button>
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="flex justify-center items-center min-h-[400px]">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <>
          {/* Events count */}
          <div className="mb-4">
            <p className="text-gray-600">
              {events.length} événement{events.length !== 1 ? 's' : ''} trouvé{events.length !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Events grid */}
          {events.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                Aucun événement trouvé
              </h3>
              <p className="text-gray-600 mb-6">
                {selectedType || searchLocation
                  ? 'Aucun événement ne correspond à vos critères de recherche.'
                  : 'Il n\'y a pas d\'événements à venir pour le moment.'}
              </p>
              <div className="space-x-4">
                {(selectedType || searchLocation) && (
                  <button
                    onClick={clearFilters}
                    className="px-4 py-2 text-salmon-600 hover:text-salmon-700 underline"
                  >
                    Effacer les filtres
                  </button>
                )}
                <Button onClick={() => navigate('/events/create')}>
                  Créer le premier événement
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map(event => {
                const typeInfo = getEventTypeInfo(event.event_type);
                
                return (
                  <div
                    key={event.id}
                    onClick={() => navigate(`/events/${event.id}`)}
                    className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                  >
                    {/* Event image */}
                    <div className="relative h-48">
                      <img
                        src={event.image_url || "https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=600"}
                        alt={event.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = "https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=600";
                        }}
                      />
                      <div className="absolute top-3 left-3">
                        <span 
                          className="px-2 py-1 text-xs font-medium text-white rounded-full"
                          style={{ backgroundColor: typeInfo?.color || '#6B7280' }}
                        >
                          {typeInfo?.icon} {typeInfo?.name}
                        </span>
                      </div>
                    </div>

                    {/* Event info */}
                    <div className="p-4">
                      <h3 className="font-bold text-gray-800 text-lg mb-2 line-clamp-2">
                        {event.title}
                      </h3>
                      
                      {event.description && (
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                          {event.description}
                        </p>
                      )}

                      <div className="space-y-2 text-sm text-gray-500">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-2 flex-shrink-0" />
                          <span>{formatEventDate(event.date_start, event.date_end)}</span>
                        </div>
                        
                        {event.location && (
                          <div className="flex items-center">
                            <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
                            <span className="truncate">{event.location}</span>
                          </div>
                        )}
                        
                        <div className="flex items-center">
                          <Users className="w-4 h-4 mr-2 flex-shrink-0" />
                          <span>
                            {event.participants_count || 0} participant{(event.participants_count || 0) !== 1 ? 's' : ''}
                            {event.max_participants && ` / ${event.max_participants}`}
                          </span>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                        <div className="flex items-center">
                          <img
                            src={event.organizer?.avatar_url || "https://images.pexels.com/photos/1767434/pexels-photo-1767434.jpeg?auto=compress&cs=tinysrgb&w=600"}
                            alt={event.organizer?.username}
                            className="w-6 h-6 rounded-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = "https://images.pexels.com/photos/1767434/pexels-photo-1767434.jpeg?auto=compress&cs=tinysrgb&w=600";
                            }}
                          />
                          <span className="ml-2 text-sm text-gray-600">
                            {event.organizer?.username}
                          </span>
                        </div>
                        
                        {event.is_participating && (
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                            Inscrit
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Events;