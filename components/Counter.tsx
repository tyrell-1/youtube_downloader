"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div className="flex flex-col items-center gap-8 p-8 rounded-xl border bg-card text-card-foreground shadow">
      <h1 className="text-2xl font-semibold tracking-tight">Counter App</h1>
      
      <div className="text-6xl font-bold tabular-nums">{count}</div>
      
      <div className="flex gap-4">
        <Button
          variant="outline"
          size="lg"
          onClick={() => setCount((prev) => prev - 1)}
        >
          − Decrease
        </Button>
        
        <Button
          variant="outline"
          size="lg"
          onClick={() => setCount(0)}
        >
          Reset
        </Button>
        
        <Button
          size="lg"
          onClick={() => setCount((prev) => prev + 1)}
        >
          + Increase
        </Button>
      </div>
    </div>
  );
}
