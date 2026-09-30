"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/app/components/Auth/AuthProvider";

// Garde d'interface : l'accès réel est contrôlé par le proxy et la RLS Supabase
export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, role, isLoading } = useAuth();
  const isMember = role === "admin" || role === "adherent";

  useEffect(() => {
    if (isLoading) return;
    if (!user) router.replace("/connexion");
    else if (!isMember) router.replace("/unauthorized");
  }, [user, isMember, isLoading, router]);

  if (isLoading) return <p>Chargement...</p>;
  if (!isMember) return null;
  return <>{children}</>;
}
