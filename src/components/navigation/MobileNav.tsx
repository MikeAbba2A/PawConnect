import { Link } from 'react-router-dom';
import { Home, Search, PlusSquare, MessageCircle, User } from 'lucide-react';

const MobileNav = () => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 py-2 px-4 z-10">
      <div className="flex justify-around items-center">
        <Link to="/" className="flex flex-col items-center p-2 text-salmon-600">
          <Home className="h-6 w-6" />
          <span className="text-xs mt-1">Home</span>
        </Link>
        
        <Link to="/favorites" className="flex flex-col items-center p-2 text-gray-500 hover:text-salmon-600">
          <Search className="h-6 w-6" />
          <span className="text-xs mt-1">Favoris</span>
        </Link>
        
        <Link to="/create-post" className="flex flex-col items-center p-2 text-gray-500 hover:text-salmon-600">
          <PlusSquare className="h-6 w-6" />
          <span className="text-xs mt-1">Post</span>
        </Link>
        
        <Link to="/messages" className="flex flex-col items-center p-2 text-gray-500 hover:text-salmon-600">
          <MessageCircle className="h-6 w-6" />
          <span className="text-xs mt-1">Messages</span>
        </Link>
        
        <Link to="/profile" className="flex flex-col items-center p-2 text-gray-500 hover:text-salmon-600">
          <User className="h-6 w-6" />
          <span className="text-xs mt-1">Profile</span>
        </Link>
      </div>
    </div>
  );
};

export default MobileNav;