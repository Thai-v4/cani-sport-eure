// Recrée les espaces de stockage et y envoie les fichiers d'une sauvegarde Supabase.
// Usage (depuis la racine du dépôt) :
//   SUPABASE_URL=https://<projet>.supabase.co SUPABASE_SERVICE_ROLE_KEY=... \
//   node scripts/restaurer-stockage.mjs /chemin/vers/dossier-de-stockage
// Le dossier contient un sous-dossier par espace (images, photo, gpx-files, club-documents).
import { createClient } from "@supabase/supabase-js";
import { readdir, readFile, stat } from "node:fs/promises";
import { join, relative, extname } from "node:path";

const BUCKETS = {
  images: { public: true },
  photo: { public: true },
  "gpx-files": { public: true },
  "club-documents": { public: false }, // téléchargement par URL signée uniquement
};

const TYPES = {
  ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".gif": "image/gif", ".webp": "image/webp",
  ".pdf": "application/pdf", ".gpx": "application/gpx+xml",
  ".doc": "application/msword", ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".xls": "application/vnd.ms-excel", ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
};

const [, , root] = process.argv;
const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
if (!root || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Usage : SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=… node scripts/restaurer-stockage.mjs <dossier>");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

async function* files(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) yield* files(path);
    else if (entry.name !== ".DS_Store" && entry.name !== ".emptyFolderPlaceholder") yield path;
  }
}

let sent = 0;
let failed = 0;
for (const [bucket, options] of Object.entries(BUCKETS)) {
  const { error: bucketError } = await supabase.storage.createBucket(bucket, options);
  if (bucketError && !/already exists/i.test(bucketError.message)) {
    console.error(`Espace ${bucket} : ${bucketError.message}`);
    failed++;
    continue;
  }
  await supabase.storage.updateBucket(bucket, options);

  const dir = join(root, bucket);
  if (!(await stat(dir).catch(() => null))) {
    console.log(`Espace ${bucket} : aucun dossier local, créé vide`);
    continue;
  }
  for await (const path of files(dir)) {
    const name = relative(dir, path).split("\\").join("/");
    const { error } = await supabase.storage.from(bucket).upload(name, await readFile(path), {
      upsert: true,
      contentType: TYPES[extname(path).toLowerCase()] ?? "application/octet-stream",
    });
    if (error) {
      failed++;
      console.error(`ÉCHEC ${bucket}/${name} : ${error.message}`);
    } else {
      sent++;
    }
  }
  console.log(`Espace ${bucket} : terminé`);
}
console.log(`${sent} fichier(s) envoyé(s), ${failed} échec(s)`);
process.exit(failed ? 1 : 0);
