import type { Metadata } from "next";

export const metadata: Metadata = { title: "Résultats" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
