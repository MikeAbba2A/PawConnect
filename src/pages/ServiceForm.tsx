import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import AddressSearchField, { AddressOption } from '../components/services/AddressSearchField';

const categories = [
  'Toilettage',
  'Vétérinaire',
  'Pension',
  'Éducateur',
  'Pet-sitter',
  'Photographe',
];

const ServiceForm: React.FC = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    contact_email: '',
    phone_number: '',
  });

  const [addressData, setAddressData] = useState<AddressOption | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAddressSelected = (selected: AddressOption) => {
    setAddressData(selected);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data: user } = await supabase.auth.getUser();

    if (!user?.user) {
      alert("Utilisateur non connecté");
      setLoading(false);
      return;
    }

    const { error } = await supabase.from('services').insert({
      user_id: user.user.id,
      title: form.title,
      description: form.description,
      category: form.category.toLowerCase(),
      city: addressData?.value || '',
      latitude: addressData?.lat || null,
      longitude: addressData?.lon || null,
      contact_email: form.contact_email,
      phone_number: form.phone_number,
    });

    if (error) {
      alert("Erreur lors de la publication");
      console.error(error);
    } else {
      navigate('/services');
    }

    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800">Publier un service</h2>
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow space-y-5">
        <div>
          <label className="block font-medium mb-1">Titre</label>
          <input
            type="text"
            name="title"
            required
            value={form.title}
            onChange={handleChange}
            className="w-full border rounded px-4 py-2"
          />
        </div>

        <div>
          <label className="block font-medium mb-1">Description</label>
          <textarea
            name="description"
            rows={4}
            required
            value={form.description}
            onChange={handleChange}
            className="w-full border rounded px-4 py-2"
          />
        </div>

        <div>
          <label className="block font-medium mb-1">Catégorie</label>
          <select
            name="category"
            required
            value={form.category}
            onChange={handleChange}
            className="w-full border rounded px-4 py-2"
          >
            <option value="">-- Choisir une catégorie --</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <AddressSearchField onAddressSelected={handleAddressSelected} />

        {addressData && (
          <p className="text-sm text-gray-500">
            📍 {addressData.value} → {addressData.lat.toFixed(5)}, {addressData.lon.toFixed(5)}
          </p>
        )}

        <div>
          <label className="block font-medium mb-1">Email de contact</label>
          <input
            type="email"
            name="contact_email"
            value={form.contact_email}
            onChange={handleChange}
            className="w-full border rounded px-4 py-2"
          />
        </div>

        <div>
          <label className="block font-medium mb-1">Téléphone</label>
          <input
            type="text"
            name="phone_number"
            value={form.phone_number}
            onChange={handleChange}
            className="w-full border rounded px-4 py-2"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-pink-600 hover:bg-pink-700 text-white px-6 py-2 rounded-lg font-medium"
        >
          {loading ? "Publication..." : "Publier le service"}
        </button>
      </form>
    </div>
  );
};

export default ServiceForm;
