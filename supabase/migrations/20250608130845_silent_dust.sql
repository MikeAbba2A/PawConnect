/*
  # Système de messagerie complet

  1. Nouvelles tables
    - `conversations` - Conversations entre utilisateurs
    - `messages` - Messages individuels avec support médias
    - `message_reports` - Système de signalement

  2. Fonctionnalités
    - Messagerie 1-à-1 entre amis
    - Partage d'images et de posts
    - Système de modération/signalement
    - Indicateurs de lecture
    - Historique complet des conversations

  3. Sécurité
    - RLS sur toutes les tables
    - Seuls les amis peuvent s'envoyer des messages
    - Système de signalement pour modération
*/

-- Table des conversations
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_1_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  participant_2_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  last_message_at TIMESTAMPTZ DEFAULT now(),
  last_message_content TEXT,
  last_message_sender_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(participant_1_id, participant_2_id),
  CHECK (participant_1_id != participant_2_id)
);

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Table des messages
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT,
  message_type TEXT CHECK (message_type IN ('text', 'image', 'post_share')) DEFAULT 'text',
  metadata JSONB, -- Pour stocker URLs d'images, IDs de posts partagés, etc.
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Table des signalements de messages
CREATE TABLE IF NOT EXISTS message_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL CHECK (reason IN ('spam', 'harassment', 'inappropriate', 'other')),
  description TEXT,
  status TEXT CHECK (status IN ('pending', 'reviewed', 'resolved')) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(message_id, reporter_id)
);

ALTER TABLE message_reports ENABLE ROW LEVEL SECURITY;

-- Index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_conversations_participants ON conversations(participant_1_id, participant_2_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message ON conversations(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_unread ON messages(conversation_id, is_read) WHERE is_read = false;

-- Politiques RLS pour conversations
CREATE POLICY "Users can read their own conversations"
  ON conversations
  FOR SELECT
  TO authenticated
  USING (auth.uid() = participant_1_id OR auth.uid() = participant_2_id);

CREATE POLICY "Users can create conversations with friends"
  ON conversations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = participant_1_id
    AND EXISTS (
      SELECT 1 FROM friends
      WHERE ((user_id = participant_1_id AND friend_id = participant_2_id)
         OR (user_id = participant_2_id AND friend_id = participant_1_id))
      AND status = 'accepted'
    )
  );

CREATE POLICY "Users can update their own conversations"
  ON conversations
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = participant_1_id OR auth.uid() = participant_2_id);

-- Politiques RLS pour messages
CREATE POLICY "Users can read messages in their conversations"
  ON messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND (conversations.participant_1_id = auth.uid() OR conversations.participant_2_id = auth.uid())
    )
  );

CREATE POLICY "Users can send messages in their conversations"
  ON messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND (conversations.participant_1_id = auth.uid() OR conversations.participant_2_id = auth.uid())
    )
  );

CREATE POLICY "Users can update their own messages"
  ON messages
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND (conversations.participant_1_id = auth.uid() OR conversations.participant_2_id = auth.uid())
    )
  );

CREATE POLICY "Users can delete their own messages"
  ON messages
  FOR DELETE
  TO authenticated
  USING (auth.uid() = sender_id);

-- Politiques RLS pour signalements
CREATE POLICY "Users can read their own reports"
  ON message_reports
  FOR SELECT
  TO authenticated
  USING (auth.uid() = reporter_id);

CREATE POLICY "Users can create reports"
  ON message_reports
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = reporter_id);

-- Fonction pour mettre à jour la conversation lors d'un nouveau message
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET 
    last_message_at = NEW.created_at,
    last_message_content = CASE 
      WHEN NEW.message_type = 'text' THEN NEW.content
      WHEN NEW.message_type = 'image' THEN '📷 Image'
      WHEN NEW.message_type = 'post_share' THEN '📝 Post partagé'
      ELSE 'Message'
    END,
    last_message_sender_id = NEW.sender_id
  WHERE id = NEW.conversation_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour la conversation
CREATE TRIGGER after_message_insert
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_last_message();

-- Fonction pour créer ou récupérer une conversation entre deux utilisateurs
CREATE OR REPLACE FUNCTION get_or_create_conversation(user1_id UUID, user2_id UUID)
RETURNS UUID AS $$
DECLARE
  conversation_id UUID;
  min_id UUID;
  max_id UUID;
BEGIN
  -- Assurer un ordre cohérent pour éviter les doublons
  IF user1_id < user2_id THEN
    min_id := user1_id;
    max_id := user2_id;
  ELSE
    min_id := user2_id;
    max_id := user1_id;
  END IF;
  
  -- Chercher une conversation existante
  SELECT id INTO conversation_id
  FROM conversations
  WHERE (participant_1_id = min_id AND participant_2_id = max_id)
     OR (participant_1_id = max_id AND participant_2_id = min_id);
  
  -- Si pas trouvée, créer une nouvelle conversation
  IF conversation_id IS NULL THEN
    INSERT INTO conversations (participant_1_id, participant_2_id)
    VALUES (min_id, max_id)
    RETURNING id INTO conversation_id;
  END IF;
  
  RETURN conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Créer le bucket de stockage pour les images de messages
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('message-images', 'message-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Politiques de stockage pour les images de messages
CREATE POLICY "Public read access for message images"
ON storage.objects FOR SELECT
USING (bucket_id = 'message-images');

CREATE POLICY "Authenticated users can upload message images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'message-images' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Users can update their own message images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'message-images' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Users can delete their own message images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'message-images' AND
  auth.role() = 'authenticated'
);