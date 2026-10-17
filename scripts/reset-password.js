// Usage: npm run reset-password            (generates a new password)
//        npm run reset-password -- MyNewPass  (sets a specific one)
const crypto = require("crypto");
const db = require("../lib/db");
const auth = require("../lib/auth");

auth.ensureAdmin();
const password = process.argv[2] || crypto.randomBytes(9).toString("base64url");
if (password.length < 8) {
  console.error("Password must be at least 8 characters.");
  process.exit(1);
}
auth.setPassword(password);
console.log("Admin password is now: " + password);
console.log("Data folder: " + db.DATA_DIR);
