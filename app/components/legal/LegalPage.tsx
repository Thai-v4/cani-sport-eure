import type { ReactNode } from "react";
import PageHeader from "../site/PageHeader";

// Gabarit de lecture pour les pages légales : colonne de 68 caractères, intertitres nets
export default function LegalPage({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  return (
    <>
      <PageHeader title={title} description={`Dernière mise à jour : ${updated}`} />
      <div className="site-container pb-24">
        <div className="max-w-[68ch] border-t border-ink pt-8 text-ink-2 [&_a]:text-line [&_a]:underline [&_h2]:mb-3 [&_h2]:mt-10 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-ink [&_h2:first-child]:mt-0 [&_li]:mb-1.5 [&_p]:mb-4 [&_strong]:text-ink [&_ul]:mb-4 [&_ul]:list-disc [&_ul]:pl-5">
          {children}
        </div>
      </div>
    </>
  );
}

export function ToFill({ value }: { value: string | null }) {
  return value ? <>{value}</> : <em className="not-italic text-danger">à renseigner par le bureau</em>;
}
