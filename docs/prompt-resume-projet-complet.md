# PROMPT — RÉSUMÉ COMPLET DU PROJET POSTED. (LETSGETPOSTED)

Copie-colle ce qui suit au début d'une nouvelle conversation, ou partage-le tel quel pour donner une vue d'ensemble complète du projet — vision, enjeux, données réelles, état technique.

---

## LE PROJET EN UNE PHRASE

Un service de lancement de SaaS exécuté par des agents IA, supervisé par un humain — on transforme les 40 heures ingrates d'un lancement produit en quelques heures de validation, jamais de spam ni de bots.

Nom de marque public : **Posted.** (`letsgetposted.com`). Nom du repo/projet technique en interne : **GetSeen**. Même projet.

## QUI PORTE ÇA

Cédric, UX researcher senior (8 ans d'expérience), builder solo utilisant Claude Code et n8n. Documente le build en public sur X (et TikTok à terme). Échec précédent notable : Breakpoint, un service d'analyse de churn — 100 DM manuels, 1 call, 0€. C'est le point de départ narratif : *"builder, pas vendeur, alors je construis la machine qui fait la distribution à ma place."*

## LE CONSTAT MARCHÉ

Avec l'IA, construire un SaaS prend un week-end — la distribution est devenue le vrai goulot d'étranglement : 54% des produits indie hackers font 0€ de revenu, 50-70% restent sous 1K MRR, 89% des fondateurs ayant lancé sur Product Hunt ne relanceraient pas. Un vrai lancement = 40h de travail que personne ne fait (25+ plateformes, contenu par canal, prospection).

**Principe non négociable** : les agents préparent, l'humain valide et appuie sur envoyer. Jamais de spam, de bots, d'upvotes achetés — les agents IA autonomes non supervisés échouent sur ~70% des tâches réelles, la supervision humaine est un vrai différenciateur défendable.

## LA VISION 2 ANS

Pas un pivot produit, une combinaison cohérente :
- Le contenu/l'audience X (et YouTube/TikTok à terme) est le moteur d'acquisition — Cédric documente lui-même l'exécution du service, ce qui *est* le contenu
- "Le moteur" (abonnement récurrent, veille de niche continue) monétise cette audience une fois la rétention prouvée
- Un SaaS self-serve (cockpit en produit) reste prématuré tant que le service humain n'est pas prouvé

## LA RÈGLE D'OR DU PROJET

**"Rien ne se code tant que ça n'a pas été fait deux fois à la main."** Toute décision d'automatisation dans ce projet passe par ce filtre. C'est pour ça que le moteur complet (Intake/Factory/Scout/Cockpit, encore vide dans `agents/`) attend la fin du premier lancement manuel de Cédric — voir plus bas.

## LA DONNÉE RÉELLE COLLECTÉE (le vrai actif du projet)

**Dataset Product Hunt** : 51 jours réels de #1 Product of the Day, du 26 mai au 19 juillet 2026, collectés d'abord manuellement (WebFetch sur l'archive officielle PH) puis automatiquement via un vrai workflow n8n depuis le 20 juillet. **33 des 51 (65%) mentionnent "AI" ou "agent" directement dans leur tagline** — pas 100%, un vrai signal pas une règle forcée. Stocké dans `landing/data/ph-winners.json`, visible en direct sur `letsgetposted.com/product-hunt-launch.html`, et dupliqué dans une base Notion "PH Winners" pour consultation facile.

**3 guides plateforme réels et sourcés** (Product Hunt, Reddit, X) — checklists tirées des vraies règles publiées par chaque plateforme (règle 90/10 Reddit, spécs exactes PH, règles anti-engagement-farming X), pas du contenu générique. Honnêteté explicite quand une donnée manque : Reddit et X bloquent tout scraping automatisé dans cet environnement, donc pas de dataset chiffré pour ces deux pages — assumé plutôt que caché ou inventé.

**Étude de cas réelle** : Café 2.0, entreprise YC, 417 upvotes sur Product Hunt, lancée sans growth hack — vrai screenshot, vrai résultat.

## ÉTAT TECHNIQUE (2026-07-20)

- **Landing + 3 pages guide** déployées et vérifiées en prod sur `letsgetposted.com`
- **Outil de lead magnet fonctionnel** : scan réel d'une URL soumise (`readiness.js`), génération de raisons par plateforme via Claude (`platform-copy.js`), fallback honnête si le scan échoue (jamais de donnée inventée à la place)
- **Analytics** : Plausible actif, tracking confirmé
- **Premier vrai workflow n8n construit et testé end-to-end le 2026-07-20** : "Posted — PH Daily Winner Sync" — récupère le #1 PH du jour via l'API officielle, commit sur GitHub (`Cedricdlc/letsposted`), génère un post X via Claude, le pousse dans Notion en brouillon ("À rédiger", jamais publié sans validation humaine). Reste un maillon en pause : le déploiement Netlify auto (bloqué par un compte "Acai" mélangé avec d'autres projets, à découpler après le 28/07 — voir ci-dessous)
- **Notion "Second Cerveau"** structuré : bases Tâches, Projets, Contenu (posts X calibrés en voix), PH Winners, Ressources, Notes/Idées

## LES ENJEUX ACTUELS (à ne pas perdre de vue)

1. **Timing de facturation** : le compte Netlify hébergeant le site a épuisé son quota gratuit (mélangé avec un autre projet, "Acai Studio") — décision prise d'attendre le renouvellement du 28 juillet plutôt que payer sur un compte non-dédié. Le workflow n8n continue de collecter gratuitement en attendant (seul le déploiement auto est en pause, pas la collecte de donnée).
2. **Concurrence identifiée** : "Ship or Die" (Marketing or Die) — un produit de formation/accountability à $349, même audience/pain point exact ("shippé, 0 client"), mais un deliverable fondamentalement différent (apprendre à faire soi-même vs service fait pour toi) et des canaux différents (TikTok/SEO/pub payante vs Product Hunt/Reddit/X). Menace réelle sur l'attention et le timing, pas sur le fond du positionnement.
3. **Le vrai risque personnel** : Cédric a un historique de ~10 projets abandonnés avant celui-ci. La discipline mise en place (plan daté jusqu'au 12 août, tâches quotidiennes granulaires dans Notion, jamais de gros pivot sur un coup de tête) est la vraie défense contre ce pattern — pas une opinion sur l'idée elle-même.

## LE PLAN DE LANCEMENT EN COURS

4 semaines, du 16 juillet au **12 août 2026** (lancement Product Hunt, mercredi, 12:01 AM PT + post Reddit + thread X le même jour). Routine quotidienne : commentaires Reddit réels sur subreddit du jour, upvote/commentaire sincère sur 2-3 lancements Product Hunt, un post X déjà pré-rédigé (voix naturelle et fluide calibrée, jamais de style "indie hacker" performatif). Détail complet dans `docs/launch-plan.md` et la base Notion "Tâches"/"Contenu".

## CE QUI RESTE OUVERT (roadmap, pas urgent)

- Migration vers un compte Netlify dédié à Posted/GetSeen (après le 28/07)
- Le vrai moteur Intake/Factory/Scout/Cockpit (après le premier lancement manuel complet)
- Génération d'un vrai post/plan personnalisé par produit dans le lead magnet (au lieu de l'exemple générique actuel)
- Automatisation email réelle (Loops/Resend)
- Extension du workflow n8n vers d'autres plateformes une fois Reddit/X éventuellement accessibles

---

*Fin du résumé. Le contexte détaillé vit dans `CLAUDE.md`, `docs/prompt-contexte-projet.md` (positionnement/copy), `docs/launch-plan.md` (calendrier), et les specs `docs/superpowers/specs/`.*
