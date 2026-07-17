# Stratégie de contenu X — couche TOFU (design)

Date : 2026-07-17
Statut : approuvé par Cédric, prêt pour plan d'exécution

## Contexte

`docs/launch-plan.md` couvre déjà 28 jours de posts X (16/07 → 12/08), calibrés en voix mais quasi exclusivement orientés MOFU (process de construction du produit). Cédric veut ajouter une couche TOFU — le récit personnel de pourquoi il construit Posted. (douleur de distribution après 10+ projets lancés en 8 mois sans visibilité/clients/preuve sociale) — pour à la fois nourrir le narratif et faire grandir son compte X en parallèle du lancement.

Cette conversation est dédiée uniquement au contenu (voir `docs/prompt-contexte-content-creation.md`) ; elle ne touche pas au code produit.

## Décisions actées

| Point | Décision |
|---|---|
| Articulation avec le plan existant | `docs/launch-plan.md` (MOFU) reste intact tel quel. TOFU s'ajoute en parallèle, ne remplace rien. |
| Cadence | 2 posts/jour sur X : toujours 1 TOFU + 1 MOFU, tous les jours du 16/07 au 12/08. |
| Vulnérabilité du récit perso | Pas de règle fixe — certains posts nomment un projet précis avec ses vrais chiffres (ex: Breakpoint — 100 DM manuels, 1 call, 0€), d'autres restent sur le pattern général. Jugé post par post. |
| BOFU avant le 12/08 | Aucun. Pas de lien produit, pas de CTA transactionnel avant le lancement — seul "call to action" implicite : suivre/réagir/engager. Le vrai BOFU (thread de lancement) n'existe qu'à partir du jour J, déjà couvert par la section "Assets du jour J" de `launch-plan.md`. |
| Metrics publiques | Un post hebdo avec les vrais chiffres du compte X (followers, vues, clients) — transparence chiffrée, cohérente avec le principe "jamais rien d'inventé" du projet. |
| Stockage | Même base Notion "Tâches" (Canal=X), même vue "📅 Calendrier X" que les 28 tâches MOFU existantes (`X — J{n} ({date})`) — pas de nouveau fichier repo, pas de nouvelle vue. |

## Architecture du funnel

- **TOFU** (nouveau) — récit personnel, le "pourquoi". 1 post/jour, pilier en rotation (voir ci-dessous).
- **MOFU** (existant, inchangé) — process de construction du produit. Les 28 brouillons déjà rédigés dans `docs/launch-plan.md`.
- **BOFU** — inexistant avant le 12/08. À partir du lancement, le thread X de lancement (déjà prévu) est le seul contenu BOFU.

## Piliers TOFU — rotation par jour de semaine

| Jour | Pilier | Contenu |
|---|---|---|
| Lundi | Le pain | Constat universel : bon à construire, mauvais à se faire voir. Accroche l'audience indie hacker sur un problème partagé. |
| Mardi | Le cimetière | Tentatives concrètes qui ont échoué (cold outreach, communautés, pubs...). Projets nommés avec vrais chiffres quand ça sert (ex: Breakpoint). |
| Mercredi | Le déclic | Pourquoi des agents IA autonomes plutôt qu'un service ou plus de travail manuel — lien direct entre la douleur perso et la thèse produit de Posted. |
| Jeudi | Construire depuis zéro | Le méta-récit : 0 followers, 0 vues sur X lui-même, documenté en train de se faire, pas après coup. |
| Vendredi | Prises de position distribution | Opinions/observations sur la visibilité et le growth indie hacker — appuyées sur la donnée déjà collectée (dataset PH, règles Reddit/X). Repositionne Cédric comme quelqu'un qui a une opinion informée, pas juste une histoire. |
| Weekend | Libre | Pilier 1 (le pain) ou 4 (construire depuis zéro), le plus léger des deux à écrire sans matière fraîche. |

**Format hebdo spécial** : un post supplémentaire une fois par semaine (proposition : dimanche soir ou lundi matin) sert d'update chiffré transparent (followers/vues/clients réels) — remplace le post du pilier du jour ce jour-là plutôt que de s'ajouter en 3e post.

## Voix

Inchangée, s'applique identiquement aux deux couches. Référence : page Notion "Guide de voix — Posts X (Posted)" (créée le 2026-07-17) et les 28 brouillons déjà calibrés dans `docs/launch-plan.md`.

- Phrases complètes, connecteurs naturels ("turns out", "which sounds obvious but")
- Première personne
- Zéro superlatif marketing
- Honnête sur les limites et les échecs — jamais de posture
- Un chiffre cité doit être vérifiable ; une anecdote doit être vraie

## Stockage et conventions

- Une tâche Notion par jour et par post, dans la base Tâches existante.
- Convention de titre : `X — J{n} TOFU ({date}) : {pilier} — {accroche courte}` pour distinguer visuellement des tâches MOFU existantes (`X — J{n} ({date}) : {sujet}`) dans la même vue "📅 Calendrier X".
- Canal = X sur toutes les tâches (propriété déjà existante).
- Projet : Posted, à confirmer si "Build in public/Content" serait plus pertinent au moment de la création des tâches (les deux projets existent dans la base Projets).

## Hors scope (explicitement reporté)

- Adaptation TikTok — après que le format X soit rodé, pas maintenant (déjà noté dans `prompt-contexte-content-creation.md`).
- Réécriture des 28 brouillons MOFU existants — non touchés par ce design.
- Format des posts BOFU/lancement — déjà couverts par la section "Assets du jour J" de `launch-plan.md`, non redéfinis ici.

## Prochaine étape

Passer en plan d'exécution : rédiger les brouillons TOFU jour par jour (en commençant par J2, vendredi 17/07, pilier "Prises de position distribution") et créer les tâches Notion correspondantes, en validant chaque texte avec Cédric avant enregistrement (règle existante du guide de voix).
