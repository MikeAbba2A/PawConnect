/*
  # Système de notifications

  1. Nouvelle table
    - `notifications` - Stocke toutes les notifications
      - `id` (uuid, primary key)
      - `user_id` (uuid, référence vers users) - Utilisateur qui reçoit la notification
      - `type` (text) - Type de notification ('like', 'comment')
      - `message` (text) - Message de la notification
      - `post_id` (uuid, référence vers posts) - Post concerné
      - `from_user_id` (uuid, référence vers users) - Utilisateur qui a déclenché la notification
      - `is_read` (boolean) - Si la notification a été lue
      - `created_at` (timestamp)

  2. Sécurité
    - Enable RLS sur la table notifications
    - Politiques pour que les utilisateurs ne voient que leurs propres notifications

  3. Fonctions
    - Fonction pour créer automatiquement des notifications lors des likes/commentaires
    - Triggers pour déclencher les notifications
*/

-- Table des notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('like', 'comment')),
  message TEXT NOT NULL,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  from_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour les notifications
CREATE POLICY "Users can read their own notifications"
  ON notifications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON notifications
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Fonction pour créer une notification de like
CREATE OR REPLACE FUNCTION create_like_notification()
RETURNS TRIGGER AS $$
DECLARE
  post_owner_id UUID;
  from_username TEXT;
  pet_name TEXT;
BEGIN
  -- Récupérer le propriétaire du post et le nom de l'animal
  SELECT pets.owner_id, pets.name INTO post_owner_id, pet_name
  FROM posts 
  JOIN pets ON posts.pet_id = pets.id 
  WHERE posts.id = NEW.post_id;
  
  -- Récupérer le nom d'utilisateur de celui qui like
  SELECT username INTO from_username
  FROM users 
  WHERE id = NEW.user_id;
  
  -- Ne pas créer de notification si l'utilisateur like son propre post
  IF post_owner_id != NEW.user_id THEN
    INSERT INTO notifications (
      user_id,
      type,
      message,
      post_id,
      from_user_id
    ) VALUES (
      post_owner_id,
      'like',
      from_username || ' a aimé le post de ' || pet_name,
      NEW.post_id,
      NEW.user_id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour créer une notification de commentaire
CREATE OR REPLACE FUNCTION create_comment_notification()
RETURNS TRIGGER AS $$
DECLARE
  post_owner_id UUID;
  from_username TEXT;
  pet_name TEXT;
BEGIN
  -- Récupérer le propriétaire du post et le nom de l'animal
  SELECT pets.owner_id, pets.name INTO post_owner_id, pet_name
  FROM posts 
  JOIN pets ON posts.pet_id = pets.id 
  WHERE posts.id = NEW.post_id;
  
  -- Récupérer le nom d'utilisateur de celui qui commente
  SELECT username INTO from_username
  FROM users 
  WHERE id = NEW.user_id;
  
  -- Ne pas créer de notification si l'utilisateur commente son propre post
  IF post_owner_id != NEW.user_id THEN
    INSERT INTO notifications (
      user_id,
      type,
      message,
      post_id,
      from_user_id
    ) VALUES (
      post_owner_id,
      'comment',
      from_username || ' a commenté le post de ' || pet_name,
      NEW.post_id,
      NEW.user_id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour créer automatiquement les notifications
CREATE TRIGGER after_like_insert
  AFTER INSERT ON likes
  FOR EACH ROW
  EXECUTE FUNCTION create_like_notification();

CREATE TRIGGER after_comment_insert
  AFTER INSERT ON comments
  FOR EACH ROW
  EXECUTE FUNCTION create_comment_notification();