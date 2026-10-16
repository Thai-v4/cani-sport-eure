import Image from "next/image";
import type { ReactNode } from "react";

// Cadre des pages de compte : formulaire à gauche, photo du club à droite (écran large)
export default function AuthFrame({
  title,
  description,
  children,
}: {
  title: string;
  description?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="grid min-h-[calc(100vh-4rem)] lg:grid-cols-2">
      <div className="site-container flex max-w-none flex-col justify-center py-14 lg:px-16 xl:px-24">
        <div className="w-full max-w-md">
          <h1 className="display text-[clamp(2.5rem,5vw,3.75rem)]">{title}</h1>
          {description && <p className="mt-4 text-ink-2">{description}</p>}
          <div className="mt-10">{children}</div>
        </div>
      </div>
      <div className="relative hidden bg-wash lg:block">
        <Image
          src="/photos/MainPage_bg.jpg"
          alt=""
          fill
          sizes="50vw"
          className="object-cover object-[25%_70%]"
        />
      </div>
    </div>
  );
}

export function FormAlert({ tone = "error", children }: { tone?: "error" | "success"; children: ReactNode }) {
  const styles =
    tone === "error"
      ? "border-danger bg-danger-wash text-danger"
      : "border-success bg-success-wash text-success";
  return (
    <div role={tone === "error" ? "alert" : "status"} className={`mb-6 border px-4 py-3 text-sm ${styles}`}>
      {children}
    </div>
  );
}
