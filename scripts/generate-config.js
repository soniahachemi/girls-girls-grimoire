#!/usr/bin/env node
"use strict";

/**
 * Génère public/assets/config.js à partir de variables d'environnement.
 *
 * - En local (dev) : ces variables viennent de `.env` (jamais commité),
 *   chargé ci-dessous par un petit parseur maison (pas de dépendance ajoutée).
 * - En CI (prod) : ces variables sont déjà présentes dans l'environnement du
 *   job GitHub Actions (secrets injectés par le workflow, voir
 *   .github/workflows/deploy.yml) — le chargement de `.env` est alors un
 *   no-op puisque le fichier n'existe pas sur le runner.
 *
 * Exception ciblée et minime à la convention "aucune étape de build" du
 * projet (voir agents/guidelines.md, Stack) : ce script ne fait que générer
 * un petit fichier de config, il ne transforme ni ne fabrique le site.
 */

const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.join(__dirname, "..");
const ENV_FILE = path.join(ROOT, ".env");
const OUTPUT_FILE = path.join(ROOT, "public", "assets", "config.js");

const REQUIRED_VARS = [
  "SUPABASE_URL",
  "SUPABASE_PUBLISHABLE_KEY",
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_FOLDER",
];

/** Charge .env dans process.env sans écraser une variable déjà définie
 * (les valeurs déjà présentes dans l'environnement -- ex. secrets GitHub
 * Actions en CI -- ont donc toujours la priorité sur .env). */
function loadDotEnvIfPresent(envFilePath) {
  if (!fs.existsSync(envFilePath)) {
    return;
  }
  const content = fs.readFileSync(envFilePath, "utf8");
  for (const rawLine of content.split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }
    const eqIndex = line.indexOf("=");
    if (eqIndex === -1) {
      continue;
    }
    const key = line.slice(0, eqIndex).trim();
    let value = line.slice(eqIndex + 1).trim();
    // Retire des guillemets englobants éventuels ("valeur" ou 'valeur').
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

function main() {
  loadDotEnvIfPresent(ENV_FILE);

  const missing = REQUIRED_VARS.filter((name) => !process.env[name]);
  if (missing.length > 0) {
    console.error(
      `[generate-config] Variable(s) manquante(s) : ${missing.join(", ")}.\n` +
        "En local : vérifier .env (voir .env.example pour la liste des variables attendues).\n" +
        "En CI : vérifier les secrets GitHub Actions et l'étape 'Generate site config' du workflow."
    );
    process.exit(1);
  }

  const config = {
    supabaseUrl: process.env.SUPABASE_URL,
    supabasePublishableKey: process.env.SUPABASE_PUBLISHABLE_KEY,
    cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME,
    cloudinaryFolder: process.env.CLOUDINARY_FOLDER,
  };

  const fileContent =
    "// Fichier généré automatiquement par scripts/generate-config.js -- ne pas éditer à la main.\n" +
    "// Voir public/assets/config.example.js pour la forme attendue, et\n" +
    "// agents/guidelines.md (Stack, Sécurité, Déploiement) pour le mécanisme dev/prod.\n" +
    `window.__SITE_CONFIG__ = ${JSON.stringify(config, null, 2)};\n`;

  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, fileContent, "utf8");
  console.log(`[generate-config] public/assets/config.js généré (environnement Supabase : ${config.supabaseUrl}).`);
}

main();
