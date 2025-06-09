import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { getUserConversations, subscribeToConversations } from '../lib/messageService';
import { supabase } from '../lib/supabase';
import ConversationsList from '../components/messages/ConversationsList';
import ChatWindow from '../components/messages/ChatWindow';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import type { Conversation } from '../types/database.types';

const Messages = () => {
  const { user } = useAuthStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Utiliser une ref pour la souscription
  const channelRef = useRef<any>(null);

  // Récupérer l'ID de conversation depuis l'URL
  const conversationId = searchParams.get('conversation');

  useEffect(() => {
    if (!user || !user.id) return;

    const initializeConversations = async () => {
      try {
        setLoading(true);
        setError(null);

        // Nettoyer l'ancien canal avant d'en créer un nouveau
        if (channelRef.current) {
          supabase.removeChannel(channelRef.current);
          channelRef.current = null;
        }

        // Créer et s'abonner au canal
        const channel = subscribeToConversations(user.id, (updatedConversation) => {
          console.log("Conversation mise à jour:", updatedConversation);
          setConversations(prev => {
            const index = prev.findIndex(c => c.id === updatedConversation.id);
            if (index >= 0) {
              const updated = [...prev];
              updated[index] = updatedConversation;
              return updated.sort((a, b) => 
                (new Date(b.last_message_at).getTime() || 0) - (new Date(a.last_message_at).getTime() || 0)
              );
            } else {
              return [updatedConversation, ...prev];
            }
          });
        });
        
        // Stocker la référence du canal
        channelRef.current = channel;
        
        // S'abonner au canal
        channel.subscribe();

        // Charger les conversations initiales (asynchrone)
        const { conversations: userConversations, error: conversationsError } = await getUserConversations(user.id);
        console.log("Résultat getUserConversations:", userConversations, conversationsError);
        
        if (conversationsError) throw conversationsError;

        setConversations(userConversations);

      } catch (err) {
        console.error("Erreur initializeConversations:", err);
        setError(err instanceof Error ? err.message : 'Failed to load conversations');
      } finally {
        setLoading(false);
      }
    };

    initializeConversations();

    // Fonction de nettoyage - supprimer le canal quand le composant se démonte ou que user.id change
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [user?.id]); // Dépendance uniquement sur user.id

  // Sélectionner la conversation depuis l'URL
  useEffect(() => {
    if (conversationId && conversations.length > 0) {
      const conversation = conversations.find(c => c.id === conversationId);
      if (conversation) {
        setSelectedConversation(conversation);
      }
    }
  }, [conversationId, conversations]);

  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    setSearchParams({ conversation: conversation.id });
  };

  const handleBackToList = () => {
    setSelectedConversation(null);
    setSearchParams({});
  };

  // Early return si user n'est pas chargé
  if (!user || !user.id) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg">
        {error}
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-120px)]">
      <div className="bg-white rounded-lg shadow-sm overflow-hidden h-full flex">
        {/* Liste des conversations - cachée sur mobile quand une conversation est sélectionnée */}
        <div className={`w-full md:w-1/3 border-r border-gray-200 ${
          selectedConversation ? 'hidden md:block' : 'block'
        }`}>
          <div className="p-4 border-b border-gray-200">
            <h1 className="text-xl font-bold text-gray-800">Messages</h1>
          </div>
          
          <ConversationsList
            conversations={conversations}
            selectedConversation={selectedConversation}
            onSelectConversation={handleSelectConversation}
            currentUserId={user.id}
          />
        </div>

        {/* Zone de chat */}
        <div className={`w-full md:w-2/3 ${
          selectedConversation ? 'block' : 'hidden md:block'
        }`}>
          {selectedConversation ? (
            <ChatWindow
              conversation={selectedConversation}
              currentUserId={user.id}
              onBack={handleBackToList}
            />
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-700 mb-2">
                  Sélectionnez une conversation
                </h3>
                <p className="text-gray-500">
                  Choisissez une conversation dans la liste pour commencer à discuter
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages;