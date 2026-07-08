# PROMPT — CONTEXTE PROJET

Copie-colle ce qui suit au début d'une nouvelle conversation ou dans ton CLAUDE.md :

---

## CONTEXTE

Je suis Cédric, UX researcher senior (8 ans d'expérience), builder solo utilisant Claude Code et n8n. Je lance un projet que je documente en public sur X et YouTube (audience makers/indie hackers/solopreneurs francophones, à construire).

## LE PROJET

**Un service de lancement de SaaS exécuté par des agents IA, supervisé par un humain.**

Constat marché (vérifié par recherche web, sources en fin de doc) : avec l'IA, construire un SaaS prend un week-end — la distribution est devenue LE goulot d'étranglement (54% des produits indie hackers font 0€ de revenu, ~50-70% restent sous 1K MRR, 89% des fondateurs ayant lancé sur Product Hunt ne relanceraient pas). Un vrai lancement = 40 heures de travail ingrat que personne ne fait : 25+ plateformes de launch, contenu par canal, communautés, prospection.

Solution : une machine d'agents IA qui exécute le lancement. Le client donne son produit, la machine livre en 7 jours :
1. Kit de lancement complet (posts X/LinkedIn/Reddit/HN, descriptions, articles SEO/GEO)
2. Soumissions préparées sur Product Hunt + 25 plateformes + directories de niche
3. Liste de prospects chauds détectés par signaux + DM/emails personnalisés rédigés + relances
4. Cockpit de validation avec compteurs de résultats + débrief J+14

**Principe non négociable : les agents préparent, l'humain valide et appuie sur envoyer. Jamais de spam, de bots, d'upvotes achetés.** Ce principe n'est pas qu'un argument marketing : les agents IA autonomes non supervisés échouent sur ~70% des tâches réelles (source en fin de doc) — la supervision humaine est un vrai différenciateur défendable face aux concurrents "full-auto".

## ICP, NICHE ET LANGUE — décidé et arbitré

**Marché/langue : francophone, pour le contenu ET les clients.** Décision prise après arbitrage explicite (pas anglophone malgré un marché plus grand) :
- Le levier le plus critique du projet, c'est la fréquence/qualité du contenu quotidien sur 2 ans — pas la taille du marché adressable. Documenter en langue non-native aurait ralenti la production et affaibli la voix (fragments, rupture de ton) que le positionnement demande.
- Le marché anglophone "build in public" est plus grand mais saturé de narratifs "IA fait ton GTM" — s'y différencier est plus dur, encore plus avec une friction de langue.
- Le flywheel doit boucler : audience X → leads. Contenu en français + ICP anglophone = deux publics disjoints qui ne se nourrissent pas.
- Ça ne casse pas l'exécution : les fondateurs SaaS français ambitieux visent en général un marché global, donc le service continue d'exécuter les lancements sur Product Hunt/Hacker News/X/Reddit en anglais quand le produit du client le demande. Le français est la langue de la relation et du contenu, l'anglais reste la langue d'exécution.

**Vertical de départ : dev tools / outils pour développeurs et builders techniques.**
- Cohérent avec le profil de Cédric (UX research + builder Claude Code/n8n) → crédibilité naturelle
- Audience X "makers/indie hackers" concentrée dans cette catégorie
- Catégorie historiquement la plus dense sur PH/HN → le Signal Scout y détecte le plus de patterns exploitables
- Écarté : "AI-native SaaS" (trop saturé de hype, en tension avec le positionnement anti-bots/anti-spam)

**Clients cibles** : fondateurs solo/duo de SaaS dev tools, francophones, financés ou déjà rentables (PAS les 54% à zéro revenu — pas le budget, segment le plus instable), qui s'apprêtent à lancer un produit ou une feature majeure, détectables par signaux publics (levées, "building in public", posts PH upcoming). Les makers X francophones = audience qui regarde le build ET vivier de clients (contrairement à l'ancienne hypothèse où l'audience X n'était que spectatrice).

**Vision 2 ans** : pas un pivot produit, une combinaison cohérente —
- Le contenu/l'audience X-YouTube en français est le moteur d'acquisition (Cédric documente lui-même l'exécution du service, ce qui EST le contenu)
- "Le moteur" (abonnement récurrent, cf. business model ci-dessous) est le modèle économique qui monétise cette audience
- Le SaaS self-serve (cockpit en produit) reste prématuré tant que la rétention du service humain n'est pas prouvée — pas de bifurcation anticipée

## POSITIONNEMENT & COPY

- Headline landing : « Construire votre produit, c'était la partie facile. Le faire savoir, c'est le vrai travail — on le fait à votre place. »
- Copy pain-first : agitation (le launch à 3 likes), vérité (les 40h que personne ne fait), solution (« Vous codez. Nos agents font les 40 heures. »)
- Côté clients : le système reste mystérieux (« notre méthode », pas les détails techniques). Côté X : transparence totale du build.
- **Point corrigé cette session** : la version initiale promettait "vos premiers clients arrivent" — surpromesse, car le service contrôle la visibilité et les conversations qualifiées, pas la conversion finale (qui dépend du produit/pricing du client). Corrigé partout dans la copy vers "conversations qualifiées garanties", avec une objection dédiée qui assume cette limite plutôt que de la cacher (repère de confiance pour une audience anti-bullshit).
- Garantie : visibilité partout + [X] conversations qualifiées, sinon travail gratuit jusqu'à obtention
- Rareté réelle : 2 lancements/mois (capacité solo) — à présenter explicitement comme réelle et non comme tactique marketing
- Lancement : offre pilote à prix réduit contre case study chiffré public (PAS de faux témoignages)
- Copy complète et à jour : voir `copy-landing-value-proposition.md`

## BUSINESS MODEL (séquence)

1. **Maintenant** : lancement one-shot, prix fixe, asynchrone, zéro call de vente
2. **Rétention (à tester le plus tôt possible, pas seulement au débrief J+14)** : abonnement mensuel « le moteur » — veille de niche continue, prospects + contenus livrés chaque semaine (200-400€/mois). C'est ce qui détermine si c'est un vrai business de 2 ans ou un treadmill de prospection mensuel — à valider en priorité.
3. **Plus tard, si signaux** : le cockpit en SaaS self-serve

## ARCHITECTURE TECHNIQUE (4 modules)

1. **Intake** : formulaire → analyse du produit client
2. **Factory** : génération de tous les assets de lancement
3. **Scout** : veille signaux (X, PH, annonces levées) + liste prospects + brouillons d'approche
4. **Cockpit** : dashboard de validation + compteurs

Stack : Claude Code (un agent par module avec son CLAUDE.md), n8n ou crons pour l'orchestration. Automatisation à ~80% max : les soumissions avec login et les envois de DM restent humains (risque de ban sinon, et cohérent avec le principe de supervision).

## RISQUES IDENTIFIÉS (à surveiller, pas bloquants)

- **Plafond solo** : 2 lancements/mois en one-shot plafonne mécaniquement le CA — d'où l'urgence de valider "le moteur" tôt
- **Saturation narrative** : "agents IA pour ton GTM" est tendance en 2026, pas un océan bleu — la différenciation viendra de l'exécution et de l'honnêteté, pas de l'idée
- **Risque plateforme** : soumissions/DM en volume, même validés à la main, peuvent déclencher des détections anti-spam sur LinkedIn/Reddit en particulier
- **Dépendance rétention client** : le service ne contrôle pas si le produit/pricing du client convertit derrière — d'où la garantie calibrée sur "conversations qualifiées", jamais sur "clients" ou "revenu"

## PLAN 30 JOURS (règle : pas de rediscussion du concept avant J30)

- S1 : thread fondateur X + build du Launch Mapper (agent plateformes)
- S2 : test de la machine sur mon propre projet (cobaye), chiffres publics
- S3 : build du Signal Scout + documentation publique
- S4 : landing en ligne + DM asynchrones aux 10 meilleurs prospects du Scout
- Critère de succès J30 : 1 lancement réel exécuté + 1 pilote signé ou 5 conversations qualifiées

## MON HISTORIQUE (pour le storytelling)

Échec précédent : Breakpoint, service productisé d'analyse de churn — 100 DM manuels, 1 call, 0€. C'est l'épisode 1 du récit public : « builder, pas vendeur, alors je construis la machine qui fait la distribution à ma place ». Compteurs publics chaque semaine.

Note de cohérence : le mécanisme de prospection par signaux publics (plutôt que cold DM en masse) résout directement le mode d'échec de Breakpoint — bon fil narratif, à exploiter explicitement dans le contenu.

## SOURCES (recherche de validation des chiffres, session du 2026-07-08)

- 54% des produits indie hackers font 0€ : [ScrapingFish analysis via Indie Hackers](https://www.indiehackers.com/post/how-much-money-do-indie-hackers-products-make-74db9631f0)
- ~50-70% des micro-SaaS sous 1K MRR : [Better Launch](https://www.betterlaunch.co/blog/indie-hacker)
- 89% des fondateurs Product Hunt ne relanceraient pas : [OpenHunts 2024 study](https://openhunts.com/blog/tech-product-launch-statistics-insights)
- 60-80% des lancements startup échouent à gagner du momentum : [Brainkraft](https://www.brainkraft.com/post/top-10-product-launch-statistics)
- Rétention top-décile solo founders ×4 vs médiane (30% vs 8% à J+30) : [Stripe](https://stripe.com/blog/top-solo-founder-traits)
- Solo founders sous-tarifient systématiquement : [promptstoproduct.com](https://www.promptstoproduct.com/solo-founder-pricing-playbook)
- Agents IA autonomes non structurés échouent ~70% des tâches réelles : [Indie Hackers](https://www.indiehackers.com/post/i-analyzed-7-autonomous-ai-agents-for-business-in-2026-here-s-what-i-concluded-e34c50741f)
- Isolement entrepreneurial (30-45% se sentent isolés, 88% épuisement émotionnel) : [Persévérance entrepreneuriale](https://www.perseveranceentrepreneuriale.org/blog-post/limpact-de-la-solitude-entrepreneuriale-sur-la-sante-mentale), [Le Centre du Bien-Être](https://lecentredubienetre.pro/la-solitude-des-entrepreneurs-45-se-sentent-isoles/)

**Nuance importante** : le chiffre "9 lancements sur 10 meurent en silence" utilisé dans une version antérieure de la copy n'a pas de source primaire vérifiée — c'est une extrapolation plausible des stats ci-dessus, pas un chiffre à défendre publiquement tel quel. Préférer citer le 54%/0€ ou la fourchette 60-80% sourcée.

---

## FICHIERS LIÉS

- `copy-landing-value-proposition.md` — copy complète et à jour de la landing page (version corrigée sans surpromesse "clients garantis")
- `prompt-contexte-projet.md` — ce fichier

---

*Fin du prompt. Demande-moi ensuite ce dont tu as besoin : code d'un module, contenu X, itération copy, etc.*
