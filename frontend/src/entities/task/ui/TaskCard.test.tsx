import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { Task } from '../model/types';
import { TaskCard } from './TaskCard';

const baseTask: Task = {
  id: 't1',
  projectId: 'p1',
  title: 'Полагодити баг логіну',
  description: null,
  status: 'TODO',
  priority: 'HIGH',
  assigneeId: 'u1',
  assignee: { id: 'u1', email: 'ada@example.com', name: 'Ada Lovelace' },
  createdById: 'u1',
  dueDate: null,
  position: 0,
  commentsCount: 2,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('TaskCard', () => {
  it('показує назву, пріоритет і лічильник коментарів', () => {
    render(<TaskCard task={baseTask} />);

    expect(screen.getByText('Полагодити баг логіну')).toBeInTheDocument();
    expect(screen.getByText('Високий')).toBeInTheDocument();
    expect(screen.getByText('💬 2')).toBeInTheDocument();
  });

  it("показує ім'я виконавця (без аватарів)", () => {
    render(<TaskCard task={baseTask} />);
    expect(screen.getByText('Ada Lovelace')).toBeInTheDocument();
  });

  it('показує «Без виконавця», коли виконавця немає', () => {
    render(<TaskCard task={{ ...baseTask, assignee: null, assigneeId: null }} />);
    expect(screen.getByText('Без виконавця')).toBeInTheDocument();
  });

  it('викликає onClick при кліку', async () => {
    const onClick = vi.fn();
    render(<TaskCard task={baseTask} onClick={onClick} />);

    await userEvent.click(screen.getByText('Полагодити баг логіну'));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('підсвічує прострочений дедлайн для незавершеної задачі', () => {
    render(<TaskCard task={{ ...baseTask, dueDate: '2020-01-01T00:00:00.000Z' }} />);
    expect(screen.getByTitle('Дедлайн прострочено')).toBeInTheDocument();
  });

  it('не вважає дедлайн простроченим для виконаної задачі', () => {
    render(
      <TaskCard task={{ ...baseTask, status: 'DONE', dueDate: '2020-01-01T00:00:00.000Z' }} />,
    );
    expect(screen.getByTitle('Дедлайн')).toBeInTheDocument();
  });
});
