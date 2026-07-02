"use client";

import { usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * Paginação server-side reutilizável. Preserva os demais filtros da URL e só
 * troca `?page=`. Mostra "X–Y de N". Some quando cabe tudo em uma página.
 */
export function Paginacao({
  page,
  pageSize,
  total,
}: {
  page: number;
  pageSize: number;
  total: number;
}) {
  const pathname = usePathname();
  const params = useSearchParams();
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;

  const href = (p: number) => {
    const sp = new URLSearchParams(params.toString());
    if (p <= 1) sp.delete("page");
    else sp.set("page", String(p));
    const qs = sp.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  };

  const de = (page - 1) * pageSize + 1;
  const ate = Math.min(page * pageSize, total);

  return (
    <div className="flex items-center justify-between gap-3 pt-2 text-sm text-muted-foreground">
      <span>
        {de}–{ate} de {total}
      </span>
      <div className="flex items-center gap-2">
        <Button asChild variant="outline" size="sm" disabled={page <= 1}>
          <Link href={href(page - 1)} aria-label="Página anterior" aria-disabled={page <= 1}>
            <ChevronLeft className="size-4" />
          </Link>
        </Button>
        <span className="tabular-nums">
          {page} / {totalPages}
        </span>
        <Button asChild variant="outline" size="sm" disabled={page >= totalPages}>
          <Link href={href(page + 1)} aria-label="Próxima página" aria-disabled={page >= totalPages}>
            <ChevronRight className="size-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
