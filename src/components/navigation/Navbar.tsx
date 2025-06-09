import { Link } from 'react-router-dom';
import { PawPrint as Paw, Search, Menu } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import NotificationBell from '../notifications/NotificationBell';
import FriendRequestsDropdown from '../friends/FriendRequestsDropdown';
import MessageIndicator from './MessageIndicator';

const Navbar = () => {
  const { user, signOut } = useAuthStore();
  
  return (
    <header className="bg-white shadow-sm fixed top-0 left-0 right-0 z-10">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <Paw className="h-8 w-8 text-salmon-600" />
            <span className="ml-2 text-xl font-bold text-gray-800">PawConnect</span>
          </Link>
          
          {/* Search bar */}
          <div className="hidden md:flex flex-1 max-w-md mx-4">
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search for pets..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-full bg-gray-50 focus:outline-none focus:ring-2 focus:ring-salmon-200 focus:border-salmon-300"
              />
            </div>
          </div>
          
          {/* Right navigation */}
          <div className="flex items-center">
            {/* Messages */}
            <MessageIndicator />
            
            {/* Notifications */}
            <NotificationBell />
            
            {/* Friend requests */}
            <FriendRequestsDropdown />
            
            {/* User menu */}
            <div className="ml-3 relative">
              <div>
                <button className="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-salmon-500">
                  <img
                    className="h-8 w-8 rounded-full object-cover"
                    src={user?.avatar_url || "https://images.pexels.com/photos/1767434/pexels-photo-1767434.jpeg?auto=compress&cs=tinysrgb&w=600"}
                    alt="User"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "https://images.pexels.com/photos/1767434/pexels-photo-1767434.jpeg?auto=compress&cs=tinysrgb&w=600";
                    }}
                  />
                </button>
              </div>
              
              {/* Mobile menu button */}
              <div className="ml-3 md:hidden">
                <button className="p-2 rounded-md text-gray-600 hover:bg-gray-100">
                  <Menu className="h-6 w-6" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;