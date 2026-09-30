import type { Metadata } from "next";

export const metadata: Metadata = { title: "Calendrier du club" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
