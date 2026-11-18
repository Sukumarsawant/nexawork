import { describe, expect, it, vi } from 'vitest';
import { createCommunityImageCandidate, createPost, FEED_REQUEST_TIMEOUT_MS, setPostLike, uploadCommunityImage, withFeedTimeout } from '@/lib/feed';

describe('feed network bounds and authoritative likes', () => {
  it('fails a request that exceeds the feed timeout', async () => {
    vi.useFakeTimers();
    const request = withFeedTimeout(() => new Promise(() => {}), 'Loading updates timed out.');
    const rejection = expect(request).rejects.toThrow('Loading updates timed out. Please try again.');
    await vi.advanceTimersByTimeAsync(FEED_REQUEST_TIMEOUT_MS);
    await rejection;
    vi.useRealTimers();
  });

  it('uses the caller-scoped like RPC instead of calculating a local count', async () => {
    const abortSignal = vi.fn().mockResolvedValue({ data: { post_id: 'post-1', liked: true, like_count: 7 }, error: null });
    const rpc = vi.fn(() => ({ abortSignal }));
    const result = await setPostLike({ rpc }, { postId: 'post-1', liked: true });

    expect(rpc).toHaveBeenCalledWith('like_post', { p_post_id: 'post-1' });
    expect(result).toEqual({ post_id: 'post-1', liked: true, like_count: 7 });
  });

  it('retains an ambiguous upload candidate and only reconciles an exact owned storage object on retry', async () => {
    const image = { type: 'image/png', size: 256 };
    const candidate = createCommunityImageCandidate('owner-1', image, 'stable-upload-id');
    const firstBucket = { upload: vi.fn().mockRejectedValue(new Error('Uploading the image timed out. Please try again.')) };
    const firstClient = { storage: { from: vi.fn(() => firstBucket) } };

    await expect(uploadCommunityImage(firstClient, image, candidate)).rejects.toThrow('timed out');
    expect(candidate).toEqual({ path: 'owner-1/stable-upload-id.png', contentType: 'image/png', size: 256 });

    const retryBucket = {
      upload: vi.fn().mockResolvedValue({ error: { statusCode: '409', message: 'The resource already exists' } }),
      list: vi.fn().mockResolvedValue({
        data: [{ name: 'stable-upload-id.png', metadata: { size: 256, mimetype: 'image/png' } }],
        error: null,
      }),
      getPublicUrl: vi.fn(() => ({ data: { publicUrl: 'https://images.test/owner-1/stable-upload-id.png' } })),
    };
    const retryClient = { storage: { from: vi.fn(() => retryBucket) } };

    await expect(uploadCommunityImage(retryClient, image, candidate)).resolves.toEqual({
      ...candidate,
      publicUrl: 'https://images.test/owner-1/stable-upload-id.png',
      confirmed: true,
    });
    expect(retryBucket.list).toHaveBeenCalledWith('owner-1', { limit: 100, search: 'stable-upload-id.png' });
  });

  it('reconciles a post committed before its create response was lost', async () => {
    const insert = { insert: vi.fn().mockReturnThis(), select: vi.fn().mockReturnThis(), single: vi.fn().mockReturnThis(), abortSignal: vi.fn().mockResolvedValue({ data: null, error: { message: 'response lost' } }) };
    const read = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), maybeSingle: vi.fn().mockReturnThis(), abortSignal: vi.fn().mockResolvedValue({ data: { id: 'stable', content: 'Original', image_path: 'owner/stable.png' }, error: null }) };
    const client = {
      from: vi.fn().mockReturnValueOnce(insert).mockReturnValueOnce(read),
      storage: { from: vi.fn(() => ({ getPublicUrl: vi.fn(() => ({ data: { publicUrl: 'https://images.test/owner/stable.png' } })) })) },
    };
    await expect(createPost(client, { id: 'stable', userId: 'owner', content: 'Original', imagePath: 'owner/stable.png' })).resolves.toMatchObject({ id: 'stable', content: 'Original', image_public_url: 'https://images.test/owner/stable.png' });
  });
});
