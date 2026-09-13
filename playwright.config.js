// @ts-check
const { defineConfig, devices } = require('@playwright/test');

// Quatre projets : mobile (390px) et desktop (1440px) sont alignés sur les
// deux breakpoints de la maquette Coming Soon validée (GGG-8). tablet
// (768px) n'a pas de maquette dédiée à ce jour : c'est un point de contrôle
// de robustesse (pas de casse/débordement/superposition à cette taille),
// pas une comparaison pixel-perfect à une maquette. desktop-short (1440x760)
// reproduit une vraie fenêtre de navigateur (barre d'adresse/onglets/favoris
// déduits, contrairement au viewport "pur" de desktop) — ajouté pour GGG-10
// suite à un débordement vertical qui passait entre les mailles des
// viewports trop généreux en hauteur ; ne fait tourner que
// responsive.spec.js, les autres suites ne dépendant pas de la hauteur.
// Politique projet : affichage correct à toute taille d'écran entre mobile
// et desktop, pas seulement aux breakpoints maquettés (voir
// agents/guidelines.md).
module.exports = defineConfig({
  testDir: './tests',
  fullyParallel: true,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:4173',
  },
  // Sert le contenu statique de public/ pendant l'exécution des tests.
  webServer: {
    command: 'npx serve public -l 4173',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: true,
  },
  projects: [
    {
      name: 'mobile',
      use: { ...devices['iPhone 12'], viewport: { width: 390, height: 844 } },
    },
    {
      name: 'tablet',
      use: { viewport: { width: 768, height: 1024 } },
    },
    {
      name: 'desktop',
      use: { viewport: { width: 1440, height: 900 } },
    },
    {
      name: 'desktop-short',
      testMatch: /responsive\.spec\.js/,
      use: { viewport: { width: 1440, height: 760 } },
    },
  ],
});
