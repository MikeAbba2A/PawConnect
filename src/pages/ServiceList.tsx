import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Wrench } from 'lucide-react';
import ServiceCard from '../components/services/ServiceCard';
import ServiceFilters from '../components/services/ServiceFilters';
import ServiceEmpty from '../components/services/ServiceEmpty';

const ServiceList: React.FC = () => {
  const [services, setServices] = useState<any[]>([]);
  const [filters, setFilters] = useState({ category: '', city: '' });
  const [loading, setLoading] = useState(true);

  const fetchServices = async () => {
    setLoading(true);
    let query = supabase.from('services').select('*');

    if (filters.category) query = query.ilike('category', `%${filters.category}%`);
    if (filters.city) query = query.ilike('city', `%${filters.city}%`);

    const { data, error } = await query;

    if (!error && data) {
      setServices(data);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchServices();
  }, [filters]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Wrench className="h-6 w-6 text-orange-600" />
            <h1 className="text-2xl font-bold text-gray-800">Services</h1>
          </div>
          <p className="text-sm text-gray-500">
            Découvrez et contactez des professionnels du monde animalier près de chez vous
          </p>
        </div>
        <Link
          to="/services/create"
          className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-md font-medium text-sm"
        >
          + Publier un service
        </Link>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-lg border p-4 mb-6">
        <ServiceFilters filters={filters} onChange={(key, value) => setFilters({ ...filters, [key]: value })} />
      </div>

      {/* Résultats */}
      {services.length === 0 && !loading ? (
        <ServiceEmpty />
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ServiceList;
