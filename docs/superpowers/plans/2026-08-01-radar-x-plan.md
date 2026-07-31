# Radar X Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the Radar X system — a Notion base to hold scored X posts, and a complete n8n workflow specification Cédric will build in the n8n UI to scan X daily, score relevance with Claude, and surface the best 5-10 posts/day in that base for Cédric to read and reply to by hand.

**Architecture:** Two independent deliverables, not one pipeline of code. (1) A Notion database ("Radar X"), created directly via the Notion MCP tools available in this session — no code, no tests in the traditional sense, verified by fetching the created schema back. (2) A markdown specification of the n8n workflow, written for a human (Cédric) to follow node-by-node in the n8n UI — no n8n API/MCP tool exists in this session, so nothing here is executed automatically. This mirrors the split already used for `2026-07-17-n8n-agent-workflow-design.md` (Claude built the site-side JSON migration; Cédric built the n8n workflow from the documented node table).

**Tech Stack:** Notion (via `mcp__claude_ai_Notion__*` MCP tools), n8n Cloud (existing Posted/GetSeen account), Apify (`apidojo/tweet-scraper` actor), Claude (scoring).

## Global Constraints

- Base Notion niche/mots-clés : "indie founders / solo builders" + "SaaS / distribution / growth" (validé 2026-07-29).
- Pas de brouillon de commentaire généré — seul le post est remonté, Cédric répond lui-même.
- Fréquence : 1x/jour, plafonné à 5-10 entrées après filtrage.
- Jamais de publication ou réponse automatique — principe non négociable du site entier.
- Jamais de ligne fabriquée pour "faire comme si" un jour n'a rien donné.
- Base Notion créée sous la page racine "🧠 Second Cerveau" (page ID `39f21b64d5c1818da0f1eb3d3994dfd0`), liée au projet existant "Build in public/Content" dans la base Projets (data source ID `c86fd55a-9ce0-4b49-9996-b395aa6c0711`).
- Compte n8n : le compte Posted/GetSeen déjà existant (créé 2026-07-17), pas l'ancien `breakpoint77.app.n8n.cloud`.
- Cron : 8h00 UTC quotidien.

---

### Task 1: Créer la base Notion "Radar X"

**Fichiers concernés :** aucun fichier de code — cette tâche crée une base de données dans le workspace Notion de Cédric via les outils MCP. Rien à committer dans ce repo pour cette tâche (voir Task 2 pour la doc versionnée dans le repo).

**Interfaces :**
- Consomme : le data source ID de Projets (`c86fd55a-9ce0-4b49-9996-b395aa6c0711`), déjà vérifié existant et accessible via `mcp__claude_ai_Notion__notion-fetch` (schéma confirmé : `Nom` TITLE, `Catégorie` SELECT, `Statut` SELECT, `Couleur` SELECT — la relation `Projet` créée ici pointera vers cette data source).
- Produit : un nouveau data source Notion "Radar X" avec un ID de collection (`collection://<nouvel-id>`) — c'est cet ID que la Task 2 (spec n8n) doit référencer comme destination d'écriture. **Ne pas coder en dur cet ID dans la spec n8n avant que cette tâche ne l'ait produit** : Task 2 dépend du résultat de Task 1.

- [ ] **Étape 1 : Créer la base avec le schéma exact**

Appeler l'outil `mcp__claude_ai_Notion__notion-create-database` avec :

```json
{
  "title": "Radar X",
  "description": "Posts X (Twitter) trouvés pertinents pour la croissance perso de Cédric sur sa niche (indie founders/SaaS distribution) — scannés et scorés automatiquement, à traiter à la main. Voir docs/superpowers/specs/2026-08-01-x-radar-design.md dans le repo getseen.",
  "parent": { "page_id": "39f21b64d5c1818da0f1eb3d3994dfd0" },
  "schema": "CREATE TABLE (\"Titre\" TITLE, \"Texte du post\" RICH_TEXT, \"Auteur\" RICH_TEXT, \"URL\" URL, \"Score\" NUMBER, \"Raison\" RICH_TEXT, \"Date trouvé\" DATE, \"Statut\" SELECT('À traiter':gray, 'Répondu':green, 'Ignoré':red), \"Projet\" RELATION('c86fd55a-9ce0-4b49-9996-b395aa6c0711'))"
}
```

Attendu : la réponse contient le Markdown du schéma créé, avec le nouvel ID de data source dans une balise `<data-source url="collection://...">`. Noter cet ID — il est nécessaire pour l'Étape 2 et pour la Task 2.

- [ ] **Étape 2 : Vérifier le schéma créé**

Appeler `mcp__claude_ai_Notion__notion-fetch` avec l'ID de data source obtenu à l'Étape 1.

Attendu : le schéma retourné contient exactement 9 propriétés — `Titre` (title), `Texte du post` (rich_text), `Auteur` (rich_text), `URL` (url), `Score` (number), `Raison` (rich_text), `Date trouvé` (date), `Statut` (select, options `À traiter`/`Répondu`/`Ignoré`), `Projet` (relation, `dataSourceUrl` pointant vers `collection://c86fd55a-9ce0-4b49-9996-b395aa6c0711`). Si une propriété manque ou a le mauvais type, corriger avec `mcp__claude_ai_Notion__notion-update-data-source` (statements `ADD COLUMN`/`ALTER COLUMN SET`) avant de continuer.

- [ ] **Étape 3 : Vérifier que la base est visible depuis la page racine Second Cerveau**

Appeler `mcp__claude_ai_Notion__notion-fetch` avec l'ID `39f21b64d5c1818da0f1eb3d3994dfd0` (page racine "🧠 Second Cerveau").

Attendu : "Radar X" apparaît parmi les sous-pages/bases listées. Si elle n'apparaît pas (peut arriver si le parent a été mal résolu), la déplacer manuellement ou recréer avec le bon `page_id`.

- [ ] **Étape 4 : Documenter l'ID réel dans le repo**

Cette étape n'est pas un commit de code — c'est une note à ajouter dans `CLAUDE.md` (section appropriée, à la suite du reste du journal du jour) donnant l'ID de data source réel obtenu à l'Étape 1, pour que les sessions futures (et la Task 2 de ce plan) puissent le référencer sans avoir à re-chercher dans Notion. Pas de format imposé — suivre le style déjà établi dans le reste de `CLAUDE.md` (entrée datée, une ou deux phrases).

---

### Task 2: Écrire la spécification exacte du workflow n8n

**Fichiers :**
- Create: `docs/superpowers/specs/2026-08-01-x-radar-n8n-workflow.md`

**Interfaces :**
- Consomme : l'ID de data source Notion produit par la Task 1 (Étape 1) — doit être inséré dans le nœud final de ce workflow (écriture Notion). Si la Task 1 n'est pas encore faite au moment d'écrire cette tâche, laisser un seul repère explicite `[ID DATA SOURCE RADAR X — À REMPLIR APRÈS TASK 1]` à cet unique endroit du document (pas ailleurs — tout le reste du document doit être 100% concret, c'est la seule valeur qui dépend d'une autre tâche).
- Produit : un document que Cédric suit tel quel dans l'UI n8n, nœud par nœud, sans avoir à deviner une seule valeur.

- [ ] **Étape 1 : Écrire le document avec la table de nœuds complète**

Créer `docs/superpowers/specs/2026-08-01-x-radar-n8n-workflow.md` avec ce contenu :

````markdown
# Workflow n8n — Radar X : Daily Scan

**Compte n8n** : compte Cloud Posted/GetSeen existant (créé 2026-07-17), pas `breakpoint77.app.n8n.cloud`.
**Nom du workflow** : `Radar X — Daily Scan`
**Référence design** : `docs/superpowers/specs/2026-08-01-x-radar-design.md`

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

Database : Radar X (`[ID DATA SOURCE RADAR X — À REMPLIR APRÈS TASK 1]`).

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
````

- [ ] **Étape 2 : Vérifier l'absence de placeholder autre que celui explicitement autorisé**

```bash
grep -n "TBD\|TODO\|À REMPLIR" docs/superpowers/specs/2026-08-01-x-radar-n8n-workflow.md
```

Attendu : une seule ligne trouvée, celle du nœud 7 (`[ID DATA SOURCE RADAR X — À REMPLIR APRÈS TASK 1]`). Si Task 1 est déjà faite au moment de cette étape, remplacer cette valeur par l'ID réel obtenu et re-lancer la commande — attendu alors : aucune ligne trouvée.

- [ ] **Étape 3 : Commit**

```bash
cd ~/Developer/getseen
git add docs/superpowers/specs/2026-08-01-x-radar-n8n-workflow.md
git commit -m "Add Radar X n8n workflow spec, node-by-node for manual build"
git push origin main
```

---

## Self-Review (fait par Claude après écriture de ce plan)

**Couverture de la spec** : les 3 sections de décisions validées (mots-clés, canal Notion, pas de brouillon, fréquence) sont couvertes par la table de nœuds. Le flux (cron → Apify → filtre dur → scoring Claude → seuil 6/10 → dédup → Notion) correspond nœud pour nœud à la section "Flux" de la spec. Le schéma Notion de la Task 1 reprend exactement les 9 champs de la spec, dans le même ordre. La gestion des cas limites (Apify échoue → rien n'est écrit ; aucun post ≥6 → rien n'est ajouté) découle naturellement de l'architecture en nœuds séparés (un filtre vide en sortie du nœud 5 ou 6 signifie simplement que le nœud 7 ne s'exécute jamais ce jour-là, sans code spécial nécessaire).

**Placeholders** : un seul flag, volontaire et documenté (Task 2 dépend du résultat de Task 1), vérifié par la commande grep de l'Étape 2.

**Cohérence des types** : le schéma Notion (Task 1) et le mapping du nœud 7 (Task 2) utilisent les mêmes 9 noms de propriétés, mêmes types (Statut = select avec les 3 mêmes options dans les deux endroits).
