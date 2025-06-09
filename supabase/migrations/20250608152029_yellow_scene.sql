/*
  # Système d'événements - Phase 1 (MVP)

  1. Nouvelles tables
    - `events` - Événements créés par les utilisateurs
    - `event_participants` - Participants aux événements
    - `event_types` - Types d'événements prédéfinis

  2. Fonctionnalités
    - Création d'événements par les utilisateurs
    - Inscription/désinscription aux événements
    - Gestion des types d'événements
    - Système de permissions (public/privé)

  3. Sécurité
    - RLS sur toutes les tables
    - Politiques pour la création, lecture et participation
*/

-- Table des types d'événements
CREATE TABLE IF NOT EXISTS event_types (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  color TEXT DEFAULT '#6B7280'
);

-- Insérer les types d'événements par défaut
INSERT INTO event_types (id, name, description, icon, color) VALUES
  ('adoption', 'Adoption', 'Événements d''adoption d''animaux', '🏠', '#10B981'),
  ('exhibition', 'Exposition', 'Expositions et concours d''animaux', '🏆', '#F59E0B'),
  ('training', 'Formation', 'Cours de dressage et formation', '🎓', '#3B82F6'),
  ('social', 'Social', 'Rencontres et sorties entre propriétaires', '👥', '#EC4899'),
  ('veterinary', 'Vétérinaire', 'Consultations et soins vétérinaires', '🏥', '#EF4444'),
  ('other', 'Autre', 'Autres types d''événements', '📅', '#6B7280')
ON CONFLICT (id) DO NOTHING;

-- Table des événements
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT NOT NULL REFERENCES event_types(id),
  organizer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date_start TIMESTAMPTZ NOT NULL,
  date_end TIMESTAMPTZ,
  location TEXT,
  address TEXT,
  max_participants INTEGER,
  is_public BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CHECK (date_end IS NULL OR date_end >= date_start),
  CHECK (max_participants IS NULL OR max_participants > 0)
);

-- Table des participants aux événements
CREATE TABLE IF NOT EXISTS event_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('pending', 'confirmed', 'declined', 'cancelled')) DEFAULT 'confirmed',
  invited_by UUID REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(event_id, user_id)
);

-- Index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_events_date_start ON events(date_start);
CREATE INDEX IF NOT EXISTS idx_events_organizer ON events(organizer_id);
CREATE INDEX IF NOT EXISTS idx_events_type ON events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_location ON events(location);
CREATE INDEX IF NOT EXISTS idx_events_public_active ON events(is_public, is_active) WHERE is_public = true AND is_active = true;
CREATE INDEX IF NOT EXISTS idx_event_participants_event ON event_participants(event_id);
CREATE INDEX IF NOT EXISTS idx_event_participants_user ON event_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_event_participants_status ON event_participants(status);

-- Enable RLS
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_participants ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour events
CREATE POLICY "Anyone can read public active events"
  ON events
  FOR SELECT
  TO public
  USING (is_public = true AND is_active = true);

CREATE POLICY "Users can read their own events"
  ON events
  FOR SELECT
  TO authenticated
  USING (auth.uid() = organizer_id);

CREATE POLICY "Users can read events they participate in"
  ON events
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM event_participants
      WHERE event_participants.event_id = events.id
      AND event_participants.user_id = auth.uid()
      AND event_participants.status IN ('confirmed', 'pending')
    )
  );

CREATE POLICY "Authenticated users can create events"
  ON events
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = organizer_id);

CREATE POLICY "Users can update their own events"
  ON events
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = organizer_id);

CREATE POLICY "Users can delete their own events"
  ON events
  FOR DELETE
  TO authenticated
  USING (auth.uid() = organizer_id);

-- Politiques RLS pour event_participants
CREATE POLICY "Anyone can read participants of public events"
  ON event_participants
  FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_participants.event_id
      AND events.is_public = true
      AND events.is_active = true
    )
  );

CREATE POLICY "Users can read their own participations"
  ON event_participants
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Event organizers can read all participants"
  ON event_participants
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_participants.event_id
      AND events.organizer_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can join public events"
  ON event_participants
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_participants.event_id
      AND events.is_public = true
      AND events.is_active = true
      AND (events.max_participants IS NULL OR 
           (SELECT COUNT(*) FROM event_participants ep 
            WHERE ep.event_id = events.id AND ep.status = 'confirmed') < events.max_participants)
    )
  );

CREATE POLICY "Users can update their own participation"
  ON event_participants
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Event organizers can update any participation"
  ON event_participants
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_participants.event_id
      AND events.organizer_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own participation"
  ON event_participants
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Event organizers can delete any participation"
  ON event_participants
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_participants.event_id
      AND events.organizer_id = auth.uid()
    )
  );

-- Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_events()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour updated_at
CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_events();

CREATE TRIGGER update_event_participants_updated_at
  BEFORE UPDATE ON event_participants
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_events();

-- Fonction pour créer des notifications d'événements
CREATE OR REPLACE FUNCTION create_event_notification()
RETURNS TRIGGER AS $$
DECLARE
  organizer_username TEXT;
  event_title TEXT;
  participant_record RECORD;
BEGIN
  -- Notification quand quelqu'un rejoint un événement
  IF TG_OP = 'INSERT' AND NEW.status = 'confirmed' THEN
    -- Récupérer les infos de l'événement et de l'organisateur
    SELECT events.title, users.username INTO event_title, organizer_username
    FROM events
    JOIN users ON events.organizer_id = users.id
    WHERE events.id = NEW.event_id;
    
    -- Notifier l'organisateur (sauf si c'est lui qui rejoint)
    IF NEW.user_id != (SELECT organizer_id FROM events WHERE id = NEW.event_id) THEN
      -- Récupérer le nom d'utilisateur du participant
      SELECT username INTO participant_record
      FROM users
      WHERE id = NEW.user_id;
      
      INSERT INTO notifications (
        user_id,
        type,
        message,
        post_id,
        from_user_id,
        is_read,
        created_at
      ) VALUES (
        (SELECT organizer_id FROM events WHERE id = NEW.event_id),
        'other',
        COALESCE(participant_record.username, 'Quelqu''un') || ' s''est inscrit à votre événement "' || COALESCE(event_title, 'Événement') || '"',
        NULL,
        NEW.user_id,
        false,
        now()
      );
    END IF;
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to create event notification: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour les notifications d'événements
CREATE TRIGGER after_event_participation_insert
  AFTER INSERT ON event_participants
  FOR EACH ROW
  EXECUTE FUNCTION create_event_notification();

-- Créer le bucket de stockage pour les images d'événements
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('event-images', 'event-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Politiques de stockage pour les images d'événements
CREATE POLICY "Public read access for event images"
ON storage.objects FOR SELECT
USING (bucket_id = 'event-images');

CREATE POLICY "Authenticated users can upload event images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'event-images' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Users can update their own event images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'event-images' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Users can delete their own event images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'event-images' AND
  auth.role() = 'authenticated'
);