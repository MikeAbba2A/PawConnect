import React from 'react';
import { Link } from 'react-router-dom';
import { Wrench } from 'lucide-react';

const ServiceEmpty: React.FC = () => {
  return (
    <div className="bg-white rounded-lg border border-dashed p-10 text-center text-gray-600">
      <div className="flex justify-center mb-4">
        <Wrench className="h-10 w-10 text-gray-400" />
      </div>
      <h2 className="text-lg font-semibold mb-2">Aucun service trouvé</h2>
      <p className="text-sm mb-4">Il n'y a pas encore de services disponibles à proximité.</p>
      <Link
        to="/services/create"
        className="inline-block bg-orange-600 text-white text-sm px-5 py-2 rounded-full hover:bg-orange-700 transition"
      >
        Publier un service
      </Link>
    </div>
  );
};

export default ServiceEmpty;
