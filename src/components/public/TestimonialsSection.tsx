// import React from 'react';

// interface Testimonial {
//   name: string;
//   message: string;
//   animal: string;
// }

// const testimonials: Testimonial[] = [
//   {
//     name: 'Claire & Léo',
//     animal: 'Félix le chat',
//     message: "Grâce à PawConnect, j'ai trouvé une super communauté de passionnés !",
//   },
//   {
//     name: 'Maxime',
//     animal: 'Rex le berger allemand',
//     message: "J’adore partager mes balades avec Rex, et découvrir celles des autres !",
//   },
//   {
//     name: 'Lina',
//     animal: 'Coco le perroquet',
//     message: "C’est génial de pouvoir créer un profil pour chaque animal.",
//   },
// ];

// const TestimonialsSection: React.FC = () => {
//   return (
//     <section className="bg-pink-50 py-16 px-4 text-center">
//       <h2 className="text-3xl font-bold mb-10">Ils parlent de nous 🐾</h2>
//       <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
//         {testimonials.map((t, index) => (
//           <div key={index} className="bg-white p-6 rounded-xl shadow border border-pink-100">
//             <p className="italic mb-4">“{t.message}”</p>
//             <h4 className="font-semibold">{t.name}</h4>
//             <span className="text-sm text-gray-500">avec {t.animal}</span>
//           </div>
//         ))}
//       </div>
//     </section>
//   );
// };

// export default TestimonialsSection;

import React from 'react';

interface Testimonial {
  name: string;
  animal: string;
  avatar: string;
  stars: number;
  text: string;
}

const testimonials: Testimonial[] = [
  {
    name: 'Claire S Leo',
    animal: 'Félix le chat',
    avatar: 'https://randomuser.me/api/portraits/women/65.jpg',
    stars: 5,
    text: "Grâce à PawConnect, j’ai trouvé une super communauté d’amoureux des animaux !",
  },
  {
    name: 'Maxime',
    animal: 'Rex le berger',
    avatar: 'https://randomuser.me/api/portraits/men/36.jpg',
    stars: 5,
    text: "J’adore partager mes balades avec Rex et découvrir celles des autres !",
  },
  {
    name: 'Lina',
    animal: 'Coco le perroquet',
    avatar: 'https://randomuser.me/api/portraits/women/22.jpg',
    stars: 5,
    text: "C’est génial de pouvoir créer un profil pour chaque animal !",
  },
];

const TestimonialsSection: React.FC = () => {
  return (
    <section className="bg-[#ffebe9] py-16 px-4 text-center">
      <h2 className="text-2xl md:text-3xl font-bold mb-10 text-gray-800">Ils parlent de nous 🐾</h2>
      <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {testimonials.map((t, index) => (
          <div key={index} className="bg-white p-6 rounded-xl shadow text-left">
            <div className="flex items-center gap-4 mb-4">
              <img src={t.avatar} alt={t.name} className="w-12 h-12 rounded-full object-cover" />
              <div>
                <h4 className="font-semibold text-gray-800">{t.name}</h4>
                <p className="text-sm text-gray-500">{t.animal}</p>
              </div>
            </div>
            <div className="text-yellow-500 mb-2">
              {'★'.repeat(t.stars)}{'☆'.repeat(5 - t.stars)}
            </div>
            <p className="text-sm text-gray-700 italic">“{t.text}”</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default TestimonialsSection;

