import { PrismaClient, Priority, TaskType } from "@prisma/client";
import { addDays, startOfDay } from "date-fns";

const prisma = new PrismaClient();

async function main() {
  const today = startOfDay(new Date());
  const tomorrow = addDays(today, 1);
  const nextWeek = addDays(today, 7);

  await prisma.wallet.upsert({
    where: { id: "siri-wallet" },
    update: {},
    create: { id: "siri-wallet", coins: 0, streakFreezes: 0, totalTasksCompleted: 0 }
  });

  await prisma.streak.upsert({
    where: { id: "siri-streak" },
    update: {},
    create: { id: "siri-streak", currentStreak: 0, longestStreak: 0 }
  });

  const count = await prisma.task.count();
  if (count === 0) {
    await prisma.task.createMany({
      data: [
        {
          title: "Review today's top priorities",
          description: "Pick the three things that would make today feel successful.",
          type: TaskType.TODAY,
          plannedForDate: today,
          category: "Planning",
          priority: Priority.HIGH
        },
        {
          title: "Take a focused study block",
          description: "One calm session, timer optional.",
          type: TaskType.TODAY,
          plannedForDate: today,
          category: "Study",
          priority: Priority.MEDIUM
        },
        {
          title: "Outline tomorrow's first task",
          type: TaskType.TOMORROW,
          plannedForDate: tomorrow,
          category: "Planning",
          priority: Priority.LOW
        },
        {
          title: "Submit project checkpoint",
          type: TaskType.SCHEDULED,
          dueDate: nextWeek,
          category: "School",
          priority: Priority.HIGH
        },
        {
          title: "Clean up notes folder",
          type: TaskType.BACKLOG,
          category: "Home",
          priority: Priority.LOW
        }
      ]
    });
  }
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
