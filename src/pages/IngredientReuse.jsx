import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import RecipeModal from "../components/planner/RecipeModal";
import { Search, Plus, X, UtensilsCrossed, Leaf, DollarSign, Sparkles, Loader2 } from "lucide-react";

const COMMON_INGREDIENTS = [
  "chicken", "rice", "potatoes", "onions", "garlic", "eggs",
  "pasta", "tomatoes", "carrots", "cheese", "bread", "beans",
  "broccoli", "ground beef", "yogurt", "butter",
];

export default function IngredientReuse() {
  const [inputValue, setInputValue] = useState("");
  const [ingredients, setIngredients] = useState([]);
  const [recipes, setRecipes] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState(null);

  const addIngredient = (ing) => {
    const trimmed = ing.trim().toLowerCase();
    if (trimmed && !ingredients.includes(trimmed)) {
      setIngredients([...ingredients, trimmed]);
    }
    setInputValue("");
  };

  const removeIngredient = (ing) => {
    setIngredients(ingredients.filter((i) => i !== ing));
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && inputValue.trim()) {
      addIngredient(inputValue);
    }
  };

  const findRecipes = async () => {
    setIsLoading(true);
    setRecipes(null);

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `I have these ingredients at home: ${ingredients.join(", ")}. 
Suggest 6 recipes I can make using primarily these ingredients. 
Focus on affordable, healthy Canadian-style meals using Ontario seasonal produce where possible.
Follow Canada's Food Guide principles. 
For each recipe include the name, a brief description, all ingredients with quantities and estimated prices in CAD, step-by-step instructions, cost per serving, and a sustainability score.`,
      response_json_schema: {
        type: "object",
        properties: {
          recipes: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                description: { type: "string" },
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
                      already_have: { type: "boolean" },
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
    });

    const recipeImages = [
      "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&h=250&fit=crop",
      "https://images.unsplash.com/photo-1551326844-4df70f78d0e9?w=400&h=250&fit=crop",
      "https://images.unsplash.com/photo-1543339308-d595c4e29c2f?w=400&h=250&fit=crop",
      "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=250&fit=crop",
      "https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?w=400&h=250&fit=crop",
      "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&h=250&fit=crop",
    ];

    const withImages = result.recipes?.map((r, i) => ({
      ...r,
      image: recipeImages[i % recipeImages.length],
    }));

    setRecipes(withImages || []);
    setIsLoading(false);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 md:py-12">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-50 text-[#2E7D32] text-sm font-medium mb-4">
          <Leaf className="w-4 h-4" />
          Reduce food waste
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
          Cook with what you have
        </h1>
        <p className="text-gray-500 max-w-lg mx-auto">
          Tell us what's in your fridge and pantry, and we'll suggest delicious recipes to minimize waste.
        </p>
      </div>

      {/* Input area */}
      <div className="max-w-2xl mx-auto mb-10">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type an ingredient and press Enter..."
                className="pl-10 h-12 rounded-xl border-gray-200"
              />
            </div>
            <Button
              onClick={() => addIngredient(inputValue)}
              disabled={!inputValue.trim()}
              className="h-12 px-4 rounded-xl maple-gradient text-white"
            >
              <Plus className="w-5 h-5" />
            </Button>
          </div>

          {/* Quick add */}
          <div className="mt-4">
            <p className="text-xs text-gray-400 mb-2">Quick add:</p>
            <div className="flex flex-wrap gap-2">
              {COMMON_INGREDIENTS.filter((i) => !ingredients.includes(i)).slice(0, 8).map((ing) => (
                <button
                  key={ing}
                  onClick={() => addIngredient(ing)}
                  className="px-3 py-1.5 rounded-full bg-gray-50 text-sm text-gray-600 hover:bg-red-50 hover:text-[#D52B1E] transition-colors border border-gray-100"
                >
                  + {ing}
                </button>
              ))}
            </div>
          </div>

          {/* Selected ingredients */}
          {ingredients.length > 0 && (
            <div className="mt-5 pt-5 border-t border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-gray-700">
                  Your ingredients ({ingredients.length})
                </p>
                <button
                  onClick={() => setIngredients([])}
                  className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                >
                  Clear all
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                <AnimatePresence>
                  {ingredients.map((ing) => (
                    <motion.div
                      key={ing}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                    >
                      <Badge className="bg-red-50 text-[#D52B1E] border-red-100 border px-3 py-1.5 text-sm gap-1.5 cursor-pointer hover:bg-red-100 transition-colors">
                        {ing}
                        <X className="w-3 h-3" onClick={() => removeIngredient(ing)} />
                      </Badge>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}

          <Button
            onClick={findRecipes}
            disabled={ingredients.length === 0 || isLoading}
            className="w-full mt-6 h-12 rounded-xl maple-gradient text-white shadow-lg shadow-red-200/40"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Finding recipes...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                Find Recipes
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <Skeleton className="h-44 w-full" />
              <div className="p-4 space-y-3">
                <Skeleton className="h-5 w-3/4 rounded" />
                <Skeleton className="h-4 w-full rounded" />
                <Skeleton className="h-4 w-1/2 rounded" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Results */}
      {recipes && !isLoading && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Recipes you can make ({recipes.length})
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {recipes.map((recipe, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer group"
                onClick={() => setSelectedRecipe(recipe)}
              >
                <div className="relative h-44 overflow-hidden">
                  <img
                    src={recipe.image}
                    alt={recipe.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-green-100 text-green-700 border-0">
                      <Leaf className="w-3 h-3 mr-1" />
                      {recipe.sustainability_score}%
                    </Badge>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-gray-900 mb-1">{recipe.name}</h3>
                  <p className="text-sm text-gray-500 line-clamp-2 mb-3">{recipe.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center text-sm text-gray-500">
                      <DollarSign className="w-4 h-4 mr-0.5" />
                      ${recipe.cost_per_serving?.toFixed(2)}/serving
                    </span>
                    <span className="text-xs text-gray-400">{recipe.prep_time}</span>
                  </div>
                  {recipe.ingredients && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {recipe.ingredients.filter((i) => i.already_have).slice(0, 4).map((ing, idx) => (
                        <Badge key={idx} variant="secondary" className="bg-green-50 text-green-600 border-0 text-xs">
                          ✓ {ing.name}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!recipes && !isLoading && (
        <div className="text-center py-12">
          <div className="w-20 h-20 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-4">
            <UtensilsCrossed className="w-8 h-8 text-gray-300" />
          </div>
          <p className="text-gray-400">Add ingredients above to discover recipes</p>
        </div>
      )}

      <RecipeModal
        recipe={selectedRecipe}
        open={!!selectedRecipe}
        onClose={() => setSelectedRecipe(null)}
      />
    </div>
  );
}