// =============================================================================
// SVG SANITIZER — INTERFACE ONLY (Phase 0)
//
// User-supplied SVG is untrusted input. The real implementation arrives in
// Phase 5 (allow-list based; strips <script>, <foreignObject>, on* handlers,
// external hrefs, @import). Until then this stub REJECTS EVERYTHING, so no
// unsanitized SVG can ever be accepted by accident.
//
// Hard rule for all code that renders custom SVG: only via <img> or CSS
// `url(data:image/svg+xml,...)` — never inject it into the DOM as HTML.
// =============================================================================

export type SanitizeResult =
  | { ok: true; svg: string }
  | { ok: false; reason: string };

export function sanitizeSvg(_raw: string): SanitizeResult {
  return { ok: false, reason: "Custom SVG support is not enabled yet." };
}
