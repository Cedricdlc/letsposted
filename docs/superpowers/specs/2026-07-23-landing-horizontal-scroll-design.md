# Design — Landing horizontale + éclatement multi-pages + sortie du fond noir

**Date** : 2026-07-23
**Statut** : approuvé par Cédric, prêt pour implémentation

## Contexte et déclencheur

Premier retour de Cédric sur la landing v2 (nav simplifiée, hero scroll-animé, sections fusionnées, lead magnet honnête), déployée le jour même. Trois retours structurants :

1. Le mécanisme du hero (texte qui change au scroll, viewport fixe) est validé, mais doit devenir un **scroll horizontal** plutôt que vertical — et surtout, **toute la landing principale** doit tenir sur ce seul mécanisme, sans aucun scroll vertical. La section "How It Works" (fusionnée à 5 étapes le jour même) doit sortir de la landing principale et vivre sur sa propre page.
2. La nav doit devenir une pill compacte flottante (référence visuelle "Fastlane" fournie), avec un CTA clair.
3. Le fond noir / esthétique "IA générique" actuelle doit disparaître. Cédric a explicitement indiqué que la direction artistique définitive n'est **pas** à figer maintenant ("on va trouver notre DA au fur et à mesure, je vais te montrer des exemples") — cette itération pose juste une base claire et neutre, réversible, sans sur-investir dans une direction (ex: collage vintage) pas encore validée.

## 1. Architecture des pages

| Page | Contenu | Scroll |
|---|---|---|
| `landing/index.html` (existant, réécrit) | Nav compacte + séquence horizontale : 4 phrases du hero actuel → formulaire de capture (dernier écran) | Horizontal uniquement, aucun scroll vertical |
| `landing/how-it-works.html` (nouveau) | La section "How It Works" à 5 étapes construite le jour même (steps + mockups + diagramme), retirée de `index.html` | Vertical classique |
| `landing/guides.html` (nouveau, page hub) | Liste les 3 guides existants (`product-hunt-launch.html`, `reddit-launch.html`, `x-launch.html`) : titre + description courte + lien vers chacun | Vertical classique |

Le footer (privacy policy) et la bannière CTA sticky actuels disparaissent de `index.html` (plus de place pour eux sans scroll vertical) ; `how-it-works.html` et `guides.html` gardent un footer classique avec le lien privacy policy.

**Interfaces conservées à l'identique** (aucune autre page/fonction ne doit changer) :
- `#capture-form-hero` / `#cap-url-hero`, le flux `openPlatformModal()` / `runReadinessCheck()` / la modal de lead magnet — inchangés, juste réancrés dans le dernier écran horizontal au lieu du bas de la page verticale.
- `readiness.js` / `platform-copy.js` — non touchés par ce chantier.

## 2. Nav compacte

Pill flottante `position:fixed`, toujours visible par-dessus le scroll horizontal (haut de la page, centrée). Contenu, de gauche à droite :
- Logo (`Posted.`, style sticker existant, conservé)
- Lien "How it works" → `how-it-works.html`
- Lien "Guides" → `guides.html`
- Bouton CTA solide "Get access to the beta" → scroll/saute au dernier écran horizontal (le formulaire)

Fond blanc/clair opaque (pas transparent), bordure ou ombre légère pour se détacher du contenu qui défile derrière.

## 3. Mécanique du scroll horizontal

**Desktop** : un conteneur (`#h-scroll`) avec `overflow-x:auto; overflow-y:hidden; scroll-snap-type:x mandatory`, contenant 5 écrans côte à côte (`width:100vw` chacun, `scroll-snap-align:start`) : phrase 1, phrase 2, phrase 3, phrase 4, formulaire. Un listener `wheel` sur le conteneur intercepte le geste vertical standard (molette/trackpad) et le convertit en défilement horizontal via `container.scrollBy({ left: e.deltaY, behavior: 'auto' })`, avec `e.preventDefault()` pour empêcher le scroll vertical natif de la page.

**Mobile** : aucune interception JS nécessaire — le conteneur horizontal scrollable répond nativement au swipe tactile gauche/droite, qui est déjà le bon axe. Le diagramme SVG pulsant reste caché sous 900px comme actuellement (déjà en place).

**Accessibilité** :
- `prefers-reduced-motion: reduce` : le scroll déclenché par `scrollBy` utilise `behavior:'auto'` (jamais `'smooth'`), donc déjà instantané par défaut — pas de comportement supplémentaire à ajouter au-delà de ce choix.
- Navigation clavier : le conteneur `#h-scroll` reste focusable (`tabindex="0"`) pour que les flèches gauche/droite du clavier fonctionnent nativement sur un élément `overflow-x:auto` scrollable — comportement natif du navigateur, rien à coder.
- Les badges de la nav gardent un contraste texte suffisant sur fond clair (à vérifier visuellement à l'implémentation, pas de valeur numérique imposée ici).

## 4. DA de départ (base réversible, pas la version finale)

Nouvelle palette claire, en remplacement direct des tokens sombres actuels dans `:root` :
```css
--bg:        #FBF8F1;  /* crème très clair, pas blanc pur */
--card:      #F3EEE0;  /* légèrement plus soutenu, pour les surfaces */
--card-2:    #EFE9D8;
--line:      #E2DBC8;
--line-soft: #EAE4D3;
--ink:       #1A1917;  /* texte principal, quasi-noir */
--body:      #57534A;  /* texte secondaire, gris chaud */
--faint:     #8A8478;
--accent:    #F2E96A;  /* jaune de marque, inchangé */
--accent-2:  #C9A800;  /* variante plus foncée du jaune, lisible sur fond clair (le --accent-2 actuel, identique à --accent, ne l'était pas) */
```
Le style sticker (bordure noire épaisse `#141414` + ombre décalée) et le surlignage marqueur restent inchangés dans leur mécanique — ils fonctionnent déjà aussi bien sur fond clair que sombre. Aucun élément collage/vintage n'est introduit dans cette itération ; ce n'est pas un renoncement à cette piste, juste une décision explicite de ne pas la construire avant que Cédric ait validé une direction avec d'autres exemples.

## Précision technique — pas de feuille de style partagée

Chaque page de `landing/` est un fichier HTML self-contained avec son propre `<style>` inline (pas de CSS partagé entre pages, pattern déjà en place pour `product-hunt-launch.html`/`reddit-launch.html`/`x-launch.html`, qui utilisent d'ailleurs une palette pastel-crème différente, non touchée par ce chantier). `how-it-works.html` et `guides.html` étant de nouveaux fichiers, ils ne "héritent" de rien automatiquement : leur `<style>` doit explicitement copier les tokens `:root` clairs définis en §4, puisque `how-it-works.html` récupère du contenu qui vivait jusqu'ici dans `index.html` et doit garder la même identité visuelle que la page dont il est issu. `guides.html`, lié depuis la même nav, adopte la même palette pour rester cohérent.

## Hors scope (explicitement, pour cette itération)

- La direction artistique finale (collage/vintage ou autre) — reste à explorer avec Cédric via d'autres références
- Une vraie page "use case" — le 2e lien de nav pointe vers les guides existants, pas vers un contenu à créer
- Retoucher la palette des 3 guides existants (`product-hunt-launch.html`/`reddit-launch.html`/`x-launch.html`) — hors scope, gardent leur palette pastel-crème actuelle
