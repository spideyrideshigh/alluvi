(function () {
  "use strict";

  /* ================================================================ */
  /* Helpers                                                           */
  /* ================================================================ */

  var PROPS = ["value", "checked", "selected", "disabled", "hidden", "indeterminate"];

  function h(tag, attrs) {
    var el = document.createElement(tag);
    var props = {};
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        var v = attrs[k];
        if (v == null || v === false) return;
        if (k === "class") el.className = v;
        else if (k === "text") el.textContent = v;
        else if (k === "html") el.innerHTML = v; // only ever used with our own SVG strings
        else if (k.slice(0, 2) === "on") el.addEventListener(k.slice(2), v);
        else if (PROPS.indexOf(k) !== -1) props[k] = v;
        else el.setAttribute(k, v === true ? "" : v);
      });
    }
    var kids = Array.prototype.slice.call(arguments, 2);
    (function add(list) {
      list.forEach(function (kid) {
        if (kid == null || kid === false) return;
        if (Array.isArray(kid)) return add(kid);
        el.append(kid instanceof Node ? kid : String(kid));
      });
    })(kids);
    Object.keys(props).forEach(function (k) {
      el[k] = props[k];
    });
    return el;
  }

  var I = {
    home: '<path d="M3 11l9-7 9 7v9a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1z"/>',
    orders: '<path d="M6 2l-2 4v14a2 2 0 002 2h12a2 2 0 002-2V6l-2-4z"/><path d="M4 6h16M16 10a4 4 0 01-8 0"/>',
    pages: '<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h5"/>',
    product: '<path d="M21 8l-9-5-9 5v8l9 5 9-5z"/><path d="M3 8l9 5 9-5M12 13v8"/>',
    checkout: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>',
    nav: '<path d="M3 6h18M3 12h18M3 18h18"/>',
    seo: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z"/>',
    media: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>',
    account: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0116 0"/>',
    external: '<path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3"/>',
    logout: '<path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>',
    up: '<path d="M18 15l-6-6-6 6"/>',
    down: '<path d="M6 9l6 6 6-6"/>',
    copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>',
    trash: '<path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>',
    chevron: '<path d="M9 18l6-6-6-6"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    eye: '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>',
    eyeOff: '<path d="M17.9 17.9A10.1 10.1 0 0112 20c-7 0-11-8-11-8a18.5 18.5 0 015.1-5.9M9.9 4.2A9.1 9.1 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.2 3.2M1 1l22 22"/><path d="M14.1 14.1a3 3 0 01-4.2-4.2"/>',
    back: '<path d="M19 12H5M12 19l-7-7 7-7"/>',
    download: '<path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
    upload: '<path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/>',
    x: '<path d="M18 6L6 18M6 6l12 12"/>',
  };

  function icon(name, size) {
    var s = size || 18;
    return h("span", {
      html:
        '<svg width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
        (I[name] || S.icons[name] || "") +
        "</svg>",
      style: "display:inline-flex",
    });
  }

  function clone(o) {
    return JSON.parse(JSON.stringify(o));
  }

  function rid(prefix) {
    return prefix + "-" + Math.random().toString(36).slice(2, 9);
  }

  function money(v) {
    var s = S.draft ? S.draft.settings : { locale: "en-GB", currency: "GBP" };
    return new Intl.NumberFormat(s.locale, { style: "currency", currency: s.currency }).format(v || 0);
  }

  function fmtDate(iso, withTime) {
    if (!iso) return "";
    var d = new Date(iso);
    var opts = { day: "numeric", month: "short", year: "numeric" };
    if (withTime) {
      opts.hour = "2-digit";
      opts.minute = "2-digit";
    }
    return d.toLocaleString("en-GB", opts);
  }

  function slugify(v) {
    return String(v || "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9/-]+/g, "-")
      .replace(/\/+/g, "/")
      .replace(/-+/g, "-")
      .replace(/^[-/]+|[-/]+$/g, "");
  }

  function stripTags(s) {
    var d = document.createElement("div");
    d.innerHTML = s || "";
    return d.textContent || "";
  }

  var toastTimer;
  function toast(msg, isError) {
    var t = document.getElementById("toast");
    t.textContent = msg;
    t.className = "toast is-visible" + (isError ? " is-error" : "");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      t.className = "toast";
    }, isError ? 5000 : 2500);
  }

  function api(method, url, body) {
    return fetch(url, {
      method: method,
      headers: body ? { "Content-Type": "application/json" } : {},
      body: body ? JSON.stringify(body) : undefined,
      credentials: "same-origin",
    }).then(function (res) {
      return res
        .json()
        .catch(function () {
          return {};
        })
        .then(function (data) {
          if (res.status === 401 && url.indexOf("/login") === -1) {
            renderLogin();
            throw new Error("Please log in");
          }
          if (!res.ok) {
            var err = new Error(data.error || "Request failed");
            err.status = res.status;
            throw err;
          }
          return data;
        });
    });
  }

  function pageUrl(page) {
    return "/" + (page.slug || "");
  }

  /* ================================================================ */
  /* State                                                             */
  /* ================================================================ */

  var S = {
    site: null,
    draft: null,
    schema: null,
    icons: {},
    reserved: [],
    orders: [],
    messages: [],
    statuses: [],
    dirty: false,
    open: new WeakMap(),
  };

  var app = document.getElementById("app");
  var content, savebar, sideEl, ordersBadge, messagesBadge;

  /* ================================================================ */
  /* Boot & login                                                      */
  /* ================================================================ */

  function boot() {
    api("GET", "/admin/api/site")
      .then(function (data) {
        S.site = data.site;
        S.draft = clone(data.site);
        S.schema = data.schema;
        S.icons = data.icons;
        S.reserved = data.reservedSlugs;
        renderShell();
        route();
        loadOrders();
        loadMessages();
      })
      .catch(function () {});
  }

  function renderLogin() {
    var pw = h("input", { class: "input", type: "password", id: "pw", autocomplete: "current-password", required: true });
    var err = h("p", { class: "field__help", style: "color:var(--a-bad)", hidden: true });
    var btn = h("button", { class: "btn btn--primary", type: "submit", style: "width:100%;min-height:40px" }, "Log in");
    var form = h(
      "form",
      { class: "login__card" },
      h("h1", null, "Store admin"),
      h("p", null, "Log in to manage your website."),
      h("div", { class: "field" }, h("label", { for: "pw" }, "Password"), pw),
      err,
      btn
    );
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      btn.disabled = true;
      api("POST", "/admin/api/login", { password: pw.value })
        .then(boot)
        .catch(function (e) {
          err.textContent = e.message;
          err.hidden = false;
          btn.disabled = false;
          pw.select();
        });
    });
    app.replaceChildren(h("div", { class: "login" }, form));
    pw.focus();
  }

  /* ================================================================ */
  /* Shell, routing, saving                                            */
  /* ================================================================ */

  var NAV = [
    ["dashboard", "Home", "home"],
    ["orders", "Orders", "orders"],
    ["messages", "Messages", "mail"],
    ["products", "Products", "product"],
    ["pages", "Pages", "pages"],
    ["seo", "SEO", "seo"],
    ["media", "Media", "media"],
    ["settings", "Settings", "settings"],
  ];

  function renderShell() {
    ordersBadge = h("span", { class: "side__badge", hidden: true });
    messagesBadge = h("span", { class: "side__badge", hidden: true });
    sideEl = h(
      "aside",
      { class: "side" },
      h("div", { class: "side__brand" }, h("span", null, "A"), S.draft.settings.storeName || "Store"),
      h(
        "nav",
        null,
        NAV.map(function (n) {
          return h("a", { href: "#/" + n[0], "data-view": n[0] }, icon(n[2]), n[1], n[0] === "orders" ? ordersBadge : n[0] === "messages" ? messagesBadge : null);
        })
      ),
      h(
        "div",
        { class: "side__foot" },
        h("a", { href: "/", target: "_blank", rel: "noopener" }, icon("external"), "View store"),
        h("a", { href: "#/account", "data-view": "account" }, icon("account"), "Account"),
        h(
          "a",
          {
            href: "#",
            onclick: function (e) {
              e.preventDefault();
              if (S.dirty && !confirm("You have unsaved changes. Log out anyway?")) return;
              api("POST", "/admin/api/logout").then(function () {
                S.dirty = false;
                renderLogin();
              });
            },
          },
          icon("logout"),
          "Log out"
        )
      )
    );
    sideEl.addEventListener("click", function (e) {
      if (e.target.closest("a")) sideEl.classList.remove("is-open");
    });

    savebar = h(
      "div",
      { class: "savebar", role: "region", "aria-label": "Unsaved changes" },
      h("span", { class: "savebar__msg" }, "Unsaved changes"),
      h(
        "div",
        { style: "display:flex;gap:8px" },
        h("button", { class: "btn btn--ghost", type: "button", onclick: discard }, "Discard"),
        h("button", { class: "btn btn--primary", type: "button", id: "saveBtn", onclick: save }, "Save")
      )
    );

    content = h("div", { class: "content" });
    var topbar = h(
      "div",
      { class: "topbar" },
      h(
        "button",
        {
          class: "btn btn--icon",
          type: "button",
          "aria-label": "Open menu",
          onclick: function () {
            sideEl.classList.toggle("is-open");
          },
        },
        icon("nav")
      ),
      S.draft.settings.storeName || "Store admin"
    );

    app.replaceChildren(h("div", { class: "shell" }, sideEl, h("main", { class: "main" }, topbar, content)), savebar);
  }

  function route() {
    if (!S.draft) return;
    var parts = (location.hash.replace(/^#\/?/, "") || "dashboard").split("/");
    var view = parts[0];
    var param = parts.slice(1).join("/");
    var navKey = { pricing: "products", "product-layout": "products" }[view] || view;
    sideEl.querySelectorAll("a[data-view]").forEach(function (a) {
      a.classList.toggle("is-active", a.dataset.view === navKey);
    });
    var fn = VIEWS[view] || VIEWS.dashboard;
    content.replaceChildren(linkOptions(), fn(param));
    window.scrollTo(0, 0);
  }

  function markDirty() {
    S.dirty = true;
    savebar.classList.add("is-visible");
  }

  function save() {
    var btn = document.getElementById("saveBtn");
    btn.disabled = true;
    btn.textContent = "Saving…";
    api("PUT", "/admin/api/site", S.draft)
      .then(function (data) {
        S.site = data.site;
        S.draft = clone(data.site);
        S.dirty = false;
        savebar.classList.remove("is-visible");
        toast("Saved. Changes are live on your website.");
        // New pages may have been given ids by the server
        if (/^#\/pages\/page-/.test(location.hash) && !S.draft.pages.some(function (p) { return "#/pages/" + p.id === location.hash; })) {
          location.hash = "#/pages";
        } else {
          route();
        }
      })
      .catch(function (e) {
        toast(e.message, true);
      })
      .finally(function () {
        btn.disabled = false;
        btn.textContent = "Save";
      });
  }

  function discard() {
    S.draft = clone(S.site);
    S.dirty = false;
    savebar.classList.remove("is-visible");
    route();
  }

  window.addEventListener("hashchange", route);
  window.addEventListener("beforeunload", function (e) {
    if (S.dirty) {
      e.preventDefault();
      e.returnValue = "";
    }
  });
  document.addEventListener("keydown", function (e) {
    if ((e.metaKey || e.ctrlKey) && e.key === "s" && S.dirty) {
      e.preventDefault();
      save();
    }
  });

  // Suggestions shown in every link field
  function linkOptions() {
    var opts = [];
    S.draft.pages.forEach(function (p) {
      opts.push([pageUrl(p), p.title]);
      p.blocks.forEach(function (b) {
        if (b.anchor) opts.push([(p.slug ? "/" + p.slug : "/") + "#" + b.anchor, p.title + " › " + (b.heading || b.anchor)]);
      });
    });
    S.draft.products.forEach(function (p) {
      opts.push(["/products/" + p.slug, p.name]);
    });
    opts.push(["/checkout", "Checkout"]);
    opts.push(["mailto:" + S.draft.settings.contactEmail, "Email us"]);
    return h(
      "datalist",
      { id: "link-options" },
      opts.map(function (o) {
        return h("option", { value: o[0] }, o[1]);
      })
    );
  }

  /* ================================================================ */
  /* Form builder                                                      */
  /* ================================================================ */

  function blankValue(field) {
    switch (field.type) {
      case "list":
        return [];
      case "group":
        return blankObject(field.fields);
      case "checkbox":
        return !!field.default;
      case "number":
        return field.default != null ? field.default : field.min != null ? field.min : 0;
      case "select":
        return field.default != null ? field.default : typeof field.options[0] === "string" ? field.options[0] : field.options[0].value;
      case "icon":
        return field.options[0];
      case "color":
        return field.default || "#000000";
      default:
        return field.default != null ? field.default : "";
    }
  }

  function blankObject(fields) {
    var o = {};
    fields.forEach(function (f) {
      if (f.type !== "heading") o[f.key] = blankValue(f);
    });
    return o;
  }

  function renderFields(fields, obj, onChange) {
    return fields.map(function (f) {
      return renderField(f, obj, onChange);
    });
  }

  function fieldWrap(field, control, extra) {
    return h(
      "div",
      { class: "field" },
      field.type !== "checkbox" ? h("label", { class: "field__label" }, field.label, extra || null) : null,
      control,
      field.help && field.type !== "checkbox" ? h("div", { class: "field__help" }, field.help) : null
    );
  }

  function counter(field, input) {
    if (!field.counter) return null;
    var el = h("span", { class: "field__count" });
    function update() {
      var n = input.value.length;
      var min = field.counter[0];
      var max = field.counter[1];
      el.textContent = n ? n + " / " + max : "Using default";
      el.className = "field__count" + (n > max ? " is-bad" : n && n < min ? " is-warn" : "");
    }
    input.addEventListener("input", update);
    update();
    return el;
  }

  function renderField(field, obj, onChange) {
    var key = field.key;
    var change = function () {
      markDirty();
      if (onChange) onChange(key);
    };

    switch (field.type) {
      case "heading":
        return h("div", { class: "form-heading" }, h("h2", null, field.label), field.help ? h("p", null, field.help) : null);

      case "text":
      case "url": {
        var input = h("input", {
          class: "input",
          type: "text",
          value: obj[key] == null ? "" : obj[key],
          list: field.type === "url" ? "link-options" : null,
          spellcheck: field.type === "url" ? "false" : null,
          oninput: function () {
            obj[key] = input.value;
            change();
          },
        });
        return fieldWrap(field, input, counter(field, input));
      }

      case "textarea": {
        var ta = h("textarea", {
          class: "textarea" + (field.code ? " textarea--code" : ""),
          rows: field.rows || 3,
          spellcheck: field.code ? "false" : null,
          value: obj[key] || "",
          oninput: function () {
            obj[key] = ta.value;
            change();
          },
        });
        return fieldWrap(field, ta, counter(field, ta));
      }

      case "html":
        return fieldWrap(field, richText(obj, key, change));

      case "number": {
        var num = h("input", {
          class: "input",
          type: "number",
          step: field.step || 1,
          min: field.min,
          max: field.max,
          value: obj[key] == null ? "" : obj[key],
          oninput: function () {
            obj[key] = num.value === "" ? 0 : Number(num.value);
            change();
          },
        });
        num.style.maxWidth = "200px";
        return fieldWrap(field, num);
      }

      case "checkbox": {
        var cb = h("input", {
          type: "checkbox",
          checked: !!obj[key],
          onchange: function () {
            obj[key] = cb.checked;
            change();
          },
        });
        return h(
          "div",
          { class: "field" },
          h("label", { class: "toggle" }, cb, h("span", { class: "toggle__ui" }), h("span", null, field.label)),
          field.help ? h("div", { class: "field__help", style: "margin-left:44px" }, field.help) : null
        );
      }

      case "select": {
        var sel = h(
          "select",
          {
            class: "select",
            onchange: function () {
              obj[key] = sel.value;
              change();
            },
          },
          field.options.map(function (o) {
            var v = typeof o === "string" ? o : o.value;
            var l = typeof o === "string" ? o : o.label;
            return h("option", { value: v, selected: obj[key] === v }, l);
          })
        );
        return fieldWrap(field, sel);
      }

      case "color": {
        var hex = h("input", { class: "input", type: "text", value: obj[key] || "", style: "max-width:120px", spellcheck: "false" });
        var picker = h("input", { type: "color", value: /^#[0-9a-f]{6}$/i.test(obj[key]) ? obj[key] : "#000000" });
        picker.addEventListener("input", function () {
          hex.value = obj[key] = picker.value;
          change();
        });
        hex.addEventListener("input", function () {
          if (/^#[0-9a-f]{6}$/i.test(hex.value)) picker.value = hex.value;
          obj[key] = hex.value;
          change();
        });
        return fieldWrap(field, h("div", { class: "color" }, picker, hex));
      }

      case "image":
      case "file":
        return fieldWrap(field, imageField(obj, key, change));

      case "product": {
        var psel = h(
          "select",
          {
            class: "select",
            onchange: function () {
              obj[key] = psel.value;
              change();
            },
          },
          field.allowAll ? h("option", { value: "all", selected: obj[key] === "all" }, "All products (choose in a dropdown)") : null,
          S.draft.products.map(function (p) {
            return h("option", { value: p.id, selected: obj[key] === p.id }, p.name + (p.status === "active" ? "" : " (draft)"));
          })
        );
        if (!field.allowAll && !obj[key] && S.draft.products[0]) obj[key] = S.draft.products[0].id;
        return fieldWrap(field, psel);
      }

      case "icon": {
        var wrap = h("div", { class: "icons" });
        var draw = function () {
          wrap.replaceChildren.apply(
            wrap,
            field.options.map(function (name) {
              return h(
                "button",
                {
                  type: "button",
                  title: name,
                  "aria-label": name,
                  "aria-pressed": String(obj[key] === name),
                  onclick: function () {
                    obj[key] = name;
                    change();
                    draw();
                  },
                },
                icon(name, 20)
              );
            })
          );
        };
        draw();
        return fieldWrap(field, wrap);
      }

      case "group": {
        if (!obj[key]) obj[key] = blankObject(field.fields);
        return h("fieldset", { class: "fieldset" }, h("legend", null, field.label), renderFields(field.fields, obj[key], onChange));
      }

      case "list": {
        if (!Array.isArray(obj[key])) obj[key] = [];
        return h(
          "div",
          { class: "field" },
          h("label", { class: "field__label" }, field.label),
          field.help ? h("div", { class: "field__help", style: "margin:-2px 0 8px" }, field.help) : null,
          renderList(field, obj[key], onChange)
        );
      }
    }
    return h("div");
  }

  var ITEM_LABELS = {
    tiers: function (i) {
      return i.min + "+ pens · " + i.percent + "% off";
    },
    discountCodes: function (i) {
      return (i.code || "New code") + " · " + i.percent + "% off" + (i.active ? "" : " (inactive)");
    },
    shipping: function (i) {
      return (i.label || "New method") + " · " + (i.price ? money(i.price) : "Free");
    },
    redirects: function (i) {
      return (i.from || "/old") + " → " + (i.to || "/new");
    },
    variants: function (i) {
      return (i.name || "Version") + " · " + money(i.price) + (i.inStock ? "" : " · sold out");
    },
    products: function (i) {
      var p = S.draft.products.find(function (x) { return x.id === i.productId; });
      return p ? p.name : "Choose a product";
    },
    bundles: function (i) {
      return (i.title || "Card") + " · qty " + i.qty;
    },
  };

  function itemTitle(field, item, i) {
    if (ITEM_LABELS[field.key]) return ITEM_LABELS[field.key](item);
    var v = field.itemLabel ? item[field.itemLabel] : "";
    v = stripTags(v).trim();
    return v || "Item " + (i + 1);
  }

  function itemControls(arr, i, rerender, opts) {
    var stop = function (fn) {
      return function (e) {
        e.stopPropagation();
        fn();
        markDirty();
        rerender();
      };
    };
    return [
      opts && opts.extra,
      h("button", { class: "btn btn--icon", type: "button", title: "Move up", "aria-label": "Move up", disabled: i === 0, onclick: stop(function () { arr.splice(i - 1, 0, arr.splice(i, 1)[0]); }) }, icon("up", 16)),
      h("button", { class: "btn btn--icon", type: "button", title: "Move down", "aria-label": "Move down", disabled: i === arr.length - 1, onclick: stop(function () { arr.splice(i + 1, 0, arr.splice(i, 1)[0]); }) }, icon("down", 16)),
      h(
        "button",
        {
          class: "btn btn--icon",
          type: "button",
          title: "Duplicate",
          "aria-label": "Duplicate",
          onclick: stop(function () {
            var copy = clone(arr[i]);
            if (copy.id) copy.id = rid("b");
            arr.splice(i + 1, 0, copy);
            S.open.set(copy, true);
          }),
        },
        icon("copy", 16)
      ),
      h(
        "button",
        {
          class: "btn btn--icon",
          type: "button",
          title: "Delete",
          "aria-label": "Delete",
          onclick: function (e) {
            e.stopPropagation();
            if (!confirm("Delete this item?")) return;
            arr.splice(i, 1);
            markDirty();
            rerender();
          },
        },
        icon("trash", 16)
      ),
    ];
  }

  function renderList(field, arr, onChange) {
    var wrap = h("div", { class: "list" });

    function rerender() {
      wrap.replaceChildren.apply(
        wrap,
        arr
          .map(function (item, i) {
            var title = h("span", { class: "item__title" }, itemTitle(field, item, i));
            var el = h("div", { class: "item" + (S.open.get(item) ? " is-open" : "") });
            var body = null;
            var openBody = function () {
              body = h(
                "div",
                { class: "item__body" },
                renderFields(field.fields, item, function (k) {
                  title.textContent = itemTitle(field, item, i);
                  if (onChange) onChange(k);
                })
              );
              el.append(body);
            };
            var head = h(
              "div",
              {
                class: "item__head",
                onclick: function () {
                  var open = !el.classList.contains("is-open");
                  el.classList.toggle("is-open", open);
                  S.open.set(item, open);
                  if (open && !body) openBody();
                  if (body) body.hidden = !open;
                },
              },
              h("span", { class: "item__chev" }, icon("chevron", 16)),
              title,
              itemControls(arr, i, function () {
                rerender();
                if (onChange) onChange(field.key);
              })
            );
            el.prepend(head);
            if (S.open.get(item)) openBody();
            return el;
          })
          .concat(
            h(
              "button",
              {
                class: "btn list__add",
                type: "button",
                onclick: function () {
                  var item = blankObject(field.fields);
                  if (field.key === "shipping") item.id = rid("ship");
                  if (field.key === "variants") item.id = rid("v");
                  arr.push(item);
                  S.open.set(item, true);
                  markDirty();
                  rerender();
                  if (onChange) onChange(field.key);
                },
              },
              icon("plus", 16),
              "Add"
            )
          )
      );
    }
    rerender();
    return wrap;
  }

  /* ---------- Rich text editor ---------- */

  function tidy(html) {
    return html
      .replace(/ style="[^"]*"/g, "")
      .replace(/<\/?span[^>]*>/g, "")
      .replace(/<b>/g, "<strong>")
      .replace(/<\/b>/g, "</strong>")
      .replace(/<i>/g, "<em>")
      .replace(/<\/i>/g, "</em>")
      .replace(/^<br>$/, "");
  }

  function richText(obj, key, change) {
    var area = h("div", { class: "rte__area", contenteditable: "true", role: "textbox", "aria-multiline": "true" });
    area.innerHTML = obj[key] || "";
    var source = h("textarea", { class: "textarea textarea--code", hidden: true, spellcheck: "false" });
    var range = null;

    var sync = function () {
      obj[key] = tidy(area.innerHTML);
      change();
    };
    var saveSel = function () {
      var s = window.getSelection();
      if (s.rangeCount && area.contains(s.anchorNode)) range = s.getRangeAt(0).cloneRange();
    };
    var restore = function () {
      area.focus();
      if (range) {
        var s = window.getSelection();
        s.removeAllRanges();
        s.addRange(range);
      }
    };
    var cmd = function (c, v) {
      restore();
      document.execCommand(c, false, v);
      sync();
      saveSel();
    };

    area.addEventListener("focus", function () {
      document.execCommand("defaultParagraphSeparator", false, "p");
      document.execCommand("styleWithCSS", false, false);
    });
    area.addEventListener("input", sync);
    ["keyup", "mouseup", "blur"].forEach(function (ev) {
      area.addEventListener(ev, saveSel);
    });
    area.addEventListener("paste", function (e) {
      e.preventDefault();
      document.execCommand("insertText", false, e.clipboardData.getData("text/plain"));
    });
    source.addEventListener("input", function () {
      obj[key] = source.value;
      change();
    });

    var btn = function (label, title, fn) {
      return h(
        "button",
        {
          type: "button",
          title: title,
          "aria-label": title,
          onmousedown: function (e) {
            e.preventDefault();
          },
          onclick: fn,
        },
        label
      );
    };
    var sep = function () {
      return h("span", { class: "rte__sep" });
    };
    var htmlBtn;
    var tools = [
      btn("B", "Bold", function () { cmd("bold"); }),
      btn(h("em", null, "I"), "Italic", function () { cmd("italic"); }),
      sep(),
      btn("H2", "Heading", function () { cmd("formatBlock", "<h2>"); }),
      btn("H3", "Subheading", function () { cmd("formatBlock", "<h3>"); }),
      btn("¶", "Paragraph", function () { cmd("formatBlock", "<p>"); }),
      sep(),
      btn("•", "Bullet list", function () { cmd("insertUnorderedList"); }),
      btn("1.", "Numbered list", function () { cmd("insertOrderedList"); }),
      btn("❝", "Quote", function () { cmd("formatBlock", "<blockquote>"); }),
      sep(),
      btn("Link", "Add link", function () {
        saveSel();
        var url = prompt("Link address, e.g. /contact or https://example.com");
        if (url) cmd("createLink", url);
      }),
      btn("Unlink", "Remove link", function () { cmd("unlink"); }),
      btn("Image", "Insert image", function () {
        saveSel();
        openMediaPicker(function (url) {
          cmd("insertImage", url);
        });
      }),
      btn("Clear", "Clear formatting", function () { cmd("removeFormat"); }),
      sep(),
      (htmlBtn = btn("</>", "Edit HTML", function () {
        var toSource = source.hidden;
        if (toSource) source.value = obj[key] || "";
        else area.innerHTML = obj[key] || "";
        source.hidden = !toSource;
        area.hidden = toSource;
        htmlBtn.setAttribute("aria-pressed", String(toSource));
        tools.forEach(function (t) {
          if (t !== htmlBtn && t.tagName === "BUTTON") t.disabled = toSource;
        });
      })),
    ];
    return h("div", { class: "rte" }, h("div", { class: "rte__bar" }, tools), area, source);
  }

  /* ---------- Image field & media picker ---------- */

  function imageField(obj, key, change) {
    var preview = h("div", { class: "imgfield__preview" });
    var url = h("input", { class: "input", type: "text", value: obj[key] || "", placeholder: "/uploads/… or https://…", spellcheck: "false" });
    var draw = function () {
      var isPdf = /\.pdf$/i.test(obj[key] || "");
      preview.style.backgroundImage = obj[key] && !isPdf ? 'url("' + String(obj[key]).replace(/["\\]/g, "") + '")' : "";
      preview.textContent = isPdf ? "PDF" : obj[key] ? "" : "No file";
    };
    url.addEventListener("input", function () {
      obj[key] = url.value;
      draw();
      change();
    });
    draw();
    return h(
      "div",
      { class: "imgfield" },
      preview,
      h(
        "div",
        { class: "imgfield__body" },
        h(
          "div",
          { class: "imgfield__btns" },
          h(
            "button",
            {
              class: "btn",
              type: "button",
              onclick: function () {
                openMediaPicker(function (u) {
                  obj[key] = url.value = u;
                  draw();
                  change();
                });
              },
            },
            icon("media", 16),
            obj[key] ? "Change image" : "Choose image"
          ),
          h(
            "button",
            {
              class: "btn btn--plain btn--danger",
              type: "button",
              onclick: function () {
                obj[key] = url.value = "";
                draw();
                change();
              },
            },
            "Remove"
          )
        ),
        url
      )
    );
  }

  function readFile(file) {
    return new Promise(function (resolve, reject) {
      var r = new FileReader();
      r.onload = function () {
        resolve(r.result);
      };
      r.onerror = reject;
      r.readAsDataURL(file);
    });
  }

  function uploadFiles(files) {
    var list = Array.prototype.filter.call(files, function (f) {
      return /^image\//.test(f.type) || f.type === "application/pdf";
    });
    if (!list.length) {
      toast("Please choose image files (JPG, PNG, WebP, GIF)", true);
      return Promise.resolve([]);
    }
    toast("Uploading " + list.length + " image" + (list.length > 1 ? "s" : "") + "…");
    var done = [];
    return list
      .reduce(function (p, file) {
        return p.then(function () {
          return readFile(file)
            .then(function (data) {
              return api("POST", "/admin/api/media", { name: file.name, data: data });
            })
            .then(function (res) {
              done.push(res);
            })
            .catch(function (e) {
              toast(file.name + ": " + e.message, true);
            });
        });
      }, Promise.resolve())
      .then(function () {
        if (done.length) toast("Uploaded " + done.length + " image" + (done.length > 1 ? "s" : ""));
        return done;
      });
  }

  function dropzone(onFiles) {
    var input = h("input", {
      type: "file",
      accept: "image/*,application/pdf",
      multiple: true,
      hidden: true,
      onchange: function () {
        onFiles(input.files);
        input.value = "";
      },
    });
    var dz = h(
      "div",
      { class: "dropzone" },
      input,
      h("p", { style: "margin:0 0 10px" }, "Drag images here, or"),
      h(
        "button",
        {
          class: "btn btn--primary",
          type: "button",
          onclick: function () {
            input.click();
          },
        },
        icon("upload", 16),
        "Upload images"
      ),
      h("div", { class: "field__help" }, "JPG, PNG, WebP, GIF, ICO or PDF (for test reports), up to 15 MB each. Use descriptive file names, e.g. retatrutide-pen-box.jpg, for better SEO.")
    );
    dz.addEventListener("dragover", function (e) {
      e.preventDefault();
      dz.classList.add("is-over");
    });
    dz.addEventListener("dragleave", function () {
      dz.classList.remove("is-over");
    });
    dz.addEventListener("drop", function (e) {
      e.preventDefault();
      dz.classList.remove("is-over");
      onFiles(e.dataTransfer.files);
    });
    return dz;
  }

  function modal(title, body, opts) {
    var box = h(
      "div",
      { class: "modal__box", style: opts && opts.width ? "max-width:" + opts.width + "px" : null },
      h(
        "div",
        { class: "modal__head" },
        h("h2", null, title),
        h("button", { class: "btn btn--icon", type: "button", "aria-label": "Close", onclick: function () { close(); } }, icon("x"))
      ),
      h("div", { class: "modal__body" }, body)
    );
    var el = h("div", {
      class: "modal",
      role: "dialog",
      "aria-modal": "true",
      onclick: function (e) {
        if (e.target === el) close();
      },
    }, box);
    var onKey = function (e) {
      if (e.key === "Escape") close();
    };
    function close() {
      el.remove();
      document.removeEventListener("keydown", onKey);
    }
    document.addEventListener("keydown", onKey);
    document.body.append(el);
    return close;
  }

  function openMediaPicker(onPick) {
    var grid = h("div", { class: "media-grid" });
    var close;
    var load = function () {
      return api("GET", "/admin/api/media").then(function (data) {
        if (!data.media.length) return grid.replaceChildren(h("p", { class: "empty" }, "No images yet. Upload one above."));
        grid.replaceChildren.apply(
          grid,
          data.media.map(function (m) {
            return h(
              "div",
              { class: "media" },
              h("button", {
                class: "media__img",
                type: "button",
                title: "Use " + m.name,
                style: /\.pdf$/i.test(m.name) ? null : 'background-image:url("' + m.url + '")',
                onclick: function () {
                  close();
                  onPick(m.url);
                },
              }),
              h("div", { class: "media__meta" }, h("span", { class: "media__name" }, m.name))
            );
          })
        );
      });
    };
    var dz = dropzone(function (files) {
      uploadFiles(files).then(function (up) {
        if (up.length === 1) {
          close();
          onPick(up[0].url);
        } else load();
      });
    });
    close = modal("Choose an image", [dz, grid]);
    load();
  }

  /* ================================================================ */
  /* Shared bits                                                       */
  /* ================================================================ */

  function card(title, body, opts) {
    opts = opts || {};
    return h(
      "section",
      { class: "card" },
      title || opts.actions
        ? h("div", { class: "card__head" }, h("div", null, title ? h("h2", null, title) : null, opts.sub ? h("p", null, opts.sub) : null), opts.actions || null)
        : null,
      body
    );
  }

  function pageHead(title, sub, actions, back) {
    return h(
      "div",
      null,
      back ? h("a", { class: "back", href: back[0] }, icon("back", 16), back[1]) : null,
      h("div", { class: "page-head" }, h("div", null, h("h1", null, title), sub ? h("p", null, sub) : null), actions ? h("div", { class: "page-head__actions" }, actions) : null)
    );
  }

  var STATUS_BADGE = { new: "info", "awaiting-payment": "warn", paid: "ok", shipped: "ok", completed: "", cancelled: "bad" };
  function statusBadge(s) {
    return h("span", { class: "badge" + (STATUS_BADGE[s] ? " badge--" + STATUS_BADGE[s] : "") }, String(s).replace(/-/g, " "));
  }

  function loadOrders() {
    return api("GET", "/admin/api/orders").then(function (data) {
      S.orders = data.orders;
      S.statuses = data.statuses;
      var pending = S.orders.filter(function (o) {
        return o.status === "new";
      }).length;
      ordersBadge.textContent = pending;
      ordersBadge.hidden = !pending;
      return data;
    });
  }

  /* ---------- SEO checks ---------- */

  function itemPath(item, kind) {
    return kind === "product" ? "/products/" + slugify(item.slug) : "/" + (item.slug || "");
  }

  function effectiveTitle(item, kind) {
    var t = (item.seo && item.seo.title) || (kind === "product" ? item.name : item.title);
    var tpl = S.draft.seo.titleTemplate || "";
    var raw = kind !== "product" && item.slug === "";
    return raw || tpl.indexOf("%s") === -1 ? t : tpl.replace("%s", t);
  }

  function effectiveDesc(item, kind) {
    return (item.seo && item.seo.description) || (kind === "product" ? item.shortDescription : "") || S.draft.seo.defaultDescription || "";
  }

  // Site-wide checks plus the problems found on each page and product
  function seoChecks() {
    var d = S.draft;
    var out = [];
    var add = function (level, text, link) {
      out.push({ level: level, text: text, link: link });
    };

    if (d.seo.noindexSite) add("bad", "The whole site is hidden from search engines (Hide the whole site is on).", "#/seo");
    if (!d.seo.siteUrl) add("warn", "Set your live website address so canonical links and the sitemap use your domain.", "#/seo");
    else add("ok", "Live website address is set.");
    if (!d.seo.googleVerification) add("info", "Verify your site in Google Search Console, then submit your sitemap.", "#/seo");
    else add("ok", "Google Search Console verification code added.");
    if (!d.seo.ogImage) add("warn", "Add a default social share image.", "#/seo");

    var titles = {};
    var collect = function (item, kind) {
      var live = kind === "page" ? item.status === "published" : item.status === "active";
      if (!live) return;
      var name = kind === "page" ? item.title : item.name;
      var link = (kind === "page" ? "#/pages/" : "#/products/") + item.id + "/seo";
      itemChecks(item, kind).forEach(function (c) {
        if (c.level === "bad" || c.level === "warn") add(c.level, '"' + name + '": ' + c.text, link);
      });
      var t = effectiveTitle(item, kind);
      (titles[t] = titles[t] || []).push(name);
    };
    d.pages.forEach(function (p) { collect(p, "page"); });
    d.products.forEach(function (p) { collect(p, "product"); });
    Object.keys(titles).forEach(function (t) {
      if (titles[t].length > 1) add("warn", "Duplicate SEO title on: " + titles[t].join(", "), "#/seo");
    });
    if (!out.some(function (c) { return c.level === "warn" || c.level === "bad"; })) add("ok", "All pages and products have good titles and descriptions.");
    return out;
  }

  function seoScore(checks) {
    var bad = checks.filter(function (c) { return c.level === "bad"; }).length;
    var warn = checks.filter(function (c) { return c.level === "warn"; }).length;
    return Math.max(0, 100 - bad * 15 - warn * 5);
  }

  function scoreRing(score) {
    var c = score >= 80 ? "var(--a-ok)" : score >= 50 ? "#c98a00" : "var(--a-bad)";
    return h("div", { class: "score__ring", style: "--p:" + score + ";--c:" + c }, h("span", null, String(score)));
  }

  function checkList(checks, limit) {
    var order = { bad: 0, warn: 1, info: 2, ok: 3 };
    var sorted = checks.slice().sort(function (a, b) {
      return order[a.level] - order[b.level];
    });
    if (limit) sorted = sorted.slice(0, limit);
    var label = { bad: "Fix", warn: "Improve", info: "Tip", ok: "Good" };
    var cls = { bad: "bad", warn: "warn", info: "info", ok: "ok" };
    return h(
      "ul",
      { class: "checks" },
      sorted.map(function (c) {
        return h("li", null, h("span", { class: "badge badge--" + cls[c.level] }, label[c.level]), h("span", null, c.text, c.link ? [" ", h("a", { href: c.link }, "Fix →")] : null));
      })
    );
  }

  function serpPreview(item, kind) {
    var base = (S.draft.seo.siteUrl || location.origin).replace(/\/$/, "");
    var url = h("div", { class: "serp__url" });
    var title = h("div", { class: "serp__title" });
    var desc = h("div", { class: "serp__desc" });
    var el = h("div", { class: "serp" }, url, title, desc);
    el.update = function () {
      var path = itemPath(item, kind).replace(/^\//, "");
      url.textContent = base.replace(/^https?:\/\//, "") + (path ? " › " + path.replace(/\//g, " › ") : "");
      title.textContent = effectiveTitle(item, kind);
      desc.textContent = effectiveDesc(item, kind);
    };
    el.update();
    return el;
  }

  /* ================================================================ */
  /* Views                                                             */
  /* ================================================================ */

  var VIEWS = {};

  /* ---------- Dashboard ---------- */

  VIEWS.dashboard = function () {
    var wrap = h("div");
    var statsEl = h("div", { class: "stats" });
    var recent = h("div");

    var drawOrders = function () {
      var o = S.orders;
      var today = new Date().toDateString();
      var revenue = o
        .filter(function (x) {
          return ["paid", "shipped", "completed"].indexOf(x.status) !== -1;
        })
        .reduce(function (s, x) {
          return s + x.totals.total;
        }, 0);
      var stat = function (label, value) {
        return h("div", { class: "card stat" }, h("span", null, label), h("strong", null, value));
      };
      statsEl.replaceChildren(
        stat("Orders today", o.filter(function (x) { return new Date(x.createdAt).toDateString() === today; }).length),
        stat("New orders to process", o.filter(function (x) { return x.status === "new"; }).length),
        stat("New messages", S.messages.filter(function (m) { return m.status === "new"; }).length),
        stat("Paid revenue", money(revenue))
      );
      recent.replaceChildren(ordersTable(o.slice(0, 6)));
    };
    drawOrders();
    loadOrders().then(drawOrders);

    var checks = seoChecks();
    var score = seoScore(checks);
    var home = S.draft.pages.find(function (p) { return p.id === "home"; });

    wrap.append(
      pageHead("Welcome back", "Here's what's happening with " + S.draft.settings.storeName + ".", [
        h("a", { class: "btn", href: "/", target: "_blank", rel: "noopener" }, icon("external", 16), "View store"),
      ]),
      !S.draft.seo.siteUrl
        ? h("div", { class: "notice notice--warn" }, h("p", null, "Before going live, set your website address under ", h("a", { href: "#/seo" }, "SEO"), " and change the contact email under ", h("a", { href: "#/settings" }, "Settings"), "."))
        : null,
      statsEl,
      h(
        "div",
        { class: "cols" },
        h("div", null, card("Recent orders", recent, { actions: h("a", { class: "btn btn--plain", href: "#/orders" }, "View all") })),
        h(
          "div",
          null,
          card(
            "SEO health",
            [h("div", { class: "score", style: "margin-bottom:14px" }, scoreRing(score), h("div", null, h("strong", null, score >= 80 ? "Looking good" : "Needs attention"), h("div", { class: "field__help" }, "Based on titles, descriptions, alt text and settings."))), checkList(checks, 4)],
            { actions: h("a", { class: "btn btn--plain", href: "#/seo" }, "Open SEO") }
          ),
          card(
            "Quick actions",
            h(
              "div",
              { style: "display:grid;gap:8px" },
              h("a", { class: "btn", href: "#/pages/" + home.id }, icon("pages", 16), "Edit home page content"),
              h("a", { class: "btn", href: "#/products" }, icon("product", 16), "Edit products & prices"),
              h("a", { class: "btn", href: "#/products/new" }, icon("plus", 16), "Add a product"),
              h("a", { class: "btn", href: "#/pages/new" }, icon("plus", 16), "Add a page"),
              h("a", { class: "btn", href: "#/media" }, icon("media", 16), "Upload images"),
              h("a", { class: "btn", href: "/sitemap.xml", target: "_blank", rel: "noopener" }, icon("external", 16), "View sitemap.xml")
            )
          )
        )
      )
    );
    return wrap;
  };

  /* ---------- Orders ---------- */

  function orderSummary(o) {
    return (o.items || [])
      .map(function (l) {
        return l.productName.replace(/^Alluvi /, "") + " " + l.variantName + " × " + l.qty;
      })
      .join(", ");
  }

  function ordersTable(list) {
    if (!list.length) return h("p", { class: "empty" }, "No orders yet. They'll appear here as soon as someone checks out.");
    return h(
      "div",
      { class: "table-wrap" },
      h(
        "table",
        { class: "table" },
        h("thead", null, h("tr", null, h("th", null, "Order"), h("th", null, "Date"), h("th", null, "Customer"), h("th", null, "Items"), h("th", { class: "num" }, "Total"), h("th", null, "Status"))),
        h(
          "tbody",
          null,
          list.map(function (o) {
            return h(
              "tr",
              {
                class: "is-link",
                onclick: function () {
                  location.hash = "#/orders/" + o.reference;
                },
              },
              h("td", null, h("a", { href: "#/orders/" + o.reference }, o.reference)),
              h("td", null, fmtDate(o.createdAt, true)),
              h("td", null, o.customer.firstName + " " + o.customer.lastName),
              h("td", null, h("div", { class: "clip" }, orderSummary(o))),
              h("td", { class: "num" }, money(o.totals.total)),
              h("td", null, statusBadge(o.status))
            );
          })
        )
      )
    );
  }

  VIEWS.orders = function (ref) {
    if (ref) return orderDetail(ref);
    var wrap = h("div");
    var tableEl = h("div");
    var filter = h("select", { class: "select", style: "max-width:200px" });
    var search = h("input", { class: "input", type: "search", placeholder: "Search name, email, postcode or order no.", style: "max-width:320px" });

    var draw = function () {
      var q = search.value.trim().toLowerCase();
      var list = S.orders.filter(function (o) {
        if (filter.value && o.status !== filter.value) return false;
        if (!q) return true;
        var c = o.customer;
        return [o.reference, c.email, c.firstName, c.lastName, c.postcode, c.phone].join(" ").toLowerCase().indexOf(q) !== -1;
      });
      tableEl.replaceChildren(ordersTable(list));
    };
    var fillFilter = function () {
      filter.replaceChildren(
        h("option", { value: "" }, "All statuses"),
        S.statuses.map(function (s) {
          return h("option", { value: s }, s.replace(/-/g, " "));
        })
      );
    };
    filter.addEventListener("change", draw);
    search.addEventListener("input", draw);
    fillFilter();
    draw();
    loadOrders().then(function () {
      var v = filter.value;
      fillFilter();
      filter.value = v;
      draw();
    });

    wrap.append(
      pageHead("Orders", "Every order placed through your checkout.", [h("a", { class: "btn", href: "/admin/api/orders.csv" }, icon("download", 16), "Export CSV")]),
      card(null, [h("div", { style: "display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px" }, search, filter), tableEl])
    );
    return wrap;
  };

  function orderDetail(ref) {
    var wrap = h("div");
    var draw = function () {
      var o = S.orders.find(function (x) {
        return x.reference === ref;
      });
      if (!o) {
        wrap.replaceChildren(pageHead("Order not found", null, null, ["#/orders", "Orders"]));
        return;
      }
      var c = o.customer;
      var t = o.totals;
      var status = h(
        "select",
        { class: "select" },
        S.statuses.map(function (s) {
          return h("option", { value: s, selected: s === o.status }, s.replace(/-/g, " "));
        })
      );
      var tracking = h("input", { class: "input", value: o.tracking || "", placeholder: "Royal Mail tracking number" });
      var notes = h("textarea", { class: "textarea", rows: 4, value: o.notes || "", placeholder: "Private notes, e.g. payment reference" });
      var saveBtn = h(
        "button",
        {
          class: "btn btn--primary",
          type: "button",
          onclick: function () {
            saveBtn.disabled = true;
            api("PATCH", "/admin/api/orders/" + encodeURIComponent(o.reference), { status: status.value, tracking: tracking.value, notes: notes.value })
              .then(function () {
                toast("Order updated");
                return loadOrders();
              })
              .then(draw)
              .catch(function (e) {
                toast(e.message, true);
                saveBtn.disabled = false;
              });
          },
        },
        "Save order"
      );
      var subject = encodeURIComponent("Your order " + o.reference);
      var row = function (label, value, cls) {
        return h("div", { style: "display:flex;justify-content:space-between;padding:4px 0", class: cls || null }, h("span", null, label), h("span", null, value));
      };

      wrap.replaceChildren(
        pageHead(
          "Order " + o.reference,
          fmtDate(o.createdAt, true),
          [
            statusBadge(o.status),
            h(
              "button",
              {
                class: "btn btn--danger",
                type: "button",
                onclick: function () {
                  if (!confirm("Delete order " + o.reference + " permanently?")) return;
                  api("DELETE", "/admin/api/orders/" + encodeURIComponent(o.reference)).then(function () {
                    toast("Order deleted");
                    loadOrders().then(function () {
                      location.hash = "#/orders";
                    });
                  });
                },
              },
              icon("trash", 16),
              "Delete"
            ),
          ],
          ["#/orders", "Orders"]
        ),
        h(
          "div",
          { class: "cols" },
          h(
            "div",
            null,
            card("Items", [
              (o.items || []).map(function (l) {
                return h(
                  "div",
                  { style: "display:flex;justify-content:space-between;gap:12px;margin-bottom:10px" },
                  h("div", null, h("strong", null, l.productName + " · " + l.variantName), h("div", { class: "field__help", style: "margin:0" }, (l.sku ? l.sku + " · " : "") + money(l.unitPrice) + " × " + l.qty)),
                  h("span", null, money(l.lineTotal))
                );
              }),
              h("div", { style: "border-top:1px solid var(--a-line);padding-top:10px" }, [
                row("Subtotal (" + t.qty + " pens)", money(t.subtotal)),
                t.volumeDiscount ? row("Volume discount (" + t.volumePercent + "%)", "−" + money(t.volumeDiscount)) : null,
                t.codeDiscount ? row("Code " + t.discountCode, "−" + money(t.codeDiscount)) : null,
                row(t.shippingLabel, t.shipping ? money(t.shipping) : "Free"),
                h("div", { style: "display:flex;justify-content:space-between;padding:8px 0 0;font-weight:700;font-size:16px" }, h("span", null, "Total"), h("span", null, money(t.total))),
              ]),
            ]),
            card("Manage", [
              h("div", { class: "field" }, h("label", { class: "field__label" }, "Status"), status),
              h("div", { class: "field" }, h("label", { class: "field__label" }, "Tracking number"), tracking),
              h("div", { class: "field" }, h("label", { class: "field__label" }, "Notes"), notes),
              saveBtn,
            ])
          ),
          h(
            "div",
            null,
            card("Customer", [
              h(
                "dl",
                { class: "kv" },
                h("dt", null, "Name"),
                h("dd", null, c.firstName + " " + c.lastName),
                h("dt", null, "Email"),
                h("dd", null, h("a", { href: "mailto:" + c.email + "?subject=" + subject }, c.email)),
                h("dt", null, "Phone"),
                h("dd", null, h("a", { href: "tel:" + c.phone }, c.phone))
              ),
            ]),
            card("Delivery address", h("div", { class: "address" }, [c.company, c.address1, c.address2, c.city, c.postcode, c.country].filter(Boolean).join("\n")))
          )
        )
      );
    };
    if (S.orders.length) draw();
    loadOrders().then(draw);
    return wrap;
  }

  /* ---------- Pages ---------- */

  var PAGE_TEMPLATES = {
    text: {
      label: "Text page",
      description: "Heading and text, e.g. About us or a policy",
      blocks: function (title) {
        return [{ type: "richtext", heading: title, html: "<p>Start writing here…</p>", width: "narrow" }];
      },
    },
    landing: {
      label: "Landing page",
      description: "Hero, product buy box, features and FAQ",
      blocks: function (title) {
        return [
          { type: "hero", heading: title, text: "Short introduction for this page.", image: ((S.draft.products[0] || {}).images || [])[0] ? S.draft.products[0].images[0].src : "", imageAlt: "", showBuy: true, buyProduct: "all", buyLabel: "Add to cart" },
          { type: "product", anchor: "product", background: "white" },
          { type: "productGrid", heading: "More Alluvi pens", products: [] },
          { type: "features", heading: "Why order from us" },
          { type: "faq", heading: "Questions", anchor: "faq" },
        ];
      },
    },
    faq: {
      label: "FAQ page",
      description: "A page of questions and answers",
      blocks: function (title) {
        return [{ type: "faq", heading: title, items: [{ question: "Your question?", answer: "<p>Your answer.</p>" }] }];
      },
    },
    blank: {
      label: "Blank",
      description: "Start empty and add sections yourself",
      blocks: function () {
        return [];
      },
    },
  };

  function newBlock(type, values) {
    var def = S.schema.blockTypes[type];
    var b = Object.assign({ id: rid("b"), type: type }, blankObject(S.schema.blockCommon), blankObject(def.fields), values || {});
    if (type === "product" && !b.productId && S.draft.products[0]) {
      b.productId = S.draft.products[0].id;
      b.anchor = b.anchor || "product";
    }
    b.enabled = true;
    return b;
  }

  function addPageDialog() {
    var title = h("input", { class: "input", placeholder: "e.g. About us" });
    var tpl = "text";
    var tplButtons = h("div", { class: "block-types" });
    var drawTpl = function () {
      tplButtons.replaceChildren.apply(
        tplButtons,
        Object.keys(PAGE_TEMPLATES).map(function (k) {
          var t = PAGE_TEMPLATES[k];
          return h(
            "button",
            {
              type: "button",
              style: tpl === k ? "border-color:var(--a-accent);background:var(--a-accent-soft)" : null,
              onclick: function () {
                tpl = k;
                drawTpl();
              },
            },
            h("strong", null, t.label),
            h("span", null, t.description)
          );
        })
      );
    };
    drawTpl();
    var close;
    var create = h(
      "button",
      {
        class: "btn btn--primary",
        type: "button",
        onclick: function () {
          var name = title.value.trim();
          if (!name) return title.focus();
          var slug = slugify(name);
          var existing = S.draft.pages.map(function (p) { return p.slug; });
          var n = 2;
          var base = slug;
          while (existing.indexOf(slug) !== -1 || S.reserved.indexOf(slug) !== -1) slug = base + "-" + n++;
          var page = {
            id: rid("page"),
            title: name,
            slug: slug,
            status: "published",
            showInSitemap: true,
            priority: 0.5,
            changefreq: "monthly",
            seo: { title: "", description: "", ogImage: "", canonical: "", noindex: false },
            blocks: PAGE_TEMPLATES[tpl].blocks(name).map(function (b) {
              return newBlock(b.type, b);
            }),
          };
          S.draft.pages.push(page);
          markDirty();
          close();
          location.hash = "#/pages/" + page.id;
        },
      },
      "Create page"
    );
    close = modal("Add a page", [h("div", { class: "field" }, h("label", { class: "field__label" }, "Page title"), title), h("div", { class: "field" }, h("label", { class: "field__label" }, "Start from"), tplButtons), create], { width: 640 });
    title.focus();
  }

  VIEWS.pages = function (id) {
    if (id === "new") {
      setTimeout(function () {
        history.replaceState(null, "", "#/pages");
        addPageDialog();
      });
      id = "";
    }
    if (id) return pageEditor(id.split("/")[0], id.split("/")[1]);
    var wrap = h("div");
    var rows = S.draft.pages.map(function (p) {
      var ok = !itemChecks(p, "page").some(function (c) { return c.level === "bad" || c.level === "warn"; });
      return h(
        "tr",
        {
          class: "is-link",
          onclick: function (e) {
            if (!e.target.closest("button, a")) location.hash = "#/pages/" + p.id;
          },
        },
        h("td", null, h("a", { href: "#/pages/" + p.id }, h("strong", null, p.title)), p.id === "home" ? h("span", { class: "badge", style: "margin-left:8px" }, "Home page") : null),
        h("td", null, h("code", null, pageUrl(p))),
        h("td", null, h("span", { class: "badge badge--" + (p.status === "published" ? "ok" : "warn") }, p.status === "published" ? "Published" : "Draft")),
        h("td", null, h("span", { class: "badge badge--" + (ok ? "ok" : "warn") }, ok ? "Good" : "Needs work")),
        h("td", null, fmtDate(p.updatedAt)),
        h(
          "td",
          { class: "num" },
          h("a", { class: "btn btn--icon", href: pageUrl(p), target: "_blank", rel: "noopener", title: "View", "aria-label": "View page" }, icon("external", 16)),
          h(
            "button",
            {
              class: "btn btn--icon",
              type: "button",
              title: "Duplicate",
              "aria-label": "Duplicate page",
              onclick: function () {
                var copy = clone(p);
                copy.id = rid("page");
                copy.title = p.title + " (copy)";
                copy.slug = (p.slug || "home") + "-copy";
                copy.blocks.forEach(function (b) {
                  b.id = rid("b");
                });
                S.draft.pages.push(copy);
                markDirty();
                route();
              },
            },
            icon("copy", 16)
          ),
          p.id === "home"
            ? null
            : h(
                "button",
                {
                  class: "btn btn--icon",
                  type: "button",
                  title: "Delete",
                  "aria-label": "Delete page",
                  onclick: function () {
                    if (!confirm('Delete the page "' + p.title + '"? You can still discard before saving.')) return;
                    S.draft.pages = S.draft.pages.filter(function (x) {
                      return x !== p;
                    });
                    markDirty();
                    route();
                  },
                },
                icon("trash", 16)
              )
        )
      );
    });
    wrap.append(
      pageHead("Pages", "Edit your home page and other pages here. Each page is built from sections you can add, edit, hide and reorder, and has its own SEO tab.", [
        h("button", { class: "btn btn--primary", type: "button", onclick: addPageDialog }, icon("plus", 16), "Add page"),
      ]),
      card(
        null,
        h(
          "div",
          { class: "table-wrap" },
          h(
            "table",
            { class: "table" },
            h("thead", null, h("tr", null, h("th", null, "Title"), h("th", null, "URL"), h("th", null, "Status"), h("th", null, "SEO"), h("th", null, "Updated"), h("th", null, ""))),
            h("tbody", null, rows)
          )
        )
      )
    );
    return wrap;
  };

  function pageField(key) {
    return S.schema.pageFields.find(function (f) {
      return f.key === key;
    });
  }

  function tabBar(items, active) {
    return h(
      "nav",
      { class: "tabs", "aria-label": "Sections" },
      items.map(function (t) {
        return h("a", { href: t[0], class: t[0] === active ? "is-active" : null, "aria-current": t[0] === active ? "page" : null }, t[1]);
      })
    );
  }

  /* ---------- SEO panel shared by pages and products ---------- */

  var SITEMAP_KEYS = ["showInSitemap", "priority", "changefreq"];

  function itemImage(item, kind) {
    if (item.seo && item.seo.ogImage) return item.seo.ogImage;
    if (kind === "product") return (item.images[0] || {}).src || S.draft.seo.ogImage;
    var b = (item.blocks || []).find(function (x) { return x.enabled && x.image; });
    return (b && b.image) || S.draft.seo.ogImage;
  }

  function itemText(item, kind) {
    if (kind === "product") {
      return [item.name, item.subtitle, item.shortDescription]
        .concat((item.tabs || []).map(function (t) { return stripTags(t.html); }))
        .concat((item.facts || []).map(function (f) { return f.label + " " + f.value; }))
        .join(" ");
    }
    return (item.blocks || [])
      .filter(function (b) { return b.enabled; })
      .map(function (b) {
        return [b.heading, b.eyebrow, b.text, stripTags(b.html)].concat((b.items || []).map(function (i) { return i.title || i.question || ""; })).join(" ");
      })
      .join(" ");
  }

  function itemChecks(item, kind) {
    var out = [];
    var add = function (level, text) {
      out.push({ level: level, text: text });
    };
    var t = effectiveTitle(item, kind);
    var d = (item.seo && item.seo.description) || "";
    var kw = ((item.seo && item.seo.focusKeyword) || "").trim().toLowerCase();

    if (t.length > 60) add("warn", "SEO title is " + t.length + " characters. Google shows about 60.");
    else if (t.length < 30) add("warn", "SEO title is short (" + t.length + " characters). Aim for 30–60.");
    else add("ok", "SEO title length is good (" + t.length + " characters).");

    if (!d) add(kind === "product" ? "warn" : "bad", "No meta description of its own. Google will pick text from the page.");
    else if (d.length < 70 || d.length > 160) add("warn", "Meta description is " + d.length + " characters. Aim for 70–160.");
    else add("ok", "Meta description length is good (" + d.length + " characters).");

    if (item.seo && item.seo.noindex) add("bad", "This " + kind + " is hidden from search engines (noindex).");
    if (!item.showInSitemap) add("info", "Not included in sitemap.xml.");
    if (kind === "page" && item.status !== "published") add("info", "This page is a draft and not visible to visitors or Google.");
    if (kind === "product" && item.status !== "active") add("info", "This product is a draft and not visible to visitors or Google.");

    if (kind === "product") {
      var noAlt = item.images.filter(function (i) { return !i.alt; }).length;
      if (!item.images.length) add("bad", "Add at least one product photo.");
      else if (noAlt) add("warn", noAlt + " photo" + (noAlt > 1 ? "s have" : " has") + " no alt text.");
      else add("ok", "All photos have alt text.");
    } else {
      item.blocks.forEach(function (b) {
        if (b.enabled && b.image && !b.imageAlt) add("warn", "An image in the " + ((S.schema.blockTypes[b.type] || {}).label || b.type) + " section has no alt text.");
      });
      if (!item.blocks.some(function (b) { return b.enabled && (b.heading || b.type === "product"); })) add("warn", "No headings on this page (Google needs an H1).");
    }

    if (kw) {
      var url = itemPath(item, kind).toLowerCase();
      var body = itemText(item, kind).toLowerCase();
      var slugKw = slugify(kw);
      add(t.toLowerCase().indexOf(kw) !== -1 ? "ok" : "warn", "Focus keyword " + (t.toLowerCase().indexOf(kw) !== -1 ? "appears" : "does not appear") + " in the SEO title.");
      add(d.toLowerCase().indexOf(kw) !== -1 ? "ok" : "warn", "Focus keyword " + (d.toLowerCase().indexOf(kw) !== -1 ? "appears" : "does not appear") + " in the meta description.");
      add(url.indexOf(slugKw) !== -1 ? "ok" : "info", "Focus keyword " + (url.indexOf(slugKw) !== -1 ? "appears" : "does not appear") + " in the URL.");
      var count = body.split(kw).length - 1;
      add(count ? "ok" : "warn", count ? "Focus keyword appears " + count + " time" + (count > 1 ? "s" : "") + " in the content." : "Focus keyword does not appear in the content.");
    } else {
      add("info", "Set a focus keyword to check how well this " + kind + " targets it.");
    }
    return out;
  }

  function socialPreview(item, kind) {
    var img = h("div", { class: "social__img" });
    var domain = h("div", { class: "social__domain" });
    var title = h("div", { class: "social__title" });
    var desc = h("div", { class: "social__desc" });
    var el = h("div", { class: "social" }, img, h("div", { class: "social__body" }, domain, title, desc));
    el.update = function () {
      var src = itemImage(item, kind);
      img.style.backgroundImage = src ? 'url("' + String(src).replace(/["\\]/g, "") + '")' : "";
      domain.textContent = (S.draft.seo.siteUrl || location.origin).replace(/^https?:\/\//, "").toUpperCase();
      title.textContent = effectiveTitle(item, kind);
      desc.textContent = effectiveDesc(item, kind);
    };
    el.update();
    return el;
  }

  function seoPanel(item, kind, fields) {
    var serp = serpPreview(item, kind);
    var social = socialPreview(item, kind);
    var checksEl = h("div");
    var refresh = function () {
      serp.update();
      social.update();
      checksEl.replaceChildren(checkList(itemChecks(item, kind)));
    };
    var seoGroup = fields.find(function (f) { return f.key === "seo"; });
    var sitemap = fields.filter(function (f) { return SITEMAP_KEYS.indexOf(f.key) !== -1; });
    refresh();
    return h(
      "div",
      { class: "cols" },
      h(
        "div",
        null,
        card("Search engine listing", [h("div", { style: "margin-bottom:16px" }, serp), renderFields(seoGroup.fields, item.seo, refresh)], { sub: "How this " + kind + " appears in Google." }),
        card("Sitemap", renderFields(sitemap, item, refresh), { sub: "Settings for this URL in /sitemap.xml." })
      ),
      h("div", null, card("SEO checks", checksEl, { sub: "Updates as you type." }), card("Social share preview", social, { sub: "How links look on Facebook, WhatsApp, X and LinkedIn." }))
    );
  }

  /* ---------- Page editor ---------- */

  function pageEditor(id, tab) {
    var page = S.draft.pages.find(function (p) {
      return p.id === id;
    });
    if (!page) return pageHead("Page not found", null, null, ["#/pages", "Pages"]);
    var isHome = page.id === "home";
    var base = "#/pages/" + page.id;
    var active = tab === "seo" ? base + "/seo" : tab === "settings" ? base + "/settings" : base;
    var titleEl = h("h1", null, page.title);

    var head = h(
      "div",
      null,
      h("a", { class: "back", href: "#/pages" }, icon("back", 16), "Pages"),
      h(
        "div",
        { class: "page-head" },
        h("div", null, titleEl, h("p", null, isHome ? "Your home page · " : "", h("code", null, pageUrl(page)))),
        h("div", { class: "page-head__actions" }, h("a", { class: "btn", href: pageUrl(page), target: "_blank", rel: "noopener" }, icon("external", 16), "View page"))
      ),
      tabBar(
        [
          [base, "Content"],
          [base + "/seo", "SEO"],
          [base + "/settings", "Settings"],
        ],
        active
      )
    );

    if (tab === "seo") return h("div", null, head, seoPanel(page, "page", S.schema.pageFields));
    if (tab === "settings") return h("div", null, head, pageSettings(page, isHome, titleEl));
    return h("div", null, head, isHome ? h("div", { class: "notice" }, h("p", null, "This is your home page. Click a section to edit its text, images and buttons. Product details and prices are edited under ", h("a", { href: "#/products" }, "Products"), ".")) : null, card("Sections", blockEditor(page), { sub: "Click a section to edit it. Use the arrows to reorder and the eye to hide or show." }));
  }

  function pageSettings(page, isHome, titleEl) {
    var slugInput = h("input", {
      class: "input",
      value: page.slug,
      spellcheck: "false",
      oninput: function () {
        page.slug = slugInput.value;
        markDirty();
      },
      onblur: function () {
        slugInput.value = page.slug = slugify(slugInput.value);
      },
    });
    var footerSel = h(
      "select",
      { class: "select" },
      S.draft.navigation.footer.map(function (c, i) {
        return h("option", { value: i }, c.title);
      })
    );
    var addLink = function (list) {
      list.push({ label: page.title, url: pageUrl(page) });
      markDirty();
      toast('Added "' + page.title + '" to the menu. Save to publish.');
    };
    return h(
      "div",
      { class: "cols" },
      h(
        "div",
        null,
        card("Page", [
          renderField(pageField("title"), page, function () {
            titleEl.textContent = page.title || "Untitled";
          }),
          isHome
            ? h("div", { class: "field" }, h("label", { class: "field__label" }, "URL"), h("code", null, "/"), h("div", { class: "field__help" }, "The home page always lives at the root of your site."))
            : h(
                "div",
                { class: "field" },
                h("label", { class: "field__label" }, "URL"),
                h("div", { style: "display:flex;align-items:center;gap:4px" }, h("code", null, "/"), slugInput),
                h("div", { class: "field__help" }, "Lowercase letters, numbers and dashes. Changing a live URL? Add a redirect under SEO.")
              ),
          isHome ? null : renderField(pageField("status"), page),
        ])
      ),
      h(
        "div",
        null,
        card(
          "Menus",
          [
            h("button", { class: "btn", type: "button", style: "width:100%;margin-bottom:8px", onclick: function () { addLink(S.draft.navigation.header); } }, icon("plus", 16), "Add to header menu"),
            S.draft.navigation.footer.length
              ? h("div", { style: "display:flex;gap:8px" }, footerSel, h("button", { class: "btn", type: "button", onclick: function () { addLink(S.draft.navigation.footer[footerSel.value].links); } }, "Add to footer"))
              : null,
            h("div", { class: "field__help" }, h("a", { href: "#/settings/navigation" }, "Manage all menus →")),
          ],
          { sub: "Link to this page from your header or footer." }
        ),
        isHome
          ? null
          : h(
              "button",
              {
                class: "btn btn--danger",
                type: "button",
                style: "width:100%",
                onclick: function () {
                  if (!confirm('Delete "' + page.title + '"?')) return;
                  S.draft.pages = S.draft.pages.filter(function (p) {
                    return p !== page;
                  });
                  markDirty();
                  location.hash = "#/pages";
                },
              },
              icon("trash", 16),
              "Delete page"
            )
      )
    );
  }

  function blockEditor(page) {
    var blocksWrap = h("div", { class: "list" });
    var drawBlocks = function () {
      blocksWrap.replaceChildren.apply(
        blocksWrap,
        page.blocks
          .map(function (b, i) {
            var def = S.schema.blockTypes[b.type] || { label: b.type, fields: [] };
            var labelText = function () {
              if (b.type === "product") {
                var p = S.draft.products.find(function (x) { return x.id === b.productId; });
                return (p ? p.name : "") + (b.eyebrow ? " · " + b.eyebrow : "");
              }
              return b.heading || b.eyebrow || stripTags(b.html).slice(0, 60) || "";
            };
            var label = h("span", null, labelText());
            var el = h("div", { class: "item block" + (S.open.get(b) ? " is-open" : "") + (b.enabled ? "" : " is-off") });
            var body = null;
            var openBody = function () {
              var common = S.schema.blockCommon.filter(function (f) {
                return f.key !== "enabled";
              });
              body = h(
                "div",
                { class: "item__body" },
                def.description ? h("p", { class: "field__help", style: "margin:0 0 14px" }, def.description, b.type === "product" ? [" ", h("a", { href: "#/products/" + b.productId }, "Edit this product →")] : null) : null,
                renderFields(def.fields, b, function () {
                  label.textContent = labelText();
                }),
                h("details", { style: "margin-top:12px" }, h("summary", { style: "cursor:pointer;font-weight:550" }, "Section layout"), h("div", { style: "padding-top:12px" }, renderFields(common, b)))
              );
              el.append(body);
            };
            var vis = h(
              "button",
              {
                class: "btn btn--icon",
                type: "button",
                title: b.enabled ? "Hide section" : "Show section",
                "aria-label": b.enabled ? "Hide section" : "Show section",
                onclick: function (e) {
                  e.stopPropagation();
                  b.enabled = !b.enabled;
                  markDirty();
                  drawBlocks();
                },
              },
              icon(b.enabled ? "eye" : "eyeOff", 16)
            );
            el.prepend(
              h(
                "div",
                {
                  class: "item__head",
                  onclick: function () {
                    var open = !el.classList.contains("is-open");
                    el.classList.toggle("is-open", open);
                    S.open.set(b, open);
                    if (open && !body) openBody();
                    if (body) body.hidden = !open;
                  },
                },
                h("span", { class: "item__chev" }, icon("chevron", 16)),
                h("span", { class: "item__title" }, h("span", { class: "block__type" }, def.label), label, b.enabled ? null : h("small", null, "Hidden")),
                itemControls(page.blocks, i, drawBlocks, { extra: vis })
              )
            );
            if (S.open.get(b)) openBody();
            return el;
          })
          .concat(
            page.blocks.length ? [] : [h("p", { class: "empty" }, "This page has no sections yet.")],
            h(
              "button",
              {
                class: "btn list__add",
                type: "button",
                onclick: function () {
                  var close = modal(
                    "Add a section",
                    h(
                      "div",
                      { class: "block-types" },
                      Object.keys(S.schema.blockTypes).map(function (type) {
                        var def = S.schema.blockTypes[type];
                        return h(
                          "button",
                          {
                            type: "button",
                            onclick: function () {
                              var b = newBlock(type);
                              page.blocks.push(b);
                              S.open.set(b, true);
                              markDirty();
                              close();
                              drawBlocks();
                            },
                          },
                          h("strong", null, def.label),
                          h("span", null, def.description)
                        );
                      })
                    ),
                    { width: 760 }
                  );
                },
              },
              icon("plus", 16),
              "Add section"
            )
          )
      );
    };
    drawBlocks();
    return blocksWrap;
  }

  /* ---------- Products ---------- */

  function sectionFields(name) {
    return S.schema.sections[name];
  }

  function productTabs(active) {
    return tabBar(
      [
        ["#/products", "All products"],
        ["#/pricing", "Volume pricing"],
        ["#/product-layout", "Product page layout"],
      ],
      active
    );
  }

  function newProduct() {
    var n = 1;
    var slug = "new-product";
    var taken = S.draft.products.map(function (p) { return p.slug; });
    while (taken.indexOf(slug) !== -1) slug = "new-product-" + ++n;
    return {
      id: rid("prod"),
      name: "New product",
      slug: slug,
      status: "draft",
      category: "",
      subtitle: "",
      brand: "Alluvi",
      shortDescription: "",
      images: [],
      variants: [{ id: rid("v"), name: "Standard", price: 0, compareAtPrice: 0, sku: "", inStock: true, image: "" }],
      facts: [],
      highlights: [],
      tabs: [{ title: "Description", html: "<p>Describe the product here.</p>", open: true }],
      faq: [],
      testReportUrl: "",
      seo: { title: "", description: "", focusKeyword: "", ogImage: "", canonical: "", noindex: false },
      showInSitemap: true,
      priority: 0.9,
      changefreq: "weekly",
    };
  }

  function priceRange(p) {
    var prices = p.variants.map(function (v) { return v.price; });
    var min = Math.min.apply(null, prices);
    var max = Math.max.apply(null, prices);
    return min === max ? money(min) : money(min) + " – " + money(max);
  }

  VIEWS.products = function (param) {
    if (param === "new") {
      var p = newProduct();
      S.draft.products.push(p);
      markDirty();
      setTimeout(function () {
        location.replace("#/products/" + p.id);
      });
      return h("div");
    }
    if (param) {
      var parts = param.split("/");
      return productEditor(parts[0], parts[1]);
    }

    var rows = S.draft.products.map(function (p) {
      var stock = p.variants.filter(function (v) { return v.inStock; }).length;
      return h(
        "tr",
        {
          class: "is-link",
          onclick: function (e) {
            if (!e.target.closest("button, a")) location.hash = "#/products/" + p.id;
          },
        },
        h("td", null, h("div", { class: "thumb", style: p.images[0] ? 'background-image:url("' + String(p.images[0].src).replace(/["\\]/g, "") + '")' : null })),
        h("td", null, h("a", { href: "#/products/" + p.id }, h("strong", null, p.name)), h("div", { class: "field__help", style: "margin:0" }, p.category || "")),
        h("td", null, p.variants.map(function (v) { return v.name; }).join(", ")),
        h("td", null, priceRange(p)),
        h("td", null, h("span", { class: "badge badge--" + (stock === p.variants.length ? "ok" : stock ? "warn" : "bad") }, stock === p.variants.length ? "In stock" : stock ? stock + " of " + p.variants.length + " in stock" : "Sold out")),
        h("td", null, h("span", { class: "badge badge--" + (p.status === "active" ? "ok" : "warn") }, p.status === "active" ? "Active" : "Draft")),
        h(
          "td",
          { class: "num" },
          h("a", { class: "btn btn--icon", href: "/products/" + p.slug, target: "_blank", rel: "noopener", title: "View", "aria-label": "View product" }, icon("external", 16)),
          h(
            "button",
            {
              class: "btn btn--icon",
              type: "button",
              title: "Duplicate",
              "aria-label": "Duplicate product",
              onclick: function () {
                var copy = clone(p);
                copy.id = rid("prod");
                copy.name = p.name + " (copy)";
                copy.slug = p.slug + "-copy";
                copy.status = "draft";
                copy.variants.forEach(function (v) {
                  v.id = rid("v");
                });
                S.draft.products.push(copy);
                markDirty();
                route();
              },
            },
            icon("copy", 16)
          ),
          h(
            "button",
            {
              class: "btn btn--icon",
              type: "button",
              title: "Delete",
              "aria-label": "Delete product",
              onclick: function () {
                if (!confirm('Delete "' + p.name + '"? You can still discard before saving.')) return;
                S.draft.products = S.draft.products.filter(function (x) { return x !== p; });
                markDirty();
                route();
              },
            },
            icon("trash", 16)
          )
        )
      );
    });

    return h(
      "div",
      null,
      pageHead("Products", "Your Alluvi pens. Each product can have several versions (strengths or packs), each with its own price and stock.", [
        h("a", { class: "btn btn--primary", href: "#/products/new" }, icon("plus", 16), "Add product"),
      ]),
      productTabs("#/products"),
      card(
        null,
        S.draft.products.length
          ? h(
              "div",
              { class: "table-wrap" },
              h(
                "table",
                { class: "table" },
                h("thead", null, h("tr", null, h("th", { style: "width:64px" }, ""), h("th", null, "Product"), h("th", null, "Versions"), h("th", null, "Price"), h("th", null, "Stock"), h("th", null, "Status"), h("th", null, ""))),
                h("tbody", null, rows)
              )
            )
          : h("p", { class: "empty" }, "No products yet.")
      )
    );
  };

  function productEditor(id, tab) {
    var p = S.draft.products.find(function (x) { return x.id === id; });
    if (!p) return pageHead("Product not found", null, null, ["#/products", "Products"]);
    var base = "#/products/" + p.id;
    var active = tab === "content" ? base + "/content" : tab === "seo" ? base + "/seo" : base;
    var fields = S.schema.productFields;
    var byTab = function (t, keys) {
      return fields.filter(function (f) {
        return f.tab === t && (!keys || keys.indexOf(f.key) !== -1);
      });
    };
    var titleEl = h("h1", null, p.name);
    var urlEl = h("code", null, "/products/" + p.slug);
    var refresh = function () {
      titleEl.textContent = p.name || "Untitled";
      urlEl.textContent = "/products/" + slugify(p.slug);
    };

    var head = h(
      "div",
      null,
      h("a", { class: "back", href: "#/products" }, icon("back", 16), "Products"),
      h(
        "div",
        { class: "page-head" },
        h("div", null, titleEl, h("p", null, urlEl)),
        h(
          "div",
          { class: "page-head__actions" },
          h("span", { class: "badge badge--" + (p.status === "active" ? "ok" : "warn") }, p.status === "active" ? "Active" : "Draft"),
          h("a", { class: "btn", href: "/products/" + p.slug, target: "_blank", rel: "noopener" }, icon("external", 16), "View product")
        )
      ),
      tabBar(
        [
          [base, "Details & versions"],
          [base + "/content", "Page content"],
          [base + "/seo", "SEO"],
        ],
        active
      )
    );

    if (tab === "seo") return h("div", null, head, seoPanel(p, "product", fields));
    if (tab === "content") {
      return h(
        "div",
        null,
        head,
        h("div", { class: "notice" }, h("p", null, "These sections appear on this product's page. Layout and shared sections (badges, documentation cards, confidence check) are under ", h("a", { href: "#/product-layout" }, "Product page layout"), ".")),
        card("Key facts", renderFields(byTab("content", ["facts"]), p)),
        card("What you're ordering", renderFields(byTab("content", ["highlights"]), p)),
        card("Info tabs", renderFields(byTab("content", ["tabs"]), p)),
        card("FAQ", renderFields(byTab("content", ["faq"]), p)),
        card("Test report", renderFields(byTab("content", ["testReportUrl"]), p))
      );
    }

    return h(
      "div",
      null,
      head,
      h(
        "div",
        { class: "cols" },
        h(
          "div",
          null,
          card("Product", renderFields(byTab("details", ["name", "category", "subtitle", "brand", "shortDescription"]), p, refresh)),
          card("Versions", renderFields(byTab("details", ["variants"]), p), { sub: "Strengths or pack sizes customers can choose, e.g. 20mg and 40mg." }),
          card("Photos", renderFields(byTab("details", ["images"]), p))
        ),
        h(
          "div",
          null,
          card("Status & URL", renderFields(byTab("details", ["status", "slug"]), p, refresh)),
          card("Volume pricing", [
            h("p", { style: "margin-top:0" }, "Discounts apply to the total number of pens in the cart, across all products:"),
            h(
              "ul",
              { style: "margin:0 0 12px;padding-left:18px" },
              S.draft.pricing.tiers.map(function (t) {
                return h("li", null, t.min + "+ pens: " + t.percent + "% off");
              })
            ),
            h("a", { href: "#/pricing" }, "Edit volume pricing →"),
          ]),
          h(
            "button",
            {
              class: "btn btn--danger",
              type: "button",
              style: "width:100%",
              onclick: function () {
                if (!confirm('Delete "' + p.name + '"?')) return;
                S.draft.products = S.draft.products.filter(function (x) { return x !== p; });
                markDirty();
                location.hash = "#/products";
              },
            },
            icon("trash", 16),
            "Delete product"
          )
        )
      )
    );
  }

  VIEWS.pricing = function () {
    return h(
      "div",
      null,
      pageHead("Products", "Volume discounts and quick-pick quantity cards."),
      productTabs("#/pricing"),
      h("div", { class: "cols" }, card(null, renderFields(sectionFields("pricing").fields, S.draft.pricing)), card("Price preview", pricePreview(), { sub: "What customers pay at each total quantity, using your first product." }))
    );
  };

  VIEWS["product-layout"] = function () {
    return h(
      "div",
      null,
      pageHead("Products", "Settings shared by every product page: buttons, badges, extra sections and the sticky add-to-cart bar."),
      productTabs("#/product-layout"),
      card(null, renderFields(sectionFields("productPage").fields, S.draft.productPage))
    );
  };

  function pricePreview() {
    var el = h("div");
    var draw = function () {
      var first = S.draft.products[0];
      var unit = first && first.variants[0] ? first.variants[0].price : 0;
      var rows = [1, 2, 3, 5, 10].filter(function (q) {
        return q <= S.draft.pricing.maxQty;
      });
      el.replaceChildren(
        first ? h("p", { class: "field__help", style: "margin-top:0" }, first.name + " " + first.variants[0].name + " at " + money(unit)) : null,
        h(
          "table",
          { class: "table", style: "margin:0 -20px;width:calc(100% + 40px)" },
          h("thead", null, h("tr", null, h("th", null, "Pens"), h("th", null, "Discount"), h("th", { class: "num" }, "Each"), h("th", { class: "num" }, "Total"))),
          h(
            "tbody",
            null,
            rows.map(function (q) {
              var pct = 0;
              S.draft.pricing.tiers.forEach(function (t) {
                if (q >= t.min && t.percent > pct) pct = t.percent;
              });
              var total = unit * q * (1 - pct / 100);
              return h("tr", null, h("td", null, q), h("td", null, pct ? pct + "%" : "–"), h("td", { class: "num" }, money(total / q)), h("td", { class: "num" }, money(total)));
            })
          )
        )
      );
    };
    draw();
    document.addEventListener("input", function handler() {
      if (!el.isConnected) return document.removeEventListener("input", handler);
      draw();
    });
    return el;
  }

  /* ---------- Settings ---------- */

  VIEWS.settings = function (tab) {
    var tabs = tabBar(
      [
        ["#/settings", "General"],
        ["#/settings/navigation", "Navigation"],
        ["#/settings/checkout", "Checkout & shipping"],
        ["#/settings/forms", "Forms"],
        ["#/settings/announcements", "Announcement & pop-up"],
      ],
      tab ? "#/settings/" + tab : "#/settings"
    );
    var head = pageHead("Settings", "Store details, menus, checkout, shipping and site-wide messages.");
    var body;
    if (tab === "navigation") {
      body = card(null, renderFields(sectionFields("navigation").fields, S.draft.navigation), { sub: "Links in your header and footer. Start typing in a link field to pick one of your pages or products." });
    } else if (tab === "checkout") {
      body = [
        card("Shipping methods", renderField(Object.assign({}, sectionFields("shipping"), { label: "" }), S.draft, null), { sub: "Shown at checkout. The first one is selected by default." }),
        card("Discount codes", renderField(Object.assign({}, sectionFields("discountCodes"), { label: "" }), S.draft, null), { sub: "Customers enter these at checkout. Applied after volume discounts." }),
        card("Cart & checkout", renderFields(sectionFields("checkout").fields, S.draft.checkout)),
      ];
    } else if (tab === "forms") {
      body = [
        card("Form notifications", renderFields(sectionFields("forms").fields, S.draft.forms), {
          sub: "Contact and wholesale form submissions are saved under Messages. Add a webhook to also get them by email.",
        }),
        card(null, h("p", { style: "margin:0" }, "Form wording, topics and fields are edited in the Contact form section of each page: ", h("a", { href: "#/pages/contact" }, "Contact"), " and ", h("a", { href: "#/pages/wholesale" }, "Wholesale"), ".")),
      ];
    } else if (tab === "announcements") {
      body = [
        card("Announcement bar", renderFields(sectionFields("announcement").fields, S.draft.announcement), { sub: "The scrolling strip at the very top of every page." }),
        card("Research-use pop-up", renderFields(sectionFields("gate").fields, S.draft.gate), { sub: "Shown once to each new visitor before they can browse." }),
      ];
    } else {
      body = card(null, renderFields(sectionFields("settings").fields, S.draft.settings));
    }
    return h("div", null, head, tabs, body);
  };

  /* ---------- SEO ---------- */

  VIEWS.seo = function () {
    var checks = seoChecks();
    var score = seoScore(checks);
    var seoGroup = sectionFields("seo");
    var robotsPreview = h("pre", { class: "code-preview" });
    var drawRobots = function () {
      var base = (S.draft.seo.siteUrl || location.origin).replace(/\/$/, "");
      robotsPreview.textContent = S.draft.seo.noindexSite ? "User-agent: *\nDisallow: /" : (S.draft.seo.robotsTxt || "").trim() + (S.draft.seo.robotsAddSitemap ? "\n\nSitemap: " + base + "/sitemap.xml" : "");
    };
    drawRobots();

    var row = function (item, kind) {
      var checksList = itemChecks(item, kind);
      var bad = checksList.filter(function (c) { return c.level === "bad" || c.level === "warn"; }).length;
      var link = (kind === "page" ? "#/pages/" : "#/products/") + item.id + "/seo";
      return h(
        "tr",
        { class: "is-link", onclick: function () { location.hash = link; } },
        h("td", null, h("a", { href: link }, h("strong", null, kind === "page" ? item.title : item.name)), h("div", { class: "field__help", style: "margin:0" }, itemPath(item, kind))),
        h("td", null, h("span", { class: "badge" }, kind === "page" ? "Page" : "Product")),
        h("td", { style: "max-width:320px" }, h("div", { class: "clip" }, effectiveTitle(item, kind))),
        h("td", null, h("span", { class: "badge badge--" + (bad ? "warn" : "ok") }, bad ? bad + " to improve" : "Good"))
      );
    };

    return h(
      "div",
      null,
      pageHead("SEO", "Every page and product has its own SEO tab. This screen lists them all, plus site-wide settings, sitemap, robots.txt and redirects.", [
        h("a", { class: "btn", href: "/sitemap.xml", target: "_blank", rel: "noopener" }, icon("external", 16), "sitemap.xml"),
        h("a", { class: "btn", href: "/robots.txt", target: "_blank", rel: "noopener" }, icon("external", 16), "robots.txt"),
      ]),
      h(
        "div",
        { class: "cols" },
        h(
          "div",
          null,
          card(
            "Pages & products in Google",
            h(
              "div",
              { class: "table-wrap" },
              h(
                "table",
                { class: "table" },
                h("thead", null, h("tr", null, h("th", null, "Name"), h("th", null, "Type"), h("th", null, "SEO title"), h("th", null, "Status"))),
                h(
                  "tbody",
                  null,
                  S.draft.pages.map(function (p) { return row(p, "page"); }),
                  S.draft.products.map(function (p) { return row(p, "product"); })
                )
              )
            ),
            { sub: "Click a row to open its SEO tab." }
          ),
          card(null, renderFields(seoGroup.fields, S.draft.seo, drawRobots)),
          card("Redirects", renderField(Object.assign({}, sectionFields("redirects"), { label: "" }), S.draft, null), { sub: "Send visitors and Google from old URLs to new ones (e.g. after renaming a page)." })
        ),
        h(
          "div",
          null,
          card("SEO health", [h("div", { class: "score", style: "margin-bottom:14px" }, scoreRing(score), h("div", { class: "field__help" }, "Across all pages and products.")), checkList(checks)]),
          card("robots.txt preview", [robotsPreview, h("p", { class: "field__help" }, "Live at ", h("a", { href: "/robots.txt", target: "_blank" }, "/robots.txt"), " once saved.")]),
          card("Sitemap", [
            h("p", { style: "margin-top:0" }, "Your sitemap lists every published page and active product, and updates automatically."),
            h("p", null, h("a", { href: "/sitemap.xml", target: "_blank" }, "View sitemap.xml")),
            h("p", { class: "field__help", style: "margin-bottom:0" }, "Next step: add your site to ", h("a", { href: "https://search.google.com/search-console", target: "_blank", rel: "noopener" }, "Google Search Console"), ", paste the verification code here, then submit ", h("code", null, (S.draft.seo.siteUrl || "https://yourdomain") + "/sitemap.xml"), " under Sitemaps."),
          ])
        )
      )
    );
  };

  /* ---------- Messages ---------- */

  var MSG_BADGE = { new: "info", read: "", replied: "ok", archived: "" };
  var MSG_LABELS = { name: "Name", company: "Company", email: "Email", phone: "Phone", topic: "Topic", order: "Order number", quantity: "Pens per month", strengths: "Strengths", message: "Message" };

  function loadMessages() {
    return api("GET", "/admin/api/messages").then(function (data) {
      S.messages = data.messages;
      var n = S.messages.filter(function (m) { return m.status === "new"; }).length;
      messagesBadge.textContent = n;
      messagesBadge.hidden = !n;
      return data;
    });
  }

  VIEWS.messages = function (id) {
    if (id) return messageDetail(id);
    var wrap = h("div");
    var filter = h(
      "select",
      { class: "select", style: "max-width:200px" },
      h("option", { value: "" }, "All messages"),
      h("option", { value: "contact" }, "Contact"),
      h("option", { value: "wholesale" }, "Wholesale"),
      h("option", { value: "new" }, "New only")
    );
    var tableEl = h("div");
    var draw = function () {
      var list = S.messages.filter(function (m) {
        if (filter.value === "new") return m.status === "new";
        return !filter.value || m.type === filter.value;
      });
      if (!list.length) return tableEl.replaceChildren(h("p", { class: "empty" }, "No messages yet. Contact and wholesale enquiries will appear here."));
      tableEl.replaceChildren(
        h(
          "div",
          { class: "table-wrap" },
          h(
            "table",
            { class: "table" },
            h("thead", null, h("tr", null, h("th", null, "From"), h("th", null, "Type"), h("th", null, "Message"), h("th", null, "Received"), h("th", null, "Status"))),
            h(
              "tbody",
              null,
              list.map(function (m) {
                return h(
                  "tr",
                  { class: "is-link", style: m.status === "new" ? "font-weight:600" : null, onclick: function () { location.hash = "#/messages/" + m.id; } },
                  h("td", null, h("a", { href: "#/messages/" + m.id }, m.fields.name), h("div", { class: "field__help", style: "margin:0" }, m.fields.company || m.fields.email)),
                  h("td", null, h("span", { class: "badge" }, m.type === "wholesale" ? "Wholesale" : "Contact")),
                  h("td", null, h("div", { class: "clip" }, m.fields.topic ? m.fields.topic + ": " : m.fields.quantity ? m.fields.quantity + " pens/month: " : "", m.fields.message)),
                  h("td", null, fmtDate(m.createdAt, true)),
                  h("td", null, h("span", { class: "badge" + (MSG_BADGE[m.status] ? " badge--" + MSG_BADGE[m.status] : "") }, m.status))
                );
              })
            )
          )
        )
      );
    };
    filter.addEventListener("change", draw);
    draw();
    loadMessages().then(draw);
    wrap.append(pageHead("Messages", "Enquiries from your contact and wholesale forms."), card(null, [h("div", { style: "margin-bottom:14px" }, filter), tableEl]));
    return wrap;
  };

  function messageDetail(id) {
    var wrap = h("div");
    var draw = function () {
      var m = S.messages.find(function (x) { return x.id === id; });
      if (!m) return wrap.replaceChildren(pageHead("Message not found", null, null, ["#/messages", "Messages"]));
      if (m.status === "new") {
        m.status = "read";
        api("PATCH", "/admin/api/messages/" + m.id, { status: "read" }).then(loadMessages);
      }
      var status = h(
        "select",
        { class: "select" },
        ["new", "read", "replied", "archived"].map(function (st) {
          return h("option", { value: st, selected: st === m.status }, st);
        })
      );
      var notes = h("textarea", { class: "textarea", rows: 4, value: m.notes || "", placeholder: "Private notes" });
      var subject = encodeURIComponent("Re: your " + (m.type === "wholesale" ? "wholesale enquiry" : "message") + " to " + S.draft.settings.storeName);
      wrap.replaceChildren(
        pageHead(
          m.fields.name,
          (m.type === "wholesale" ? "Wholesale enquiry" : "Contact message") + " · " + fmtDate(m.createdAt, true),
          [
            h("a", { class: "btn btn--primary", href: "mailto:" + m.fields.email + "?subject=" + subject }, icon("mail", 16), "Reply by email"),
            h(
              "button",
              {
                class: "btn btn--danger",
                type: "button",
                onclick: function () {
                  if (!confirm("Delete this message?")) return;
                  api("DELETE", "/admin/api/messages/" + m.id).then(function () {
                    toast("Message deleted");
                    loadMessages().then(function () { location.hash = "#/messages"; });
                  });
                },
              },
              icon("trash", 16),
              "Delete"
            ),
          ],
          ["#/messages", "Messages"]
        ),
        h(
          "div",
          { class: "cols" },
          card(
            "Details",
            h(
              "dl",
              { class: "kv" },
              Object.keys(MSG_LABELS)
                .filter(function (k) { return m.fields[k]; })
                .map(function (k) {
                  var v = m.fields[k];
                  var val = k === "email" ? h("a", { href: "mailto:" + v }, v) : k === "phone" ? h("a", { href: "tel:" + v }, v) : h("span", { style: "white-space:pre-wrap" }, v);
                  return [h("dt", null, MSG_LABELS[k]), h("dd", null, val)];
                })
            )
          ),
          card("Manage", [
            h("div", { class: "field" }, h("label", { class: "field__label" }, "Status"), status),
            h("div", { class: "field" }, h("label", { class: "field__label" }, "Notes"), notes),
            h(
              "button",
              {
                class: "btn btn--primary",
                type: "button",
                onclick: function () {
                  api("PATCH", "/admin/api/messages/" + m.id, { status: status.value, notes: notes.value }).then(function () {
                    toast("Saved");
                    loadMessages();
                  });
                },
              },
              "Save"
            ),
          ])
        )
      );
    };
    if (S.messages.length) draw();
    loadMessages().then(draw);
    return wrap;
  }

  /* ---------- Media ---------- */

  VIEWS.media = function () {
    var grid = h("div", { class: "media-grid" });
    var load = function () {
      api("GET", "/admin/api/media").then(function (data) {
        if (!data.media.length) return grid.replaceChildren(h("p", { class: "empty" }, "No images uploaded yet."));
        grid.replaceChildren.apply(
          grid,
          data.media.map(function (m) {
            return h(
              "div",
              { class: "media" },
              h("a", { class: "media__img", href: m.url, target: "_blank", rel: "noopener", title: "Open " + m.name, style: /\.pdf$/i.test(m.name) ? "display:grid;place-items:center;font-weight:700;color:#888;text-decoration:none" : 'background-image:url("' + m.url + '");display:block' }, /\.pdf$/i.test(m.name) ? "PDF" : null),
              h(
                "div",
                { class: "media__meta" },
                h("span", { class: "media__name", title: m.name }, m.name),
                Math.round(m.size / 1024) + " KB",
                h(
                  "div",
                  { class: "media__actions" },
                  h(
                    "button",
                    {
                      class: "btn",
                      type: "button",
                      onclick: function () {
                        navigator.clipboard.writeText(m.url).then(function () {
                          toast("Copied " + m.url);
                        });
                      },
                    },
                    "Copy URL"
                  ),
                  h(
                    "button",
                    {
                      class: "btn btn--icon",
                      type: "button",
                      title: "Delete",
                      "aria-label": "Delete " + m.name,
                      onclick: function () {
                        if (!confirm("Delete " + m.name + "?")) return;
                        api("DELETE", "/admin/api/media/" + encodeURIComponent(m.name))
                          .catch(function (e) {
                            if (e.status === 409 && confirm(e.message)) return api("DELETE", "/admin/api/media/" + encodeURIComponent(m.name) + "?force=1");
                            throw e;
                          })
                          .then(function (res) {
                            if (res) {
                              toast("Deleted");
                              load();
                            }
                          })
                          .catch(function (e) {
                            toast(e.message, true);
                          });
                      },
                    },
                    icon("trash", 16)
                  )
                )
              )
            );
          })
        );
      });
    };
    load();
    return h(
      "div",
      null,
      pageHead("Media", "Images you can use anywhere on your site."),
      card(null, [
        dropzone(function (files) {
          uploadFiles(files).then(load);
        }),
        grid,
      ])
    );
  };

  /* ---------- Account ---------- */

  VIEWS.account = function () {
    var current = h("input", { class: "input", type: "password", autocomplete: "current-password" });
    var next = h("input", { class: "input", type: "password", autocomplete: "new-password" });
    var confirmPw = h("input", { class: "input", type: "password", autocomplete: "new-password" });
    var btn = h(
      "button",
      {
        class: "btn btn--primary",
        type: "button",
        onclick: function () {
          if (next.value !== confirmPw.value) return toast("New passwords don't match", true);
          btn.disabled = true;
          api("POST", "/admin/api/password", { current: current.value, next: next.value })
            .then(function () {
              toast("Password changed");
              current.value = next.value = confirmPw.value = "";
            })
            .catch(function (e) {
              toast(e.message, true);
            })
            .finally(function () {
              btn.disabled = false;
            });
        },
      },
      "Change password"
    );
    return h(
      "div",
      null,
      pageHead("Account", "Your admin password and backups."),
      h(
        "div",
        { class: "cols" },
        card("Change password", [
          h("div", { class: "field" }, h("label", { class: "field__label" }, "Current password"), current),
          h("div", { class: "field" }, h("label", { class: "field__label" }, "New password"), next, h("div", { class: "field__help" }, "At least 8 characters.")),
          h("div", { class: "field" }, h("label", { class: "field__label" }, "Confirm new password"), confirmPw),
          btn,
        ]),
        card("Backup", [
          h("p", { style: "margin-top:0" }, "Download all your website content (pages, settings, SEO, prices) as one file. Your orders and images are in the data/ and public/uploads/ folders on the server."),
          h("a", { class: "btn", href: "/admin/api/export" }, icon("download", 16), "Download backup"),
        ])
      )
    );
  };

  boot();
})();
