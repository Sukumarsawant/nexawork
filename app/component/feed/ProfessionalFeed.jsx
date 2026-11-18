'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { RefreshCw } from 'lucide-react';
import { useAuth } from '@/component/AuthProvider';
import { getSupabase } from '@/lib/supabaseClient';
import { createComment, createCommunityImageCandidate, createMutationId, createPost, fetchCommentPage, fetchFeedPage, fetchPostById, fetchPostLikeCount, removeCommunityImage, setPostLike, uploadCommunityImage } from '@/lib/feed';
import FeedAvatar from './FeedAvatar';
import FeedState from './FeedState';
import PostCard from './PostCard';
import PostComposer from './PostComposer';

function uniqueById(items) {
  return items.filter((item, index, all) => all.findIndex((candidate) => candidate.id === item.id) === index);
}

function withCommentState(post) {
  return {
    ...post,
    comments: post.comments || [],
    commentsFetched: Boolean(post.commentsFetched),
    commentsLoading: false,
    commentsLoadingMore: false,
    commentsError: null,
    commentsNextCursor: post.commentsNextCursor || null,
  };
}

function profileAuthor(profile) {
  if (!profile) return null;
  return {
    id: profile.id,
    name: profile.name || profile.full_name || null,
    username: profile.username || null,
    profile_image_url: profile.profile_image_url || null,
  };
}

function payloadKey(content, image) { return `${content.trim()}|${image ? `${image.name}|${image.type}|${image.size}` : ''}`; }
function orderComments(comments) { return uniqueById(comments).sort((a, b) => new Date(a.created_at) - new Date(b.created_at)); }

export default function ProfessionalFeed({ heading = 'Your professional feed', description = 'Share progress, ask thoughtful questions, and learn from fellow students.' }) {
  const { user, profile, status } = useAuth();
  const client = getSupabase();
  const [posts, setPosts] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [refreshError, setRefreshError] = useState(null);
  const [appendError, setAppendError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [retainedUpload, setRetainedUpload] = useState(null);
  const postsRef = useRef([]);
  const postMutation = useRef(null);
  const publishInFlight = useRef(false);
  const commentMutations = useRef(new Map());

  useEffect(() => {
    postsRef.current = posts;
  }, [posts]);

  const loadInitial = useCallback(async () => {
    if (status !== 'authenticated' || !user || !client) return;
    const hasLoadedPosts = postsRef.current.length > 0;
    setLoading(true);
    if (!hasLoadedPosts) setError(null);
    setRefreshError(null);
    try {
      const page = await fetchFeedPage(client);
      setPosts(uniqueById(page.items).map(withCommentState));
      setNextCursor(page.next_cursor);
    } catch (loadError) {
      const message = loadError.message || 'Unable to load the community feed.';
      if (hasLoadedPosts) setRefreshError(message);
      else setError(message);
    } finally {
      setLoading(false);
    }
  }, [client, status, user]);

  useEffect(() => {
    setPosts([]);
    postsRef.current = [];
    setNextCursor(null);
    setError(null);
    setRefreshError(null);
    if (status === 'authenticated') void loadInitial();
    else setLoading(false);
  }, [loadInitial, status, user?.id]);

  const updatePost = (postId, updater) => {
    setPosts((current) => current.map((post) => post.id === postId ? updater(post) : post));
  };

  const loadMore = async () => {
    if (!nextCursor || loadingMore || !client) return;
    setLoadingMore(true);
    setAppendError(null);
    try {
      const page = await fetchFeedPage(client, nextCursor);
      setPosts((current) => uniqueById([...current, ...page.items.map(withCommentState)]));
      setNextCursor(page.next_cursor);
    } catch (loadError) {
      setAppendError(loadError.message || 'Unable to load more updates.');
    } finally {
      setLoadingMore(false);
    }
  };

  const publishPost = async ({ content, image }) => {
    if (!user || !client) return { error: 'Sign in to share an update.' };
    if (publishInFlight.current) return { error: 'Your update is already being checked. Please wait.' };
    publishInFlight.current = true;
    setSubmitting(true);
    try {
      const nextPayloadKey = payloadKey(content, image);
      const earlier = postMutation.current;
      if (earlier && earlier.payloadKey !== nextPayloadKey) {
        try {
          const saved = await fetchPostById(client, earlier.id);
          if (saved) {
            setPosts((current) => uniqueById([{ ...withCommentState(saved), author: profileAuthor(profile) }, ...current]));
            postMutation.current = null;
            return { error: 'Your earlier update was published. Your edited draft is still here; post it again to create a new update.' };
          }
        } catch {
          return { error: 'We could not confirm your earlier update. Its attachment was retained.' };
        }
        postMutation.current = null;
        if (earlier.upload) {
          setRetainedUpload(earlier.upload);
          return { error: 'The earlier update was not published, but its image needs cleanup. Retry cleanup before posting this edited draft.' };
        }
      }
      const mutation = postMutation.current || { id: createMutationId(), payloadKey: nextPayloadKey, upload: null };
      postMutation.current = mutation;
      try {
        if (image && !mutation.upload) mutation.upload = createCommunityImageCandidate(user.id, image, mutation.id);
        if (image && !mutation.upload.confirmed) mutation.upload = await uploadCommunityImage(client, image, mutation.upload);
        const savedPost = await createPost(client, { id: mutation.id, userId: user.id, content, imagePath: mutation.upload?.path, imageUrl: mutation.upload?.publicUrl });
        setPosts((current) => uniqueById([{ ...withCommentState(savedPost), image_public_url: mutation.upload?.publicUrl || null, author: profileAuthor(profile) }, ...current]));
        postMutation.current = null;
        return {};
      } catch (publishError) {
        return { error: publishError.message || 'Unable to publish your update. Your draft is still here.' };
      }
    } finally {
      setSubmitting(false);
      publishInFlight.current = false;
    }
  };

  const cleanupUpload = async (upload) => {
    if (!upload || !client) return {};
    setRetainedUpload(upload);
    try {
      await removeCommunityImage(client, upload.path);
      setRetainedUpload((current) => current?.path === upload.path ? null : current);
      return {};
    } catch (cleanupError) {
      return { error: cleanupError.message || 'The uploaded image could not be removed. Retry cleanup before posting again.' };
    }
  };

  const abandonUpload = async () => {
    const mutation = postMutation.current;
    const upload = mutation?.upload;
    if (mutation && client) {
      try {
        const saved = await fetchPostById(client, mutation.id);
        if (saved) {
          setPosts((current) => uniqueById([{ ...withCommentState(saved), author: profileAuthor(profile) }, ...current]));
          return { error: 'This update was published, so its attachment was retained.' };
        }
      } catch {
        return { error: 'We could not confirm whether this update was published. Its attachment was retained.' };
      }
    }
    // Detach first: a subsequent text-only submission cannot reuse this object.
    postMutation.current = null;
    return cleanupUpload(upload);
  };

  const toggleLike = async (post) => {
    if (!user || !client) return { error: 'Sign in to like updates.' };
    const nextLiked = !post.viewer_has_liked;
    try {
      const result = await setPostLike(client, { postId: post.id, liked: nextLiked });
      const likesCount = Number.isFinite(result?.like_count)
        ? result.like_count
        : await fetchPostLikeCount(client, post.id);
      updatePost(post.id, (current) => ({
        ...current,
        viewer_has_liked: result?.liked ?? nextLiked,
        likes_count: likesCount,
      }));
      return {};
    } catch (likeError) {
      return { error: likeError.message || 'Unable to update this like.' };
    }
  };

  const loadComments = async (postId, more = false) => {
    if (!client) return;
    const target = posts.find((post) => post.id === postId);
    if (!target || (more && !target.commentsNextCursor)) return;
    updatePost(postId, (post) => ({ ...post, commentsLoading: !more, commentsLoadingMore: more, commentsError: null }));
    try {
      const page = await fetchCommentPage(client, postId, more ? target.commentsNextCursor : null);
      updatePost(postId, (post) => ({ ...post, comments: orderComments(more ? [...post.comments, ...page.items] : [...page.items, ...post.comments]), commentsFetched: true, commentsNextCursor: page.next_cursor }));
    } catch (commentError) {
      updatePost(postId, (post) => ({ ...post, commentsError: commentError.message || 'Unable to load comments.' }));
    } finally {
      updatePost(postId, (post) => ({ ...post, commentsLoading: false, commentsLoadingMore: false }));
    }
  };

  const addComment = async (postId, content) => {
    if (!user || !client) return { error: 'Sign in to comment.' };
    const previous = commentMutations.current.get(postId);
    const mutation = previous?.content === content ? previous : { id: createMutationId(), content };
    commentMutations.current.set(postId, mutation);
    try {
      const savedComment = await createComment(client, { id: mutation.id, postId, userId: user.id, content });
      updatePost(postId, (post) => ({ ...post, comments: orderComments([...post.comments, { ...savedComment, author: profileAuthor(profile) }]), comments_count: (post.comments_count || 0) + (post.comments.some((item) => item.id === savedComment.id) ? 0 : 1) }));
      commentMutations.current.delete(postId);
      return {};
    } catch (commentError) {
      return { error: commentError.message || 'Unable to add your comment. Your draft is still here.' };
    }
  };

  const author = profileAuthor(profile);
  if (status === 'loading') return <div className="nx-feed"><FeedState type="loading" title="Loading your feed" detail="Preparing your community updates." /></div>;
  if (status === 'unconfigured') return <div className="nx-feed"><FeedState type="error" title="Community is unavailable" detail="The database has not been configured for this environment." /></div>;
  if (status !== 'authenticated' || !user) return <div className="nx-feed"><FeedState type="error" title="Sign in to view the community" detail="Your account is required before community updates can load." /></div>;

  return (
    <div className="nx-feed">
      <section className="feed-page-heading">
        <div><h1>{heading}</h1><p>{description}</p></div>
        <button type="button" className="feed-button feed-button--secondary" onClick={loadInitial} disabled={loading}>
          <RefreshCw className={loading ? 'feed-spinner' : ''} size={18} aria-hidden="true" /> Refresh
        </button>
      </section>
      <div className="feed-layout">
        <aside className="feed-profile-rail">
          <Link href="/student/profile" className="feed-profile-card">
            <FeedAvatar author={author} size="large" />
            <div><h2>{author?.name || 'Your profile'}</h2>{author?.username && <p>@{author.username}</p>}<span>View profile</span></div>
          </Link>
        </aside>
        <main className="feed-main">
          <PostComposer author={author} disabled={!client || Boolean(retainedUpload)} isSubmitting={submitting} onSubmit={publishPost} onImageRemoved={abandonUpload} />
          {retainedUpload && <p className="feed-alert feed-alert--error" role="alert">An uploaded image still needs cleanup. <button type="button" className="feed-button feed-button--text" onClick={() => cleanupUpload(retainedUpload)}>Retry image cleanup</button></p>}
          {postMutation.current?.upload && !submitting && !retainedUpload && <button type="button" className="feed-button feed-button--text" onClick={abandonUpload}>Remove uncertain image upload</button>}
          {loading && posts.length === 0 ? <FeedState type="loading" title="Loading updates" detail="Retrieving the latest community posts." /> : error && posts.length === 0 ? <FeedState type="error" title="Updates could not load" detail={error} onRetry={loadInitial} /> : posts.length === 0 ? <FeedState type="empty" title="Start the conversation" detail="Share the first update with the student community." /> : (
            <div className="feed-list">{posts.map((post) => <PostCard key={post.id} post={post} currentAuthor={author} onLike={toggleLike} onLoadComments={(postId) => loadComments(postId)} onLoadMoreComments={(postId) => loadComments(postId, true)} onCreateComment={addComment} />)}</div>
          )}
          {refreshError && <p className="feed-alert feed-alert--error" role="alert">{refreshError} <button type="button" className="feed-button feed-button--text" onClick={loadInitial}>Retry refresh</button></p>}
          {appendError && <p className="feed-alert feed-alert--error" role="alert">{appendError}</p>}
          {nextCursor && !error && <button type="button" className="feed-button feed-button--secondary feed-load-more" onClick={loadMore} disabled={loadingMore}>{loadingMore ? 'Loading more…' : 'Load more updates'}</button>}
          {!nextCursor && posts.length > 0 && <p className="feed-end">You’re all caught up.</p>}
        </main>
      </div>
    </div>
  );
}
