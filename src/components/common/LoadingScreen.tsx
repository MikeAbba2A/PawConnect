import React from 'react';
import { PawPrint as Paw } from 'lucide-react';
import LoadingSpinner from '../ui/LoadingSpinner';

const LoadingScreen: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-salmon-100 to-salmon-50 flex flex-col items-center justify-center">
      <div className="flex items-center mb-4">
        <Paw size={40} className="text-salmon-600" />
        <h1 className="text-3xl font-bold text-gray-800 ml-2">PawConnect</h1>
      </div>
      
      <div className="flex flex-col items-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-gray-600">Loading your pawesome experience...</p>
      </div>
    </div>
  );
};

export default LoadingScreen;