import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star, Bookmark, Heart, Clock, Leaf, DollarSign, ShieldCheck, X, ChefHat } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function RecipeDetailModal({ recipe, open, onClose, user, profile, onSave }) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [review, setReview] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const isSaved = profile?.saved_community_recipe_ids?.includes(recipe?.id);

  if (!recipe) return null;

  const handleRate = async () => {
    if (!user || rating === 0) return;
    setSubmitting(true);
    await base44.entities.RecipeRating.create({ recipe_id: recipe.id, user_email: user.email, rating, review });
    const newCount = (recipe.rating_count || 0) + 1;
    const newAvg = ((recipe.avg_rating || 0) * (recipe.rating_count || 0) + rating) / newCount;
    await base44.entities.CommunityRecipe.update(recipe.id, { avg_rating: Math.round(newAvg * 10) / 10, rating_count: newCount });
    setSubmitting(false);
    setSubmitted(true);
  };

  const images = [
    "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&h=400&fit=crop",
    "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800&h=400&fit=crop",
    "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&h=400&fit=crop",
  ];
  const fallbackImg = images[recipe.name?.length % images.length || 0];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        <div className="relative h-56 overflow-hidden rounded-t-xl">
          <img src={recipe.image_url || fallbackImg} alt={recipe.name} className="w-full h-full object-cover" onError={e => { e.target.src = fallbackImg; }} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <button onClick={onClose} className="absolute top-3 right-3 w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30">
            <X className="w-4 h-4" />
          </button>
          {recipe.ai_vetted && (
            <div className="absolute top-3 left-3 flex items-center gap-1 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
              <ShieldCheck className="w-3 h-3" /> AI Vetted
            </div>
          )}
          <div className="absolute bottom-3 left-4 right-4">
            <h2 className="text-white font-bold text-xl mb-1">{recipe.name}</h2>
            <div className="flex items-center gap-2 flex-wrap">
              {recipe.meal_type && <Badge className="bg-white/20 text-white border-white/30 capitalize">{recipe.meal_type}</Badge>}
              <span className="text-white/80 text-xs">by {recipe.author_name}</span>
            </div>
          </div>
        </div>

        <div className="p-5 space-y-5">
          {/* Stats row */}
          <div className="flex items-center gap-4 flex-wrap">
            {recipe.avg_rating > 0 && <span className="flex items-center gap-1 text-amber-500 text-sm"><Star className="w-4 h-4 fill-amber-400" />{recipe.avg_rating?.toFixed(1)} ({recipe.rating_count} ratings)</span>}
            {recipe.prep_time && <span className="flex items-center gap-1 text-gray-500 text-sm"><Clock className="w-4 h-4" />{recipe.prep_time}</span>}
            {recipe.cost_per_serving > 0 && <span className="flex items-center gap-1 text-green-600 text-sm font-medium"><DollarSign className="w-4 h-4" />${recipe.cost_per_serving?.toFixed(2)}/serving</span>}
            {recipe.sustainability_score > 0 && <span className="flex items-center gap-1 text-[#2E7D32] text-sm"><Leaf className="w-4 h-4" />{recipe.sustainability_score} eco score</span>}
          </div>

          {recipe.description && <p className="text-gray-600 text-sm">{recipe.description}</p>}

          {recipe.ai_feedback && (
            <div className="bg-green-50 border border-green-100 rounded-xl p-3 text-sm text-green-700">
              <div className="flex items-center gap-2 mb-1"><ShieldCheck className="w-4 h-4" /><strong>AI Assessment</strong></div>
              <p>{recipe.ai_feedback}</p>
            </div>
          )}

          {/* Ingredients */}
          {recipe.ingredients?.length > 0 && (
            <div>
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2"><ChefHat className="w-4 h-4 text-[#D52B1E]" />Ingredients</h3>
              <div className="grid grid-cols-2 gap-2">
                {recipe.ingredients.map((ing, i) => (
                  <div key={i} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 text-sm">
                    <span className="text-gray-800">{ing.name}</span>
                    <span className="text-gray-500 text-xs">{ing.quantity}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Instructions */}
          {recipe.instructions?.length > 0 && (
            <div>
              <h3 className="font-bold text-gray-900 mb-3">Instructions</h3>
              <ol className="space-y-3">
                {recipe.instructions.map((step, i) => (
                  <li key={i} className="flex gap-3 text-sm text-gray-700">
                    <span className="w-6 h-6 rounded-full bg-red-100 text-[#D52B1E] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Save button */}
          <Button onClick={onSave} variant={isSaved ? "secondary" : "default"} className={`w-full rounded-xl ${!isSaved ? "maple-gradient text-white" : ""}`}>
            <Bookmark className={`w-4 h-4 mr-2 ${isSaved ? "fill-current" : ""}`} />
            {isSaved ? "Saved to Your Plan" : "Save to My Plan"}
          </Button>

          {/* Rating */}
          {user && !submitted && (
            <div className="border-t pt-4">
              <h3 className="font-semibold text-gray-800 mb-3">Rate this recipe</h3>
              <div className="flex gap-1 mb-3">
                {[1, 2, 3, 4, 5].map(s => (
                  <button key={s} onMouseEnter={() => setHoverRating(s)} onMouseLeave={() => setHoverRating(0)} onClick={() => setRating(s)} className="transition-transform hover:scale-110">
                    <Star className={`w-7 h-7 ${s <= (hoverRating || rating) ? "text-amber-400 fill-amber-400" : "text-gray-300"}`} />
                  </button>
                ))}
              </div>
              <Textarea value={review} onChange={e => setReview(e.target.value)} placeholder="Leave a review (optional)..." className="rounded-xl resize-none h-20 mb-3" />
              <Button onClick={handleRate} disabled={rating === 0 || submitting} variant="outline" className="rounded-xl border-amber-300 text-amber-600 hover:bg-amber-50">
                {submitting ? "Submitting..." : "Submit Rating"}
              </Button>
            </div>
          )}
          {submitted && (
            <div className="border-t pt-4 text-center text-green-600 font-medium text-sm">
              ✓ Thanks for your rating!
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}