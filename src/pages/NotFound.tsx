import React from 'react';
import { Link } from 'react-router-dom';
import { PawPrint as Paw } from 'lucide-react';
import Button from '../components/ui/Button';

const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-salmon-100 to-salmon-50 flex flex-col items-center justify-center p-4">
      <div className="text-center">
        <div className="flex items-center justify-center mb-6">
          <Paw size={60} className="text-salmon-600" />
        </div>
        
        <h1 className="text-6xl font-bold text-gray-800 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">Page Not Found</h2>
        
        <p className="text-gray-600 mb-8 max-w-md mx-auto">
          Oops! Looks like this page has wandered off. Maybe it's chasing a squirrel or taking a nap in the sun.
        </p>
        
        <Link to="/">
          <Button size="lg">
            Return to Home
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;