import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

const SignUp = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [ville, setVille] = useState('');
  const [codePostal, setCodePostal] = useState('');
  const [pays, setPays] = useState('');
  const [formError, setFormError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  
  const { signUp, isLoading, error, signUpSuccess, clearSignUpSuccess } = useAuthStore();

  // Handle successful signup
  useEffect(() => {
    if (signUpSuccess) {
      setShowSuccess(true);
      clearSignUpSuccess();
      
      // Redirect to sign in page after 3 seconds
      const timer = setTimeout(() => {
        navigate('/signin');
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [signUpSuccess, navigate, clearSignUpSuccess]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    
    if (password !== confirmPassword) {
      setFormError('Passwords do not match');
      return;
    }
    
    if (password.length < 6) {
      setFormError('Password must be at least 6 characters');
      return;
    }
    
   
    await signUp(email, password, username, { ville, code_postal: codePostal, pays });
  };

  // Show success message
  if (showSuccess) {
    return (
      <div className="text-center">
        <div className="mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Compte créé avec succès !</h2>
          <p className="text-gray-600 mb-4">
            Votre compte a été créé avec succès. Vous allez être redirigé vers la page de connexion dans quelques secondes.
          </p>
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-salmon-600"></div>
            <span>Redirection en cours...</span>
          </div>
        </div>
        
        <div className="text-center">
          <Link 
            to="/signin" 
            className="text-salmon-600 hover:text-salmon-700 font-medium underline"
          >
            Aller à la page de connexion maintenant
          </Link>
        </div>
      </div>
    );
  }
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Create Account</h2>
      
      {(error || formError) && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg">
          {formError || error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="your@email.com"
          />
        </div>
        
        <div className="mb-4">
          <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
            Nom d'utilisateur
          </label>
          <Input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            placeholder="Choisissez un nom d'utilisateur"
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label htmlFor="ville" className="block text-sm font-medium text-gray-700 mb-1">
              Ville
            </label>
            <Input
              id="ville"
              type="text"
              value={ville}
              onChange={(e) => setVille(e.target.value)}
              placeholder="Votre ville"
            />
          </div>
          
          <div>
            <label htmlFor="codePostal" className="block text-sm font-medium text-gray-700 mb-1">
              Code postal
            </label>
            <Input
              id="codePostal"
              type="text"
              value={codePostal}
              onChange={(e) => setCodePostal(e.target.value)}
              placeholder="Code postal"
            />
          </div>
        </div>
        
        <div className="mb-4">
          <label htmlFor="pays" className="block text-sm font-medium text-gray-700 mb-1">
            Pays
          </label>
          <select
            id="pays"
            value={pays}
            onChange={(e) => setPays(e.target.value)}
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
        
        <div className="mb-4">
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Mot de passe
          </label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="••••••••"
          />
        </div>
        
        <div className="mb-6">
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
            Confirmer le mot de passe
          </label>
          <Input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            placeholder="••••••••"
          />
        </div>
        
        <Button
          type="submit"
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? 'Création du compte...' : 'Créer un compte'}
        </Button>
        
        <div className="mt-4 text-center text-sm text-gray-600">
          Vous avez déjà un compte ?{' '}
          <Link to="/signin" className="text-salmon-600 hover:text-salmon-700 font-medium">
            Se connecter
          </Link>
        </div>
      </form>
    </div>
  );
};

export default SignUp;