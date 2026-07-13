# GetSeen

Service de lancement de SaaS exécuté par des agents IA, supervisé par un humain. Repo local `getseen` (renommé depuis `sonar`, nom de travail interne — le produit/la marque s'est aussi renommé depuis "Boooost", commit `d46acb8`). Pas de remote Git configuré, repo local uniquement.

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

## État (2026-07-13)

- Dernier commit local (`c9c2dce` au moment de la rédaction) : previews multi-plateformes générées par IA + lead magnet + CTA renommé ("Book my launch" → "Get my free launch analysis" / "Analyze my launch", l'ancien texte promettait une réservation qui n'avait jamais lieu). **Déployé et vérifié en prod** (`graceful-marzipan-b14e6e.netlify.app`) le 2026-07-13.
- Le dossier a été renommé `sonar` → `getseen` le 2026-07-13 ; aucun impact sur le lien Netlify (`.netlify/state.json` référence le site par id, indépendant du chemin).
