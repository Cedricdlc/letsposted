# GetSeen

Service de lancement de SaaS exécuté par des agents IA, supervisé par un humain. Repo local à `~/Developer/getseen` (renommé `sonar` → `getseen`, puis déplacé hors d'iCloud le 2026-07-13 — voir "Piège résolu" plus bas). Pas de remote Git configuré, repo local uniquement.

**Nom de marque** : brièvement renommé "Seen" le 2026-07-13, revenu à **GetSeen** le même jour (décision annulée). Le wordmark affiche "Get" en normal + "Seen" en italique/couleur accent (`.wordmark em`), esthétique inspirée d'une référence "mobile*first*".

Contexte complet (ICP, positionnement, arbitrages, risques) : `docs/prompt-contexte-projet.md`.
Copy de la landing page : `docs/copy-landing-value-proposition.md`.

## Structure

```
landing/            → landing page statique + fonctions serverless
  index.html         → page unique, self-contained (CSS/JS inline)
  netlify/functions/  → readiness.js, platform-copy.js
  netlify.toml
agents/             → modules Intake, Factory, Scout, Cockpit (à construire, vide pour l'instant)
docs/               → contexte projet, copy, décisions
```

## Infra

- **Site Netlify** : `graceful-marzipan-b14e6e` (site id `d4a26bd1-7f35-41c7-bf41-b4e83b981e0d`), compte "Acai".
  URL prod : https://graceful-marzipan-b14e6e.netlify.app
- **Déploiement** : pas de build lié à un repo Git côté Netlify — déploiement manuel depuis `landing/` via `netlify deploy` (preview) / `netlify deploy --prod` (prod). **Toujours passer par un preview d'abord.**
- Le dossier `landing/` est linké (`.netlify/state.json`) au site ci-dessus.

## Fonctions serverless (`landing/netlify/functions/`)

- **`readiness.js`** — check réel (jamais fabriqué) d'une URL produit soumise : fetch direct pour les meta tags (title, description, og:title, og:image — retourne le texte réel, pas juste des booléens) + score PageSpeed Insights best-effort (nul si l'API PSI throttle, ce qui arrive souvent sans clé).
- **`platform-copy.js`** — appelle Claude (`claude-haiku-4-5-20251001`) pour générer 3 previews de post réellement distinctes (Reddit / X / Product Hunt) à partir du titre/description scrapés par `readiness.js`. Si l'appel échoue (pas de clé, rate limit, JSON malformé), retourne `{ok:false}` et le front retombe silencieusement sur un texte templaté — jamais d'erreur visible, jamais de contenu inventé.

### Variables d'environnement (Netlify, site `graceful-marzipan-b14e6e`)

- `ANTHROPIC_API_KEY` — requis pour `platform-copy.js`. Déjà configurée.
- `PAGESPEED_API_KEY` — optionnelle, améliore le quota PageSpeed Insights (sinon quota anonyme partagé, quasi toujours épuisé → scores `null`). Pas encore configurée.

### Piège connu : `netlify dev` en local

En local avec `netlify dev`, `process.env.ANTHROPIC_API_KEY` peut être écrasé par une valeur qui ressemble à un JWT (`eyJhbGci...`, ~400 caractères) au lieu de la vraie clé `sk-ant-...` configurée sur le site — cause exacte non identifiée (probablement une extension Netlify ou un mécanisme d'injection interne au compte). Résultat observé : `platform-copy.js` répond `{"ok":false,"error":"Anthropic API 401"}` en dev alors que la clé est correcte.
**Ne pas perdre de temps à déboguer ça en local** — déployer un preview (`netlify deploy`) et tester directement dessus ; l'environnement Lambda réel n'a pas ce problème (vérifié le 2026-07-12, fonctionne correctement une fois déployé).

## Formulaires (Netlify Forms)

Deux forms enregistrés côté Netlify (vérifié via `netlify api listSiteForms`, `honeypot: true` sur les deux) :
- `liste-attente` — champ `url` (hero + section `#book`), déclenche le check de readiness.
- `lead-magnet` — champs `prenom` + `email`, révélé après un check réussi, cadré comme un lead magnet ("recevez l'aperçu complet") plutôt qu'un gate.

Le HTML source a `data-netlify="true"` + `netlify-honeypot="bot-field"` sur les deux `<form>`, mais **Netlify retire ces attributs du HTML servi** après avoir enregistré le form au build (comportement normal, cosmétique) — ne pas prendre leur absence dans la page rendue pour un signe que la capture est cassée. Pour vérifier si un form capture vraiment, utiliser `listSiteForms`, pas `curl` + `grep` sur la page.

## Reprendre après une coupure / un redémarrage — checklist

À faire en tout premier dans une nouvelle session sur ce repo, avant toute modification :

1. `cd ~/Developer/getseen && git log --oneline -5` — devrait toujours répondre instantanément (repo hors iCloud depuis le 2026-07-13, voir "Piège résolu" plus bas). Si jamais ça traîne, vérifier qu'on n'a pas atterri par erreur dans l'ancien dossier iCloud.
2. `git status --short` — vérifier qu'il n'y a pas de modif non committée laissée par une session précédente interrompue.
3. Comparer le dernier commit local à ce qui tourne réellement en prod (voir "Vérifier l'état réel du site" ci-dessous) — un commit local peut très bien ne pas avoir été déployé si la session s'est arrêtée entre le `git commit` et le `netlify deploy --prod`.
4. Lire `docs/user-research.md` — dernier état des sessions de recherche, et le rappel "à ne pas faire avant la prochaine session" qui doit rester valable tant que le pattern n'est pas confirmé sur plusieurs participants.

### Vérifier l'état réel du site (indépendant de git)

```
curl -s https://graceful-marzipan-b14e6e.netlify.app/ | grep -o "Analyze my launch\|Book my launch"
```
Si ça affiche encore "Book my launch", la prod n'a pas le dernier code — redéployer avec `netlify deploy --prod` depuis `landing/`.

## Piège résolu : `.git` se vidait via iCloud (dataless)

**Historique, pour référence si ça se reproduit ailleurs.** Le repo vivait dans `~/Documents/Github/`, synchronisé iCloud Drive avec "Optimiser le stockage Mac" — iCloud évinçait régulièrement le contenu de `.git` (pas juste `index`, parfois tout le dossier : `objects/`, `HEAD`, `config`...), causant des timeouts sur toute commande git (`fatal: .git/index: unable to map index file: Operation timed out`). Aucune perte de données à chaque fois — seule la mécanique interne de git était concernée, jamais les fichiers de travail.

**Fix appliqué le 2026-07-13** : `git clone --local --no-hardlinks` du repo iCloud vers `~/Developer/getseen` (hors iCloud Drive), puis copie manuelle du seul fichier gitignored nécessaire (`landing/.netlify/state.json`, le lien vers le site Netlify). L'ancien dossier a été renommé `~/Documents/Github/getseen-OLD-icloud-copy-safe-to-delete` plutôt que supprimé, à effacer une fois qu'on est sûr de ne plus en avoir besoin.

Si ce problème réapparaît sur un autre repo dans `~/Documents/` : même remède — cloner vers `~/Developer/` (ou tout dossier hors Desktop/Documents), ne pas essayer de `mv`/`cp` en place tant que le dossier iCloud est dans un état "dataless" (`ls -lO <fichier>` affiche `dataless` dans les flags) — `git clone --local` matérialise les fichiers un par un via lecture normale, ce qui contourne le blocage, alors qu'un `mv`/`cp` brut sur un dossier partiellement dataless risque de rester bloqué ou de casser le suivi iCloud du dossier source.

## État (2026-07-13)

- Dernier commit local (`a2d4e7e` au moment de la rédaction) : espacement du hero resserré (le CTA était trop bas dans le scroll) + premier log de recherche utilisateur (`docs/user-research.md`). **Déployé et vérifié en prod.**
- Commit précédent (`c9c2dce`) : previews multi-plateformes générées par IA + lead magnet + CTA renommé ("Book my launch" → "Get my free launch analysis" / "Analyze my launch", l'ancien texte promettait une réservation qui n'avait jamais lieu). Déployé et vérifié en prod le 2026-07-13.
- Le dossier a été renommé `sonar` → `getseen` puis déplacé de `~/Documents/Github/` vers `~/Developer/` le 2026-07-13 (hors iCloud, voir "Piège résolu" plus haut) ; aucun impact sur le lien Netlify (`.netlify/state.json` référence le site par id, indépendant du chemin).
- **Recherche utilisateur en cours** (voir `docs/user-research.md`) : 1ère session (n=1, à confirmer) suggère que le vrai pain est la procrastination, pas la méconnaissance des plateformes — le lead magnet actuel (previews par plateforme) répond peut-être à la mauvaise question. **Ne pas retoucher le positionnement/lead magnet avant confirmation sur 2-3 sessions de plus.**
- Grosse session de refonte le 2026-07-13, suite au premier feedback qualitatif : hero réécrit (pain "You still haven't posted it." nommé en premier), page réduite à 3 sections (hero / expertise / book), lead magnet passé en modale plein écran avec previews IA reframées en "pourquoi cette plateforme pour ta niche" (plus "aperçu de post"), bloc final en 2 colonnes avec un nuage de "stickers" (logos plateformes façon patch). **Identité visuelle rebrandée violet → noir/blanc/or** (`--accent`/`--grad` recolorés, plus aucun hex violet dans le fichier).
- Session de polish le 2026-07-13/14 : palette aplatie en jaune pâle unique (`#F2E96A`), plus aucun glow/halo, titre en effet surligneur, section "First Customers" ajoutée, bannière CTA plein écran en fin de page, lead magnet retravaillé pour la conversion (aperçu verrouillé de plateformes, livrable nommé, ligne d'urgence, email seul). **Tout ça est déployé et vérifié en prod.**

## État (2026-07-16)

- `landing/product-hunt-launch.html` refondu en profondeur suite au feedback "il faut beaucoup plus concret, visuel, avec des screen de product hunt, une vraie analyse" :
  - **Dataset réel** : 50 vrais #1 Product of the Day, du 26 mai au 14 juillet 2026, récupérés un par un via l'archive officielle Product Hunt (`producthunt.com/leaderboard/daily/...`). Tableau scrollable, chaque ligne vérifiable.
  - **Stat honnête recalculée** : 33/50 (pas 35/52, pas un chiffre rond forcé) mentionnent littéralement "AI" ou "agent" dans leur tagline — compté à la main sur le texte affiché, pas une catégorie invisible. Le texte assume explicitement que ce n'est pas 100% ("Vercel Drop, Firma.dev, Google Search Profiles n'en avaient pas besoin").
  - **Vraie étude de cas** : capture d'écran réelle du lancement Product Hunt de Café 2.0 (entreprise YC, 417 upvotes), asset dans `landing/assets/case-study-cafe-ph-launch.png`, présentée honnêtement comme "no paid upvotes, no growth hack".
  - **SEO** : JSON-LD Article schema, Open Graph + Twitter Card, canonical URL, meta description réécrite avec le vrai chiffre.
  - **Design** : passage de l'accent jaune unique à une palette pastel (jaune + rose + menthe + bleu ciel) sur fond crème, façon référence éditoriale Miami/Paris/Buenos Aires — eyebrows colorés par section, bordures top colorées sur les stat cards.
  - Déployé et **vérifié en prod** (`curl letsgetposted.com/product-hunt-launch.html` confirme "33 / 50", "last 50 winners", et l'asset image en 200).
- **Principe à retenir** : quand un chiffre "rond" demandé par l'utilisateur (ici "50") ne correspond pas exactement à la taille réelle des données collectées, ajuster le dataset réel pour matcher plutôt que d'inventer/forcer — ici le dataset s'est arrêté naturellement à 50 jours réels (26 mai), donc aucun ajustement forcé n'a été nécessaire, mais le stat dérivé (33/50) a bien été recalculé sur le dataset final, pas repris de l'ancienne version à 7 jours.

## Roadmap — pas maintenant, mais à ne pas perdre

- **Vraie recherche de prospects dans le lead magnet** (2026-07-14) : actuellement la modale montre "pourquoi ces plateformes pour ta niche", pas de vrais contacts. L'idée (inspirée d'explee.com, qui scrape de vraies personnes/emails et rédige un vrai message) serait de montrer un exemple de premier message de prospection généré par IA — mais explicitement illustratif, jamais un vrai nom/email inventé (irait contre le principe "jamais de données inventées" du site). La vraie recherche de prospects (comme explee) demanderait une infra séparée (base de prospects, enrichissement email) — chantier à part, pas un ajustement de CTA. Décidé de reporter pour rester concentré sur l'essentiel.
- **Vrai workflow agent (n8n) pour la page Product Hunt** (2026-07-16) : la page `product-hunt-launch.html` a maintenant une section "process" (Scan → Score → Cross-reference → Alert) qui décrit honnêtement la méthode en texte, PAS un screenshot de dashboard puisque `agents/` (Intake, Factory, Scout, Cockpit) est encore vide. Cédric prévoit de construire un vrai workflow (n8n, sur le modèle du pipeline `~/Desktop/Linkedin Hack`) le jour suivant — une fois ce workflow réel en place, remplacer/enrichir la section process avec un vrai screenshot ou une preuve concrète du système qui tourne, plutôt que le diagramme texte actuel.
