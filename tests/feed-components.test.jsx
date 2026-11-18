import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, test, vi } from 'vitest';
import PostComposer from '@/component/feed/PostComposer';
import CommentThread from '@/component/feed/CommentThread';
import PostCard from '@/component/feed/PostCard';

const author = { name: 'Test Student', username: 'teststudent' };

test('composer retains a failed text draft and reports the save failure', async () => {
  const user = userEvent.setup();
  const onSubmit = vi.fn().mockResolvedValue({ error: 'Connection lost. Try again.' });
  render(<PostComposer author={author} onSubmit={onSubmit} />);

  const field = screen.getByLabelText('What would you like to share?');
  await user.type(field, 'A real update that should remain after a failed save.');
  await user.click(screen.getByRole('button', { name: 'Post' }));

  expect(onSubmit).toHaveBeenCalledWith({ content: 'A real update that should remain after a failed save.', image: null });
  expect(screen.getByRole('alert')).toHaveTextContent('Connection lost. Try again.');
  expect(field).toHaveValue('A real update that should remain after a failed save.');
});

test('comment thread keeps a failed draft and exposes the accessible submit control', async () => {
  const user = userEvent.setup();
  const onSubmit = vi.fn().mockResolvedValue({ error: 'Comment was not saved.' });
  render(
    <CommentThread
      comments={[]}
      author={author}
      hasMore={false}
      loading={false}
      loadingMore={false}
      error={null}
      onLoad={vi.fn()}
      onLoadMore={vi.fn()}
      onSubmit={onSubmit}
    />,
  );

  const field = screen.getByLabelText('Add a comment');
  await user.type(field, 'This comment should be retained.');
  await user.click(screen.getByRole('button', { name: 'Comment' }));

  expect(onSubmit).toHaveBeenCalledWith('This comment should be retained.');
  expect(screen.getByRole('alert')).toHaveTextContent('Comment was not saved.');
  expect(field).toHaveValue('This comment should be retained.');
});

test('post card reports a failed attachment instead of silently hiding it', () => {
  render(
    <PostCard
      post={{
        id: 'post-1',
        content: 'A post with an unavailable image.',
        image_url: 'https://example.test/missing.png',
        author,
        created_at: new Date().toISOString(),
        likes_count: 0,
        comments_count: 0,
      }}
      currentAuthor={author}
      onLike={vi.fn()}
      onLoadComments={vi.fn()}
      onLoadMoreComments={vi.fn()}
      onCreateComment={vi.fn()}
    />,
  );

  fireEvent.error(screen.getByAltText('Attachment shared with this community update'));
  expect(screen.getByRole('status')).toHaveTextContent('Image unavailable');
});

test('failed first-page comments remain retryable after a local comment exists', () => {
  const onLoad = vi.fn();
  render(<CommentThread comments={[{ id: 'local', content: 'My local comment', created_at: new Date().toISOString(), author }]} author={author} hasMore={false} loading={false} loadingMore={false} error="Comments timed out." onLoad={onLoad} onLoadMore={vi.fn()} onSubmit={vi.fn()} />);
  fireEvent.click(screen.getByRole('button', { name: 'Retry comments' }));
  expect(onLoad).toHaveBeenCalledOnce();
});
