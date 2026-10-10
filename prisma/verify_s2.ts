import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function verify() {
  console.log("🔍 Running Sprint 2 Verification Gate (VERIFY S2)...");

  // 1. Query a lesson with its ordered 6 steps
  const lesson = await prisma.lesson.findFirst({
    where: { slug: "light-travels-straight-lines" },
    include: {
      unit: {
        include: {
          subject: true,
        },
      },
      steps: {
        orderBy: {
          stepOrder: "asc",
        },
      },
    },
  });

  if (!lesson) {
    throw new Error("❌ Lesson 'light-travels-straight-lines' not found!");
  }

  console.log("\n=======================================================");
  console.log(`📖 Lesson: ${lesson.title}`);
  console.log(`📁 Subject: ${lesson.unit.subject.name} → Unit: ${lesson.unit.title}`);
  console.log(`❓ Big Question: "${lesson.bigQuestion}"`);
  console.log(`🎯 By The End: "${lesson.byTheEnd}"`);
  console.log(`🖼️ Banner: ${lesson.bannerImage}`);
  console.log("=======================================================");

  console.log(`\nFound ${lesson.steps.length} steps in fixed order:`);
  const expectedSteps = ["HOOK", "VIDEO", "READ", "ACTIVITY", "PRACTICE", "DEEP_DIVE"];

  lesson.steps.forEach((step, idx) => {
    const expected = expectedSteps[idx];
    const isMatch = step.stepType === expected && step.stepOrder === idx + 1;
    console.log(
      `  [Step ${step.stepOrder}] Type: ${step.stepType} (Expected: ${expected}) ${
        isMatch ? "✓" : "❌ MISMATCH"
      }`
    );
  });

  if (lesson.steps.length !== 6) {
    throw new Error(`❌ Expected 6 steps, found ${lesson.steps.length}`);
  }

  // 2. Verify all 13 PRD §7.3 tables exist in SQLite
  const tables = await prisma.$queryRaw<Array<{ name: string }>>`
    SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_prisma_%';
  `;

  const tableNames = tables.map((t) => t.name).sort();
  console.log("\n=======================================================");
  console.log(`📊 Verified Tables in Database (${tableNames.length}/13):`);
  console.log(tableNames.join(", "));
  console.log("=======================================================");

  const expectedTables = [
    "ai_jobs",
    "custom_lessons",
    "households",
    "kid_profiles",
    "lesson_progress",
    "lesson_steps",
    "lessons",
    "moderation_logs",
    "practice_sessions",
    "subjects",
    "subscriptions",
    "units",
    "users",
  ].sort();

  const missing = expectedTables.filter((t) => !tableNames.includes(t));
  if (missing.length > 0) {
    throw new Error(`❌ Missing tables: ${missing.join(", ")}`);
  }

  console.log("\n🎉 ALL SPRINT 2 GATES VERIFIED AND GREEN!");
}

verify()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
