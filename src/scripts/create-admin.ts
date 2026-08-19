import "../env.js";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { connectDB } from "../lib/db.js";
import { User } from "../models/User.js";

async function main() {
  const emailArg = process.argv[2];
  const passwordArg = process.argv[3];
  const nameArg = process.argv[4];

  if (!emailArg || !passwordArg) {
    console.error("Usage: npm run admin:create -- <email> <password> [name]");
    process.exit(1);
  }
  if (passwordArg.length < 6) {
    console.error("Password must be at least 6 characters");
    process.exit(1);
  }

  await connectDB();

  const email = emailArg.toLowerCase().trim();
  const name = nameArg?.trim() || "Admin User";
  const passwordHash = await bcrypt.hash(passwordArg, 10);

  const existing = await User.findOne({ email });
  if (existing) {
    await User.findByIdAndUpdate(existing.id, {
      $set: { role: "ADMIN", passwordHash, name },
    });
    console.log(`Updated existing user to ADMIN: ${email}`);
    return;
  }

  await User.create({ email, name, passwordHash, role: "ADMIN" });
  console.log(`Created ADMIN user: ${email}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
