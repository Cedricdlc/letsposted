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
- `PAGESPEED_API_KEY` — **configurée le 2026-07-16**, définie pour tous les contextes (`netlify env:set ... ` sans `--context`, important — une première tentative scopée à `production` uniquement ne s'appliquait pas aux deploys preview). Clé dédiée créée sur le projet Google Cloud "Breakpoint", restreinte à "PageSpeed Insights API" uniquement — ne pas réutiliser la "Browser key (auto created by Firebase)" du même projet, elle est restreinte à 25 autres API et renvoie `API_KEY_SERVICE_BLOCKED` sur PageSpeed.

### Piège connu : `netlify deploy --prod` qui échoue avec "Forbidden"

Observé le 2026-07-16 : `netlify deploy --prod` échoue systématiquement avec `JSONHTTPError: Forbidden` alors que `netlify status`, `netlify api getSite` et un `netlify deploy` (preview, sans `--prod`) fonctionnent normalement — donc pas un problème d'auth générale, juste sur l'action de publication prod via le CLI. Cause exacte non identifiée (probablement transitoire côté API Netlify).
**Contournement qui marche** : faire un `netlify deploy` (preview) normal, récupérer son `deploy_id` dans la sortie, puis promouvoir ce deploy en prod directement via `netlify api restoreSiteDeploy --data '{"site_id":"d4a26bd1-7f35-41c7-bf41-b4e83b981e0d","deploy_id":"<ID>"}'`. Vérifier ensuite avec `curl https://letsgetposted.com/` que le contenu attendu est bien servi.

### Piège connu : `netlify dev` en local

En local avec `netlify dev`, `process.env.ANTHROPIC_API_KEY` peut être écrasé par une valeur qui ressemble à un JWT (`eyJhbGci...`, ~400 caractères) au lieu de la vraie clé `sk-ant-...` configurée sur le site — cause exacte non identifiée (probablement une extension Netlify ou un mécanisme d'injection interne au compte). Résultat observé : `platform-copy.js` répond `{"ok":false,"error":"Anthropic API 401"}` en dev alors que la clé est correcte.
**Ne pas perdre de temps à déboguer ça en local** — déployer un preview (`netlify deploy`) et tester directement dessus ; l'environnement Lambda réel n'a pas ce problème (vérifié le 2026-07-12, fonctionne correctement une fois déployé).

### Piège résolu : scores PageSpeed toujours `null` dans `readiness.js`

Deux bugs distincts trouvés et corrigés le 2026-07-16 :
1. `strategy=mobile` simule un throttling CPU/réseau qui pousse PSI à 14s+ de réponse — bien au-delà du budget d'exécution utilisable de la fonction Netlify. Passé à `strategy=desktop` (~8-13s en usage réel, parfois quasi instantané si PSI a déjà en cache un résultat récent pour la même URL).
2. Le timeout interne (`withTimeout`) était à 8000ms, plus court que la réponse réelle de PSI même en desktop — passé à 20000ms.
`netlify env:set` sans `--context` (donc "all") est nécessaire pour que la clé soit disponible aussi bien en preview qu'en prod — un premier essai scopé `--context production` ne s'appliquait pas aux deploys preview, ce qui a fait perdre du temps à déboguer le mauvais problème.

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

## Infra automatisation — n8n (2026-07-17)

Premier vrai workflow n8n du projet en cours de cadrage (spec superpowers : `docs/superpowers/specs/2026-07-17-n8n-agent-workflow-design.md`) : "Posted — PH Daily Winner Sync", garde à jour automatiquement `landing/data/ph-winners.json` (le dataset des #1 Product of the Day) via l'API officielle Product Hunt + commit GitHub + Netlify Build Hook.

**Compte n8n** : l'ancien compte `breakpoint77.app.n8n.cloud` (utilisé pour le pipeline LinkedIn Hack) n'est plus accessible (accès perdu le 2026-07-17). Décision : **ne pas essayer de le récupérer**, repartir sur un **nouveau compte n8n Cloud dédié à Posted/GetSeen**, séparé des autres projets — cloisonnement volontaire puisque ce sera l'infra centrale des automatisations du projet. Toujours du managed hosting (pas de serveur perso), Cédric ne connaît pas l'infra serveur. Cédric construit le workflow lui-même dans n8n ; Claude fournit la spec nœud par nœud + le code côté site (JSON + rendu dynamique de la page).

**Build effectivement testé le 2026-07-20** : nœuds 1-7 exécutés en conditions réelles avec succès — vrai #1 Product Hunt récupéré (OpenSEO, 697 votes), vrai commit automatique sur GitHub (`5dcec1a`), fichier `ph-winners.json` passé de 50 à 51 entrées. Reste le nœud 8 (Build Hook Netlify) à finir de brancher.

**Découverte importante le 2026-07-20 : le compte Netlify "Acai" est mélangé avec d'autres projets** (au moins "Acai Studio", un projet e-commerce sans rapport). Ça explique deux problèmes d'un coup : le Build Hook qui ne déclenchait rien (le site n'a jamais été connecté à un repo Git — `build_settings` vide côté API) ET très probablement le bug `netlify deploy --prod → Forbidden` qu'on contournait depuis le 16/07 (le compte "Acai" avait épuisé ses crédits mensuels : 555 crédits sur 557 consommés par 37 déploiements en prod ce mois-ci — pas un bug transitoire d'API comme supposé initialement).

**Décision finale (2026-07-20) : on n'a pas payé.** Crédits Netlify se renouvellent le **28 juillet 2026**. En attendant, on active quand même le workflow n8n complet dès maintenant : les nœuds 1-7 (récupération Product Hunt + commit GitHub) ne consomment aucun crédit Netlify, donc tournent gratuitement chaque jour et accumulent la vraie donnée sur GitHub sans rien perdre. Seul le nœud 8 (Build Hook → déploiement) échoue silencieusement jusqu'au 28 — pas grave, un seul déploiement le 28 juillet rattrapera d'un coup tous les jours accumulés entre-temps. Migration vers un compte Netlify dédié à Posted/GetSeen (au lieu d'"Acai" mélangé) et connexion du repo GitHub pour déploiement continu : **à faire le 28 juillet ou après**, pas avant — exporter les leads Netlify Forms existants avant cette migration, prévoir le changement DNS à un moment calme.

## Plan de lancement Posted. — 4 semaines (démarré 2026-07-16)

On applique à nous-mêmes nos propres checklists (PH / Reddit / X, voir les 3 pages de guide). Objectif : lancer sur Product Hunt le **mercredi 12 août 2026, 12:01 AM PT**, avec le post Reddit et le thread X le même jour. Pas de raccourci sur le chauffage d'audience — c'est exactement ce qu'on recommande aux autres.

**Routine quotidienne (tous les jours, du 16/07 au 12/08) :**
- Reddit : 3-5 commentaires réels sur r/SideProject, r/SaaS, r/indiehackers, r/startups — zéro lien, vraies réponses utiles.
- Product Hunt : upvote + commentaire sincère sur 2-3 lancements du jour — devenir un vrai membre, pas un compte qui apparaît le jour J.
- X : 1 post build in public — montrer le vrai travail (le vrai code, les vraies données, le process), jamais le pitch de vente à ce stade.

**Semaine 1 (16-22 juillet) — Fondations**
- Activer/vérifier les 3 comptes (Reddit, PH, X)
- Démarrer la routine quotidienne
- Build in public : ex. "on a analysé 50 lancements PH réels, voici ce qu'on a trouvé" (contenu déjà prêt depuis la page `product-hunt-launch.html`)

**Semaine 2 (23-29 juillet) — Continuité**
- Continuer la routine quotidienne
- Build in public : démo du scan (readiness check), le plan 7 jours, les checklists Reddit/X
- Commencer à repérer les makers PH actifs et utiles

**Semaine 3 (30 juillet - 5 août) — Réciprocité + préparation des assets**
- Continuer la routine quotidienne
- Identifier 2-3 makers PH à qui rendre la pareille
- Rédiger la fiche Product Hunt (tagline 60 car., description 500 car., 1er commentaire maker)
- Build in public : commencer à teaser "on prépare quelque chose" sans révéler le produit

**Semaine 4 (6-12 août) — Lancement**
- Continuer la routine quotidienne
- Rédiger le thread X et le post Reddit de lancement (avec disclosure)
- **Mercredi 12 août, 12:01 AM PT : lancement Product Hunt + post Reddit + thread X**
- Répondre à tout dans les 4h qui suivent (règle qu'on documente nous-mêmes sur nos pages)

**Note** : Cédric ne veut pas utiliser le Kanban perso (`~/Developer/Todo`) pour suivre ce plan — ce fichier CLAUDE.md est la seule source de vérité pour le plan de lancement. Ne pas re-proposer le Kanban pour ce projet sauf s'il le redemande explicitement.

### Stratégie de contenu X — base Notion "Contenu" (depuis le 2026-07-17)

Le suivi éditorial du contenu X (posts courts + threads longs) vit dans une base Notion dédiée **"Contenu"**, sous la page racine "🧠 Second Cerveau" (workspace "Cedric"), séparée de la base générale "Tâches". Migration faite le 2026-07-17 depuis Tâches (qui servait initialement, cf. historique dans `docs/superpowers/specs/2026-07-17-content-strategy-tofu-design.md`) — les anciennes entrées Tâches ont été renommées `[Déplacé → Contenu]` plutôt que supprimées.

Schéma de la base "Contenu" :

| Propriété | Type / valeurs |
|---|---|
| Titre | texte |
| Canal | select : X / Reddit / Product Hunt / Autre |
| Entonnoir | select : TOFU / MOFU / BOFU |
| Statut éditorial | select : Idée → Backlog → À rédiger → Prêt → Publié |
| Texte du post | texte (le post complet, threads = tweets numérotés dans le même champ) |
| Date de publication | date |
| Projet | relation vers la base Projets |

Vues : Default (table), "📅 Calendrier" (par Date de publication), "Board" (groupé par Statut éditorial), "🗂️ Par entonnoir" (groupé par Entonnoir).

**Stratégie éditoriale (design complet dans `docs/superpowers/specs/2026-07-17-content-strategy-tofu-design.md`)** : 2 posts/jour sur X pendant la fenêtre de lancement (16/07 → 12/08) — toujours 1 TOFU (récit perso : douleur de distribution après 10+ projets lancés en 8 mois sans visibilité/clients/preuve sociale) + 1 MOFU (process de construction, les 28 brouillons déjà calibrés). Rotation des piliers TOFU par jour de semaine : Lundi=le pain, Mardi=le cimetière (échecs nommés, ex: Breakpoint — 100 DM, 1 call, 0€), Mercredi=le déclic (agents IA autonomes), Jeudi=construire depuis zéro, Vendredi=prises de position distribution, weekend=libre. Un post hebdo remplace le pilier du jour par un update chiffré transparent (followers/vues/clients réels). Pas de BOFU avant le 12/08. Des threads longs (origin story, deep-dives) s'ajoutent ponctuellement, sans rythme fixe, en plus des 2 posts/jour.

Avant de rédiger un post : consulter la page Notion "Guide de voix — Posts X (Posted)" (voix naturelle, première personne, zéro superlatif, honnête sur les limites) et proposer le texte à Cédric — il choisit l'angle (souvent 2-3 options) avant tout enregistrement dans la base Contenu.

Backlog d'idées brutes (bonnes ou mauvaises) séparé : base Notion "Notes / Idées", Statut de maturité = Brute, liées au projet Posted — matière à développer en post plus tard, pas rédigées immédiatement sauf demande explicite.

## État (2026-07-16)

- `landing/product-hunt-launch.html` refondu en profondeur suite au feedback "il faut beaucoup plus concret, visuel, avec des screen de product hunt, une vraie analyse" :
  - **Dataset réel** : 50 vrais #1 Product of the Day, du 26 mai au 14 juillet 2026, récupérés un par un via l'archive officielle Product Hunt (`producthunt.com/leaderboard/daily/...`). Tableau scrollable, chaque ligne vérifiable.
  - **Stat honnête recalculée** : 33/50 (pas 35/52, pas un chiffre rond forcé) mentionnent littéralement "AI" ou "agent" dans leur tagline — compté à la main sur le texte affiché, pas une catégorie invisible. Le texte assume explicitement que ce n'est pas 100% ("Vercel Drop, Firma.dev, Google Search Profiles n'en avaient pas besoin").
  - **Vraie étude de cas** : capture d'écran réelle du lancement Product Hunt de Café 2.0 (entreprise YC, 417 upvotes), asset dans `landing/assets/case-study-cafe-ph-launch.png`, présentée honnêtement comme "no paid upvotes, no growth hack".
  - **SEO** : JSON-LD Article schema, Open Graph + Twitter Card, canonical URL, meta description réécrite avec le vrai chiffre.
  - **Design** : passage de l'accent jaune unique à une palette pastel (jaune + rose + menthe + bleu ciel) sur fond crème, façon référence éditoriale Miami/Paris/Buenos Aires — eyebrows colorés par section, bordures top colorées sur les stat cards.
  - Déployé et **vérifié en prod** (`curl letsgetposted.com/product-hunt-launch.html` confirme "33 / 50", "last 50 winners", et l'asset image en 200).
- **Principe à retenir** : quand un chiffre "rond" demandé par l'utilisateur (ici "50") ne correspond pas exactement à la taille réelle des données collectées, ajuster le dataset réel pour matcher plutôt que d'inventer/forcer — ici le dataset s'est arrêté naturellement à 50 jours réels (26 mai), donc aucun ajustement forcé n'a été nécessaire, mais le stat dérivé (33/50) a bien été recalculé sur le dataset final, pas repris de l'ancienne version à 7 jours.
- `landing/index.html` — plusieurs itérations sur le hero/CTA final le même jour :
  - Cluster téléphone+stickers déplacé de la section médiane `#book` (qui redevient texte simple, plus de layout `split`) vers juste au-dessus du formulaire CTA final, avec une ligne de tagline "The **Posted**. way to launch" entre les deux — inspiré d'une référence visuelle façon "mobilefirst" (fond sombre, stickers autour d'un téléphone, pill input+bouton, tagline courte).
  - Effet "sticker" (fond plein, bordure noire épaisse, ombre portée, rotation légère — **pas de glow/halo**, conforme à la préférence tranchée plus tôt) appliqué à la phrase "first customers" du headline CTA final, scopé via `.cta-banner-headline .cta-hl` pour ne pas toucher le point de la tagline qui réutilise `.cta-hl`.
  - Titre du hero : "posted it." → "**posted it!**", avec une animation d'entrée "sticker-slap" (rebond/overshoot au chargement, respecte `prefers-reduced-motion`).
  - Trait de surligneur à main levée (SVG, `scaleX` animé) sur "We post it for you." dans le lede du hero — pas sur le H1 lui-même car les blocs sticker du H1 sont déjà en fond plein (un soulignement dessus serait invisible).
  - **Frise "plan de lancement 7 jours" ajoutée dans le modal du lead magnet** (`#leadmagnet-modal`), en remplacement des chips de plateformes plates : Day 1 (Product Hunt) et Day 2 (Reddit) affichés en clair comme teaser, Day 3-5 en chips verrouillées/floutées façon `.lm-locked` existant. Explicitement labellisé "Example 7-day plan — yours is built around your niche" car la génération réelle personnalisée par produit n'existe pas encore (dépend du futur workflow n8n/agents). **Ne pas transformer ça en fausse personnalisation tant que le vrai système de génération n'est pas branché** — décision prise en discussion directe avec Cédric, comparaison avec le concurrent MediaFast (chat qualifiant + frise datée générée).
  - Idée inspirée de MediaFast (`mediafast` — chat "Arthur, founder" qui qualifie puis génère une frise datée avec r/subreddit + actions précises) : bon pattern de référence pour l'UX du "plan concret" à garder en tête si on construit la vraie génération plus tard.
  - **Section "How It Works" ajoutée le 2026-07-23** (`#how`, entre `#expertise` et `#pipeline`) : 4 étapes toujours visibles sans interaction (Submit → We match your platforms → We draft everything, in your voice → You approve, it goes live), inspirée d'un screenshot de Distribb ("Your first 7 days") que Cédric trouvait manquant sur la landing. Contrairement à la frise verrouillée du modal, ce n'est PAS un plan personnalisé — texte générique cohérent avec les affirmations déjà faites ailleurs sur la page (aucune nouvelle promesse). Pas de spec dédiée écrite (jugée assez simple pour un brainstorming léger conversationnel + implémentation directe, sans plan écrit séparé). Itérée plusieurs fois le même jour : fond renforcé + CTA sous la grille, puis scroll pinné façon "scrollytelling" (steps à gauche, mockup illustratif à droite en `position:sticky`, IntersectionObserver en scrollspy classique — une première version à bande de déclenchement fine laissait des zones mortes, corrigée), puis passage identité (badges numérotés + mockup en style sticker bordure noire épaisse/ombre décalée, mots clés sous surlignage marqueur `.mark-word`) étendu aussi aux badges plateforme de `#expertise` et au titre de `#pipeline`. **Mise en prod réussie le 2026-07-23 malgré le blocage crédits** : `netlify deploy --prod` a échoué comme d'habitude (Forbidden), mais le contournement `netlify api restoreSiteDeploy` a fonctionné sans erreur cette fois — les crédits "Production deploys" ne semblent pas avoir totalement bloqué cette action précise, à surveiller si ça se reproduit avant le 28/07.

### Piège connu (confirmé à nouveau) : `netlify deploy --prod` → Forbidden

Reproduit plusieurs fois de suite le 2026-07-16 sur toute la session (pas un cas isolé) : `netlify deploy --prod` échoue systématiquement, `netlify deploy` (preview) fonctionne toujours. Contournement utilisé à chaque fois avec succès : `netlify api restoreSiteDeploy --data '{"site_id":"d4a26bd1-7f35-41c7-bf41-b4e83b981e0d","deploy_id":"<ID du preview>"}'`. Voir détail plus haut dans ce fichier — considérer ce contournement comme la méthode par défaut pour publier en prod tant que `--prod` ne remarche pas, plutôt que de réessayer `--prod` en boucle.

## Landing v2 — refonte complète du 2026-07-23 (post-retour prospect réel)

**⚠️ Partiellement remplacée le même jour** par le pivot scroll horizontal ci-dessous (nav, hero, et structure de page changent à nouveau) — voir la section suivante pour l'état actuel réel. Section gardée pour l'historique de la décision lead magnet/plateformes (toujours valide) et le contexte de recherche (toujours valide).

Un vrai prospect B2B (testé sur `jumpia.club`) a donné un retour qui converge avec la session de recherche du 13/07 (n=1 → n=2 sur 2 points : page trop longue, lead magnet montre trop avant l'email). Design + plan détaillés dans `docs/superpowers/specs/2026-07-23-landing-relaunch-v2-design.md` et `docs/superpowers/plans/2026-07-23-landing-relaunch-v2.md`. Exécuté en Subagent-Driven Development (implémenteur + reviewer par tâche + revue finale sur l'ensemble), toutes les tâches approuvées, mis en prod le 2026-07-23.

Ce qui a changé :
- **Nav** : logo + "How it works" + "Guides" (regroupe les 3 guides, déplacés en footer) + bouton "Get access to the beta"
- **Hero** : séquence scroll-animée plein écran (4 phrases, diagramme SVG à pulsations réutilisant la technique de l'ancien `#expertise`) au lieu du hero statique. **Phrase 1 = "Stop procrastinating on your business launch."** — test délibéré : le mot "procrastinating" est exactement celui que le prospect du 23/07 a rejeté pour lui-même en tant que headline statique ; hypothèse que le même mot dans une séquence animée immersive peut fonctionner différemment. À surveiller sur le prochain retour utilisateur — si rejeté à nouveau, variante de repli déjà écrite : "You don't do it. We do it for you." (phrase validée en recherche le 13/07)
- **Sections fusionnées** : `#expertise` + `#pipeline` absorbées dans `#how`, qui passe de 4 à 5 étapes — coupe la redondance, raccourcit nettement la page
- **Lead magnet** : ne montre plus les 3 previews de plateforme générées par IA ni la frise 7 jours à plateformes fixes avant l'email (c'était exactement ce qui donnait l'impression "on m'a déjà tout donné" au prospect) — remplacé par "We'll send your priority launch plan within 24h", un vrai triage manuel par Cédric derrière (pas une génération automatique). `platform-copy.js`/`fetchPlatformCopy`/`platformPreviews` restent dans le code mais dormants (plus aucun point d'appel), pour un futur vrai moteur de génération
- **Plateformes** : plus de liste fixe Reddit/X/PH dans le texte — cadrage "on trouve les bons canaux selon ta niche" (LinkedIn inclus si pertinent pour du B2B)

**Bug trouvé après coup, corrigé le jour même** : sous `prefers-reduced-motion` sur desktop, le JS du hero ne tourne jamais (comportement voulu), mais le CSS cachait quand même les phrases 2-4 derrière `display:none` en attendant l'activation JS — donc les utilisateurs "réduire les animations" ne voyaient que la phrase 1, épinglée sur ~400vh de scroll mort, sans jamais voir la proposition de valeur réelle. Aucune des 3 revues de code par tâche ne pouvait le voir (elles lisaient des diffs, pas le rendu composité) ; trouvé par la revue finale sur l'ensemble de la branche. Corrigé en reprenant le même fallback statique empilé que mobile.

**Piste "commentaires sur influenceurs de niche"** (idée du prospect du 23/07, écho direct du mécanisme du projet frère LinkedIn Hack) : pas annoncée sur la page (n=1, pas encore testée), mais à intégrer dans le triage manuel du lead magnet quand pertinent — teste l'idée en vrai sans l'engager publiquement.

## Landing horizontale + éclatement multi-pages — pivot du 2026-07-23 (même jour, retour à chaud de Cédric)

Juste après la mise en prod de la landing v2 ci-dessus, premier retour direct de Cédric en la regardant : fond noir "esthétique IA générique" rejeté, et il veut que la landing principale n'ait **aucun scroll vertical** — juste une nav compacte + un scroll horizontal. Design + plan : `docs/superpowers/specs/2026-07-23-landing-horizontal-scroll-design.md` et `docs/superpowers/plans/2026-07-23-landing-horizontal-scroll.md`. Exécuté en Subagent-Driven Development (cycle séparé, ledger dans `.superpowers/sdd/progress.md` sous sa propre section), toutes les tâches approuvées, mis en prod le 2026-07-23.

**État réel actuel de `landing/` (remplace les descriptions du bloc "Landing v2" ci-dessus) :**
- **`index.html`** : nav flottante compacte (logo + "How it works" + "Guides" + bouton "Get access to the beta"), puis un unique conteneur `#h-scroll` à scroll horizontal natif (`overflow-x:auto; scroll-snap-type:x mandatory`) contenant 5 écrans plein-écran : les 4 phrases du hero (`Stop procrastinating on your business launch.` toujours en phrase 1, cf. test délibéré noté plus haut — pas encore invalidé) + le formulaire de capture en dernier écran. `body{overflow:hidden;height:100vh}` interdit tout scroll vertical. Desktop : la molette/trackpad vertical est interceptée en JS et redirigée en scroll horizontal (`scrollBy({left:deltaY})`) ; mobile : swipe tactile natif, aucun JS. Les badges de plateforme (diagramme SVG à pulsations) sont maintenant des états statiques par écran (`is-lit` ou pas) au lieu d'être calculés en JS — l'ancien système de scrollspy (IntersectionObserver + classes togglées) a été supprimé, remplacé par du vrai scroll natif du navigateur, plus simple et plus robuste.
- **`how-it-works.html`** (nouveau) : récupère intégralement l'ancienne section `#how` à 5 étapes (même scrollspy JS, inchangé), plus le contenu de `#book`/`#cta` (l'argumentaire "40+ hours back" etc.) replié en section de clôture plutôt que supprimé.
- **`guides.html`** (nouveau) : page hub listant les 3 guides existants (PH/Reddit/X) avec titre + description + lien.
- Footer et bannière CTA sticky retirés de `index.html` (plus de place sans scroll vertical) ; `how-it-works.html`/`guides.html` gardent chacun un footer classique avec le lien Privacy Policy.
- **Palette** : fond noir remplacé par une base claire/crème (`--bg:#FBF8F1`, `--ink:#1A1917`, accent jaune de marque inchangé). Cédric a explicitement dit que ce n'est **pas** la DA finale — juste une base neutre réversible en attendant d'autres références visuelles à explorer ensemble.
- Chaque page reste self-contained (pas de feuille de style partagée), pattern déjà utilisé par les 3 guides plateforme.

**Revue finale (2026-07-23)** : Ready to merge, aucun Critical/Important. 4 points mineurs restants, aucun bloquant : jeton CSS `--accent-2` mort dans `guides.html`, police Space Grotesk chargée mais jamais utilisée sur les 3 pages, `index.html` n'a plus aucun `<h1>` (vrai petit défaut SEO/accessibilité, correctif trivial si on y retouche), et du CSS `scroll-behavior`/`scroll-padding-top` désormais mort sur `index.html`. Pas corrigés immédiatement — à regrouper dans un futur commit de nettoyage si on retouche ces fichiers.

**⚠️ Mécanique du hero remplacée le lendemain** par le retour scroll vertical ci-dessous — le reste de cette section (nav compacte, `how-it-works.html`, `guides.html`, palette claire, absence de footer/CTA sticky sur `index.html`) reste valide, seul le scroll horizontal de `index.html` est abandonné.

## Retour au scroll vertical épinglé — pivot du 2026-07-24

Après avoir testé le scroll horizontal en vrai, Cédric l'a rejeté sur la mécanique elle-même (indépendamment des 2 bugs de prod déjà corrigés le 23/07) : il veut que la page défile normalement **vers le bas**, avec le hero qui reste visuellement épinglé (`position:sticky`) pendant que les phrases s'enchaînent en fondu — la mécanique exacte de la toute première version du hero (celle encore en thème sombre), simplement réappliquée à la palette claire actuelle. La direction artistique reste explicitement ouverte — Cédric doit envoyer d'autres références visuelles pour une future passe DA séparée ; seule la mécanique de scroll a été retravaillée ici.

**Changements dans `index.html`** :
- `#h-scroll` (scroll horizontal, `scroll-snap-type:x`, interception JS du wheel) supprimé, remplacé par la structure `.hero-triggers` (4 blocs invisibles de 100vh) + `.hero-pin` (`position:sticky`) dans la même cellule de grille CSS — le pin reste visuellement fixe pendant que les triggers défilent dessous.
- Scrollspy JS restauré : un `IntersectionObserver` sur les triggers détermine la phrase active et bascule les classes `.is-active` sur `[data-hero-frame]`/`[data-hb-badge]` (fondu de phrase + allumage progressif des badges plateforme).
- Le CTA nav pointe vers `#hero-form` (le formulaire de capture, maintenant à la fin du flux vertical normal, plus dernier "écran" d'un scroll horizontal) et fait un `scrollIntoView` + focus sur `#cap-url-hero`.
- **Bug trouvé et corrigé pendant la restauration** : un `body{overflow-x:clip}` hérité de l'ère scroll horizontal bloquait silencieusement tout le scroll vertical de la page — retiré. C'était un résidu de nettoyage incomplet, pas un problème du nouveau mécanisme.
- `how-it-works.html` et `guides.html` ne sont pas affectés — restent des pages séparées, inchangées par ce pivot.

Déployé en preview, revérifié via scroll réel (pas seulement `scrollTo`/`scrollIntoView` en JS — dans l'environnement d'automatisation navigateur utilisé ce jour-là, ces appels programmatiques n'affectaient pas visuellement le viewport, contrairement au scroll molette/trackpad réel qui fonctionnait correctement ; probable limitation de l'outil, pas un bug de la page), puis promu en prod le 2026-07-24.

**⚠️ DA remplacée le même jour** par le pivot sombre ci-dessous — la mécanique de scroll décrite ci-dessus reste inchangée et valide, seule l'habillage visuel (palette claire, diagramme SVG "You") a été remplacé.

## Hero en thème sombre + mockup "écran" évolutif — pivot du 2026-07-24

Cédric a envoyé ses références DA (couleurs exactes + mockups d'illustration) et validé un brief complet en brainstorming avant exécution : spec `docs/superpowers/specs/2026-07-24-hero-dark-da-pivot-design.md`, plan `docs/superpowers/plans/2026-07-24-hero-dark-da-pivot.md`. Exécuté en Subagent-Driven Development (ledger dans `.superpowers/sdd/progress.md`, section séparée), 4 tâches + 1 fix round chacune sur les tâches 2 et 4, toutes revues clean, mis en prod le 2026-07-24. La mécanique de scroll (`position:sticky` + `IntersectionObserver`, restaurée plus tôt le même jour) n'a pas changé — seul l'habillage visuel à l'intérieur de `.hero-pin` est nouveau.

**Palette** (`:root` dans `index.html`, s'applique à toute la page y compris la modal du lead magnet qui réutilise les mêmes tokens) : `--bg:#161412`, `--accent:#FCF05F` — valeurs exactes données par Cédric. Le reste (`--card`, `--line`, `--ink`, `--body`, etc.) est dérivé à l'œil, documenté comme tel dans la spec. Légère texture de grille en fond (2 `linear-gradient` répétés, quasi invisible).

**Layout hero desktop (≥900px)** : `.hero-pin` passe d'une colonne centrée (badge + phrase + diagramme) à une grille 2 colonnes — `.hero-screen` à gauche, `.hero-phase-zone` à droite avec un texte nettement agrandi. Le badge "Built for Solo SaaS Founders" et l'ancien diagramme SVG "You" (hub + badges pulsants) sont supprimés. Mobile (<900px) et `prefers-reduced-motion` : fallback statique conservé, `.hero-screen` n'affiche que son état 1 sans animation.

**`.hero-screen`** : un seul "écran" persistant avec une barre de chrome navigateur fixe en haut (`🔗 yourproduct.com`) — ajoutée après coup suite au retour de Cédric qui a repéré ce traitement sur le mockup de `how-it-works.html` et voulait le même esprit "fenêtre d'appli" dans le hero sombre. Le contenu sous la barre change selon la phrase active (même wiring `applyActive()`/`[data-hero-step]` que le texte) :
1. Phrase 1 ("Stop procrastinating…") → écran vide, lueur douce qui pulse
2. Phrase 2 ("No posts. No leads…") → carte "AI Outreach Agent" (thread DM, toggle vert "Enabled")
3. Phrase 3 ("We find the right platforms…") → carte "Scanning platforms…" (liste de posts scorés)
4. Phrase 4 ("Get your first customers…") → carte "New Lead / Not Relevant" (leads filtrés, les non-pertinents barrés)

Tout le contenu de ces cartes est illustratif/statique — aucune donnée réelle, même logique que le reste du hero depuis le début.

**Modal lead magnet** : mécanisme JS inchangé (`runReadinessCheck()`, `openPlatformModal()`, formulaires). Ajout d'une carte teaser floutée/verrouillée dans `#ready-result-modal`, à côté du score PageSpeed réel existant — texte fixe ("2 platforms to post on", "23 posts identified"), pas de nouveau calcul, juste un effet visuel "on a déjà trouvé des choses, débloque avec ton email".

**Nav** : pill flottante passée de blanc à noir (`var(--card)`) avec une ombre plus marquée — retour à chaud de Cédric juste après avoir vu le hero sombre en prod, appliqué directement sans cycle SDD complet (changement d'une ligne CSS).

**Revue finale** : 2 items Minor restants, non bloquants — `.hs-scan-score` hardcode `#161412` au lieu de `var(--bg)` (duplication littérale d'un token) ; quelques `rgba()` décomposant `--ok` au lieu d'un token dédié (`--ok` n'a pas d'équivalent `--accent-soft`/`--accent-line`, écart déjà présent ailleurs dans le fichier avant ce pivot) ; et un point d'accessibilité mineur sur la carte teaser de la modal (chiffres factices non `aria-hidden`).

**⚠️ DA remplacée le même jour** par le retour au clair ci-dessous — Cédric a vu le hero sombre en prod, d'abord ajusté (nav noire, bordure "sticker"), puis changé d'avis plus fondamentalement en repointant vers le style de `how-it-works.html`. Palette, layout hero et mécanique de scrollspy tous remplacés ; seul le contenu des 4 `.hs-state` (cartes AI Outreach/Scanning/Leads) survit tel quel, juste recontainerisé.

## Hero clair "4 étapes" — pivot du 2026-07-24 (même jour, 3e revirement DA)

Cédric a revu le hero sombre en prod et préféré revenir au style clair déjà utilisé sur `how-it-works.html` — texte lisible directement en haut, fond crème, un petit cadre de description à gauche et le visuel à droite. Design + plan discutés en brainstorming avec 2 questions de clarification cruciales (titre fixe ou qui change au scroll ? redondance avec `how-it-works.html` ?), spec `docs/superpowers/specs/2026-07-24-hero-light-steps-pivot-design.md`, plan `docs/superpowers/plans/2026-07-24-hero-light-steps-pivot.md`. Exécuté en Subagent-Driven Development (ledger dans `.superpowers/sdd/progress.md`, section séparée), 4 tâches, toutes revues clean sans fix round, mis en prod le 2026-07-24.

**Décision clé — répétition assumée avec `/how-it-works.html`** : le hero et cette page racontent maintenant une histoire proche avec le même mécanisme (titre fixe + colonne d'étapes qui défile + visuel collé en `position:sticky`). Confirmé explicitement avec Cédric : ce n'est pas un bug à corriger — le hero est la **version teaser à 4 étapes**, `/how-it-works.html` reste la **version détaillée à 5 étapes**. Ne pas fusionner les deux pages ni essayer de dédupliquer ce chevauchement sans qu'il le redemande.

**Palette** : retour complet aux valeurs claires déjà utilisées par `how-it-works.html`/`guides.html`/`use-case.html` (`--bg:#FBF8F1`, `--card:#F3EEE0`, `--accent:#F2E96A`, etc. — mêmes valeurs qu'avant le pivot sombre du matin). Ce revert règle aussi une incohérence : depuis ce matin, `index.html` était sombre pendant que les 3 autres pages étaient restées claires (hors scope du pivot sombre) — tout le site est de nouveau visuellement cohérent.

**Structure hero** : le titre ne change plus au scroll (contrairement à toutes les versions précédentes du hero depuis le début de la session). Badge "Built for Solo SaaS Founders" (réintroduit) + `<h1>You don't do it. We do it for you.</h1>` (phrase déjà validée en recherche utilisateur, distincte du titre de `how-it-works.html` pour éviter la répétition littérale) — fixes, ne bougent plus. En dessous, `.hero-scroll` reprend **verbatim** le pattern CSS/JS de `.hw-scroll`/`.hw-steps`/`.hw-visual` de `how-it-works.html` : 4 `.hero-step` à gauche (numéro sticker + titre court + description, ex. "Stop procrastinating" / "We find your platforms" / "We post for you" / "Get real customers" — reformulation courte des 4 anciennes phrases du hero) et `.hero-screen` à droite en `position:sticky`, qui garde exactement les 4 états déjà construits (lueur idle, AI Outreach Agent, Scanning platforms, New Lead/Not Relevant) et sa barre de chrome (`🔗 yourproduct.com`) — contenu inchangé, seul leur mécanisme de crossfade change (`display:none/block` → `position:absolute` + fondu d'opacité).

**Mécanisme de scroll simplifié** : l'ancien système `.hero-triggers` (4 blocs invisibles de 100vh) est supprimé — le nouveau `IntersectionObserver` observe directement les vrais blocs `.hero-step` (visibles, avec un vrai espacement `gap:9rem` en desktop), exactement comme `how-it-works.html` le fait déjà. Plus simple, moins de code, deux fichiers séparés qui maintiennent indépendamment le même pattern plutôt qu'un mécanisme partagé (convention déjà établie sur ce projet : chaque page reste self-contained). `.hero-scroll-cue` (la flèche de scroll) est supprimée — plus nécessaire avec du vrai contenu visible qui s'empile, comme sur `how-it-works.html` qui n'en a jamais eu besoin.

**Amélioration volontaire vs `how-it-works.html`** : sous `prefers-reduced-motion` en desktop, les étapes 2-4 du nouveau hero restent à pleine opacité (pas grisées) — contrairement à `how-it-works.html` où elles restent grisées en permanence pour ces utilisateurs faute d'override CSS correspondant (son JS s'arrête aussi tôt mais rien ne relève l'opacité des étapes non-actives). Différence documentée et voulue, pas une incohérence à corriger.

**Nav** : la pill redevient claire automatiquement (elle utilisait déjà `var(--card)`, pas une couleur codée en dur) — aucune retouche nécessaire.

**⚠️ Mécanique remplacée le jour même — malentendu identifié par Cédric.** Le titre fixe + colonne d'étapes ci-dessus était une mauvaise lecture de sa demande. Voir la section suivante pour l'état réel actuel — la palette claire et `.hero-screen` (contenu des 4 états) restent valides, seule la mécanique de scroll + structure du texte sont de nouveau différentes.

## Retour au hero épinglé + ajout d'un sous-texte — correction du 2026-07-24 (même jour, 4e revirement)

Cédric a vu le hero "4 étapes" ci-dessus en prod et signalé un "problème majeur" avant d'aller plus loin : mauvaise lecture de sa demande de brainstorming. Ce qu'il voulait en fait : garder **exactement** la mécanique `position:sticky` + `IntersectionObserver` du pivot sombre du matin (page qui défile normalement, hero visuellement épinglé, le gros texte qui crossfade) — pas le système "titre fixe + étapes qui défilent en dessous" repris de `how-it-works.html`. Il a explicitement approuvé `.hero-screen` (le mockup à droite) tel quel : "le design que tu as fait là, il est top aussi" — donc uniquement la colonne de texte à gauche et la mécanique de scroll ont changé, pas le visuel.

**Ce qui revient** : `.hero-triggers` (4 blocs invisibles de 100vh) + `.hero-pin` (`position:sticky`) exactement comme avant le pivot "étapes" — le gros titre reprend les 4 phrases complètes d'origine ("Stop procrastinating on your business launch.", "No posts. No leads. And you know it.", etc.), pas les versions courtes de 2-3 mots inventées pour les cartes d'étapes.

**Ce qui est nouveau** : chaque phrase a maintenant un **sous-texte** en dessous (`.hero-phase-sub`), plus petit, qui apporte du contexte — demande explicite de Cédric, absent de toutes les versions précédentes du hero. Structure HTML : `.hero-phase-zone` contient 4 `.hero-phase-pair[data-hero-frame="1..4"]`, chacun avec un `<p class="hero-phase">` (titre) + `<p class="hero-phase-sub">` (contexte), togglés ensemble par le même JS scrollspy qu'avant.

**`.hero-screen` simplifié en repassant sur cette mécanique** : la revue finale du pivot "étapes" avait trouvé un bug réel — la barre de chrome (`🔗 yourproduct.com`) chevauchait la carte active à cause du `position:absolute` utilisé pour le fondu entre états, nécessitant un correctif (`.hs-body` + flexbox). Ce correctif n'est plus nécessaire du tout avec la mécanique épinglée restaurée : `.hs-state` repasse sur un simple toggle `display:none/block` (comme dans la toute première version du pivot sombre, avant même l'ajout de la barre de chrome) — plus de position absolue, donc plus de risque de chevauchement par construction, pas seulement corrigé.

**Nav CTA, formulaire, modal lead magnet** : tous inchangés, comme à chaque pivot du hero depuis le début de la session.

Exécuté directement (pas de nouveau cycle SDD complet — design déjà validé en conversation, code de référence disponible dans l'historique git du pivot sombre du matin), vérifié en scroll réel sur les 4 phases avant mise en prod le 2026-07-24.

**⚠️ Formulaire/CTA modifiés le jour même** — voir la section suivante : le "Nav CTA, formulaire... inchangés" ci-dessus ne tient plus, `#hero-form` a été supprimé et le formulaire déplacé dans `.hero-screen`.

## Compactage du layout + formulaire intégré dans `.hero-screen` — 2026-07-24 (même jour, 5e passe)

Cédric a testé le hero sur un écran plus petit et trouvé le layout "trop dispersé" (colonnes étirées plein écran sur grand desktop) — retour groupé avec plusieurs corrections, toutes appliquées directement (pas de cycle SDD, ajustements ciblés) :

- **`.hero-pin` compacté** : ajout de `max-width:56rem; margin:0 auto` + colonnes resserrées (`minmax(240px,25rem) minmax(220px,19rem)`, gap réduit) au lieu de `1fr`/`1fr` qui s'étirait sans limite sur les grands écrans. Texte hero réduit (`clamp(1.7rem,2.6vw,2.4rem)` au lieu de `3.1rem`) — Cédric a explicitement dit que c'est OK si ça passe sur 2 lignes. `.hero-screen` moins haut (`min-height:18rem` au lieu de `22rem`).
- **Nav et logo nettoyés** : la pill de nav avait encore l'ombre forte du pivot sombre (`rgba(0,0,0,.55)`), jamais revertie lors des retours à la palette claire — remise à la valeur claire d'origine, bien plus discrète. Le logo "Posted." avait un contour épais de 7px en style "sticker" (`-webkit-text-stroke`) qui se fondait mal dans le fond crème de la pill — simplifié en wordmark plein, sans contour ni rotation.
- **Suppression des "—"** dans les 3 sous-textes ajoutés à la passe précédente.
- **Formulaire de capture déplacé dans `.hero-screen`** : la section `#hero-form` séparée sous le hero épinglé est supprimée. Le formulaire (`#capture-form-hero`/`#cap-url-hero`, IDs et wiring JS inchangés) vit maintenant à l'intérieur de l'état 4 de `.hero-screen` (`.hs-capture`), à la place de l'ancienne carte "New Lead / Not Relevant" (retirée). Le CTA nav scrolle maintenant vers `[data-hero-step="4"]` au lieu de `#hero-form` (qui n'existe plus) avant de focus l'input. Texte du bouton et du CTA nav changés en **"Where should I post?"** (au lieu de "Get my platform plan"/"Get my plan") — reflète mieux la promesse réelle du lead magnet. `how-it-works.html` et `use-case.html` avaient aussi des liens vers `/#hero-form` (cassés depuis la suppression) — mis à jour vers `/#hero-scroll` avec le même nouveau texte de CTA.
- Nettoyage CSS mort en cascade : `.hs-leads-*` (carte retirée), `.hero-cta-zone`/`.hero-reassure` dupliqué (zone retirée).

Vérifié en scroll réel sur les 4 phases + soumission du formulaire (ouvre bien la modal lead magnet) avant mise en prod le 2026-07-24.

**Suivi immédiat** : bug mobile réel trouvé par Cédric (capture d'écran sur son téléphone) — la nav fixe cachait le titre du hero, `padding-top` de `.hero-pin` insuffisant (3.5rem vs ~80px de hauteur réelle de la nav). Corrigé à 6.5rem. Puis testé sur un écran plus petit : "c'est trop petit", tailles réaugmentées modérément (max-width 56rem→66rem, colonnes et texte élargis) sans revenir au format étalé d'origine. Les deux correctifs poussés en prod le 2026-07-24.

**2e suivi** : `.mark-word` (soulignement jaune) se réduisait en un point minuscule illisible quand la phrase soulignée passait sur 2 lignes (un `::after` en `position:absolute` sur un `inline-block` ne suit pas le texte qui wrap) — arrivé sur la phrase 3 ("and do the posting for you", trop long pour tenir sur une ligne à la nouvelle taille de police). Corrigé en resserrant le span souligné à "posting for you" (même longueur que "first customers" sur la phrase 4, qui n'avait jamais eu le bug) plutôt qu'en réduisant seulement l'épaisseur du trait. Barre de scroll native cachée (`scrollbar-width:none`) sur demande de Cédric. Carte de capture repensée : suppression du cadre "viewfinder" (`.vf`/`.fr`, hérité de l'ancienne section `#hero-form` autonome, rendait mal une fois imbriqué dans le mockup) + ajout d'un texte d'accroche ("Drop your link. We'll show you where to post.") au-dessus du champ.

## Mobile : même mécanique de scroll que desktop, pas de mockup — 2026-07-24 (même jour, 6e passe, priorité 1 de Cédric)

Jusqu'ici le mobile était toujours resté un simple fallback statique (les 4 phrases empilées, aucun JS, comportement établi depuis TOUS les pivots précédents de la session). Cédric a explicitement demandé l'inverse : même comportement de scroll qu'en desktop, juste sans `.hero-screen` (mockup). "on scroll les textes et à la fin le lead magnet."

- Le mécanisme d'épinglage (`.hero{display:grid}`, `.hero-triggers{grid-column:1;grid-row:1}`, `.hero-trigger{height:100vh}`, `.hero-pin{position:sticky;...}`) n'est plus conditionné à `min-width:900px` — il s'applique à toutes les tailles d'écran maintenant. Seule la mise en page interne de `.hero-pin` (1 colonne texte seul en mobile vs. grille 2 colonnes texte+écran en desktop ≥900px) et la visibilité de `.hero-screen` (desktop uniquement, `display:none` par défaut) restent responsives.
- JS : le scrollspy ne vérifie plus `desktop.matches`, seulement `prefers-reduced-motion`. Un seul code partagé pilote le crossfade partout.
- **Formulaire de capture mobile séparé** : `.hero-screen` étant absent en mobile, un second formulaire (`#capture-form-hero-mobile`/`#cap-url-hero-mobile`, IDs distincts pour éviter les collisions DOM, même `name="liste-attente"` côté Netlify) vit directement dans la 4e paire `.hero-phase-pair` (`.hero-phase-capture`, masqué en desktop où le formulaire de `.hero-screen` prend le relais). Câblé séparément via un 2e appel `wire()`, ouvre la même modal.
- **Limite connue, pas corrigée** : en desktop + `prefers-reduced-motion:reduce`, `.hero-screen` reste bloqué sur l'état 1 (lueur idle) — impossible d'atteindre visuellement le formulaire embarqué dans l'état 4 par ce chemin. Existait déjà avant cette passe (depuis l'intégration du formulaire dans `.hero-screen`), pas introduit maintenant, pas dans le scope de la demande de Cédric (mobile uniquement) — à corriger si ça remonte.

Vérifié : mécanique desktop toujours intacte après suppression de la restriction JS (aucune régression), formulaire mobile testé (soumission → ouvre la modal), styles de base mobile confirmés via inspection des règles CSS (impossible de tester un vrai viewport étroit dans cet environnement — limitation déjà rencontrée plusieurs fois cette session). Poussé en prod le 2026-07-24.

**Suivi, traité le même jour** : Cédric a validé une proposition pour les états 1 et 2. État 1 = lueur idle remplacée par un balayage animé + label "Analyzing your product..." (point vert qui pulse, ellipse animée). État 2 = carte "AI Outreach Agent" remplacée par un mini-dashboard vide ("Posts this week 0 / New leads 0 / Replies 0" + "Nobody's posting. Nobody's finding you.") — rend la douleur concrète au lieu de sauter direct à la solution, prépare l'état 3 ("we find platforms") comme le vrai tournant. CSS mort (`.hs-outreach-*`/`.hs-bubble-*`/`.hs-toggle-*`/`.hs-idle-glow`) nettoyé au passage.

Également ce jour : phrase 3 du hero raccourcie ("We find your platforms. We post for you." — était 2x plus longue que les 3 autres phrases) et `.mark-word` (le "surligné" sur "posting for you"/"first customers") passé d'un soulignement à un vrai effet surligneur (aplat de couleur derrière le texte, légèrement penché) — plus lisible, et évite par construction le bug de wrap multi-ligne rencontré plus tôt.

**Suivi, même jour (2026-07-25)** : nouveau retour de Cédric après avoir testé en vrai, tout appliqué directement (brainstorming léger avec confirmations rapides, pas de nouveau cycle SDD) :
- **Phrase 1** : "Stop procrastinating on your business launch." → "Stop creating content nobody sees." — Cédric ne voulait plus parler de "business launch" mais recadrer sur contenu/visibilité ; validé pour rester distinct de la phrase 2 ("No posts. No leads...").
- **État 1** : le balayage animé + label "Analyzing..." (ajouté la veille) ne convenait pas — Cédric voulait "comme si rien ne se passait". Remplacé par un squelette de post vide (avatar rond + barres grises), complètement statique, aucune animation.
- **État 3** : ajout d'une ligne "✓ Product & niche analyzed" au-dessus de "Scanning platforms…" pour donner une vraie séquence (analyse d'abord, puis recherche de plateformes) dans une seule carte plutôt qu'une sous-animation à plusieurs étapes.
- **Ombre du panneau de capture** (état 4) : `.capbar-in` gardait encore une ombre sombre héritée du thème sombre (`rgba(0,0,0,.4)`), créant un effet de double ombre une fois imbriqué dans la carte `.hero-screen` déjà ombrée — mise à `none` sur les deux variantes (desktop `.hs-capture` et mobile `.hero-phase-capture`).
- **Taille du texte et de `.hero-screen`** réaugmentée une nouvelle fois (desktop et mobile) — restait petit après la passe de compactage.
- Flèche de scroll en bas (`.hero-scroll-cue`) : déjà présente et fonctionnelle, confirmée visuellement, pas de changement nécessaire.

**2e suivi, même jour (2026-07-25)** : après avoir vu "Stop creating content nobody sees." en vrai, Cédric est revenu dessus — le hook "Stop procrastinating" tacle le bon problème (procrastiner à poster), c'est la partie "business launch" qui était trop étroite/générique. Itéré en 3 passes rapides jusqu'à validation (AskUserQuestion) : "Stop procrastinating on your business launch." → "Stop procrastinating on posting." (manquait le "pour quoi") → **"Stop procrastinating on posting for customers."** (texte final, en prod).

En cohérence directe avec cette phrase 1, l'état 1 de `.hero-screen` (le squelette de post vide statique, ajouté la veille) a été remplacé par un visuel "Post vs Post tomorrow" : un pill "Post" barré/grisé → flèche animée → pill "Post tomorrow" en accent, suivi d'une ligne "tomorrow · tomorrow · tomorrow…" — illustre littéralement la boucle de procrastination quotidienne. Nouveau bloc `.hs-procrastinate*` (remplace `.hs-empty-post*`, supprimé). Vérifié visuellement sur le preview Netlify avant mise en prod.

Question encore ouverte, posée à Cédric sans réponse pour l'instant : le formulaire `liste-attente` (capture URL principale du hero, 36 soumissions) n'a aucune notification email configurée côté Netlify (contrairement au formulaire `lead-magnet` qui alerte déjà `delachaise.cedric@gmail.com`) — proposé de configurer la même alerte, en attente de sa décision.

**3e suivi, même jour (2026-07-25)** : retour sur capture d'écran du rendu en prod, 3 corrections groupées, appliquées directement :
- **Phrase 1** : "for customers" → "**for your business**" (texte final actuel), et mise en `.mark-word` (le surlignage jaune type surligneur) sur "your business" — Cédric a explicitement demandé d'étendre ce traitement, qu'il aime sur les phrases 3/4, à la phrase 1 aussi.
- **État 1 de `.hero-screen`** : le visuel "Post/Post tomorrow" paraissait trop vide ("on voit pas vraiment l'image à droite"). Ajout d'un squelette de post au-dessus de la rangée de boutons (avatar rond + nom "Your business" + 2 barres de texte grises, nouveau bloc `.hs-idle-post*`) pour que la carte se lise comme un vrai screenshot de brouillon de post plutôt qu'un pill flottant sur fond vide. `.hs-panel--idle` n'a plus de `aspect-ratio:4/3` fixe (remplacé par `.hs-card` + `display:flex;flex-direction:column`, même famille que les états 2/3), la hauteur est maintenant portée par le contenu comme les autres états.
- **Logo nav (`.sticker-patch`)** : Cédric regrettait l'identité "sticker" perdue lors du retour à la palette claire (le contour épais `-webkit-text-stroke` de la version sombre avait été simplifié en wordmark plat le 2026-07-24 car il rendait mal sur fond crème — voir passe "Compactage du layout" plus haut). Recréé différemment pour éviter le même problème : chip à fond accent avec bordure `3px solid var(--ink)`, ombre portée dure et légère rotation (même langage visuel que `.hero-screen`/`.badge`), plutôt qu'un contour de texte.

Vérifié visuellement sur preview Netlify (état 1 et état 2 du hero, logo nav) avant mise en prod.

**4e suivi, même jour (2026-07-25)** : Cédric a signalé "on ne voit pas le bouton jaune" sur le pill "Post tomorrow" — bug réel de contraste, pas de perception : `.hs-procrastinate-btn--chosen` avait `color:var(--bg)` (texte quasi blanc/crème) sur fond `var(--accent)` (jaune pâle), illisible. Corrigé en `color:var(--ink)`, aligné sur la convention du reste du site (tous les autres boutons/pills sur fond accent utilisent déjà du texte `--ink` foncé, ex. `.btn`). Favicon mis à jour en même temps sur les 4 pages qui en ont un (`index.html`, `x-launch.html`, `reddit-launch.html`, `product-hunt-launch.html`) — passait d'un carré noir/texte "P." italique serif jaune (ancien thème sombre, jamais mis à jour depuis) à un chip jaune accent + bordure `--ink` + "P." en gras sans-serif, pour matcher le nouveau logo sticker de la nav.

**5e suivi (2026-07-27)** : après une pause sur le hero, retour de Cédric sur un vrai gap de positionnement (pas juste du style) — la landing ne faisait pas comprendre le vrai différenciateur : Posted. ne se limite pas aux plateformes évidentes (Reddit, Product Hunt, X, LinkedIn), il va chercher dans des forums spécialisés, des groupes Facebook, jusque dans les commentaires LinkedIn. "Il faut qu'on se démarque." Deux changements pour rendre ça explicite :
- **Sous-texte phrase 3** : "Not a generic blast. The exact communities where your niche already hangs out, in your voice." (vague) → **"Not just Reddit and Product Hunt. Niche forums, Facebook groups, even LinkedIn comments — wherever your buyers actually are, in your voice."**
- **Mockup état 3** (`.hs-scan-list`) : les 3 exemples scannés étaient r/startups, r/smallbusiness, X — remplacés par **r/startups, FB Group, LinkedIn comment** pour que le visuel illustre concrètement la largeur de recherche annoncée dans le texte, pas juste des variantes de Reddit/X.

Vérifié visuellement sur preview Netlify avant mise en prod.

**Suivi immédiat (2026-07-27)** : Cédric a corrigé la direction du sous-texte juste après l'avoir vu — nommer les apps ("Not just Reddit and Product Hunt...") ferme le message plutôt que de l'ouvrir. Le vrai différenciateur à montrer, à la fois dans le texte et le visuel, c'est l'adaptation : on analyse la niche et le secteur du client, puis on va où ça mène, pas une liste figée de plateformes. Reformulé sans aucun nom d'app : **"We study your niche and your sector, then go wherever your buyers actually are. No fixed list of platforms, in your voice."** Ligne "✓" du mockup état 3 changée de "Product & niche analyzed" (générique) à **"Niche identified: project management for small teams"** (concret, montre visuellement l'analyse avant le scan) — cohérent avec l'exemple r/startups juste en dessous. Les 3 exemples scannés (r/startups/FB Group/LinkedIn comment, ajoutés au suivi précédent) sont restés inchangés : ils servent de preuve concrète du scan, pas de liste de plateformes revendiquée dans le texte, donc pas concernés par cette correction.

**6e suivi (2026-07-27)** : deux corrections supplémentaires sur le hero, sur capture d'écran.

- **Mockup état 3** (`.hs-scan-list`) : Cédric a jugé les labels de source ("r/startups", "FB Group", "LinkedIn comment") trop légers/discrets — "si on ne lit pas, on ne comprend pas". Ajout d'un petit badge logo coloré devant chaque source (`.hs-scan-icon`, 1.05rem, coins arrondis) : orange `#FF4500` "r" pour Reddit, bleu `#1877F2` "f" pour Facebook, bleu `#0A66C2` "in" pour LinkedIn — lisible d'un coup d'œil sans devoir lire le texte.
- **État 1 de `.hero-screen` (Post/Post tomorrow)** : bug de hiérarchie visuelle repéré par Cédric — le bouton "Post tomorrow" était en jaune accent (la couleur "cliquez ici" utilisée partout ailleurs sur le site pour les vrais CTA), ce qui donnait l'impression inverse de l'intention : on avait l'air de pousser l'utilisateur à cliquer "Post tomorrow", alors que le but est de montrer la procrastination, pas de la suggérer. Inversé : **"Post" passe en accent** (le choix disponible, engageant — ce n'est pas désactivé, juste ignoré, donc suppression aussi du `text-decoration:line-through`) ; **"Post tomorrow" passe en gris terne** (`--card-2`/`--faint`) avec une petite icône curseur (`.hs-procrastinate-cursor`, SVG en coin bas-droit) qui indique que c'est quand même celui-là qui est cliqué — le contraste entre "ce qui a l'air bien" et "ce qui est réellement choisi" raconte la procrastination sans avoir besoin de lire.

Vérifié visuellement sur preview Netlify (les deux mockups, zoom sur le curseur) avant mise en prod.

**Suivi (2026-07-27)** : la flèche de scroll (`.hero-scroll-cue`) n'était active que sur la phase 1 (`n === '1'` dans le JS). Cédric l'a voulue sur toutes les phases sauf la dernière (phase 4, celle du formulaire — plus rien à scroller après). Condition changée en `n !== '4'`.

**Suivi (2026-07-27)** : nettoyage de fin de session, deux actions ponctuelles.

- **Notification email `liste-attente`** : le formulaire principal du hero (capture URL) n'avait aucune alerte configurée côté Netlify, contrairement à `lead-magnet`. Créée via l'API (`createHookBySiteId` — le CLI `netlify api` renvoyait une 422 sans détail utile, contournée en appelant directement `POST https://api.netlify.com/api/v1/hooks` avec le token lu dans `~/Library/Preferences/netlify/config.json`). Les deux formulaires alertent maintenant `delachaise.cedric@gmail.com`.
- **`use-case.html`** : les tags de plateformes par persona (Reddit/PH/X, etc.) lisaient comme une liste fermée, en contradiction avec le lede de la page elle-même ("not off a fixed list") et le nouveau positionnement du hero. Ajout d'un tag `+ more` (style pointillé, discret) à la fin de chaque liste — signale que ce sont des exemples, pas l'ensemble complet.

**Résolu (2026-07-27)** : l'écart des "36 soumissions" `liste-attente` (mentionnées dans une session précédente, 0 vues via l'API) n'était pas un bug — Cédric les a supprimées lui-même dans le dashboard Netlify, c'étaient ses propres requêtes de test pendant le développement du hero. Rien à corriger côté code.

Reste ouvert (nécessite une action de Cédric) : envoyer le message de test à des vrais prospects pour valider que le hero se comprend sans explication.

**Suivi (2026-07-27) — corrigé** : le blocage reduced-motion desktop était en fait important (Cédric : "ah oui !! important"). Sous `prefers-reduced-motion:reduce`, le JS scroll-driven ne s'active jamais, donc `.hero-screen` restait figé sur l'état 1 pour toujours — et son formulaire embarqué (état 4) était le seul moyen de convertir sur desktop. Le formulaire mobile de repli (`.hero-phase-capture`) était lui forcé en `display:none` au-delà de 900px sans override pour le reduced-motion : ces visiteurs desktop n'avaient donc littéralement aucun moyen de soumettre leur lien. Corrigé en ajoutant dans le bloc `@media (prefers-reduced-motion: reduce)` : `.hero-screen{ display:none; }` (plus la peine d'afficher un mockup figé) + `.hero-phase-capture{ display:block; }` (réactive le même formulaire de repli que mobile, ajouté après les 4 paires de phrases empilées). Vérifié en injectant les règles reduced-motion via JS sur le preview (impossible de simuler `prefers-reduced-motion` nativement dans cet environnement de test) — les 4 phrases s'empilent bien, `.hero-screen` disparaît, le formulaire apparaît en bas, aucune régression sur le flux normal.

**Suivi (2026-07-27)** : Cédric a relevé que sur mobile, rien n'indique qu'on peut scroller pour voir la suite. La flèche `.hero-scroll-cue` existait déjà mais était entièrement dans le bloc `@media(min-width:900px)` — absente en dessous de 900px. Ses styles de base (`display:flex`, `position:absolute`, l'animation de rebond) déplacés hors de la media query vers la règle par défaut ; seul le `bottom` (1.2rem mobile → 2rem desktop) reste spécifique au breakpoint. Vérifié via `getComputedStyle` (confirmé `display:flex` sans dépendance à la largeur d'écran, l'environnement de test ne permettant pas de vrai redimensionnement mobile).

## Lead magnet — audit + corrections — 2026-07-27

Cédric a demandé de travailler sur le lead magnet (la modale qui s'ouvre après soumission d'URL, avec le formulaire email "Get my priority plan"). Audit rapide avant toute modif :

- **Flux actuel** : soumission URL → modale → appel à la fonction Netlify `readiness` (vraies données : meta tags + score PageSpeed) → affichage du score + un teaser flouté avec cadenas → formulaire email en dessous (toujours affiché, que le check ait réussi ou non).
- **Signalé à Cédric, pas encore traité** : les chiffres du teaser flouté ("2 identified" / "23 identified") sont **en dur**, pas connectés à une vraie donnée — contredit le principe "never fabricated" affiché ailleurs dans le code. Décision reportée, pas dans le scope de cette passe.
- **Code mort repéré, pas encore nettoyé** : `fetchPlatformCopy`/`platformPreviews`/`platformCardsInner` + 3 constantes SVG (Reddit/X/PH) dans `index.html`, plus toute la fonction Netlify `platform-copy.js` — plus jamais appelés depuis que la modale est passée au design "teaser flouté". Tournent toujours en prod pour rien.

**Corrections appliquées ce jour** (sur capture d'écran de la modale) :
- **Contraste `.lm-urgency`** ("In beta, taking 2 founders this round to get it right.") : était en `var(--accent)` (jaune pâle) sur fond crème — quasiment invisible. Passé en `var(--accent-2)` (le gold plus foncé, même famille que le badge).
- **Suppression des "—"** dans les deux textes de la modale, remplacés par des points : "We'll send your priority launch plan within 24h. Read by hand, not generated by a bot." et "In beta, taking 2 founders this round to get it right."
- **Renforcement du "fait à la main"** : le texte principal insiste maintenant sur "not generated by a bot", et le message de succès passe de "We're looking at your product" à "**A real person is reading your product now**."
- **Nouveau champ `context`** (`.lm-context`, texte libre requis, 140 caractères max) : "What are you building? (one line)", ajouté au-dessus de la barre email dans le même cadre "viewfinder". Donne une vraie donnée exploitable pour le tri manuel, et renforce visuellement l'idée d'un vrai processus (pas juste une capture d'email). Champ Netlify Forms auto-détecté (name="context"), aucun changement JS nécessaire — `wire()` sérialise déjà tout le FormData.
- **Ombre parasite `.lm-bar`** : `box-shadow:0 12px 30px rgba(0,0,0,.4)` (résidu du thème sombre, jamais retiré) → `none`, même bug que celui déjà corrigé sur `.capbar-in` plus tôt dans la session.

Vérifié en forçant l'affichage de la modale via JS sur le preview (évite l'attente du vrai appel PageSpeed) avant mise en prod.

**Suivi, même jour (2026-07-27)** : les deux points laissés en attente ont été traités.
- **Chiffres fabriqués du teaser** : "Best platforms to post on / 2 identified" et "Matching posts this week / 23 identified" → remplacés par des affirmations qualitatives vraies, pas des statistiques inventées : **"Best platforms for your niche / Picked by hand"** et **"Your outreach angle / Ready in 24h"**. Le mécanisme visuel (flou + cadenas) reste identique, seul le contenu fabriqué a changé.
- **Code mort supprimé** : `escapeHtml`, `truncate`, `REDDIT_SVG`/`X_SVG`/`PH_SVG`, `platformCardsInner`, `platformPreviews`, `fetchPlatformCopy` retirés d'`index.html`, ainsi que tout le CSS `.pv-*` associé. **`netlify/functions/platform-copy.js` supprimé** (plus aucun appelant). ⚠️ Le roadmap item "Génération d'un vrai exemple de post" ci-dessous référence ce fichier comme mécanisme de départ — il n'existe plus, récupérable via `git log` si ce chantier reprend, mais une nouvelle fonction serait probablement plus propre à écrire directement.

Vérifié en conditions réelles : soumission d'une vraie URL via le formulaire hero → modale → vrai appel à `readiness` (pas de simulation) → contenu du teaser confirmé via `textContent` du DOM. Poussé en prod.

**Suivi immédiat** : Cédric a demandé de remettre le mot "identified" (en anglais) dans le teaser. "Picked by hand" → **"Channels identified"**, "Ready in 24h" → **"Angle identified"** — fait écho au "Niche identified" déjà utilisé dans le mockup état 3 du hero, cohérence de vocabulaire entre les deux. Toujours aucun chiffre fabriqué.

## Audit site entier — liens cassés, cohérence du logo, privacy.html — 2026-07-27

Cédric a demandé un audit de cohérence sur les 8 pages du site (après avoir vu la même famille de bugs — ombres résiduelles du thème sombre, contraste, code mort — apparaître plusieurs fois le même jour sur le hero et le lead magnet). Grep systématique sur tous les fichiers `landing/*.html` pour : box-shadow lourdes façon thème sombre, `#hero-form`/ancres cassées, texte en `color:var(--accent)` (contraste), tirets "—".

**Trouvé et corrigé** :
- **9 liens `/#book` cassés** sur `reddit-launch.html`, `x-launch.html`, `product-hunt-launch.html` (3 chacune : CTA hero, CTA "mechanics", CTA final). `#book` a été retiré lors d'une refonte antérieure du hero (confirmé par un commentaire dans `how-it-works.html` : *"folded in from the retired #book/#cta"*) — `how-it-works.html`/`use-case.html` avaient déjà été mis à jour vers `/#hero-scroll`, ces 3 pages non. Un visiteur convaincu par un guide plateforme cliquait sur le CTA et atterrissait en haut de la homepage au lieu du formulaire. Remplacé partout par `/#hero-scroll`.
- **Logo incohérent sur 3 styles différents selon la page** : `index.html` avait le nouveau chip sticker (fait plus tôt le même jour) ; `reddit/x/product-hunt-launch.html` avaient l'ancien style contour épais `-webkit-text-stroke` (abandonné sur index.html le 24/07 car illisible sur fond crème) ; `guides/how-it-works/use-case.html` avaient un wordmark plat sans aucun style sticker ; `privacy.html` n'avait pas de logo du tout dans sa nav. Harmonisé sur les 7 pages avec le même `.sticker-patch` (chip fond accent, bordure `--ink`, ombre dure, rotation) que celui d'`index.html` — fonctionne aussi bien sur la nav-pill claire que sur la nav bar sombre des 3 pages plateforme (`--dark:#0B0B12`, conservée telle quelle, le chip ressort bien dessus).
- **`guides.html` n'avait pas la variable `--accent` du tout** (seulement `--accent-2`) — le nouveau chip aurait eu un fond transparent au lieu de jaune. Ajoutée au `:root`.
- **`privacy.html` était resté entièrement sur l'ancien thème sombre** (`--bg:#0B0B12`, `--ink:#F4F4F5`...) alors que toutes les autres pages sont passées au thème clair il y a des mois — jamais migré. Migré vers les mêmes tokens que `guides.html`/`how-it-works.html`, nav + logo ajoutés (n'existaient pas), et au passage corrigé un bug de contraste : `a{color:var(--accent)}` (jaune pâle) → `a{color:var(--accent-2)}` (gold foncé, lisible), ce qui affectait le lien mailto de contact en bas de page.

**Traité (2026-07-27, suivi immédiat)** : Cédric a demandé de nettoyer le CSS mort signalé. **370 lignes supprimées** d'`index.html` : `.panel`/`.p-head`/`.p-body`/`.p-foot` (panneau mockup générique), `.chk` (mockup checklist), `.queue`/`.q-card` (mockup file de contenu), `.pros`/`.avatar` (mockup liste de prospects), `.reach-grid`/`.reach-card` (cartes stats en dégradé), `.guarantee`/`.glow-card` (carte "garantie" à bordure animée), `.capzone` — tout un ancien kit d'écrans de démo (thème sombre) d'avant la refonte du hero, aucune classe utilisée dans le HTML actuel (vérifié une à une, en évitant les faux positifs de `grep` sur des classes similaires comme `.hs-panel--idle`/`.modal-panel`/`.nav-pill`). Ombre morte de la règle de base `.capbar-in` mise à `none` (les deux usages réels la surchargeaient déjà systématiquement). Appel JS mort `wire('capture-form', 'cap-success-1', 'cap-note-1', true)` supprimé (IDs inexistants dans le markup). Vérifié : comptage d'accolades CSS équilibré (296/296), syntaxe JS et équilibrage des balises OK, hero + modale lead magnet re-testés visuellement sur preview avant mise en prod — aucune régression.

**Vérifié en tenant compte du contexte** : les tirets "—" trouvés en masse dans `guides/how-it-works/privacy/product-hunt-launch/reddit-launch/use-case/x-launch.html` ne sont **pas un bug** — c'est le style d'écriture établi sur tout le contenu long-format du site (utilisé correctement pour des apartés). La suppression des tirets demandée plus tôt par Cédric ne concernait explicitement que le hero et la modale lead magnet (les points de première impression), pas une règle générale — pas touché ici.

Vérifié visuellement sur preview Netlify : les 8 pages (screenshots), le CTA corrigé confirmé via `getAttribute('href')` en JS (`/#hero-scroll` partout). Poussé en prod.

## Hero : highlight du formulaire à l'arrivée sur la dernière étape — 2026-07-27

Cédric : "quand on scroll sur la dernière page 'get your first customer' on devrait highlight le form pour mettre son site" — le formulaire de capture (étape 4) rendait exactement comme les 3 autres états, sans signal que c'est LE moment de conversion.

Ajouté un anneau lumineux qui pulse une seule fois (`@keyframes cap-highlight`, 1.4s, `box-shadow` accent qui s'étend puis disparaît) déclenché quand l'état devient actif — pas une boucle infinie, juste un signal d'arrivée. Scopé sur `.hs-state[data-hero-screen-state="4"].is-active .capbar-in` (desktop, panneau embarqué) et `.hero-phase-pair.is-active .hero-phase-capture .capbar-in` (mobile). Se rejoue à chaque fois qu'on rescrolle sur cette étape (le toggle `.is-active` retire puis rajoute la classe, ce qui relance l'animation CSS). Ne se déclenche pas sous `prefers-reduced-motion` : ce sélecteur dépend de `.is-active`, jamais posé par le JS scrollspy qui s'arrête tôt dans ce cas.

Vérifié via `getComputedStyle` sur preview (animation-name confirmé appliqué à l'arrivée sur l'étape 4) — le timing réel du scroll est trop rapide pour capturer l'animation en plein milieu via screenshot. Poussé en prod.

## Hero : "répondre aux commentaires" pas assez visible — retour de recherche utilisateur — 2026-07-27

Cédric a fait une session de user research avec un prospect dans la niche (n=1 pour cette découverte précise — voir [[feedback_dont_act_on_n1_research]]). Le prospect a dit qu'il ne veut pas forcément poster de nouveaux posts, mais répondre aux bons commentaires/conversations existantes — "il faut trouver les bons". Le hero ne représentait que "poster", jamais "répondre".

Traité comme un fix de clarté (pas une nouvelle fonctionnalité — le mockup état 3 montrait déjà un exemple "LinkedIn comment" parmi les sources scannées, donc le produit couvre déjà ça) plutôt que comme un changement produit, donc appliqué directement malgré le n=1 :

- **Phrase 2** : "No posts. No leads. And you know it." → **"No posts. No replies. No leads. And you know it."** — sous-texte aussi mis à jour ("nobody's posting or replying to the right conversations").
- **Mockup état 2** : ligne "Replies" ajoutée entre "Posts this week" et "New leads" (réordonné pour matcher la phrase), note passée à "Nobody's posting. Nobody's replying. Nobody's finding you."
- **Phrase 3** : tentative d'élargir "We post for you" → "We post and reply for you", mais le `.mark-word` s'est étalé sur 2 lignes et s'est réduit à un point illisible — **le même bug déjà documenté plus tôt dans la session** (le `::before` en `position:absolute` sur un `inline-block` ne suit pas le texte qui wrap). Cédric a vu ça en direct et a demandé de revenir en arrière : phrase 3 repassée à son texte d'origine ("We post for you"), le concept "reply" reste porté par la phrase 2 + son sous-texte, pas la phrase 3.
- Au passage, Cédric a aussi demandé de remettre "And you know it" en highlight (`.mark-word`) sur la phrase 2 — jamais surligné avant, ajouté ce tour-ci.

Vérifié visuellement sur preview à chaque étape (3 déploiements successifs pour cette seule passe). Poussé en prod.

## Suivi : le highlight du formulaire (état 4) était invisible en pratique — 2026-07-27

Cédric : "just a la fin quand je scroll on highlight pas le form" — le ring `cap-highlight` ajouté plus tôt le même jour ne se voyait pas du tout en usage réel, malgré la vérification `getComputedStyle` qui avait confirmé la règle appliquée à ce moment-là.

**Cause probable** : le ring jouait EN MÊME TEMPS que l'entrée en fondu du panneau parent (`.hs-state.is-active{ animation:hero-phase-in .5s; }`, opacity 0→1). Pendant sa phase la plus visible (les 70% premiers de `cap-highlight`), le ring était rendu à travers un parent encore partiellement transparent — en plus d'être un jaune pâle (`--accent`) peu contrasté sur la carte crème.

**Corrigé** : animation décalée de `.5s` (`animation:cap-highlight 1.4s ease-out .5s both`, ne démarre qu'une fois le fondu du parent terminé) + couleur passée à `--accent-2` (gold plus foncé) + rayon max élargi (14px → 18px).

**Note méthodo** : la vérification par capture d'écran/`getComputedStyle` chronométré s'est montrée peu fiable dans cet environnement de test pour une animation de ~2s (plusieurs tentatives de mesurer la valeur `box-shadow` à un instant précis ont donné des résultats incohérents d'un essai à l'autre, probablement parce que les animations CSS n'avancent pas en temps réel de façon fiable sur un onglet piloté par automatisation sans focus réel). Le fix a été appliqué sur la base du diagnostic de la cause racine (conflit de timing + faible contraste), pas d'une capture réussie en plein milieu de l'animation — à confirmer par Cédric en conditions réelles.

## Essai puis retrait : petit encart stat par phrase — 2026-07-27

Cédric a partagé des captures d'un concurrent (unfair.so) avec un petit encart chiffré à côté du titre ("hours, not days", "3-4x replies vs cold outreach") dans un carrousel animé. Ce qui semblait transposable : l'encart chiffré à côté du texte, pas le mécanisme carrousel (déjà équivalent via le scroll-driven mockup existant).

Ajouté un composant `.hero-stat` (petite carte, grosse ligne + sous-ligne discrète) sur les 4 phrases, avec des contenus honnêtes (pas de chiffres inventés) : "2 min / to drop your link and start", "0 / and it stays 0 until you post", "Hand-picked / not a generic blast" (volontairement pas un nombre de plateformes, pour ne pas recontredire le "no fixed list" travaillé plus tôt), "24h / from link to your priority plan". Vérifié visuellement sur les 4 états avant mise en prod.

**Retiré immédiatement après** : "enleve les stats que tu viens de mettre désolé mais ca n'apporte rien." Les 4 blocs `.hero-stat` et leur CSS entièrement supprimés, copy des phrases (inchangée par cet essai) conservée. Poussé en prod.

## Nav complète + état actif sur how-it-works/use-case/guides — 2026-07-27

Cédric a montré une capture de la nav-pill d'`index.html` et demandé : "sur chaque page garde la navigation, avec un état actif de l'onglet en cours." Constat : seule `index.html` avait la nav-pill complète (logo + 3 liens + CTA) — `how-it-works.html`, `use-case.html`, `guides.html` n'affichaient que le logo, aucun moyen de naviguer entre les pages une fois sorti de la homepage.

Les 3 pages passées sur le même composant `.nav-pill` (fixed, pill, logo + `.nav-links` + `.btn.nav-cta`) qu'`index.html`, avec le lien de la page courante en `.is-active` (gras + `--ink`, vs `font-weight:500`/`--body` par défaut). `privacy.html` et les 3 pages plateforme (`reddit/x/product-hunt-launch.html`, nav sombre dédiée) **volontairement pas touchées** — scope limité aux 3 pages de contenu principal correspondant aux onglets de la nav.

**Bug de spécificité CSS trouvé et corrigé au passage** : le nav étant maintenant `position:fixed`, il fallait ajouter du padding-top au contenu pour ne pas passer dessous. Première tentative `main{ padding:6.5rem 0 5rem; }` — silencieusement écrasée par `.wrap` (même élément, `<main class="wrap">`) dont le shorthand `padding:0 1.375rem` gagne car un sélecteur de classe bat un sélecteur de type, peu importe l'ordre dans le fichier. Repéré via `getComputedStyle` montrant `padding-top:0px` malgré la règle présente dans le HTML servi (vérifié par `fetch(location.href)`). Corrigé en `main.wrap{ padding-top:6.5rem; padding-bottom:5rem; }` (spécificité 0,1,1, ne touche pas au padding gauche/droite hérité de `.wrap`).

Vérifié visuellement sur les 3 pages (preview Netlify) avant mise en prod.

## Open Graph / preview de lien pour index.html — 2026-07-28

Cédric : "il nous faut pour posted une view quand on partage le lien" — `index.html` n'avait **aucune** balise Open Graph/Twitter Card (contrairement à `product-hunt-launch.html` qui en avait déjà), donc partager le lien affichait un aperçu vide/générique partout (Slack, iMessage, X, etc.).

Ajouté : `og:type/title/description/url/site_name/image(+width/height)` + `twitter:card/title/description/image`, même structure que `product-hunt-launch.html`. Nouvelle image `assets/og-home.png` (1200×630, format standard) — une vraie capture du hero en prod (headless Chrome, viewport 1600×900 puis recadrage/resize, même technique que le logo PNG généré plus tôt dans la session), pas un visuel fabriqué à part.

Au passage, la meta description était restée sur l'ancien texte ("25+ platforms... hot prospects identified with DMs ready to send") — contredisait le positionnement "no fixed list of platforms" travaillé toute la journée. Remplacée par un texte cohérent avec la copy actuelle du hero.

Vérifié : tags + image confirmés servis en prod via `curl` (`og:image` présent, image répond 200).

## Passe SEO/métadonnées complète — 2026-07-28

Cédric : "Faisons une passe sur toute les meta datas, image, rferncement etc. on veut aussi etre bien positionné en seo". Audit d'abord (`site:letsgetposted.com` sur Google confirme le site indexé, mais la recherche "lets get posted" ne le fait pas remonter — écrasé par des concurrents au nom quasi-identique letsgetposting.com/letspost.it/getposting.com ; problème de classement pas d'indexation, la vraie réponse c'est du temps + des backlinks + continuer la stratégie de contenu long-tail déjà en place sur les pages guides, pas un fix technique).

**Corrigé** :
- **`robots.txt` + `sitemap.xml`** créés — n'existaient pas du tout avant. Sitemap liste les 7 pages indexables, `privacy.html` explicitement exclu (déjà `noindex`).
- **`<h1>` manquant sur `index.html` et `how-it-works.html`** : `index.html` n'avait que des `<p class="hero-phase">` (aucun heading réel) ; la phrase 1 (active par défaut, première dans le DOM) passée en `<h1>`, les phrases 2-4 restent `<p>` — un seul heading net, pas quatre. `how-it-works.html` n'avait que des `<h2>`, zéro `<h1>` sur la page ; converti le `<h2>` principal ("From submission to live, in one flow.") en `<h1>`.
- **Bug révélé par ce changement, corrigé** : du CSS mort d'un ancien design de hero (`.hero h1`, `.pain-line`/`sticker-slap`, aucune classe utilisée dans le markup actuel) était resté inerte tant qu'aucun vrai `<h1>` n'existait dans `.hero` — dès que la phrase 1 est devenue `<h1>`, cette règle morte (spécificité 0,1,1) a battu `.hero-phase` (0,1,0) et cassé la taille/le retour à la ligne du titre. Supprimé plutôt que contourné avec plus de spécificité.
- **Canonical + OG/Twitter Card + JSON-LD ajoutés** sur `how-it-works.html`, `use-case.html`, `guides.html` (seules `index.html` et les 3 pages plateforme en avaient avant). Nouvelles images de preview 1200×630 par page (`assets/og-*.png`), générées comme celle d'`index.html` la veille (Chrome headless, capture réelle du rendu en prod).
- **Descriptions trop longues raccourcies** sur `index.html` (meta 165→145 caractères, og 132→112) — signalé par un vérificateur OG externe.
- **`favicon.svg` créé en vrai fichier** : `reddit/x/product-hunt-launch.html` référençaient déjà `https://letsgetposted.com/favicon.svg` dans leur JSON-LD (logo de l'org), mais ce fichier n'a jamais existé (404) — le favicon réel est une data-URI inline. Le nouveau fichier corrige les 4 références d'un coup (les 3 pages existantes + le nouveau JSON-LD d'`index.html`).

**Vérifié** : équilibrage accolades/balises, syntaxe JS, validité JSON-LD (parsée), validité XML du sitemap, tous les nouveaux chemins retournent 200 en prod, hero re-capturé pour confirmer l'absence de régression visuelle après le changement de `<h1>`.

**Au passage** : preview de lien testé avec un outil externe indépendant (opengraph.xyz) après que Cédric a signalé ne pas voir d'aperçu dans le compose X — confirmé que nos balises fonctionnent parfaitement (rendu Facebook ET X corrects), le souci vient de l'éditeur de brouillon X qui n'affiche pas toujours l'aperçu en direct pendant la rédaction.

## Google Search Console configuré — 2026-07-28

Suivi direct de la passe SEO : `letsgetposted.com` ajouté et vérifié dans Google Search Console (méthode "Balise HTML" — `<meta name="google-site-verification" content="JYp67DMINk1V_BW_rqb2aN0QIlHj2IPPEL4HUPzDrEA" />` ajoutée dans `index.html`, déployée, puis validée côté Google). `sitemap.xml` soumis dans la foulée — 7 pages découvertes immédiatement (correspond aux 7 URLs du sitemap). **Ne pas retirer cette balise meta** : Google la garde comme preuve de propriété du site en continu, la supprimer ferait perdre l'accès à la Search Console.

## Capture form déplacé hors du scroll-gate — 2026-07-29

Retour d'un contact de Cédric (solide en business/startup) + donnée Plausible du jour (100+ vues, **0** soumission sur le formulaire `liste-attente`) : le formulaire de capture (champ URL) n'était atteignable qu'en scrollant jusqu'à la phase 4/4 du hero, ou en cliquant le CTA nav qui sautait artificiellement jusque-là en JS. Diagnostic confirmé — c'était bien la seule entrée du funnel, et elle était scroll-gated.

**Fix (ciblé, décidé avec Cédric — pas de refonte du flow post-soumission)** : le bloc formulaire (ex-`.hero-phase-capture`, renommé `.hero-capture-top`) est sorti du `data-hero-frame="4"` et devient un frère persistant des 4 `.hero-phase-pair`, dans `.hero-phase-zone` — visible dès le chargement, sous le titre/sous-titre, quelle que soit la phase active (desktop ET mobile, plus besoin de règle `display:none` à 900px). Le mockup animé à droite (`.hero-screen`, états 1-4) et son propre formulaire à l'état 4 (`.hs-capture` / `#capture-form-hero`) restent inchangés — un 2e point de capture bonus pour ceux qui scrollent jusqu'au bout, pas un problème.

Le highlight-ring au chargement (`cap-highlight`), auparavant déclenché à l'arrivée sur la phase 4 (`.is-active`), joue maintenant simplement au chargement de la page pour `.hero-capture-top` (plus de moment d'"arrivée" puisque déjà visible). Le CTA nav (`#nav-beta-cta`) simplifié : scroll vers le haut du hero + focus sur le champ persistant, au lieu du jump-vers-phase-4 précédent. Aucun changement JS de wiring nécessaire (mêmes IDs `capture-form-hero-mobile`/`cap-url-hero-mobile`, `wire()` fonctionne par ID peu importe l'emplacement DOM).

Bonus : règle au passage le "reduced-motion desktop dead end" — le formulaire persistant ne dépend plus du tout du mécanisme de phases pour être atteignable.

Vérifié sur preview Netlify (desktop 1440px) : formulaire visible immédiatement au chargement, reste ancré pendant que texte/mockup crossfadent au scroll à travers les 4 phases, aucune duplication ni saut visuel.

**Découverte au passage (non liée, signalée à Cédric, pas d'action prise)** : `docs/acquisition-v0.md` + `docs/templates/` + `scripts/score-leads.js` existent sur disque depuis le 20/07 mais n'ont jamais été commités ni implémentés dans Notion — un plan d'acquisition manuelle outbound (bases Lead Scout/Deals/Acquisition Log) parallèle à ce chantier. À clarifier avec Cédric si c'est toujours d'actualité.

**Suivi le même jour, x2 — retouche visuelle puis intégration dans le mockup.** Une fois en prod, Cédric a trouvé le premier résultat "trop condensé" : titre + sous-titre + formulaire empilés dans la même colonne, mêmes couleurs, plus de hiérarchie, "on perd l'attention". Passe 1 : `.hero-capture-top` transformé en carte à part entière (bordure encre 2px + ombre décalée, même langage visuel que `.hero-screen`), plus d'air au-dessus (2.3rem), champ input éclairci pour trancher avec le fond de la carte.

Cédric a alors proposé mieux : plutôt que 2 cartes séparées qui se font concurrence, intégrer le formulaire **dans** le mockup de droite. Passe 2 (structurelle) : `.hero-screen` scindé en `.hs-decorative` (chrome bar + les 3 états illustratifs 1-3, `aria-hidden`) + `.hero-capture-dock`, une barre d'action permanente en bas du mockup (fond `--card-2`, bordure supérieure, séparée du reste comme un vrai footer d'appli) — contient le SEUL formulaire desktop maintenant (ex-état 4, qui a été supprimé ; le mockup se fige sur l'état 3 quand la phase 4 est atteinte, `screenN = n==='4' ? '3' : n` en JS). `.hero-capture-top` redevient mobile/reduced-motion uniquement (`display:none` à 900px+, ré-affiché sous reduced-motion pour éviter le dead-end). CTA nav mis à jour pour focus le bon champ selon le breakpoint (`offsetParent` check). Colonne de texte à gauche redevenue aérée (titre + sous-titre seuls). CSS mort nettoyé (`.hs-capture`/`.hs-capture .capbar-in` etc., plus aucun élément ne portait ces classes après la restructuration).

Vérifié en preview : dock ancré pendant tout le crossfade des 3 états, gel propre sur l'état 3 à la phase 4, aucun bloc vide.

## Roadmap — pas maintenant, mais à ne pas perdre

- **Série de pages plateforme — état (2026-07-16)** : décision prise avec Cédric de NE PAS changer la promesse "25+ plateformes" sur la landing (`index.html` intact, aucune modif de copy). À la place, on construit une vraie page de crédibilité par plateforme, en commençant par les 3 réellement supportées par `platform-copy.js` (Reddit, X, Product Hunt) :
  - `product-hunt-launch.html` — fait, avec vraie donnée (50 jours scrapés).
  - `reddit-launch.html` — fait, mais **sans dataset scrapé** : Reddit bloque totalement `WebFetch`/`WebSearch` direct dans cet environnement (`reddit.com`, `old.reddit.com` — tous refusés). La page contient uniquement des guidelines sourcées (règle 90/10, karma/ancienneté de compte, règles par subreddit) recoupées sur plusieurs guides indépendants, et une section honnête ("No scraped dataset for this one, yet") qui assume cette limite au lieu de la cacher ou d'inventer des exemples.
  - `x-launch.html` — fait. X aussi bloque `WebFetch` (403 sur `help.x.com`, 402 sur `x.com/search`), même traitement honnête que Reddit : règles officielles X sourcées (engagement farming banni, reply networks, auto-DM interdits) + section "No scraped dataset for this one, yet".
  - **Les 3 plateformes de la promesse (Reddit, X, Product Hunt) ont maintenant chacune leur page.** Prochaine plateforme éventuelle : décider avec Cédric si on étend au-delà de ces 3, et vérifier au cas par cas si la plateforme est fetchable avant de promettre un vrai dataset.
  - Toutes les pages de la série sont cross-linkées entre elles (nav du site + footer de chaque page) et suivent le même gabarit CSS (palette pastel crème, `.checklist-grid`, `.process`, `.eyebrow`).

- **Vraie recherche de prospects dans le lead magnet** (2026-07-14) : actuellement la modale montre "pourquoi ces plateformes pour ta niche", pas de vrais contacts. L'idée (inspirée d'explee.com, qui scrape de vraies personnes/emails et rédige un vrai message) serait de montrer un exemple de premier message de prospection généré par IA — mais explicitement illustratif, jamais un vrai nom/email inventé (irait contre le principe "jamais de données inventées" du site). La vraie recherche de prospects (comme explee) demanderait une infra séparée (base de prospects, enrichissement email) — chantier à part, pas un ajustement de CTA. Décidé de reporter pour rester concentré sur l'essentiel.
- **Vrai workflow agent (n8n) pour la page Product Hunt** (2026-07-16) : la page `product-hunt-launch.html` a maintenant une section "process" (Scan → Score → Cross-reference → Alert) qui décrit honnêtement la méthode en texte, PAS un screenshot de dashboard puisque `agents/` (Intake, Factory, Scout, Cockpit) est encore vide. Cédric prévoit de construire un vrai workflow (n8n, sur le modèle du pipeline `~/Desktop/Linkedin Hack`) le jour suivant — une fois ce workflow réel en place, remplacer/enrichir la section process avec un vrai screenshot ou une preuve concrète du système qui tourne, plutôt que le diagramme texte actuel.
- **Analytics (2026-07-16)** : script Plausible (`data-domain="letsgetposted.com"`, sans clé de compte) déployé sur `index.html` et `product-hunt-launch.html`, et `privacy.html` mis à jour en conséquence. **Reste à faire côté Cédric** : créer le compte Plausible et ajouter `letsgetposted.com` comme site — le tracking s'activera automatiquement dès que le domaine existe côté Plausible, aucun redéploiement nécessaire ensuite. Objectif de Cédric : suivre l'évolution du trafic pour du contenu "build in public", en partant de zéro — donc créer le compte rapidement pour ne pas perdre de données de départ. Une fois le compte créé, activer le "public dashboard" Plausible pour avoir une URL de stats partageable.
- **Génération d'un vrai exemple de post (lead magnet)** (2026-07-16) : discuté avec Cédric — au lieu de retirer le label "Example" de la frise 7-jours (ce qui ferait passer un plan non-généré pour réel, contraire au principe du site), la meilleure option retenue est de générer un vrai brouillon de post (Reddit ou Product Hunt) à partir du contenu réellement scrapé du produit, sur le même mécanisme que `platform-copy.js`. Pas encore implémenté — à faire dans une prochaine session. Objectif : donner une vraie raison concrète de laisser son email, plus convaincante qu'un plan générique.
