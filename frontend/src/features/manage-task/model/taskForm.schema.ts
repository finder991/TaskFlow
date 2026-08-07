import { z } from 'zod';

export const taskFormSchema = z.object({
  title: z.string().min(1, 'Вкажіть назву').max(200, 'Максимум 200 символів'),
  description: z.string().max(2000, 'Максимум 2000 символів').optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),

  assigneeId: z.string().optional(),

  dueDate: z.string().optional(),
});

export type TaskFormValues = z.infer<typeof taskFormSchema>;
