import React from 'react';
import { Link } from 'react-router-dom';

interface Props {
  service: {
    id: string;
    title: string;
    description: string;
    city: string;
    category: string;
  };
}

const ServiceCard: React.FC<Props> = ({ service }) => {
  return (
    <div className="bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition-all">
      <div className="mb-2">
        <h3 className="text-lg font-semibold text-gray-800 line-clamp-1">
          {service.title}
        </h3>
        <p className="text-sm text-gray-500 capitalize">{service.category}</p>
      </div>

      <p className="text-sm text-gray-600 mb-4 line-clamp-3">
        {service.description}
      </p>

      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>📍 {service.city}</span>
        <Link
          to={`/services/${service.id}`}
          className="text-orange-600 font-medium hover:underline"
        >
          Voir plus
        </Link>
      </div>
    </div>
  );
};

export default ServiceCard;
