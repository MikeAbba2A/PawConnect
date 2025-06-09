/*
  # Ajouter les champs de localisation aux utilisateurs

  1. Modifications du schéma
    - Ajouter les colonnes ville, code_postal, pays à la table users
    - Ces champs sont optionnels pour maintenir la compatibilité

  2. Sécurité
    - Maintenir les politiques RLS existantes
    - Les utilisateurs peuvent mettre à jour leurs propres informations de localisation
*/

-- Ajouter les nouveaux champs à la table users
DO $$
BEGIN
  -- Ajouter la colonne ville si elle n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'ville'
  ) THEN
    ALTER TABLE users ADD COLUMN ville TEXT;
  END IF;

  -- Ajouter la colonne code_postal si elle n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'code_postal'
  ) THEN
    ALTER TABLE users ADD COLUMN code_postal TEXT;
  END IF;

  -- Ajouter la colonne pays si elle n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'pays'
  ) THEN
    ALTER TABLE users ADD COLUMN pays TEXT;
  END IF;
END $$;

-- Les politiques RLS existantes couvrent déjà ces nouveaux champs
-- car elles permettent aux utilisateurs de mettre à jour leurs propres profils