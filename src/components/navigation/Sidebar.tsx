import { Link } from 'react-router-dom';
import { 
  Home, 
  Heart, 
  Map, 
  MessageCircle, 
  Calendar, 
  Plus, 
  User, 
  Settings,
  LogOut,
  Users
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import FriendsList from '../friends/FriendsList';

const Sidebar = () => {
  const { user, signOut } = useAuthStore();
  
  const menuItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: Heart, label: 'Favoris', path: '/favorites' },
    { icon: Map, label: 'Discover', path: '/discover' },
    { icon: MessageCircle, label: 'Messages', path: '/messages' },
    { icon: Calendar, label: 'Events', path: '/events' },
  ];
  
  return (
    <div className="bg-white rounded-lg shadow-sm p-4 sticky top-20">
      {/* User profile */}
      <div className="flex items-center mb-6 p-2">
        <img
          src={user?.avatar_url || "https://images.pexels.com/photos/1767434/pexels-photo-1767434.jpeg?auto=compress&cs=tinysrgb&w=600"}
          alt="Profile"
          className="h-10 w-10 rounded-full object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = "https://images.pexels.com/photos/1767434/pexels-photo-1767434.jpeg?auto=compress&cs=tinysrgb&w=600";
          }}
        />
        <div className="ml-3">
          <p className="font-medium text-gray-800">{user?.username}</p>
          <Link to="/profile" className="text-xs text-salmon-600 hover:text-salmon-700">
            View Profile
          </Link>
        </div>
      </div>
      
      {/* Menu items */}
      <nav className="space-y-1">
        {menuItems.map((item) => (
          <Link
            key={item.label}
            to={item.path}
            className="flex items-center px-4 py-2 text-gray-700 hover:bg-salmon-50 hover:text-salmon-600 rounded-lg transition-colors"
          >
            <item.icon className="h-5 w-5 mr-3" />
            {item.label}
          </Link>
        ))}
      </nav>
      
      {/* Add pet button */}
      <div className="mt-6">
        <Link
          to="/pets/create"
          className="flex items-center justify-center px-4 py-2 bg-salmon-100 text-salmon-700 rounded-lg hover:bg-salmon-200 transition-colors"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add a Pet
        </Link>
      </div>
      
      {/* Friends section */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="flex items-center mb-3">
          <Users className="h-5 w-5 text-gray-600 mr-2" />
          <h3 className="font-medium text-gray-800">Amis</h3>
        </div>
        <FriendsList />
      </div>
      
      {/* Bottom menu */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <nav className="space-y-1">
          <Link
            to="/settings"
            className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Settings className="h-5 w-5 mr-3" />
            Settings
          </Link>
          <button
            onClick={() => signOut()}
            className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors w-full"
          >
            <LogOut className="h-5 w-5 mr-3" />
            Sign Out
          </button>
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;