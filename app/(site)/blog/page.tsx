import type { Metadata } from "next";
import { site } from "@/lib/site/site";
import { posts, categories } from "@/lib/site/posts";
import { BlogList } from "@/components/site/blog-list";

export const metadata: Metadata = {
  title: "Blog — Gestão de Dedetizadoras",
  description:
    "Conteúdo para donos e gestores de dedetizadoras: precificação, contratos recorrentes, ANVISA, Vigilância Sanitária, estoque e como crescer.",
  alternates: { canonical: `${site.url}/blog` },
};

export default function BlogIndex() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
      <p className="text-sm font-semibold uppercase tracking-wider text-emerald">Blog</p>
      <h1 className="mt-2 font-display text-4xl font-bold sm:text-5xl">Para crescer sua dedetizadora</h1>
      <p className="mt-4 max-w-2xl text-lg text-fog">
        Gestão, vendas, finanças e conformidade — o que você precisa para profissionalizar e
        escalar o seu negócio de controle de pragas.
      </p>
      <div className="mt-12">
        <BlogList posts={posts} categories={categories} />
      </div>
    </section>
  );
}
