import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Некоректний email'),
  password: z.string().min(8, 'Мінімум 8 символів'),
});
export type LoginValues = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  name: z.string().min(2, 'Мінімум 2 символи').max(60, 'Максимум 60 символів'),
  email: z.string().email('Некоректний email'),
  password: z.string().min(8, 'Мінімум 8 символів').max(72, 'Максимум 72 символи'),
});
export type RegisterValues = z.infer<typeof registerSchema>;
