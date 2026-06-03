import {
  LayoutDashboard,
  Users,
  ScrollText,
  ShieldCheck,
  Settings,
  type LucideIcon,
} from "lucide-react";

import type { AppRole } from "@/lib/types";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Papéis que enxergam o item. undefined = todos. */
  roles?: AppRole[];
};

/**
 * Itens de navegação do app. Os módulos de negócio (Funil, OS, Estoque...)
 * entram nas próximas fases — aqui ficam só os da Fase 1.
 */
export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/equipe", label: "Equipe", icon: Users, roles: ["owner"] },
  {
    href: "/auditoria",
    label: "Atividade",
    icon: ScrollText,
    roles: ["owner", "financeiro"],
  },
  {
    href: "/lgpd",
    label: "LGPD",
    icon: ShieldCheck,
    roles: ["owner", "financeiro"],
  },
  {
    href: "/configuracoes",
    label: "Configurações",
    icon: Settings,
    roles: ["owner"],
  },
];

export function visibleNav(role: AppRole | null): NavItem[] {
  return NAV_ITEMS.filter((i) => !i.roles || (role && i.roles.includes(role)));
}
