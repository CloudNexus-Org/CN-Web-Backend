import "../env.js";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma.js";

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

  const email = emailArg.toLowerCase().trim();
  const name = nameArg?.trim() || "Admin User";
  const passwordHash = await bcrypt.hash(passwordArg, 10);

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: { role: "ADMIN", passwordHash, name },
    });
    console.log(`Updated existing user to ADMIN: ${email}`);
    return;
  }

  await prisma.user.create({
    data: { email, name, passwordHash, role: "ADMIN" },
  });
  console.log(`Created ADMIN user: ${email}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
