import { Outlet } from 'react-router-dom';
import { PawPrint as Paw } from 'lucide-react';

const AuthLayout = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-salmon-100 to-salmon-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center">
            <Paw size={40} className="text-salmon-600" />
            <h1 className="text-3xl font-bold text-gray-800 ml-2">PawConnect</h1>
          </div>
          <p className="text-gray-600 mt-2">Connect with pets around the world</p>
        </div>
        
        <div className="bg-white p-8 rounded-xl shadow-lg">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;