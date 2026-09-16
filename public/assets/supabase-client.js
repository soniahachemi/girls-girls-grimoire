// Client Supabase partagé pour les pages du site (V2+).
//
// À inclure dans cet ordre, après le CDN de @supabase/supabase-js et après
// le fichier de config généré :
//
//   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
//   <script src="assets/config.js"></script>
//   <script src="assets/supabase-client.js"></script>
//
// Expose `window.supabaseClient`, prêt à requêter les tables (lecture
// publique via RLS -- voir GGG-13). Aucune écriture publique n'est possible
// avec cette clé (voir agents/guidelines.md, Sécurité).
(function () {
  "use strict";

  if (!window.__SITE_CONFIG__) {
    console.error(
      "[supabase-client] Config manquante -- voir public/assets/config.example.js " +
        "et scripts/generate-config.js (npm run config)."
    );
    return;
  }

  if (!window.supabase || typeof window.supabase.createClient !== "function") {
    console.error(
      "[supabase-client] @supabase/supabase-js introuvable -- vérifier que le " +
        "script CDN est chargé avant celui-ci."
    );
    return;
  }

  window.supabaseClient = window.supabase.createClient(
    window.__SITE_CONFIG__.supabaseUrl,
    window.__SITE_CONFIG__.supabasePublishableKey
  );
})();
