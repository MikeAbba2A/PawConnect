import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { updateUserProfile, uploadUserAvatar } from '../lib/userService';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import LoadingSpinner from '../components/ui/LoadingSpinner';

const EditProfile = () => {
  console.log('🔍 EditProfile component is rendering!');
  
  const navigate = useNavigate();
  const { user, setUser } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    username: '',
    bio: '',
    ville: '',
    code_postal: '',
    pays: '',
  });
  
  const [avatar, setAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  useEffect(() => {
    console.log('🔍 EditProfile useEffect triggered, user:', user);
    if (user) {
      setFormData({
        username: user.username || '',
        bio: user.bio || '',
        ville: user.ville || '',
        code_postal: user.code_postal || '',
        pays: user.pays || '',
      });
      setAvatarPreview(user.avatar_url || null);
      console.log('🔍 Form data set:', { username: user.username, bio: user.bio });
    }
  }, [user]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatar(file);
      const previewUrl = URL.createObjectURL(file);
      setAvatarPreview(previewUrl);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      let avatarUrl = user.avatar_url;
      
      // Upload new avatar if selected
      if (avatar) {
        const { url, error: uploadError } = await uploadUserAvatar(
          avatar,
          `${user.id}/avatar-${Date.now()}.${avatar.name.split('.').pop()}`
        );
        if (uploadError) {
          throw new Error('Failed to upload avatar');
        }
        avatarUrl = url;
      }
      
      // Update user profile
      const { user: updatedUser, error: updateError } = await updateUserProfile(user.id, {
        username: formData.username,
        bio: formData.bio,
        ville: formData.ville,
        code_postal: formData.code_postal,
        pays: formData.pays,
        avatar_url: avatarUrl,
      });
      
      if (updateError) throw updateError;
      
      // Update the user in the store
      setUser(updatedUser);
      
      // Navigate back to profile
      navigate('/profile');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };
  
  if (!user) {
    console.log('🔍 No user found, showing loading spinner');
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }
  
  console.log('🔍 Rendering EditProfile form for user:', user.username);
  
  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-sm p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Edit Profile</h1>
      
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Avatar section */}
        <div className="flex items-center space-x-6">
          <div className="relative">
            <img
              src={avatarPreview || "https://images.pexels.com/photos/1767434/pexels-photo-1767434.jpeg?auto=compress&cs=tinysrgb&w=600"}
              alt="Profile"
              className="w-24 h-24 rounded-full object-cover border-4 border-gray-200"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = "https://images.pexels.com/photos/1767434/pexels-photo-1767434.jpeg?auto=compress&cs=tinysrgb&w=600";
              }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Profile Picture
            </label>
            <Input
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">
              Choose a new profile picture (optional)
            </p>
          </div>
        </div>
        
        {/* Username */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Username*
          </label>
          <Input
            name="username"
            value={formData.username}
            onChange={handleInputChange}
            required
            placeholder="Your username"
          />
        </div>
        
        {/* Bio */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Bio
          </label>
          <textarea
            name="bio"
            value={formData.bio}
            onChange={handleInputChange}
            rows={4}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-salmon-200 focus:border-salmon-300"
            placeholder="Tell us about yourself..."
          />
        </div>
        
        {/* Localisation */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-800 border-b border-gray-200 pb-2">
            Localisation
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ville
              </label>
              <Input
                name="ville"
                value={formData.ville}
                onChange={handleInputChange}
                placeholder="Votre ville"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Code postal
              </label>
              <Input
                name="code_postal"
                value={formData.code_postal}
                onChange={handleInputChange}
                placeholder="Code postal"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Pays
            </label>
            <select
              name="pays"
              value={formData.pays}
              onChange={handleInputChange}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-salmon-200 focus:border-salmon-300"
            >
              <option value="">Sélectionnez votre pays</option>
              <option value="Afghanistan">Afghanistan</option>
              <option value="Afrique du Sud">Afrique du Sud</option>
              <option value="Albanie">Albanie</option>
              <option value="Algérie">Algérie</option>
              <option value="Allemagne">Allemagne</option>
              <option value="Andorre">Andorre</option>
              <option value="Angola">Angola</option>
              <option value="Antigua-et-Barbuda">Antigua-et-Barbuda</option>
              <option value="Arabie saoudite">Arabie saoudite</option>
              <option value="Argentine">Argentine</option>
              <option value="Arménie">Arménie</option>
              <option value="Australie">Australie</option>
              <option value="Autriche">Autriche</option>
              <option value="Azerbaïdjan">Azerbaïdjan</option>
              <option value="Bahamas">Bahamas</option>
              <option value="Bahreïn">Bahreïn</option>
              <option value="Bangladesh">Bangladesh</option>
              <option value="Barbade">Barbade</option>
              <option value="Belgique">Belgique</option>
              <option value="Belize">Belize</option>
              <option value="Bénin">Bénin</option>
              <option value="Bhoutan">Bhoutan</option>
              <option value="Biélorussie">Biélorussie</option>
              <option value="Birmanie">Birmanie</option>
              <option value="Bolivie">Bolivie</option>
              <option value="Bosnie-Herzégovine">Bosnie-Herzégovine</option>
              <option value="Botswana">Botswana</option>
              <option value="Brésil">Brésil</option>
              <option value="Brunei">Brunei</option>
              <option value="Bulgarie">Bulgarie</option>
              <option value="Burkina Faso">Burkina Faso</option>
              <option value="Burundi">Burundi</option>
              <option value="Cambodge">Cambodge</option>
              <option value="Cameroun">Cameroun</option>
              <option value="Canada">Canada</option>
              <option value="Cap-Vert">Cap-Vert</option>
              <option value="Chili">Chili</option>
              <option value="Chine">Chine</option>
              <option value="Chypre">Chypre</option>
              <option value="Colombie">Colombie</option>
              <option value="Comores">Comores</option>
              <option value="Congo">Congo</option>
              <option value="Congo (RDC)">Congo (RDC)</option>
              <option value="Corée du Nord">Corée du Nord</option>
              <option value="Corée du Sud">Corée du Sud</option>
              <option value="Costa Rica">Costa Rica</option>
              <option value="Côte d'Ivoire">Côte d'Ivoire</option>
              <option value="Croatie">Croatie</option>
              <option value="Cuba">Cuba</option>
              <option value="Danemark">Danemark</option>
              <option value="Djibouti">Djibouti</option>
              <option value="Dominique">Dominique</option>
              <option value="Égypte">Égypte</option>
              <option value="Émirats arabes unis">Émirats arabes unis</option>
              <option value="Équateur">Équateur</option>
              <option value="Érythrée">Érythrée</option>
              <option value="Espagne">Espagne</option>
              <option value="Estonie">Estonie</option>
              <option value="Eswatini">Eswatini</option>
              <option value="États-Unis">États-Unis</option>
              <option value="Éthiopie">Éthiopie</option>
              <option value="Fidji">Fidji</option>
              <option value="Finlande">Finlande</option>
              <option value="France">France</option>
              <option value="Gabon">Gabon</option>
              <option value="Gambie">Gambie</option>
              <option value="Géorgie">Géorgie</option>
              <option value="Ghana">Ghana</option>
              <option value="Grèce">Grèce</option>
              <option value="Grenade">Grenade</option>
              <option value="Guatemala">Guatemala</option>
              <option value="Guinée">Guinée</option>
              <option value="Guinée-Bissau">Guinée-Bissau</option>
              <option value="Guinée équatoriale">Guinée équatoriale</option>
              <option value="Guyana">Guyana</option>
              <option value="Haïti">Haïti</option>
              <option value="Honduras">Honduras</option>
              <option value="Hongrie">Hongrie</option>
              <option value="Îles Cook">Îles Cook</option>
              <option value="Îles Marshall">Îles Marshall</option>
              <option value="Îles Salomon">Îles Salomon</option>
              <option value="Inde">Inde</option>
              <option value="Indonésie">Indonésie</option>
              <option value="Irak">Irak</option>
              <option value="Iran">Iran</option>
              <option value="Irlande">Irlande</option>
              <option value="Islande">Islande</option>
              <option value="Israël">Israël</option>
              <option value="Italie">Italie</option>
              <option value="Jamaïque">Jamaïque</option>
              <option value="Japon">Japon</option>
              <option value="Jordanie">Jordanie</option>
              <option value="Kazakhstan">Kazakhstan</option>
              <option value="Kenya">Kenya</option>
              <option value="Kirghizistan">Kirghizistan</option>
              <option value="Kiribati">Kiribati</option>
              <option value="Koweït">Koweït</option>
              <option value="Laos">Laos</option>
              <option value="Lesotho">Lesotho</option>
              <option value="Lettonie">Lettonie</option>
              <option value="Liban">Liban</option>
              <option value="Liberia">Liberia</option>
              <option value="Libye">Libye</option>
              <option value="Liechtenstein">Liechtenstein</option>
              <option value="Lituanie">Lituanie</option>
              <option value="Luxembourg">Luxembourg</option>
              <option value="Macédoine du Nord">Macédoine du Nord</option>
              <option value="Madagascar">Madagascar</option>
              <option value="Malaisie">Malaisie</option>
              <option value="Malawi">Malawi</option>
              <option value="Maldives">Maldives</option>
              <option value="Mali">Mali</option>
              <option value="Malte">Malte</option>
              <option value="Maroc">Maroc</option>
              <option value="Maurice">Maurice</option>
              <option value="Mauritanie">Mauritanie</option>
              <option value="Mexique">Mexique</option>
              <option value="Micronésie">Micronésie</option>
              <option value="Moldavie">Moldavie</option>
              <option value="Monaco">Monaco</option>
              <option value="Mongolie">Mongolie</option>
              <option value="Monténégro">Monténégro</option>
              <option value="Mozambique">Mozambique</option>
              <option value="Namibie">Namibie</option>
              <option value="Nauru">Nauru</option>
              <option value="Népal">Népal</option>
              <option value="Nicaragua">Nicaragua</option>
              <option value="Niger">Niger</option>
              <option value="Nigeria">Nigeria</option>
              <option value="Niue">Niue</option>
              <option value="Norvège">Norvège</option>
              <option value="Nouvelle-Zélande">Nouvelle-Zélande</option>
              <option value="Oman">Oman</option>
              <option value="Ouganda">Ouganda</option>
              <option value="Ouzbékistan">Ouzbékistan</option>
              <option value="Pakistan">Pakistan</option>
              <option value="Palaos">Palaos</option>
              <option value="Palestine">Palestine</option>
              <option value="Panama">Panama</option>
              <option value="Papouasie-Nouvelle-Guinée">Papouasie-Nouvelle-Guinée</option>
              <option value="Paraguay">Paraguay</option>
              <option value="Pays-Bas">Pays-Bas</option>
              <option value="Pérou">Pérou</option>
              <option value="Philippines">Philippines</option>
              <option value="Pologne">Pologne</option>
              <option value="Portugal">Portugal</option>
              <option value="Qatar">Qatar</option>
              <option value="République centrafricaine">République centrafricaine</option>
              <option value="République dominicaine">République dominicaine</option>
              <option value="République tchèque">République tchèque</option>
              <option value="Roumanie">Roumanie</option>
              <option value="Royaume-Uni">Royaume-Uni</option>
              <option value="Russie">Russie</option>
              <option value="Rwanda">Rwanda</option>
              <option value="Saint-Christophe-et-Niévès">Saint-Christophe-et-Niévès</option>
              <option value="Saint-Marin">Saint-Marin</option>
              <option value="Saint-Vincent-et-les-Grenadines">Saint-Vincent-et-les-Grenadines</option>
              <option value="Sainte-Lucie">Sainte-Lucie</option>
              <option value="Salvador">Salvador</option>
              <option value="Samoa">Samoa</option>
              <option value="São Tomé-et-Principe">São Tomé-et-Principe</option>
              <option value="Sénégal">Sénégal</option>
              <option value="Serbie">Serbie</option>
              <option value="Seychelles">Seychelles</option>
              <option value="Sierra Leone">Sierra Leone</option>
              <option value="Singapour">Singapour</option>
              <option value="Slovaquie">Slovaquie</option>
              <option value="Slovénie">Slovénie</option>
              <option value="Somalie">Somalie</option>
              <option value="Soudan">Soudan</option>
              <option value="Soudan du Sud">Soudan du Sud</option>
              <option value="Sri Lanka">Sri Lanka</option>
              <option value="Suède">Suède</option>
              <option value="Suisse">Suisse</option>
              <option value="Suriname">Suriname</option>
              <option value="Syrie">Syrie</option>
              <option value="Tadjikistan">Tadjikistan</option>
              <option value="Tanzanie">Tanzanie</option>
              <option value="Tchad">Tchad</option>
              <option value="Thaïlande">Thaïlande</option>
              <option value="Timor oriental">Timor oriental</option>
              <option value="Togo">Togo</option>
              <option value="Tonga">Tonga</option>
              <option value="Trinité-et-Tobago">Trinité-et-Tobago</option>
              <option value="Tunisie">Tunisie</option>
              <option value="Turkménistan">Turkménistan</option>
              <option value="Turquie">Turquie</option>
              <option value="Tuvalu">Tuvalu</option>
              <option value="Ukraine">Ukraine</option>
              <option value="Uruguay">Uruguay</option>
              <option value="Vanuatu">Vanuatu</option>
              <option value="Vatican">Vatican</option>
              <option value="Venezuela">Venezuela</option>
              <option value="Vietnam">Vietnam</option>
              <option value="Yémen">Yémen</option>
              <option value="Zambie">Zambie</option>
              <option value="Zimbabwe">Zimbabwe</option>
            </select>
          </div>
        </div>
        
        {/* Action buttons */}
        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              console.log('🔍 Cancel button clicked, navigating to /profile');
              navigate('/profile');
            }}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center">
                <LoadingSpinner size="sm\" className="mr-2" />
                Saving...
              </div>
            ) : (
              'Save Changes'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default EditProfile;