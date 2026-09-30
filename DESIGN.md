---
name: Cani-Sports Eure
description: Site du club de canisport de l'Eure — blanc, encre, filets fins et une seule ligne bleue.
colors:
  paper: "#ffffff"
  wash: "#f5f6f7"
  ink: "#0b0b0c"
  ink-2: "#4a4d52"
  ink-3: "#6b6f76"
  rule: "#e3e4e6"
  rule-strong: "#c9cbcf"
  line: "#1238d6"
  line-deep: "#0b2491"
  line-wash: "#eef1fd"
  danger: "#b42318"
  danger-wash: "#fef3f2"
  success: "#067647"
  success-wash: "#ecfdf3"
  warning: "#b54708"
  warning-wash: "#fffaeb"
typography:
  display:
    fontFamily: "Mona Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(3.25rem, 8.4vw, 6rem)"
    fontWeight: 780
    lineHeight: 0.94
    letterSpacing: "-0.035em"
    fontVariation: "'wdth' 78"
  headline:
    fontFamily: "Mona Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(2.5rem, 5vw, 4rem)"
    fontWeight: 780
    lineHeight: 0.94
    letterSpacing: "-0.035em"
    fontVariation: "'wdth' 78"
  title:
    fontFamily: "Mona Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.08
    letterSpacing: "-0.02em"
    fontVariation: "'wdth' 84"
  body:
    fontFamily: "Mona Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.55
    fontVariation: "'wdth' 100"
  label:
    fontFamily: "Mona Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1.4
    fontVariation: "'wdth' 100"
rounded:
  sm: "2px"
  lg: "3px"
spacing:
  gutter-mobile: "16px"
  gutter-desktop: "32px"
  container: "1280px"
  section-mobile: "64px"
  section-desktop: "96px"
components:
  button-line:
    backgroundColor: "{colors.line}"
    textColor: "{colors.paper}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "0 20px"
    height: "44px"
  button-line-hover:
    backgroundColor: "{colors.line-deep}"
    textColor: "{colors.paper}"
  button-quiet:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "0 20px"
    height: "44px"
  button-quiet-hover:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
  button-danger:
    backgroundColor: "{colors.danger}"
    textColor: "{colors.paper}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "0 20px"
    height: "44px"
  field:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.sm}"
    padding: "8px 12px"
    height: "44px"
  nav-link:
    textColor: "{colors.ink-2}"
    padding: "20px 0"
  nav-link-active:
    textColor: "{colors.ink}"
---

# Design System: Cani-Sports Eure

## Overview

**Creative North Star: "La ligne de trait"**

Le site est une page blanche tenue par une seule ligne bleue : la ligne élastique qui relie le coureur à son chien, et qui relie ici le visiteur à la prochaine sortie. Tout le reste est encre, gris et filets d'un pixel. La couleur n'est jamais décorative : là où il y a du bleu, il y a une ligne, un lien ou l'action principale.

La densité est éditoriale, pas institutionnelle. Les titres sont très grands, serrés et lourds (Mona Sans en largeur réduite), le texte courant reste calme et lisible. Le contenu se range en rangées séparées par des filets plutôt qu'en grilles de cartes ; les photos sont posées à fond perdu, sans cadre ni ombre. La profondeur n'existe que pour ce qui flotte réellement au-dessus de la page (menu, modale, tiroir).

Le mouvement est réservé à la ligne : elle se dessine une fois, se tend au survol de l'action qu'elle relie et revient avec un léger ressort. Le reste de l'interface ne se déplace pas ; les changements d'état se font par couleur, en 160 ms.

**Key Characteristics:**
- Blanc, encre et filets 1px ; une seule couleur vive, le bleu de ligne.
- Une seule famille, Mona Sans, dont l'axe de largeur porte toute la hiérarchie.
- Angles quasi droits (2px), aucune ombre décorative.
- Rangées et filets plutôt que cartes empilées.
- La ligne de trait est le seul élément animé.

## Colors

Un monde achromatique (blanc, encre, trois gris) traversé par un bleu profond et saturé ; les couleurs d'état existent, mais seulement pour dire un statut.

### Primary
- **Bleu de ligne** (`line`) : la ligne de trait, les liens, l'action principale (« Venir à une sortie »), le repère « aujourd'hui », le lien actif de la navigation, la sélection de texte, l'anneau de focus et le curseur des champs.
- **Bleu de ligne profond** (`line-deep`) : survol de l'action principale.
- **Voile de ligne** (`line-wash`) : halo de focus des champs, jour courant du calendrier.

### Neutral
- **Papier** (`paper`) : fond de toutes les pages, des en-têtes et des surcouches.
- **Voile** (`wash`) : fond secondaire (section « Venir courir avec nous »), emplacement des images et cartes pendant le chargement, survol des listes.
- **Encre** (`ink`) : titres, texte fort, filets épais (2px) qui ouvrent un bloc, bouton discret au survol.
- **Encre 2** (`ink-2`) : texte courant secondaire, descriptions, liens de navigation au repos.
- **Encre 3** (`ink-3`) : métadonnées, intitulés de données, texte d'aide, placeholder.
- **Filet** (`rule`) : séparateurs 1px, bordure par défaut de tout élément.
- **Filet appuyé** (`rule-strong`) : contour des champs et des contrôles de carte, barre de défilement.

### États
- **Erreur** (`danger`, `danger-wash`), **succès** (`success`, `success-wash`), **alerte** (`warning`, `warning-wash`) : messages de formulaire (bordure + fond voilé + texte de la même teinte), action destructive, statuts. Jamais d'usage décoratif.

### Named Rules
**The One Colour Rule.** Une seule couleur vive sur tout le site : le bleu de ligne, réservé à la ligne, aux liens et à l'action principale. Si un élément bleu n'est ni l'un ni l'autre, il n'a pas à être bleu.

**The Remapped Palette Rule.** La palette Tailwind est ramenée au système dans `globals.css` : `blue`, `indigo`, `sky` et `purple` pointent vers la gamme du bleu de ligne (`blue-600` = bleu de ligne, `blue-800` = bleu profond, `blue-50` = voile de ligne) ; `gray` et `slate` pointent vers les neutres (`gray-50` = voile, `gray-200` = filet, `gray-300` = filet appuyé, `gray-500` = encre 3, `gray-600` = encre 2, `gray-950` = encre) ; `red`/`rose`/`pink` vers l'erreur, `green`/`emerald` vers le succès, `amber`/`yellow`/`orange` vers l'alerte (`-600` = teinte d'état, `-50` = voile). Les anciennes couleurs nommées (`blue_primary`, `yellow_primary`, `dark_blue_primary`…) et le thème daisyUI « cse » suivent la même table. Le code nouveau emploie les noms du système (`line`, `ink`, `rule`…), pas les noms de palette ; le remappage existe pour que l'héritage ne sorte pas du monde.

## Typography

**Display Font:** Mona Sans (avec ui-sans-serif, system-ui)
**Body Font:** Mona Sans (même famille)

**Character:** Une seule famille à largeur variable. Serrée et lourde pour les titres, elle a la tension d'un départ de course ; en largeur normale pour le texte, elle s'efface.

### Hierarchy
- **Display** (780, clamp(3.25rem, 8.4vw, 6rem), 0.94, largeur 78) : titre du premier écran uniquement. Les titres de page (`PageHeader`) utilisent le même traitement à clamp(2.75rem, 6.5vw, 5rem), les pages de compte à clamp(2.5rem, 5vw, 3.75rem).
- **Headline** (780, clamp(2.5rem, 5vw, 4rem), 0.94, largeur 78) : titres de section. Le même traitement « affichage » sert aussi aux grands chiffres : date de la prochaine sortie (2.5rem), jour du mois dans l'agenda (3rem), distance et dénivelé (1.875rem), liens du menu mobile (2.25rem).
- **Title** (700, 1.25–1.5rem, 1.08, largeur 84) : titres de rangée (nom d'une sortie, étape, titre de modale). Tous les h1–h4 reçoivent par défaut largeur 84, interlettrage -0.02em, interligne 1.08 et un équilibrage des lignes.
- **Body** (400, 1rem, 1.55, largeur 100) : texte courant ; introductions en 1.125–1.25rem, colonnes de lecture limitées à 36–40rem (68ch pour les pages légales).
- **Label** (600, 0.875rem) : intitulés de champ, titres de colonne du pied de page, statut d'une sortie. Les intitulés de données (`dt`) descendent à 0.75rem en encre 3.

### Named Rules
**The Width Axis Rule.** La hiérarchie se construit avec l'axe de largeur et la graisse, pas avec une seconde famille : 78 pour l'affichage, 84 pour les titres, 100 pour le texte.

**The Tabular Figures Rule.** Dates, heures, tableaux et mesures sont en chiffres tabulaires, partout.

**The No Kicker Rule.** Aucun sur-titre au-dessus d'un titre. Un titre se présente seul ; l'information de contexte va dessous ou dans la rangée. Seules exceptions en capitales : le nom du mois posé sur la ligne de l'agenda (0.75rem, 600, interlettrage 0.08em, encre 3) et l'abréviation du mois à côté du jour, qui sont des données, pas des sur-titres.

## Layout

Conteneur de page centré, 80rem de large au plus, marges de 1rem sur mobile et 2rem à partir de 768px. Les sections respirent en 4rem (mobile) et 6rem (desktop) de marge verticale. Les compositions larges s'appuient sur une grille de 12 colonnes : titre de section sur 4 colonnes et contenu sur 8 ; dans une sortie, recto et verso sur 5 colonnes, carte de la trace sur 7.

Le premier écran pose le titre en haut à gauche, puis sur une même rangée le bouton principal, la ligne de trait tendue horizontalement et le bloc « Prochaine sortie » (24rem). Sous 768px, la ligne devient verticale et descend du bouton vers le bloc.

Une bande peut démarrer à l'aplomb du conteneur et déborder jusqu'au bord droit de l'écran (agenda de la saison) : elle défile horizontalement, sans jamais passer à la ligne.

Les photos sont posées à fond perdu, pleine largeur, sans cadre. Les listes (disciplines, sorties, articles) sont des rangées séparées par des filets, pas des grilles de cartes.

## Elevation & Depth

Le système est plat. Toutes les ombres Tailwind (`shadow-xs` à `shadow-2xl`, `drop-shadow-*`) sont neutralisées globalement et le thème daisyUI est réglé à profondeur 0. La structure vient des filets : filet de 1px entre les rangées, filet d'encre de 1–2px pour ouvrir un bloc, fond voilé pour une section secondaire.

### Shadow Vocabulary
- **Surcouche** (`--shadow-overlay`) : menu du compte, modale de confirmation, tiroir de l'administration. Toujours accompagnée d'un filet de 1px et d'un voile d'encre derrière (30–50 %) pour les modales et tiroirs.

### Named Rules
**The Only Overlays Float Rule.** Seul ce qui se superpose réellement à la page porte une ombre, et c'est toujours `shadow-overlay`. Une carte, un bouton, une photo au repos n'en ont jamais.

## Shapes

Angles quasi droits : 2px pour les boutons, les champs, les contrôles et les événements du calendrier ; les grands rayons Tailwind (`rounded-lg` à `rounded-3xl`) sont plafonnés à 3px. Les barres d'outils du calendrier et les boutons de carte sont à angle vif (0). Le seul cercle du système est la pastille de la ligne : le mousqueton au bout de la ligne de trait (7px, contour 2px), le repère « aujourd'hui » (14px plein, anneau papier de 4px) et les points d'étape (14px, contour 2px). Les photos ne reçoivent ni rayon ni cadre.

## Components

### Buttons
Nets, plats, sans décor : la couleur dit tout.
- **Shape :** angles quasi droits, hauteur minimale 44px, graisse 600, 0.9375rem.
- **Principal (ligne) :** fond bleu de ligne, texte blanc ; bleu profond au survol. Un seul par écran ou par rangée d'actions ; c'est lui que la ligne de trait relie. Le bouton du premier écran monte à 52px de haut et 1.75rem de marge latérale.
- **Discret :** contour d'encre 1px, fond transparent ; s'inverse (fond encre, texte blanc) au survol. Actions secondaires : « Se connecter », « Créer un compte adhérent », « Annuler », téléchargement GPX.
- **Destructif :** fond erreur, texte blanc, rouge plus sombre au survol. Uniquement pour une suppression, dans une modale de confirmation.
- **Hover / Focus :** transitions de couleur en 160ms (courbe expo sortante). Focus visible : contour 2px bleu de ligne décalé de 2px, sur tout élément interactif. Désactivé : opacité 45 %.

### Links
- **Lien de ligne :** bleu de ligne, graisse 600, soulignement 1px qui apparaît au survol (décalé de 0.2em).
- **Lien d'action avec flèche :** même bleu, flèche à droite (« Tous les articles », « Voir l'agenda »).
- **Liens de pied de page :** encre 2, passent à l'encre au survol ; liens externes suivis d'une petite flèche oblique.

### Cards / Containers
Il n'y a pas de cartes au sens habituel. Un bloc s'ouvre par un filet d'encre en haut (2px pour la « Prochaine sortie » et les étapes, 1px pour les facettes du club) suivi de 1rem de marge ; les rangées se séparent par des filets de 1px. Les messages de formulaire sont des bandeaux à bordure 1px, fond voilé et texte de la teinte d'état.

### Inputs / Fields
- **Style :** contour 1px filet appuyé, fond blanc, angles quasi droits, hauteur minimale 44px, texte 1rem ; intitulé au-dessus en 0.875rem/600, aide et erreur dessous en 0.8125rem.
- **Hover :** contour encre 3.
- **Focus :** contour bleu de ligne et halo de 3px en voile de ligne ; curseur de saisie bleu.
- **Erreur :** contour rouge (`aria-invalid`), message en rouge sous le champ.

### Navigation
- **En-tête :** collant, fond papier, filet en bas, 64px de haut. Logo noir (40px) et nom du club en largeur 84 à gauche ; quatre liens publics en 0.9375rem/500, encre 2 au repos, encre au survol et à l'état actif ; la page active est soulignée par un segment de ligne bleue de 2px au ras du filet. « Se connecter » ou le prénom (menu en surcouche) à droite.
- **Mobile :** bouton « Menu » texte + icône ; feuille plein écran, liens en traitement « affichage » à 2.25rem séparés par des filets, lien actif en bleu de ligne.
- **Administration :** colonne de 240px, filet à droite ; le lien actif est désigné par un petit segment de ligne bleue (12×2px) devant son nom, les autres restent en encre 2.

### Ligne de trait (signature)
Trait bleu de 2px en SVG, légèrement détendu au repos (flèche de 9px), terminé par un mousqueton (cercle papier à contour bleu). Il se dessine une fois au chargement (900ms, courbe expo sortante), se tend au survol ou au focus de l'action qu'il relie et revient par un ressort amorti. Avec `prefers-reduced-motion`, il apparaît déjà dessiné et change de tension sans animation. Il n'est pas interactif et reste masqué des technologies d'assistance. Une version statique (filet bleu de 2px) relie les étapes de « Venir courir avec nous » et porte l'agenda de la saison.

### Agenda de la saison
Rangée continue, défilement horizontal, accrochée à une ligne bleue de 2px qui court sur toute sa longueur. À gauche, le repère « Aujourd'hui » (pastille bleue) ; chaque événement pend à la ligne par un petit trait vertical bleu, avec le jour en grand chiffre d'affichage, le mois abrégé, le titre et le lieu. Le nom du mois est posé sur la ligne, sur fond papier.

### Sortie (recto / verso)
Rangée de 12 colonnes : à gauche le statut (« À venir » / « Passée ») et la discipline, le nom, la date, puis les mesures (distance, dénivelé) en grands chiffres tabulaires sous un filet ; à droite la carte de la trace. Les fonds de carte Leaflet sont en niveaux de gris ; seule la trace porte la couleur. Contrôles de carte à filet appuyé, angle 2px, sans ombre.

### Calendrier
Le calendrier (react-big-calendar) est aligné sur le système : filets partout, boutons de barre d'outils à angle vif, vue active en fond encre, jour courant en voile de ligne, numéro du jour courant en bleu de ligne, jours hors mois en voile.

### Modale de confirmation
Panneau papier de 28rem au plus, filet 1px, ombre de surcouche, sur un voile d'encre à 50 %. Titre, phrase qui dit ce qui va se passer, puis « Annuler » (discret, focus initial) et l'action (destructive par défaut). Échap annule.

## Do's and Don'ts

### Do:
- **Do** réserver le bleu de ligne (#1238d6) à la ligne de trait, aux liens et à l'action principale.
- **Do** écrire le code nouveau avec les noms du système (`line`, `ink`, `ink-2`, `rule`, `wash`) plutôt qu'avec les noms de palette Tailwind remappés.
- **Do** séparer les contenus par des filets de 1px (`rule`) et ouvrir un bloc par un filet d'encre, plutôt que par un fond ou une ombre.
- **Do** composer les titres en Mona Sans serrée (largeur 78, graisse 780) et le texte en largeur normale ; chiffres tabulaires pour les dates et mesures.
- **Do** poser les photos à fond perdu, sans cadre ni rayon.
- **Do** garder `shadow-overlay` pour les seules surcouches (menu, modale, tiroir).
- **Do** respecter `prefers-reduced-motion` : la ligne arrive déjà dessinée.

### Don't:
- **Don't** introduire une seconde couleur vive, un dégradé ou une couleur d'état à usage décoratif.
- **Don't** mettre de sur-titre (kicker) au-dessus d'un titre.
- **Don't** empiler des cartes ombrées ni ajouter une ombre à une carte, un bouton ou une photo.
- **Don't** arrondir au-delà de 3px ; le cercle est réservé aux pastilles de la ligne.
- **Don't** animer autre chose que la ligne de trait : pas de déplacement au survol, pas d'apparition au défilement ; les états se font par couleur.
- **Don't** ajouter une seconde famille de caractères ni une police système en affichage.
