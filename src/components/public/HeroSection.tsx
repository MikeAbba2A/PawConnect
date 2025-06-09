import React from 'react';
import { Link } from 'react-router-dom';
import heroImage from '../../assets/hero-pets.png'; // mets ton image ici

const HeroSection: React.FC = () => {
  return (
    <section className="relative w-full h-screen overflow-hidden">
      <img
        src={heroImage}
        alt="Chiot et chat mignons"
        className="absolute top-0 left-0 w-full h-full object-contain md:object-cover"
      />
      <div className="absolute inset-0 bg-black/40 flex flex-col justify-center items-center text-white text-center px-4">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 drop-shadow">
          Bienvenue sur PawConnect 🐾
        </h1>
        <p className="text-lg mb-6 drop-shadow">
          Le réseau social de vos compagnons à pattes
        </p>
        <div className="flex gap-4">
          <Link
            to="/signup"
            className="bg-[#D93A19] hover:bg-pink-700 text-white px-6 py-3 rounded-xl font-medium"
          >
            Rejoindre l'aventure
          </Link>
          <Link
            to="/signin"
            className="bg-[#46e717] text-gray-800 px-6 py-3 rounded-xl font-medium hover:bg-gray-200"
          >
            Se connecter
          </Link>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;


