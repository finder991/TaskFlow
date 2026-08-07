import { useState } from 'react';
import type { Comment } from '@/entities/comment';
import { Button, ConfirmDialog, Textarea } from '@/shared/ui';
import { useDeleteComment, useUpdateComment } from '../model/useCommentMutations';

export function CommentActions({
  comment,
  onStartEdit,
}: {
  comment: Comment;
  onStartEdit: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const deleteComment = useDeleteComment(comment.taskId);

  return (
    <>
      <button
        type="button"
        onClick={onStartEdit}
        className="text-xs text-slate-400 transition-colors hover:text-slate-700"
      >
        редагувати
      </button>
      <button
        type="button"
        disabled={deleteComment.isPending}
        onClick={() => setConfirming(true)}
        className="text-xs text-slate-400 transition-colors hover:text-red-600 disabled:opacity-50"
      >
        видалити
      </button>

      <ConfirmDialog
        open={confirming}
        title="Видалити коментар?"
        isLoading={deleteComment.isPending}
        onCancel={() => setConfirming(false)}
        onConfirm={() =>
          deleteComment.mutate(comment.id, { onSuccess: () => setConfirming(false) })
        }
      />
    </>
  );
}

export function CommentEditor({
  comment,
  onDone,
}: {
  comment: Comment;
  onDone: () => void;
}) {
  const [body, setBody] = useState(comment.body);
  const updateComment = useUpdateComment(comment.taskId);
  const trimmed = body.trim();

  const save = () => {
    if (!trimmed || trimmed === comment.body) return onDone();
    updateComment.mutate({ id: comment.id, body: trimmed }, { onSuccess: onDone });
  };

  return (
    <div className="space-y-2">
      <Textarea
        rows={2}
        value={body}
        autoFocus
        aria-label="Редагування коментаря"
        onChange={(e) => setBody(e.target.value)}
      />
      <div className="flex gap-2">
        <Button size="sm" onClick={save} isLoading={updateComment.isPending} disabled={!trimmed}>
          Зберегти
        </Button>
        <Button size="sm" variant="ghost" onClick={onDone}>
          Скасувати
        </Button>
      </div>
    </div>
  );
}
