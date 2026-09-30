import type { Metadata } from "next";

export const metadata: Metadata = { title: "Agenda · administration" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
