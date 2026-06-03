/**
 * Tipos do banco gerados pelo Supabase CLI.
 * Regenerar após cada migration com:
 *   pnpm gen:types
 *
 * Placeholder até a primeira geração (Fase 1).
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: Record<string, never>;
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
