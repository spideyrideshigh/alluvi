// Server-side rendering of the public site from data/site.json.
const fs = require("fs");
const path = require("path");
const { priceFor } = require("./pricing");

const PUBLIC_DIR = path.join(__dirname, "..", "public");

// Adds ?v=<last modified time> so browsers fetch CSS/JS again whenever it changes
function asset(url) {
  try {
    return url + "?v=" + Math.floor(fs.statSync(path.join(PUBLIC_DIR, url)).mtimeMs).toString(36);
  } catch (e) {
    return url;
  }
}

const RESERVED_SLUGS = ["admin", "api", "checkout", "products", "sitemap.xml", "robots.txt", "css", "js", "images", "uploads"];

const HEADING_FONTS = ["Faculty Glyphic", "Playfair Display", "Cormorant Garamond", "Fraunces", "DM Serif Display", "Libre Baskerville", "Lora", "Marcellus"];
const BODY_FONTS = ["Plus Jakarta Sans", "Inter", "DM Sans", "Manrope", "Poppins", "Montserrat", "Work Sans", "Nunito Sans"];

const ICONS = {
  snowflake: '<path d="M12 2v20M4.9 6l14.2 12M19.1 6L4.9 18M2 12h20"/>',
  truck: '<path d="M1 6h13v11H1zM14 10h4l4 4v3h-8z"/><circle cx="5.5" cy="18.5" r="2"/><circle cx="17.5" cy="18.5" r="2"/>',
  lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 018 0v4"/>',
  shield: '<path d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6z"/><path d="M8.5 12l2.5 2.5L15.5 10"/>',
  pen: '<path d="M18 2l4 4M15 5l4 4M3 21l3-3M5 15l4 4 10-10-4-4z"/>',
  box: '<path d="M21 8l-9-5-9 5v8l9 5 9-5z"/><path d="M3 8l9 5 9-5M12 13v8"/>',
  flask: '<path d="M9 2h6M10 2v6L4 19a2 2 0 002 3h12a2 2 0 002-3l-6-11V2"/><path d="M7 15h10"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/>',
  star: '<path d="M12 3l2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9z"/>',
  check: '<circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
  tag: '<path d="M20 12l-8 8-9-9V3h8z"/><circle cx="7.5" cy="7.5" r="1.5"/>',
  file: '<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6M9 13h6M9 17h6"/>',
  phone: '<path d="M22 16.9v3a2 2 0 01-2.2 2 19.8 19.8 0 01-8.6-3.1 19.5 19.5 0 01-6-6A19.8 19.8 0 012.1 4.2 2 2 0 014.1 2h3a2 2 0 012 1.7c.1.9.4 1.8.7 2.7a2 2 0 01-.5 2.1L8 9.8a16 16 0 006 6l1.3-1.3a2 2 0 012.1-.4c.9.3 1.8.6 2.7.7a2 2 0 011.7 2z"/>',
  pin: '<path d="M12 22s7-6.1 7-12a7 7 0 00-14 0c0 5.9 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/>',
};

const CART_ICON = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 2l-2 4v14a2 2 0 002 2h12a2 2 0 002-2V6l-2-4z"/><path d="M4 6h16M16 10a4 4 0 01-8 0"/></svg>';
const ARROW = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';

function esc(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Admin-entered links: allow relative, http(s), mailto and tel only
function safeUrl(url) {
  const u = String(url || "").trim();
  if (!u) return "#";
  if (/^(https?:|mailto:|tel:|\/|#|\?)/i.test(u)) return u;
  if (/^[a-z][a-z0-9+.-]*:/i.test(u)) return "#";
  return u;
}

function icon(name, attrs = "") {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${attrs}>${ICONS[name] || ICONS.check}</svg>`;
}

function jsonForScript(data) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

function money(site, value) {
  return new Intl.NumberFormat(site.settings.locale || "en-GB", { style: "currency", currency: site.settings.currency || "GBP" }).format(value);
}

function pagePath(page) {
  return "/" + (page.slug || "");
}

function productPath(product) {
  return "/products/" + product.slug;
}

function absUrl(base, url) {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  return base.replace(/\/$/, "") + (url.startsWith("/") ? url : "/" + url);
}

function fill(text) {
  return String(text || "").replace(/\{year\}/g, new Date().getFullYear());
}

function isHexColor(v) {
  return /^#[0-9a-f]{3,8}$/i.test(v || "");
}

function baseUrl(site, req) {
  if (site.seo.siteUrl) return site.seo.siteUrl.replace(/\/$/, "");
  return `${req.protocol}://${req.get("host")}`;
}

/* ------------------------------------------------------------------ */
/* Products                                                             */
/* ------------------------------------------------------------------ */

function activeProducts(site) {
  return site.products.filter((p) => p.status === "active" && p.variants.length);
}

function defaultVariant(product) {
  return product.variants.find((v) => v.inStock) || product.variants[0];
}

function productImage(product, variant) {
  return (variant && variant.image) || (product.images[0] || {}).src || "";
}

function fromPrice(product) {
  return Math.min(...product.variants.map((v) => v.price));
}

function inStock(product) {
  return product.variants.some((v) => v.inStock);
}

// Catalogue sent to the browser for the cart and buy forms
function catalog(site) {
  return activeProducts(site).map((p) => ({
    id: p.id,
    name: p.name,
    url: productPath(p),
    image: productImage(p),
    variants: p.variants.map((v) => ({ id: v.id, name: v.name, price: v.price, compareAtPrice: v.compareAtPrice, inStock: v.inStock, image: v.image || "" })),
  }));
}

/* ------------------------------------------------------------------ */
/* Layout                                                               */
/* ------------------------------------------------------------------ */

function themeStyle(site) {
  const t = site.settings.theme || {};
  const vars = ["bg", "surface", "tint", "text", "muted", "accent"]
    .filter((k) => isHexColor(t[k]))
    .map((k) => `--${k}:${t[k]};`)
    .join("");
  const hf = HEADING_FONTS.includes(site.settings.headingFont) ? site.settings.headingFont : HEADING_FONTS[0];
  const bf = BODY_FONTS.includes(site.settings.bodyFont) ? site.settings.bodyFont : BODY_FONTS[0];
  return {
    css: `:root{${vars}--font-heading:"${hf}",Georgia,serif;--font-body:"${bf}",system-ui,sans-serif;}`,
    fontsUrl: `https://fonts.googleapis.com/css2?family=${hf.replace(/ /g, "+")}&family=${bf.replace(/ /g, "+")}:wght@400;500;600;700&display=swap`,
  };
}

// ctx: { title, rawTitle, seo, description, image, path, noindex, ogType, jsonLd, baseUrl }
function seoHead(site, ctx) {
  const seo = site.seo;
  const own = ctx.seo || {};
  let title = own.title || ctx.title || site.settings.storeName;
  if (!ctx.rawTitle && seo.titleTemplate && seo.titleTemplate.includes("%s")) title = seo.titleTemplate.replace("%s", title);

  const description = own.description || ctx.description || seo.defaultDescription || "";
  const canonical = own.canonical ? absUrl(ctx.baseUrl, own.canonical) : absUrl(ctx.baseUrl, ctx.path);
  const noindex = seo.noindexSite || ctx.noindex || own.noindex;
  const ogImage = absUrl(ctx.baseUrl, own.ogImage || ctx.image || seo.ogImage);

  const tags = [
    `<title>${esc(title)}</title>`,
    description && `<meta name="description" content="${esc(description)}">`,
    `<link rel="canonical" href="${esc(canonical)}">`,
    `<meta name="robots" content="${noindex ? "noindex, nofollow" : "index, follow, max-image-preview:large"}">`,
    `<meta property="og:site_name" content="${esc(site.settings.storeName)}">`,
    `<meta property="og:type" content="${ctx.ogType || "website"}">`,
    `<meta property="og:title" content="${esc(title)}">`,
    description && `<meta property="og:description" content="${esc(description)}">`,
    `<meta property="og:url" content="${esc(canonical)}">`,
    ogImage && `<meta property="og:image" content="${esc(ogImage)}">`,
    `<meta property="og:locale" content="${esc((site.settings.locale || "en-GB").replace("-", "_"))}">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    seo.twitterHandle && `<meta name="twitter:site" content="${esc(seo.twitterHandle)}">`,
    `<meta name="twitter:title" content="${esc(title)}">`,
    description && `<meta name="twitter:description" content="${esc(description)}">`,
    ogImage && `<meta name="twitter:image" content="${esc(ogImage)}">`,
    seo.googleVerification && `<meta name="google-site-verification" content="${esc(seo.googleVerification)}">`,
    seo.bingVerification && `<meta name="msvalidate.01" content="${esc(seo.bingVerification)}">`,
  ];
  if (!noindex) for (const item of ctx.jsonLd || []) tags.push(`<script type="application/ld+json">${jsonForScript(item)}</script>`);
  return tags.filter(Boolean).join("\n  ");
}

function productSchema(site, product, url, base) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.shortDescription,
    category: product.category || undefined,
    brand: product.brand ? { "@type": "Brand", name: product.brand } : undefined,
    image: product.images.map((i) => absUrl(base, i.src)),
    url: absUrl(base, url),
    offers: product.variants.map((v) => ({
      "@type": "Offer",
      name: v.name,
      sku: v.sku || undefined,
      url: absUrl(base, url),
      priceCurrency: site.settings.currency,
      price: v.price.toFixed(2),
      availability: v.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
    })),
  };
}

function faqSchema(items) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((q) => ({ "@type": "Question", name: q.question, acceptedAnswer: { "@type": "Answer", text: q.answer } })),
  };
}

function breadcrumbSchema(base, crumbs) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c[0], item: absUrl(base, c[1]) })),
  };
}

function logo(site) {
  const s = site.settings;
  if (s.logoImage) {
    return `<a class="logo logo--img" href="/"><img src="${esc(s.logoImage)}" alt="${esc(s.storeName)}" style="height:${Number(s.logoHeight) || 40}px"></a>`;
  }
  return `<a class="logo" href="/">${esc(s.logoText)}${s.logoSubtext ? `<small>${esc(s.logoSubtext)}</small>` : ""}</a>`;
}

function announcement(site) {
  const a = site.announcement;
  if (!a.enabled || !a.items.length) return "";
  const items = a.items.map((i) => `<span>${esc(i.text)}</span>`).join("");
  const copy = a.items.map((i) => `<span aria-hidden="true">${esc(i.text)}</span>`).join("");
  return `<div class="announcement" aria-label="Store announcements"><div class="marquee__track">${items}${copy}</div></div>`;
}

function gate(site) {
  const g = site.gate;
  if (!g.enabled) return "";
  return `<div class="gate" id="gate" role="dialog" aria-modal="true" aria-labelledby="gateTitle" hidden>
    <div class="gate__box">
      ${g.eyebrow ? `<p class="eyebrow">${esc(g.eyebrow)}</p>` : ""}
      <h2 id="gateTitle">${esc(g.title)}</h2>
      <div class="gate__text">${g.html}</div>
      <div class="gate__actions">
        <button class="btn btn--primary btn--block" id="gateAccept" type="button">${esc(g.acceptLabel)}</button>
        <a class="btn btn--secondary btn--block" href="${esc(safeUrl(g.leaveUrl))}">${esc(g.leaveLabel)}</a>
      </div>
    </div>
  </div>`;
}

function header(site) {
  const nav = site.navigation;
  const links = nav.header.map((l) => `<a href="${esc(safeUrl(l.url))}">${esc(l.label)}</a>`).join("");
  const btn = nav.headerButton && nav.headerButton.label ? `<a class="btn btn--primary btn--sm header__btn" href="${esc(safeUrl(nav.headerButton.url))}">${esc(nav.headerButton.label)}</a>` : "";
  return `<header class="header">
    <div class="container header__inner">
      ${logo(site)}
      <nav class="header__nav" id="siteNav" aria-label="Main">${links}</nav>
      <div class="header__actions">
        ${btn}
        <button class="cart-btn" type="button" data-cart-open aria-label="Open cart">${CART_ICON}<span class="cart-btn__count" data-cart-count hidden>0</span></button>
        <button class="header__menu" id="menuToggle" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="siteNav">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M3 7h18M3 12h18M3 17h18"/></svg>
        </button>
      </div>
    </div>
  </header>`;
}

function cartDrawer(site) {
  const c = site.checkout;
  return `<div class="drawer" id="cartDrawer" hidden>
    <div class="drawer__overlay" data-cart-close></div>
    <aside class="drawer__panel" role="dialog" aria-modal="true" aria-labelledby="cartTitle">
      <div class="drawer__head">
        <h2 id="cartTitle">${esc(c.cartTitle)}</h2>
        <button class="drawer__close" type="button" data-cart-close aria-label="Close cart"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg></button>
      </div>
      <div class="drawer__body" data-cart-lines></div>
      <div class="drawer__empty" data-cart-empty hidden>
        <p>${esc(c.emptyCartText)}</p>
        <button class="btn btn--secondary" type="button" data-cart-close>Continue shopping</button>
      </div>
      <div class="drawer__foot" data-cart-foot>
        <div class="drawer__row"><span>Subtotal</span><span data-cart-subtotal></span></div>
        <div class="drawer__row drawer__row--save" data-cart-discount-row hidden><span data-cart-discount-label></span><span data-cart-discount></span></div>
        <div class="drawer__row drawer__row--total"><span>Total</span><strong data-cart-total></strong></div>
        ${c.cartNote ? `<p class="drawer__note">${esc(c.cartNote)}</p>` : ""}
        <a class="btn btn--primary btn--block btn--lg" href="/checkout">Checkout ${ARROW}</a>
      </div>
    </aside>
  </div>`;
}

function footer(site) {
  const s = site.settings;
  const cols = site.navigation.footer
    .map((c) => `<div><h4>${esc(c.title)}</h4><ul>${(c.links || []).map((l) => `<li><a href="${esc(safeUrl(l.url))}">${esc(l.label)}</a></li>`).join("")}</ul></div>`)
    .join("");
  const contact = [
    s.contactEmail && `<li><a href="mailto:${esc(s.contactEmail)}">${esc(s.contactEmail)}</a></li>`,
    s.contactPhone && `<li><a href="tel:${esc(s.contactPhone.replace(/\s/g, ""))}">${esc(s.contactPhone)}</a></li>`,
    s.businessHours && `<li>${esc(s.businessHours)}</li>`,
    s.address && `<li>${esc(s.address)}</li>`,
  ]
    .filter(Boolean)
    .join("");
  return `<footer class="footer">
    <div class="container">
      <div class="footer__grid" style="--cols:${site.navigation.footer.length + (contact ? 1 : 0)}">
        <div>
          ${logo(site)}
          ${s.footerAbout ? `<p style="margin-top:16px;max-width:360px">${esc(s.footerAbout)}</p>` : ""}
        </div>
        ${cols}
        ${contact ? `<div><h4>Contact</h4><ul>${contact}</ul></div>` : ""}
      </div>
      ${s.footerDisclaimer ? `<div class="footer__disclaimer">${s.footerDisclaimer}</div>` : ""}
      <div class="footer__bottom">
        <span>${esc(fill(s.copyright))}</span>
        ${s.companyName ? `<span>${esc(s.companyName)}</span>` : ""}
      </div>
    </div>
  </footer>`;
}

function layout(site, ctx, body) {
  const theme = themeStyle(site);
  const pp = site.productPage;
  const store = {
    currency: site.settings.currency,
    locale: site.settings.locale,
    pricing: { tiers: site.pricing.tiers, maxQty: site.pricing.maxQty },
    products: catalog(site),
    shipping: site.shipping.map(({ id, label, eta, price }) => ({ id, label, eta, price })),
    successMessage: site.checkout.successMessage,
    contactEmail: site.settings.contactEmail,
    labels: { soldOut: pp.outOfStockLabel },
  };

  return `<!doctype html>
<html lang="${esc((site.settings.locale || "en-GB").split("-")[0])}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  ${seoHead(site, ctx)}
  <link rel="icon" href="${esc(site.settings.favicon || "/images/favicon.svg")}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="${esc(theme.fontsUrl)}" rel="stylesheet">
  <link rel="stylesheet" href="${asset("/css/styles.css")}">
  ${(ctx.styles || []).map((s) => `<link rel="stylesheet" href="${asset(s)}">`).join("\n  ")}
  <style>${theme.css}</style>
  ${site.seo.headCode || ""}
</head>
<body>
  ${ctx.bare ? "" : gate(site)}
  ${ctx.bare ? "" : announcement(site)}
  ${ctx.header || header(site)}
  ${body}
  ${ctx.bare ? "" : footer(site)}
  ${ctx.bare ? "" : cartDrawer(site)}
  <script>window.STORE = ${jsonForScript(store)};</script>
  <script src="${asset("/js/store.js")}"></script>
  ${(ctx.scripts || ["/js/main.js"]).map((s) => `<script src="${asset(s)}"></script>`).join("\n  ")}
  ${site.seo.bodyCode || ""}
</body>
</html>`;
}

/* ------------------------------------------------------------------ */
/* Buying UI (shared by hero, product sections and product pages)       */
/* ------------------------------------------------------------------ */

let formCounter = 0;

// opts: { products, compact, imageTarget, addLabel }
function buyForm(site, opts) {
  const pp = site.productPage;
  const products = opts.products.filter((p) => p.variants.length);
  if (!products.length) return "";
  const id = "buy" + ++formCounter;
  const first = defaultVariant(products.find(inStock) || products[0]);
  const unit = priceFor(site.pricing, first.price, 1);
  const anyInStock = products.some(inStock);

  let picker = "";
  if (products.length > 1) {
    picker = `<div class="buy__field">
      <label class="field-label" for="${id}-variant">Choose your pen</label>
      <select class="select" id="${id}-variant" data-variant>
        ${products
          .map(
            (p) => `<optgroup label="${esc(p.name)}">${p.variants
              .map(
                (v) =>
                  `<option value="${esc(v.id)}"${v.id === first.id ? " selected" : ""}${v.inStock ? "" : " disabled"}>${esc(p.name.replace(/^Alluvi /, ""))} · ${esc(v.name)} · ${money(site, v.price)}${v.inStock ? "" : ` (${esc(pp.outOfStockLabel)})`}</option>`
              )
              .join("")}</optgroup>`
          )
          .join("")}
      </select>
    </div>`;
  } else if (products[0].variants.length > 1) {
    picker = `<fieldset class="buy__field pills">
      <legend class="field-label">Strength</legend>
      <div class="pills__list">
        ${products[0].variants
          .map(
            (v) => `<label class="pill${v.inStock ? "" : " is-disabled"}">
              <input type="radio" name="${id}-variant" value="${esc(v.id)}" data-variant${v.id === first.id ? " checked" : ""}${v.inStock ? "" : " disabled"}>
              <span>${esc(v.name)}${v.inStock ? "" : ` <small>${esc(pp.outOfStockLabel)}</small>`}</span>
            </label>`
          )
          .join("")}
      </div>
    </fieldset>`;
  } else {
    picker = `<input type="hidden" value="${esc(first.id)}" data-variant>`;
  }

  const bundles =
    !opts.compact && pp.showBundles && site.pricing.bundles.length
      ? `<fieldset class="bundles">
      <legend>Choose your quantity</legend>
      <div class="bundles__list">${site.pricing.bundles
        .map((bd) => {
          const bp = priceFor(site.pricing, first.price, bd.qty);
          return `<label class="bundle">
          <input type="radio" name="${id}-bundle" value="${bd.qty}"${bd.qty === 1 ? " checked" : ""} data-bundle>
          <span class="bundle__body">
            <span><span class="bundle__title">${esc(bd.title)}</span><span class="bundle__note" data-bundle-note="${bd.qty}">${bp.percent ? `Save ${bp.percent}% · ${money(site, bp.total / bd.qty)} each` : "Single pen"}</span></span>
            <span class="bundle__price" data-bundle-price="${bd.qty}">${money(site, bp.total)}${bp.discount ? `<s>${money(site, bp.full)}</s>` : ""}</span>
          </span>
          ${bd.badge ? `<span class="bundle__badge">${esc(bd.badge)}</span>` : ""}
        </label>`;
        })
        .join("")}</div>
    </fieldset>`
      : "";

  const qty = `<div class="qty">
      <button type="button" data-step="-1" aria-label="Decrease quantity">−</button>
      <input type="number" min="1" max="${site.pricing.maxQty}" value="1" inputmode="numeric" aria-label="Quantity" data-qty>
      <button type="button" data-step="1" aria-label="Increase quantity">+</button>
    </div>`;
  const imageAttr = opts.imageTarget ? ` data-image-target="${opts.imageTarget}"` : "";

  if (opts.compact) {
    return `<form class="buy buy--compact" data-buy-form${imageAttr} id="${id}">
      ${picker}
      <div class="buy__row">
        ${qty}
        <button class="btn btn--primary buy__add" type="submit" data-add${anyInStock ? "" : " disabled"}>${esc(opts.addLabel || pp.addToCartLabel)} · <span data-total>${money(site, unit.total)}</span></button>
      </div>
      <p class="buy__note" data-save-note></p>
    </form>`;
  }

  return `<form class="buy" data-buy-form${imageAttr} id="${id}">
    <div class="product__price">
      <span data-unit-price>${money(site, first.price)}</span>
      <s data-was-price>${first.compareAtPrice > first.price ? money(site, first.compareAtPrice) : ""}</s>
      <span class="badge badge--sale" data-save-badge hidden></span>
    </div>
    ${picker}
    ${bundles}
    <div class="qty-row">
      <span class="field-label">${bundles ? "Or set a custom quantity" : "Quantity"}</span>
      ${qty}
    </div>
    <div class="total-row">
      <span>Total</span>
      <span><strong data-total>${money(site, unit.total)}</strong><small data-total-save></small></span>
    </div>
    <div class="buy__actions">
      <button class="btn btn--primary btn--block btn--lg" type="submit" data-add${anyInStock ? "" : " disabled"}>${esc(anyInStock ? pp.addToCartLabel : pp.outOfStockLabel)} ${anyInStock ? ARROW : ""}</button>
      ${pp.showBuyNow && anyInStock ? `<button class="btn btn--secondary btn--block btn--lg" type="button" data-buy-now>${esc(pp.buyNowLabel)}</button>` : ""}
    </div>
  </form>`;
}

function stickyBar(site, product, formId) {
  if (!site.productPage.stickyBar || !inStock(product)) return "";
  const v = defaultVariant(product);
  return `<div class="buybar" id="buybar" data-for="${formId}" aria-hidden="true">
    <div class="container buybar__inner">
      <img class="buybar__img" src="${esc(productImage(product, v))}" alt="" data-buybar-img>
      <div class="buybar__info"><span class="buybar__name">${esc(product.name)} · <span data-buybar-variant>${esc(v.name)}</span></span><strong data-buybar-total>${money(site, v.price)}</strong></div>
      <div class="qty qty--sm buybar__qty">
        <button type="button" data-bar-step="-1" aria-label="Decrease quantity" tabindex="-1">−</button>
        <input type="number" min="1" max="${site.pricing.maxQty}" value="1" inputmode="numeric" aria-label="Quantity" data-bar-qty tabindex="-1">
        <button type="button" data-bar-step="1" aria-label="Increase quantity" tabindex="-1">+</button>
      </div>
      <button class="btn btn--primary buybar__btn" type="button" data-bar-add tabindex="-1">${esc(site.productPage.addToCartLabel)}</button>
    </div>
  </div>`;
}

function gallery(product, id) {
  const images = product.images.length ? product.images : [{ src: "", alt: "" }];
  const thumbs =
    images.length > 1
      ? `<div class="product__thumbs">${images
          .map(
            (img, i) =>
              `<button type="button" data-src="${esc(img.src)}" data-alt="${esc(img.alt)}" aria-label="Show image ${i + 1}" aria-current="${i === 0}"><img src="${esc(img.src)}" alt="" loading="lazy"></button>`
          )
          .join("")}</div>`
      : "";
  return `<div class="product__gallery" data-gallery>
    <div class="product__main">
      <span class="badge">RUO</span>
      <img id="${id}" src="${esc(images[0].src)}" alt="${esc(images[0].alt)}">
    </div>
    ${thumbs}
  </div>`;
}

function productCard(site, p) {
  const v = defaultVariant(p);
  const sizes = p.variants.map((x) => x.name).join(" / ");
  return `<article class="pcard">
    <a class="pcard__img" href="${productPath(p)}"><img src="${esc(productImage(p))}" alt="${esc((p.images[0] || {}).alt || p.name)}" loading="lazy">${inStock(p) ? "" : `<span class="badge pcard__badge">${esc(site.productPage.outOfStockLabel)}</span>`}</a>
    <div class="pcard__body">
      ${p.category ? `<p class="pcard__cat">${esc(p.category)}</p>` : ""}
      <h3 class="pcard__title"><a href="${productPath(p)}">${esc(p.name)}</a></h3>
      <p class="pcard__meta">${esc(sizes)}</p>
      <div class="pcard__foot">
        <span class="pcard__price">${p.variants.length > 1 ? "From " : ""}${money(site, fromPrice(p))}</span>
        ${inStock(p) ? `<button class="btn btn--secondary btn--sm" type="button" data-quick-add="${esc(v.id)}">Add to cart</button>` : ""}
      </div>
    </div>
  </article>`;
}

/* ------------------------------------------------------------------ */
/* Blocks                                                               */
/* ------------------------------------------------------------------ */

function sectionAttrs(b, extraClass = "") {
  const bg = b.background === "white" ? " bg-white" : b.background === "tint" ? " bg-tint" : "";
  return `class="${extraClass}${bg}"${b.anchor ? ` id="${esc(b.anchor)}"` : ""}`;
}

function heading(ctx, text, cls = "") {
  if (!text) return "";
  const tag = ctx.h1Used ? "h2" : "h1";
  ctx.h1Used = true;
  return `<${tag}${cls ? ` class="${cls}"` : ""}>${esc(text)}</${tag}>`;
}

function sectionHead(ctx, b) {
  if (!b.eyebrow && !b.heading && !b.text) return "";
  return `<div class="section__head">
    ${b.eyebrow ? `<p class="eyebrow">${esc(b.eyebrow)}</p>` : ""}
    ${heading(ctx, b.heading)}
    ${b.text ? `<p>${esc(b.text)}</p>` : ""}
  </div>`;
}

function blockProducts(site, ids) {
  const active = activeProducts(site);
  if (!ids || ids === "all") return active;
  const list = Array.isArray(ids) ? ids : [ids];
  return list.map((id) => active.find((p) => p.id === id)).filter(Boolean);
}

function faqList(items) {
  return `<div class="faq accordion accordion--faq">
    ${(items || []).map((q) => `<details><summary>${esc(q.question)}</summary><div class="accordion__body">${q.answer}</div></details>`).join("")}
  </div>`;
}

function trust(pp) {
  return (pp.trust || []).length ? `<ul class="trust" style="--n:${pp.trust.length}">${pp.trust.map((t) => `<li>${icon(t.icon)}${esc(t.label)}</li>`).join("")}</ul>` : "";
}

const BLOCKS = {
  hero(site, b, ctx) {
    const products = b.showBuy ? blockProducts(site, b.buyProduct) : [];
    const imgId = "heroImg" + ++formCounter;
    const form = products.length ? buyForm(site, { products, compact: true, imageTarget: b.image ? imgId : "", addLabel: b.buyLabel }) : "";
    // A single-product hero gets the sticky add-to-cart bar
    let sticky = "";
    if (products.length === 1 && !ctx.stickyUsed) {
      ctx.stickyUsed = true;
      sticky = stickyBar(site, products[0], "buy" + formCounter);
    }
    const all = activeProducts(site);
    const minPrice = all.length ? Math.min(...all.map(fromPrice)) : 0;
    const bestPercent = Math.max(0, ...site.pricing.tiers.map((t) => t.percent));
    return `<section ${sectionAttrs(b, "hero")}>
      <div class="container hero__inner">
        <div class="hero__content">
          ${b.eyebrow ? `<p class="eyebrow">${esc(b.eyebrow)}</p>` : ""}
          ${heading(ctx, b.heading)}
          ${b.text ? `<p class="hero__lead">${esc(b.text)}</p>` : ""}
          ${form ? `<div class="hero__buy">${form}</div>` : ""}
          ${
            b.primaryLabel || b.secondaryLabel
              ? `<div class="hero__ctas">
            ${b.primaryLabel ? `<a class="btn btn--primary" href="${esc(safeUrl(b.primaryLink))}">${esc(b.primaryLabel)}</a>` : ""}
            ${b.secondaryLabel ? `<a class="${products.length ? "link-arrow" : "btn btn--secondary"}" href="${esc(safeUrl(b.secondaryLink))}">${esc(b.secondaryLabel)}${products.length ? " →" : ""}</a>` : ""}
          </div>`
              : ""
          }
          ${(b.points || []).length ? `<ul class="hero__points">${b.points.map((p) => `<li>${esc(p.text)}</li>`).join("")}</ul>` : ""}
        </div>
        ${
          b.image
            ? `<div class="hero__media">
          <img id="${imgId}" src="${esc(b.image)}" alt="${esc(b.imageAlt)}" fetchpriority="high">
          ${b.showPriceTag && minPrice ? `<div class="hero__tag"><strong>${money(site, minPrice * (1 - bestPercent / 100))}</strong>${esc(b.priceTagLabel)}</div>` : ""}
        </div>`
            : ""
        }
      </div>
    </section>
    ${sticky}`;
  },

  product(site, b, ctx) {
    const all = activeProducts(site);
    const p = all.find((x) => x.id === b.productId) || all[0];
    if (!p) return "";
    const imgId = "pimg" + ++formCounter;
    const form = buyForm(site, { products: [p], imageTarget: imgId });
    const formId = "buy" + formCounter;
    let sticky = "";
    if (!ctx.stickyUsed) {
      ctx.stickyUsed = true;
      sticky = stickyBar(site, p, formId);
    }
    return `<section ${sectionAttrs(b, "section product")}>
      <div class="container product__grid">
        ${gallery(p, imgId)}
        <div class="product__info">
          ${b.eyebrow ? `<p class="eyebrow">${esc(b.eyebrow)}</p>` : p.category ? `<p class="eyebrow">${esc(p.category)}</p>` : ""}
          ${heading(ctx, b.heading || p.name, "product__title")}
          ${p.shortDescription ? `<p class="product__short">${esc(p.shortDescription)}</p>` : ""}
          ${form}
          ${trust(site.productPage)}
          ${b.showDetailsLink ? `<p class="product__more"><a href="${productPath(p)}">Full details, specifications &amp; FAQ →</a></p>` : ""}
        </div>
      </div>
    </section>
    ${sticky}`;
  },

  variants(site, b, ctx) {
    const all = activeProducts(site);
    const p = all.find((x) => x.id === b.productId) || all[0];
    if (!p) return "";
    return `<section ${sectionAttrs(b, "section")}>
      <div class="container">
        ${sectionHead(ctx, b)}
        <div class="vcards" style="--n:${Math.min(p.variants.length, 3)}">
          ${p.variants
            .map(
              (v) => `<article class="vcard${v.badge ? " vcard--featured" : ""}">
            ${v.badge ? `<span class="vcard__badge">${esc(v.badge)}</span>` : ""}
            <div class="vcard__img"><img src="${esc(productImage(p, v))}" alt="${esc(p.name + " " + v.name)}" loading="lazy"></div>
            <div class="vcard__body">
              <p class="vcard__name">${esc(p.name)}</p>
              <h3 class="vcard__title">${esc(v.name)}</h3>
              ${v.description ? `<p class="vcard__desc">${esc(v.description)}</p>` : ""}
              <div class="vcard__foot">
                <span class="vcard__price">${money(site, v.price)}${v.compareAtPrice > v.price ? ` <s>${money(site, v.compareAtPrice)}</s>` : ""}</span>
                ${
                  v.inStock
                    ? `<button class="btn btn--primary" type="button" data-quick-add="${esc(v.id)}">${esc(b.buttonLabel || site.productPage.addToCartLabel)}</button>`
                    : `<button class="btn btn--secondary" type="button" disabled>${esc(site.productPage.outOfStockLabel)}</button>`
                }
              </div>
            </div>
          </article>`
            )
            .join("")}
        </div>
      </div>
    </section>`;
  },

  productGrid(site, b, ctx) {
    const ids = (b.products || []).map((x) => x.productId).filter(Boolean);
    const products = blockProducts(site, ids.length ? ids : "all");
    return `<section ${sectionAttrs(b, "section")}>
      <div class="container">
        ${sectionHead(ctx, b)}
        <div class="pgrid">${products.map((p) => productCard(site, p)).join("")}</div>
      </div>
    </section>`;
  },

  contactForm(site, b, ctx) {
    const s = site.settings;
    const wholesale = b.formType === "wholesale";
    const field = (name, label, input, opts = {}) =>
      `<div class="cf__field${opts.wide ? " cf__field--wide" : ""}">
        <label for="cf-${b.id}-${name}">${esc(label)}${opts.required ? "" : ' <span class="cf__opt">(optional)</span>'}</label>
        ${input}
      </div>`;
    const input = (name, type, opts = {}) =>
      `<input class="input" id="cf-${b.id}-${name}" name="${name}" type="${type}"${opts.required ? " required" : ""}${opts.autocomplete ? ` autocomplete="${opts.autocomplete}"` : ""}>`;
    const textarea = (name, required) => `<textarea class="input cf__textarea" id="cf-${b.id}-${name}" name="${name}" rows="5"${required ? " required" : ""}></textarea>`;
    const choose = (name, options, required) =>
      `<select class="select" id="cf-${b.id}-${name}" name="${name}"${required ? " required" : ""}><option value="">Please choose</option>${options.map((o) => `<option>${esc(o)}</option>`).join("")}</select>`;

    let fields;
    if (wholesale) {
      const strengths = (activeProducts(site)[0] || { variants: [] }).variants.map((v) => v.name);
      fields = [
        field("name", "Your name", input("name", "text", { required: true, autocomplete: "name" }), { required: true }),
        field("company", "Company or institution", input("company", "text", { required: true, autocomplete: "organization" }), { required: true }),
        field("email", "Email", input("email", "email", { required: true, autocomplete: "email" }), { required: true }),
        field("phone", "Phone", input("phone", "tel", { autocomplete: "tel" })),
        field("quantity", "Estimated pens per month", choose("quantity", ["10–24", "25–49", "50–99", "100+"], true), { required: true }),
        strengths.length
          ? `<fieldset class="cf__field cf__checks"><legend>Strengths of interest <span class="cf__opt">(optional)</span></legend>${strengths
              .map((n) => `<label class="check"><input type="checkbox" name="strengths" value="${esc(n)}"> ${esc(n)}</label>`)
              .join("")}</fieldset>`
          : "",
        field("message", "Tell us about your requirements", textarea("message", false), { wide: true }),
      ];
    } else {
      fields = [
        field("name", "Your name", input("name", "text", { required: true, autocomplete: "name" }), { required: true }),
        field("email", "Email", input("email", "email", { required: true, autocomplete: "email" }), { required: true }),
        field("phone", "Phone", input("phone", "tel", { autocomplete: "tel" })),
        (b.topics || []).length ? field("topic", "Topic", choose("topic", b.topics.map((t) => t.text), false)) : field("order", "Order number", input("order", "text")),
        field("message", "Message", textarea("message", true), { wide: true, required: true }),
      ];
    }

    const details = b.showDetails
      ? `<ul class="cf__details">
        ${s.contactEmail ? `<li>${icon("mail")}<div><strong>Email</strong><a href="mailto:${esc(s.contactEmail)}">${esc(s.contactEmail)}</a></div></li>` : ""}
        ${s.contactPhone ? `<li>${icon("phone")}<div><strong>Phone</strong><a href="tel:${esc(s.contactPhone.replace(/\s/g, ""))}">${esc(s.contactPhone)}</a></div></li>` : ""}
        ${s.businessHours ? `<li>${icon("clock")}<div><strong>Hours</strong><span>${esc(s.businessHours)}</span></div></li>` : ""}
        ${s.address ? `<li>${icon("pin")}<div><strong>Address</strong><span>${esc(s.address)}</span></div></li>` : ""}
      </ul>`
      : "";

    return `<section ${sectionAttrs(b, "section")}>
      <div class="container cf">
        <div class="cf__intro">
          ${b.eyebrow ? `<p class="eyebrow">${esc(b.eyebrow)}</p>` : ""}
          ${heading(ctx, b.heading)}
          ${b.html ? `<div class="prose cf__text">${b.html}</div>` : ""}
          ${details}
        </div>
        <div class="cf__card">
          <form class="cf__form" data-contact-form data-type="${wholesale ? "wholesale" : "contact"}" novalidate>
            <div class="cf__grid">${fields.join("")}</div>
            <div class="cf__hp" aria-hidden="true"><label>Leave this empty <input name="website" tabindex="-1" autocomplete="off"></label></div>
            <p class="field__error" data-form-error hidden></p>
            <button class="btn btn--primary btn--lg" type="submit">${esc(b.buttonLabel || "Send message")}</button>
          </form>
          <div class="cf__done" data-form-done hidden>
            <div class="done__icon"><svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5L20 7"/></svg></div>
            <h3>Message sent</h3>
            <p>${esc(b.successMessage)}</p>
          </div>
        </div>
      </div>
    </section>`;
  },

  features(site, b, ctx) {
    return `<section ${sectionAttrs(b, "section")}>
      <div class="container">
        ${sectionHead(ctx, b)}
        <div class="features">
          ${(b.items || [])
            .map(
              (f) => `<div class="feature">
            <div class="feature__icon">${icon(f.icon)}</div>
            <h3>${esc(f.title)}</h3>
            <p>${esc(f.text)}</p>
          </div>`
            )
            .join("")}
        </div>
      </div>
    </section>`;
  },

  banner(site, b, ctx) {
    return `<section ${sectionAttrs(b, "section")}>
      <div class="container">
        <div class="banner${b.image ? "" : " banner--text"}">
          <div class="banner__content">
            ${b.eyebrow ? `<p class="eyebrow">${esc(b.eyebrow)}</p>` : ""}
            ${heading(ctx, b.heading)}
            ${b.text ? `<p>${esc(b.text)}</p>` : ""}
            ${b.buttonLabel ? `<a class="btn btn--primary" href="${esc(safeUrl(b.buttonLink))}">${esc(b.buttonLabel)}</a>` : ""}
          </div>
          ${b.image ? `<div class="banner__media"><img src="${esc(b.image)}" alt="${esc(b.imageAlt)}" loading="lazy"></div>` : ""}
        </div>
      </div>
    </section>`;
  },

  specs(site, b, ctx) {
    return `<section ${sectionAttrs(b, "section")}>
      <div class="container specs">
        <div>
          ${b.eyebrow ? `<p class="eyebrow">${esc(b.eyebrow)}</p>` : ""}
          ${heading(ctx, b.heading)}
          ${b.text ? `<p class="muted">${esc(b.text)}</p>` : ""}
          ${b.buttonLabel ? `<a class="btn btn--secondary" href="${esc(safeUrl(b.buttonLink))}" style="margin-top:12px">${esc(b.buttonLabel)}</a>` : ""}
        </div>
        <table class="specs__table">
          <tbody>${(b.rows || []).map((r) => `<tr><th scope="row">${esc(r.label)}</th><td>${esc(r.value)}</td></tr>`).join("")}</tbody>
        </table>
      </div>
    </section>`;
  },

  steps(site, b, ctx) {
    return `<section ${sectionAttrs(b, "section")}>
      <div class="container">
        ${sectionHead(ctx, b)}
        <div class="steps" style="--n:${Math.min((b.items || []).length, 4) || 1}">
          ${(b.items || []).map((s) => `<div class="step"><h3>${esc(s.title)}</h3><p>${esc(s.text)}</p></div>`).join("")}
        </div>
      </div>
    </section>`;
  },

  faq(site, b, ctx) {
    return `<section ${sectionAttrs(b, "section")}>
      <div class="container">
        ${sectionHead(ctx, b)}
        ${faqList(b.items)}
      </div>
    </section>`;
  },

  richtext(site, b, ctx) {
    return `<section ${sectionAttrs(b, "section")}>
      <div class="container">
        <div class="prose${b.width === "wide" ? " prose--wide" : ""}">
          ${heading(ctx, b.heading)}
          ${b.html || ""}
        </div>
      </div>
    </section>`;
  },

  imageText(site, b, ctx) {
    return `<section ${sectionAttrs(b, "section")}>
      <div class="container media-text${b.imagePosition === "right" ? " media-text--right" : ""}">
        <div class="media-text__img">${b.image ? `<img src="${esc(b.image)}" alt="${esc(b.imageAlt)}" loading="lazy">` : ""}</div>
        <div class="media-text__body prose">
          ${b.eyebrow ? `<p class="eyebrow">${esc(b.eyebrow)}</p>` : ""}
          ${heading(ctx, b.heading)}
          ${b.html || ""}
          ${b.buttonLabel ? `<p><a class="btn btn--primary" href="${esc(safeUrl(b.buttonLink))}">${esc(b.buttonLabel)}</a></p>` : ""}
        </div>
      </div>
    </section>`;
  },
};

/* ------------------------------------------------------------------ */
/* Pages                                                                */
/* ------------------------------------------------------------------ */

function renderPage(site, page, req) {
  formCounter = 0;
  const base = baseUrl(site, req);
  const isHome = page.slug === "";
  const ctx = { h1Used: false, stickyUsed: false };
  const blocks = page.blocks.filter((b) => b.enabled && BLOCKS[b.type]);
  const body = blocks.map((b) => BLOCKS[b.type](site, b, ctx)).join("\n");

  const jsonLd = [];
  if (site.seo.organizationSchema && isHome) {
    const org = {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: site.settings.companyName || site.settings.storeName,
      url: absUrl(base, "/"),
      email: site.settings.contactEmail || undefined,
      telephone: site.settings.contactPhone || undefined,
    };
    if (site.settings.logoImage) org.logo = absUrl(base, site.settings.logoImage);
    jsonLd.push(org, { "@context": "https://schema.org", "@type": "WebSite", name: site.settings.storeName, url: absUrl(base, "/") });
  }
  if (site.seo.productSchema) {
    for (const b of blocks.filter((x) => x.type === "product")) {
      const p = activeProducts(site).find((x) => x.id === b.productId);
      if (p) jsonLd.push(productSchema(site, p, productPath(p), base));
    }
  }
  if (site.seo.faqSchema) {
    const qa = blocks.filter((b) => b.type === "faq").flatMap((b) => b.items || []);
    if (qa.length) jsonLd.push(faqSchema(qa));
  }
  if (site.seo.breadcrumbSchema && !isHome) jsonLd.push(breadcrumbSchema(base, [["Home", "/"], [page.title, pagePath(page)]]));

  return layout(
    site,
    {
      title: page.title,
      rawTitle: isHome,
      seo: page.seo,
      path: pagePath(page),
      noindex: page.status !== "published",
      ogType: blocks.some((b) => b.type === "product") ? "product" : "website",
      jsonLd,
      baseUrl: base,
    },
    `<main>${body}</main>`
  );
}

function renderProduct(site, p, req) {
  formCounter = 0;
  const base = baseUrl(site, req);
  const pp = site.productPage;
  const path = productPath(p);
  const imgId = "pimg";
  const form = buyForm(site, { products: [p], imageTarget: imgId });
  const formId = "buy" + formCounter;
  const related = pp.showRelated ? activeProducts(site).filter((x) => x.id !== p.id).slice(0, 3) : [];
  const shopPage = site.pages.find((x) => x.slug === "shop" && x.status === "published");
  const crumbs = [["Home", "/"], ...(shopPage ? [["Shop", "/shop"]] : []), [p.name, path]];

  const body = `<main>
    <nav class="crumbs container" aria-label="Breadcrumb">
      ${crumbs.map((c, i) => (i < crumbs.length - 1 ? `<a href="${c[1]}">${esc(c[0])}</a><span>/</span>` : `<span aria-current="page">${esc(c[0])}</span>`)).join("")}
    </nav>
    <section class="section product pdp bg-white">
      <div class="container product__grid">
        ${gallery(p, imgId)}
        <div class="product__info">
          ${p.category ? `<p class="eyebrow">${esc(p.category)}</p>` : ""}
          <h1 class="product__title">${esc(p.name)}</h1>
          ${p.subtitle ? `<p class="product__subtitle">${esc(p.subtitle)}</p>` : ""}
          <ul class="chips">
            ${(pp.badges || []).map((b) => `<li>${esc(b.text)}</li>`).join("")}
            <li class="${inStock(p) ? "chip--ok" : "chip--bad"}">${inStock(p) ? "In stock" : esc(pp.outOfStockLabel)}</li>
          </ul>
          ${p.shortDescription ? `<p class="product__short">${esc(p.shortDescription)}</p>` : ""}
          ${pp.disclaimer ? `<p class="product__disclaimer">${esc(pp.disclaimer)}</p>` : ""}
          ${(p.facts || []).length ? `<dl class="facts">${p.facts.map((f) => `<div><dt>${esc(f.label)}</dt><dd>${esc(f.value)}</dd></div>`).join("")}</dl>` : ""}
          ${form}
          ${trust(pp)}
          ${p.testReportUrl ? `<a class="report-link" href="${esc(safeUrl(p.testReportUrl))}" target="_blank" rel="noopener">${icon("file")} ${esc(pp.testReportLabel)}</a>` : ""}
          ${
            (p.tabs || []).length
              ? `<div class="accordion">${p.tabs.map((a) => `<details${a.open ? " open" : ""}><summary>${esc(a.title)}</summary><div class="accordion__body">${a.html}</div></details>`).join("")}</div>`
              : ""
          }
        </div>
      </div>
    </section>
    ${
      (pp.docs || []).length
        ? `<section class="section">
      <div class="container">
        <div class="section__head"><p class="eyebrow">${esc(p.name)}</p><h2>${esc(pp.docsHeading)}</h2></div>
        <div class="features" style="--n:${Math.min(pp.docs.length, 4)}">${pp.docs
          .map((d) => `<div class="feature"><div class="feature__icon">${icon(d.icon)}</div><h3>${esc(d.title)}</h3><p>${esc(d.text)}</p></div>`)
          .join("")}</div>
      </div>
    </section>`
        : ""
    }
    ${
      (p.highlights || []).length || (pp.assurance || []).length
        ? `<section class="section bg-white">
      <div class="container two-col">
        ${(p.highlights || []).length ? `<div><p class="eyebrow">Product information</p><h2>${esc(pp.highlightsHeading)}</h2><ul class="ticks">${p.highlights.map((h) => `<li>${esc(h.text)}</li>`).join("")}</ul></div>` : "<div></div>"}
        ${
          (pp.assurance || []).length
            ? `<div class="assure"><h3>${esc(pp.assuranceHeading)}</h3>${pp.assurance
                .map((a) => `<div class="assure__item"><span class="assure__icon">${icon(a.icon)}</span><div><strong>${esc(a.title)}</strong><p>${esc(a.text)}</p></div></div>`)
                .join("")}</div>`
            : ""
        }
      </div>
    </section>`
        : ""
    }
    ${
      (p.faq || []).length
        ? `<section class="section" id="faq">
      <div class="container">
        <div class="section__head"><p class="eyebrow">FAQ</p><h2>${esc(pp.faqHeading)}</h2></div>
        ${faqList(p.faq)}
      </div>
    </section>`
        : ""
    }
    ${
      related.length
        ? `<section class="section bg-white">
      <div class="container">
        <div class="section__head"><p class="eyebrow">Related products</p><h2>${esc(pp.relatedHeading)}</h2></div>
        <div class="pgrid">${related.map((r) => productCard(site, r)).join("")}</div>
      </div>
    </section>`
        : ""
    }
  </main>
  ${stickyBar(site, p, formId)}`;

  const jsonLd = [];
  if (site.seo.productSchema) jsonLd.push(productSchema(site, p, path, base));
  if (site.seo.faqSchema && (p.faq || []).length) jsonLd.push(faqSchema(p.faq));
  if (site.seo.breadcrumbSchema) jsonLd.push(breadcrumbSchema(base, crumbs));

  return layout(
    site,
    { title: p.name, seo: p.seo, description: p.shortDescription, image: (p.images[0] || {}).src, path, noindex: p.status !== "active", ogType: "product", jsonLd, baseUrl: base },
    body
  );
}

function renderCheckout(site, req) {
  const head = `<header class="co-header">
    <div class="container co-header__inner">
      ${logo(site)}
      <span class="co-header__secure">${icon("lock", 'width="16" height="16"')} Secure checkout</span>
    </div>
  </header>`;
  const shipping = site.shipping
    .map(
      (s, i) => `<label class="option">
        <input type="radio" name="shipping" value="${esc(s.id)}"${i === 0 ? " checked" : ""}>
        <span class="option__text">${esc(s.label)}<small>${esc(s.eta)}</small></span>
        <span class="option__price">${s.price ? money(site, s.price) : "Free"}</span>
      </label>`
    )
    .join("");
  const agreements = site.checkout.agreements
    .map((a, i) => `<label class="check" data-agreement><input type="checkbox" name="agree${i}" required> <span>${esc(a.text)}</span></label>`)
    .join("");

  const body = `<div class="co">
    <div class="co__main">
      <div class="co__main-inner">
        <nav class="breadcrumb" aria-label="Checkout steps">
          <a href="/">Home</a> › <span aria-current="step">Information &amp; delivery</span> › <span>Payment</span>
        </nav>
        <div class="co-empty" id="coEmpty" hidden>
          <h2>${esc(site.checkout.emptyCartText)}</h2>
          <p><a class="btn btn--primary" href="/#buy">Back to the store</a></p>
        </div>
        <form id="checkoutForm" novalidate>
          <section class="co-section">
            <h2>Contact</h2>
            <div class="field">
              <label class="visually-hidden" for="email">Email</label>
              <input class="input" id="email" name="email" type="email" placeholder="Email" autocomplete="email" required>
            </div>
          </section>
          <section class="co-section">
            <h2>Delivery</h2>
            <div class="field-stack">
              <select class="select" id="country" name="country" aria-label="Country"><option value="United Kingdom">United Kingdom</option></select>
              <div class="field-grid">
                <input class="input" name="firstName" placeholder="First name" aria-label="First name" autocomplete="given-name" required>
                <input class="input" name="lastName" placeholder="Last name" aria-label="Last name" autocomplete="family-name" required>
              </div>
              <input class="input" name="company" placeholder="Company or institution (optional)" aria-label="Company or institution" autocomplete="organization">
              <input class="input" name="address1" placeholder="Address" aria-label="Address" autocomplete="address-line1" required>
              <input class="input" name="address2" placeholder="Apartment, suite, etc. (optional)" aria-label="Apartment, suite, etc." autocomplete="address-line2">
              <div class="field-grid">
                <input class="input" name="city" placeholder="City" aria-label="City" autocomplete="address-level2" required>
                <input class="input" name="postcode" id="postcode" placeholder="Postcode" aria-label="Postcode" autocomplete="postal-code" required>
              </div>
              <input class="input" name="phone" type="tel" placeholder="Phone (for delivery updates)" aria-label="Phone" autocomplete="tel" required>
            </div>
          </section>
          <section class="co-section">
            <h2>Shipping method</h2>
            <div class="options">${shipping}</div>
          </section>
          <section class="co-section">
            <h2>Payment</h2>
            <div class="pay-box">${icon("lock", 'width="22" height="22"')}<span>${esc(site.checkout.paymentInstructions)}</span></div>
          </section>
          ${agreements ? `<div class="co-agree">${agreements}</div>` : ""}
          <p class="field__error" id="formError" hidden></p>
          <button class="btn btn--primary btn--block btn--lg" type="submit" id="placeOrder">Place order</button>
        </form>
        <div class="done" id="done" hidden>
          <div class="done__icon"><svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5L20 7"/></svg></div>
          <h2>Thank you, <span id="doneName"></span>!</h2>
          <p>Your order has been received.</p>
          <span class="done__ref" id="doneRef"></span>
          <p id="doneMsg"></p>
          <a class="btn btn--secondary" href="/">Back to store</a>
        </div>
        <p class="co-footer">Research use only. Not for human or veterinary use. Questions? <a href="mailto:${esc(site.settings.contactEmail)}">${esc(site.settings.contactEmail)}</a></p>
      </div>
    </div>
    <aside class="co__aside" aria-label="Order summary">
      <div class="co__aside-inner">
        <button class="summary-toggle" id="summaryToggle" type="button" aria-expanded="false" aria-controls="summaryBody">
          <span id="summaryToggleText">Show order summary</span><strong data-grand-total></strong>
        </button>
        <div class="summary-body" id="summaryBody">
          <div class="line-items" id="lineItems"></div>
          <form class="discount" id="discountForm">
            <label class="visually-hidden" for="discountCode">Discount code</label>
            <input class="input" id="discountCode" placeholder="Discount code" autocomplete="off">
            <button class="btn btn--secondary" type="submit">Apply</button>
          </form>
          <div class="discount-msg" id="discountMsg" aria-live="polite"></div>
          <div class="totals">
            <div><span>Subtotal · <span id="tQty"></span></span><span id="tSubtotal"></span></div>
            <div class="is-saving" id="rowVolume" hidden><span id="tVolumeLabel"></span><span id="tVolume"></span></div>
            <div class="is-saving" id="rowCode" hidden><span id="tCodeLabel"></span><span id="tCode"></span></div>
            <div><span>Shipping</span><span id="tShipping"></span></div>
            <div class="totals__grand"><span>Total</span><span><small>${esc(site.settings.currency)}</small><span data-grand-total></span></span></div>
          </div>
        </div>
      </div>
    </aside>
  </div>`;
  return layout(
    site,
    { title: "Checkout", path: "/checkout", baseUrl: baseUrl(site, req), noindex: true, bare: true, header: head, styles: ["/css/checkout.css"], scripts: ["/js/checkout.js"] },
    body
  );
}

function renderNotFound(site, req) {
  return layout(
    site,
    { title: "Page not found", path: req.path, baseUrl: baseUrl(site, req), noindex: true },
    `<main class="section"><div class="container prose" style="text-align:center"><p class="eyebrow">404</p><h1>Page not found</h1><p>The page you're looking for doesn't exist or has moved.</p><p><a class="btn btn--primary" href="/">Back to the store</a></p></div></main>`
  );
}

/* ------------------------------------------------------------------ */
/* SEO files                                                            */
/* ------------------------------------------------------------------ */

function sitemapEntries(site) {
  const entries = [];
  const listed = (x) => x.showInSitemap && !(x.seo && (x.seo.noindex || x.seo.canonical));
  for (const p of site.pages.filter((x) => x.status === "published" && listed(x))) {
    const images = [];
    for (const b of p.blocks.filter((x) => x.enabled)) {
      if (b.image) images.push(b.image);
      if (b.type === "product") {
        const prod = site.products.find((x) => x.id === b.productId);
        if (prod) prod.images.forEach((i) => images.push(i.src));
      }
    }
    entries.push({ path: pagePath(p), updatedAt: p.updatedAt, changefreq: p.changefreq, priority: p.priority, images });
  }
  for (const p of site.products.filter((x) => x.status === "active" && listed(x))) {
    entries.push({ path: productPath(p), updatedAt: p.updatedAt, changefreq: p.changefreq, priority: p.priority, images: p.images.map((i) => i.src) });
  }
  return entries;
}

function renderSitemap(site, req) {
  const base = baseUrl(site, req);
  const entries = site.seo.noindexSite ? [] : sitemapEntries(site);
  const urls = entries
    .map((e) => {
      const images = site.seo.sitemapImages ? [...new Set(e.images.filter(Boolean))] : [];
      return `  <url>
    <loc>${esc(absUrl(base, e.path))}</loc>
    <lastmod>${esc((e.updatedAt || new Date().toISOString()).slice(0, 10))}</lastmod>
    <changefreq>${esc(e.changefreq || "monthly")}</changefreq>
    <priority>${Number(e.priority || 0.5).toFixed(1)}</priority>${images.map((src) => `\n    <image:image><image:loc>${esc(absUrl(base, src))}</image:loc></image:image>`).join("")}
  </url>`;
    })
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls}
</urlset>
`;
}

function renderRobots(site, req) {
  if (site.seo.noindexSite) return "User-agent: *\nDisallow: /\n";
  let txt = (site.seo.robotsTxt || "").trim();
  if (site.seo.robotsAddSitemap) txt += `\n\nSitemap: ${baseUrl(site, req)}/sitemap.xml`;
  return txt + "\n";
}

module.exports = {
  renderPage,
  renderProduct,
  renderCheckout,
  renderNotFound,
  renderSitemap,
  renderRobots,
  RESERVED_SLUGS,
  HEADING_FONTS,
  BODY_FONTS,
  ICONS: Object.keys(ICONS),
  ICON_SVGS: ICONS,
};
