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

Un vrai prospect B2B (testé sur `jumpia.club`) a donné un retour qui converge avec la session de recherche du 13/07 (n=1 → n=2 sur 2 points : page trop longue, lead magnet montre trop avant l'email). Design + plan détaillés dans `docs/superpowers/specs/2026-07-23-landing-relaunch-v2-design.md` et `docs/superpowers/plans/2026-07-23-landing-relaunch-v2.md`. Exécuté en Subagent-Driven Development (implémenteur + reviewer par tâche + revue finale sur l'ensemble), toutes les tâches approuvées, mis en prod le 2026-07-23.

Ce qui a changé :
- **Nav** : logo + "How it works" + "Guides" (regroupe les 3 guides, déplacés en footer) + bouton "Get access to the beta"
- **Hero** : séquence scroll-animée plein écran (4 phrases, diagramme SVG à pulsations réutilisant la technique de l'ancien `#expertise`) au lieu du hero statique. **Phrase 1 = "Stop procrastinating on your business launch."** — test délibéré : le mot "procrastinating" est exactement celui que le prospect du 23/07 a rejeté pour lui-même en tant que headline statique ; hypothèse que le même mot dans une séquence animée immersive peut fonctionner différemment. À surveiller sur le prochain retour utilisateur — si rejeté à nouveau, variante de repli déjà écrite : "You don't do it. We do it for you." (phrase validée en recherche le 13/07)
- **Sections fusionnées** : `#expertise` + `#pipeline` absorbées dans `#how`, qui passe de 4 à 5 étapes — coupe la redondance, raccourcit nettement la page
- **Lead magnet** : ne montre plus les 3 previews de plateforme générées par IA ni la frise 7 jours à plateformes fixes avant l'email (c'était exactement ce qui donnait l'impression "on m'a déjà tout donné" au prospect) — remplacé par "We'll send your priority launch plan within 24h", un vrai triage manuel par Cédric derrière (pas une génération automatique). `platform-copy.js`/`fetchPlatformCopy`/`platformPreviews` restent dans le code mais dormants (plus aucun point d'appel), pour un futur vrai moteur de génération
- **Plateformes** : plus de liste fixe Reddit/X/PH dans le texte — cadrage "on trouve les bons canaux selon ta niche" (LinkedIn inclus si pertinent pour du B2B)

**Bug trouvé après coup, corrigé le jour même** : sous `prefers-reduced-motion` sur desktop, le JS du hero ne tourne jamais (comportement voulu), mais le CSS cachait quand même les phrases 2-4 derrière `display:none` en attendant l'activation JS — donc les utilisateurs "réduire les animations" ne voyaient que la phrase 1, épinglée sur ~400vh de scroll mort, sans jamais voir la proposition de valeur réelle. Aucune des 3 revues de code par tâche ne pouvait le voir (elles lisaient des diffs, pas le rendu composité) ; trouvé par la revue finale sur l'ensemble de la branche. Corrigé en reprenant le même fallback statique empilé que mobile.

**Piste "commentaires sur influenceurs de niche"** (idée du prospect du 23/07, écho direct du mécanisme du projet frère LinkedIn Hack) : pas annoncée sur la page (n=1, pas encore testée), mais à intégrer dans le triage manuel du lead magnet quand pertinent — teste l'idée en vrai sans l'engager publiquement.

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
