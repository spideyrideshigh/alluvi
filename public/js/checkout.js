(function () {
  var S = window.STORE;
  var shippingId = S.shipping.length ? S.shipping[0].id : null;
  var code = null; // { code, percent } once validated by the server

  var $ = function (id) {
    return document.getElementById(id);
  };

  // Links like /checkout?add=reta-40&qty=2 add to the cart first
  var params = new URLSearchParams(window.location.search);
  if (params.get("add") && S.findVariant(params.get("add"))) {
    S.cart.add(params.get("add"), S.clampQty(params.get("qty") || 1));
    history.replaceState(null, "", "/checkout");
  }

  function totals() {
    var t = S.cart.totals();
    var codeDiscount = code ? S.round(((t.subtotal - t.discount) * code.percent) / 100) : 0;
    var ship = S.shipping.filter(function (s) {
      return s.id === shippingId;
    })[0] || { price: 0 };
    t.codeDiscount = codeDiscount;
    t.shipping = ship.price;
    t.grand = S.round(t.total - codeDiscount + ship.price);
    return t;
  }

  function render() {
    var t = totals();
    var empty = !t.lines.length && $("done").hidden;
    $("coEmpty").hidden = !empty;
    $("checkoutForm").hidden = empty || !$("done").hidden;
    document.querySelector(".co__aside").hidden = empty;

    var list = $("lineItems");
    list.replaceChildren();
    t.lines.forEach(function (l) {
      var row = document.createElement("div");
      row.className = "line-item";
      var imgWrap = document.createElement("div");
      imgWrap.className = "line-item__img";
      var img = document.createElement("img");
      img.src = l.variant.image || l.product.image;
      img.alt = "";
      var count = document.createElement("span");
      count.className = "line-item__count";
      count.textContent = l.qty;
      imgWrap.append(img, count);

      var info = document.createElement("div");
      var name = document.createElement("div");
      name.className = "line-item__name";
      name.textContent = l.product.name;
      var meta = document.createElement("div");
      meta.className = "line-item__meta";
      meta.textContent = l.variant.name + " · " + S.money(l.variant.price) + " each";
      var actions = document.createElement("div");
      actions.className = "line-item__actions";
      var remove = document.createElement("button");
      remove.type = "button";
      remove.className = "line-item__remove";
      remove.textContent = "Remove";
      remove.addEventListener("click", function () {
        S.cart.set(l.variant.id, 0);
      });
      actions.append(S.stepper(l.variant.id, l.qty), remove);
      info.append(name, meta, actions);

      var price = document.createElement("div");
      price.className = "line-item__price";
      price.textContent = S.money(l.lineTotal);
      row.append(imgWrap, info, price);
      list.append(row);
    });

    $("tQty").textContent = t.qty + (t.qty === 1 ? " pen" : " pens");
    $("tSubtotal").textContent = S.money(t.subtotal);
    $("rowVolume").hidden = !t.discount;
    $("tVolumeLabel").textContent = "Volume discount (" + t.percent + "%)";
    $("tVolume").textContent = "−" + S.money(t.discount);
    $("rowCode").hidden = !t.codeDiscount;
    if (code) $("tCodeLabel").textContent = "Discount (" + code.code + ")";
    $("tCode").textContent = "−" + S.money(t.codeDiscount);
    $("tShipping").textContent = t.shipping ? S.money(t.shipping) : "Free";
    document.querySelectorAll("[data-grand-total]").forEach(function (el) {
      el.textContent = S.money(t.grand);
    });
  }

  document.addEventListener("cart:change", render);

  document.querySelectorAll('input[name="shipping"]').forEach(function (r) {
    r.addEventListener("change", function () {
      shippingId = r.value;
      render();
    });
  });

  // Mobile summary toggle
  $("summaryToggle").addEventListener("click", function () {
    var open = $("summaryBody").classList.toggle("is-open");
    this.setAttribute("aria-expanded", String(open));
    $("summaryToggleText").textContent = open ? "Hide order summary" : "Show order summary";
  });

  // Discount codes are checked on the server so they are never exposed in the page
  $("discountForm").addEventListener("submit", function (e) {
    e.preventDefault();
    var entered = $("discountCode").value.trim();
    var msg = $("discountMsg");
    if (!entered) return;
    fetch("/api/discount", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: entered }) })
      .then(function (r) {
        return r.json();
      })
      .then(function (res) {
        if (res.valid) {
          code = { code: res.code, percent: res.percent };
          msg.textContent = "Code applied: " + res.percent + "% off";
          msg.className = "discount-msg is-ok";
        } else {
          code = null;
          msg.textContent = "Enter a valid discount code";
          msg.className = "discount-msg is-error";
        }
        render();
      });
  });

  // Validation
  var form = $("checkoutForm");
  var postcodeRe = /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i;
  var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function validate() {
    var ok = true;
    form.querySelectorAll(".input[required]").forEach(function (input) {
      var v = input.value.trim();
      var bad = !v || (input.type === "email" && !emailRe.test(v)) || (input.name === "postcode" && !postcodeRe.test(v));
      input.classList.toggle("is-invalid", bad);
      if (bad) ok = false;
    });
    form.querySelectorAll("[data-agreement]").forEach(function (label) {
      var bad = !label.querySelector("input").checked;
      label.classList.toggle("is-invalid", bad);
      if (bad) ok = false;
    });
    return ok;
  }

  form.addEventListener("input", function (e) {
    e.target.classList.remove("is-invalid");
  });
  form.addEventListener("change", function (e) {
    if (e.target.type === "checkbox") e.target.closest("label").classList.remove("is-invalid");
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var err = $("formError");
    err.hidden = true;

    if (!validate()) {
      err.textContent = "Please complete the highlighted fields.";
      err.hidden = false;
      var first = form.querySelector(".is-invalid");
      if (first) first.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    var data = Object.fromEntries(new FormData(form).entries());
    var btn = $("placeOrder");
    btn.disabled = true;
    btn.textContent = "Placing order…";

    fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: S.cart.items(), shippingId: shippingId, code: code ? code.code : null, customer: data, agreed: true }),
    })
      .then(function (r) {
        return r.json().then(function (body) {
          if (!r.ok) throw new Error(body.error || "Order failed");
          return body;
        });
      })
      .then(function (res) {
        $("done").hidden = false;
        form.hidden = true;
        document.querySelector(".breadcrumb").hidden = true;
        $("doneName").textContent = data.firstName;
        $("doneRef").textContent = "Order " + res.reference;
        $("doneMsg").textContent = S.successMessage.replace("{email}", data.email);
        S.cart.clear();
        document.querySelector(".co__aside").hidden = true;
        window.scrollTo({ top: 0, behavior: "smooth" });
      })
      .catch(function (error) {
        err.textContent = error.message + ". Please try again or email " + S.contactEmail + ".";
        err.hidden = false;
        btn.disabled = false;
        btn.textContent = "Place order";
      });
  });

  render();
})();
