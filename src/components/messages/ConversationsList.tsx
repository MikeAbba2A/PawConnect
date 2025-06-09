import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { Conversation } from '../../types/database.types';

interface ConversationsListProps {
  conversations: Conversation[];
  selectedConversation: Conversation | null;
  onSelectConversation: (conversation: Conversation) => void;
  currentUserId: string;
}

const ConversationsList: React.FC<ConversationsListProps> = ({
  conversations,
  selectedConversation,
  onSelectConversation,
  currentUserId
}) => {
  const getOtherParticipant = (conversation: Conversation) => {
    return conversation.participant_1_id === currentUserId
      ? conversation.participant_2
      : conversation.participant_1;
  };

  const formatLastMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return format(date, 'HH:mm');
    } else if (diffInHours < 168) { // 7 jours
      return format(date, 'EEE', { locale: fr });
    } else {
      return format(date, 'dd/MM', { locale: fr });
    }
  };

  if (conversations.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">Aucune conversation</p>
        <p className="text-sm text-gray-400 mt-1">
          Envoyez un message à un ami pour commencer une conversation
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-y-auto h-full">
      {conversations.map(conversation => {
        const otherParticipant = getOtherParticipant(conversation);
        const isSelected = selectedConversation?.id === conversation.id;
        const hasUnread = (conversation.unread_count || 0) > 0;

        return (
          <div
            key={conversation.id}
            onClick={() => onSelectConversation(conversation)}
            className={`p-4 border-b border-gray-100 cursor-pointer transition-colors ${
              isSelected 
                ? 'bg-salmon-50 border-salmon-200' 
                : 'hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className="relative">
                <img
                  src={otherParticipant?.avatar_url || "https://images.pexels.com/photos/1767434/pexels-photo-1767434.jpeg?auto=compress&cs=tinysrgb&w=600"}
                  alt={otherParticipant?.username}
                  className="w-12 h-12 rounded-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = "https://images.pexels.com/photos/1767434/pexels-photo-1767434.jpeg?auto=compress&cs=tinysrgb&w=600";
                  }}
                />
                {hasUnread && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-salmon-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-medium">
                      {conversation.unread_count! > 9 ? '9+' : conversation.unread_count}
                    </span>
                  </div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className={`font-medium truncate ${
                    hasUnread ? 'text-gray-900' : 'text-gray-700'
                  }`}>
                    {otherParticipant?.username}
                  </h3>
                  <span className="text-xs text-gray-500 flex-shrink-0">
                    {formatLastMessageTime(conversation.last_message_at)}
                  </span>
                </div>
                
                <div className="flex items-center justify-between mt-1">
                  <p className={`text-sm truncate ${
                    hasUnread ? 'text-gray-900 font-medium' : 'text-gray-500'
                  }`}>
                    {conversation.last_message_sender_id === currentUserId && 'Vous: '}
                    {conversation.last_message_content || 'Nouveau message'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ConversationsList;