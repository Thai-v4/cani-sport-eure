import type { Metadata } from "next";

export const metadata: Metadata = { title: "Articles · administration" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
