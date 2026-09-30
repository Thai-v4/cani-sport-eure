import type { Metadata } from "next";

export const metadata: Metadata = { title: "Galerie" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
