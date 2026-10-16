// Hook historique : délègue au contexte d'authentification (rôles lus dans app_metadata)
import { useAuth } from "../components/Auth/AuthProvider";

export default function useUserRole() {
  const { role, isLoading } = useAuth();
  return { role, isLoading };
}
