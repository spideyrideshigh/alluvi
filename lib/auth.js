// Single admin account: scrypt password hash plus an HMAC-signed session cookie.
const crypto = require("crypto");
const db = require("./db");

const COOKIE = "alluvi_admin";
const SESSION_HOURS = 12;

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return { salt, hash };
}

// Creates the admin account on first run. Returns the generated password, if any.
function ensureAdmin() {
  if (db.getAdmin()) return null;
  const password = process.env.ADMIN_PASSWORD || crypto.randomBytes(9).toString("base64url");
  const { salt, hash } = hashPassword(password);
  db.saveAdmin({ username: "admin", salt, hash, secret: crypto.randomBytes(32).toString("hex") });
  return process.env.ADMIN_PASSWORD ? null : password;
}

function checkPassword(password) {
  const admin = db.getAdmin();
  if (!admin || typeof password !== "string") return false;
  const { hash } = hashPassword(password, admin.salt);
  return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(admin.hash, "hex"));
}

function setPassword(password) {
  const admin = db.getAdmin();
  const { salt, hash } = hashPassword(password);
  // A new secret logs out every other session
  db.saveAdmin({ ...admin, salt, hash, secret: crypto.randomBytes(32).toString("hex") });
}

function sign(value, secret) {
  return crypto.createHmac("sha256", secret).update(value).digest("base64url");
}

function createSession(res, secure) {
  const admin = db.getAdmin();
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

function isLoggedIn(req) {
  const admin = db.getAdmin();
  const token = readCookie(req, COOKIE);
  if (!admin || !token) return false;
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

module.exports = { ensureAdmin, checkPassword, setPassword, createSession, clearSession, isLoggedIn, tooManyAttempts, recordFailure };
