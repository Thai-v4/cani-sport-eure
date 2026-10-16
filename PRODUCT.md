# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Trois publics, sans hiérarchie entre eux (confirmé le 2026-09-30) :

- **Curieux et futurs adhérents** : habitants de l'Eure qui ont un chien et découvrent le canisport. Ils cherchent à comprendre les disciplines, voir s'ils ont le niveau, trouver la prochaine sortie ou course et savoir comment prendre une licence.
- **Adhérents** (statut « inscrit », validé par le bureau) : consultent l'agenda (y compris les événements privés), les sorties avec traces GPX, leurs résultats, l'album photo, et gèrent leur profil et leurs chiens.
- **Administrateurs du club** (bénévoles du bureau, non-développeurs) : valident les inscriptions, publient articles et événements, gèrent agenda, résultats, albums, catalogue de sorties et documents du club (dont la comptabilité, réservée aux admins comptables).

## Product Purpose

Site officiel de l'association Cani-Sports Eure (CS27) : vitrine publique du club et portail de ses adhérents et de son bureau. Il réussit quand un curieux sait quoi faire pour venir courir avec son chien, qu'un adhérent retrouve en quelques secondes la prochaine sortie ou ses résultats, et qu'un bénévole publie un contenu sans aide technique.

## Positioning

Club de canisport du département de l'Eure (27) qui réunit à la fois : l'accueil des débutants (cani-marche accessible), la compétition (licences FFSLC, courses, résultats), l'organisation de courses et sorties locales, et une pratique centrée sur le bien-être du chien. Les quatre facettes sont revendiquées à égalité.

## Operating Context

- Disciplines : cani-cross, cani-trail, cani-marche, cani-VTT, cani-trottinette.
- Licence via la FFSLC (courses.ffslc.fr) ; boutique du club chez sublimtout.com.
- Agenda synchronisé avec un Google Agenda (compte de service) ; événements publics ou privés (réservés aux adhérents).
- Inscription en ligne puis validation manuelle par le bureau (statut « en attente » → « inscrit »).
- Partenaires : Ville de Vernon, Région Normandie, Département de l'Eure, Seine Normandie Agglomération, FFSLC, assureur des adhérents.
- Contact : cani.sports.eure@gmail.com, Instagram @canisports_eure, Facebook canisports.eure.

## Capabilities and Constraints

- Next.js (App Router) hébergé sur Vercel ; Supabase pour l'authentification, la base (profils, chiens, publications, événements, résultats, sorties GPX, photos, documents) et le stockage de fichiers.
- Rôles : administrateur, comptable (admin avec accès comptabilité), animateur, adhérent inscrit, compte en attente.
- Contenu saisi par des bénévoles : les gabarits doivent tenir avec des textes et photos de longueur et qualité variables.
- Site entièrement en français.
- Non décidé : numéro RNA, siège social et responsable de publication (nécessaires aux mentions légales).

## Brand Commitments

- **Logo actuel obligatoire** : cercle noir « CANI-SPORTS EURE · CS27 » avec le chien en harnais sur la carte de l'Eure et « CROSS - TRAIL - MARCHE - VTT » (`public/logo-noir-SansFond.png`, version contour blanc `public/Logo-ContourBlanc-SansFond.png`).
- Tout le reste (couleurs, typographies, mise en page) peut changer. Le bleu et le jaune du site actuel ne sont pas des couleurs officielles.

## Evidence on Hand

- Photos du club : `public/photos/` (course, cross, trail, marche, vtt, trotinete, montagne, MainPage_bg).
- Pictogrammes des disciplines : `public/cani-*.png`.
- Logos partenaires : `public/SponsorImg/`.
- Aucun chiffre (nombre d'adhérents, date de création, palmarès), aucun témoignage : ne pas en inventer.

## Product Principles

1. Un curieux doit pouvoir passer de « c'est quoi ? » à « j'y vais » sans créer de compte.
2. Débutants et compétiteurs sont accueillis sur un pied d'égalité ; aucun ne doit se sentir hors-sujet.
3. Le chien est un partenaire, pas un accessoire : le propos et les images le respectent.
4. Les bénévoles publient seuls : chaque gabarit résiste aux contenus imparfaits.
5. Les données des adhérents (âge, licence, chiens, documents) ne sont visibles que de qui en a besoin.
