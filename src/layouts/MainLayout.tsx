import { Outlet } from 'react-router-dom';
import Navbar from '../components/navigation/Navbar';
import Sidebar from '../components/navigation/Sidebar';
import MobileNav from '../components/navigation/MobileNav';

const MainLayout = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop navbar */}
      <Navbar />
      
      <div className="container mx-auto px-4 py-4 pt-20 flex">
        {/* Desktop sidebar */}
        <div className="hidden lg:block w-64 flex-shrink-0">
          <Sidebar />
        </div>
        
        {/* Main content */}
        <main className="flex-grow lg:ml-6">
          <Outlet />
        </main>
      </div>
      
      {/* Mobile navigation */}
      <div className="lg:hidden">
        <MobileNav />
      </div>
    </div>
  );
};

export default MainLayout;