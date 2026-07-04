import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
});

export const registerSchema = z.object({
  name: z.string().min(2, 'Nama minimal 2 karakter'),
  email: z.string().email('Email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
  role: z.enum(['creator', 'expert']),
});

export const createCaseSchema = z.object({
  name: z.string().min(3, 'Nama kasus minimal 3 karakter'),
  description: z.string().min(10, 'Deskripsi minimal 10 karakter'),
  method: z.enum(['AHP', 'TOPSIS']),
  aggregationMethod: z.enum(['GMJ', 'GMP']),
});

export const createCriterionSchema = z.object({
  name: z.string().min(2, 'Nama kriteria minimal 2 karakter'),
  parentId: z.string().optional(),
});

export const createAlternativeSchema = z.object({
  name: z.string().min(2, 'Nama alternatif minimal 2 karakter'),
  description: z.string().optional(),
});

export const inviteExpertSchema = z.object({
  email: z.string().email('Email tidak valid'),
});

export const submitComparisonSchema = z.object({
  matrix: z.array(z.array(z.number())),
  nodeId: z.string(),
});

// Type exports for use in components
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type CreateCaseInput = z.infer<typeof createCaseSchema>;
export type CreateCriterionInput = z.infer<typeof createCriterionSchema>;
export type CreateAlternativeInput = z.infer<typeof createAlternativeSchema>;
export type InviteExpertInput = z.infer<typeof inviteExpertSchema>;
export type SubmitComparisonInput = z.infer<typeof submitComparisonSchema>;
