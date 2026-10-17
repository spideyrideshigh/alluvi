// Image and PDF library. Files that ship with the site live in public/uploads.
// New uploads go to Vercel Blob when BLOB_READ_WRITE_TOKEN is set (Vercel can't
// write to its own disk), otherwise into public/uploads.
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const UPLOAD_DIR = path.join(__dirname, "..", "public", "uploads");
const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;
const LOCAL_WRITABLE = !process.env.VERCEL;
const FILE_RE = /\.(jpe?g|png|gif|webp|ico|pdf)$/i;

const blob = BLOB_TOKEN ? require("@vercel/blob") : null;

class MediaError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

function localFiles() {
  if (!fs.existsSync(UPLOAD_DIR)) return [];
  return fs
    .readdirSync(UPLOAD_DIR)
    .filter((n) => FILE_RE.test(n))
    .map((name) => {
      const stat = fs.statSync(path.join(UPLOAD_DIR, name));
      return { id: "local:" + name, name, url: "/uploads/" + name, size: stat.size, modified: stat.mtime, deletable: LOCAL_WRITABLE };
    });
}

async function blobFiles() {
  if (!blob) return [];
  const out = [];
  let cursor;
  do {
    const page = await blob.list({ prefix: "uploads/", cursor, token: BLOB_TOKEN });
    for (const b of page.blobs) {
      out.push({ id: "blob:" + b.url, name: path.basename(b.pathname), url: b.url, size: b.size, modified: b.uploadedAt, deletable: true });
    }
    cursor = page.hasMore ? page.cursor : null;
  } while (cursor);
  return out;
}

async function list() {
  const all = [...(await blobFiles()), ...localFiles()];
  return all.sort((a, b) => new Date(b.modified) - new Date(a.modified));
}

async function save(baseName, ext, buffer, contentType) {
  if (blob) {
    const result = await blob.put("uploads/" + baseName + ext, buffer, { access: "public", addRandomSuffix: true, contentType, token: BLOB_TOKEN });
    return { name: path.basename(result.pathname), url: result.url };
  }
  if (!LOCAL_WRITABLE) throw new MediaError("Uploads need Vercel Blob. Connect a Blob store to the project in Vercel (Storage tab), then redeploy.", 503);
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  let file = baseName + ext;
  if (fs.existsSync(path.join(UPLOAD_DIR, file))) file = `${baseName}-${crypto.randomBytes(3).toString("hex")}${ext}`;
  fs.writeFileSync(path.join(UPLOAD_DIR, file), buffer);
  return { name: file, url: "/uploads/" + file };
}

async function remove(id) {
  if (id.startsWith("blob:")) {
    if (!blob) throw new MediaError("Vercel Blob isn't connected.", 503);
    await blob.del(id.slice(5), { token: BLOB_TOKEN });
    return;
  }
  const name = path.basename(id.replace(/^local:/, ""));
  if (!LOCAL_WRITABLE) throw new MediaError("Images that came with the site can't be deleted on Vercel. Remove them from the code instead.");
  const file = path.join(UPLOAD_DIR, name);
  if (!fs.existsSync(file)) throw new MediaError("File not found", 404);
  fs.unlinkSync(file);
}

// The URL a media id points to, used to check whether it's in use on the site
function urlOf(id) {
  return id.startsWith("blob:") ? id.slice(5) : "/uploads/" + path.basename(id.replace(/^local:/, ""));
}

module.exports = { list, save, remove, urlOf, MediaError, canUpload: Boolean(blob) || LOCAL_WRITABLE, usesBlob: Boolean(blob) };
