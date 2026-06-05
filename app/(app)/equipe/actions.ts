"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { sendEmail, inviteEmailHtml } from "@/lib/email";
import { inviteSchema } from "@/lib/validators/auth";
import type { AppRole } from "@/lib/types";

export type ActionState = { error?: string; message?: string } | null;

async function appOrigin() {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}

export async function inviteMember(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const ctx = await requireRole(["owner"]);

  const parsed = inviteSchema.safeParse({
    email: formData.get("email"),
    role: formData.get("role"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("invitations")
    .insert({
      tenant_id: ctx.tenantId,
      email: parsed.data.email,
      role: parsed.data.role as AppRole,
      invited_by: ctx.userId,
    } as never)
    .select("token")
    .single();

  if (error || !data) {
    return { error: "Não foi possível criar o convite." };
  }

  const { data: tenant } = await supabase
    .from("tenants")
    .select("razao_social, nome_fantasia")
    .eq("id", ctx.tenantId)
    .single();
  const empresa =
    (tenant as { razao_social: string; nome_fantasia: string | null } | null)
      ?.nome_fantasia ||
    (tenant as { razao_social: string } | null)?.razao_social ||
    "a empresa";

  const acceptUrl = `${await appOrigin()}/convite/${(data as { token: string }).token}`;
  await sendEmail({
    to: parsed.data.email,
    subject: `Convite para ${empresa} no Dedetech`,
    html: inviteEmailHtml({ empresa, acceptUrl }),
  });

  revalidatePath("/equipe");
  return { message: `Convite enviado para ${parsed.data.email}.` };
}

export async function revokeInvitation(invitationId: string) {
  const ctx = await requireRole(["owner"]);
  const supabase = await createClient();
  await supabase
    .from("invitations")
    .update({ status: "revoked" })
    .eq("id", invitationId)
    .eq("tenant_id", ctx.tenantId);
  revalidatePath("/equipe");
}

export async function changeMemberRole(membershipId: string, role: AppRole) {
  const ctx = await requireRole(["owner"]);
  const supabase = await createClient();
  // Não permite rebaixar a si mesmo (evita ficar sem owner por engano).
  const { data: m } = await supabase
    .from("memberships")
    .select("user_id")
    .eq("id", membershipId)
    .eq("tenant_id", ctx.tenantId)
    .single();
  if ((m as { user_id: string } | null)?.user_id === ctx.userId) return;

  await supabase.from("memberships").update({ role }).eq("id", membershipId).eq("tenant_id", ctx.tenantId);
  revalidatePath("/equipe");
}

export async function removeMember(membershipId: string) {
  const ctx = await requireRole(["owner"]);
  const supabase = await createClient();
  const { data: m } = await supabase
    .from("memberships")
    .select("user_id")
    .eq("id", membershipId)
    .eq("tenant_id", ctx.tenantId)
    .single();
  if ((m as { user_id: string } | null)?.user_id === ctx.userId) return;

  await supabase.from("memberships").delete().eq("id", membershipId).eq("tenant_id", ctx.tenantId);
  revalidatePath("/equipe");
}
