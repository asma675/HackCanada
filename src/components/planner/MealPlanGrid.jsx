import React from "react";
import { motion } from "framer-motion";
import RecipeCard from "./RecipeCard";
import { Sun, CloudSun, Moon } from "lucide-react";

const mealIcons = {
  breakfast: Sun,
  lunch: CloudSun,
  dinner: Moon,
};

export default function MealPlanGrid({ mealPlan, onViewRecipe }) {
  if (!mealPlan || mealPlan.length === 0) return null;

  return (
    <div className="space-y-6">
      <motion.h2
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-2xl font-bold text-gray-900"
      >
        Your Weekly Meal Plan
      </motion.h2>
      
      <div className="space-y-6">
        {mealPlan.map((day, dayIndex) => (
          <motion.div
            key={day.day}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: dayIndex * 0.08 }}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-gray-50 bg-gradient-to-r from-red-50/50 to-transparent">
              <h3 className="text-lg font-bold text-gray-900">{day.day}</h3>
            </div>
            <div className="p-4">
              <div className="grid sm:grid-cols-3 gap-4">
                {["breakfast", "lunch", "dinner"].map((meal) => {
                  const Icon = mealIcons[meal];
                  return (
                    <div key={meal}>
                      <div className="flex items-center gap-2 mb-2 px-1">
                        <Icon className="w-4 h-4 text-gray-400" />
                        <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                          {meal}
                        </span>
                      </div>
                      <RecipeCard
                        recipe={day[meal]}
                        onViewRecipe={onViewRecipe}
                        delay={dayIndex * 0.08 + 0.1}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}