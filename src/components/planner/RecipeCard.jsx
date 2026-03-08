import React from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DollarSign, Leaf, Eye } from "lucide-react";

export default function RecipeCard({ recipe, onViewRecipe, delay = 0 }) {
  if (!recipe) return null;

  const sustainabilityColor = (score) => {
    if (score >= 80) return "bg-green-100 text-green-700";
    if (score >= 50) return "bg-yellow-100 text-yellow-700";
    return "bg-red-100 text-red-700";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 group"
    >
      <div className="relative h-36 overflow-hidden">
        <img
          src={recipe.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=250&fit=crop"}
          alt={recipe.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-2 right-2">
          <Badge className={`${sustainabilityColor(recipe.sustainability_score)} border-0 text-xs font-medium`}>
            <Leaf className="w-3 h-3 mr-1" />
            {recipe.sustainability_score}%
          </Badge>
        </div>
      </div>
      <div className="p-3">
        <h4 className="font-semibold text-sm text-gray-900 truncate">{recipe.name}</h4>
        <div className="flex items-center justify-between mt-2">
          <span className="flex items-center text-xs text-gray-500">
            <DollarSign className="w-3 h-3 mr-0.5" />
            ${recipe.cost_per_serving?.toFixed(2)}/serving
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onViewRecipe(recipe)}
            className="text-[#D52B1E] hover:text-[#D52B1E] hover:bg-red-50 text-xs h-7 px-2"
          >
            <Eye className="w-3 h-3 mr-1" />
            View
          </Button>
        </div>
      </div>
    </motion.div>
  );
}