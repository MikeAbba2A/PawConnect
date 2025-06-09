import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MoreHorizontal, Edit, Trash2, User } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import type { Post } from '../../types/database.types';

interface PostOptionsMenuProps {
  post: Post;
  onEdit?: () => void;
  onDelete?: () => void;
}

const PostOptionsMenu: React.FC<PostOptionsMenuProps> = ({ post, onEdit, onDelete }) => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  
  // Check if current user owns this post (through pet ownership)
  const isOwner = user?.id === post.pet?.owner_id;
  
  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);
  
  // Don't show menu if there are no available options
  if (!isOwner && !post.pet?.owner_id) {
    return null;
  }
  
  const handleEdit = () => {
    setIsOpen(false);
    navigate(`/posts/${post.id}/edit`);
  };
  
  const handleDelete = () => {
    setIsOpen(false);
    onDelete?.();
  };
  
  const handleViewOwnerProfile = () => {
    setIsOpen(false);
    navigate(`/users/${post.pet?.owner_id}`);
  };
  
  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
      >
        <MoreHorizontal className="h-5 w-5" />
      </button>
      
      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
          {/* Show "View owner profile" only if user doesn't own the post */}
          {!isOwner && (
            <button
              onClick={handleViewOwnerProfile}
              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <User className="h-4 w-4 mr-3" />
              Voir le profil du propriétaire
            </button>
          )}
          
          {/* Show edit/delete options only if user owns the post */}
          {isOwner && (
            <>
              {!isOwner && <hr className="my-1 border-gray-200" />}
              
              <button
                onClick={handleEdit}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Edit className="h-4 w-4 mr-3" />
                Editer
              </button>
              
              <button
                onClick={handleDelete}
                className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <Trash2 className="h-4 w-4 mr-3" />
                Supprimer
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default PostOptionsMenu;