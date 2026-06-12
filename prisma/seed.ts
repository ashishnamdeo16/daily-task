/**
 * LifeOS seed script
 *
 * Usage:
 *   pnpm db:seed
 *
 * Seeds demo data for local development. Requires DATABASE_URL.
 * Pass SEED_CLERK_ID and SEED_EMAIL env vars to target a specific user,
 * otherwise uses demo placeholders.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const WORK_DAY_ITEMS = [
  { title: "DSA / LeetCode", category: "DSA", priority: "HIGH", targetCount: 3, unit: "problems", estimatedMinutes: 90 },
  { title: "Job Applications", category: "JOB_APPLICATION", priority: "CRITICAL", targetCount: 20, unit: "applications", estimatedMinutes: 60 },
  { title: "Gym", category: "FITNESS", priority: "MEDIUM", estimatedMinutes: 60 },
] as const;

const WEEKEND_ITEMS = [
  { title: "DSA / LeetCode", category: "DSA", priority: "HIGH", targetCount: 5, unit: "problems", estimatedMinutes: 120 },
  { title: "Open Source", category: "OPEN_SOURCE", priority: "HIGH", targetCount: 1, unit: "PRs", estimatedMinutes: 120 },
  { title: "Project Work", category: "AI_PROJECT", priority: "HIGH", estimatedMinutes: 180 },
  { title: "Networking", category: "NETWORKING", priority: "MEDIUM", targetCount: 3, unit: "outreach", estimatedMinutes: 45 },
  { title: "Content Creation", category: "CONTENT", priority: "MEDIUM", estimatedMinutes: 60 },
] as const;

async function main() {
  const clerkId = process.env.SEED_CLERK_ID ?? "user_demo_lifeos";
  const email = process.env.SEED_EMAIL ?? "demo@lifeos.local";

  console.log("🌱 Seeding LifeOS…");

  const user = await prisma.user.upsert({
    where: { clerkId },
    create: {
      clerkId,
      email,
      name: "Demo Operator",
      xp: 420,
      level: 3,
      currentStreak: 5,
      longestStreak: 12,
      settings: { create: {} },
    },
    update: { name: "Demo Operator" },
  });

  // Templates
  const existingTemplates = await prisma.taskTemplate.count({ where: { userId: user.id } });
  if (existingTemplates === 0) {
    const workDay = await prisma.taskTemplate.create({
      data: {
        userId: user.id,
        name: "Work Day",
        description: "DSA, job applications, and gym.",
        type: "WORK_DAY",
        icon: "Briefcase",
        isDefault: true,
        daysOfWeek: [1, 2, 3, 4, 5],
        items: [...WORK_DAY_ITEMS],
      },
    });
    await prisma.taskTemplate.create({
      data: {
        userId: user.id,
        name: "Weekend",
        description: "DSA, open source, projects, networking, content.",
        type: "WEEKEND",
        icon: "Calendar",
        daysOfWeek: [0, 6],
        items: [...WEEKEND_ITEMS],
      },
    });
    await prisma.settings.update({
      where: { userId: user.id },
      data: { defaultTemplateId: workDay.id },
    });
    console.log("  ✓ Templates created");
  }

  // Today's day + tasks from Work Day template
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const day = await prisma.day.upsert({
    where: { userId_date: { userId: user.id, date: today } },
    create: { userId: user.id, date: today, score: 45, totalTasks: 3, completedTasks: 1 },
    update: {},
  });

  const taskCount = await prisma.task.count({ where: { dayId: day.id } });
  if (taskCount === 0) {
    await prisma.task.createMany({
      data: WORK_DAY_ITEMS.map((item, i) => ({
        userId: user.id,
        dayId: day.id,
        title: item.title,
        category: item.category,
        priority: item.priority,
        position: i,
        targetCount: "targetCount" in item ? item.targetCount : null,
        unit: "unit" in item ? item.unit : null,
        estimatedMinutes: item.estimatedMinutes ?? null,
        completedCount: i === 0 ? 2 : 0,
        xpValue: item.category === "DSA" ? 10 : item.category === "JOB_APPLICATION" ? 5 : 8,
        status: i === 2 ? "COMPLETED" : "TODO",
      })),
    });
    console.log("  ✓ Today's tasks created");
  }

  // Sample debt
  const debtCount = await prisma.debtRecord.count({ where: { userId: user.id } });
  if (debtCount === 0) {
    await prisma.debtRecord.create({
      data: {
        userId: user.id,
        dayId: day.id,
        category: "JOB_APPLICATION",
        title: "Job Applications",
        amount: 10,
        originalDate: new Date(today.getTime() - 86_400_000),
      },
    });
    console.log("  ✓ Sample debt created");
  }

  // Weekly goals (current week, Sunday start)
  const weekStart = new Date(today);
  weekStart.setUTCDate(weekStart.getUTCDate() - weekStart.getUTCDay());

  const goalCount = await prisma.weeklyGoal.count({ where: { userId: user.id, weekStart } });
  if (goalCount === 0) {
    await prisma.weeklyGoal.createMany({
      data: [
        { userId: user.id, title: "Reach 250 LeetCode Problems", category: "DSA", weekStart, targetValue: 250, currentValue: 48, rank: 1 },
        { userId: user.id, title: "Submit 5 Open Source PRs", category: "OPEN_SOURCE", weekStart, targetValue: 5, currentValue: 1, rank: 2 },
        { userId: user.id, title: "Apply To 100 Jobs", category: "JOB_APPLICATION", weekStart, targetValue: 100, currentValue: 32, rank: 3 },
      ],
    });
    console.log("  ✓ Weekly goals created");
  }

  // Job search samples
  const appCount = await prisma.applicationTracker.count({ where: { userId: user.id } });
  if (appCount === 0) {
    await prisma.applicationTracker.createMany({
      data: [
        { userId: user.id, company: "Stripe", role: "Software Engineer", stage: "INTERVIEW" },
        { userId: user.id, company: "Vercel", role: "Frontend Engineer", stage: "ONLINE_ASSESSMENT" },
        { userId: user.id, company: "OpenAI", role: "ML Engineer", stage: "APPLIED" },
        { userId: user.id, company: "Anthropic", role: "Research Engineer", stage: "REJECTED" },
      ],
    });
    console.log("  ✓ Job applications seeded");
  }

  // Open source samples
  const osCount = await prisma.openSourceTracker.count({ where: { userId: user.id } });
  if (osCount === 0) {
    await prisma.openSourceTracker.createMany({
      data: [
        { userId: user.id, repo: "vercel/next.js", title: "Fix docs typo", type: "pr", prCreated: true, prMerged: true, commits: 1 },
        { userId: user.id, repo: "facebook/react", title: "Add test coverage", type: "pr", prCreated: true, commits: 3 },
      ],
    });
    console.log("  ✓ Open source items seeded");
  }

  // Achievement
  await prisma.achievement.upsert({
    where: { userId_key: { userId: user.id, key: "streak_7" } },
    create: {
      userId: user.id,
      key: "streak_7",
      name: "Consistency",
      description: "Maintain a 7 day streak",
      icon: "Flame",
      category: "STREAK",
      xpReward: 50,
    },
    update: {},
  });

  console.log(`✅ Seed complete for user ${user.email} (${user.id})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
