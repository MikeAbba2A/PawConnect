import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Send, Image as ImageIcon, Share, MoreVertical, Flag } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { 
  getConversationMessages, 
  sendTextMessage, 
  sendImageMessage,
  markMessagesAsRead,
  subscribeToConversation,
  uploadMessageImage,
  reportMessage
} from '../../lib/messageService';
import LoadingSpinner from '../ui/LoadingSpinner';
import MessageBubble from './MessageBubble';
import type { Conversation, Message } from '../../types/database.types';

interface ChatWindowProps {
  conversation: Conversation;
  currentUserId: string;
  onBack: () => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ conversation, currentUserId, onBack }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const subscriptionRef = useRef<any>(null);

  const otherParticipant = conversation.participant_1_id === currentUserId
    ? conversation.participant_2
    : conversation.participant_1;

  useEffect(() => {
    loadMessages();
    
    // Nettoyer l'ancienne souscription avant d'en créer une nouvelle
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
      subscriptionRef.current = null;
    }
    
    // S'abonner aux nouveaux messages
    subscriptionRef.current = subscribeToConversation(conversation.id, (newMessage) => {
      setMessages(prev => [...prev, newMessage]);
      
      // Marquer comme lu si ce n'est pas notre message
      if (newMessage.sender_id !== currentUserId) {
        markMessagesAsRead(conversation.id, currentUserId);
      }
    });

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
    };
  }, [conversation.id, currentUserId]);

  // Scroll vers le bas quand de nouveaux messages arrivent
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Marquer les messages comme lus quand on ouvre la conversation
  useEffect(() => {
    markMessagesAsRead(conversation.id, currentUserId);
  }, [conversation.id, currentUserId]);

  // Marquer les messages comme lus quand on reçoit de nouveaux messages
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.sender_id !== currentUserId && !lastMessage.is_read) {
        markMessagesAsRead(conversation.id, currentUserId);
      }
    }
  }, [messages, conversation.id, currentUserId]);

  const loadMessages = async (pageNum = 1) => {
    try {
      const { messages: conversationMessages, error: messagesError } = await getConversationMessages(
        conversation.id, 
        pageNum
      );
      
      if (messagesError) throw messagesError;

      if (pageNum === 1) {
        setMessages(conversationMessages);
      } else {
        setMessages(prev => [...conversationMessages, ...prev]);
      }

      setHasMore(conversationMessages.length === 50); // Limite par page
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load messages');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMoreMessages = async () => {
    if (loadingMore || !hasMore) return;
    
    setLoadingMore(true);
    const nextPage = page + 1;
    setPage(nextPage);
    await loadMessages(nextPage);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    setError(null);

    try {
      const { message, error: sendError } = await sendTextMessage(
        conversation.id,
        currentUserId,
        newMessage.trim()
      );

      if (sendError) throw sendError;

      setMessages(prev => [...prev, message]);
      setNewMessage('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Vérifier le type de fichier
    if (!file.type.startsWith('image/')) {
      setError('Veuillez sélectionner une image valide');
      return;
    }

    // Vérifier la taille (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('5MB maximum par image');
      return;
    }

    setSending(true);
    setError(null);

    try {
      // Upload de l'image
      const path = `${currentUserId}/${Date.now()}-${file.name}`;
      const { url, error: uploadError } = await uploadMessageImage(file, path);
      
      if (uploadError) throw uploadError;

      // Envoyer le message avec l'image
      const { message, error: sendError } = await sendImageMessage(
        conversation.id,
        currentUserId,
        url!
      );

      if (sendError) throw sendError;

      setMessages(prev => [...prev, message]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send image');
    } finally {
      setSending(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleReportMessage = async (messageId: string, reason: string, description?: string) => {
    try {
      await reportMessage(messageId, currentUserId, reason as any, description);
      // TODO: Afficher un toast de confirmation
      console.log('Message signalé');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to report message');
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center">
        <button
          onClick={onBack}
          className="md:hidden mr-3 p-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        
        <img
          src={otherParticipant?.avatar_url || "https://images.pexels.com/photos/1767434/pexels-photo-1767434.jpeg?auto=compress&cs=tinysrgb&w=600"}
          alt={otherParticipant?.username}
          className="w-10 h-10 rounded-full object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = "https://images.pexels.com/photos/1767434/pexels-photo-1767434.jpeg?auto=compress&cs=tinysrgb&w=600";
          }}
        />
        
        <div className="ml-3 flex-1">
          <h2 className="font-medium text-gray-800">{otherParticipant?.username}</h2>
          <p className="text-sm text-gray-500">En ligne</p>
        </div>

        <button className="p-2 text-gray-600 hover:text-gray-800 transition-colors">
          <MoreVertical className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {/* Bouton "Charger plus" */}
        {hasMore && (
          <div className="text-center">
            <button
              onClick={loadMoreMessages}
              disabled={loadingMore}
              className="text-salmon-600 hover:text-salmon-700 text-sm font-medium"
            >
              {loadingMore ? (
                <div className="flex items-center justify-center">
                  <LoadingSpinner size="sm" className="mr-2" />
                  Chargement...
                </div>
              ) : (
                'Charger plus de messages'
              )}
            </button>
          </div>
        )}

        {/* Messages */}
        {messages.map((message, index) => {
          const isOwn = message.sender_id === currentUserId;
          const showDate = index === 0 || 
            format(new Date(message.created_at), 'yyyy-MM-dd') !== 
            format(new Date(messages[index - 1].created_at), 'yyyy-MM-dd');

          return (
            <div key={message.id}>
              {showDate && (
                <div className="text-center my-4">
                  <span className="bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full">
                    {format(new Date(message.created_at), 'EEEE d MMMM yyyy', { locale: fr })}
                  </span>
                </div>
              )}
              
              <MessageBubble
                message={message}
                isOwn={isOwn}
                onReport={handleReportMessage}
              />
            </div>
          );
        })}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Zone de saisie */}
      <div className="p-4 border-t border-gray-200">
        {error && (
          <div className="mb-3 p-2 bg-red-50 border border-red-200 text-red-600 text-sm rounded">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSendMessage} className="flex items-end space-x-2">
          {/* Bouton image */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={sending}
            className="p-2 text-gray-600 hover:text-salmon-600 transition-colors disabled:opacity-50"
          >
            <ImageIcon className="w-5 h-5" />
          </button>

          {/* Bouton partage */}
          <button
            type="button"
            disabled={sending}
            className="p-2 text-gray-600 hover:text-salmon-600 transition-colors disabled:opacity-50"
          >
            <Share className="w-5 h-5" />
          </button>

          {/* Zone de texte */}
          <div className="flex-1 relative">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Tapez votre message..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-salmon-200 focus:border-salmon-300 resize-none"
              rows={1}
              style={{ minHeight: '40px', maxHeight: '120px' }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e);
                }
              }}
              disabled={sending}
            />
          </div>

          {/* Bouton envoyer */}
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="p-2 bg-salmon-600 text-white rounded-lg hover:bg-salmon-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {sending ? (
              <LoadingSpinner size="sm" color="gray" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatWindow;