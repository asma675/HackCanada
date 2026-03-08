import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { DollarSign, Users, MapPin, Leaf, Sparkles, Loader2 } from "lucide-react";

export default function PlannerForm({ formData, setFormData, onSubmit, isLoading }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Plan Your Week</h2>
        <p className="text-gray-500 mt-1">Tell us about your household and we'll create a custom meal plan.</p>
      </div>

      <div className="space-y-6">
        <div className="grid sm:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-[#D52B1E]" />
              Weekly Budget (CAD)
            </Label>
            <Input
              type="number"
              placeholder="e.g. 150"
              value={formData.budget}
              onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
              className="h-12 rounded-xl border-gray-200 focus:border-[#D52B1E] focus:ring-[#D52B1E]/20"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Users className="w-4 h-4 text-[#D52B1E]" />
              Household Size
            </Label>
            <Input
              type="number"
              placeholder="e.g. 4"
              min={1}
              max={12}
              value={formData.household_size}
              onChange={(e) => setFormData({ ...formData, household_size: e.target.value })}
              className="h-12 rounded-xl border-gray-200 focus:border-[#D52B1E] focus:ring-[#D52B1E]/20"
            />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Dietary Preference</Label>
            <Select
              value={formData.diet}
              onValueChange={(value) => setFormData({ ...formData, diet: value })}
            >
              <SelectTrigger className="h-12 rounded-xl border-gray-200">
                <SelectValue placeholder="Select diet" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No restrictions</SelectItem>
                <SelectItem value="vegetarian">Vegetarian</SelectItem>
                <SelectItem value="vegan">Vegan</SelectItem>
                <SelectItem value="halal">Halal</SelectItem>
                <SelectItem value="gluten-free">Gluten-Free</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#D52B1E]" />
              Location
            </Label>
            <Input
              placeholder="e.g. Toronto, ON or M5V 2T6"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="h-12 rounded-xl border-gray-200 focus:border-[#D52B1E] focus:ring-[#D52B1E]/20"
            />
          </div>
        </div>

        <div className="space-y-3 pt-2">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Leaf className="w-4 h-4 text-[#2E7D32]" />
            Sustainability vs Cost Priority
          </Label>
          <div className="px-2">
            <Slider
              value={[formData.sustainability_weight]}
              onValueChange={([val]) => setFormData({ ...formData, sustainability_weight: val })}
              max={100}
              step={5}
              className="w-full"
            />
          </div>
          <div className="flex justify-between text-xs text-gray-400 px-2">
            <span>💰 Cost-first</span>
            <span>🌿 Eco-first</span>
          </div>
        </div>

        <Button
          onClick={onSubmit}
          disabled={isLoading || !formData.budget || !formData.household_size || !formData.location}
          className="w-full h-14 maple-gradient text-white rounded-xl text-base font-semibold shadow-lg shadow-red-200/40 hover:shadow-xl hover:shadow-red-200/60 transition-all disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Generating your plan...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 mr-2" />
              Generate Meal Plan
            </>
          )}
        </Button>
      </div>
    </div>
  );
}