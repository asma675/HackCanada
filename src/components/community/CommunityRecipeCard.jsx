import React from "react";
import { Star, Bookmark, Heart, Clock, Leaf, ShieldCheck, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function CommunityRecipeCard({ recipe, user, profile, onView, onFavorite, onSave }) {
  const isFavorited = profile?.favorited_recipe_ids?.includes(recipe.id);
  const isSaved = profile?.saved_community_recipe_ids?.includes(recipe.id);

  const mealColors = {
    breakfast: "bg-amber-100 text-amber-700",
    lunch: "bg-blue-100 text-blue-700",
    dinner: "bg-purple-100 text-purple-700",
    snack: "bg-green-100 text-green-700",
  };

  const images = [
    "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=250&fit=crop",
    "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400&h=250&fit=crop",
    "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=250&fit=crop",
    "https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=400&h=250&fit=crop",
    "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=250&fit=crop",
  ];
  const fallbackImg = images[recipe.name?.length % images.length || 0];

  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-all group">
      <div className="relative h-44 cursor-pointer overflow-hidden" onClick={onView}>
        <img
          src={recipe.image_url || fallbackImg}
          alt={recipe.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={e => { e.target.src = fallbackImg; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        {recipe.ai_vetted && (
          <div className="absolute top-2 left-2 flex items-center gap-1 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-medium">
            <ShieldCheck className="w-3 h-3" /> Recommended
          </div>
        )}
        {recipe.key_seasonal_ingredient && recipe.season_available_until && (
          <div className="absolute bottom-10 left-2 flex items-center gap-1 bg-amber-500/90 text-white text-xs px-2 py-0.5 rounded-full">
            🍂 {recipe.key_seasonal_ingredient} in season
          </div>
        )}
        {recipe.meal_type && (
          <Badge className={`absolute top-2 right-2 capitalize ${mealColors[recipe.meal_type] || "bg-gray-100 text-gray-600"}`}>
            {recipe.meal_type}
          </Badge>
        )}
        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
          {recipe.avg_rating > 0 && (
            <span className="flex items-center gap-1 bg-white/90 text-amber-500 text-xs px-2 py-0.5 rounded-full font-medium">
              <Star className="w-3 h-3 fill-amber-400" /> {recipe.avg_rating?.toFixed(1)} ({recipe.rating_count})
            </span>
          )}
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-bold text-gray-900 mb-1 line-clamp-1 cursor-pointer hover:text-[#D52B1E]" onClick={onView}>{recipe.name}</h3>
        {recipe.description && <p className="text-xs text-gray-500 line-clamp-2 mb-3">{recipe.description}</p>}

        <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
          {recipe.prep_time && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{recipe.prep_time}</span>}
          {recipe.cost_per_serving && <span className="text-green-600 font-medium">${recipe.cost_per_serving?.toFixed(2)}/serving</span>}
          {recipe.sustainability_score && (
            <span className="flex items-center gap-1 text-[#2E7D32]">
              <Leaf className="w-3 h-3" />{recipe.sustainability_score}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400 truncate max-w-[100px]">by {recipe.author_name || "Anonymous"}</span>
          <div className="flex items-center gap-1">
            <button onClick={onFavorite} className={`p-1.5 rounded-lg transition-all ${isFavorited ? "text-red-500 bg-red-50" : "text-gray-400 hover:text-red-400 hover:bg-red-50"}`}>
              <Heart className={`w-4 h-4 ${isFavorited ? "fill-red-500" : ""}`} />
            </button>
            <button onClick={onSave} className={`p-1.5 rounded-lg transition-all ${isSaved ? "text-[#2E7D32] bg-green-50" : "text-gray-400 hover:text-green-500 hover:bg-green-50"}`}>
              <Bookmark className={`w-4 h-4 ${isSaved ? "fill-[#2E7D32]" : ""}`} />
            </button>
            <Button onClick={onView} size="sm" variant="outline" className="rounded-lg text-xs ml-1">View</Button>
          </div>
        </div>
      </div>
    </div>
  );
}