# Design — Premier workflow n8n : "Posted — PH Daily Winner Sync"

**Date** : 2026-07-17
**Statut** : approuvé par Cédric, prêt pour implémentation

## Contexte et cadrage

`docs/prompt-contexte-projet.md` décrit l'architecture cible du produit Posted en 4 modules (Intake, Factory, Scout, Cockpit) — "le moteur" qui exécuterait de vrais lancements clients. Ce même document pose une règle d'or explicite :

> "rien ne se code tant que ça n'a pas été fait deux fois à la main"

Au moment de ce design, Cédric est à J2 de son propre lancement manuel (le premier des deux passages requis par la règle). Construire le moteur complet maintenant reviendrait à coder l'automatisation avant de savoir précisément ce qu'il y a à automatiser.

**Décision explicite** : ce premier workflow n8n ne fait **pas** partie du moteur Intake/Factory/Scout/Cockpit. C'est une automatisation périphérique, à faible risque : maintenir à jour le dataset de la page `product-hunt-launch.html` (actuellement 50 jours de vraies données Product Hunt, collectées manuellement une fois cette semaine). Le moteur complet attend la fin du premier lancement manuel (et idéalement un deuxième, un pilote client) avant d'être cadré à son tour.

## Ce qui est construit côté site (Claude)

- `landing/data/ph-winners.json` — migration des 50 jours actuellement codés en dur dans `product-hunt-launch.html` vers ce fichier JSON. Historique complet conservé, jamais purgé (coût de stockage négligeable ; la page décide au rendu combien de jours récents afficher/utiliser pour la stat).
- Schéma d'une entrée :
  ```json
  {
    "date": "2026-07-16",
    "product": "ClawTeams",
    "tagline": "The first goal-driven, proactive AI team for e-commerce",
    "score": 725,
    "mentionsAI": true
  }
  ```
- `product-hunt-launch.html` modifié : le tableau des gagnants et la stat "33/50" (ou équivalent recalculé) sont générés en JS au chargement à partir de ce JSON, au lieu d'être codés en dur dans le HTML.

## Ce qui est construit dans n8n (Cédric)

**Compte** : nouveau compte n8n Cloud dédié à Posted/GetSeen (créé 2026-07-17), séparé de l'ancien compte `breakpoint77.app.n8n.cloud` (accès perdu, non récupéré délibérément — cloisonnement volontaire pour cette infra centrale).

**Workflow** : `Posted — PH Daily Winner Sync`

| # | Nœud | Rôle |
|---|---|---|
| 1 | Schedule Trigger | Cron quotidien, 9:00 UTC (le classement PH se fige à minuit PT ; 9h UTC laisse une marge confortable après cette clôture) |
| 2 | HTTP Request | Appelle l'API GraphQL Product Hunt (`api.producthunt.com/v2/api/graphql`), interroge les posts de la veille triés par votes, récupère le #1 |
| 3 | Code | Extrait nom, tagline, score, catégories. Calcule `mentionsAI` (tagline/catégorie contient "AI" ou "agent", insensible à la casse) |
| 4 | IF | Le #1 a bien été trouvé et les champs requis sont présents ? Sinon → nœud 9 |
| 5 | HTTP Request (GitHub) | `GET /repos/Cedricdlc/letsposted/contents/landing/data/ph-winners.json` — récupère le JSON actuel + son SHA |
| 6 | Code | Vérifie que la date du jour n'existe pas déjà dans le tableau (idempotence si le cron se déclenche deux fois) ; ajoute la nouvelle entrée si absente |
| 7 | HTTP Request (GitHub) | `PUT /repos/Cedricdlc/letsposted/contents/landing/data/ph-winners.json` avec le SHA du nœud 5 — commit le JSON mis à jour, message `"Add PH winner for {date} (automated)"` |
| 8 | HTTP Request (Netlify) | POST vers le Build Hook Netlify (body vide) — déclenche un nouveau build + déploiement |
| 9 | Notification (branche erreur) | Si le nœud 4 échoue : notifier Cédric (Telegram ou email — au choix, à définir au moment de construire) que la sync du {date} a échoué et doit être vérifiée à la main. **Jamais de donnée devinée ou fabriquée en remplacement.** |

**Pourquoi le commit GitHub → Build Hook plutôt qu'une base de données externe** : le site n'est pas connecté à un déploiement continu Git (déploiements manuels via `netlify deploy --prod` en CLI, cf. CLAUDE.md). Le Build Hook Netlify est le mécanisme standard pour déclencher un build depuis une automatisation externe, indépendant du bug `--prod` (Forbidden) rencontré en CLI pendant cette session. Une base externe (ex. Supabase) a été écartée : ajoute un service de plus à configurer pour un besoin qui est littéralement une ligne de donnée par jour, et casse la traçabilité git de chaque ajout (principe "jamais rien d'inventé, toujours vérifiable" tenu partout ailleurs sur le projet).

**Pourquoi l'API officielle Product Hunt plutôt que du scraping HTML** : Product Hunt documente et autorise cet accès (contrairement à Reddit/X qui bloquent tout accès automatisé, constaté cette semaine). Le scraping HTML est fragile face aux changements de frontend ; l'API est un contrat stable. Donne une donnée déjà structurée sans avoir besoin d'un nœud IA pour interpréter du HTML brut.

**Requête GraphQL nœud 2 — testée et confirmée fonctionnelle le 2026-07-17** (a bien renvoyé le vrai #1 du jour, "Paradigm", 610 votes) :

Configuration du nœud HTTP Request dans n8n :
- Méthode : `POST`
- URL : `https://api.producthunt.com/v2/api/graphql`
- Headers : `Authorization: Bearer {{ $credentials.productHuntToken }}` (stocker le Developer Token dans les credentials n8n, jamais en clair dans le nœud), `Content-Type: application/json`
- Body (JSON), avec `postedAfter`/`postedBefore` calculés dynamiquement sur la veille (à faire avec une expression n8n type `{{ $now.minus(1, 'day').startOf('day').toISO() }}` / `{{ $now.startOf('day').toISO() }}`) :
```json
{
  "query": "{ posts(first: 5, order: VOTES, postedAfter: \"<veille 00:00 UTC>\", postedBefore: \"<aujourd'hui 00:00 UTC>\") { edges { node { name tagline votesCount createdAt } } } }"
}
```
- Le nœud 3 (Code) prend `data.posts.edges[0].node` comme le #1 du jour (le tableau est déjà trié par `order: VOTES`, premier élément = premier).

## Prérequis à préparer par Cédric avant de construire

1. ~~Un vrai remote GitHub pour le repo.~~ **Fait le 2026-07-17** : repo créé sur `github.com/Cedricdlc/letsposted` (privé), remote local reconnecté, historique complet poussé.
2. ~~Personal Access Token GitHub avec accès écriture.~~ **Fait le 2026-07-17** : token classic, scope `repo`, stocké dans le trousseau macOS (git credential helper `osxkeychain`) — réutilisable tel quel pour les nœuds GitHub du workflow n8n (5 et 7).
3. ~~Token API Product Hunt.~~ **Fait le 2026-07-17** : app "Posted PH Sync" créée, Developer Token généré (n'expire jamais, verrouillé au compte perso), testé en direct contre l'API — a bien renvoyé le #1 du jour réel. À stocker dans les credentials n8n, jamais en clair dans un nœud.
4. Build Hook Netlify (Site settings → Build & deploy → Build hooks → "Add build hook") — **reste à faire**

## Hors scope (explicitement, pour cette itération)

- Le moteur Intake/Factory/Scout/Cockpit (attend la fin du premier lancement manuel, cf. règle d'or)
- Toute automatisation Reddit ou X (bloquées côté fetch dans cet environnement ; resteront manuelles pour l'instant)
- La génération d'un vrai plan de lancement personnalisé par produit (item déjà noté en attente dans le CLAUDE.md principal)
- Tout traitement en temps réel — une exécution par jour suffit, le classement PH ne change qu'une fois par jour de toute façon
