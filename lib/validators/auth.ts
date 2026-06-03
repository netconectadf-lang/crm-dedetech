import { z } from "zod";

import { ASSIGNABLE_ROLES } from "@/lib/types";

const senha = z.string().min(8, "Mínimo de 8 caracteres");

export const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(1, "Informe a senha"),
});

export const signupSchema = z.object({
  fullName: z.string().min(2, "Informe seu nome"),
  empresa: z.string().min(2, "Informe a razão social da empresa"),
  cnpj: z
    .string()
    .optional()
    .transform((v) => v?.replace(/\D/g, "") || undefined)
    .refine((v) => !v || v.length === 14, "CNPJ deve ter 14 dígitos"),
  email: z.string().email("E-mail inválido"),
  password: senha,
});

export const resetRequestSchema = z.object({
  email: z.string().email("E-mail inválido"),
});

export const inviteSchema = z.object({
  email: z.string().email("E-mail inválido"),
  role: z.enum(ASSIGNABLE_ROLES as [string, ...string[]]),
});

export const lgpdRequestSchema = z.object({
  tipo: z.enum(["access", "portability", "erasure", "rectification"]),
  titular_email: z.string().email("E-mail inválido"),
  detalhe: z.string().max(2000).optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type InviteInput = z.infer<typeof inviteSchema>;
