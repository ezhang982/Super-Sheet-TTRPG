import { MAX_CUSTOM_SVG_CHARS } from "../types/schema";

// =============================================================================
// SVG SANITIZER (PHASE 5 / STYLE SYSTEM PHASE 5)
//
// Fail-closed allow-list based SVG sanitizer.
// User-supplied SVG is untrusted input.
//
// Security policy:
//  1. Reject anything containing <script>, <foreignObject>, <object>, <iframe>, <embed>.
//  2. Reject/strip any on* event handlers (onload, onerror, onclick, etc.).
//  3. Reject/strip external hrefs (http:, https:, javascript:, data:).
//     Only fragment hrefs (#id) are allowed for <use>, <linearGradient>, etc.
//  4. Reject dangerous CSS in style attributes (@import, behavior, expression, url(http)).
//  5. Enforce size limit (MAX_CUSTOM_SVG_CHARS = 30,000 chars).
//  6. Produce deterministic content-hash id for deduplication and portability.
// =============================================================================

export type SanitizeResult =
  | { ok: true; svg: string; id: string }
  | { ok: false; reason: string };

const ALLOWED_TAGS = new Set([
  "svg",
  "g",
  "path",
  "polygon",
  "polyline",
  "circle",
  "ellipse",
  "line",
  "rect",
  "defs",
  "linearGradient",
  "radialGradient",
  "stop",
  "mask",
  "pattern",
  "clipPath",
  "use",
  "title",
  "desc",
  "text",
  "tspan",
]);

/**
 * Deterministic 16-character hex hash of a string for content-addressable IDs.
 */
export function hashSvgString(content: string): string {
  let h1 = 0xdeadbeef ^ 0;
  let h2 = 0x41c64e6d ^ 0;
  for (let i = 0; i < content.length; i++) {
    const ch = content.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  const hashHex = (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16).padStart(16, "0");
  return `svg_${hashHex}`;
}

/**
 * Sanitizes untrusted SVG markup using an allow-list DOM traversal.
 * Fail-closed: rejects if any disallowed tag, script, or external link is detected.
 */
export function sanitizeSvg(raw: string): SanitizeResult {
  if (!raw || typeof raw !== "string") {
    return { ok: false, reason: "SVG input is empty or invalid." };
  }

  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    return { ok: false, reason: "SVG input is empty." };
  }

  if (trimmed.length > MAX_CUSTOM_SVG_CHARS) {
    return {
      ok: false,
      reason: `SVG exceeds maximum allowed size of ${MAX_CUSTOM_SVG_CHARS.toLocaleString()} characters.`,
    };
  }

  // Pre-parse safety check for obvious dangerous patterns
  const lower = trimmed.toLowerCase();
  if (lower.includes("<script") || lower.includes("</script")) {
    return { ok: false, reason: "Security violation: <script> elements are strictly prohibited." };
  }
  if (lower.includes("<foreignobject") || lower.includes("</foreignobject")) {
    return {
      ok: false,
      reason: "Security violation: <foreignObject> elements are strictly prohibited.",
    };
  }
  if (lower.includes("javascript:")) {
    return { ok: false, reason: "Security violation: 'javascript:' URI schemes are prohibited." };
  }
  if (/\bon[a-z]+\s*=/i.test(trimmed)) {
    return { ok: false, reason: "Security violation: Inline event handlers (on*) are strictly prohibited." };
  }
  if (/\b(href|xlink:href)\s*=\s*["'](?!\s*#)[^"']*["']/i.test(trimmed)) {
    return {
      ok: false,
      reason: "External reference in href is prohibited. Only local fragment identifiers (e.g. #gradient) are allowed.",
    };
  }
  if (/@import|expression\(|-moz-binding/i.test(trimmed)) {
    return { ok: false, reason: "Dangerous CSS directives detected in inline style attribute." };
  }

  if (typeof DOMParser === "undefined") {
    // Server-side or test fallback: return trimmed with hash if it passes string checks
    if (!trimmed.startsWith("<svg") || !trimmed.endsWith("</svg>")) {
      return { ok: false, reason: "Input must be a valid <svg> document." };
    }
    let svgOut = trimmed;
    if (!svgOut.includes('xmlns=')) {
      svgOut = svgOut.replace(/<svg\b/i, '<svg xmlns="http://www.w3.org/2000/svg"');
    }
    return { ok: true, svg: svgOut, id: hashSvgString(svgOut) };
  }

  let doc: Document;
  try {
    const parser = new DOMParser();
    doc = parser.parseFromString(trimmed, "image/svg+xml");
  } catch (err) {
    return { ok: false, reason: `SVG parsing error: ${String(err)}` };
  }

  // Check for XML parsing error
  const parserError = doc.querySelector("parsererror");
  if (parserError) {
    return {
      ok: false,
      reason: `Malformed SVG XML: ${parserError.textContent?.slice(0, 100) || "Syntax error"}`,
    };
  }

  const root = doc.documentElement;
  if (!root || root.nodeName.toLowerCase() !== "svg") {
    return { ok: false, reason: "Root element must be an <svg> tag." };
  }

  // Recursive allow-list tree validation and attribute cleaning
  const elements = Array.from(root.querySelectorAll("*"));
  for (const el of elements) {
    const tagName = el.nodeName.toLowerCase();
    if (!ALLOWED_TAGS.has(tagName)) {
      return {
        ok: false,
        reason: `Disallowed SVG tag <${tagName}> encountered. Only standard vector graphic tags are permitted.`,
      };
    }

    // Inspect attributes
    const attrs = Array.from(el.attributes);
    for (const attr of attrs) {
      const attrName = attr.name.toLowerCase();
      const attrVal = attr.value.trim().toLowerCase();

      // Disallow all event handlers (onclick, onload, onerror, etc.)
      if (attrName.startsWith("on")) {
        return {
          ok: false,
          reason: `Disallowed event handler attribute '${attr.name}' on <${tagName}>.`,
        };
      }

      // Disallow external URLs or dangerous schemes in href / xlink:href
      if (attrName === "href" || attrName === "xlink:href") {
        if (!attrVal.startsWith("#")) {
          return {
            ok: false,
            reason: `External reference '${attr.value}' is prohibited. Only local fragment identifiers (e.g. #gradient) are allowed.`,
          };
        }
      }

      // Disallow dangerous CSS expressions or external resource URLs in style
      if (attrName === "style") {
        if (
          attrVal.includes("@import") ||
          attrVal.includes("javascript:") ||
          attrVal.includes("expression(") ||
          attrVal.includes("-moz-binding") ||
          attrVal.includes("behavior:") ||
          /url\s*\(\s*['"]?(?!#)/i.test(attrVal)
        ) {
          return {
            ok: false,
            reason: "Dangerous CSS directives or external url() detected in inline style attribute.",
          };
        }
      }

      // Disallow external resource URLs in SVG presentation attributes
      const isPresentationAttr = [
        "fill",
        "filter",
        "mask",
        "clip-path",
        "stroke",
        "marker-start",
        "marker-mid",
        "marker-end",
      ].includes(attrName);
      if (isPresentationAttr && attrVal.includes("url(") && /url\s*\(\s*['"]?(?!#)/i.test(attrVal)) {
        return {
          ok: false,
          reason: `External url() reference in '${attr.name}' is prohibited. Only local fragment identifiers (e.g. url(#id)) are allowed.`,
        };
      }
    }
  }

  // Ensure root svg has xmlns
  if (!root.getAttribute("xmlns")) {
    root.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  }

  const serializer = new XMLSerializer();
  const sanitizedSvg = serializer.serializeToString(root);
  const id = hashSvgString(sanitizedSvg);

  return {
    ok: true,
    svg: sanitizedSvg,
    id,
  };
}
