// One description of every editable field. The admin dashboard builds its
// forms from this, and the server uses it to clean whatever the admin saves.
const { HEADING_FONTS, BODY_FONTS, ICONS } = require("./render");

const f = (type) => (key, label, opts = {}) => ({ key, label, type, ...opts });
const text = f("text");
const textarea = f("textarea");
const html = f("html");
const num = f("number");
const check = f("checkbox");
const select = f("select");
const image = f("image");
const file = f("file");
const color = f("color");
const url = f("url");
const product = f("product");
const iconField = (key = "icon", label = "Icon") => ({ key, label, type: "icon", options: ICONS });
const list = (key, label, fields, opts = {}) => ({ key, label, type: "list", fields, ...opts });
const group = (key, label, fields, opts = {}) => ({ key, label, type: "group", fields, ...opts });
const heading = (label, help) => ({ type: "heading", label, help });

const BACKGROUNDS = [
  { value: "default", label: "Cream (page background)" },
  { value: "white", label: "White" },
  { value: "tint", label: "Soft tint" },
];

const SEO_FIELDS = [
  text("title", "SEO title", { help: "Leave blank to use the page or product name.", max: 200, counter: [30, 60] }),
  textarea("description", "Meta description", { help: "Shown under your link in Google results.", max: 400, counter: [70, 160] }),
  text("focusKeyword", "Focus keyword", { help: "The main search phrase you want to rank for, e.g. \"retatrutide pen uk\". Only used for the SEO checks; not shown on the site.", max: 100 }),
  image("ogImage", "Social share image", { help: "Shown when the page is shared on social media. 1200×630 works best." }),
  url("canonical", "Canonical URL", { help: "Only set this if the same content lives at another URL. Leave blank normally." }),
  check("noindex", "Hide from search engines (noindex)"),
];

const SITEMAP_FIELDS = [
  check("showInSitemap", "Include in sitemap.xml", { default: true }),
  num("priority", "Sitemap priority", { min: 0, max: 1, step: 0.1, default: 0.5, help: "0.0 to 1.0. How important this URL is compared with the rest of your site." }),
  select("changefreq", "Sitemap change frequency", {
    options: ["always", "hourly", "daily", "weekly", "monthly", "yearly", "never"].map((v) => ({ value: v, label: v })),
    default: "monthly",
  }),
];

const blockCommon = [
  check("enabled", "Show this section", { default: true }),
  text("anchor", "Anchor ID", { help: "Lets links jump here, e.g. \"faq\" makes /#faq work. Letters, numbers and dashes only.", max: 60 }),
  select("background", "Background", { options: BACKGROUNDS, default: "default" }),
];

const BLOCK_TYPES = {
  hero: {
    label: "Hero",
    description: "Large intro with heading, photo and an optional buy box (choose version, quantity, add to cart).",
    fields: [
      text("eyebrow", "Small label above heading"),
      text("heading", "Heading"),
      textarea("text", "Intro text"),
      image("image", "Image"),
      text("imageAlt", "Image alt text", { help: "Describe the image for Google and screen readers." }),
      heading("Buy box"),
      check("showBuy", "Show buy box (version, quantity, add to cart)", { default: true }),
      product("buyProduct", "Products in the buy box", { allowAll: true, default: "all", help: "\"All products\" lets visitors pick any pen and strength from one dropdown." }),
      text("buyLabel", "Add to cart button label", { default: "Add to cart" }),
      heading("Buttons & points"),
      text("primaryLabel", "Main button label", { help: "Leave blank to hide." }),
      url("primaryLink", "Main button link"),
      text("secondaryLabel", "Second link label"),
      url("secondaryLink", "Second link"),
      list("points", "Tick-list points", [text("text", "Text")], { itemLabel: "text" }),
      check("showPriceTag", "Show \"from\" price tag on image"),
      text("priceTagLabel", "Price tag label"),
    ],
  },
  productGrid: {
    label: "Product grid",
    description: "Cards for your products with price and quick add to cart.",
    fields: [
      text("eyebrow", "Small label"),
      text("heading", "Heading"),
      textarea("text", "Intro text"),
      list("products", "Products to show", [product("productId", "Product")], { itemLabel: "productId", help: "Leave empty to show every active product." }),
    ],
  },
  product: {
    label: "Product buy box",
    description: "One product with photos, version picker, quantity cards and add to cart. Edit the product itself under Products.",
    fields: [
      product("productId", "Product"),
      text("eyebrow", "Small label above title"),
      text("heading", "Title override", { help: "Leave blank to use the product name." }),
      check("showDetailsLink", "Show link to the full product page"),
    ],
  },
  variants: {
    label: "Strength cards",
    description: "A card for each version (e.g. 20mg and 40mg) with photo, description, price and its own Add to cart button.",
    fields: [
      product("productId", "Product"),
      text("eyebrow", "Small label"),
      text("heading", "Heading"),
      textarea("text", "Intro text"),
      text("buttonLabel", "Button label", { default: "Add to cart" }),
    ],
  },
  contactForm: {
    label: "Contact form",
    description: "An enquiry form. Submissions appear under Messages in this dashboard.",
    fields: [
      select("formType", "Form type", {
        options: [
          { value: "contact", label: "Contact (name, email, topic, message)" },
          { value: "wholesale", label: "Wholesale (company, quantities, strengths)" },
        ],
        default: "contact",
      }),
      text("eyebrow", "Small label"),
      text("heading", "Heading"),
      html("html", "Text beside the form"),
      check("showDetails", "Show contact details (email, phone, hours) beside the form", { default: true }),
      list("topics", "Topics to choose from", [text("text", "Topic")], { itemLabel: "text", help: "Contact forms only. Leave empty to hide the topic menu." }),
      text("buttonLabel", "Send button label", { default: "Send message" }),
      textarea("successMessage", "Message shown after sending", { default: "Thanks, we've received your message and will reply within one working day." }),
    ],
  },
  features: {
    label: "Feature cards",
    description: "Grid of icon cards",
    fields: [
      text("eyebrow", "Small label"),
      text("heading", "Heading"),
      textarea("text", "Intro text"),
      list("items", "Cards", [iconField(), text("title", "Title"), textarea("text", "Text")], { itemLabel: "title" }),
    ],
  },
  banner: {
    label: "Promo banner",
    description: "Coloured banner with text, button and optional photo",
    fields: [
      text("eyebrow", "Small label"),
      text("heading", "Heading"),
      textarea("text", "Text"),
      text("buttonLabel", "Button label"),
      url("buttonLink", "Button link"),
      image("image", "Image (optional)"),
      text("imageAlt", "Image alt text"),
    ],
  },
  specs: {
    label: "Specifications table",
    description: "Two-column table of details",
    fields: [
      text("eyebrow", "Small label"),
      text("heading", "Heading"),
      textarea("text", "Text"),
      text("buttonLabel", "Button label"),
      url("buttonLink", "Button link"),
      list("rows", "Rows", [text("label", "Label"), text("value", "Value")], { itemLabel: "label" }),
    ],
  },
  steps: {
    label: "Numbered steps",
    description: "\"How it works\" style steps",
    fields: [text("eyebrow", "Small label"), text("heading", "Heading"), list("items", "Steps", [text("title", "Title"), textarea("text", "Text")], { itemLabel: "title" })],
  },
  faq: {
    label: "FAQ",
    description: "Questions and answers. Also adds FAQ rich results data for Google.",
    fields: [text("eyebrow", "Small label"), text("heading", "Heading"), list("items", "Questions", [text("question", "Question"), html("answer", "Answer")], { itemLabel: "question" })],
  },
  richtext: {
    label: "Text content",
    description: "Free-form text with headings, lists, links and images",
    fields: [
      text("heading", "Heading"),
      html("html", "Content"),
      select("width", "Width", { options: [{ value: "narrow", label: "Narrow (easy reading)" }, { value: "wide", label: "Full width" }], default: "narrow" }),
    ],
  },
  imageText: {
    label: "Image with text",
    description: "Photo beside a block of text",
    fields: [
      text("eyebrow", "Small label"),
      text("heading", "Heading"),
      html("html", "Text"),
      image("image", "Image"),
      text("imageAlt", "Image alt text"),
      select("imagePosition", "Image side", { options: [{ value: "left", label: "Left" }, { value: "right", label: "Right" }], default: "left" }),
      text("buttonLabel", "Button label"),
      url("buttonLink", "Button link"),
    ],
  },
};

const pageFields = [
  text("title", "Page title", { help: "Shown in the admin, breadcrumbs and (if no SEO title is set) in Google." }),
  text("slug", "URL", { help: "e.g. \"about-us\" → yoursite.com/about-us." }),
  select("status", "Status", {
    options: [
      { value: "published", label: "Published" },
      { value: "draft", label: "Draft (hidden from visitors)" },
    ],
    default: "published",
  }),
  group("seo", "SEO", SEO_FIELDS),
  ...SITEMAP_FIELDS,
];

// Product editor fields, grouped by the tab they appear on in the admin
const productFields = [
  text("name", "Product name", { tab: "details" }),
  text("slug", "URL", { tab: "details", help: "e.g. \"alluvi-glow-pen\" → yoursite.com/products/alluvi-glow-pen" }),
  select("status", "Status", { tab: "details", options: [{ value: "active", label: "Active (on sale)" }, { value: "draft", label: "Draft (hidden)" }], default: "active" }),
  text("category", "Category", { tab: "details", help: "e.g. Metabolic research" }),
  text("subtitle", "Subtitle", { tab: "details" }),
  text("brand", "Brand", { tab: "details" }),
  textarea("shortDescription", "Short description", { tab: "details", help: "Shown near the price, on product cards and in Google product data." }),
  list("images", "Photos", [image("src", "Image"), text("alt", "Alt text")], { tab: "details", itemLabel: "alt", help: "The first photo is the main one." }),
  list(
    "variants",
    "Versions",
    [
      text("name", "Version name", { help: "e.g. 20mg, 40mg or 2-pen set" }),
      textarea("description", "Short description", { help: "Shown on Strength cards sections." }),
      text("badge", "Badge (optional)", { help: "e.g. Most popular" }),
      num("price", "Price", { min: 0, step: 0.01 }),
      num("compareAtPrice", "Compare-at price", { min: 0, step: 0.01, help: "Shown crossed out. 0 hides it." }),
      text("sku", "SKU"),
      check("inStock", "In stock", { default: true }),
      image("image", "Photo for this version (optional)", { help: "Shown when this version is selected." }),
    ],
    { tab: "details", itemLabel: "name", help: "Each version (strength or pack) has its own price, SKU and stock." }
  ),
  list("facts", "Key facts", [text("label", "Label"), text("value", "Value")], { tab: "content", itemLabel: "label", help: "Shown as a grid under the title, e.g. Pack, Format, Strength." }),
  list("highlights", "What you're ordering", [text("text", "Point")], { tab: "content", itemLabel: "text" }),
  list("tabs", "Info tabs (accordion)", [text("title", "Title"), html("html", "Content"), check("open", "Open by default")], { tab: "content", itemLabel: "title" }),
  list("faq", "FAQ", [text("question", "Question"), html("answer", "Answer")], { tab: "content", itemLabel: "question", help: "Also adds FAQ rich results data for Google." }),
  file("testReportUrl", "Test report (PDF or image)", { tab: "content", help: "Upload under Media, then choose it here. Leave blank to hide the link." }),
  group("seo", "SEO", SEO_FIELDS, { tab: "seo" }),
  ...SITEMAP_FIELDS.map((x) => ({ ...x, tab: "seo", default: x.key === "priority" ? 0.9 : x.default })),
];

const SECTIONS = {
  settings: group("settings", "Store settings", [
    heading("Store details"),
    text("storeName", "Store name"),
    text("companyName", "Registered company name"),
    text("contactEmail", "Contact email"),
    text("contactPhone", "Contact phone"),
    text("businessHours", "Opening hours"),
    textarea("address", "Business address"),
    select("currency", "Currency", { options: ["GBP", "EUR", "USD"].map((v) => ({ value: v, label: v })), default: "GBP" }),
    select("locale", "Number & date format", { options: [{ value: "en-GB", label: "English (UK)" }, { value: "en-US", label: "English (US)" }, { value: "en-IE", label: "English (Ireland)" }], default: "en-GB" }),
    heading("Logo"),
    text("logoText", "Logo text", { help: "Used when no logo image is set." }),
    text("logoSubtext", "Logo small text"),
    image("logoImage", "Logo image (optional)", { help: "Replaces the text logo." }),
    num("logoHeight", "Logo image height (px)", { min: 20, max: 120, default: 40 }),
    image("favicon", "Browser tab icon (favicon)"),
    heading("Colours & fonts", "Defaults match the Shopify Zeal \"Versatile\" theme."),
    group("theme", "Colours", [
      color("bg", "Page background", { default: "#faf7f2" }),
      color("surface", "Cards & white sections", { default: "#ffffff" }),
      color("tint", "Soft tint", { default: "#f2ebe3" }),
      color("text", "Text", { default: "#292421" }),
      color("muted", "Secondary text", { default: "#6b605a" }),
      color("accent", "Brand / buttons", { default: "#684c44" }),
    ]),
    select("headingFont", "Heading font", { options: HEADING_FONTS.map((v) => ({ value: v, label: v })), default: HEADING_FONTS[0] }),
    select("bodyFont", "Body font", { options: BODY_FONTS.map((v) => ({ value: v, label: v })), default: BODY_FONTS[0] }),
    heading("Footer"),
    textarea("footerAbout", "Footer about text"),
    html("footerDisclaimer", "Footer disclaimer"),
    text("copyright", "Copyright line", { help: "{year} is replaced with the current year." }),
  ]),

  announcement: group("announcement", "Announcement bar", [
    check("enabled", "Show the scrolling announcement bar"),
    list("items", "Messages", [text("text", "Message")], { itemLabel: "text" }),
  ]),

  gate: group("gate", "Research-use pop-up", [
    check("enabled", "Ask first-time visitors to confirm research use and age"),
    text("eyebrow", "Small label"),
    text("title", "Title"),
    html("html", "Message"),
    text("acceptLabel", "Confirm button label"),
    text("leaveLabel", "Leave button label"),
    url("leaveUrl", "Leave button link"),
  ]),

  navigation: group("navigation", "Navigation", [
    list("header", "Header menu links", [text("label", "Label"), url("url", "Link")], { itemLabel: "label" }),
    group("headerButton", "Header button", [text("label", "Label", { help: "Leave blank to hide." }), url("url", "Link")]),
    list(
      "footer",
      "Footer menu columns",
      [text("title", "Column title"), list("links", "Links", [text("label", "Label"), url("url", "Link")], { itemLabel: "label" })],
      { itemLabel: "title" }
    ),
  ]),

  pricing: group("pricing", "Volume pricing", [
    num("maxQty", "Maximum quantity per version", { min: 1, max: 500, default: 20 }),
    list("tiers", "Volume discounts", [num("min", "Minimum pens in cart", { min: 1 }), num("percent", "Discount %", { min: 0, max: 90 })], {
      itemLabel: "min",
      help: "Counts every pen in the cart, across all products. The highest tier reached applies to the whole cart.",
    }),
    list("bundles", "Quick-pick quantity cards", [num("qty", "Quantity", { min: 1 }), text("title", "Title"), text("badge", "Badge (optional)")], { itemLabel: "title" }),
  ]),

  productPage: group("productPage", "Product page layout", [
    heading("Buy box"),
    text("addToCartLabel", "Add to cart label"),
    check("showBuyNow", "Show \"Buy it now\" button (goes straight to checkout)"),
    text("buyNowLabel", "Buy it now label"),
    text("outOfStockLabel", "Sold out label"),
    check("showBundles", "Show quick-pick quantity cards"),
    check("stickyBar", "Show sticky add-to-cart bar when scrolling"),
    list("trust", "Trust badges under the buttons", [iconField(), text("label", "Label")], { itemLabel: "label" }),
    heading("Under the title"),
    list("badges", "Badges", [text("text", "Text")], { itemLabel: "text" }),
    textarea("disclaimer", "Research-use note"),
    text("testReportLabel", "Test report link label"),
    heading("Sections below the product"),
    text("docsHeading", "Documentation heading"),
    list("docs", "Documentation cards", [iconField(), text("title", "Title"), textarea("text", "Text")], { itemLabel: "title" }),
    text("highlightsHeading", "\"What you're ordering\" heading"),
    text("assuranceHeading", "Confidence check heading"),
    list("assurance", "Confidence check items", [iconField(), text("title", "Title"), textarea("text", "Text")], { itemLabel: "title" }),
    text("faqHeading", "FAQ heading"),
    check("showRelated", "Show related products"),
    text("relatedHeading", "Related products heading"),
  ]),

  shipping: list("shipping", "Shipping methods", [text("id", "Code", { help: "Short unique code, e.g. tracked48" }), text("label", "Name"), text("eta", "Delivery estimate"), num("price", "Price", { min: 0, step: 0.01 })], {
    itemLabel: "label",
  }),

  discountCodes: list("discountCodes", "Discount codes", [text("code", "Code"), num("percent", "Discount %", { min: 1, max: 90 }), check("active", "Active", { default: true })], {
    itemLabel: "code",
  }),

  forms: group("forms", "Forms", [
    url("webhookUrl", "New-message webhook (optional)", { help: "Each contact or wholesale enquiry is POSTed here as JSON, e.g. a Zapier or Make URL that emails it to you." }),
  ]),

  checkout: group("checkout", "Checkout", [
    heading("Cart"),
    text("cartTitle", "Cart title"),
    textarea("cartNote", "Note under the cart total"),
    text("emptyCartText", "Empty cart message"),
    heading("Checkout page"),
    textarea("paymentInstructions", "Payment section text"),
    list("agreements", "Required tick-boxes", [textarea("text", "Text")], { itemLabel: "text" }),
    textarea("successMessage", "Order confirmation message", { help: "{email} is replaced with the customer's email." }),
    url("webhookUrl", "New-order webhook (optional)", { help: "Each new order is POSTed here as JSON, e.g. a Zapier or Make URL that emails you." }),
  ]),

  seo: group("seo", "SEO", [
    heading("Site-wide"),
    url("siteUrl", "Live website address", { help: "e.g. https://www.yourdomain.co.uk. Used for canonical links, the sitemap and social previews." }),
    text("titleTemplate", "Title template", { help: "%s is replaced with each page's title. The home page uses its SEO title as written." }),
    textarea("defaultDescription", "Default meta description", { max: 400, counter: [70, 160], help: "Used for pages without their own description." }),
    image("ogImage", "Default social share image"),
    text("twitterHandle", "X / Twitter handle", { help: "e.g. @alluvi" }),
    check("noindexSite", "Hide the whole site from search engines", { help: "Use while the site is unfinished. Turns robots.txt into \"Disallow: /\"." }),
    heading("Search console verification"),
    text("googleVerification", "Google Search Console code", { help: "Only the content=\"…\" value of the meta tag." }),
    text("bingVerification", "Bing Webmaster code"),
    heading("Structured data (rich results)"),
    check("organizationSchema", "Organization & WebSite data on home page"),
    check("productSchema", "Product data (prices, stock) on product pages"),
    check("faqSchema", "FAQ data from FAQ sections"),
    check("breadcrumbSchema", "Breadcrumb data on sub-pages"),
    heading("Sitemap & robots.txt"),
    check("sitemapImages", "Include images in sitemap.xml"),
    textarea("robotsTxt", "robots.txt rules", { max: 5000, rows: 8 }),
    check("robotsAddSitemap", "Add the sitemap link to robots.txt automatically"),
    heading("Tracking & custom code", "Paste code from Google Analytics, Tag Manager, Meta Pixel, etc."),
    textarea("headCode", "Code inside <head>", { max: 20000, rows: 6, code: true }),
    textarea("bodyCode", "Code before </body>", { max: 20000, rows: 6, code: true }),
  ]),

  redirects: list(
    "redirects",
    "Redirects",
    [
      text("from", "Old path", { help: "e.g. /old-page" }),
      url("to", "New URL", { help: "e.g. /new-page or a full URL" }),
      select("type", "Type", { options: [{ value: "301", label: "301 Permanent" }, { value: "302", label: "302 Temporary" }], default: "301" }),
    ],
    { itemLabel: "from" }
  ),
};

/* ------------------------------------------------------------------ */
/* Cleaning                                                             */
/* ------------------------------------------------------------------ */

const LIMITS = { text: 500, url: 2000, image: 1000, file: 1000, product: 60, textarea: 5000, html: 200000 };

function clean(field, value) {
  switch (field.type) {
    case "text":
    case "url":
    case "image":
    case "file":
    case "product":
    case "textarea":
    case "html": {
      const v = value == null ? (field.default ?? "") : String(value);
      return v.slice(0, field.max || LIMITS[field.type]);
    }
    case "color":
      return /^#[0-9a-f]{3,8}$/i.test(value || "") ? value : field.default || "#000000";
    case "number": {
      let n = Number(value);
      if (!isFinite(n)) n = field.default ?? 0;
      if (field.min != null) n = Math.max(field.min, n);
      if (field.max != null) n = Math.min(field.max, n);
      return n;
    }
    case "checkbox":
      return value === undefined ? !!field.default : !!value;
    case "select": {
      const values = field.options.map((o) => (typeof o === "string" ? o : o.value));
      return values.includes(value) ? value : field.default ?? values[0];
    }
    case "icon":
      return field.options.includes(value) ? value : field.options[0];
    case "group":
      return cleanFields(field.fields, value || {});
    case "list":
      return (Array.isArray(value) ? value : []).slice(0, 500).map((item) => cleanFields(field.fields, item || {}));
    default:
      return undefined;
  }
}

function cleanFields(fields, obj) {
  const out = {};
  for (const field of fields) {
    if (field.type === "heading") continue;
    out[field.key] = clean(field, obj[field.key]);
  }
  return out;
}

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9/-]+/g, "-")
    .replace(/\/+/g, "/")
    .replace(/-+/g, "-")
    .replace(/^[-/]+|[-/]+$/g, "");
}

function randomId(prefix) {
  return prefix + "-" + Math.random().toString(36).slice(2, 9);
}

function validId(v, max = 60) {
  return typeof v === "string" && new RegExp(`^[\\w-]{1,${max}}$`).test(v);
}

function cleanBlock(block) {
  const type = BLOCK_TYPES[block.type] ? block.type : null;
  if (!type) return null;
  const out = cleanFields([...blockCommon, ...BLOCK_TYPES[type].fields], block);
  out.id = validId(block.id, 40) ? block.id : randomId("b");
  out.type = type;
  out.anchor = slugify(out.anchor).replace(/\//g, "-");
  return out;
}

function stamp(item, prev) {
  const same = prev && JSON.stringify({ ...prev, updatedAt: null }) === JSON.stringify({ ...item, updatedAt: null });
  item.updatedAt = same ? prev.updatedAt : new Date().toISOString();
}

// Returns { site } or { error }
function cleanSite(input, previous, reservedSlugs) {
  const site = {};
  for (const [key, field] of Object.entries(SECTIONS)) site[key] = clean(field, input[key]);

  site.redirects = site.redirects
    .filter((r) => r.from && r.to)
    .map((r) => ({ ...r, from: "/" + slugify(r.from.replace(/^https?:\/\/[^/]+/i, "")) }));

  site.shipping = site.shipping.filter((s) => s.label).map((s) => ({ ...s, id: slugify(s.id || s.label).replace(/\//g, "-") || randomId("ship") }));
  if (!site.shipping.length) return { error: "Add at least one shipping method." };
  if (new Set(site.shipping.map((s) => s.id)).size !== site.shipping.length) return { error: "Each shipping method needs a unique code." };

  site.discountCodes = site.discountCodes.filter((d) => d.code).map((d) => ({ ...d, code: d.code.trim().toUpperCase() }));
  site.pricing.tiers.sort((a, b) => a.min - b.min);
  site.pricing.bundles = site.pricing.bundles.filter((b) => b.qty <= site.pricing.maxQty);

  // Products
  const prevProducts = new Map((previous.products || []).map((p) => [p.id, p]));
  const productSlugs = new Set();
  const variantIds = new Set();
  site.products = [];
  for (const raw of Array.isArray(input.products) ? input.products : []) {
    const p = cleanFields(productFields, raw);
    p.id = validId(raw.id) ? raw.id : randomId("prod");
    p.slug = slugify(p.slug || p.name).replace(/\//g, "-");
    if (!p.name) return { error: "Every product needs a name." };
    if (!p.slug) return { error: `"${p.name}" needs a URL.` };
    if (productSlugs.has(p.slug)) return { error: `Two products use the URL "/products/${p.slug}".` };
    productSlugs.add(p.slug);
    p.variants = p.variants
      .map((v, i) => {
        const rawId = ((raw.variants || [])[i] || {}).id;
        let id = validId(rawId) && !variantIds.has(rawId) ? rawId : randomId("v");
        variantIds.add(id);
        return { id, ...v, name: v.name || "Standard" };
      });
    if (!p.variants.length) return { error: `"${p.name}" needs at least one version with a price.` };
    stamp(p, prevProducts.get(p.id));
    site.products.push(p);
  }
  const productIds = site.products.map((p) => p.id);

  // Pages
  const prevPages = new Map((previous.pages || []).map((p) => [p.id, p]));
  const slugs = new Set();
  site.pages = [];
  for (const raw of Array.isArray(input.pages) ? input.pages : []) {
    const page = cleanFields(pageFields, raw);
    page.id = validId(raw.id) ? raw.id : randomId("page");
    page.slug = page.id === "home" ? "" : slugify(page.slug || page.title);
    if (page.id !== "home" && !page.slug) return { error: `Page "${page.title}" needs a URL.` };
    if (reservedSlugs.includes(page.slug.split("/")[0])) return { error: `The URL "/${page.slug}" is reserved. Choose another for "${page.title}".` };
    if (slugs.has(page.slug)) return { error: `Two pages use the URL "/${page.slug}".` };
    slugs.add(page.slug);
    page.blocks = (Array.isArray(raw.blocks) ? raw.blocks : []).map(cleanBlock).filter(Boolean);

    // Point product sections at products that still exist
    for (const b of page.blocks) {
      if (b.type === "hero" && b.buyProduct !== "all" && !productIds.includes(b.buyProduct)) b.buyProduct = "all";
      if ((b.type === "product" || b.type === "variants") && !productIds.includes(b.productId)) b.productId = productIds[0] || "";
      if (b.type === "productGrid") b.products = b.products.filter((x) => productIds.includes(x.productId));
    }
    stamp(page, prevPages.get(page.id));
    site.pages.push(page);
  }
  const home = site.pages.find((p) => p.id === "home");
  if (!home) return { error: "The home page can't be deleted." };
  if (home.status !== "published") return { error: "The home page must stay published." };

  return { site };
}

module.exports = { SECTIONS, BLOCK_TYPES, blockCommon, pageFields, productFields, cleanSite, slugify };
