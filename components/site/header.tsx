"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { site } from "@/lib/site/site";

const nav = [
  { href: "/funcionalidades", label: "Funcionalidades" },
  { href: "/para-quem", label: "Para quem" },
  { href: "/precos", label: "Preços" },
  { href: "/blog", label: "Blog" },
  { href: "/contato", label: "Contato" },
];

export function Header() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 border-b border-line bg-bg/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <Image src="/icon-transparent.png" alt={site.name} width={40} height={40} className="h-9 w-auto" priority />
          <span className="font-display text-lg font-bold tracking-tight text-cream">
            Dede<span className="text-emerald">tech</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} className="text-sm text-fog transition-colors hover:text-cream">
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <a href={site.login} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-cream hover:text-emerald">
            Entrar
          </a>
          <Link href={site.signup} className="btn-primary rounded-full px-5 py-2.5 text-sm">
            Começar grátis
          </Link>
        </div>

        <button onClick={() => setOpen((v) => !v)} className="text-cream md:hidden" aria-label="Menu">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
      </div>

      {open && (
        <div className="border-t border-line bg-bg md:hidden">
          <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-3">
            {nav.map((n) => (
              <Link key={n.href} href={n.href} onClick={() => setOpen(false)} className="rounded-lg px-3 py-2.5 text-sm text-fog hover:bg-surface hover:text-cream">
                {n.label}
              </Link>
            ))}
            <a href={site.login} target="_blank" rel="noopener noreferrer" className="mt-2 rounded-lg px-3 py-2.5 text-center text-sm font-medium text-cream hover:bg-surface">
              Entrar
            </a>
            <Link href={site.signup} onClick={() => setOpen(false)} className="btn-primary mt-1 rounded-full px-5 py-2.5 text-center text-sm">
              Começar grátis
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
