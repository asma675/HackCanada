import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Sparkles, Heart, BookMarked, Loader2, RefreshCw, Star, Leaf, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";

export default function PersonalizedFeed() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState(null);

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      if (u) {
        base44.entities.UserProfile.filter({ user_email: u.email }).then(profiles => {
          if (profiles.length > 0) setProfile(profiles[0]);
        });
      }
    }).catch(() => {});
  }, []);

  const { data: mealPlans = [] } = useQuery({
    queryKey: ["mealPlansForFeed"],
    queryFn: () => base44.entities.MealPlan.list("-created_date", 5),
    enabled: !!user,
  });

  const { data: savedRecipes = [] } = useQuery({
    queryKey: ["savedRecipesForFeed"],
    queryFn: () => base44.entities.SavedRecipe.list("-created_date", 10),
    enabled: !!user,
  });

  const { data: communityRecipes = [] } = useQuery({
    queryKey: ["communityRecipesForFeed"],
    queryFn: () => base44.entities.CommunityRecipe.list("-avg_rating", 20),
  });

  const generateSuggestions = async () => {
    setLoading(true);
    setSuggestions([]);

    const recentMeals = mealPlans.flatMap(p => p.meals || []).slice(0, 10).map(m => [m.breakfast?.name, m.lunch?.name, m.dinner?.name]).flat().filter(Boolean);
    const favRecipes = profile?.favorited_recipe_ids?.length > 0
      ? communityRecipes.filter(r => profile.favorited_recipe_ids.includes(r.id)).map(r => r.name)
      : [];
    const dietPrefs = profile?.dietary_preferences || [];

    const prompt = `You are a Canadian nutrition AI for the Savoura app. Based on this user's data, suggest 6 personalized recipes.

User data:
- Recent meals: ${recentMeals.join(", ") || "none yet"}
- Favorited community recipes: ${favRecipes.join(", ") || "none yet"}
- Dietary preferences: ${dietPrefs.join(", ") || "no restrictions"}
- Saved recipes: ${savedRecipes.map(r => r.name).join(", ") || "none yet"}

Create 6 unique recipe suggestions that:
1. Complement their history without repeating recent meals
2. Match their dietary preferences
3. Use Ontario seasonal ingredients (current season: spring)
4. Are budget-friendly (under $5/serving)
5. Balance nutrition per Canada's Food Guide

For each recipe provide name, meal_type, reason (why this is personalized for them), estimated cost_per_serving, sustainability_score, prep_time, and 5 key ingredients.`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          suggestions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                meal_type: { type: "string" },
                reason: { type: "string" },
                cost_per_serving: { type: "number" },
                sustainability_score: { type: "number" },
                prep_time: { type: "string" },
                key_ingredients: { type: "array", items: { type: "string" } }
              }
            }
          }
        }
      }
    });

    setSuggestions(result.suggestions || []);
    setLoading(false);
  };

  const mealImages = [
    "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=250&fit=crop",
    "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400&h=250&fit=crop",
    "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=250&fit=crop",
    "https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=400&h=250&fit=crop",
    "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=250&fit=crop",
    "https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=400&h=250&fit=crop",
  ];

  const mealTypeColors = {
    breakfast: "bg-amber-100 text-amber-700",
    lunch: "bg-blue-100 text-blue-700",
    dinner: "bg-purple-100 text-purple-700",
    snack: "bg-green-100 text-green-700",
  };

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="w-20 h-20 rounded-full maple-gradient flex items-center justify-center mx-auto mb-6 shadow-xl">
          <Sparkles className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-3">Personalized For You</h1>
        <p className="text-gray-500 mb-8 max-w-md mx-auto">Log in to get AI-powered recipe suggestions tailored to your taste, dietary preferences, and meal history.</p>
        <Button onClick={() => base44.auth.redirectToLogin()} className="maple-gradient text-white rounded-xl px-8 py-3">
          Login to Get Started
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Sparkles className="w-7 h-7 text-[#D52B1E]" />
            For You
          </h1>
          <p className="text-gray-500 mt-1">AI-powered suggestions based on your taste and history</p>
        </div>
        <Button onClick={generateSuggestions} disabled={loading} className="maple-gradient text-white rounded-xl px-6">
          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
          {loading ? "Personalizing..." : suggestions.length > 0 ? "Refresh Suggestions" : "Get My Suggestions"}
        </Button>
      </div>

      {/* Profile summary */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: "Meal Plans", value: mealPlans.length, icon: "🗓️" },
          { label: "Favorited", value: (profile?.favorited_recipe_ids || []).length, icon: "❤️" },
          { label: "Saved Recipes", value: (profile?.saved_community_recipe_ids || []).length, icon: "🔖" },
        ].map(stat => (
          <div key={stat.label} className="bg-white rounded-2xl border border-gray-100 p-4 text-center shadow-sm">
            <div className="text-2xl mb-1">{stat.icon}</div>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-xs text-gray-500">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Suggestions */}
      {!loading && suggestions.length === 0 && (
        <div className="text-center py-20">
          <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-10 h-10 text-[#D52B1E]" />
          </div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Ready for personalized picks?</h3>
          <p className="text-gray-400 max-w-sm mx-auto mb-6">Our AI analyzes your meal history, saved recipes, and dietary preferences to suggest recipes you'll love.</p>
          <Button onClick={generateSuggestions} className="maple-gradient text-white rounded-xl px-8">
            <Sparkles className="w-4 h-4 mr-2" /> Generate My Suggestions
          </Button>
        </div>
      )}

      {loading && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => <div key={i} className="h-72 bg-gray-100 rounded-2xl animate-pulse" />)}
        </div>
      )}

      {!loading && suggestions.length > 0 && (
        <motion.div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {suggestions.map((recipe, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-all group cursor-pointer"
              onClick={() => setSelectedRecipe(selectedRecipe === i ? null : i)}
            >
              <div className="relative h-44 overflow-hidden">
                <img src={mealImages[i % mealImages.length]} alt={recipe.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <div className="absolute top-2 left-2 flex items-center gap-1 bg-[#D52B1E] text-white text-xs px-2 py-1 rounded-full">
                  <Sparkles className="w-3 h-3" /> AI Pick
                </div>
                {recipe.meal_type && (
                  <Badge className={`absolute top-2 right-2 capitalize ${mealTypeColors[recipe.meal_type] || "bg-gray-100"}`}>
                    {recipe.meal_type}
                  </Badge>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-bold text-gray-900 mb-1">{recipe.name}</h3>
                <div className="flex items-center gap-3 text-xs text-gray-500 mb-2">
                  {recipe.prep_time && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{recipe.prep_time}</span>}
                  {recipe.cost_per_serving > 0 && <span className="text-green-600 font-medium">${recipe.cost_per_serving?.toFixed(2)}/serving</span>}
                  {recipe.sustainability_score > 0 && <span className="flex items-center gap-1 text-[#2E7D32]"><Leaf className="w-3 h-3" />{recipe.sustainability_score}</span>}
                </div>
                <p className="text-xs text-[#D52B1E] font-medium italic line-clamp-2 mb-2">💡 {recipe.reason}</p>

                {selectedRecipe === i && recipe.key_ingredients?.length > 0 && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="border-t pt-3 mt-2">
                    <p className="text-xs font-semibold text-gray-600 mb-2">Key Ingredients:</p>
                    <div className="flex flex-wrap gap-1">
                      {recipe.key_ingredients.map((ing, j) => (
                        <span key={j} className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">{ing}</span>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}