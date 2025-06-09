import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { MoreVertical, Flag, Trash2, Image as ImageIcon } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { deleteMessage } from '../../lib/messageService';
import type { Message } from '../../types/database.types';

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  onReport: (messageId: string, reason: string, description?: string) => void;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isOwn, onReport }) => {
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  const handleDelete = async () => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce message ?')) {
      await deleteMessage(message.id);
    }
    setShowMenu(false);
  };

  const handleReport = (reason: string, description?: string) => {
    onReport(message.id, reason, description);
    setShowReportModal(false);
    setShowMenu(false);
  };

  const handlePostClick = () => {
    if (message.metadata?.post_id) {
      navigate(`/posts/${message.metadata.post_id}`);
    }
  };

  // Function to detect and make links clickable
  const renderMessageWithLinks = (text: string) => {
    // Pattern to detect event URLs
    const eventUrlPattern = /(https?:\/\/[^\s]+\/events\/([a-f0-9-]{36}))/g;
    // Pattern to detect general URLs
    const urlPattern = /(https?:\/\/[^\s]+)/g;
    
    // First, handle event URLs specifically
    let processedText = text.replace(eventUrlPattern, (match, fullUrl, eventId) => {
      return `<a href="/events/${eventId}" class="text-blue-600 hover:text-blue-800 underline" data-event-link="${eventId}">Voir l'événement</a>`;
    });
    
    // Then handle other URLs (but skip already processed event URLs)
    processedText = processedText.replace(urlPattern, (match) => {
      // Skip if this URL was already processed as an event URL
      if (match.includes('/events/') && eventUrlPattern.test(match)) {
        return match;
      }
      return `<a href="${match}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 underline">${match}</a>`;
    });
    
    return processedText;
  };

  // Handle clicks on event links
  const handleEventLinkClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.hasAttribute('data-event-link')) {
      e.preventDefault();
      const eventId = target.getAttribute('data-event-link');
      if (eventId) {
        navigate(`/events/${eventId}`);
      }
    }
  };

  const renderMessageContent = () => {
    switch (message.message_type) {
      case 'text':
        return (
          <div 
            className="text-sm whitespace-pre-wrap break-words"
            dangerouslySetInnerHTML={{ 
              __html: renderMessageWithLinks(message.content || '') 
            }}
            onClick={handleEventLinkClick}
          />
        );

      case 'image':
        return (
          <div className="max-w-xs">
            <img
              src={message.metadata?.image_url}
              alt="Image partagée"
              className="rounded-lg max-w-full h-auto cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => {
                // TODO: Ouvrir en plein écran
                window.open(message.metadata?.image_url, '_blank');
              }}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
          </div>
        );

      case 'post_share':
        return (
          <div 
            onClick={handlePostClick}
            className="border border-gray-200 rounded-lg p-3 cursor-pointer hover:bg-gray-50 transition-colors max-w-xs"
          >
            <div className="flex items-start space-x-3">
              {message.metadata?.post_image && (
                <img
                  src={message.metadata.post_image}
                  alt="Post"
                  className="w-12 h-12 rounded object-cover flex-shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 line-clamp-2">
                  {message.metadata?.post_title || 'Post partagé'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Cliquez pour voir le post
                </p>
              </div>
            </div>
          </div>
        );

      default:
        return <p className="text-sm text-gray-500">Message non supporté</p>;
    }
  };

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-xs lg:max-w-md relative group ${
        isOwn ? 'order-2' : 'order-1'
      }`}>
        {/* Menu options */}
        <div className={`absolute top-0 ${isOwn ? 'left-0 -translate-x-8' : 'right-0 translate-x-8'} opacity-0 group-hover:opacity-100 transition-opacity`}>
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {showMenu && (
              <div className={`absolute top-full mt-1 w-32 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10 ${
                isOwn ? 'right-0' : 'left-0'
              }`}>
                {isOwn ? (
                  <button
                    onClick={handleDelete}
                    className="flex items-center w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Supprimer
                  </button>
                ) : (
                  <button
                    onClick={() => setShowReportModal(true)}
                    className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Flag className="w-4 h-4 mr-2" />
                    Signaler
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Bulle de message */}
        <div className={`rounded-lg px-3 py-2 ${
          isOwn 
            ? 'bg-salmon-600 text-white' 
            : 'bg-gray-100 text-gray-800'
        }`}>
          {renderMessageContent()}
        </div>

        {/* Timestamp */}
        <p className={`text-xs text-gray-500 mt-1 ${
          isOwn ? 'text-right' : 'text-left'
        }`}>
          {format(new Date(message.created_at), 'HH:mm', { locale: fr })}
        </p>
      </div>

      {/* Modal de signalement */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Signaler ce message
            </h3>
            
            <div className="space-y-3">
              <button
                onClick={() => handleReport('spam')}
                className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="font-medium text-gray-800">Spam</div>
                <div className="text-sm text-gray-500">Contenu indésirable ou répétitif</div>
              </button>
              
              <button
                onClick={() => handleReport('harassment')}
                className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="font-medium text-gray-800">Harcèlement</div>
                <div className="text-sm text-gray-500">Comportement abusif ou menaçant</div>
              </button>
              
              <button
                onClick={() => handleReport('inappropriate')}
                className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="font-medium text-gray-800">Contenu inapproprié</div>
                <div className="text-sm text-gray-500">Contenu offensant ou déplacé</div>
              </button>
              
              <button
                onClick={() => handleReport('other')}
                className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="font-medium text-gray-800">Autre</div>
                <div className="text-sm text-gray-500">Autre raison</div>
              </button>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowReportModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageBubble;