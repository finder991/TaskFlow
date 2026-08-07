import { useState } from 'react';
import { Button, FormError, Textarea } from '@/shared/ui';
import { useCreateComment } from '../model/useCommentMutations';

export function CommentComposer({ taskId }: { taskId: string }) {
  const [body, setBody] = useState('');
  const createComment = useCreateComment(taskId);
  const trimmed = body.trim();

  const submit = () => {
    if (!trimmed) return;
    createComment.mutate(trimmed, { onSuccess: () => setBody('') });
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Textarea
          rows={2}
          value={body}
          aria-label="Новий коментар"
          placeholder="Написати коментар…"
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') submit();
          }}
        />
        <Button onClick={submit} isLoading={createComment.isPending} disabled={!trimmed}>
          Додати
        </Button>
      </div>
      {createComment.isError && <FormError error={createComment.error} />}
    </div>
  );
}
