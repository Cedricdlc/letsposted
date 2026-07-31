# Workflow n8n — Radar X : Daily Scan

**Compte n8n** : compte Cloud Posted/GetSeen existant (créé 2026-07-17), pas `breakpoint77.app.n8n.cloud`.
**Nom du workflow** : `Radar X — Daily Scan`
**Référence design** : `docs/superpowers/specs/2026-08-01-x-radar-design.md`
**Base Notion cible** : "Radar X", data source ID `8bfe0721-2898-446c-874b-9aa2dd809bc2` (créée 2026-08-01, voir CLAUDE.md).

## Table des nœuds

| # | Nœud | Type n8n | Rôle |
|---|---|---|---|
| 1 | Schedule Trigger | Schedule Trigger | Cron quotidien, 8h00 UTC |
| 2 | Scan X (Apify) | HTTP Request | Appelle l'actor Apify `apidojo/tweet-scraper` |
| 3 | Filtre dur | Code (JavaScript) | Écarte les posts trop vieux ou déjà noyés |
| 4 | Score Claude | HTTP Request | Appelle l'API Claude pour scorer chaque post restant |
| 5 | Garder ≥6, top 10 | Code (JavaScript) | Filtre + trie + plafonne |
| 6 | Déduplication | Code (JavaScript) | Compare aux URLs déjà présentes dans Notion |
| 7 | Écrire dans Notion | Notion node (Create Database Page) | Une page par post retenu |

## Nœud 1 — Schedule Trigger

Type : `Schedule Trigger`.
Configuration : Trigger Interval = `Cron`, expression `0 8 * * *` (8h00 UTC tous les jours).

## Nœud 2 — Scan X (Apify)

Type : `HTTP Request`.
Méthode : `POST`.
URL : `https://api.apify.com/v2/acts/apidojo~tweet-scraper/run-sync-get-dataset-items?token={{APIFY_TOKEN}}` (`APIFY_TOKEN` = credential n8n à créer, valeur = le token API Apify du compte de Cédric).
Body (JSON) :

```json
{
  "searchTerms": [
    "indie founder marketing",
    "solo founder distribution",
    "SaaS founder no leads",
    "posting for my startup",
    "where to post my SaaS"
  ],
  "maxItems": 50,
  "sort": "Latest",
  "tweetLanguage": "en"
}
```

Sortie attendue : un tableau JSON, chaque item avec au minimum `text`, `url`, `author.userName`, `createdAt`, `replyCount`.

## Nœud 3 — Filtre dur (Code)

Type : `Code` (JavaScript, mode "Run Once for All Items").

```javascript
const now = Date.now();
const FORTY_EIGHT_HOURS = 48 * 60 * 60 * 1000;
const MAX_REPLIES = 15;

return items.filter(item => {
  const tweet = item.json;
  const postAge = now - new Date(tweet.createdAt).getTime();
  if (postAge > FORTY_EIGHT_HOURS) return false;
  if ((tweet.replyCount || 0) > MAX_REPLIES) return false;
  return true;
});
```

## Nœud 4 — Score Claude (HTTP Request)

Type : `HTTP Request`, exécuté une fois par item entrant (n8n : laisser le mode par défaut "once per item", pas "run once for all items" — chaque post a besoin de son propre appel et de son propre score).

Méthode : `POST`.
URL : `https://api.anthropic.com/v1/messages`.
Headers : `x-api-key: {{ANTHROPIC_API_KEY}}` (credential n8n), `anthropic-version: 2023-06-01`, `content-type: application/json`.
Body (JSON) :

```json
{
  "model": "claude-haiku-4-5-20251001",
  "max_tokens": 200,
  "messages": [
    {
      "role": "user",
      "content": "Tu juges la pertinence d'un post X (Twitter) pour Cédric, fondateur de Posted., qui construit sa marque personnelle sur X autour de la distribution/growth pour founders indie et SaaS.\n\nPost à juger :\n---\n{{ $json.text }}\n---\nAuteur : {{ $json.author.userName }}\nPublié : {{ $json.createdAt }}\n\nCette personne exprime-t-elle un vrai signal pertinent (procrastination sur la publication, mauvais canal choisi, effort marketing sans résultat, recherche d'un outil de distribution, frustration de ne pas être vu) — pas juste un mot-clé qui matche par hasard ?\n\nRéponds UNIQUEMENT en JSON, sans texte autour :\n{\"score\": <entier 0-10>, \"raison\": \"<une phrase en français>\"}"
    }
  ]
}
```

Sortie attendue : la réponse Claude dans `content[0].text`, à parser en JSON dans le nœud suivant (`JSON.parse(...)` — si le parsing échoue, traiter comme score 0, ne jamais planter tout le workflow pour un item).

## Nœud 5 — Garder ≥6, top 10 (Code)

Type : `Code` (JavaScript, mode "Run Once for All Items" — ce nœud a besoin de voir tous les items ensemble pour trier).

```javascript
const scored = items.map(item => {
  let parsed;
  try {
    const raw = item.json.content[0].text;
    parsed = JSON.parse(raw);
  } catch (e) {
    parsed = { score: 0, raison: "Impossible d'analyser la réponse de scoring." };
  }
  return {
    json: {
      ...item.json.originalTweet,
      score: parsed.score,
      raison: parsed.raison
    }
  };
});

const kept = scored
  .filter(item => item.json.score >= 6)
  .sort((a, b) => b.json.score - a.json.score)
  .slice(0, 10);

return kept;
```

**Note d'implémentation** : ce nœud suppose que le tweet d'origine (`text`, `url`, `author.userName`, `createdAt`) a été propagé jusqu'ici sous `item.json.originalTweet` — dans n8n, configurer le nœud 4 (HTTP Request) pour inclure les champs d'entrée dans sa sortie ("Include Input Fields" / option équivalente selon la version n8n), ou ajouter un petit nœud `Set` juste avant le nœud 4 qui copie les champs du tweet dans une clé `originalTweet` avant l'appel Claude, pour ne pas les perdre après l'appel HTTP.

## Nœud 6 — Déduplication (Code)

Type : `Code` (JavaScript, mode "Run Once for All Items").

Ce nœud a besoin de connaître les URLs déjà présentes dans Notion. Avant ce nœud, ajouter un nœud Notion "Get Many Database Pages" (voir doc n8n officielle du nœud Notion) sur la base Radar X, ne récupérant que la propriété `URL`, exécuté juste avant ce nœud de code, avec sa sortie branchée en second input (utiliser un nœud `Merge` en mode "Combine" si besoin, ou référencer directement via une variable n8n selon la version). Étape simplifiée pour la première version : comparer contre les 50 dernières pages de Radar X (largement suffisant vu le volume de 5-10/jour).

```javascript
const existingUrls = new Set($('Get Many Database Pages').all().map(p => p.json.properties.URL.url));

return items.filter(item => !existingUrls.has(item.json.url));
```

## Nœud 7 — Écrire dans Notion

Type : `Notion` node, opération `Create` (Database Page).

Database : Radar X (data source ID `8bfe0721-2898-446c-874b-9aa2dd809bc2`).

Mapping des propriétés :

| Propriété Notion | Valeur |
|---|---|
| Titre | `{{ $json.text.slice(0, 60) }}` |
| Texte du post | `{{ $json.text }}` |
| Auteur | `{{ $json.author.userName }}` |
| URL | `{{ $json.url }}` |
| Score | `{{ $json.score }}` |
| Raison | `{{ $json.raison }}` |
| Date trouvé | date du jour (aujourd'hui, à l'exécution du workflow) |
| Statut | `À traiter` (valeur fixe) |
| Projet | relation vers la page "Build in public/Content" dans la base Projets — sélectionner cette page directement dans le champ du nœud Notion (pas une expression dynamique, la cible est toujours la même) |

## Test de validation avant branchement réel

Avant d'activer le cron : exécuter le workflow manuellement une fois ("Execute Workflow" dans n8n), vérifier que :
1. Le nœud 2 retourne bien des tweets réels (pas une erreur d'auth Apify).
2. Le nœud 4 retourne des scores qui varient (pas tout à 0, signe d'un prompt ou d'un parsing cassé).
3. Le nœud 7 crée bien des pages dans Radar X avec tous les champs remplis, visibles dans Notion.

Comparer les 5-10 posts retenus à une recherche manuelle rapide sur X avec les mêmes mots-clés — si le scoring sort des résultats visiblement hors-sujet, ajuster le prompt du nœud 4 avant d'activer le cron.
