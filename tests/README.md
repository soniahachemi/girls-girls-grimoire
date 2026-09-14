# Tests

Tests structurels, responsive et d'accessibilité de la page Coming Soon, écrits avec [Playwright Test](https://playwright.dev/) (config à la racine du dépôt : `playwright.config.js`).

- Convention de nommage suggérée, un fichier par axe : `structure.spec.js`, `responsive.spec.js`, `accessibility.spec.js` — à adapter selon le jugement du Tester.
- `npm install` puis `npm test` pour lancer la suite (nécessite Node.js).

## Organisation des projets Playwright (GGG-12)

Les projets sont découpés selon deux axes indépendants, pour que l'ajout d'un moteur de rendu supplémentaire (prévu pour la V2, qui apportera plus de logique) se fasse sans jamais toucher un fichier de test :

- **Quel(s) fichier(s) de tests** un projet exécute (`testMatch`) : `structure.spec.js`/`accessibility.spec.js` ne dépendent pas de la taille d'écran, ils ne tournent donc qu'une fois par moteur couvert. `responsive.spec.js` dépend par construction de la taille d'écran.
- **Quel moteur de navigateur** un projet utilise (`use.browserName`, ou un device preset comme `devices['iPhone 12']`, qui implique aussi WebKit).

Un troisième axe — quelles tailles d'écran un projet couvre — est déclaré explicitement par projet via `metadata.sizes` (noms définis dans `tests/viewport-sizes.js`) : `tests/responsive.spec.js` lit cette liste et boucle dessus en interne (un `test.step` par taille), plutôt que de laisser Playwright dupliquer chaque test une fois par taille. Un comportement = un seul test, vérifié à plusieurs tailles.

Projets actuels :

- `structure-a11y-chromium` : `structure.spec.js` (10 tests) + `accessibility.spec.js` (7 tests), Chromium, une seule exécution — 17 tests.
- `responsive-mobile-webkit` : `responsive.spec.js` (6 tests) à la taille mobile (390×844), sur WebKit (device preset `iPhone 12` : tactile + UA mobile) — 6 tests.
- `responsive-chromium` : `responsive.spec.js` (6 tests), Chromium, bouclant en interne sur `tablet` (768×1024), `desktop` (1440×900) et `desktop-short` (1440×760, GGG-10) — 6 tests (18 vérifications).

**Total : 29 tests** (41 vérifications réelles), contre 78 avant GGG-12, sans perte de couverture : `tablet`/`desktop`/`desktop-short` ont des tailles distinctes et pertinentes (le CSS scale en `vmin`, donc desktop et desktop-short — même largeur, hauteur différente — ne sont pas redondants), et `mobile` reste sur son propre projet car c'est le seul à couvrir WebKit.

Pour ajouter un moteur (V2) : dupliquer un projet Chromium existant avec un `use.browserName` différent (ou un autre device preset) — aucun fichier de test à modifier.

Ce dossier fait partie de l'outillage de dev, pas du site déployé (voir `public/` et `agents/guidelines.md`, section Tests).
