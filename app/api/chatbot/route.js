import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";

export async function POST(req) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new Response(JSON.stringify({ answer: "Unauthorized. Please log in." }), { status: 401 });
    }
    const user = await db.user.findUnique({ where: { clerkUserId: userId } });
    if (!user) {
      return new Response(JSON.stringify({ answer: "User not found." }), { status: 404 });
    }
    const { message, context } = await req.json();
    if (!message) {
      return new Response(JSON.stringify({ answer: "Please provide a question." }), { status: 400 });
    }

    const lower = message.toLowerCase();

    // Context-aware answers
    if (context === "transaction") {
      // Transaction page: focus on transaction-related questions
      if (lower.includes("last transaction")) {
        const tx = await db.transaction.findFirst({
          where: { userId: user.id },
          orderBy: { date: "desc" },
        });
        if (!tx) return new Response(JSON.stringify({ answer: "No transactions found." }), { status: 200 });
        return new Response(JSON.stringify({ answer: `Your last transaction was ${tx.type === "EXPENSE" ? "an expense" : "an income"} of ₹${tx.amount} in category '${tx.category}' on ${tx.date.toLocaleDateString()}.` }), { status: 200 });
      }
      if (lower.includes("total expenses") || lower.includes("total spent")) {
        const txs = await db.transaction.findMany({ where: { userId: user.id, type: "EXPENSE" } });
        const total = txs.reduce((sum, t) => sum + Number(t.amount), 0);
        return new Response(JSON.stringify({ answer: `Your total expenses so far are ₹${total.toLocaleString()}.` }), { status: 200 });
      }
      if (lower.includes("highest transaction") || lower.includes("biggest transaction")) {
        const tx = await db.transaction.findFirst({
          where: { userId: user.id, type: "EXPENSE" },
          orderBy: { amount: "desc" },
        });
        if (!tx) return new Response(JSON.stringify({ answer: "No expenses found." }), { status: 200 });
        return new Response(JSON.stringify({ answer: `Your highest transaction is ₹${tx.amount} in category '${tx.category}' on ${tx.date.toLocaleDateString()}.` }), { status: 200 });
      }
      // Fallback to general
    }
    if (context === "forecast") {
      // Forecast page: focus on prediction-related questions
      if (lower.includes("next month") && lower.includes("spending")) {
        // Get forecast for next month
        // (simulate, as in /api/forecast)
        const now = new Date();
        const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
        const transactions = await db.transaction.findMany({
          where: {
            userId: user.id,
            type: "EXPENSE",
            date: { gte: sixMonthsAgo },
          },
          select: { amount: true, date: true, category: true },
          orderBy: { date: "asc" },
        });
        const grouped = {};
        transactions.forEach((tx) => {
          const month = `${tx.date.getFullYear()}-${String(tx.date.getMonth() + 1).padStart(2, "0")}`;
          if (!grouped[tx.category]) grouped[tx.category] = {};
          if (!grouped[tx.category][month]) grouped[tx.category][month] = 0;
          grouped[tx.category][month] += Number(tx.amount);
        });
        const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        const nextMonthStr = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, "0")}`;
        let answer = "Predicted spending for next month by category: ";
        Object.entries(grouped).forEach(([cat, months]) => {
          const values = Object.values(months);
          const avg = values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
          answer += `\n- ${cat}: ₹${Math.round(avg * 100) / 100}`;
        });
        return new Response(JSON.stringify({ answer }), { status: 200 });
      }
      // Fallback to general
    }

    // General finance Q&A (works everywhere)
    if (lower.includes("biggest expense") && lower.includes("week")) {
      // Find biggest expense this week
      const now = new Date();
      const weekAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
      const txs = await db.transaction.findMany({
        where: {
          userId: user.id,
          type: "EXPENSE",
          date: { gte: weekAgo },
        },
        select: { amount: true, category: true },
      });
      if (!txs.length) return new Response(JSON.stringify({ answer: "No expenses found for this week." }), { status: 200 });
      const grouped = {};
      txs.forEach((tx) => {
        grouped[tx.category] = (grouped[tx.category] || 0) + Number(tx.amount);
      });
      const biggest = Object.entries(grouped).sort((a, b) => b[1] - a[1])[0];
      return new Response(JSON.stringify({ answer: `Your biggest expense this week is '${biggest[0]}' with a total of ₹${biggest[1].toFixed(2)}.` }), { status: 200 });
    }
    if (lower.includes("can i afford") && lower.match(/\d{1,3}(,\d{3})*(\.\d+)?/)) {
      // Extract amount
      const match = lower.match(/\d{1,3}(,\d{3})*(\.\d+)?/);
      const amount = match ? parseFloat(match[0].replace(/,/g, "")) : null;
      if (!amount) return new Response(JSON.stringify({ answer: "Couldn't understand the amount." }), { status: 200 });
      // Get this month's income and expenses
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const incomeTxs = await db.transaction.findMany({
        where: { userId: user.id, type: "INCOME", date: { gte: monthStart } },
        select: { amount: true },
      });
      const expenseTxs = await db.transaction.findMany({
        where: { userId: user.id, type: "EXPENSE", date: { gte: monthStart } },
        select: { amount: true },
      });
      const totalIncome = incomeTxs.reduce((sum, t) => sum + Number(t.amount), 0);
      const totalExpense = expenseTxs.reduce((sum, t) => sum + Number(t.amount), 0);
      const available = totalIncome - totalExpense;
      if (available >= amount) {
        return new Response(JSON.stringify({ answer: `Yes, you can afford a ₹${amount.toLocaleString()} purchase this month. You have ₹${available.toLocaleString()} left after expenses.` }), { status: 200 });
      } else {
        return new Response(JSON.stringify({ answer: `No, you cannot afford a ₹${amount.toLocaleString()} purchase this month. You have only ₹${available.toLocaleString()} left after expenses.` }), { status: 200 });
      }
    }
    if (lower.includes("how much did i spend") && lower.match(/(today|yesterday|this month|last month|this year|last year)/)) {
      // Flexible time period
      let start, end = new Date();
      if (lower.includes("today")) {
        start = new Date();
        start.setHours(0,0,0,0);
      } else if (lower.includes("yesterday")) {
        start = new Date();
        start.setDate(start.getDate() - 1);
        start.setHours(0,0,0,0);
        end = new Date(start);
        end.setHours(23,59,59,999);
      } else if (lower.includes("this month")) {
        start = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      } else if (lower.includes("last month")) {
        const now = new Date();
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        end = new Date(now.getFullYear(), now.getMonth(), 0);
      } else if (lower.includes("this year")) {
        start = new Date(new Date().getFullYear(), 0, 1);
      } else if (lower.includes("last year")) {
        const now = new Date();
        start = new Date(now.getFullYear() - 1, 0, 1);
        end = new Date(now.getFullYear() - 1, 11, 31);
      }
      const txs = await db.transaction.findMany({
        where: {
          userId: user.id,
          type: "EXPENSE",
          date: { gte: start, lte: end },
        },
        select: { amount: true },
      });
      const total = txs.reduce((sum, t) => sum + Number(t.amount), 0);
      return new Response(JSON.stringify({ answer: `You spent ₹${total.toLocaleString()} in that period.` }), { status: 200 });
    }
    // Fallback
    return new Response(JSON.stringify({ answer: "Sorry, I can answer questions about your transactions, forecasts, and affordability. Try asking about your expenses, income, or predictions!" }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ answer: "Error: " + error.message }), { status: 500 });
  }
} 