'use client';

export default function FeedAvatar({ author, size = 'default' }) {
  const name = author?.name || author?.full_name || 'Community member';
  const imageUrl = author?.profile_image_url;
  const initial = name.trim().charAt(0).toUpperCase() || '?';

  return (
    <div className={`feed-avatar feed-avatar--${size}`} aria-hidden="true">
      {imageUrl ? (
        <img src={imageUrl} alt="" className="feed-avatar__image" />
      ) : (
        <span>{initial}</span>
      )}
    </div>
  );
}
