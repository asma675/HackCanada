import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import PlannerForm from "../components/planner/PlannerForm";
import MealPlanGrid from "../components/planner/MealPlanGrid";
import RecipeModal from "../components/planner/RecipeModal";
import SkeletonPlan from "../components/planner/SkeletonPlan";

const ONTARIO_SEASONAL = {
  winter: ["potatoes", "carrots", "onions", "cabbage", "beets", "turnips", "parsnips", "apples", "maple syrup", "greenhouse tomatoes", "greenhouse cucumbers", "mushrooms", "squash"],
  spring: ["asparagus", "rhubarb", "radishes", "spinach", "lettuce", "maple syrup", "greenhouse strawberries", "peas", "fiddleheads"],
  summer: ["strawberries", "blueberries", "raspberries", "cherries", "peaches", "sweet corn", "tomatoes", "zucchini", "beans", "peppers", "cucumbers", "herbs"],
  fall: ["apples", "pears", "pumpkin", "squash", "potatoes", "beets", "brussels sprouts", "kale", "cranberries", "grapes"],
};

function getCurrentSeason() {
  const month = new Date().getMonth();
  if (month >= 2 && month <= 4) return "spring";
  if (month >= 5 && month <= 7) return "summer";
  if (month >= 8 && month <= 10) return "fall";
  return "winter";
}

export default function MealPlanner() {
  const [formData, setFormData] = useState({
    budget: "",
    household_size: "",
    diet: "none",
    location: "",
    sustainability_weight: 50,
  });
  const [mealPlan, setMealPlan] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState(null);

  const generateMealPlan = async () => {
    setIsLoading(true);
    setMealPlan(null);

    const season = getCurrentSeason();
    const seasonalIngredients = ONTARIO_SEASONAL[season].join(", ");

    const prompt = `Generate a 7-day meal plan for a Canadian household. Requirements:
- Weekly budget: $${formData.budget} CAD for ${formData.household_size} people
- Diet: ${formData.diet === "none" ? "no restrictions" : formData.diet}
- Location: ${formData.location} (Ontario, Canada)
- Sustainability weight: ${formData.sustainability_weight}/100 (higher = prefer eco-friendly options)
- Current season: ${season}
- Use these Ontario seasonal ingredients: ${seasonalIngredients}
- Follow Canada's Food Guide (vegetables & fruits, whole grains, protein foods)
- Suggest affordable local alternatives where possible

For each meal, provide: name, image description, ingredients with quantities and estimated prices, cooking instructions, cost per serving, sustainability score (0-100), and any Canadian substitution suggestions.`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          meals: {
            type: "array",
            items: {
              type: "object",
              properties: {
                day: { type: "string" },
                breakfast: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    image: { type: "string" },
                    cost_per_serving: { type: "number" },
                    sustainability_score: { type: "number" },
                    prep_time: { type: "string" },
                    ingredients: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          name: { type: "string" },
                          quantity: { type: "string" },
                          price: { type: "number" },
                        },
                      },
                    },
                    instructions: { type: "array", items: { type: "string" } },
                    substitutions: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          original: { type: "string" },
                          replacement: { type: "string" },
                          savings: { type: "number" },
                          reason: { type: "string" },
                        },
                      },
                    },
                  },
                },
                lunch: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    image: { type: "string" },
                    cost_per_serving: { type: "number" },
                    sustainability_score: { type: "number" },
                    prep_time: { type: "string" },
                    ingredients: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          name: { type: "string" },
                          quantity: { type: "string" },
                          price: { type: "number" },
                        },
                      },
                    },
                    instructions: { type: "array", items: { type: "string" } },
                    substitutions: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          original: { type: "string" },
                          replacement: { type: "string" },
                          savings: { type: "number" },
                          reason: { type: "string" },
                        },
                      },
                    },
                  },
                },
                dinner: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    image: { type: "string" },
                    cost_per_serving: { type: "number" },
                    sustainability_score: { type: "number" },
                    prep_time: { type: "string" },
                    ingredients: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          name: { type: "string" },
                          quantity: { type: "string" },
                          price: { type: "number" },
                        },
                      },
                    },
                    instructions: { type: "array", items: { type: "string" } },
                    substitutions: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          original: { type: "string" },
                          replacement: { type: "string" },
                          savings: { type: "number" },
                          reason: { type: "string" },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          total_estimated_cost: { type: "number" },
        },
      },
    });

    const recipeImages = [
      "https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=400&h=250&fit=crop",
      "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=250&fit=crop",
      "https://images.unsplash.com/photo-1547592180-85f173990554?w=400&h=250&fit=crop",
      "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400&h=250&fit=crop",
      "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=250&fit=crop",
      "https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=400&h=250&fit=crop",
      "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=250&fit=crop",
      "https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=400&h=250&fit=crop",
      "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=400&h=250&fit=crop",
    ];

    let imgIdx = 0;
    const mealsWithImages = result.meals?.map((day) => ({
      ...day,
      breakfast: { ...day.breakfast, image: recipeImages[imgIdx++ % recipeImages.length] },
      lunch: { ...day.lunch, image: recipeImages[imgIdx++ % recipeImages.length] },
      dinner: { ...day.dinner, image: recipeImages[imgIdx++ % recipeImages.length] },
    }));

    setMealPlan(mealsWithImages || []);
    setIsLoading(false);

    // Save to database
    await base44.entities.MealPlan.create({
      budget: Number(formData.budget),
      household_size: Number(formData.household_size),
      diet: formData.diet,
      location: formData.location,
      sustainability_weight: formData.sustainability_weight,
      meals: mealsWithImages,
      total_cost: result.total_estimated_cost,
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      <div className="grid lg:grid-cols-[380px_1fr] gap-8">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <PlannerForm
            formData={formData}
            setFormData={setFormData}
            onSubmit={generateMealPlan}
            isLoading={isLoading}
          />
          {mealPlan && (
            <Link to={createPageUrl("GroceryList")} className="block mt-4">
              <Button variant="outline" className="w-full h-12 rounded-xl border-[#2E7D32] text-[#2E7D32] hover:bg-green-50">
                <ShoppingCart className="w-4 h-4 mr-2" />
                View Grocery List
              </Button>
            </Link>
          )}
        </div>

        <div>
          {isLoading && <SkeletonPlan />}
          {mealPlan && !isLoading && (
            <MealPlanGrid mealPlan={mealPlan} onViewRecipe={setSelectedRecipe} />
          )}
          {!mealPlan && !isLoading && (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
              <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mb-4">
                <span className="text-3xl">🍁</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Ready to plan your week?</h3>
              <p className="text-gray-500 max-w-sm">
                Fill in your details and we'll generate a personalized meal plan using seasonal Ontario ingredients.
              </p>
            </div>
          )}
        </div>
      </div>

      <RecipeModal
        recipe={selectedRecipe}
        open={!!selectedRecipe}
        onClose={() => setSelectedRecipe(null)}
      />
    </div>
  );
}