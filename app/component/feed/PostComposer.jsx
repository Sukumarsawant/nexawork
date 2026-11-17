'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { ImagePlus, LoaderCircle, Send, X } from 'lucide-react';
import FeedAvatar from './FeedAvatar';
import { MAX_POST_LENGTH, validateImage, validatePostDraft } from '@/lib/feed-validation';

export default function PostComposer({ author, disabled, isSubmitting, onSubmit, onImageRemoved }) {
  const inputId = useId();
  const [content, setContent] = useState('');
  const [image, setImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [error, setError] = useState(null);
  const fileInput = useRef(null);

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const clearImage = async () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setImage(null);
    if (fileInput.current) fileInput.current.value = '';
    const result = await onImageRemoved?.();
    if (result?.error) {
      setError(result.error);
      return false;
    }
    return true;
  };

  const handleImageChange = async (event) => {
    const nextImage = event.target.files?.[0];
    if (!nextImage) return;
    const validationError = validateImage(nextImage);
    if (validationError) {
      setError(validationError);
      event.target.value = '';
      return;
    }

    const wasCleared = await clearImage();
    if (!wasCleared) return;
    setImage(nextImage);
    setPreviewUrl(URL.createObjectURL(nextImage));
    setError(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationError = validatePostDraft(content, image);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    const result = await onSubmit({ content, image });
    if (result?.error) {
      setError(result.error);
      return;
    }

    setContent('');
    await clearImage();
  };

  const submitDisabled = disabled || isSubmitting || (!content.trim() && !image);

  return (
    <section className="feed-card feed-composer" aria-labelledby="share-update-title">
      <div className="feed-composer__header">
        <FeedAvatar author={author} size="small" />
        <div>
          <h2 id="share-update-title">Share an update</h2>
          <p>Post a professional update for the student community.</p>
        </div>
      </div>
      <form onSubmit={handleSubmit} noValidate>
        <label className="feed-sr-only" htmlFor={inputId}>What would you like to share?</label>
        <textarea
          id={inputId}
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="What would you like to share?"
          maxLength={MAX_POST_LENGTH}
          disabled={disabled || isSubmitting}
          className="feed-textarea"
          rows={4}
        />
        <div className="feed-composer__meta">
          <span>{content.length.toLocaleString()} / {MAX_POST_LENGTH.toLocaleString()}</span>
          <span>Images are public and limited to 5 MB.</span>
        </div>

        {previewUrl && (
          <div className="feed-image-preview">
            <img src={previewUrl} alt="Selected image preview" />
            <button type="button" className="feed-icon-button" onClick={clearImage} disabled={isSubmitting} aria-label="Remove selected image">
              <X size={18} aria-hidden="true" />
            </button>
          </div>
        )}

        {error && <p className="feed-alert feed-alert--error" role="alert">{error}</p>}
        <div className="feed-composer__actions">
          <input
            ref={fileInput}
            id={`${inputId}-image`}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            className="feed-sr-only"
            onChange={handleImageChange}
            disabled={disabled || isSubmitting}
          />
          <label htmlFor={`${inputId}-image`} className={`feed-button feed-button--secondary ${disabled || isSubmitting ? 'feed-button--disabled' : ''}`}>
            <ImagePlus size={18} aria-hidden="true" />
            Add image
          </label>
          <button type="submit" className="feed-button feed-button--primary" disabled={submitDisabled}>
            {isSubmitting ? <LoaderCircle className="feed-spinner" size={18} aria-hidden="true" /> : <Send size={18} aria-hidden="true" />}
            {isSubmitting ? 'Posting…' : 'Post'}
          </button>
        </div>
      </form>
    </section>
  );
}
