-- Storage Bucket Setup for Community Images
-- Run this in your Supabase SQL Editor

-- Create a dedicated bucket for community images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('community-images', 'community-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for the community-images bucket
-- Allow authenticated users to upload images
CREATE POLICY "Allow authenticated users to upload community images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'community-images' 
  AND auth.role() = 'authenticated'
);

-- Allow public to view community images
CREATE POLICY "Allow public to view community images" ON storage.objects
FOR SELECT USING (
  bucket_id = 'community-images'
);

-- Allow users to update their own community images
CREATE POLICY "Allow users to update own community images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'community-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own community images
CREATE POLICY "Allow users to delete own community images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'community-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Make sure profile-images bucket is also public (for profile images)
UPDATE storage.buckets SET public = true WHERE id = 'profile-images';

-- Create storage policies for the profile-images bucket (for profile images only)
-- Allow authenticated users to upload profile images
CREATE POLICY "Allow authenticated users to upload profile images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'profile-images' 
  AND auth.role() = 'authenticated'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow public to view profile images
CREATE POLICY "Allow public to view profile images" ON storage.objects
FOR SELECT USING (
  bucket_id = 'profile-images'
);

-- Allow users to update their own profile images
CREATE POLICY "Allow users to update own profile images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'profile-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own profile images
CREATE POLICY "Allow users to delete own profile images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'profile-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
