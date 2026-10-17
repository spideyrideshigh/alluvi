// Where the store keeps its data.
//
// - Upstash Redis (on Vercel): set KV_REST_API_URL + KV_REST_API_TOKEN, or
//   UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN. Vercel adds these when
//   you connect an Upstash Redis database to the project.
// - JSON files in ./data (when running on your own computer or server).
// - Memory only (on Vercel with no database connected): the site still loads,
//   but nothing can be saved.
//
// Documents (site, admin) are stored whole. Collections (orders, messages) are
// stored one item per key so two customers ordering at once can't overwrite
// each other.
const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "..", "data");
const PREFIX = "alluvi:";

/* ------------------------------------------------------------------ */
/* Upstash Redis over its REST API                                      */
/* ------------------------------------------------------------------ */

function redisStore(url, token) {
  async function cmd(...args) {
    const res = await fetch(url.replace(/\/$/, ""), {
      method: "POST",
      headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
      body: JSON.stringify(args),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.error) throw new Error("Redis: " + (data.error || res.status));
    return data.result;
  }
  const parse = (v) => (v == null ? null : JSON.parse(v));

  return {
    kind: "redis",
    persistent: true,
    async getDoc(key) {
      return parse(await cmd("GET", PREFIX + key));
    },
    async setDoc(key, value) {
      await cmd("SET", PREFIX + key, JSON.stringify(value));
    },
    async listAll(coll) {
      const ids = (await cmd("LRANGE", PREFIX + coll, 0, -1)) || [];
      if (!ids.length) return [];
      const values = await cmd("MGET", ...ids.map((id) => PREFIX + coll + ":" + id));
      return values.map(parse).filter(Boolean);
    },
    async listAdd(coll, item) {
      await cmd("SET", PREFIX + coll + ":" + item.id, JSON.stringify(item));
      await cmd("LPUSH", PREFIX + coll, item.id);
    },
    async listUpdate(coll, item) {
      await cmd("SET", PREFIX + coll + ":" + item.id, JSON.stringify(item));
    },
    async listRemove(coll, id) {
      await cmd("LREM", PREFIX + coll, 0, id);
      await cmd("DEL", PREFIX + coll + ":" + id);
    },
  };
}

/* ------------------------------------------------------------------ */
/* JSON files in ./data                                                 */
/* ------------------------------------------------------------------ */

function fileStore() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const file = (key) => path.join(DATA_DIR, key + ".json");
  const read = (key) => {
    try {
      return JSON.parse(fs.readFileSync(file(key), "utf8"));
    } catch (e) {
      if (e.code !== "ENOENT") console.error("Could not read " + file(key) + ":", e.message);
      return null;
    }
  };
  // Write to a temp file then rename, so a crash never leaves half a file
  const write = (key, value) => {
    fs.writeFileSync(file(key) + ".tmp", JSON.stringify(value, null, 2));
    fs.renameSync(file(key) + ".tmp", file(key));
  };
  // Orders and messages keep their original array files, newest first
  const idOf = (item) => item.id || item.reference;

  return {
    kind: "files",
    persistent: true,
    async getDoc(key) {
      return read(key);
    },
    async setDoc(key, value) {
      write(key, value);
    },
    async listAll(coll) {
      return read(coll) || [];
    },
    async listAdd(coll, item) {
      write(coll, [item, ...(read(coll) || [])]);
    },
    async listUpdate(coll, item) {
      write(coll, (read(coll) || []).map((x) => (idOf(x) === idOf(item) ? item : x)));
    },
    async listRemove(coll, id) {
      write(coll, (read(coll) || []).filter((x) => idOf(x) !== id));
    },
  };
}

/* ------------------------------------------------------------------ */
/* Memory only (read-only hosting with no database)                     */
/* ------------------------------------------------------------------ */

function memoryStore() {
  const docs = new Map();
  const lists = new Map();
  return {
    kind: "memory",
    persistent: false,
    async getDoc(key) {
      return docs.has(key) ? JSON.parse(docs.get(key)) : null;
    },
    async setDoc(key, value) {
      docs.set(key, JSON.stringify(value));
    },
    async listAll(coll) {
      return lists.get(coll) || [];
    },
    async listAdd(coll, item) {
      lists.set(coll, [item, ...(lists.get(coll) || [])]);
    },
    async listUpdate(coll, item) {
      lists.set(coll, (lists.get(coll) || []).map((x) => ((x.id || x.reference) === (item.id || item.reference) ? item : x)));
    },
    async listRemove(coll, id) {
      lists.set(coll, (lists.get(coll) || []).filter((x) => (x.id || x.reference) !== id));
    },
  };
}

function pickStore() {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) return redisStore(url, token);
  if (process.env.VERCEL) {
    console.warn("No database connected: connect Upstash Redis in Vercel so orders and changes can be saved.");
    return memoryStore();
  }
  return fileStore();
}

module.exports = pickStore();
module.exports.DATA_DIR = DATA_DIR;
