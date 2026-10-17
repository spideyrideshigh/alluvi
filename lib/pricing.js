// Shared pricing rules. The server always recalculates totals from these;
// the browser has its own copy (public/js/store.js) for display only.

function round(n) {
  return Math.round(n * 100) / 100;
}

function clampQty(value, maxQty) {
  const n = parseInt(value, 10);
  if (isNaN(n) || n < 1) return 1;
  return Math.min(n, maxQty);
}

// Volume discount percentage for a total number of pens
function tierPercent(pricing, qty) {
  let percent = 0;
  for (const t of pricing.tiers || []) {
    if (qty >= t.min && t.percent > percent) percent = t.percent;
  }
  return percent;
}

// Price of `qty` pens at `unitPrice` on their own (used for quantity cards)
function priceFor(pricing, unitPrice, qty) {
  const percent = tierPercent(pricing, qty);
  const full = round(unitPrice * qty);
  const discount = round((full * percent) / 100);
  return { full, percent, discount, total: round(full - discount) };
}

function findVariant(site, variantId) {
  for (const product of site.products) {
    const variant = product.variants.find((v) => v.id === variantId);
    if (variant) return { product, variant };
  }
  return null;
}

function cartTotals(site, { items, shippingId, code }) {
  const maxQty = site.pricing.maxQty;
  const merged = new Map();
  const errors = [];
  for (const item of Array.isArray(items) ? items.slice(0, 50) : []) {
    const found = findVariant(site, String(item.variantId || ""));
    if (!found || found.product.status !== "active") {
      errors.push("A product in your cart is no longer available");
      continue;
    }
    if (!found.variant.inStock) {
      errors.push(`${found.product.name} ${found.variant.name} is sold out`);
      continue;
    }
    const prev = merged.get(found.variant.id);
    merged.set(found.variant.id, { ...found, qty: clampQty((prev ? prev.qty : 0) + clampQty(item.qty, maxQty), maxQty) });
  }

  const lines = [...merged.values()].map(({ product, variant, qty }) => ({
    productId: product.id,
    productName: product.name,
    variantId: variant.id,
    variantName: variant.name,
    sku: variant.sku,
    unitPrice: variant.price,
    qty,
    lineTotal: round(variant.price * qty),
  }));

  const qty = lines.reduce((s, l) => s + l.qty, 0);
  const subtotal = round(lines.reduce((s, l) => s + l.lineTotal, 0));
  const volumePercent = tierPercent(site.pricing, qty);
  const volumeDiscount = round((subtotal * volumePercent) / 100);
  const dc = code ? site.discountCodes.find((d) => d.active && d.code.toUpperCase() === String(code).toUpperCase()) : null;
  const codeDiscount = dc ? round(((subtotal - volumeDiscount) * dc.percent) / 100) : 0;
  const ship = site.shipping.find((s) => s.id === shippingId) || site.shipping[0] || { id: "none", label: "Shipping", price: 0 };

  return {
    lines,
    errors,
    qty,
    subtotal,
    volumePercent,
    volumeDiscount,
    discountCode: dc ? dc.code : null,
    codeDiscount,
    shippingId: ship.id,
    shippingLabel: ship.label,
    shipping: ship.price,
    total: round(subtotal - volumeDiscount - codeDiscount + ship.price),
  };
}

module.exports = { clampQty, tierPercent, priceFor, findVariant, cartTotals };
