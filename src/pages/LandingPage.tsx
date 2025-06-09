import React from 'react';
import HeroSection from '../components/public/HeroSection';
// import FeaturesSection from '../components/public/FeaturesSection';
// import TestimonialsSection from '../components/public/TestimonialsSection';
// import Footer from '../components/public/Footer';

const LandingPage: React.FC = () => {
  return (
    <div className="bg-white text-gray-800">
      <HeroSection />
      {/* <FeaturesSection />
      <TestimonialsSection />
      <Footer /> */}
    </div>
  );
};

export default LandingPage;
