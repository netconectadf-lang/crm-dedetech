import Link from "next/link";

/**
 * Moldura centralizada padrão das telas de autenticação (signup, recuperar,
 * convite). O login usa um layout próprio (split-screen), por isso a moldura
 * vive aqui em vez de no layout do grupo (auth).
 */
export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 py-16">
      <Link href="/" className="mb-8 flex items-center gap-2">
        <span className="grid size-9 place-items-center rounded-lg bg-primary font-bold text-primary-foreground">
          D
        </span>
        <span className="text-lg font-semibold tracking-tight">Dedetech</span>
      </Link>
      <div className="w-full max-w-sm">{children}</div>
    </main>
  );
}
