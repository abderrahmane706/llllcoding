import { MissionType } from "@prisma/client";
import bcrypt from "bcrypt";
import { db } from "../src/lib/db";

async function seed() {
  const email = "hunter@system.local";
  const rawPassword = "password123";
  const hashedPassword = await bcrypt.hash(rawPassword, 12); // High work factor for security

  console.log(`Seeding secure hunter account...`);

  // Check if user exists
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    // Update password if they exist
    await db.user.update({
      where: { email },
      data: { password: hashedPassword },
    });
    console.log(`Updated existing user: ${email} with new hashed password.`);
  } else {
    // Create new user
    await db.user.create({
      data: {
        email,
        name: "Sung Jin-Woo",
        password: hashedPassword,
        missions: {
          createMany: {
            data: [
              { title: "Push-ups",  description: "Complete 100 push-ups",  expReward: 30, type: MissionType.STANDARD },
              { title: "Sit-ups",   description: "Complete 100 sit-ups",   expReward: 30, type: MissionType.STANDARD },
              { title: "10km Run",  description: "Run 10 kilometres",      expReward: 40, type: MissionType.STANDARD },
            ],
          },
        },
      },
    });
    console.log(`Created new hunter account: ${email}`);
  }

  console.log(`\n======================================`);
  console.log(`Login Credentials:`);
  console.log(`Email:    ${email}`);
  console.log(`Password: ${rawPassword}`);
  console.log(`======================================\n`);
}

seed()
  .catch((e) => {
    console.error("Error seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
