"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { GoogleGenerativeAI } from "@google/generative-ai";
import aj from "@/lib/arcjet";
import { request } from "@arcjet/next";
import { sendEmail } from "@/actions/send-email";
import EmailTemplate from "@/emails/template";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const serializeAmount = (obj) => ({
  ...obj,
  amount: obj.amount.toNumber(),
});

// Create Transaction
export async function createTransaction(data) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    // Get request data for ArcJet
    const req = await request();

    // Check rate limit
    const decision = await aj.protect(req, {
      userId,
      requested: 1, // Specify how many tokens to consume
    });

    if (decision.isDenied()) {
      if (decision.reason.isRateLimit()) {
        const { remaining, reset } = decision.reason;
        console.error({
          code: "RATE_LIMIT_EXCEEDED",
          details: {
            remaining,
            resetInSeconds: reset,
          },
        });

        throw new Error("Too many requests. Please try again later.");
      }

      throw new Error("Request blocked");
    }

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    const account = await db.account.findUnique({
      where: {
        id: data.accountId,
        userId: user.id,
      },
    });

    if (!account) {
      throw new Error("Account not found");
    }

    // Calculate new balance
    const balanceChange = data.type === "EXPENSE" ? -data.amount : data.amount;
    const newBalance = account.balance.toNumber() + balanceChange;

    // Create transaction and update account balance
    const transaction = await db.$transaction(async (tx) => {
      const newTransaction = await tx.transaction.create({
        data: {
          ...data,
          userId: user.id,
          nextRecurringDate:
            data.isRecurring && data.recurringInterval
              ? calculateNextRecurringDate(data.date, data.recurringInterval)
              : null,
        },
      });

      await tx.account.update({
        where: { id: data.accountId },
        data: { balance: newBalance },
      });

      return newTransaction;
    });

    // --- FRAUD DETECTION LOGIC ---
    let fraudTriggers = [];
    let maxConfidence = 0;
    let fraudReason = "";
    if (data.type === "EXPENSE") {
      // Get last 50 transactions in this category
      const pastTx = await db.transaction.findMany({
        where: {
          userId: user.id,
          category: data.category,
          type: "EXPENSE",
        },
        orderBy: { date: "desc" },
        take: 50,
      });
      const amounts = pastTx.map((t) => Number(t.amount));
      // 1. Category anomaly
      if (amounts.length > 5) {
        const mean = amounts.reduce((a, b) => a + b, 0) / amounts.length;
        const std = Math.sqrt(amounts.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / amounts.length);
        const z = std === 0 ? 0 : (Number(data.amount) - mean) / std;
        const absZ = Math.abs(z);
        if (absZ > 2) {
          const confidence = Math.min(99, Math.round(absZ * 40 + 40));
          fraudTriggers.push({ confidence, reason: `Unusual amount for category '${data.category}' (z-score: ${z.toFixed(2)})` });
        }
      }
      // 2. Merchant anomaly (if merchant/description is present)
      if (data.description) {
        const merchantTx = await db.transaction.findMany({
          where: {
            userId: user.id,
            description: data.description,
            type: "EXPENSE",
          },
          orderBy: { date: "desc" },
          take: 20,
        });
        if (merchantTx.length < 2) {
          fraudTriggers.push({ confidence: 85, reason: `First time spending at merchant '${data.description}'` });
        }
      }
      // 3. Overall user anomaly
      const allTx = await db.transaction.findMany({
        where: { userId: user.id, type: "EXPENSE" },
        orderBy: { date: "desc" },
        take: 100,
      });
      const allAmounts = allTx.map((t) => Number(t.amount));
      if (allAmounts.length > 10) {
        const meanAll = allAmounts.reduce((a, b) => a + b, 0) / allAmounts.length;
        const stdAll = Math.sqrt(allAmounts.reduce((a, b) => a + Math.pow(b - meanAll, 2), 0) / allAmounts.length);
        const zAll = stdAll === 0 ? 0 : (Number(data.amount) - meanAll) / stdAll;
        const absZAll = Math.abs(zAll);
        if (absZAll > 2.5) {
          const confidence = Math.min(99, Math.round(absZAll * 40 + 40));
          fraudTriggers.push({ confidence, reason: `Unusual amount compared to your overall spending (z-score: ${zAll.toFixed(2)})` });
        }
      }
      // 4. Rapid repeated transactions (same amount, same merchant, within 10 minutes)
      if (data.description) {
        const now = new Date(data.date);
        const tenMinAgo = new Date(now.getTime() - 10 * 60 * 1000);
        const recentSame = await db.transaction.findMany({
          where: {
            userId: user.id,
            description: data.description,
            amount: Number(data.amount),
            date: { gte: tenMinAgo, lte: now },
            type: "EXPENSE",
          },
        });
        if (recentSame.length > 1) {
          fraudTriggers.push({ confidence: 90, reason: `Multiple identical transactions at '${data.description}' within 10 minutes` });
        }
      }
      // Pick the highest confidence trigger
      if (fraudTriggers.length > 0) {
        const top = fraudTriggers.sort((a, b) => b.confidence - a.confidence)[0];
        maxConfidence = top.confidence;
        fraudReason = top.reason;
        // Send fraud alert email
        await sendEmail({
          to: user.email,
          subject: "⚠️ Suspicious Transaction Detected",
          react: EmailTemplate({
            userName: user.name || user.email,
            type: "fraud-alert",
            data: {
              amount: data.amount,
              date: new Date(data.date).toLocaleString(),
              merchant: data.description || "Unknown",
              category: data.category,
              confidence: maxConfidence,
              reason: fraudReason,
            },
          }),
        });
      }
    }
    // --- END FRAUD DETECTION ---

    revalidatePath("/dashboard");
    revalidatePath(`/account/${transaction.accountId}`);

    return { success: true, data: serializeAmount(transaction) };
  } catch (error) {
    throw new Error(error.message);
  }
}

export async function getTransaction(id) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  const transaction = await db.transaction.findUnique({
    where: {
      id,
      userId: user.id,
    },
  });

  if (!transaction) throw new Error("Transaction not found");

  return serializeAmount(transaction);
}

export async function updateTransaction(id, data) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) throw new Error("User not found");

    // Get original transaction to calculate balance change
    const originalTransaction = await db.transaction.findUnique({
      where: {
        id,
        userId: user.id,
      },
      include: {
        account: true,
      },
    });

    if (!originalTransaction) throw new Error("Transaction not found");

    // Calculate balance changes
    const oldBalanceChange =
      originalTransaction.type === "EXPENSE"
        ? -originalTransaction.amount.toNumber()
        : originalTransaction.amount.toNumber();

    const newBalanceChange =
      data.type === "EXPENSE" ? -data.amount : data.amount;

    const netBalanceChange = newBalanceChange - oldBalanceChange;

    // Update transaction and account balance in a transaction
    const transaction = await db.$transaction(async (tx) => {
      const updated = await tx.transaction.update({
        where: {
          id,
          userId: user.id,
        },
        data: {
          ...data,
          nextRecurringDate:
            data.isRecurring && data.recurringInterval
              ? calculateNextRecurringDate(data.date, data.recurringInterval)
              : null,
        },
      });

      // Update account balance
      await tx.account.update({
        where: { id: data.accountId },
        data: {
          balance: {
            increment: netBalanceChange,
          },
        },
      });

      return updated;
    });

    revalidatePath("/dashboard");
    revalidatePath(`/account/${data.accountId}`);

    return { success: true, data: serializeAmount(transaction) };
  } catch (error) {
    throw new Error(error.message);
  }
}

// Get User Transactions
export async function getUserTransactions(query = {}) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    const transactions = await db.transaction.findMany({
      where: {
        userId: user.id,
        ...query,
      },
      include: {
        account: true,
      },
      orderBy: {
        date: "desc",
      },
    });

    return { success: true, data: transactions };
  } catch (error) {
    throw new Error(error.message);
  }
}

// Scan Receipt
export async function scanReceipt(file) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    // Convert ArrayBuffer to Base64
    const base64String = Buffer.from(arrayBuffer).toString("base64");

    const prompt = `
      Analyze this receipt image and extract the following information in JSON format:
      - Total amount (just the number)
      - Date (in ISO format)
      - Description or items purchased (brief summary)
      - Merchant/store name
      - Suggested category (one of: housing,transportation,groceries,utilities,entertainment,food,shopping,healthcare,education,personal,travel,insurance,gifts,bills,other-expense )
      
      Only respond with valid JSON in this exact format:
      {
        "amount": number,
        "date": "ISO date string",
        "description": "string",
        "merchantName": "string",
        "category": "string"
      }

      If its not a recipt, return an empty object
    `;

    const result = await model.generateContent([
      {
        inlineData: {
          data: base64String,
          mimeType: file.type,
        },
      },
      prompt,
    ]);

    const response = await result.response;
    const text = response.text();
    const cleanedText = text.replace(/```(?:json)?\n?/g, "").trim();

    try {
      const data = JSON.parse(cleanedText);
      return {
        amount: parseFloat(data.amount),
        date: new Date(data.date),
        description: data.description,
        category: data.category,
        merchantName: data.merchantName,
      };
    } catch (parseError) {
      console.error("Error parsing JSON response:", parseError);
      throw new Error("Invalid response format from Gemini");
    }
  } catch (error) {
    console.error("Error scanning receipt:", error);
    throw new Error("Failed to scan receipt");
  }
}

// Helper function to calculate next recurring date
function calculateNextRecurringDate(startDate, interval) {
  const date = new Date(startDate);

  switch (interval) {
    case "DAILY":
      date.setDate(date.getDate() + 1);
      break;
    case "WEEKLY":
      date.setDate(date.getDate() + 7);
      break;
    case "MONTHLY":
      date.setMonth(date.getMonth() + 1);
      break;
    case "YEARLY":
      date.setFullYear(date.getFullYear() + 1);
      break;
  }

  return date;
}
