import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email(),
  phone: z.string().min(5).max(20).optional(),
  password: z.string().min(8).max(128),
  role: z.enum(['USER','LANDLORD','AGENT','DRIVER']).optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const refreshSchema = z.object({});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

const validation = { registerSchema, loginSchema };
export default validation;
