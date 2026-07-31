# Design — Radar X : scan de conversations pertinentes pour la croissance perso de Cédric

**Date** : 2026-08-01 (brainstormé le 2026-07-29, spec écrite le 2026-08-01)
**Statut** : validé section par section avec Cédric, prêt pour implémentation

## Contexte et cadrage

Cédric veut prouver que sa propre méthode (trouver les bonnes conversations niche, y répondre genuinement) fonctionne, en l'appliquant d'abord à son propre compte X — dogfooding, pas un chantier client. Ça fait suite directe à deux refus de fabrication le même jour : un faux case study client ("0 → 300 vues/jour" inventé) et un faux témoignage façon concurrent SuperX, tous les deux refusés car ils auraient contredit le principe "jamais de données inventées" appliqué partout sur `letsgetposted.com`. Cédric a ensuite noté qu'un concurrent sérieux (Stanley, `x.getstanley.ai`) affiche "la preuve, pas l'exemple" (+19k en 90 jours, un chiffre réel et daté) — c'est le modèle à suivre. Ce chantier génère cette preuve honnêtement : un vrai historique de croissance X, obtenu en appliquant réellement la méthode.

**Ce que ce n'est pas** : ni le moteur produit pour clients (`docs/superpowers/specs/2026-07-28-discovery-engine-design.md`, toujours gelé en attendant un vrai lead — aucune contradiction, ce sont deux chantiers différents), ni une automatisation de publication. Formulation exacte de Cédric : "des automatisations qui permettent de remonter de X les posts sur notre niche pour les remonter et commenter" — remonter et laisser Cédric commenter, jamais publier à sa place.

## Décisions validées (brainstorm du 2026-07-29)

| Question | Réponse |
|---|---|
| Mots-clés / niche | Indie founders / solo builders **+** SaaS / distribution / growth |
| Canal de validation | Base Notion (Second Cerveau), pas Telegram — Cédric parcourt à son rythme |
| Brouillon de commentaire ? | Non — juste le post remonté, Cédric écrit lui-même (plus authentique, plus rapide à valider) |
| Fréquence / volume | 1x/jour, ~5-10 posts après filtrage |
| Publication automatique | Jamais — principe non négociable de tout le site ("Nothing posts without you. Ever.") |

## Faisabilité technique

Recherche effectuée le 2026-07-29 : plusieurs actors Apify existent pour scraper X, notamment `apidojo/tweet-scraper` (le plus complet, supporte les opérateurs de recherche avancée `from:`, `since:`, `min_faves:`). Même principe que `harvestapi~linkedin-post-search`, déjà utilisé et prouvé dans le pipeline sibling `~/Desktop/Linkedin Hack`. Pas de blocage technique identifié.

## Infra

**Compte n8n** : le compte n8n Cloud dédié à Posted/GetSeen déjà existant (créé 2026-07-17, séparé de l'ancien compte `breakpoint77.app.n8n.cloud`) — même compte que le workflow "Posted — PH Daily Winner Sync", nouveau workflow séparé nommé `Radar X — Daily Scan`.

**Horaire du cron** : 8h00 UTC quotidien — après la nuit (capture les posts publiés outre-Atlantique en soirée US), avant le début de journée de Cédric en Europe, laissant le temps de consulter la base Notion le matin.

## Flux

```
Cron quotidien (n8n, 8h00 UTC)
  → Apify (apidojo/tweet-scraper) : recherche X sur les mots-clés
    "indie founders / solo builders" + "SaaS / distribution / growth"
  → Filtre dur (gratuit, avant tout appel IA) :
    - post < 48h (pas une conversation froide)
    - pas déjà noyé sous 15+ réponses (créneau raté)
  → Claude juge la pertinence de chaque post restant :
    - Score 0-10 : cette personne exprime-t-elle un vrai signal
      (procrastination, mauvais canal, pas de leads, etc.), pas juste
      un mot-clé qui matche ?
    - Une phrase de raison ("pourquoi c'est pertinent")
  → Sous 6/10, écarté — n'arrive jamais jusqu'à Notion
  → Le reste, plafonné à 5-10 entrées/jour (les mieux scorées),
    dédupliqué sur l'URL (pas de doublon si un post reste visible
    plusieurs jours), écrit dans la base Notion "Radar X"
  → Cédric parcourt la base à son rythme, ouvre le vrai post sur X,
    répond lui-même, met à jour le Statut
```

Réutilise directement le mécanisme de scoring sémantique déjà conçu dans `2026-07-28-discovery-engine-design.md` (Section 3 de ce document) — même logique de filtre dur + jugement Claude + seuil 6/10, adapté ici à la pertinence "vaut le coup pour Cédric d'y répondre" plutôt qu'à "ce prospect a besoin de ce produit".

## Base Notion "Radar X"

Nouvelle base dans le Second Cerveau, liée au projet **Build in public/Content** déjà existant (voir `~/.claude/CLAUDE.md` global pour la structure des 5 bases existantes — Radar X est une 6e base, dédiée à ce chantier, pas une extension d'une base existante : son objet — des posts d'inconnus à qui répondre — ne correspond à aucune des 5 bases actuelles).

| Champ | Type Notion | Rôle |
|---|---:|---|
| Titre | Title | Extrait du tweet (~60 premiers caractères, auto) |
| Texte du post | Text | Texte complet du tweet trouvé |
| Auteur | Text | Handle X (@...) |
| URL | URL | Lien direct vers le tweet, pour répondre en un clic |
| Score | Number | Pertinence 0-10, jugée par Claude |
| Raison | Text | Une phrase : pourquoi c'est pertinent |
| Date trouvé | Date | Auto, date du scan |
| Statut | Select | `À traiter` (défaut) / `Répondu` / `Ignoré` |
| Projet | Relation | → "Build in public/Content" |

Cédric passe `Statut` à `Répondu` une fois qu'il a répondu sur X à la main, ou `Ignoré` s'il passe.

## Gestion des cas limites

Principe directeur, cohérent avec le reste du site : **jamais de ligne fabriquée pour "faire comme si"**.

```
- Apify échoue ou ne retourne rien → rien n'est écrit dans Notion ce
  jour-là. Pas de ligne vide, pas de post fabriqué pour remplir.

- Doublon (même tweet retrouvé un autre jour, toujours visible dans
  la fenêtre de 48h) → dédupliqué sur l'URL avant écriture, pas de
  2e ligne pour le même post.

- Aucun post au-dessus de 6/10 un jour donné → rien n'est ajouté ce
  jour-là. Pas de post faible forcé pour atteindre 5-10 entrées.
```

## Hors scope (explicitement)

- Génération de brouillon de commentaire — Cédric écrit lui-même, décision validée le 2026-07-29.
- Notification Telegram — Notion suffit, pas de canal temps réel nécessaire pour ce cas d'usage (pas de fenêtre d'opportunité aussi courte qu'un vrai lead client).
- Publication ou réponse automatique — jamais, principe non négociable du site.
- Le moteur produit pour clients (`2026-07-28-discovery-engine-design.md`) — chantier séparé, toujours gelé en attendant un vrai lead.

## Prochaine étape

Passer par `writing-plans` pour découper en tâches précises : création de la base Notion (schéma ci-dessus), config du compte Apify/actor, nœuds n8n un par un (cron, appel Apify, filtre dur, scoring Claude avec le prompt exact, dédup, écriture Notion), et le test de validation du moteur avant branchement réel (comparé à quelques recherches manuelles pour vérifier que le scoring sort de bons résultats).
