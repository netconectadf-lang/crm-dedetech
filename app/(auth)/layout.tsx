import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-16">
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
