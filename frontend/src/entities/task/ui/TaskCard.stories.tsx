import type { Meta, StoryObj } from '@storybook/react-vite';
import type { Task } from '../model/types';
import { TaskCard } from './TaskCard';

const baseTask: Task = {
  id: 't1',
  projectId: 'p1',
  title: 'Спроєктувати онбординг нових користувачів',
  description: null,
  status: 'TODO',
  priority: 'HIGH',
  assigneeId: 'u1',
  assignee: { id: 'u1', email: 'ada@example.com', name: 'Ada Lovelace' },
  createdById: 'u1',
  dueDate: '2026-09-01T00:00:00.000Z',
  position: 0,
  commentsCount: 3,
  createdAt: '2026-08-01T00:00:00.000Z',
  updatedAt: '2026-08-01T00:00:00.000Z',
};

const meta: Meta<typeof TaskCard> = {
  title: 'Entities/TaskCard',
  component: TaskCard,
  decorators: [
    (Story) => (
      <div style={{ width: 280 }}>
        <Story />
      </div>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof TaskCard>;

export const Default: Story = { args: { task: baseTask } };

export const Unassigned: Story = {
  args: { task: { ...baseTask, assignee: null, assigneeId: null } },
};

export const Urgent: Story = { args: { task: { ...baseTask, priority: 'URGENT' } } };

export const Overdue: Story = {
  args: { task: { ...baseTask, dueDate: '2020-01-01T00:00:00.000Z' } },
};

export const Dragging: Story = { args: { task: baseTask, isDragging: true } };
