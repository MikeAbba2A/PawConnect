// import React, { useState } from 'react';
// import AsyncSelect from 'react-select/async';

// export interface CityOption {
//   label: string;
//   value: string;
//   lat: number;
//   lon: number;
// }

// interface Props {
//   onCitySelected: (city: CityOption) => void;
// }

// const CitySearchField: React.FC<Props> = ({ onCitySelected }) => {
//   const loadOptions = async (inputValue: string): Promise<CityOption[]> => {
//     if (!inputValue) return [];

//     const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=5&countrycodes=fr&q=${encodeURIComponent(inputValue)}`);
//     const data = await res.json();

//     return data.map((item: any) => ({
//       label: item.display_name,
//       value: item.display_name,
//       lat: parseFloat(item.lat),
//       lon: parseFloat(item.lon),
//     }));
//   };

//   return (
//     <div className="mb-4">
//       <label className="block mb-1 font-medium">Ville</label>
//       <AsyncSelect
//         loadOptions={loadOptions}
//         onChange={(option) => option && onCitySelected(option as CityOption)}
//         placeholder="Rechercher une ville..."
//         styles={{
//           container: (base) => ({ ...base, fontSize: '0.9rem' }),
//         }}
//       />
//     </div>
//   );
// };

// export default CitySearchField;

import React from 'react';
import AsyncSelect from 'react-select/async';

export interface AddressOption {
  label: string;
  value: string;
  lat: number;
  lon: number;
}

interface Props {
  onAddressSelected: (address: AddressOption) => void;
}

const getUserLanguage = (): string => navigator.language || 'en';

const AddressSearchField: React.FC<Props> = ({ onAddressSelected }) => {
  const loadOptions = async (inputValue: string): Promise<AddressOption[]> => {
    if (!inputValue || inputValue.length < 3) return [];

    const lang = getUserLanguage();

    const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=5&accept-language=${lang}&q=${encodeURIComponent(inputValue)}`;

    const res = await fetch(url, {
      headers: {
        'User-Agent': 'PawConnectApp/1.0 (support@pawconnect.com)',
      },
    });

    const data = await res.json();

    return data.map((item: any) => ({
      label: item.display_name,
      value: item.display_name,
      lat: parseFloat(item.lat),
      lon: parseFloat(item.lon),
    }));
  };

  return (
    <div className="mb-4">
      <label className="block mb-1 font-medium">Adresse complète</label>
      <AsyncSelect
        loadOptions={loadOptions}
        onChange={(option) => option && onAddressSelected(option as AddressOption)}
        placeholder="Ex : 21 rue Fesch, Ajaccio"
        styles={{
          container: (base) => ({ ...base, fontSize: '0.9rem' }),
        }}
      />
    </div>
  );
};

export default AddressSearchField;

