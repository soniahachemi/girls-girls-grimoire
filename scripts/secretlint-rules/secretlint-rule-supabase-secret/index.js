"use strict";

/**
 * Secretlint custom rule -- Supabase secret key detector.
 *
 * Supabase's new API key format (2026) uses `sb_secret_...` for the
 * privileged/secret key (replacing the legacy `service_role` JWT), and
 * `sb_publishable_...` for the public key (replacement for `anon`, safe to
 * expose client-side -- not scanned here on purpose).
 *
 * The official secretlint recommended preset (@secretlint/secretlint-rule-preset-recommend)
 * has no built-in rule for Supabase keys (verified empirically on GGG-14,
 * 16/09/2026 -- neither the legacy JWT format nor this new format is caught
 * by the preset's AWS/GCP/Slack/GitHub/SendGrid/private-key/basic-auth rules).
 * This local rule closes that gap for the new key format, which is the one
 * actually in use by this project's Supabase projects (legacy keys disabled).
 */

const messages = {
  SupabaseSecretKey: {
    en: () =>
      "Found a Supabase secret key (sb_secret_...) -- this must never be committed. Use an environment variable / GitHub Actions secret instead.",
  },
};

// sb_secret_ followed by the key body (alphanumeric, underscore, hyphen).
const SUPABASE_SECRET_KEY_PATTERN = /\bsb_secret_[A-Za-z0-9_-]{10,}\b/g;

const creator = {
  messages: messages,
  meta: {
    id: "secretlint-rule-supabase-secret",
    recommended: true,
    type: "scanner",
    supportedContentTypes: ["text"],
    docs: {
      url: "agents/guidelines.md",
    },
  },
  create: function (context) {
    const t = context.createTranslator(messages);
    return {
      file: function (source) {
        const results = source.content.matchAll(SUPABASE_SECRET_KEY_PATTERN);
        for (const result of results) {
          const index = result.index || 0;
          const match = result[0] || "";
          context.report({
            message: t("SupabaseSecretKey"),
            range: [index, index + match.length],
          });
        }
      },
    };
  },
};

module.exports = { creator };
