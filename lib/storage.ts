import supabase from "./supabaseClient";

// Les documents du club sont enregistrés avec leur URL publique historique :
// on en extrait le chemin dans le bucket pour demander une URL signée.
export function storagePathFromUrl(url: string, bucket: string): string | null {
  const marker = `/storage/v1/object/public/${bucket}/`;
  const index = url.indexOf(marker);
  if (index === -1) return null;
  return decodeURIComponent(url.slice(index + marker.length).split("?")[0]);
}

// URL de téléchargement temporaire (60 s) : fonctionne avec un bucket privé,
// où seuls les utilisateurs autorisés par les règles de stockage obtiennent un lien.
export async function getSignedDownloadUrl(url: string, bucket: string, fileName: string) {
  const path = storagePathFromUrl(url, bucket);
  if (!path) return null;
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, 60, { download: fileName });
  return error ? null : data.signedUrl;
}
