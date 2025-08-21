# Database Setup Guide

## Storage Buckets

This project uses two separate Supabase storage buckets for different purposes:

### 1. `profile-images` Bucket
- **Purpose**: Store user profile pictures
- **File Structure**: `{user_id}_{timestamp}.{extension}`
- **Example**: `123e4567-e89b-12d3-a456-426614174000_1703123456789.jpg`
- **Used by**: ProfileComponent.jsx

### 2. `community-images` Bucket
- **Purpose**: Store community post images
- **File Structure**: `{user_id}_{timestamp}.{extension}`
- **Example**: `123e4567-e89b-12d3-a456-426614174000_1703123456789.png`
- **Used by**: Community page

## Setup Instructions

### 1. Run Storage Setup Script
Execute the `storage_setup.sql` script in your Supabase SQL Editor:

```sql
-- This will create the community-images bucket and set up proper policies
-- Run the entire storage_setup.sql file
```

### 2. Verify Bucket Creation
In your Supabase Dashboard:
1. Go to Storage
2. Verify both buckets exist:
   - `profile-images` (should already exist)
   - `community-images` (newly created)

### 3. Check Bucket Policies
Both buckets should have the following policies:
- **INSERT**: Authenticated users can upload
- **SELECT**: Public can view
- **UPDATE**: Users can update their own files
- **DELETE**: Users can delete their own files

## File Naming Convention

### Profile Images
```
{user_id}_{timestamp}.{extension}
```

### Community Images
```
{user_id}_{timestamp}.{extension}
```

## Security

- Both buckets are public for viewing
- Only authenticated users can upload
- Users can only modify/delete their own files
- File size limit: 5MB
- Supported formats: JPG, PNG, GIF, WebP

## Troubleshooting

### Image Upload Fails
1. Check if buckets exist in Supabase Storage
2. Verify bucket policies are set correctly
3. Check browser console for detailed error messages
4. Ensure file size is under 5MB
5. Verify file type is supported

### Images Not Displaying
1. Check if bucket is set to public
2. Verify the image URL in the database
3. Check browser network tab for 403/404 errors
4. Ensure storage policies allow public viewing

## Code Usage

### Uploading Profile Images
```javascript
const { data, error } = await supabase.storage
  .from("profile-images")
  .upload(fileName, file);
```

### Uploading Community Images
```javascript
const { data, error } = await supabase.storage
  .from("community-images")
  .upload(fileName, file);
```

### Getting Public URL
```javascript
const { data: { publicUrl } } = supabase.storage
  .from("bucket-name")
  .getPublicUrl(fileName);
```
