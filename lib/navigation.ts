import {
  LayoutDashboard,
  Users,
  ScrollText,
  ShieldCheck,
  Settings,
  Building2,
  SprayCan,
  Bug,
  DoorOpen,
  Package,
  Truck,
  IdCard,
  Landmark,
  Wrench,
  KanbanSquare,
  FileSignature,
  FileText,
  Boxes,
  ShoppingCart,
  ClipboardList,
  Wallet,
  ArrowDownCircle,
  ArrowUpCircle,
  MessageSquareHeart,
  Radar,
  UsersRound,
  LifeBuoy,
  Plug,
  Megaphone,
  Send,
  Contact,
  Briefcase,
  HardHat,
  MessageCircle,
  CircleDollarSign,
  Database,
  MapPin,
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
  /** Ícone do cabeçalho da seção (seções com título). */
  icon?: LucideIcon;
  /** Cor de acento da seção (violet, amber, emerald, sky, cyan, rose, indigo). */
  accent?: string;
  itens: NavItem[];
};

export const NAV_SECTIONS: NavSection[] = [
  {
    titulo: null,
    itens: [{ href: "/dashboard", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    titulo: "Comercial",
    icon: Briefcase,
    accent: "violet",
    itens: [
      {
        href: "/funil",
        label: "Funil",
        icon: KanbanSquare,
        roles: ["owner", "comercial"],
      },
      {
        href: "/orcamentos",
        label: "Orçamentos",
        icon: FileText,
        roles: ["owner", "comercial"],
      },
      {
        href: "/contratos",
        label: "Contratos",
        icon: FileSignature,
        roles: ["owner", "comercial"],
      },
      {
        href: "/chamados",
        label: "Chamados",
        icon: LifeBuoy,
        roles: ["owner", "comercial", "operacional"],
      },
    ],
  },
  {
    titulo: "Operação",
    icon: HardHat,
    accent: "amber",
    itens: [
      {
        href: "/os",
        label: "Ordens de serviço",
        icon: ClipboardList,
        roles: ["owner", "operacional", "tecnico"],
      },
      {
        href: "/estoque",
        label: "Estoque",
        icon: Boxes,
        roles: ["owner", "operacional"],
      },
      {
        href: "/compras",
        label: "Compras / Pedidos",
        icon: ShoppingCart,
        roles: ["owner", "operacional", "financeiro"],
      },
      {
        href: "/mip",
        label: "MIP / Monitoramento",
        icon: Radar,
        roles: ["owner", "operacional", "tecnico"],
      },
      {
        href: "/mapa",
        label: "Mapa da operação",
        icon: MapPin,
        roles: ["owner", "operacional", "comercial"],
      },
      {
        href: "/comunicacao",
        label: "Comunicação & NPS",
        icon: MessageSquareHeart,
        roles: ["owner", "comercial", "operacional"],
      },
    ],
  },
  {
    titulo: "WhatsApp",
    icon: MessageCircle,
    accent: "emerald",
    itens: [
      {
        href: "/whatsapp/campanhas",
        label: "Campanhas",
        icon: Megaphone,
        roles: ["owner", "comercial"],
      },
      {
        href: "/whatsapp/contatos",
        label: "Contatos",
        icon: Contact,
        roles: ["owner", "comercial"],
      },
      {
        href: "/whatsapp/scripts",
        label: "Scripts",
        icon: Send,
        roles: ["owner", "comercial"],
      },
    ],
  },
  {
    titulo: "Financeiro",
    icon: CircleDollarSign,
    accent: "sky",
    itens: [
      {
        href: "/financeiro",
        label: "Visão geral",
        icon: Wallet,
        roles: ["owner", "financeiro"],
      },
      {
        href: "/financeiro/receber",
        label: "A receber",
        icon: ArrowDownCircle,
        roles: ["owner", "financeiro"],
      },
      {
        href: "/financeiro/pagar",
        label: "A pagar",
        icon: ArrowUpCircle,
        roles: ["owner", "financeiro"],
      },
      {
        href: "/notas",
        label: "Notas fiscais",
        icon: ScrollText,
        roles: ["owner", "financeiro"],
      },
    ],
  },
  {
    titulo: "Cadastros",
    icon: Database,
    accent: "cyan",
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
        href: "/pragas",
        label: "Pragas",
        icon: Bug,
        roles: ["owner", "operacional"],
      },
      {
        href: "/estruturas",
        label: "Estruturas",
        icon: DoorOpen,
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
    titulo: "Pessoas",
    icon: UsersRound,
    accent: "rose",
    itens: [
      {
        href: "/rh",
        label: "Recursos Humanos",
        icon: UsersRound,
        roles: ["owner", "rh"],
      },
    ],
  },
  {
    titulo: "Empresa",
    icon: Building2,
    accent: "indigo",
    itens: [
      { href: "/equipe", label: "Equipe", icon: Users, roles: ["owner"] },
      { href: "/integracoes", label: "Integrações", icon: Plug, roles: ["owner"] },
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
