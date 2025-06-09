// import React from 'react';
// import { Link } from 'react-router-dom';

// const Footer: React.FC = () => {
//   return (
//     <footer className="bg-gray-800 text-gray-300 py-8 px-4">
//       <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center">
//         <p className="text-sm mb-4 md:mb-0">&copy; {new Date().getFullYear()} PawConnect. Tous droits réservés.</p>
//         <div className="flex space-x-4 text-sm">
//           <Link to="/mentions-legales" className="hover:underline">Mentions légales</Link>
//           <Link to="/cgu" className="hover:underline">CGU</Link>
//           <a href="mailto:support@pawconnect.com" className="hover:underline">Contact</a>
//         </div>
//       </div>
//     </footer>
//   );
// };

// export default Footer;

import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  return (
    <footer className="bg-[#D93A19] text-white py-6 px-4">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center text-sm">
        <p>&copy; {new Date().getFullYear()} PawConnect. Tous droits réservés.</p>
        <div className="flex gap-4 mt-4 md:mt-0">
          <Link to="/mentions-legales" className="hover:underline">Mentions légales</Link>
          <Link to="/cgu" className="hover:underline">CGU</Link>
          <a href="mailto:support@pawconnect.com" className="hover:underline">Contact</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
