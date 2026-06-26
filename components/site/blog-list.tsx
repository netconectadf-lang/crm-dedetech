"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import type { Post } from "@/lib/site/posts";

const ease = [0.22, 1, 0.36, 1] as const;

export function BlogList({ posts, categories }: { posts: Post[]; categories: string[] }) {
  const [cat, setCat] = useState("Todos");
  const reduce = useReducedMotion();

  const sorted = [...posts].sort((a, b) => b.date.localeCompare(a.date));
  const featured = sorted.find((p) => p.featured) ?? sorted[0];
  const rest = sorted.filter((p) => p.slug !== featured.slug);
  const filtered = cat === "Todos" ? rest : rest.filter((p) => p.category === cat);

  return (
    <div>
      <motion.div initial={reduce ? false : { opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease }}>
        <Link href={`/blog/${featured.slug}`} className="card group grid overflow-hidden rounded-card md:grid-cols-2">
          <div className="relative aspect-[16/10] md:aspect-auto">
            <Image src={featured.cover} alt={featured.title} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover transition-transform duration-500 group-hover:scale-105" priority />
            <div className="absolute inset-0 bg-gradient-to-t from-bg/80 to-transparent md:bg-gradient-to-r" />
            <span className="absolute left-4 top-4 rounded-full bg-gradient-to-r from-emerald-deep to-emerald px-3 py-1 text-xs font-bold text-[#04140d]">Destaque</span>
          </div>
          <div className="flex flex-col justify-center p-7 sm:p-10">
            <div className="flex items-center gap-2 text-xs text-fog">
              <span className="rounded-full bg-emerald/10 px-2.5 py-1 font-semibold text-emerald">{featured.category}</span>
              <span>{featured.readingMin} min de leitura</span>
            </div>
            <h2 className="mt-4 font-display text-2xl font-bold leading-tight group-hover:text-emerald sm:text-3xl">{featured.title}</h2>
            <p className="mt-3 text-fog">{featured.excerpt}</p>
            <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-emerald">Ler artigo <span className="transition-transform group-hover:translate-x-1">→</span></span>
          </div>
        </Link>
      </motion.div>

      <div className="mt-12 flex flex-wrap gap-2">
        {categories.map((c) => (
          <button key={c} onClick={() => setCat(c)} className={`rounded-full border px-4 py-2 text-sm transition-colors ${cat === c ? "border-emerald bg-emerald text-[#04140d] font-semibold" : "border-line text-fog hover:border-emerald/40 hover:text-emerald"}`}>
            {c}
          </button>
        ))}
      </div>

      <motion.div layout className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {filtered.map((p, i) => (
            <motion.div key={p.slug} layout initial={reduce ? false : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={reduce ? undefined : { opacity: 0, scale: 0.96 }} transition={{ duration: 0.4, ease, delay: reduce ? 0 : (i % 6) * 0.04 }}>
              <Link href={`/blog/${p.slug}`} className="card group flex h-full flex-col overflow-hidden rounded-card">
                <div className="relative aspect-[16/10] overflow-hidden">
                  <Image src={p.cover} alt={p.title} fill sizes="(max-width: 640px) 100vw, 33vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-bg/85 via-transparent to-transparent" />
                  <span className="absolute left-3 top-3 rounded-full bg-bg/70 px-2.5 py-1 text-[10px] font-semibold text-emerald backdrop-blur">{p.category}</span>
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <span className="text-xs text-fog">{p.readingMin} min de leitura</span>
                  <h3 className="mt-2 font-display text-lg font-bold leading-snug group-hover:text-emerald">{p.title}</h3>
                  <p className="mt-2 line-clamp-2 text-sm text-fog">{p.excerpt}</p>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-emerald">Ler <span className="transition-transform group-hover:translate-x-1">→</span></span>
                </div>
              </Link>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {filtered.length === 0 && <p className="mt-10 text-center text-fog">Nenhum artigo nesta categoria ainda.</p>}
    </div>
  );
}
