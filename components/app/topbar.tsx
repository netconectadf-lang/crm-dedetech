"use client";

import { Check, ChevronsUpDown, LogOut, Building2 } from "lucide-react";

import { switchTenant, logoutAction } from "@/app/(app)/actions";
import { ROLE_LABELS, type AppRole } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

type TenantOption = { id: string; nome: string };

export function Topbar({
  tenants,
  activeTenantId,
  userName,
  userEmail,
  role,
}: {
  tenants: TenantOption[];
  activeTenantId: string | null;
  userName: string | null;
  userEmail: string | null;
  role: AppRole | null;
}) {
  const active = tenants.find((t) => t.id === activeTenantId);
  const initials = (userName ?? userEmail ?? "?")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header className="flex h-14 items-center justify-between border-b px-4">
      {/* Seletor de empresa */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="gap-2">
            <Building2 className="size-4 text-teal-700" />
            <span className="max-w-[180px] truncate font-medium">
              {active?.nome ?? "Selecionar empresa"}
            </span>
            {tenants.length > 1 && (
              <ChevronsUpDown className="size-3.5 text-muted-foreground" />
            )}
          </Button>
        </DropdownMenuTrigger>
        {tenants.length > 1 && (
          <DropdownMenuContent align="start" className="w-64">
            <DropdownMenuLabel>Trocar de empresa</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {tenants.map((t) => (
              <form key={t.id} action={switchTenant.bind(null, t.id)}>
                <button type="submit" className="w-full">
                  <DropdownMenuItem className="justify-between" asChild>
                    <span>
                      <span className="truncate">{t.nome}</span>
                      {t.id === activeTenantId && <Check className="size-4" />}
                    </span>
                  </DropdownMenuItem>
                </button>
              </form>
            ))}
          </DropdownMenuContent>
        )}
      </DropdownMenu>

      {/* Menu do usuário */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="gap-2 px-2">
            <Avatar className="size-7">
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="flex flex-col">
            <span className="truncate">{userName ?? "Usuário"}</span>
            <span className="truncate text-xs font-normal text-muted-foreground">
              {userEmail}
            </span>
            {role && (
              <span className="mt-1 text-xs font-normal text-teal-700">
                {ROLE_LABELS[role]}
              </span>
            )}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <form action={logoutAction}>
            <button type="submit" className="w-full">
              <DropdownMenuItem asChild>
                <span>
                  <LogOut className="size-4" /> Sair
                </span>
              </DropdownMenuItem>
            </button>
          </form>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
