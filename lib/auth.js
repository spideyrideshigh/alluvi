// Single admin account: scrypt password hash plus an HMAC-signed session cookie.
const crypto = require("crypto");
const db = require("./db");

const COOKIE = "alluvi_admin";
const SESSION_HOURS = 12;

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return { salt, hash };
}

// Without a database, the account comes from the ADMIN_PASSWORD setting and is
// rebuilt the same way on every copy of the app, so logins keep working.
let envAccount = null;
function accountFromEnv(password) {
  if (envAccount && envAccount.source === password) return envAccount.admin;
  const digest = (label) => crypto.createHash("sha256").update(label + password).digest("hex");
  const { salt, hash } = hashPassword(password, digest("alluvi-salt:").slice(0, 32));
  const admin = { username: "admin", salt, hash, secret: digest("alluvi-session:"), fromEnv: true };
  envAccount = { source: password, admin };
  return admin;
}

// Returns the admin account, creating it on first run. `generated` is set when
// a new random password was made (only when running on your own computer).
async function getAdmin() {
  const saved = await db.getAdmin();
  if (saved) return { admin: saved };
  const envPassword = process.env.ADMIN_PASSWORD;
  if (!db.persistent) return { admin: envPassword ? accountFromEnv(envPassword) : null };
  if (!envPassword && process.env.VERCEL) return { admin: null };
  const password = envPassword || crypto.randomBytes(9).toString("base64url");
  const { salt, hash } = hashPassword(password);
  const admin = { username: "admin", salt, hash, secret: crypto.randomBytes(32).toString("hex") };
  await db.saveAdmin(admin);
  return { admin, generated: envPassword ? null : password };
}

async function checkPassword(password) {
  const { admin } = await getAdmin();
  if (!admin || typeof password !== "string") return false;
  const { hash } = hashPassword(password, admin.salt);
  return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(admin.hash, "hex"));
}

async function setPassword(password) {
  const { admin } = await getAdmin();
  const { salt, hash } = hashPassword(password);
  // A new secret logs out every other session
  await db.saveAdmin({ ...admin, fromEnv: undefined, salt, hash, secret: crypto.randomBytes(32).toString("hex") });
}

function sign(value, secret) {
  return crypto.createHmac("sha256", secret).update(value).digest("base64url");
}

async function createSession(res, secure) {
  const { admin } = await getAdmin();
  const expires = Date.now() + SESSION_HOURS * 3600 * 1000;
  const payload = String(expires);
  const token = payload + "." + sign(payload, admin.secret);
  res.cookie(COOKIE, token, { httpOnly: true, sameSite: "strict", secure, maxAge: SESSION_HOURS * 3600 * 1000, path: "/" });
}

function clearSession(res) {
  res.clearCookie(COOKIE, { path: "/" });
}

function readCookie(req, name) {
  const header = req.headers.cookie || "";
  for (const part of header.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return decodeURIComponent(v.join("="));
  }
  return null;
}

async function isLoggedIn(req) {
  const token = readCookie(req, COOKIE);
  if (!token) return false;
  const { admin } = await getAdmin();
  if (!admin) return false;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return false;
  const expected = sign(payload, admin.secret);
  if (sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return false;
  return Number(payload) > Date.now();
}

// Simple in-memory login throttle: 10 attempts per 15 minutes per IP
const attempts = new Map();
function tooManyAttempts(ip) {
  const now = Date.now();
  const list = (attempts.get(ip) || []).filter((t) => now - t < 15 * 60 * 1000);
  attempts.set(ip, list);
  return list.length >= 10;
}
function recordFailure(ip) {
  attempts.set(ip, [...(attempts.get(ip) || []), Date.now()]);
}

module.exports = { getAdmin, checkPassword, setPassword, createSession, clearSession, isLoggedIn, tooManyAttempts, recordFailure };
