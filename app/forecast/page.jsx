"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { BarChart as LucideBarChart } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import ChatbotEntry from "@/components/ui/chatbot-entry";

const COLORS = ["#3b82f6", "#ef4444", "#22c55e", "#f59e42", "#a855f7", "#14b8a6", "#f43f5e", "#6366f1", "#0ea5e9", "#fb7185"];

const ForecastPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("/api/forecast")
      .then((res) => res.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, []);

  // Prepare chart data
  let chartData = [];
  let categories = [];
  if (data && data.forecast) {
    categories = Object.keys(data.forecast);
    // Collect all months
    const allMonths = new Set();
    categories.forEach((cat) => {
      Object.keys(data.forecast[cat]).forEach((month) => allMonths.add(month));
    });
    const sortedMonths = Array.from(allMonths).sort();
    chartData = sortedMonths.map((month) => {
      const entry = { month };
      categories.forEach((cat) => {
        entry[cat] = data.forecast[cat][month] || 0;
      });
      return entry;
    });
  }

  // Generate tips based on forecast
  function generateTips() {
    if (!data || !data.forecast) return [
      "Track your recurring subscriptions and cancel unused ones.",
      "Set category-wise budgets to control overspending.",
      "Review your largest expense categories for potential savings.",
    ];
    // Find category with highest predicted spend
    let maxCat = null, maxVal = 0;
    categories.forEach((cat) => {
      const months = Object.keys(data.forecast[cat]);
      const last = months[months.length - 1];
      if (data.forecast[cat][last] > maxVal) {
        maxVal = data.forecast[cat][last];
        maxCat = cat;
      }
    });
    return [
      `Your highest forecasted spending next month is in "${maxCat}". Consider reviewing this category for savings.`,
      "Set category-wise budgets to control overspending.",
      "Review your largest expense categories for potential savings.",
    ];
  }

  return (
    <div className="min-h-screen bg-white py-20">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-4 mb-8">
          <LucideBarChart className="h-10 w-10 text-blue-600" />
          <h1 className="text-3xl font-bold">Spending Forecasting</h1>
        </div>
        <p className="mb-8 text-gray-600 max-w-2xl">
          Predict your next month&#39;s expenses by category using advanced AI models. Visualize your future spending and get personalized tips to save money.
        </p>
        <Card className="mb-8">
          <CardContent className="py-8 flex flex-col items-center justify-center">
            {loading ? (
              <span className="text-gray-400">Loading forecast...</span>
            ) : error ? (
              <span className="text-red-500">{error}</span>
            ) : chartData.length === 0 ? (
              <span className="text-gray-400">No data available.</span>
            ) : (
              <div className="w-full h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip />
                    <Legend />
                    {categories.map((cat, idx) => (
                      <Bar
                        key={cat}
                        dataKey={cat}
                        fill={COLORS[idx % COLORS.length]}
                        name={cat}
                        radius={[4, 4, 0, 0]}
                        maxBarSize={32}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-6">
            <h2 className="text-xl font-semibold mb-2">Money-Saving Tips</h2>
            <ul className="list-disc pl-6 text-gray-600">
              {generateTips().map((tip, i) => (
                <li key={i}>{tip}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <ChatbotEntry context="forecast" />
      </div>
    </div>
  );
};

export default ForecastPage; 