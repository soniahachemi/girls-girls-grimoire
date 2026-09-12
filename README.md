# Girls Girls Grimoire

Coming soon landing page for [girlsgirlsgrimoire.com](https://girlsgirlsgrimoire.com).

## Stack

Plain HTML/CSS — no framework, no build step.

- `public/index.html` — page markup.
- `public/assets/style.css` — styles.

`public/` is the only folder actually deployed — everything else at the repo root (`package.json`, `tests/`) is dev tooling, not part of the live site.

## Tests

Playwright Test (`npm install`, then `npm test`) — structural, responsive and basic accessibility checks against `public/`. See `tests/README.md`.

## Deployment

Automatic deployment to Hostinger via its native Git integration on every push to `main`, configured to deploy from `public/`.
