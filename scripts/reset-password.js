// Usage: npm run reset-password               (generates a new password)
//        npm run reset-password -- MyNewPass  (sets a specific one)
// On Vercel, change the ADMIN_PASSWORD environment variable instead, or run this
// locally with the same KV_REST_API_URL / KV_REST_API_TOKEN set.
const crypto = require("crypto");
const db = require("../lib/db");
const auth = require("../lib/auth");

(async () => {
  const password = process.argv[2] || crypto.randomBytes(9).toString("base64url");
  if (password.length < 8) {
    console.error("Password must be at least 8 characters.");
    process.exit(1);
  }
  await auth.getAdmin();
  await auth.setPassword(password);
  console.log("Admin password is now: " + password);
  console.log("Stored in: " + (db.storageKind === "files" ? db.DATA_DIR : db.storageKind));
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
