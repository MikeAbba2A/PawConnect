import { useState, useEffect, useRef } from 'react';
import { Users } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { getFriendRequests } from '../../lib/friendService';
import FriendRequestsList from './FriendRequestsList';

const FriendRequestsDropdown = () => {
  const { user } = useAuthStore();
  const [requestCount, setRequestCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;

    const loadRequestCount = async () => {
      const { requests, error } = await getFriendRequests(user.id);
      if (!error) {
        setRequestCount(requests.length);
      }
    };

    loadRequestCount();

    // Refresh count every 30 seconds
    const interval = setInterval(loadRequestCount, 30000);
    return () => clearInterval(interval);
  }, [user]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
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

  const handleRequestHandled = () => {
    setRequestCount(prev => Math.max(0, prev - 1));
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-full text-gray-600 hover:bg-gray-100 relative"
      >
        <Users className="h-6 w-6" />
        {requestCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {requestCount > 9 ? '9+' : requestCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-800">Demandes d'ami</h3>
          </div>

          {/* Content */}
          <div className="max-h-80 overflow-y-auto p-4">
            <FriendRequestsList onRequestHandled={handleRequestHandled} />
          </div>
        </div>
      )}
    </div>
  );
};

export default FriendRequestsDropdown;