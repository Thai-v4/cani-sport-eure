---
version: 1
slug: "app-page-tsx"
primary_target: "app/page.tsx"
related_targets: ["app/articles/page.tsx","app/listeEvenement/page.tsx","app/SortieCanine/page.tsx","app/connexion/page.tsx","app/dashboard/admin/page.tsx"]
---

---
version: 1
slug: "app-page-tsx"
primary_target: "app/page.tsx"
related_targets: ["app/articles/page.tsx","app/listeEvenement/page.tsx","app/SortieCanine/page.tsx","app/connexion/page.tsx","app/dashboard/admin/page.tsx"]
---

# Site Cani-Sports Eure — refonte complète

## Portée et mode
Tout le site. Accueil : Persuade. Articles, événements, sorties, pages légales : Read. Connexion, inscription, espace adhérent, administration : Operate.

## Public, action, contraintes
Curieux et futurs adhérents, adhérents, bureau (voir PRODUCT.md). Action première d'un curieux : venir à une sortie et consulter l'agenda. À éviter absolument : le ton institutionnel (site de mairie). Logo actuel obligatoire. Direction fixée par l'utilisateur : moderne, essentielle, proche du minimalisme, avec une ligne bleue.

## Direction contract
THESIS: Un site minimal où une seule ligne bleue, la ligne de trait qui relie le coureur à son chien, relie aussi chaque visiteur à la prochaine sortie. Refuse le gabarit de club sportif (photo plein cadre + boutons + grille de cartes ombrées) et le ton de mairie.

OWN-WORLD: Blanc #FFFFFF, encre #0B0B0C, gris texte #4A4D52, filets #E3E4E6, fond secondaire #F5F6F7 ; une seule couleur : bleu ligne #1238D6, réservée à la ligne, aux liens et à l'action principale. Mona Sans seule famille : titres serrés (wdth 80, graisse 760), texte (wdth 100, graisse 420), chiffres tabulaires. Grille 12 colonnes, angles quasi droits (2px), filets 1px, aucune ombre, aucun cadre autour des photos, aucune carte empilée.

STORY: En un écran, le curieux comprend : on court (ou marche) avec son chien dans l'Eure, débutant ou compétiteur, et la prochaine sortie est tel jour à tel endroit. Il suit la ligne jusqu'à l'agenda, choisit une date, vient. L'adhérent retrouve agenda, résultats, chiens ; le bureau publie sans aide.

FIRST VIEWPORT: En-tête blanc : logo noir à gauche, quatre liens publics (Le club, Sorties, Agenda, Articles ; les résultats sont réservés aux adhérents et passent dans le menu du compte), « Se connecter » à droite. À gauche sur 7 colonnes, titre géant serré sur trois lignes « Courir avec son chien dans l'Eure. » ; dessous, une phrase et le bouton bleu « Venir à une sortie ». Du bouton part la ligne bleue de 2px, tendue horizontalement jusqu'au bloc « Prochaine sortie » (date en grand, lieu, discipline, lien agenda) sur 5 colonnes. Sous la ligne de flottaison, la photo du club en pleine largeur, sans cadre.

FORM: Direction épinglée par l'utilisateur (« moderne, essentiel, proche du minimalisme », puis « minimal + ligne bleue »), qui prime sur le tirage : le tirage 633aab21 avait assigné « Sangle et ligne de trait » (candidat 4 de la liste ancrée) ; la page de décision s'est fermée sans réponse et le choix est venu par la question structurée. On garde de ce tirage la topologie (la ligne qui relie), traduite en minimal ; ses matières (sangle, réfléchissant, coutures) sont abandonnées. Signature : la ligne bleue élastique (se dessine une fois, se tend au survol de l'action, revient avec un ressort) ; l'agenda de la saison est une rangée continue accrochée à la ligne avec un repère « aujourd'hui » ; chaque sortie a un recto simple et un verso dense. Seule la ligne bouge.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Décisions ouvertes
- Mentions légales : RNA, siège, responsable de publication inconnus (ne pas inventer).
- Nombre et contenu réels des sorties : dépendent de la base Supabase (en pause).
