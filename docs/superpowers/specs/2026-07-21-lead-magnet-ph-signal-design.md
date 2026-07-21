# Design — Signal data-driven "AI mention" dans le lead magnet

**Date** : 2026-07-21
**Statut** : approuvé par Cédric, prêt pour implémentation

## Contexte et cadrage

Le lead magnet de `index.html` (déclenché par `runReadinessCheck`) scanne l'URL soumise (`readiness.js`) puis génère 3 raisons plateforme (Reddit/X/Product Hunt) via Claude à partir du titre/description scrapés (`platform-copy.js`). Ces deux fonctions sont chacune conçues pour ne jamais fabriquer de donnée : si un signal ne peut pas être obtenu, elles renvoient un état honnête plutôt qu'une valeur inventée.

En parallèle, `landing/data/ph-winners.json` contient 51 jours réels de #1 Product Hunt (date, produit, tagline, score, mentionsAI), synchronisé quotidiennement par le workflow n8n "Posted — PH Daily Winner Sync" et déjà affiché sur `product-hunt-launch.html`.

**Constat déclencheur** : citer un chiffre réel de ce dataset (ex: "33 sur 51 mentionnent AI") dans une réponse Reddit s'est montré nettement plus crédible qu'un exemple générique. Le lead magnet, qui montre aujourd'hui 3 raisons génériques-mais-honnêtes par plateforme, gagnerait au même traitement : un signal basé sur de la vraie donnée plutôt que sur un texte généré uniquement à partir du produit soumis.

**Décision explicite de scope** : le dataset PH n'a pas de champ catégorie — seulement `tagline`, `score`, `mentionsAI`. Un matching sémantique riche (comparer le produit soumis à des winners similaires par catégorie) demanderait un appel Claude supplémentaire et introduirait un risque de matching hallucinatoire. Cédric a tranché pour la version la plus simple et la plus sûre : une règle déterministe par mot-clé (le produit soumis mentionne-t-il "AI"/"agent" ?), jamais de comparaison sémantique.

## Ce qui est construit

**Emplacement** : `landing/index.html`, dans `renderReadiness(data)` — une ligne affichée entre le score PageSpeed (`ready-score`) et la grille des 3 cartes plateforme (`platformPreviews`). Ce n'est pas une 4e carte : les cartes existantes répondent chacune à "pourquoi CETTE plateforme pour ce produit", alors que ce signal est transversal et ne concerne aucune plateforme en particulier.

**Architecture** : entièrement côté client, aucune nouvelle fonction Netlify. `landing/data/ph-winners.json` est déjà un fichier statique public, fetché par `product-hunt-launch.html` avec `fetch('/data/ph-winners.json')` — on réutilise exactement ce même appel depuis `index.html`, en parallèle de `runReadinessCheck` (pas besoin d'attendre le retour de `readiness.js` pour le lancer, les deux sont indépendants).

**Détection du mot-clé** : réutilise la regex déjà existante sur `product-hunt-launch.html` pour la mise en évidence AI —`/\b(AI|agents?|agentic)\b/gi` — appliquée à la concaténation de `meta.title` et `meta.description` (les mêmes champs déjà scrapés par `readiness.js` et déjà utilisés par `fetchPlatformCopy`).

**Calcul** : sur le tableau `ph-winners.json`, compter `total = data.length` et `aiCount = data.filter(w => w.mentionsAI === true).length`. Le complément `total - aiCount` sert pour le cas "ne mentionne pas AI".

**Rendu — deux textes possibles selon le match** :
- Match trouvé (le produit mentionne AI/agent) :
  > "You mention AI/agent — so did {aiCount} of the last {total} #1 Product Hunt launches. It's the most common lane right now, so lead with what's actually different."
- Pas de match :
  > "You don't lean on AI/agent language — neither did {total - aiCount} of the last {total} #1 launches. No need to force an angle you don't have."

**Fallback honnête — aucun signal affiché (pas de valeur générique de repli)** dans ces cas, cohérent avec le principe déjà appliqué dans `readiness.js`/`platform-copy.js` de ne jamais deviner :
- `meta.reachable` est `false` (site injoignable, scan bloqué)
- `meta.title` et `meta.description` sont tous les deux vides
- Le fetch de `ph-winners.json` échoue (réseau, 404, JSON invalide)

Dans chacun de ces cas, la ligne ne s'affiche simplement pas — le reste du lead magnet (score, 3 cartes plateforme) continue de fonctionner normalement, exactement comme le fait déjà `fetchPlatformCopy` quand la génération Claude échoue.

## Ce qui reste hors scope (explicitement, pour cette itération)

- Tout matching sémantique entre le produit soumis et des winners individuels similaires (écarté par Cédric au profit du mot-clé déterministe)
- Toute donnée calculée en plus de la proportion (ex: score moyen du sous-groupe) — écarté pour rester sur "juste le chiffre qui a déjà marché"
- Toute mise en cache ou pré-calcul côté build — le fichier JSON est petit (51 entrées), le filtrage se fait en JS au chargement, comme `product-hunt-launch.html` le fait déjà pour ses propres stats
