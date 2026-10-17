// Site content, orders, messages and the admin account, on top of lib/storage.
const store = require("./storage");
const defaults = require("./defaults");

const clone = (o) => JSON.parse(JSON.stringify(o));

class NotSavedError extends Error {
  constructor() {
    super("This copy of the site has no database connected, so changes can't be saved. Connect Upstash Redis to the project in Vercel (Storage tab).");
    this.status = 503;
  }
}

function requirePersistent() {
  if (!store.persistent) throw new NotSavedError();
}

// The current site content. Loaded at the start of every request, because on
// Vercel each request may run on a different copy of the app.
let site = null;

async function loadSite() {
  let next = await store.getDoc("site");
  if (!next) {
    next = clone(defaults);
    if (store.persistent) await store.setDoc("site", next);
  } else {
    // Add any top-level sections introduced since the content was created
    let changed = false;
    for (const key of Object.keys(defaults)) {
      if (next[key] === undefined) {
        next[key] = clone(defaults[key]);
        changed = true;
      }
    }
    if (changed && store.persistent) await store.setDoc("site", next);
  }
  site = next;
  return site;
}

function collection(name) {
  return {
    all: () => store.listAll(name),
    async find(id) {
      return (await store.listAll(name)).find((x) => (x.id || x.reference) === id) || null;
    },
    async add(item) {
      requirePersistent();
      await store.listAdd(name, item);
    },
    async update(item) {
      requirePersistent();
      await store.listUpdate(name, item);
    },
    async remove(id) {
      requirePersistent();
      await store.listRemove(name, id);
    },
  };
}

module.exports = {
  loadSite,
  getSite: () => site,
  async saveSite(next) {
    requirePersistent();
    await store.setDoc("site", next);
    site = next;
  },
  orders: collection("orders"),
  messages: collection("messages"),
  getAdmin: () => store.getDoc("admin"),
  async saveAdmin(data) {
    requirePersistent();
    await store.setDoc("admin", data);
  },
  persistent: store.persistent,
  storageKind: store.kind,
  NotSavedError,
  DATA_DIR: store.DATA_DIR,
};
