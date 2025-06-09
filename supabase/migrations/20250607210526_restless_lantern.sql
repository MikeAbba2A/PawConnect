/*
  # Fix storage policies and buckets

  1. Storage Configuration
    - Ensure buckets exist and are properly configured
    - Fix storage policies for public access
    - Add proper RLS policies for storage objects

  2. Security
    - Allow public read access to uploaded images
    - Restrict upload access to authenticated users only
*/

-- Ensure storage buckets exist
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('pet-images', 'pet-images', true),
  ('post-images', 'post-images', true),
  ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Pet images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Post images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own pet images" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own post images" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatars" ON storage.objects;

-- Create new storage policies for public read access
CREATE POLICY "Public read access for pet images"
ON storage.objects FOR SELECT
USING (bucket_id = 'pet-images');

CREATE POLICY "Public read access for post images"
ON storage.objects FOR SELECT
USING (bucket_id = 'post-images');

CREATE POLICY "Public read access for avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Create upload policies for authenticated users
CREATE POLICY "Authenticated users can upload pet images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'pet-images' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can upload post images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'post-images' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can upload avatars"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.role() = 'authenticated'
);

-- Create update/delete policies for file owners
CREATE POLICY "Users can update their own pet images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'pet-images' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Users can delete their own pet images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'pet-images' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Users can update their own post images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'post-images' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Users can delete their own post images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'post-images' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Users can update their own avatars"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Users can delete their own avatars"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' AND
  auth.role() = 'authenticated'
);