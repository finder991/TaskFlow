import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { CommentItem, commentApi } from '@/entities/comment';
import { useCurrentUser } from '@/entities/session';
import { CommentActions, CommentComposer, CommentEditor } from '@/features/write-comment';
import { queryKeys } from '@/shared/api';
import { Spinner } from '@/shared/ui';

export function CommentsSection({ taskId }: { taskId: string }) {
  const currentUser = useCurrentUser();
  const [editingId, setEditingId] = useState<string | null>(null);

  const comments = useQuery({
    queryKey: queryKeys.comments(taskId),
    queryFn: () => commentApi.list(taskId).then((res) => res.data),
  });

  return (
    <section>
      <h3 className="mb-2 text-sm font-semibold text-slate-700">Коментарі</h3>

      {comments.isLoading ? (
        <Spinner className="h-5 w-5 text-brand-600" />
      ) : comments.data && comments.data.length > 0 ? (
        <ul className="space-y-2">
          {comments.data.map((comment) => {
            const isAuthor = comment.author?.id === currentUser?.id;
            const isEditing = editingId === comment.id;

            return (
              <CommentItem
                key={comment.id}
                comment={comment}
                actions={
                  isAuthor && !isEditing ? (
                    <CommentActions comment={comment} onStartEdit={() => setEditingId(comment.id)} />
                  ) : null
                }
              >
                {isEditing ? (
                  <CommentEditor comment={comment} onDone={() => setEditingId(null)} />
                ) : null}
              </CommentItem>
            );
          })}
        </ul>
      ) : (
        <p className="text-sm text-slate-400">Ще немає коментарів.</p>
      )}

      <div className="mt-3">
        <CommentComposer taskId={taskId} />
      </div>
    </section>
  );
}
