(function () {
  var S = window.STORE;

  function text(root, selector, value) {
    root.querySelectorAll(selector).forEach(function (el) {
      el.textContent = value;
    });
  }

  // Gallery thumbnails
  document.querySelectorAll("[data-gallery]").forEach(function (g) {
    var main = g.querySelector(".product__main img");
    var thumbs = g.querySelectorAll(".product__thumbs button");
    thumbs.forEach(function (b) {
      b.addEventListener("click", function () {
        main.src = b.dataset.src;
        main.alt = b.dataset.alt;
        thumbs.forEach(function (t) {
          t.setAttribute("aria-current", t === b ? "true" : "false");
        });
      });
    });
  });

  // Buy forms: hero, product sections and product pages
  document.querySelectorAll("[data-buy-form]").forEach(function (form) {
    var qtyInput = form.querySelector("[data-qty]");
    var bundles = form.querySelectorAll("[data-bundle]");
    var image = form.dataset.imageTarget ? document.getElementById(form.dataset.imageTarget) : null;
    var bar = document.querySelector('.buybar[data-for="' + form.id + '"]');
    var qty = 1;

    function variantId() {
      var v = form.querySelector("select[data-variant]") || form.querySelector("[data-variant]:checked") || form.querySelector('input[type="hidden"][data-variant]');
      return v ? v.value : null;
    }

    function current() {
      return S.findVariant(variantId());
    }

    function update() {
      var found = current();
      if (!found) return;
      var v = found.variant;
      var percent = S.tierPercent(qty);
      var full = S.round(v.price * qty);
      var total = S.round(full * (1 - percent / 100));

      text(form, "[data-unit-price]", S.money(total / qty));
      text(form, "[data-was-price]", percent ? S.money(v.price) : v.compareAtPrice > v.price ? S.money(v.compareAtPrice) : "");
      var badge = form.querySelector("[data-save-badge]");
      if (badge) {
        badge.hidden = !percent;
        badge.textContent = "Save " + percent + "%";
      }
      text(form, "[data-total]", S.money(total));
      text(form, "[data-total-save]", percent ? "You save " + S.money(full - total) : "");

      // Next discount hint for the compact (hero) form
      var note = form.querySelector("[data-save-note]");
      if (note) {
        var next = S.pricing.tiers.filter(function (t) { return t.min > qty; })[0];
        note.textContent = percent ? "Includes " + percent + "% volume discount" + (next ? ". Add " + (next.min - qty) + " more to save " + next.percent + "%" : "") : next ? "Order " + next.min + "+ pens to save " + next.percent + "%" : "";
      }

      // Quantity cards follow the selected version's price
      form.querySelectorAll("[data-bundle-price]").forEach(function (el) {
        var n = parseInt(el.dataset.bundlePrice, 10);
        var p = S.tierPercent(n);
        var bFull = S.round(v.price * n);
        var bTotal = S.round(bFull * (1 - p / 100));
        el.innerHTML = "";
        el.append(S.money(bTotal));
        if (p) {
          var s = document.createElement("s");
          s.textContent = S.money(bFull);
          el.append(s);
        }
        var noteEl = form.querySelector('[data-bundle-note="' + n + '"]');
        if (noteEl) noteEl.textContent = p ? "Save " + p + "% · " + S.money(bTotal / n) + " each" : "Single pen";
      });
      bundles.forEach(function (r) {
        r.checked = parseInt(r.value, 10) === qty;
      });

      if (image && v.image) image.src = v.image;

      if (bar) {
        text(bar, "[data-buybar-variant]", v.name);
        text(bar, "[data-buybar-total]", (qty > 1 ? qty + " × · " : "") + S.money(total));
        var barQty = bar.querySelector("[data-bar-qty]");
        if (barQty) barQty.value = qty;
        var barImg = bar.querySelector("[data-buybar-img]");
        if (barImg && v.image) barImg.src = v.image;
      }
    }

    function setQty(value) {
      qty = S.clampQty(value);
      qtyInput.value = qty;
      update();
    }

    function add() {
      var id = variantId();
      if (!id) return;
      S.cart.add(id, qty);
    }

    form.querySelectorAll("[data-variant]").forEach(function (el) {
      el.addEventListener("change", update);
    });
    bundles.forEach(function (r) {
      r.addEventListener("change", function () {
        setQty(r.value);
      });
    });
    form.querySelectorAll("[data-step]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        setQty(qty + parseInt(btn.dataset.step, 10));
      });
    });
    qtyInput.addEventListener("change", function () {
      setQty(qtyInput.value);
    });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      add();
      S.openCart();
    });
    var buyNow = form.querySelector("[data-buy-now]");
    if (buyNow) {
      buyNow.addEventListener("click", function () {
        add();
        window.location.href = "/checkout";
      });
    }

    // Sticky bar mirrors this form
    if (bar) {
      bar.querySelectorAll("[data-bar-step]").forEach(function (btn) {
        btn.addEventListener("click", function () {
          setQty(qty + parseInt(btn.dataset.barStep, 10));
        });
      });
      var barQty = bar.querySelector("[data-bar-qty]");
      barQty.addEventListener("change", function () {
        setQty(barQty.value);
      });
      bar.querySelector("[data-bar-add]").addEventListener("click", function () {
        add();
        S.openCart();
      });

      var mainBtn = form.querySelector("[data-add]");
      if ("IntersectionObserver" in window && mainBtn) {
        new IntersectionObserver(function (entries) {
          var e = entries[0];
          var show = !e.isIntersecting && e.boundingClientRect.top < 0;
          bar.classList.toggle("is-visible", show);
          document.body.classList.toggle("has-buybar", show);
          bar.setAttribute("aria-hidden", String(!show));
          bar.querySelectorAll("button, input").forEach(function (el) {
            el.tabIndex = show ? 0 : -1;
          });
        }).observe(mainBtn);
      }
    }

    update();
  });
})();

// Contact and wholesale forms
(function () {
  var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  document.querySelectorAll("[data-contact-form]").forEach(function (form) {
    var err = form.querySelector("[data-form-error]");
    var btn = form.querySelector('button[type="submit"]');
    var label = btn.textContent;

    form.addEventListener("input", function (e) {
      e.target.classList.remove("is-invalid");
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      err.hidden = true;
      var ok = true;
      form.querySelectorAll("[required]").forEach(function (el) {
        var v = el.value.trim();
        var bad = !v || (el.type === "email" && !emailRe.test(v));
        el.classList.toggle("is-invalid", bad);
        if (bad) ok = false;
      });
      if (!ok) {
        err.textContent = "Please complete the highlighted fields.";
        err.hidden = false;
        form.querySelector(".is-invalid").focus();
        return;
      }

      var data = { type: form.dataset.type };
      new FormData(form).forEach(function (value, key) {
        if (data[key] !== undefined) data[key] = [].concat(data[key], value);
        else data[key] = value;
      });

      btn.disabled = true;
      btn.textContent = "Sending…";
      fetch("/api/forms", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) })
        .then(function (r) {
          return r.json().then(function (body) {
            if (!r.ok) throw new Error(body.error || "Could not send");
            return body;
          });
        })
        .then(function () {
          form.hidden = true;
          var done = form.parentElement.querySelector("[data-form-done]");
          done.hidden = false;
          done.scrollIntoView({ behavior: "smooth", block: "center" });
        })
        .catch(function (e) {
          err.textContent = e.message + ". Please try again or email us.";
          err.hidden = false;
          btn.disabled = false;
          btn.textContent = label;
        });
    });
  });
})();
