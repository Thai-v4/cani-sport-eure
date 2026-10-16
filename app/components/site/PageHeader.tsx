import type { ReactNode } from "react";

type Props = {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
};

// En-tête de page commun : grand titre serré, phrase d'intro, actions à droite
export default function PageHeader({ title, description, actions, children }: Props) {
  return (
    <header className="site-container pb-10 pt-12 md:pb-14 md:pt-16">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="max-w-3xl">
          <h1 className="display text-[clamp(2.75rem,6.5vw,5rem)]">{title}</h1>
          {description && <p className="mt-4 max-w-[40rem] text-lg text-ink-2">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
      </div>
      {children}
    </header>
  );
}
