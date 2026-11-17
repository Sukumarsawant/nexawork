import { describe, expect, it, vi } from 'vitest';
import { FEED_REQUEST_TIMEOUT_MS, setPostLike, withFeedTimeout } from '@/lib/feed';

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
});
