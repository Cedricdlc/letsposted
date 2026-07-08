# Sonar

Service de lancement de SaaS exécuté par des agents IA, supervisé par un humain. Cible : fondateurs solo/duo de SaaS dev tools, francophones, financés ou rentables, qui s'apprêtent à lancer un produit ou une feature majeure.

Contexte complet, ICP, positionnement, risques et sources : voir `docs/prompt-contexte-projet.md`.
Copy de la landing page : voir `docs/copy-landing-value-proposition.md`.

## Structure

```
landing/   → landing page statique (index.html, déployable sur Netlify)
agents/    → modules Intake, Factory, Scout, Cockpit (à construire)
docs/      → contexte projet, copy, décisions
```

## Statut

- [x] Copy landing validée
- [x] Landing page HTML construite (`landing/index.html`)
- [ ] Déploiement Netlify
- [ ] Premier lancement manuel (dry-run) documenté en public
- [ ] Factory (génération d'assets de lancement)
- [ ] Scout (détection de signaux + prospects)
- [ ] Intake / Cockpit (v0 minimale : formulaire + tableur)
