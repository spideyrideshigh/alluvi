// Shared helpers and the cart. window.STORE is printed into each page by the server.
(function () {
  var S = window.STORE;
  var CART_KEY = "alluvi_cart";

  S.money = function (value) {
    return new Intl.NumberFormat(S.locale, { style: "currency", currency: S.currency }).format(value);
  };

  S.clampQty = function (value) {
    var n = parseInt(value, 10);
    if (isNaN(n) || n < 1) return 1;
    return Math.min(n, S.pricing.maxQty);
  };

  S.tierPercent = function (qty) {
    var percent = 0;
    S.pricing.tiers.forEach(function (t) {
      if (qty >= t.min && t.percent > percent) percent = t.percent;
    });
    return percent;
  };

  S.round = function (n) {
    return Math.round(n * 100) / 100;
  };

  S.findVariant = function (id) {
    for (var i = 0; i < S.products.length; i++) {
      var p = S.products[i];
      for (var j = 0; j < p.variants.length; j++) {
        if (p.variants[j].id === id) return { product: p, variant: p.variants[j] };
      }
    }
    return null;
  };

  S.safeGet = function (key) {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      return null;
    }
  };

  S.safeSet = function (key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (e) {}
  };

  /* ---------- Cart ---------- */

  var memoryCart = [];

  function readCart() {
    var raw = S.safeGet(CART_KEY);
    var items;
    try {
      items = raw ? JSON.parse(raw) : memoryCart;
    } catch (e) {
      items = [];
    }
    // Drop anything that has since been removed or sold out
    return (Array.isArray(items) ? items : []).filter(function (i) {
      var f = S.findVariant(i.variantId);
      return f && f.variant.inStock && i.qty > 0;
    });
  }

  function writeCart(items) {
    memoryCart = items;
    S.safeSet(CART_KEY, JSON.stringify(items));
    document.dispatchEvent(new CustomEvent("cart:change"));
  }

  S.cart = {
    items: readCart,
    add: function (variantId, qty) {
      var items = readCart();
      var line = items.find(function (i) {
        return i.variantId === variantId;
      });
      if (line) line.qty = S.clampQty(line.qty + qty);
      else items.push({ variantId: variantId, qty: S.clampQty(qty) });
      writeCart(items);
    },
    set: function (variantId, qty) {
      writeCart(
        readCart()
          .map(function (i) {
            return i.variantId === variantId ? { variantId: i.variantId, qty: qty } : i;
          })
          .filter(function (i) {
            return i.qty > 0;
          })
          .map(function (i) {
            return { variantId: i.variantId, qty: S.clampQty(i.qty) };
          })
      );
    },
    clear: function () {
      writeCart([]);
    },
    totals: function () {
      var lines = readCart().map(function (i) {
        var f = S.findVariant(i.variantId);
        return { product: f.product, variant: f.variant, qty: i.qty, lineTotal: S.round(f.variant.price * i.qty) };
      });
      var qty = lines.reduce(function (s, l) { return s + l.qty; }, 0);
      var subtotal = S.round(lines.reduce(function (s, l) { return s + l.lineTotal; }, 0));
      var percent = S.tierPercent(qty);
      var discount = S.round((subtotal * percent) / 100);
      return { lines: lines, qty: qty, subtotal: subtotal, percent: percent, discount: discount, total: S.round(subtotal - discount) };
    },
  };

  /* ---------- Cart drawer ---------- */

  var drawer = document.getElementById("cartDrawer");
  var lastFocus = null;

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  function stepper(variantId, qty) {
    var wrap = el("div", "qty qty--sm");
    var minus = el("button", null, "−");
    var input = el("input");
    var plus = el("button", null, "+");
    minus.type = plus.type = "button";
    minus.setAttribute("aria-label", "Decrease quantity");
    plus.setAttribute("aria-label", "Increase quantity");
    input.type = "number";
    input.min = "1";
    input.max = String(S.pricing.maxQty);
    input.value = qty;
    input.setAttribute("aria-label", "Quantity");
    minus.addEventListener("click", function () {
      S.cart.set(variantId, qty - 1);
    });
    plus.addEventListener("click", function () {
      S.cart.set(variantId, qty + 1);
    });
    input.addEventListener("change", function () {
      S.cart.set(variantId, parseInt(input.value, 10) || 0);
    });
    wrap.append(minus, input, plus);
    return wrap;
  }
  S.stepper = stepper;

  function renderCart() {
    var t = S.cart.totals();
    document.querySelectorAll("[data-cart-count]").forEach(function (c) {
      c.textContent = t.qty;
      c.hidden = !t.qty;
    });
    if (!drawer) return;
    var q = function (sel) {
      return drawer.querySelector(sel);
    };
    var linesEl = q("[data-cart-lines]");
    linesEl.replaceChildren();
    t.lines.forEach(function (l) {
      var row = el("div", "cart-line");
      var img = el("img", "cart-line__img");
      img.src = l.variant.image || l.product.image;
      img.alt = "";
      var info = el("div", "cart-line__info");
      var name = el("a", "cart-line__name", l.product.name);
      name.href = l.product.url;
      var meta = el("div", "cart-line__meta", l.variant.name + " · " + S.money(l.variant.price));
      var actions = el("div", "cart-line__actions");
      var remove = el("button", "cart-line__remove", "Remove");
      remove.type = "button";
      remove.addEventListener("click", function () {
        S.cart.set(l.variant.id, 0);
      });
      actions.append(stepper(l.variant.id, l.qty), remove);
      info.append(name, meta, actions);
      row.append(img, info, el("div", "cart-line__total", S.money(l.lineTotal)));
      linesEl.append(row);
    });
    q("[data-cart-empty]").hidden = t.lines.length > 0;
    q("[data-cart-foot]").hidden = !t.lines.length;
    q("[data-cart-subtotal]").textContent = S.money(t.subtotal);
    q("[data-cart-discount-row]").hidden = !t.discount;
    q("[data-cart-discount-label]").textContent = "Volume discount (" + t.percent + "%)";
    q("[data-cart-discount]").textContent = "−" + S.money(t.discount);
    q("[data-cart-total]").textContent = S.money(t.total);
  }

  S.openCart = function () {
    if (!drawer) return;
    lastFocus = document.activeElement;
    renderCart();
    drawer.hidden = false;
    document.body.classList.add("is-locked");
    requestAnimationFrame(function () {
      drawer.classList.add("is-open");
      drawer.querySelector(".drawer__close").focus();
    });
  };

  S.closeCart = function () {
    if (!drawer || drawer.hidden) return;
    drawer.classList.remove("is-open");
    document.body.classList.remove("is-locked");
    setTimeout(function () {
      drawer.hidden = true;
    }, 250);
    if (lastFocus) lastFocus.focus();
  };

  document.addEventListener("cart:change", renderCart);
  document.addEventListener("click", function (e) {
    if (e.target.closest("[data-cart-open]")) S.openCart();
    if (e.target.closest("[data-cart-close]")) S.closeCart();
    var quick = e.target.closest("[data-quick-add]");
    if (quick) {
      S.cart.add(quick.getAttribute("data-quick-add"), 1);
      S.openCart();
    }
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") S.closeCart();
  });
  // Keep carts in sync across tabs
  window.addEventListener("storage", function (e) {
    if (e.key === CART_KEY) renderCart();
  });
  renderCart();

  /* ---------- Research-use gate ---------- */

  var gate = document.getElementById("gate");
  if (gate && S.safeGet("alluvi_ruo_ok") !== "1") {
    gate.hidden = false;
    document.body.classList.add("is-locked");
    document.getElementById("gateAccept").focus();
    document.getElementById("gateAccept").addEventListener("click", function () {
      S.safeSet("alluvi_ruo_ok", "1");
      gate.hidden = true;
      document.body.classList.remove("is-locked");
    });
  }

  /* ---------- Mobile menu ---------- */

  var menuToggle = document.getElementById("menuToggle");
  var nav = document.getElementById("siteNav");
  if (menuToggle && nav) {
    menuToggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      menuToggle.setAttribute("aria-expanded", String(open));
    });
    nav.addEventListener("click", function (e) {
      if (e.target.tagName === "A") {
        nav.classList.remove("is-open");
        menuToggle.setAttribute("aria-expanded", "false");
      }
    });
  }
})();
