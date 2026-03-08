import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { ShoppingCart, Store, DollarSign, Leaf, Printer, Check } from "lucide-react";

const categoryIcons = {
  Produce: "🥬",
  Dairy: "🥛",
  Grains: "🌾",
  Protein: "🥩",
  Pantry: "🫙",
  Other: "📦",
  Spices: "🧂",
  Oils: "🫒",
  Frozen: "🧊",
};

export default function GroceryList() {
  const [checkedItems, setCheckedItems] = useState({});
  const [groceryList, setGroceryList] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const { data: mealPlans } = useQuery({
    queryKey: ["mealPlans"],
    queryFn: () => base44.entities.MealPlan.list("-created_date", 1),
    initialData: [],
  });

  useEffect(() => {
    if (mealPlans.length > 0 && mealPlans[0].meals) {
      generateGroceryList(mealPlans[0]);
    } else {
      setIsLoading(false);
    }
  }, [mealPlans]);

  const generateGroceryList = async (plan) => {
    setIsLoading(true);
    const allIngredients = [];
    plan.meals?.forEach((day) => {
      ["breakfast", "lunch", "dinner"].forEach((meal) => {
        if (day[meal]?.ingredients) {
          day[meal].ingredients.forEach((ing) => allIngredients.push(ing));
        }
      });
    });

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Given these ingredients from a weekly meal plan, organize them into a grocery list grouped by category. Combine duplicates and sum quantities. Add estimated prices in CAD and suggest the cheapest Ontario store for each category. Ingredients: ${JSON.stringify(allIngredients)}`,
      response_json_schema: {
        type: "object",
        properties: {
          categories: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                store_suggestion: { type: "string" },
                items: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      quantity: { type: "string" },
                      price: { type: "number" },
                      is_local: { type: "boolean" },
                    },
                  },
                },
              },
            },
          },
          total_cost: { type: "number" },
          savings_from_local: { type: "number" },
        },
      },
    });

    setGroceryList(result);
    setIsLoading(false);
  };

  const toggleItem = (catIdx, itemIdx) => {
    const key = `${catIdx}-${itemIdx}`;
    setCheckedItems((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const totalChecked = Object.values(checkedItems).filter(Boolean).length;

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 space-y-6">
        <Skeleton className="h-10 w-64 rounded-lg" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="h-6 w-32 rounded" />
            {[1, 2, 3, 4].map((j) => (
              <Skeleton key={j} className="h-14 w-full rounded-xl" />
            ))}
          </div>
        ))}
      </div>
    );
  }

  if (!groceryList) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <div className="w-20 h-20 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-4">
          <ShoppingCart className="w-8 h-8 text-gray-300" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">No grocery list yet</h2>
        <p className="text-gray-500">Generate a meal plan first, and your grocery list will appear here.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 md:py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Grocery List</h1>
          <p className="text-gray-500 mt-1">
            {totalChecked} items checked off
          </p>
        </div>
        <Button
          variant="outline"
          className="rounded-xl"
          onClick={() => window.print()}
        >
          <Printer className="w-4 h-4 mr-2" />
          Print
        </Button>
      </div>

      {/* Summary bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <DollarSign className="w-4 h-4" />
            Total Cost
          </div>
          <p className="text-2xl font-bold text-gray-900">${groceryList.total_cost?.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Leaf className="w-4 h-4 text-green-600" />
            Local Savings
          </div>
          <p className="text-2xl font-bold text-[#2E7D32]">${groceryList.savings_from_local?.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 col-span-2 sm:col-span-1">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <ShoppingCart className="w-4 h-4" />
            Items
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {groceryList.categories?.reduce((acc, cat) => acc + cat.items.length, 0)}
          </p>
        </div>
      </div>

      {/* Categories */}
      <div className="space-y-6">
        {groceryList.categories?.map((category, catIdx) => (
          <motion.div
            key={category.name}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: catIdx * 0.08 }}
            className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
          >
            <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xl">{categoryIcons[category.name] || "📦"}</span>
                <h3 className="font-bold text-gray-900">{category.name}</h3>
                <Badge variant="secondary" className="bg-gray-50 text-gray-500 text-xs">
                  {category.items.length}
                </Badge>
              </div>
              {category.store_suggestion && (
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <Store className="w-3 h-3" />
                  {category.store_suggestion}
                </div>
              )}
            </div>
            <div className="divide-y divide-gray-50">
              {category.items.map((item, itemIdx) => {
                const key = `${catIdx}-${itemIdx}`;
                const isChecked = checkedItems[key];
                return (
                  <div
                    key={itemIdx}
                    onClick={() => toggleItem(catIdx, itemIdx)}
                    className={`flex items-center gap-4 px-5 py-3.5 cursor-pointer hover:bg-gray-50/50 transition-colors ${isChecked ? "bg-green-50/30" : ""}`}
                  >
                    <Checkbox checked={isChecked} className="data-[state=checked]:bg-[#2E7D32] data-[state=checked]:border-[#2E7D32]" />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${isChecked ? "line-through text-gray-400" : "text-gray-900"}`}>
                        {item.name}
                      </p>
                      <p className="text-xs text-gray-400">{item.quantity}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.is_local && (
                        <Badge className="bg-green-50 text-green-700 border-0 text-xs">
                          <Leaf className="w-3 h-3 mr-0.5" />
                          Local
                        </Badge>
                      )}
                      <span className="text-sm font-medium text-gray-500 tabular-nums">
                        ${item.price?.toFixed(2)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}