// Exemple de fichier généré par `npm run config` (à partir de .env en local,
// ou par le workflow de déploiement à partir des secrets GitHub Actions en
// production -- voir .github/workflows/deploy.yml).
//
// Le vrai fichier (public/assets/config.js) n'est jamais commité (voir
// .gitignore) : il est régénéré à chaque fois, localement ou en CI.
//
// La clé "publishable" Supabase est sûre à exposer côté client (protégée par
// les RLS, voir agents/guidelines.md, Sécurité) -- ce n'est pas un secret.
window.__SITE_CONFIG__ = {
  supabaseUrl: "https://xxxxxxxxxxxxxxxxxxxx.supabase.co",
  supabasePublishableKey: "sb_publishable_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  cloudinaryCloudName: "xxxxxxxx",
  cloudinaryFolder: "dev",
};
