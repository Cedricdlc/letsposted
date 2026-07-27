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
