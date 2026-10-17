// Tiny JSON-file store. Everything lives in ./data so it is easy to back up.
const fs = require("fs");
const path = require("path");
const defaults = require("./defaults");

const DATA_DIR = path.join(__dirname, "..", "data");
const FILES = {
  site: path.join(DATA_DIR, "site.json"),
  orders: path.join(DATA_DIR, "orders.json"),
  messages: path.join(DATA_DIR, "messages.json"),
  admin: path.join(DATA_DIR, "admin.json"),
};

fs.mkdirSync(DATA_DIR, { recursive: true });

function read(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (e) {
    if (e.code !== "ENOENT") console.error("Could not read " + file + ":", e.message);
    return fallback;
  }
}

// Write to a temp file then rename, so a crash never leaves half a file.
function write(file, data) {
  const tmp = file + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
  fs.renameSync(tmp, file);
}

let site = read(FILES.site, null);
if (!site) {
  site = JSON.parse(JSON.stringify(defaults));
  write(FILES.site, site);
} else {
  // Add any top-level sections introduced since the file was created
  let changed = false;
  for (const key of Object.keys(defaults)) {
    if (site[key] === undefined) {
      site[key] = JSON.parse(JSON.stringify(defaults[key]));
      changed = true;
    }
  }
  if (changed) write(FILES.site, site);
}

let orders = read(FILES.orders, []);
let messages = read(FILES.messages, []);

module.exports = {
  getSite: () => site,
  saveSite(next) {
    site = next;
    write(FILES.site, site);
  },
  getOrders: () => orders,
  saveOrders(next) {
    orders = next;
    write(FILES.orders, orders);
  },
  getMessages: () => messages,
  saveMessages(next) {
    messages = next;
    write(FILES.messages, messages);
  },
  getAdmin: () => read(FILES.admin, null),
  saveAdmin: (data) => write(FILES.admin, data),
  DATA_DIR,
};
