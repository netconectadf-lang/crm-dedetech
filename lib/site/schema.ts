import { site, author, socialProfiles } from "@/lib/site/site";

/**
 * Grafo de entidades conectado (schema.org) para GEO + Knowledge Graph.
 * IDs estáveis permitem ligar Organization ↔ WebSite ↔ Article ↔ Person
 * por referência (@id), em vez de blocos isolados.
 */

export const ORG_ID = `${site.url}/#organization`;
export const WEBSITE_ID = `${site.url}/#website`;
export const PERSON_ID = `${site.url}/#editor`;

type Node = Record<string, unknown>;

/** Nó da empresa. `sameAs` só entra quando há perfis sociais configurados. */
export function organizationNode(): Node {
  return {
    "@type": "Organization",
    "@id": ORG_ID,
    name: site.name,
    url: site.url,
    logo: { "@type": "ImageObject", url: `${site.url}/icon-512.png` },
    email: site.email,
    description: site.description,
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+5561991421131",
      contactType: "sales",
      areaServed: "BR",
      availableLanguage: "pt-BR",
    },
    ...(socialProfiles.length ? { sameAs: socialProfiles } : {}),
  };
}

export function webSiteNode(): Node {
  return {
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    name: site.name,
    url: site.url,
    inLanguage: "pt-BR",
    publisher: { "@id": ORG_ID },
  };
}

/** Autor editorial (E-E-A-T legível por máquina). */
export function authorNode(): Node {
  return {
    "@type": "Person",
    "@id": PERSON_ID,
    name: author.name,
    jobTitle: author.role,
    knowsAbout: author.knowsAbout,
    worksFor: { "@id": ORG_ID },
    ...(author.sameAs.length ? { sameAs: author.sameAs } : {}),
  };
}

/** Empacota nós num @graph único. Achata arrays aninhados. */
export function graph(...nodes: Node[]): Record<string, unknown> {
  return { "@context": "https://schema.org", "@graph": nodes };
}
