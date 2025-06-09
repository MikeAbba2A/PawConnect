/*
  # Initial schema for PawConnect

  1. Tables
    - `users` - Store user account information
    - `pets` - Store pet profiles
    - `posts` - Store posts created by pets
    - `comments` - Store comments on posts
    - `likes` - Store likes on posts
    - `follows` - Store follow relationships between users and pets

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read any profile"
  ON users
  FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON users
  FOR UPDATE
  USING (auth.uid() = id);

-- Pets table
CREATE TABLE IF NOT EXISTS pets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  species TEXT NOT NULL,
  breed TEXT,
  birth_date DATE,
  gender TEXT CHECK (gender IN ('male', 'female', 'unknown')),
  description TEXT,
  avatar_url TEXT,
  banner_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE pets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read pet profiles"
  ON pets
  FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own pets"
  ON pets
  FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own pets"
  ON pets
  FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own pets"
  ON pets
  FOR DELETE
  USING (auth.uid() = owner_id);

-- Posts table
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID NOT NULL REFERENCES pets(id),
  content TEXT,
  image_urls TEXT[],
  video_url TEXT,
  location TEXT,
  post_type TEXT CHECK (post_type IN ('standard', 'story')) DEFAULT 'standard',
  created_at TIMESTAMPTZ DEFAULT now(),
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0
);

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read posts"
  ON posts
  FOR SELECT
  USING (true);

CREATE POLICY "Users can insert posts for their pets"
  ON posts
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM pets
      WHERE pets.id = pet_id
      AND pets.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own posts"
  ON posts
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM pets
      WHERE pets.id = pet_id
      AND pets.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own posts"
  ON posts
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM pets
      WHERE pets.id = pet_id
      AND pets.owner_id = auth.uid()
    )
  );

-- Comments table
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id),
  user_id UUID NOT NULL REFERENCES users(id),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read comments"
  ON comments
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert comments"
  ON comments
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments"
  ON comments
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
  ON comments
  FOR DELETE
  USING (auth.uid() = user_id);

-- Likes table
CREATE TABLE IF NOT EXISTS likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id),
  user_id UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(post_id, user_id)
);

ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read likes"
  ON likes
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert likes"
  ON likes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own likes"
  ON likes
  FOR DELETE
  USING (auth.uid() = user_id);

-- Follows table
CREATE TABLE IF NOT EXISTS follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES users(id),
  followed_pet_id UUID NOT NULL REFERENCES pets(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(follower_id, followed_pet_id)
);

ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read follows"
  ON follows
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert follows"
  ON follows
  FOR INSERT
  WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can delete their own follows"
  ON follows
  FOR DELETE
  USING (auth.uid() = follower_id);

-- Create functions for counter updates

-- Function to update post likes count
CREATE OR REPLACE FUNCTION update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET likes_count = likes_count - 1 WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to update post comments count
CREATE OR REPLACE FUNCTION update_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET comments_count = comments_count - 1 WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER after_like_changes
AFTER INSERT OR DELETE ON likes
FOR EACH ROW EXECUTE FUNCTION update_post_likes_count();

CREATE TRIGGER after_comment_changes
AFTER INSERT OR DELETE ON comments
FOR EACH ROW EXECUTE FUNCTION update_post_comments_count();

-- Create storage buckets
INSERT INTO storage.buckets (id, name) VALUES ('avatars', 'avatars')
ON CONFLICT DO NOTHING;

INSERT INTO storage.buckets (id, name) VALUES ('pet-images', 'pet-images')
ON CONFLICT DO NOTHING;

INSERT INTO storage.buckets (id, name) VALUES ('post-images', 'post-images')
ON CONFLICT DO NOTHING;

-- Set up storage permissions
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Pet images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'pet-images');

CREATE POLICY "Post images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'post-images');

CREATE POLICY "Users can upload their own avatars"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.uid() = (storage.foldername(name))[1]::uuid
);

CREATE POLICY "Users can upload their own pet images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'pet-images' AND
  auth.uid() = (storage.foldername(name))[1]::uuid
);

CREATE POLICY "Users can upload their own post images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'post-images' AND
  auth.uid() = (storage.foldername(name))[1]::uuid
);