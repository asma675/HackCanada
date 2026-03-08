import React, { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { DollarSign, Leaf, AlertTriangle, ArrowRight, Clock } from "lucide-react";
import NutritionPanel from "./NutritionPanel";

const TABS = ["Recipe", "Nutrition"];

export default function RecipeModal({ recipe, open, onClose }) {
  const [tab, setTab] = useState("Recipe");

  if (!recipe) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => { onClose(); setTab("Recipe"); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 rounded-2xl">
        {/* Hero image */}
        <div className="relative h-56 md:h-64 overflow-hidden rounded-t-2xl">
          <img
            src={recipe.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&h=400&fit=crop"}
            alt={recipe.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-4 left-6 right-6">
            <DialogTitle className="text-2xl font-bold text-white">{recipe.name}</DialogTitle>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <Badge className="bg-white/20 text-white border-0 backdrop-blur-sm">
                <DollarSign className="w-3 h-3 mr-1" />
                ${recipe.cost_per_serving?.toFixed(2)}/serving
              </Badge>
              <Badge className="bg-white/20 text-white border-0 backdrop-blur-sm">
                <Leaf className="w-3 h-3 mr-1" />
                {recipe.sustainability_score}% sustainable
              </Badge>
              {recipe.prep_time && (
                <Badge className="bg-white/20 text-white border-0 backdrop-blur-sm">
                  <Clock className="w-3 h-3 mr-1" />
                  {recipe.prep_time}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 px-6 pt-2">
          {TABS.map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${tab === t ? "border-[#D52B1E] text-[#D52B1E]" : "border-transparent text-gray-400 hover:text-gray-700"}`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="p-6">
          {tab === "Recipe" && (
            <div className="space-y-6">
              {/* Ingredients */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">Ingredients</h3>
                <div className="grid sm:grid-cols-2 gap-2">
                  {recipe.ingredients?.map((ing, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <span className="text-sm text-gray-700">{ing.quantity} {ing.name}</span>
                      {ing.price && <span className="text-xs text-gray-400">${ing.price.toFixed(2)}</span>}
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Instructions */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">Instructions</h3>
                <ol className="space-y-3">
                  {recipe.instructions?.map((step, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="flex-shrink-0 w-7 h-7 rounded-full bg-red-50 text-[#D52B1E] text-sm font-bold flex items-center justify-center">
                        {i + 1}
                      </span>
                      <span className="text-sm text-gray-600 pt-1">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Substitutions */}
              {recipe.substitutions?.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-amber-500" />
                      Canadian Alternatives
                    </h3>
                    <div className="space-y-3">
                      {recipe.substitutions.map((sub, i) => (
                        <div key={i} className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                          <div className="flex items-center gap-2 text-sm">
                            <span className="font-medium text-gray-700">{sub.original}</span>
                            <ArrowRight className="w-4 h-4 text-amber-500" />
                            <span className="font-semibold text-[#2E7D32]">{sub.replacement}</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {sub.reason} — Save ${sub.savings?.toFixed(2)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {tab === "Nutrition" && <NutritionPanel recipe={recipe} />}
        </div>
      </DialogContent>
    </Dialog>
  );
}