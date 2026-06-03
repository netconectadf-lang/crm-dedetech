import {
  LayoutDashboard,
  Users,
  ScrollText,
  ShieldCheck,
  Settings,
  Building2,
  SprayCan,
  Package,
  Truck,
  IdCard,
  Landmark,
  Wrench,
  KanbanSquare,
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

export type NavSection = {
  titulo: string | null;
  itens: NavItem[];
};

export const NAV_SECTIONS: NavSection[] = [
  {
    titulo: null,
    itens: [{ href: "/dashboard", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    titulo: "Comercial",
    itens: [
      {
        href: "/funil",
        label: "Funil",
        icon: KanbanSquare,
        roles: ["owner", "comercial"],
      },
    ],
  },
  {
    titulo: "Cadastros",
    itens: [
      {
        href: "/clientes",
        label: "Clientes",
        icon: Building2,
        roles: ["owner", "comercial", "operacional"],
      },
      {
        href: "/servicos",
        label: "Serviços",
        icon: Wrench,
        roles: ["owner", "comercial", "operacional"],
      },
      {
        href: "/produtos",
        label: "Produtos",
        icon: SprayCan,
        roles: ["owner", "operacional"],
      },
      {
        href: "/fornecedores",
        label: "Fornecedores",
        icon: Package,
        roles: ["owner", "operacional", "financeiro"],
      },
      {
        href: "/funcionarios",
        label: "Funcionários",
        icon: IdCard,
        roles: ["owner", "rh"],
      },
      {
        href: "/veiculos",
        label: "Veículos",
        icon: Truck,
        roles: ["owner", "operacional"],
      },
      {
        href: "/plano-de-contas",
        label: "Plano de Contas",
        icon: Landmark,
        roles: ["owner", "financeiro"],
      },
    ],
  },
  {
    titulo: "Empresa",
    itens: [
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
    ],
  },
];

export function visibleSections(role: AppRole | null): NavSection[] {
  return NAV_SECTIONS.map((s) => ({
    ...s,
    itens: s.itens.filter((i) => !i.roles || (role && i.roles.includes(role))),
  })).filter((s) => s.itens.length > 0);
}
