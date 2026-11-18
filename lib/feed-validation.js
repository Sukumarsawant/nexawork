export const MAX_POST_LENGTH = 3000;
export const MAX_COMMENT_LENGTH = 1000;
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
export const IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
]);

export function validatePostDraft(content, image) {
  const trimmedContent = content.trim();

  if (!trimmedContent && !image) {
    return 'Write an update or attach an image before posting.';
  }

  if (trimmedContent.length > MAX_POST_LENGTH) {
    return `Updates can be up to ${MAX_POST_LENGTH.toLocaleString()} characters.`;
  }

  return null;
}

export function validateCommentDraft(content) {
  const trimmedContent = content.trim();

  if (!trimmedContent) return 'Write a comment before posting.';
  if (trimmedContent.length > MAX_COMMENT_LENGTH) {
    return `Comments can be up to ${MAX_COMMENT_LENGTH.toLocaleString()} characters.`;
  }

  return null;
}

export function validateImage(file) {
  if (!file) return null;
  if (!IMAGE_TYPES.has(file.type)) {
    return 'Choose a JPEG, PNG, GIF, or WebP image.';
  }
  if (file.size > MAX_IMAGE_SIZE) {
    return 'Images must be 5 MB or smaller.';
  }

  return null;
}

export function extensionForImage(file) {
  const extensions = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
  };

  return extensions[file.type];
}
