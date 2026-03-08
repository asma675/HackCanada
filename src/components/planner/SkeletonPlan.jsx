import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function SkeletonPlan() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-64 rounded-lg" />
      {[1, 2, 3].map((day) => (
        <div key={day} className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
          <Skeleton className="h-6 w-32 rounded-lg" />
          <div className="grid sm:grid-cols-3 gap-4">
            {[1, 2, 3].map((meal) => (
              <div key={meal} className="space-y-3">
                <Skeleton className="h-4 w-20 rounded" />
                <Skeleton className="h-36 w-full rounded-xl" />
                <Skeleton className="h-4 w-3/4 rounded" />
                <Skeleton className="h-4 w-1/2 rounded" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}