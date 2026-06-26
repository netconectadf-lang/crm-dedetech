import Image from "next/image";
import Link from "next/link";
import { site } from "@/lib/site/site";

export function Footer() {
  return (
    <footer className="border-t border-line bg-bg-2">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2.5">
            <Image src="/icon-transparent.png" alt={site.name} width={40} height={40} className="h-9 w-auto" />
            <span className="font-display text-lg font-bold text-cream">
              Dede<span className="text-emerald">tech</span>
            </span>
          </div>
          <p className="mt-4 text-sm text-fog">{site.tagline}. O sistema completo para a sua dedetizadora.</p>
        </div>
        <div>
          <h4 className="font-display text-sm font-bold text-cream">Produto</h4>
          <ul className="mt-4 space-y-2 text-sm text-fog">
            <li><Link href="/#funcionalidades" className="hover:text-emerald">Funcionalidades</Link></li>
            <li><Link href="/precos" className="hover:text-emerald">Preços</Link></li>
            <li><Link href="/#como-funciona" className="hover:text-emerald">Como funciona</Link></li>
            <li><Link href="/#faq" className="hover:text-emerald">Dúvidas</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-display text-sm font-bold text-cream">Contato</h4>
          <ul className="mt-4 space-y-2 text-sm text-fog">
            <li><a href={site.whatsapp} target="_blank" rel="noopener noreferrer" className="hover:text-emerald">WhatsApp: {site.phone}</a></li>
            <li><a href={`mailto:${site.email}`} className="hover:text-emerald">{site.email}</a></li>
          </ul>
        </div>
        <div>
          <h4 className="font-display text-sm font-bold text-cream">Comece agora</h4>
          <p className="mt-4 text-sm text-fog">Veja o Dedetech funcionando na sua operação.</p>
          <a href={site.whatsapp} target="_blank" rel="noopener noreferrer" className="btn-primary mt-4 inline-block rounded-full px-5 py-2.5 text-sm">
            Falar no WhatsApp
          </a>
        </div>
      </div>
      <div className="border-t border-line">
        <div className="mx-auto max-w-6xl px-4 py-5 text-xs text-fog sm:px-6">
          © {new Date().getFullYear()} {site.name}. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  );
}
