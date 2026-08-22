"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
      <h2 className="text-2xl font-bold text-red-600">Something went wrong!</h2>
      <p className="text-gray-600">{error.message || "Failed to load dashboard data."}</p>
      <Button onClick={() => reset()}>Try again</Button>
    </div>
  );
}
