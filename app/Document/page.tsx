"use client";

import { useEffect, useState } from "react";
import { ChevronRight, FileText, Folder } from "lucide-react";
import supabase from "@/lib/supabaseClient";
import { isComptable } from "@/lib/roles";
import { getSignedDownloadUrl } from "@/lib/storage";
import { useAuth } from "../components/Auth/AuthProvider";
import PageHeader from "../components/site/PageHeader";
import { FormAlert } from "../components/account/AuthFrame";

type DocumentFile = {
  id: string;
  name: string;
  size: number | null;
  type: string | null;
  created_at: string | null;
  file_url: string | null;
  is_folder: boolean;
  access_level: string;
};

const dateFormat = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", year: "numeric" });
const sizeLabel = (bytes: number | null) =>
  !bytes ? "—" : bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1).replace(".", ",")} Mo` : `${Math.ceil(bytes / 1024)} Ko`;

export default function DocumentsPage() {
  const { user, role, isLoading } = useAuth();
  const [path, setPath] = useState<{ id: string | null; name: string }[]>([{ id: null, name: "Documents" }]);
  const [files, setFiles] = useState<DocumentFile[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const isAdmin = role === "admin";
  const comptable = isComptable(user);
  const current = path[path.length - 1];

  useEffect(() => {
    if (isLoading || !role) return;
    // Filtre d'affichage ; la règle RLS de club_documents fait foi côté serveur
    const levels = comptable
      ? ["public", "adherent", "admin", "admin_comptable"]
      : isAdmin
        ? ["public", "adherent", "admin"]
        : ["public", "adherent"];
    let query = supabase.from("club_documents").select("*").in("access_level", levels).order("is_folder", { ascending: false }).order("name");
    query = current.id ? query.eq("parent_id", current.id) : query.is("parent_id", null);
    query.then(({ data, error }) => {
      if (error) {
        setStatus("error");
        return;
      }
      setFiles((data as DocumentFile[]) ?? []);
      setStatus("ready");
    });
  }, [current.id, role, isLoading, isAdmin, comptable]);

  const open = (file: DocumentFile) => {
    setStatus("loading");
    setPath((p) => [...p, { id: file.id, name: file.name }]);
  };

  const download = async (file: DocumentFile) => {
    setDownloadError(null);
    const url = file.file_url ? await getSignedDownloadUrl(file.file_url, "club-documents", file.name) : null;
    if (url) window.location.href = url;
    else setDownloadError(`Impossible de télécharger « ${file.name} ». Réessayez ou contactez le bureau.`);
  };

  return (
    <>
      <PageHeader title="Documents" description="Statuts, comptes rendus et documents utiles du club." />
      <div className="site-container pb-24">
        <nav aria-label="Dossiers" className="flex flex-wrap items-center gap-1 border-t border-ink pt-5 text-sm">
          {path.map((folder, index) => (
            <span key={folder.id ?? "racine"} className="flex items-center gap-1">
              {index > 0 && <ChevronRight aria-hidden className="size-4 text-ink-3" />}
              {index === path.length - 1 ? (
                <span aria-current="page" className="font-semibold">
                  {folder.name}
                </span>
              ) : (
                <button type="button" onClick={() => setPath(path.slice(0, index + 1))} className="text-ink-2 hover:text-line hover:underline">
                  {folder.name}
                </button>
              )}
            </span>
          ))}
        </nav>

        <div className="mt-6">
          {downloadError && <FormAlert>{downloadError}</FormAlert>}
          {status === "loading" && <p className="text-ink-2">Chargement…</p>}
          {status === "error" && <p className="text-ink-2">Les documents ne se chargent pas pour le moment.</p>}
          {status === "ready" && files.length === 0 && <p className="text-ink-2">Ce dossier est vide.</p>}
          {status === "ready" && files.length > 0 && (
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-rule text-xs font-semibold text-ink-3">
                  <th scope="col" className="py-3 pr-4 font-semibold">Nom</th>
                  <th scope="col" className="hidden py-3 pr-4 font-semibold sm:table-cell">Taille</th>
                  <th scope="col" className="hidden py-3 font-semibold md:table-cell">Ajouté le</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rule">
                {files.map((file) => (
                  <tr key={file.id}>
                    <td className="py-3 pr-4">
                      <button
                        type="button"
                        onClick={() => (file.is_folder ? open(file) : download(file))}
                        className="flex items-center gap-3 text-left font-medium hover:text-line"
                      >
                        {file.is_folder ? (
                          <Folder aria-hidden className="size-5 shrink-0 text-ink-3" />
                        ) : (
                          <FileText aria-hidden className="size-5 shrink-0 text-ink-3" />
                        )}
                        {file.name}
                        {!file.is_folder && file.type && <span className="text-xs uppercase text-ink-3">{file.type}</span>}
                      </button>
                    </td>
                    <td className="hidden py-3 pr-4 text-ink-2 sm:table-cell">{file.is_folder ? "Dossier" : sizeLabel(file.size)}</td>
                    <td className="hidden py-3 text-ink-2 md:table-cell">{file.created_at ? dateFormat.format(new Date(file.created_at)) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}
