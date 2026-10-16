import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createPublicClient } from "@/lib/supabase/public";
import { formatFullDate } from "@/lib/format";
import { DEMO, demoArticles } from "@/lib/demo";

export const revalidate = 300;

type Article = {
  id: string;
  titre: string;
  contenu: string;
  image_url: string | null;
  created_at: string;
  id_profil: string | null;
};

type Author = { nom: string | null; prenom: string | null; photo_profil: string | null };

type Block = { kind: "heading"; id: string; text: string } | { kind: "paragraph"; text: string };

// Le contenu est saisi en texte brut : une ligne courte finissant par « : »,
// en majuscules ou préfixée par « # » devient un intertitre.
function toBlocks(content: string): Block[] {
  return content.split("\n").flatMap((line, index): Block[] => {
    const text = line.trim();
    if (!text) return [];
    const isHeading =
      text.length < 100 &&
      (text.endsWith(":") || (text === text.toUpperCase() && text.length > 10) || /^#{1,3} /.test(text));
    return isHeading
      ? [{ kind: "heading", id: `section-${index}`, text: text.replace(/^#{1,3} /, "") }]
      : [{ kind: "paragraph", text: line }];
  });
}

async function getArticle(id: string) {
  if (DEMO) {
    const article = demoArticles.find((a) => a.id === id);
    return article
      ? { article: { ...article, id_profil: null } as Article, author: null, related: demoArticles.filter((a) => a.id !== id) as Article[] }
      : null;
  }

  const supabase = createPublicClient();
  const { data: article, error } = await supabase.from("publication").select("*").eq("id", id).maybeSingle();
  if (error || !article) return null;

  const [{ data: author }, { data: related }] = await Promise.all([
    article.id_profil
      ? supabase.from("profils_publics").select("nom, prenom, photo_profil").eq("id", article.id_profil).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from("publication")
      .select("id, titre, contenu, image_url, created_at, id_profil")
      .neq("id", id)
      .order("created_at", { ascending: false })
      .limit(3),
  ]);

  return { article: article as Article, author: (author as Author | null) ?? null, related: (related as Article[]) ?? [] };
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const result = await getArticle(id);
  if (!result) return { title: "Article introuvable" };
  const description = result.article.contenu.replace(/\s+/g, " ").slice(0, 160);
  return {
    title: result.article.titre,
    description,
    openGraph: {
      title: result.article.titre,
      description,
      type: "article",
      images: result.article.image_url ? [result.article.image_url] : undefined,
    },
  };
}

export default async function ArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await getArticle(id);
  if (!result) notFound();

  const { article, author, related } = result;
  const blocks = toBlocks(article.contenu);
  const headings = blocks.filter((b): b is Extract<Block, { kind: "heading" }> => b.kind === "heading");
  const authorName = author ? [author.prenom, author.nom].filter(Boolean).join(" ") : null;

  return (
    <article className="pb-24">
      <div className="site-container pt-10">
        <Link href="/articles" className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-2 hover:text-ink">
          <ArrowLeft aria-hidden className="size-4" />
          Articles
        </Link>

        <header className="mt-8 max-w-4xl">
          <p className="text-sm text-ink-3">
            <time dateTime={article.created_at}>{formatFullDate(article.created_at)}</time>
            {authorName && <> · {authorName}</>}
          </p>
          <h1 className="display mt-4 text-[clamp(2.5rem,6vw,4.75rem)]">{article.titre}</h1>
        </header>
      </div>

      {article.image_url && (
        <div className="site-container mt-10">
          <div className="relative aspect-[16/9] w-full overflow-hidden bg-wash">
            <Image src={article.image_url} alt="" fill priority sizes="(min-width: 1280px) 1216px, 100vw" className="object-cover" />
          </div>
        </div>
      )}

      <div className="site-container mt-12 grid gap-12 lg:grid-cols-12">
        {headings.length >= 3 && (
          <aside className="lg:order-2 lg:col-span-3 lg:col-start-10">
            <details className="border-t border-ink pt-4 lg:sticky lg:top-24" open>
              <summary className="cursor-pointer text-sm font-semibold">Dans cet article</summary>
              <ul className="mt-3 space-y-2">
                {headings.map((h) => (
                  <li key={h.id}>
                    <a href={`#${h.id}`} className="text-sm text-ink-2 hover:text-line">
                      {h.text}
                    </a>
                  </li>
                ))}
              </ul>
            </details>
          </aside>
        )}

        <div className="max-w-[68ch] text-lg leading-relaxed text-ink lg:col-span-8">
          {blocks.map((block, index) =>
            block.kind === "heading" ? (
              <h2 key={block.id} id={block.id} className="mb-4 mt-10 scroll-mt-24 text-2xl font-bold first:mt-0">
                {block.text}
              </h2>
            ) : (
              <p key={index} className="mb-5 whitespace-pre-line">
                {block.text}
              </p>
            )
          )}
        </div>
      </div>

      {related.length > 0 && (
        <section aria-labelledby="titre-a-lire" className="site-container mt-20">
          <h2 id="titre-a-lire" className="text-sm font-semibold">
            À lire aussi
          </h2>
          <ul className="mt-4 divide-y divide-rule border-t border-ink">
            {related.map((item) => (
              <li key={item.id}>
                <Link href={`/articles/${item.id}`} className="group flex items-baseline justify-between gap-6 py-5">
                  <span className="text-xl font-bold group-hover:text-line">{item.titre}</span>
                  <time dateTime={item.created_at} className="shrink-0 text-sm text-ink-3">
                    {formatFullDate(item.created_at)}
                  </time>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}
