import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Heart, Zap, Beef, Wheat, Droplets, AlertCircle, CheckCircle2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NutritionPanel({ recipe }) {
  const [nutrition, setNutrition] = useState(null);
  const [loading, setLoading] = useState(false);

  const analyze = async () => {
    setLoading(true);
    const ingredientList = recipe.ingredients?.map(i => `${i.quantity} ${i.name}`).join(", ") || recipe.name;
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Analyze the nutrition for this recipe: "${recipe.name}".
Ingredients: ${ingredientList}.
Servings: estimate per serving.

Provide realistic macros per serving, a health rating, and a clear explanation of health benefits and any concerns. Be specific to Canadian dietary guidelines.`,
      response_json_schema: {
        type: "object",
        properties: {
          calories: { type: "number" },
          protein_g: { type: "number" },
          carbs_g: { type: "number" },
          fat_g: { type: "number" },
          fiber_g: { type: "number" },
          sodium_mg: { type: "number" },
          sugar_g: { type: "number" },
          health_rating: { type: "number", description: "0-100 health score" },
          health_verdict: { type: "string", description: "1 sentence overall verdict like Good/Fair/Excellent" },
          benefits: { type: "array", items: { type: "string" }, description: "3-4 specific health benefits" },
          concerns: { type: "array", items: { type: "string" }, description: "1-2 concerns or things to watch, empty if none" },
          ai_tip: { type: "string", description: "One practical tip to make this meal even healthier" },
        }
      }
    });
    setNutrition(result);
    setLoading(false);
  };

  const MacroBar = ({ label, value, unit, max, color }) => {
    const pct = Math.min((value / max) * 100, 100);
    return (
      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span className="text-gray-600 font-medium">{label}</span>
          <span className="font-bold text-gray-800">{value}{unit}</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: color }} />
        </div>
      </div>
    );
  };

  if (!nutrition && !loading) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-3">
          <Heart className="w-8 h-8 text-green-600" />
        </div>
        <p className="text-gray-500 text-sm mb-4">Get a full nutrition breakdown and AI health assessment for this recipe.</p>
        <Button onClick={analyze} className="bg-green-600 hover:bg-green-700 text-white rounded-xl px-6">
          <Zap className="w-4 h-4 mr-2" /> Analyze Nutrition
        </Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
        <p className="text-sm text-gray-500">Analyzing nutrition with AI…</p>
      </div>
    );
  }

  const healthColor = nutrition.health_rating >= 75 ? "#2E7D32" : nutrition.health_rating >= 50 ? "#E65100" : "#B71C1C";

  return (
    <div className="space-y-5">
      {/* Health Score */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-4 border border-green-100 flex items-center gap-4">
        <div className="relative w-16 h-16 shrink-0">
          <svg viewBox="0 0 36 36" className="w-16 h-16 -rotate-90">
            <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e5e7eb" strokeWidth="3" />
            <circle cx="18" cy="18" r="15.9" fill="none" stroke={healthColor} strokeWidth="3"
              strokeDasharray={`${nutrition.health_rating} 100`} strokeLinecap="round" />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm font-black" style={{ color: healthColor }}>{nutrition.health_rating}</span>
          </div>
        </div>
        <div>
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">AI Health Score</p>
          <p className="text-base font-bold text-gray-900">{nutrition.health_verdict}</p>
          {nutrition.ai_tip && (
            <p className="text-xs text-green-700 mt-1 flex items-start gap-1">
              <Info className="w-3 h-3 mt-0.5 shrink-0" /> {nutrition.ai_tip}
            </p>
          )}
        </div>
      </div>

      {/* Calories + macros */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-bold text-gray-800">Nutrition per serving</h4>
          <span className="text-2xl font-black text-gray-900">{nutrition.calories} <span className="text-sm font-medium text-gray-400">kcal</span></span>
        </div>
        <div className="space-y-3">
          <MacroBar label="Protein" value={nutrition.protein_g} unit="g" max={60} color="#D52B1E" />
          <MacroBar label="Carbohydrates" value={nutrition.carbs_g} unit="g" max={120} color="#E65100" />
          <MacroBar label="Fat" value={nutrition.fat_g} unit="g" max={60} color="#F9A825" />
          <MacroBar label="Fibre" value={nutrition.fiber_g} unit="g" max={30} color="#2E7D32" />
        </div>
        <div className="flex gap-3 mt-3">
          <div className="flex-1 bg-gray-50 rounded-xl px-3 py-2 text-center">
            <p className="text-xs text-gray-400">Sugar</p>
            <p className="text-sm font-bold text-gray-800">{nutrition.sugar_g}g</p>
          </div>
          <div className="flex-1 bg-gray-50 rounded-xl px-3 py-2 text-center">
            <p className="text-xs text-gray-400">Sodium</p>
            <p className="text-sm font-bold text-gray-800">{nutrition.sodium_mg}mg</p>
          </div>
        </div>
      </div>

      {/* Benefits */}
      {nutrition.benefits?.length > 0 && (
        <div>
          <h4 className="text-sm font-bold text-gray-800 mb-2 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-green-600" /> Health Benefits
          </h4>
          <ul className="space-y-1.5">
            {nutrition.benefits.map((b, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-gray-700 bg-green-50 rounded-lg px-3 py-2">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1 shrink-0" />
                {b}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Concerns */}
      {nutrition.concerns?.length > 0 && (
        <div>
          <h4 className="text-sm font-bold text-gray-800 mb-2 flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-amber-500" /> Things to Note
          </h4>
          <ul className="space-y-1.5">
            {nutrition.concerns.map((c, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-gray-700 bg-amber-50 rounded-lg px-3 py-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1 shrink-0" />
                {c}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}