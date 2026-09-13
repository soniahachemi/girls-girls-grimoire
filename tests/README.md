# Tests

Tests structurels, responsive et d'accessibilité de la page Coming Soon, écrits avec [Playwright Test](https://playwright.dev/) (config à la racine du dépôt : `playwright.config.js`).

- Projets : `mobile` (390px) et `desktop` (1440px), correspondant aux deux breakpoints de la maquette validée (GGG-8) ; `tablet` (768px), sans maquette dédiée — sert à vérifier l'absence de casse/débordement à cette taille, pas une conformité pixel-perfect. Politique projet : affichage correct à toute taille d'écran entre mobile et desktop, pas seulement aux breakpoints maquettés.
- Convention de nommage suggérée, un fichier par axe : `structure.spec.js`, `responsive.spec.js`, `accessibility.spec.js` — à adapter selon le jugement du Tester.
- `npm install` puis `npm test` pour lancer la suite (nécessite Node.js).

Ce dossier fait partie de l'outillage de dev, pas du site déployé (voir `public/` et `agents/guidelines.md`, section Tests).
