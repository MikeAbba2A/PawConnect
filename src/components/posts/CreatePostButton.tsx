import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

const CreatePostButton = () => {
  const { user } = useAuthStore();
  
  return (
    <Link to="/create-post">
      <div className="bg-white rounded-lg shadow-sm p-4 flex items-center space-x-3 cursor-pointer hover:bg-gray-50 transition-colors">
        <img
          src={user?.avatar_url || "https://images.pexels.com/photos/1767434/pexels-photo-1767434.jpeg?auto=compress&cs=tinysrgb&w=600"}
          alt="Profile"
          className="h-10 w-10 rounded-full object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = "https://images.pexels.com/photos/1767434/pexels-photo-1767434.jpeg?auto=compress&cs=tinysrgb&w=600";
          }}
        />
        <div className="flex-1 bg-gray-100 rounded-full py-2 px-4 text-gray-500">
          Share what your pet is up to...
        </div>
        <div className="p-2 bg-salmon-100 rounded-full text-salmon-600">
          <Plus className="h-5 w-5" />
        </div>
      </div>
    </Link>
  );
};

export default CreatePostButton;