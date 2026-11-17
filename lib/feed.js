import {
  extensionForImage,
  validateCommentDraft,
  validateImage,
  validatePostDraft,
} from './feed-validation';

export const FEED_PAGE_SIZE = 20;
export const COMMENT_PAGE_SIZE = 20;
export const FEED_REQUEST_TIMEOUT_MS = 12000;

function requireClient(client) {
  if (!client) throw new Error('Community is unavailable because Supabase is not configured.');
  return client;
}

function throwIfError(error, fallbackMessage) {
  if (error) throw new Error(error.message || fallbackMessage);
}

export async function withFeedTimeout(operation, fallbackMessage) {
  const controller = new AbortController();
  let timeout;
  const timedOut = new Promise((_, reject) => {
    timeout = setTimeout(() => {
      controller.abort();
      reject(new Error(`${fallbackMessage} Please try again.`));
    }, FEED_REQUEST_TIMEOUT_MS);
  });

  try {
    return await Promise.race([operation(controller.signal), timedOut]);
  } finally {
    clearTimeout(timeout);
  }
}

function normalizePage(data) {
  const page = Array.isArray(data) ? data[0] : data;
  if (!page) return { items: [], next_cursor: null };
  return {
    ...page,
    items: (page.items || []).map((item) => ({
      ...item,
      likes_count: item.likes_count ?? item.like_count ?? 0,
      comments_count: item.comments_count ?? item.comment_count ?? 0,
      viewer_has_liked: item.viewer_has_liked ?? item.liked_by_me ?? false,
    })),
    next_cursor: page.next_cursor || null,
  };
}

export function createMutationId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export async function fetchFeedPage(client, cursor = null) {
  const supabase = requireClient(client);
  const { data, error } = await withFeedTimeout(
    (signal) => supabase.rpc('feed_page', {
      before_created_at: cursor?.created_at || null,
      before_id: cursor?.id || null,
      page_size: FEED_PAGE_SIZE,
    }).abortSignal(signal),
    'Loading updates timed out.',
  );

  throwIfError(error, 'Unable to load the community feed.');
  return normalizePage(data);
}

export async function fetchCommentPage(client, postId, cursor = null) {
  const supabase = requireClient(client);
  const { data, error } = await withFeedTimeout(
    (signal) => supabase.rpc('comment_page', {
      post_id: postId,
      after_created_at: cursor?.created_at || null,
      after_id: cursor?.id || null,
      page_size: COMMENT_PAGE_SIZE,
    }).abortSignal(signal),
    'Loading comments timed out.',
  );

  throwIfError(error, 'Unable to load comments.');
  return normalizePage(data);
}

export async function uploadCommunityImage(client, userId, image, uploadId = createMutationId()) {
  const supabase = requireClient(client);
  const validationError = validateImage(image);
  if (validationError) throw new Error(validationError);

  const path = `${userId}/${uploadId}.${extensionForImage(image)}`;
  const { error } = await withFeedTimeout(
    () => supabase.storage.from('community-images').upload(path, image, {
      cacheControl: '3600',
      contentType: image.type,
      upsert: false,
    }),
    'Uploading the image timed out.',
  );
  throwIfError(error, 'Unable to upload this image.');

  const { data } = supabase.storage.from('community-images').getPublicUrl(path);
  return { path, publicUrl: data?.publicUrl || null };
}

export async function removeCommunityImage(client, path) {
  if (!client || !path) return;
  const { error } = await withFeedTimeout(
    () => client.storage.from('community-images').remove([path]),
    'Removing the uploaded image timed out.',
  );
  throwIfError(error, 'Unable to remove the uploaded image.');
}

export async function createPost(client, { id, userId, content, imagePath, imageUrl }) {
  const validationError = validatePostDraft(content, imagePath);
  if (validationError) throw new Error(validationError);

  const supabase = requireClient(client);
  const { data, error } = await withFeedTimeout(
    (signal) => supabase
      .from('community_posts')
      .insert({
        id,
        user_id: userId,
        content: content.trim(),
        image_path: imagePath || null,
        image_url: imageUrl || null,
      })
      .select('id, user_id, content, image_path, image_url, created_at')
      .single()
      .abortSignal(signal),
    'Publishing the update timed out.',
  );

  if (error?.code === '23505') {
    const existing = await withFeedTimeout(
      (signal) => supabase
        .from('community_posts')
        .select('id, user_id, content, image_path, image_url, created_at')
        .eq('id', id)
        .maybeSingle()
        .abortSignal(signal),
      'Confirming the published update timed out.',
    );
    if (!existing.error && existing.data) return existing.data;
  }
  throwIfError(error, 'Unable to publish your update.');
  return data;
}

export async function setPostLike(client, { postId, liked }) {
  const supabase = requireClient(client);
  const { data, error } = await withFeedTimeout(
    (signal) => supabase
      .rpc(liked ? 'like_post' : 'unlike_post', { p_post_id: postId })
      .abortSignal(signal),
    'Saving the like timed out.',
  );
  throwIfError(error, 'Unable to remove your like.');
  return data || { post_id: postId, liked };
}

export async function fetchPostLikeCount(client, postId) {
  const supabase = requireClient(client);
  const { count, error } = await withFeedTimeout(
    (signal) => supabase
      .from('community_post_likes')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', postId)
      .abortSignal(signal),
    'Refreshing the like count timed out.',
  );
  throwIfError(error, 'Unable to refresh the like count.');
  return count || 0;
}

export async function createComment(client, { id, postId, userId, content }) {
  const validationError = validateCommentDraft(content);
  if (validationError) throw new Error(validationError);

  const supabase = requireClient(client);
  const { data, error } = await withFeedTimeout(
    (signal) => supabase
      .from('community_post_comments')
      .insert({ id, post_id: postId, user_id: userId, content: content.trim() })
      .select('id, post_id, user_id, content, created_at')
      .single()
      .abortSignal(signal),
    'Saving the comment timed out.',
  );

  if (error?.code === '23505') {
    const existing = await withFeedTimeout(
      (signal) => supabase
        .from('community_post_comments')
        .select('id, post_id, user_id, content, created_at')
        .eq('id', id)
        .maybeSingle()
        .abortSignal(signal),
      'Confirming the saved comment timed out.',
    );
    if (!existing.error && existing.data) return existing.data;
  }
  throwIfError(error, 'Unable to add your comment.');
  return data;
}
