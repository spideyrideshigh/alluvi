const express = require("express");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const db = require("./lib/db");
const auth = require("./lib/auth");
const render = require("./lib/render");
const schema = require("./lib/schema");
const { cartTotals } = require("./lib/pricing");

const PORT = Number(process.env.PORT) || 3000;
const UPLOAD_DIR = path.join(__dirname, "public", "uploads");
const ADMIN_DIR = path.join(__dirname, "admin");
const ORDER_STATUSES = ["new", "awaiting-payment", "paid", "shipped", "completed", "cancelled"];

fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const app = express();
app.disable("x-powered-by");
if (process.env.TRUST_PROXY) app.set("trust proxy", 1);

app.use((req, res, next) => {
  res.set("X-Content-Type-Options", "nosniff");
  res.set("Referrer-Policy", "strict-origin-when-cross-origin");
  if (db.getSite().seo.noindexSite) res.set("X-Robots-Tag", "noindex, nofollow");
  next();
});

// Redirects managed in the admin
app.use((req, res, next) => {
  const p = req.path.replace(/\/+$/, "") || "/";
  const r = db.getSite().redirects.find((x) => x.from === p);
  if (r) return res.redirect(r.type === "302" ? 302 : 301, r.to);
  next();
});

/* ------------------------------------------------------------------ */
/* SEO files                                                            */
/* ------------------------------------------------------------------ */

app.get("/robots.txt", (req, res) => {
  res.type("text/plain").send(render.renderRobots(db.getSite(), req));
});

app.get("/sitemap.xml", (req, res) => {
  res.type("application/xml").send(render.renderSitemap(db.getSite(), req));
});

// CSS and JS are always revalidated so design changes show up straight away; images are cached for an hour
const noCacheCode = (res, file) => {
  if (/\.(css|js)$/.test(file)) res.setHeader("Cache-Control", "no-cache");
};
app.use(express.static(path.join(__dirname, "public"), { maxAge: "1h", index: false, setHeaders: noCacheCode }));

/* ------------------------------------------------------------------ */
/* Storefront API                                                       */
/* ------------------------------------------------------------------ */

const publicJson = express.json({ limit: "50kb" });

// Basic per-IP limit on order submissions
const orderHits = new Map();
function orderLimited(ip) {
  const now = Date.now();
  const hits = (orderHits.get(ip) || []).filter((t) => now - t < 60 * 60 * 1000);
  hits.push(now);
  orderHits.set(ip, hits);
  return hits.length > 20;
}

app.post("/api/discount", publicJson, (req, res) => {
  const code = String((req.body && req.body.code) || "").trim().toUpperCase();
  const dc = db.getSite().discountCodes.find((d) => d.active && d.code === code);
  res.json(dc ? { valid: true, code: dc.code, percent: dc.percent } : { valid: false });
});

// Contact and wholesale enquiries
const FORM_FIELDS = {
  contact: { fields: ["name", "email", "phone", "topic", "order", "message"], required: ["name", "email", "message"] },
  wholesale: { fields: ["name", "company", "email", "phone", "quantity", "strengths", "message"], required: ["name", "company", "email", "quantity"] },
};
const formHits = new Map();

app.post("/api/forms", publicJson, (req, res) => {
  const body = req.body || {};
  const spec = FORM_FIELDS[body.type];
  if (!spec) return res.status(400).json({ error: "Unknown form" });
  // Bots fill in the hidden "website" field; pretend it worked
  if (body.website) return res.json({ ok: true });

  const now = Date.now();
  const hits = (formHits.get(req.ip) || []).filter((t) => now - t < 60 * 60 * 1000);
  hits.push(now);
  formHits.set(req.ip, hits);
  if (hits.length > 10) return res.status(429).json({ error: "Too many messages from your connection. Please try again later" });

  const fields = {};
  for (const key of spec.fields) {
    const v = Array.isArray(body[key]) ? body[key].join(", ") : body[key];
    fields[key] = String(v || "").trim().slice(0, key === "message" ? 5000 : 200);
  }
  if (spec.required.some((k) => !fields[k])) return res.status(400).json({ error: "Please complete all required fields" });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) return res.status(400).json({ error: "Please enter a valid email address" });

  const message = { id: "M-" + crypto.randomBytes(4).toString("hex").toUpperCase(), type: body.type, createdAt: new Date().toISOString(), status: "new", fields, notes: "" };
  db.saveMessages([message, ...db.getMessages()].slice(0, 5000));

  const hook = db.getSite().forms && db.getSite().forms.webhookUrl;
  if (hook && /^https:\/\//i.test(hook)) {
    fetch(hook, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(message) }).catch((e) => console.error("Form webhook failed:", e.message));
  }
  res.json({ ok: true });
});

const CUSTOMER_FIELDS = ["email", "firstName", "lastName", "company", "address1", "address2", "city", "postcode", "phone", "country"];
const REQUIRED_FIELDS = ["email", "firstName", "lastName", "address1", "city", "postcode", "phone"];

app.post("/api/orders", publicJson, (req, res) => {
  const site = db.getSite();
  if (orderLimited(req.ip)) return res.status(429).json({ error: "Too many orders from your connection. Please try again later" });

  const body = req.body || {};
  const input = body.customer || {};
  const customer = {};
  for (const key of CUSTOMER_FIELDS) customer[key] = String(input[key] || "").trim().slice(0, 200);
  const missing = REQUIRED_FIELDS.filter((k) => !customer[k]);
  if (missing.length) return res.status(400).json({ error: "Please complete all required fields" });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)) return res.status(400).json({ error: "Please enter a valid email address" });
  if (!body.agreed) return res.status(400).json({ error: "Please confirm the required statements" });

  const { lines, errors, ...totals } = cartTotals(site, { items: body.items, shippingId: body.shippingId, code: body.code });
  if (errors.length) return res.status(400).json({ error: errors[0] + ". Please update your cart" });
  if (!lines.length) return res.status(400).json({ error: "Your cart is empty" });
  const order = {
    reference: "ALV-" + crypto.randomBytes(4).toString("hex").toUpperCase(),
    createdAt: new Date().toISOString(),
    status: "new",
    items: lines,
    currency: site.settings.currency,
    totals,
    customer,
    tracking: "",
    notes: "",
  };
  db.saveOrders([order, ...db.getOrders()]);

  if (site.checkout.webhookUrl && /^https:\/\//i.test(site.checkout.webhookUrl)) {
    fetch(site.checkout.webhookUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(order) }).catch((e) =>
      console.error("Order webhook failed:", e.message)
    );
  }

  res.json({ reference: order.reference, total: totals.total });
});

/* ------------------------------------------------------------------ */
/* Admin                                                                */
/* ------------------------------------------------------------------ */

app.get(["/admin", "/admin/"], (req, res) => {
  res.set("X-Frame-Options", "DENY");
  res.set("Cache-Control", "no-store");
  res.sendFile(path.join(ADMIN_DIR, "index.html"));
});
app.use("/admin/assets", express.static(ADMIN_DIR, { index: false, setHeaders: (res) => res.setHeader("Cache-Control", "no-cache") }));

const adminJson = express.json({ limit: "25mb" });

// Reject cross-site requests to the admin API
function sameOrigin(req, res, next) {
  const origin = req.get("origin");
  if (req.method !== "GET" && origin && new URL(origin).host !== req.get("host")) return res.status(403).json({ error: "Bad origin" });
  next();
}

function requireAdmin(req, res, next) {
  res.set("Cache-Control", "no-store");
  if (!auth.isLoggedIn(req)) return res.status(401).json({ error: "Please log in" });
  next();
}

const api = express.Router();
api.use(sameOrigin);

api.post("/login", adminJson, (req, res) => {
  if (auth.tooManyAttempts(req.ip)) return res.status(429).json({ error: "Too many attempts. Try again in 15 minutes." });
  if (!auth.checkPassword(req.body && req.body.password)) {
    auth.recordFailure(req.ip);
    return res.status(401).json({ error: "Incorrect password" });
  }
  auth.createSession(res, req.secure);
  res.json({ ok: true });
});

api.post("/logout", (req, res) => {
  auth.clearSession(res);
  res.json({ ok: true });
});

api.use(requireAdmin);

api.get("/site", (req, res) => {
  res.json({
    site: db.getSite(),
    schema: {
      sections: schema.SECTIONS,
      blockTypes: schema.BLOCK_TYPES,
      blockCommon: schema.blockCommon,
      pageFields: schema.pageFields,
      productFields: schema.productFields,
    },
    reservedSlugs: render.RESERVED_SLUGS,
    icons: render.ICON_SVGS,
  });
});

api.put("/site", adminJson, (req, res) => {
  const result = schema.cleanSite(req.body || {}, db.getSite(), render.RESERVED_SLUGS);
  if (result.error) return res.status(400).json({ error: result.error });
  db.saveSite(result.site);
  res.json({ site: result.site });
});

// Full backup / restore of the site content
api.get("/export", (req, res) => {
  res.set("Content-Disposition", `attachment; filename="site-backup-${new Date().toISOString().slice(0, 10)}.json"`);
  res.json(db.getSite());
});

api.get("/messages", (req, res) => res.json({ messages: db.getMessages() }));

api.patch("/messages/:id", adminJson, (req, res) => {
  const messages = db.getMessages();
  const m = messages.find((x) => x.id === req.params.id);
  if (!m) return res.status(404).json({ error: "Message not found" });
  const { status, notes } = req.body || {};
  if (["new", "read", "replied", "archived"].includes(status)) m.status = status;
  if (notes !== undefined) m.notes = String(notes).slice(0, 5000);
  db.saveMessages(messages);
  res.json({ message: m });
});

api.delete("/messages/:id", (req, res) => {
  db.saveMessages(db.getMessages().filter((x) => x.id !== req.params.id));
  res.json({ ok: true });
});

api.get("/orders", (req, res) => res.json({ orders: db.getOrders(), statuses: ORDER_STATUSES }));

api.patch("/orders/:ref", adminJson, (req, res) => {
  const orders = db.getOrders();
  const order = orders.find((o) => o.reference === req.params.ref);
  if (!order) return res.status(404).json({ error: "Order not found" });
  const { status, tracking, notes } = req.body || {};
  if (status !== undefined && ORDER_STATUSES.includes(status)) order.status = status;
  if (tracking !== undefined) order.tracking = String(tracking).slice(0, 200);
  if (notes !== undefined) order.notes = String(notes).slice(0, 5000);
  order.updatedAt = new Date().toISOString();
  db.saveOrders(orders);
  res.json({ order });
});

api.delete("/orders/:ref", (req, res) => {
  db.saveOrders(db.getOrders().filter((o) => o.reference !== req.params.ref));
  res.json({ ok: true });
});

api.get("/orders.csv", (req, res) => {
  const cols = ["reference", "createdAt", "status", "items", "qty", "total", "currency", "email", "firstName", "lastName", "company", "address1", "address2", "city", "postcode", "phone", "shipping", "discountCode", "tracking", "notes"];
  const cell = (v) => {
    let s = String(v == null ? "" : v);
    if (/^[=+\-@]/.test(s)) s = "'" + s; // stop spreadsheet formula injection
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const rows = db.getOrders().map((o) =>
    [o.reference, o.createdAt, o.status, (o.items || []).map((l) => `${l.productName} ${l.variantName} x${l.qty}`).join("; "), o.totals.qty, o.totals.total, o.currency, o.customer.email, o.customer.firstName, o.customer.lastName, o.customer.company, o.customer.address1, o.customer.address2, o.customer.city, o.customer.postcode, o.customer.phone, o.totals.shippingLabel, o.totals.discountCode, o.tracking, o.notes]
      .map(cell)
      .join(",")
  );
  res.set("Content-Disposition", `attachment; filename="orders-${new Date().toISOString().slice(0, 10)}.csv"`);
  res.type("text/csv").send([cols.join(","), ...rows].join("\n"));
});

// Media library
const IMAGE_TYPES = [
  { ext: ".jpg", test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { ext: ".png", test: (b) => b.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  { ext: ".gif", test: (b) => b.slice(0, 4).toString("ascii") === "GIF8" },
  { ext: ".webp", test: (b) => b.slice(0, 4).toString("ascii") === "RIFF" && b.slice(8, 12).toString("ascii") === "WEBP" },
  { ext: ".ico", test: (b) => b[0] === 0 && b[1] === 0 && b[2] === 1 && b[3] === 0 },
  { ext: ".pdf", test: (b) => b.slice(0, 5).toString("ascii") === "%PDF-" },
];

function mediaList() {
  return fs
    .readdirSync(UPLOAD_DIR)
    .filter((n) => /\.(jpe?g|png|gif|webp|ico|pdf)$/i.test(n))
    .map((name) => {
      const stat = fs.statSync(path.join(UPLOAD_DIR, name));
      return { name, url: "/uploads/" + name, size: stat.size, modified: stat.mtime };
    })
    .sort((a, b) => b.modified - a.modified);
}

api.get("/media", (req, res) => res.json({ media: mediaList() }));

api.post("/media", adminJson, (req, res) => {
  const { name, data } = req.body || {};
  if (typeof data !== "string") return res.status(400).json({ error: "No file received" });
  const buffer = Buffer.from(data.replace(/^data:[^,]*,/, ""), "base64");
  if (buffer.length > 15 * 1024 * 1024) return res.status(400).json({ error: "Images must be under 15 MB" });
  const type = IMAGE_TYPES.find((t) => t.test(buffer));
  if (!type) return res.status(400).json({ error: "Only JPG, PNG, GIF, WebP, ICO images and PDF files are allowed" });
  const base = schema.slugify(path.parse(String(name || "image")).name).replace(/\//g, "-").slice(0, 60) || "image";
  let file = base + type.ext;
  if (fs.existsSync(path.join(UPLOAD_DIR, file))) file = `${base}-${crypto.randomBytes(3).toString("hex")}${type.ext}`;
  fs.writeFileSync(path.join(UPLOAD_DIR, file), buffer);
  res.json({ name: file, url: "/uploads/" + file });
});

api.delete("/media/:name", (req, res) => {
  const name = path.basename(req.params.name);
  const file = path.join(UPLOAD_DIR, name);
  if (!fs.existsSync(file)) return res.status(404).json({ error: "File not found" });
  if (JSON.stringify(db.getSite()).includes("/uploads/" + name) && req.query.force !== "1") {
    return res.status(409).json({ error: "This image is used on the site. Remove it from your pages first, or delete anyway." });
  }
  fs.unlinkSync(file);
  res.json({ ok: true });
});

api.post("/password", adminJson, (req, res) => {
  const { current, next } = req.body || {};
  if (!auth.checkPassword(current)) return res.status(400).json({ error: "Current password is incorrect" });
  if (typeof next !== "string" || next.length < 8) return res.status(400).json({ error: "New password must be at least 8 characters" });
  auth.setPassword(next);
  auth.createSession(res, req.secure);
  res.json({ ok: true });
});

app.use("/admin/api", api);

/* ------------------------------------------------------------------ */
/* Storefront pages                                                     */
/* ------------------------------------------------------------------ */

app.get("/checkout.html", (req, res) => res.redirect(301, "/checkout" + (req.url.includes("?") ? req.url.slice(req.url.indexOf("?")) : "")));
app.get("/index.html", (req, res) => res.redirect(301, "/"));

app.get("/checkout", (req, res) => {
  res.set("Cache-Control", "no-store");
  res.send(render.renderCheckout(db.getSite(), req));
});

app.get("/products/:slug", (req, res) => {
  const site = db.getSite();
  const product = site.products.find((p) => p.slug === req.params.slug.toLowerCase());
  const canView = product && (product.status === "active" || auth.isLoggedIn(req));
  if (!canView) return res.status(404).send(render.renderNotFound(site, req));
  res.send(render.renderProduct(site, product, req));
});

app.get("*", (req, res) => {
  const site = db.getSite();
  const slug = decodeURIComponent(req.path).replace(/^\/+|\/+$/g, "").toLowerCase();
  const page = site.pages.find((p) => p.slug === slug);
  const canView = page && (page.status === "published" || auth.isLoggedIn(req));
  if (!canView) return res.status(404).send(render.renderNotFound(site, req));
  if (req.path !== "/" && req.path.endsWith("/")) return res.redirect(301, "/" + slug);
  res.send(render.renderPage(site, page, req));
});

app.use((err, req, res, next) => {
  console.error(err);
  if (req.path.startsWith("/admin/api") || req.path.startsWith("/api")) return res.status(500).json({ error: "Server error" });
  res.status(500).send("Something went wrong");
});

const generated = auth.ensureAdmin();
app.listen(PORT, () => {
  console.log(`Store running at http://localhost:${PORT}`);
  console.log(`Admin dashboard at http://localhost:${PORT}/admin`);
  if (generated) console.log(`\nFirst run: admin password is  ${generated}\nChange it under Account in the dashboard.\n`);
});
