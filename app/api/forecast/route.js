import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";

export async function GET(req) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    // Get user
    const user = await db.user.findUnique({ where: { clerkUserId: userId } });
    if (!user) {
      return new Response(JSON.stringify({ error: "User not found" }), { status: 404 });
    }

    // Get last 6 months of expenses
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const transactions = await db.transaction.findMany({
      where: {
        userId: user.id,
        type: "EXPENSE",
        date: { gte: sixMonthsAgo },
      },
      select: {
        amount: true,
        date: true,
        category: true,
      },
      orderBy: { date: "asc" },
    });

    // Group by category and month
    const grouped = {};
    transactions.forEach((tx) => {
      const month = `${tx.date.getFullYear()}-${String(tx.date.getMonth() + 1).padStart(2, "0")}`;
      if (!grouped[tx.category]) grouped[tx.category] = {};
      if (!grouped[tx.category][month]) grouped[tx.category][month] = 0;
      grouped[tx.category][month] += Number(tx.amount);
    });

    // Predict next month (simple average)
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const nextMonthStr = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, "0")}`;
    const forecast = {};
    Object.entries(grouped).forEach(([category, months]) => {
      const values = Object.values(months);
      const avg = values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
      forecast[category] = { ...months, [nextMonthStr]: Math.round(avg * 100) / 100 };
    });

    return new Response(JSON.stringify({ forecast, nextMonth: nextMonthStr }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
} 