import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Star, Bookmark, Users, ChefHat, EyeOff, Eye } from "lucide-react";
import { motion } from "framer-motion";
import CommunityRecipeCard from "../components/community/CommunityRecipeCard";
import ShareRecipeModal from "../components/community/ShareRecipeModal";
import RecipeDetailModal from "../components/community/RecipeDetailModal";

export default function Community() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [showShare, setShowShare] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [search, setSearch] = useState("");
  const [filterMeal, setFilterMeal] = useState("all");
  const [showOutOfSeason, setShowOutOfSeason] = useState(false);
  const queryClient = useQueryClient();

  const isInSeason = (recipe) => {
    if (!recipe.season_available_until) return true; // no expiry set = always in season
    return new Date(recipe.season_available_until) >= new Date();
  };

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      if (u) {
        base44.entities.UserProfile.filter({ user_email: u.email }).then(profiles => {
          if (profiles.length > 0) setProfile(profiles[0]);
          else base44.entities.UserProfile.create({ user_email: u.email, display_name: u.full_name, favorited_recipe_ids: [], saved_community_recipe_ids: [] }).then(p => setProfile(p));
        });
      }
    }).catch(() => {});
  }, []);

  const { data: recipes = [], isLoading } = useQuery({
    queryKey: ["communityRecipes"],
    queryFn: () => base44.entities.CommunityRecipe.list("-created_date", 50),
  });

  const toggleFavoriteMutation = useMutation({
    mutationFn: async (recipeId) => {
      if (!profile) return;
      const favs = profile.favorited_recipe_ids || [];
      const updated = favs.includes(recipeId) ? favs.filter(id => id !== recipeId) : [...favs, recipeId];
      return base44.entities.UserProfile.update(profile.id, { favorited_recipe_ids: updated });
    },
    onSuccess: (updated) => { setProfile(updated); queryClient.invalidateQueries(["communityRecipes"]); }
  });

  const saveToPlanMutation = useMutation({
    mutationFn: async (recipeId) => {
      if (!profile) return;
      const saved = profile.saved_community_recipe_ids || [];
      if (!saved.includes(recipeId)) {
        await base44.entities.CommunityRecipe.update(recipeId, { save_count: (recipes.find(r => r.id === recipeId)?.save_count || 0) + 1 });
        return base44.entities.UserProfile.update(profile.id, { saved_community_recipe_ids: [...saved, recipeId] });
      }
    },
    onSuccess: (updated) => { if (updated) { setProfile(updated); queryClient.invalidateQueries(["communityRecipes"]); } }
  });

  const inSeasonRecipes = recipes.filter(r => isInSeason(r));
  const outOfSeasonRecipes = recipes.filter(r => !isInSeason(r));

  const filtered = (showOutOfSeason ? outOfSeasonRecipes : inSeasonRecipes).filter(r => {
    const matchesSearch = !search || r.name?.toLowerCase().includes(search.toLowerCase()) || r.description?.toLowerCase().includes(search.toLowerCase());
    const matchesMeal = filterMeal === "all" || r.meal_type === filterMeal;
    return matchesSearch && matchesMeal;
  });

  const mealFilters = ["all", "breakfast", "lunch", "dinner", "snack"];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-8 h-8 text-[#D52B1E]" />
            Community Recipes
          </h1>
          <p className="text-gray-500 mt-1">Discover and share sustainable recipes from Canadians like you</p>
        </div>
        {user && (
          <Button onClick={() => setShowShare(true)} className="maple-gradient text-white rounded-xl px-6">
            <Plus className="w-4 h-4 mr-2" /> Share a Recipe
          </Button>
        )}
        {!user && (
          <Button onClick={() => base44.auth.redirectToLogin()} variant="outline" className="border-[#D52B1E] text-[#D52B1E] rounded-xl px-6">
            Login to Share
          </Button>
        )}
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: "In Season Now", value: inSeasonRecipes.length, icon: ChefHat, color: "text-[#D52B1E]", bg: "bg-red-50" },
          { label: "Recommended", value: recipes.filter(r => r.ai_vetted).length, icon: Star, color: "text-yellow-500", bg: "bg-yellow-50" },
          { label: "Total Saves", value: recipes.reduce((s, r) => s + (r.save_count || 0), 0), icon: Bookmark, color: "text-[#2E7D32]", bg: "bg-green-50" },
        ].map(stat => (
          <div key={stat.label} className={`${stat.bg} rounded-2xl p-4 text-center`}>
            <stat.icon className={`w-5 h-5 ${stat.color} mx-auto mb-1`} />
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-xs text-gray-500">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Season toggle banner */}
      <div className={`flex items-center justify-between rounded-2xl px-4 py-3 mb-4 ${showOutOfSeason ? "bg-gray-100 border border-gray-200" : "bg-green-50 border border-green-100"}`}>
        <div className="flex items-center gap-2">
          {showOutOfSeason ? <EyeOff className="w-4 h-4 text-gray-500" /> : <Eye className="w-4 h-4 text-green-600" />}
          <span className="text-sm font-medium text-gray-700">
            {showOutOfSeason
              ? `Showing ${outOfSeasonRecipes.length} out-of-season recipes (ingredients unavailable right now)`
              : `Showing ${inSeasonRecipes.length} in-season recipes — made with ingredients available locally right now 🌿`}
          </span>
        </div>
        <button
          onClick={() => setShowOutOfSeason(s => !s)}
          className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${showOutOfSeason ? "bg-white text-gray-600 border border-gray-200" : "bg-green-600 text-white"}`}
        >
          {showOutOfSeason ? "Back to In Season" : `See Out-of-Season (${outOfSeasonRecipes.length})`}
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search recipes..." className="pl-9 rounded-xl" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {mealFilters.map(f => (
            <button key={f} onClick={() => setFilterMeal(f)} className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all ${filterMeal === f ? "maple-gradient text-white shadow-sm" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => <div key={i} className="h-64 bg-gray-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-24">
          <ChefHat className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">No recipes yet</h3>
          <p className="text-gray-400">Be the first to share a recipe with the community!</p>
        </div>
      ) : (
        <motion.div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {filtered.map((recipe, i) => (
            <motion.div key={recipe.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <CommunityRecipeCard
                recipe={recipe}
                user={user}
                profile={profile}
                onView={() => setSelectedRecipe(recipe)}
                onFavorite={() => user ? toggleFavoriteMutation.mutate(recipe.id) : base44.auth.redirectToLogin()}
                onSave={() => user ? saveToPlanMutation.mutate(recipe.id) : base44.auth.redirectToLogin()}
              />
            </motion.div>
          ))}
        </motion.div>
      )}

      <ShareRecipeModal open={showShare} onClose={() => setShowShare(false)} user={user} onSuccess={() => { setShowShare(false); queryClient.invalidateQueries(["communityRecipes"]); }} />
      <RecipeDetailModal recipe={selectedRecipe} open={!!selectedRecipe} onClose={() => setSelectedRecipe(null)} user={user} profile={profile} onSave={() => saveToPlanMutation.mutate(selectedRecipe?.id)} />
    </div>
  );
}