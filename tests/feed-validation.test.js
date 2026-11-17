import { describe, expect, it } from 'vitest';
import {
  MAX_IMAGE_SIZE,
  MAX_POST_LENGTH,
  validateCommentDraft,
  validateImage,
  validatePostDraft,
} from '@/lib/feed-validation';

describe('feed draft validation', () => {
  it('requires useful post content or an image and preserves image-only updates', () => {
    expect(validatePostDraft('   ', null)).toMatch(/Write an update/);
    expect(validatePostDraft('   ', { name: 'image.png' })).toBeNull();
    expect(validatePostDraft('x'.repeat(MAX_POST_LENGTH + 1), null)).toMatch(/3,000/);
  });

  it('limits comments and only accepts public image types within the size cap', () => {
    expect(validateCommentDraft('')).toMatch(/Write a comment/);
    expect(validateCommentDraft('x'.repeat(1001))).toMatch(/1,000/);
    expect(validateImage({ type: 'image/svg+xml', size: 1 })).toMatch(/JPEG/);
    expect(validateImage({ type: 'image/png', size: MAX_IMAGE_SIZE + 1 })).toMatch(/5 MB/);
    expect(validateImage({ type: 'image/webp', size: MAX_IMAGE_SIZE })).toBeNull();
  });
});
