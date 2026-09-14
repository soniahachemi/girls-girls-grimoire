// @ts-check

// Single source of truth for the viewport sizes the Coming Soon page needs
// to support. Shared between playwright.config.js (which assigns a subset
// of these sizes to each project via `metadata.sizes`) and
// tests/responsive.spec.js (which loops over exactly the sizes its current
// project declares). Keeping the actual widths/heights in one place avoids
// the config and the spec drifting apart.
//
// mobile (390x844) and desktop (1440x900) match the two breakpoints of the
// validated Coming Soon mockup (GGG-8). tablet (768x1024) has no dedicated
// mockup -- a robustness check only (no breakage/overflow), not a
// pixel-perfect match (project policy, see agents/guidelines.md).
// desktop-short (1440x760, GGG-10) shares desktop's width but approximates
// a real browser window's shorter usable height (address bar/tabs/
// bookmarks deducted) -- added after a real vertical-overflow bug the
// taller "pure" desktop viewport missed. It is not a duplicate of desktop:
// this page's CSS scales almost everything with vmin = min(vw, vh) (see
// public/assets/style.css), so a shorter height at the same width
// genuinely changes rendered sizes and positions.
module.exports = {
  mobile: { width: 390, height: 844 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1440, height: 900 },
  'desktop-short': { width: 1440, height: 760 },
};
