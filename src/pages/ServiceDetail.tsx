import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const ServiceDetail: React.FC = () => {
  const { id } = useParams();
  const [service, setService] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('services').select('*').eq('id', id).single();
      setService(data);
    })();
  }, [id]);

  if (!service) return <p className="text-center mt-10">Chargement...</p>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 bg-white rounded-xl shadow">
      <h2 className="text-2xl font-bold mb-2">{service.title}</h2>
      <p className="text-gray-600 mb-4">{service.description}</p>
      <p className="text-sm text-gray-500 mb-1">📍 {service.city}</p>
      <p className="text-sm text-gray-500 mb-1">📂 {service.category}</p>
      {service.contact_email && <p className="text-sm mt-4">📧 {service.contact_email}</p>}
      {service.phone_number && <p className="text-sm">📞 {service.phone_number}</p>}
    </div>
  );
};

export default ServiceDetail;
