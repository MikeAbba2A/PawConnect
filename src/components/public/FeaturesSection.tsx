// import React from 'react';

// const features = [
//   { title: 'Créez le profil de vos animaux 🐶', description: 'Personnalisez leur avatar, leur race, leurs préférences...' },
//   { title: 'Partagez vos moments 📸', description: 'Publiez des photos et vidéos de vos compagnons.' },
//   { title: 'Tissez des liens 💬', description: 'Discutez avec d’autres passionnés d’animaux.' },
// ];

// const FeaturesSection: React.FC = () => {
//   return (
//     <section className="py-16 px-4 bg-white text-center">
//       <h2 className="text-3xl font-semibold mb-8">Pourquoi rejoindre PawConnect ?</h2>
//       <div className="grid md:grid-cols-3 gap-6">
//         {features.map((feature, index) => (
//           <div key={index} className="bg-gray-100 p-6 rounded-xl shadow">
//             <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
//             <p>{feature.description}</p>
//           </div>
//         ))}
//       </div>
//     </section>
//   );
// };

// export default FeaturesSection;

import React from 'react';

const features = [
  {
    icon: '🧒',
    title: 'Créez le profil de vos animaux',
    description: 'Personnalisez leur avatar, leur race, leurs préférences…',
  },
  {
    icon: '🖼️',
    title: 'Partagez vos moments',
    description: 'Publiez des photos et vidéos de vos compagnons.',
  },
  {
    icon: '💬',
    title: 'Tissez des liens',
    description: 'Discutez avec d’autres passionnés d’animaux.',
  },
];

const FeaturesSection: React.FC = () => {
  return (
    <section className="bg-[#FFEBE5] py-16 px-4 text-center">
      <h2 className="text-3xl font-bold text-gray-800 mb-10">Pourquoi rejoindre PawConnect ?</h2>
      <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {features.map((f, index) => (
          <div key={index} className="bg-white p-6 rounded-xl shadow hover:shadow-md transition">
            <div className="text-5xl mb-4">{f.icon}</div>
            <h3 className="text-xl font-semibold mb-2">{f.title}</h3>
            <p className="text-sm text-gray-600">{f.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default FeaturesSection;

