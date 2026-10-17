import { z } from 'zod';

const emailSchema = z.string().trim().toLowerCase().pipe(z.email('Email invalide'));

export const registerSchema = z.object({
  firstName: z.string().trim().min(1, 'Prénom requis').max(60),
  lastName: z.string().trim().min(1, 'Nom requis').max(60),
  email: emailSchema,
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères').max(100),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Mot de passe requis'),
});
