const express = require("express");
const path = require("path");
const crypto = require("crypto");

const db = require("./lib/db");
const auth = require("./lib/auth");
const media = require("./lib/media");
const render = require("./lib/render");
const schema = require("./lib/schema");
const { cartTotals } = require("./lib/pricing");

const PORT = Number(process.env.PORT) || 3000;
const ADMIN_DIR = path.join(__dirname, "admin");
const ORDER_STATUSES = ["new", "awaiting-payment", "paid", "shipped", "completed", "cancelled"];

const app = express();
app.disable("x-powered-by");
// Behind Vercel's (or any) proxy, trust it for the visitor's IP and https
if (process.env.TRUST_PROXY || process.env.VERCEL) app.set("trust proxy", 1);

// Express 4 doesn't catch errors from async handlers on its own
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

app.use((req, res, next) => {
  res.set("X-Content-Type-Options", "nosniff");
  res.set("Referrer-Policy", "strict-origin-when-cross-origin");
  next();
});

// CSS and JS are always revalidated so design changes show up straight away; images are cached for an hour
const noCacheCode = (res, file) => {
  if (/\.(css|js)$/.test(file)) res.setHeader("Cache-Control", "no-cache");
};
app.use(express.static(path.join(__dirname, "public"), { maxAge: "1h", index: false, setHeaders: noCacheCode }));
app.use("/admin/assets", express.static(ADMIN_DIR, { index: false, setHeaders: (res) => res.setHeader("Cache-Control", "no-cache") }));

// Load the latest content for every request (on Vercel each request may run on a fresh copy of the app)
app.use(
  wrap(async (req, res, next) => {
    const site = await db.loadSite();
    if (site.seo.noindexSite) res.set("X-Robots-Tag", "noindex, nofollow");
    next();
  })
);

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

/* ------------------------------------------------------------------ */
/* Storefront API                                                       */
/* ------------------------------------------------------------------ */

const publicJson = express.json({ limit: "50kb" });

// Basic per-IP limits on order and form submissions
function limited(map, ip, max) {
  const now = Date.now();
  const hits = (map.get(ip) || []).filter((t) => now - t < 60 * 60 * 1000);
  hits.push(now);
  map.set(ip, hits);
  return hits.length > max;
}
const orderHits = new Map();
const formHits = new Map();

function webhook(url, payload, label) {
  if (url && /^https:\/\//i.test(url)) {
    fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }).catch((e) => console.error(label + " webhook failed:", e.message));
  }
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

app.post(
  "/api/forms",
  publicJson,
  wrap(async (req, res) => {
    const body = req.body || {};
    const spec = FORM_FIELDS[body.type];
    if (!spec) return res.status(400).json({ error: "Unknown form" });
    // Bots fill in the hidden "website" field; pretend it worked
    if (body.website) return res.json({ ok: true });
    if (limited(formHits, req.ip, 10)) return res.status(429).json({ error: "Too many messages from your connection. Please try again later" });

    const fields = {};
    for (const key of spec.fields) {
      const v = Array.isArray(body[key]) ? body[key].join(", ") : body[key];
      fields[key] = String(v || "").trim().slice(0, key === "message" ? 5000 : 200);
    }
    if (spec.required.some((k) => !fields[k])) return res.status(400).json({ error: "Please complete all required fields" });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) return res.status(400).json({ error: "Please enter a valid email address" });

    const message = { id: "M-" + crypto.randomBytes(4).toString("hex").toUpperCase(), type: body.type, createdAt: new Date().toISOString(), status: "new", fields, notes: "" };
    if (!db.persistent) return res.status(503).json({ error: "We can't receive messages right now. Please email us instead" });
    await db.messages.add(message);
    webhook(db.getSite().forms && db.getSite().forms.webhookUrl, message, "Form");
    res.json({ ok: true });
  })
);

const CUSTOMER_FIELDS = ["email", "firstName", "lastName", "company", "address1", "address2", "city", "postcode", "phone", "country"];
const REQUIRED_FIELDS = ["email", "firstName", "lastName", "address1", "city", "postcode", "phone"];

app.post(
  "/api/orders",
  publicJson,
  wrap(async (req, res) => {
    const site = db.getSite();
    if (limited(orderHits, req.ip, 20)) return res.status(429).json({ error: "Too many orders from your connection. Please try again later" });

    const body = req.body || {};
    const input = body.customer || {};
    const customer = {};
    for (const key of CUSTOMER_FIELDS) customer[key] = String(input[key] || "").trim().slice(0, 200);
    if (REQUIRED_FIELDS.some((k) => !customer[k])) return res.status(400).json({ error: "Please complete all required fields" });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)) return res.status(400).json({ error: "Please enter a valid email address" });
    if (!body.agreed) return res.status(400).json({ error: "Please confirm the required statements" });

    const { lines, errors, ...totals } = cartTotals(site, { items: body.items, shippingId: body.shippingId, code: body.code });
    if (errors.length) return res.status(400).json({ error: errors[0] + ". Please update your cart" });
    if (!lines.length) return res.status(400).json({ error: "Your cart is empty" });
    const reference = "ALV-" + crypto.randomBytes(4).toString("hex").toUpperCase();
    const order = {
      id: reference,
      reference,
      createdAt: new Date().toISOString(),
      status: "new",
      items: lines,
      currency: site.settings.currency,
      totals,
      customer,
      tracking: "",
      notes: "",
    };
    if (!db.persistent) return res.status(503).json({ error: "Online ordering isn't available right now. Please contact us to order" });
    await db.orders.add(order);
    webhook(site.checkout.webhookUrl, order, "Order");
    res.json({ reference, total: totals.total });
  })
);

/* ------------------------------------------------------------------ */
/* Admin                                                                */
/* ------------------------------------------------------------------ */

app.get(["/admin", "/admin/"], (req, res) => {
  res.set("X-Frame-Options", "DENY");
  res.set("Cache-Control", "no-store");
  res.sendFile(path.join(ADMIN_DIR, "index.html"));
});

const adminJson = express.json({ limit: "25mb" });

// Reject cross-site requests to the admin API
function sameOrigin(req, res, next) {
  const origin = req.get("origin");
  if (req.method !== "GET" && origin && new URL(origin).host !== req.get("host")) return res.status(403).json({ error: "Bad origin" });
  next();
}

const requireAdmin = wrap(async (req, res, next) => {
  res.set("Cache-Control", "no-store");
  if (!(await auth.isLoggedIn(req))) return res.status(401).json({ error: "Please log in" });
  next();
});

const api = express.Router();
api.use(sameOrigin);

api.post(
  "/login",
  adminJson,
  wrap(async (req, res) => {
    if (auth.tooManyAttempts(req.ip)) return res.status(429).json({ error: "Too many attempts. Try again in 15 minutes." });
    const { admin } = await auth.getAdmin();
    if (!admin) return res.status(503).json({ error: "No admin password is set. Add an ADMIN_PASSWORD environment variable in Vercel (Settings › Environment Variables), then redeploy." });
    if (!(await auth.checkPassword(req.body && req.body.password))) {
      auth.recordFailure(req.ip);
      return res.status(401).json({ error: "Incorrect password" });
    }
    await auth.createSession(res, req.secure);
    res.json({ ok: true });
  })
);

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
    storage: { persistent: db.persistent, kind: db.storageKind, uploads: media.canUpload, onVercel: Boolean(process.env.VERCEL) },
  });
});

api.put(
  "/site",
  adminJson,
  wrap(async (req, res) => {
    const result = schema.cleanSite(req.body || {}, db.getSite(), render.RESERVED_SLUGS);
    if (result.error) return res.status(400).json({ error: result.error });
    await db.saveSite(result.site);
    res.json({ site: result.site });
  })
);

// Full backup of the site content
api.get("/export", (req, res) => {
  res.set("Content-Disposition", `attachment; filename="site-backup-${new Date().toISOString().slice(0, 10)}.json"`);
  res.json(db.getSite());
});

api.get(
  "/messages",
  wrap(async (req, res) => res.json({ messages: await db.messages.all() }))
);

api.patch(
  "/messages/:id",
  adminJson,
  wrap(async (req, res) => {
    const m = await db.messages.find(req.params.id);
    if (!m) return res.status(404).json({ error: "Message not found" });
    const { status, notes } = req.body || {};
    if (["new", "read", "replied", "archived"].includes(status)) m.status = status;
    if (notes !== undefined) m.notes = String(notes).slice(0, 5000);
    await db.messages.update(m);
    res.json({ message: m });
  })
);

api.delete(
  "/messages/:id",
  wrap(async (req, res) => {
    await db.messages.remove(req.params.id);
    res.json({ ok: true });
  })
);

api.get(
  "/orders",
  wrap(async (req, res) => res.json({ orders: await db.orders.all(), statuses: ORDER_STATUSES }))
);

api.patch(
  "/orders/:ref",
  adminJson,
  wrap(async (req, res) => {
    const order = await db.orders.find(req.params.ref);
    if (!order) return res.status(404).json({ error: "Order not found" });
    const { status, tracking, notes } = req.body || {};
    if (status !== undefined && ORDER_STATUSES.includes(status)) order.status = status;
    if (tracking !== undefined) order.tracking = String(tracking).slice(0, 200);
    if (notes !== undefined) order.notes = String(notes).slice(0, 5000);
    order.updatedAt = new Date().toISOString();
    await db.orders.update(order);
    res.json({ order });
  })
);

api.delete(
  "/orders/:ref",
  wrap(async (req, res) => {
    await db.orders.remove(req.params.ref);
    res.json({ ok: true });
  })
);

api.get(
  "/orders.csv",
  wrap(async (req, res) => {
    const cols = ["reference", "createdAt", "status", "items", "qty", "total", "currency", "email", "firstName", "lastName", "company", "address1", "address2", "city", "postcode", "phone", "shipping", "discountCode", "tracking", "notes"];
    const cell = (v) => {
      let s = String(v == null ? "" : v);
      if (/^[=+\-@]/.test(s)) s = "'" + s; // stop spreadsheet formula injection
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const rows = (await db.orders.all()).map((o) =>
      [o.reference, o.createdAt, o.status, (o.items || []).map((l) => `${l.productName} ${l.variantName} x${l.qty}`).join("; "), o.totals.qty, o.totals.total, o.currency, o.customer.email, o.customer.firstName, o.customer.lastName, o.customer.company, o.customer.address1, o.customer.address2, o.customer.city, o.customer.postcode, o.customer.phone, o.totals.shippingLabel, o.totals.discountCode, o.tracking, o.notes]
        .map(cell)
        .join(",")
    );
    res.set("Content-Disposition", `attachment; filename="orders-${new Date().toISOString().slice(0, 10)}.csv"`);
    res.type("text/csv").send([cols.join(","), ...rows].join("\n"));
  })
);

// Media library
const FILE_TYPES = [
  { ext: ".jpg", type: "image/jpeg", test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { ext: ".png", type: "image/png", test: (b) => b.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  { ext: ".gif", type: "image/gif", test: (b) => b.slice(0, 4).toString("ascii") === "GIF8" },
  { ext: ".webp", type: "image/webp", test: (b) => b.slice(0, 4).toString("ascii") === "RIFF" && b.slice(8, 12).toString("ascii") === "WEBP" },
  { ext: ".ico", type: "image/x-icon", test: (b) => b[0] === 0 && b[1] === 0 && b[2] === 1 && b[3] === 0 },
  { ext: ".pdf", type: "application/pdf", test: (b) => b.slice(0, 5).toString("ascii") === "%PDF-" },
];

api.get(
  "/media",
  wrap(async (req, res) => res.json({ media: await media.list() }))
);

api.post(
  "/media",
  adminJson,
  wrap(async (req, res) => {
    const { name, data } = req.body || {};
    if (typeof data !== "string") return res.status(400).json({ error: "No file received" });
    const buffer = Buffer.from(data.replace(/^data:[^,]*,/, ""), "base64");
    if (buffer.length > 15 * 1024 * 1024) return res.status(400).json({ error: "Files must be under 15 MB" });
    const type = FILE_TYPES.find((t) => t.test(buffer));
    if (!type) return res.status(400).json({ error: "Only JPG, PNG, GIF, WebP, ICO images and PDF files are allowed" });
    const base = schema.slugify(path.parse(String(name || "image")).name).replace(/\//g, "-").slice(0, 60) || "image";
    res.json(await media.save(base, type.ext, buffer, type.type));
  })
);

api.delete(
  "/media",
  wrap(async (req, res) => {
    const id = String(req.query.id || "");
    if (!id) return res.status(400).json({ error: "No file given" });
    if (JSON.stringify(db.getSite()).includes(media.urlOf(id)) && req.query.force !== "1") {
      return res.status(409).json({ error: "This image is used on the site. Remove it from your pages first, or delete anyway." });
    }
    await media.remove(id);
    res.json({ ok: true });
  })
);

api.post(
  "/password",
  adminJson,
  wrap(async (req, res) => {
    const { current, next } = req.body || {};
    if (!(await auth.checkPassword(current))) return res.status(400).json({ error: "Current password is incorrect" });
    if (typeof next !== "string" || next.length < 8) return res.status(400).json({ error: "New password must be at least 8 characters" });
    if (!db.persistent) return res.status(503).json({ error: "Without a database, change the ADMIN_PASSWORD setting in Vercel instead" });
    await auth.setPassword(next);
    await auth.createSession(res, req.secure);
    res.json({ ok: true });
  })
);

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

app.get(
  "/products/:slug",
  wrap(async (req, res) => {
    const site = db.getSite();
    const product = site.products.find((p) => p.slug === req.params.slug.toLowerCase());
    const canView = product && (product.status === "active" || (await auth.isLoggedIn(req)));
    if (!canView) return res.status(404).send(render.renderNotFound(site, req));
    res.send(render.renderProduct(site, product, req));
  })
);

app.get(
  "*",
  wrap(async (req, res) => {
    const site = db.getSite();
    const slug = decodeURIComponent(req.path).replace(/^\/+|\/+$/g, "").toLowerCase();
    const page = site.pages.find((p) => p.slug === slug);
    const canView = page && (page.status === "published" || (await auth.isLoggedIn(req)));
    if (!canView) return res.status(404).send(render.renderNotFound(site, req));
    if (req.path !== "/" && req.path.endsWith("/")) return res.redirect(301, "/" + slug);
    res.send(render.renderPage(site, page, req));
  })
);

app.use((err, req, res, next) => {
  const status = err.status && err.status < 600 ? err.status : 500;
  if (status >= 500 && status !== 503) console.error(err);
  if (req.path.startsWith("/admin/api") || req.path.startsWith("/api")) return res.status(status).json({ error: status === 500 ? "Server error" : err.message });
  res.status(status).send("Something went wrong");
});

module.exports = app;

// Running on your own computer or server: `npm start`
if (require.main === module) {
  app.listen(PORT, async () => {
    console.log(`Store running at http://localhost:${PORT}`);
    console.log(`Admin dashboard at http://localhost:${PORT}/admin`);
    console.log(`Data is stored in: ${db.storageKind === "files" ? db.DATA_DIR : db.storageKind}`);
    try {
      const { generated } = await auth.getAdmin();
      if (generated) console.log(`\nFirst run: admin password is  ${generated}\nChange it under Account in the dashboard.\n`);
    } catch (e) {
      console.error("Could not set up the admin account:", e.message);
    }
  });
}
