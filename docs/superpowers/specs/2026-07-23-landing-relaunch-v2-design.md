# Design — Refonte landing v2 (post-retour prospect réel)

**Date** : 2026-07-23
**Statut** : approuvé par Cédric, prêt pour implémentation

## Contexte et déclencheur

Un vrai prospect B2B (testé sur `jumpia.club`) a donné un retour direct sur la landing actuelle. Ce retour converge fortement avec la toute première session de recherche utilisateur (2026-07-13, mémoire `getseen_user_research_session1`) — deux points se confirment sur deux sessions indépendantes, ce qui sort la discipline "n=1, ne pas agir" (`feedback_dont_act_on_n1_research`) de son état d'attente :

| Constat | Session 1 (13/07) | Session 2 (23/07, jumpia.club) |
|---|---|---|
| Page trop longue | "Plus je scrolle, plus je suis perdu" | A décroché à la moitié de la page |
| Lead magnet répond à la mauvaise question | Veut qu'on lui dise **directement** quelle plateforme prioriser, pas un aperçu | Impression d'avoir "déjà tout reçu" en soumettant son URL |

Un troisième point est nouveau et propre à cette session (n=1, traité comme hypothèse à tester, pas comme un fait établi) : la headline actuelle ("You still haven't posted it") ne fait pas le lien avec le business/les leads du prospect, et le mécanisme de "commenter en priorité sous le contenu des bons influenceurs de niche" (écho direct du projet frère `~/Desktop/Linkedin Hack`) émerge comme piste à tester en coulisses, sans être annoncée publiquement.

## Principe directeur

Toute la refonte reste sous la contrainte déjà établie du projet : **jamais de personnalisation ou de mécanisme affirmé publiquement tant qu'il n'a pas été fait à la main au moins une fois** (règle d'or, CLAUDE.md). Ça guide plusieurs arbitrages ci-dessous, notamment sur le lead magnet et sur le mécanisme "commentaires influenceurs".

## 1. Nav bar

Remplace la nav actuelle (logo + 3 liens vers les guides + "Show me the plan") par une version premium épurée, inspirée d'une référence visuelle façon Fastlane (peu d'éléments, beaucoup de blanc/noir, un seul CTA fort) :
- Logo (`Posted.`, style sticker déjà existant)
- 2-3 liens discrets : "How it works" (ancre vers la section fusionnée, voir §3) + "Guides" (un seul lien qui regroupe les 3 pages Reddit/PH/X existantes, au lieu de 3 liens séparés)
- Bouton "Get access to the beta" (remplace "Show me the plan" — cohérent avec le texte "In beta" déjà présent dans le lead magnet)

Les 3 guides restent également liés depuis le footer, donc toujours découvrables même si retirés de la nav principale.

## 2. Hero : séquence scroll-animée plein écran

Remplace entièrement le hero statique actuel (headline + sous-ligne + champ URL visibles d'un coup) par une expérience à viewport fixe où le texte change au scroll — même mécanique technique que la section "How It Works" existante (`IntersectionObserver`, scrollspy, `position:sticky`), appliquée ici en plein écran et centrée sur le texte plutôt que sur une grille de cartes.

**Séquence de 4 phrases**, une par "beat" de scroll :
1. *"Stop procrastinating on your business launch."*
2. *"No posts. No leads. And you know it."*
3. *"We find the right platforms for your niche — and do the posting for you."*
4. *"Get your first customers. Not just views."*

Puis le scroll amène naturellement sur le formulaire : champ URL + bouton **"Get my plan"**.

**Note de test explicite** : la phrase 1 réutilise le mot "procrastinating", que le prospect de la session 2 a explicitement rejeté pour lui-même. Décision de Cédric : tester quand même — l'hypothèse est qu'un mot choc dans une séquence animée immersive peut fonctionner différemment qu'une headline statique qui semble accuser dès la première seconde de lecture. À surveiller sur le prochain retour utilisateur : si le rejet se reproduit, retirer le mot (variante de repli déjà écrite en amont dans cette conversation : "You don't do it. We do it for you.").

**Animation associée à la séquence** (réutilise du code existant, pas de nouvel asset à produire) :
- Phrases 1-2 : une pastille "toi" (style sticker déjà établi) statique, avec un indicateur discret d'inaction (brouillon grisé ou compteur "leads: 0")
- Phrase 3 : réutilisation directe du diagramme hub-and-spoke à pulsations SVG déjà codé dans `#expertise` (`.b-wire`, `animateMotion`) — la pastille "toi" envoie des pulsations vers des badges plateforme
- Phrase 4 : les badges s'allument (style sticker, déjà construit), une bulle de commentaire apparaît discrètement sur l'un d'eux — **suggestion visuelle seulement** de la piste "commentaires sur contenu de niche", jamais affirmée dans le texte (cf. §5)

Si Cédric trouve/produit un vrai visuel illustré (agent, personnage) de son côté, il pourra être substitué à cette base sans changer la mécanique de scroll.

**Mobile et accessibilité** : même traitement que "How It Works" — sur mobile, pas de scroll-pinning (comportement dégradé propre : les 4 phrases s'affichent en séquence statique, pas de scroll-jacking). Sous `prefers-reduced-motion`, l'observer est désactivé, la phrase 4 (état final) s'affiche directement sans animation.

## 3. Structure de page : fusion des sections

Les sections `#expertise` (crédibilité), `#how` (mécanisme, 4 étapes) et `#pipeline` (premiers clients / DM) sont fusionnées en une seule section "How It Works", pour couper la redondance (trois blocs qui répétaient des variantes du même argument) et raccourcir concrètement la page — la demande explicite des deux sessions de recherche.

Contenu de la section fusionnée :
- Les 4 étapes existantes (Submit → We match your platforms → We draft everything, in your voice → You approve, it goes live) restent la colonne vertébrale
- Le mockup de l'étape 2 ("We match your platforms") perd ses icônes Reddit/X/PH codées en dur — remplacées par un visuel plus générique (silhouettes de badges non-nommées, ou un texte "matched to your niche" sans logos spécifiques), cohérent avec le nouveau cadrage plateforme (§5)
- Le contenu de l'ancien `#pipeline` (buying signals, DM drafts, follow-ups) devient une 5e étape courte ou une ligne de conclusion après l'étape 4, pas une section à part avec son propre titre

Le CTA final (`#book`, formulaire de capture) reste inchangé dans sa position (fin de page), mais le contenu qui mène jusqu'à lui est désormais bien plus court.

## 4. Mécanique du lead magnet

Changement le plus profond, technique et opérationnel.

**Ce qui reste** : le scan instantané réel (`readiness.js` — meta tags, score PageSpeed) continue de s'afficher immédiatement après soumission de l'URL. C'est un signal vrai, jamais fabriqué, aucune raison de le retirer.

**Ce qui change** : les 3 previews de plateforme générées à la volée par Claude (`platform-copy.js`, appelées par `fetchPlatformCopy`) ne s'affichent plus immédiatement. C'est précisément ce qui donnait au prospect l'impression d'avoir "déjà tout reçu" sans avoir besoin de laisser son email.

**Ce qui remplace** : après soumission de l'email, message clair : *"We'll send your priority launch plan within 24h."* Derrière ce message, un vrai processus manuel : Cédric (seul ou avec Claude en soutien) regarde le site soumis et envoie un vrai avis personnalisé par email/DM sous 24h — canaux prioritaires réels pour la niche du prospect, et si pertinent 1-2 comptes/threads réels à cibler en priorité (c'est ici, en coulisses, que la piste "commentaires sur influenceurs" se teste réellement, sans jamais être promise publiquement sur la page).

**Implication technique** : `platform-copy.js` n'est plus appelé depuis le flux principal du lead magnet. Le fichier n'est pas supprimé (il pourra resservir une fois un vrai moteur de génération construit) mais devient du code mort côté frontend — à retirer de `fetchPlatformCopy()`/`runReadinessCheck()` dans `index.html`.

**Implication opérationnelle** : chaque soumission de lead magnet devient un engagement réel de suivi manuel sous 24h pour Cédric. Ce n'est pas qu'un changement de copy — c'est un vrai changement de charge de travail, cohérent avec la règle d'or du projet (le travail manuel avant l'automatisation) mais à ne pas sous-estimer si le volume de soumissions augmente.

## 5. Cadrage plateforme

Le texte de la page ne présente plus Reddit/X/Product Hunt comme "les 3 plateformes qu'on couvre" — le message devient "on trouve les bons canaux selon ta niche" (LinkedIn inclus si pertinent pour un prospect B2B, sans qu'un guide LinkedIn dédié existe encore). Les 3 guides existants restent en ligne, liés en footer et en nav ("Guides"), présentés comme preuve de méthode et de sérieux plutôt que comme la liste exhaustive de ce que couvre le service.

## Hors scope (explicitement, pour cette itération)

- Construire un vrai guide LinkedIn (pas nécessaire pour reformuler le discours en "selon ta niche" — un futur guide pourra s'ajouter plus tard sans dépendre de cette refonte)
- Automatiser le triage/priorisation par niche (reste manuel, fait par Cédric, pour cette itération — condition explicite avant toute automatisation future)
- Annoncer publiquement le mécanisme "commentaires sur influenceurs de niche" (reste une hypothèse testée en coulisses jusqu'à validation sur plusieurs cas réels)
- Construire un vrai visuel illustré (agent/personnage) pour l'animation hero — la version livrée réutilise les badges/pulsations SVG déjà existants ; un visuel plus élaboré pourra être substitué plus tard si Cédric en produit un
