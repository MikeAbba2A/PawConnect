import React from 'react';

interface Props {
  filters: {
    category: string;
    city: string;
  };
  onChange: (key: string, value: string) => void;
}

const categories = [
  { value: '', label: 'Tous les services' },
  { value: 'toilettage', label: 'Toilettage' },
  { value: 'vétérinaire', label: 'Vétérinaire' },
  { value: 'pension', label: 'Pension' },
  { value: 'éducateur', label: 'Éducateur' },
  { value: 'pet-sitter', label: 'Pet-sitter' },
  { value: 'photographe', label: 'Photographe' },
];

const ServiceFilters: React.FC<Props> = ({ filters, onChange }) => {
  const handleReset = () => {
    onChange('category', '');
    onChange('city', '');
  };

  return (
    <div className="flex flex-col md:flex-row gap-4">
      {/* Type de service */}
      <div className="flex-1">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Type de service
        </label>
        <select
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          value={filters.category}
          onChange={(e) => onChange('category', e.target.value)}
        >
          {categories.map((cat) => (
            <option key={cat.value} value={cat.value}>
              {cat.label}
            </option>
          ))}
        </select>
      </div>

      {/* Ville */}
      <div className="flex-1">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Ville
        </label>
        <input
          type="text"
          placeholder="Rechercher une ville..."
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          value={filters.city}
          onChange={(e) => onChange('city', e.target.value)}
        />
      </div>

      {/* Bouton réinitialisation */}
      <div className="flex items-end">
        <button
          onClick={handleReset}
          className="text-sm text-gray-600 hover:text-orange-600 border border-gray-300 px-4 py-2 rounded-md"
        >
          Effacer les filtres
        </button>
      </div>
    </div>
  );
};

export default ServiceFilters;
