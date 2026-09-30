"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/app/components/Auth/AuthProvider";

// Garde d'interface : l'accès réel est contrôlé par le proxy et la RLS Supabase
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, role, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (!user) router.replace("/connexion");
    else if (role !== "admin") router.replace("/dashboard/client");
  }, [user, role, isLoading, router]);

  if (isLoading) return <p>Chargement...</p>;
  if (role !== "admin") return null;
  return <>{children}</>;
}
