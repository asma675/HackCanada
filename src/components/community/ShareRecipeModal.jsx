import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, ShieldCheck, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

export default function ShareRecipeModal({ open, onClose, user, onSuccess }) {
  const [form, setForm] = useState({
    name: "", description: "", meal_type: "dinner", prep_time: "", cost_per_serving: "",
    author_location: "",
    ingredients: [{ name: "", quantity: "", price: "" }],
    instructions: [""],
    diet_tags: [],
  });
  const [vetting, setVetting] = useState(null); // null | "loading" | result
  const [saving, setSaving] = useState(false);

  const updateIngredient = (i, field, val) => {
    const updated = [...form.ingredients];
    updated[i] = { ...updated[i], [field]: val };
    setForm(f => ({ ...f, ingredients: updated }));
  };
  const addIngredient = () => setForm(f => ({ ...f, ingredients: [...f.ingredients, { name: "", quantity: "", price: "" }] }));
  const removeIngredient = (i) => setForm(f => ({ ...f, ingredients: f.ingredients.filter((_, idx) => idx !== i) }));
  const updateInstruction = (i, val) => { const updated = [...form.instructions]; updated[i] = val; setForm(f => ({ ...f, instructions: updated })); };
  const addInstruction = () => setForm(f => ({ ...f, instructions: [...f.instructions, ""] }));

  const handleVet = async () => {
    setVetting("loading");
    const result = await base44.functions.invoke("vetRecipe", { recipe: form });
    setVetting(result.data);
  };

  // AI determines which ingredient is seasonal and when it expires
  const getSeasonExpiry = async (ingredients, location) => {
    const today = new Date().toISOString().split("T")[0];
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Today is ${today}. The recipe author is from ${location || "Ontario, Canada"}. 
The recipe ingredients are: ${ingredients.map(i => i.name).filter(Boolean).join(", ")}.
Identify the most seasonal/perishable local ingredient and estimate when it will go out of season locally in Ontario, Canada.
If all ingredients are year-round staples (flour, salt, oil, etc.), return null for season_available_until.`,
      response_json_schema: {
        type: "object",
        properties: {
          key_seasonal_ingredient: { type: "string" },
          season_available_until: { type: "string", description: "ISO date YYYY-MM-DD or null if year-round" }
        }
      }
    });
    return result;
  };

  const handleSubmit = async () => {
    setSaving(true);
    const vetResult = vetting && vetting !== "loading" ? vetting : null;
    const seasonData = await getSeasonExpiry(form.ingredients, form.author_location);
    await base44.entities.CommunityRecipe.create({
      ...form,
      cost_per_serving: Number(form.cost_per_serving) || 0,
      ingredients: form.ingredients.map(ing => ({ ...ing, price: Number(ing.price) || 0 })),
      author_email: user?.email,
      author_name: user?.full_name || "Anonymous",
      author_location: form.author_location,
      avg_rating: 0,
      rating_count: 0,
      save_count: 0,
      ai_vetted: vetResult?.passes || false,
      ai_feedback: vetResult?.ai_feedback || "",
      nutrition_score: vetResult?.nutrition_score || 0,
      sustainability_score: vetResult?.sustainability_score || 0,
      key_seasonal_ingredient: seasonData?.key_seasonal_ingredient || null,
      season_available_until: seasonData?.season_available_until || null,
    });
    setSaving(false);
    setForm({ name: "", description: "", meal_type: "dinner", prep_time: "", cost_per_serving: "", author_location: "", ingredients: [{ name: "", quantity: "", price: "" }], instructions: [""], diet_tags: [] });
    setVetting(null);
    onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Share a Recipe with the Community</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Recipe Name *</label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Ontario Apple Oatmeal" className="rounded-xl" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Meal Type</label>
              <Select value={form.meal_type} onValueChange={v => setForm(f => ({ ...f, meal_type: v }))}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["breakfast", "lunch", "dinner", "snack"].map(t => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Prep Time</label>
              <Input value={form.prep_time} onChange={e => setForm(f => ({ ...f, prep_time: e.target.value }))} placeholder="e.g. 20 mins" className="rounded-xl" />
            </div>
            <div className="col-span-2">
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Description</label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Brief description..." className="rounded-xl resize-none h-20" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Cost per Serving (CAD)</label>
              <Input type="number" value={form.cost_per_serving} onChange={e => setForm(f => ({ ...f, cost_per_serving: e.target.value }))} placeholder="e.g. 3.50" className="rounded-xl" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Your Location (City / Region) *</label>
              <Input value={form.author_location} onChange={e => setForm(f => ({ ...f, author_location: e.target.value }))} placeholder="e.g. Toronto, Ottawa, BC Coast..." className="rounded-xl" />
              <p className="text-xs text-gray-400 mt-1">Used to verify that this recipe uses locally available ingredients 🌿</p>
            </div>
          </div>
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs text-amber-700 flex items-start gap-2">
            <span className="text-base">🍂</span>
            <span>Your recipe will automatically be <strong>hidden when its key seasonal ingredient goes out of season</strong> locally. It stays in the archive and can be viewed on request.</span>
          </div>

          {/* Ingredients */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">Ingredients *</label>
              <button onClick={addIngredient} className="text-xs text-[#D52B1E] flex items-center gap-1 hover:underline"><Plus className="w-3 h-3" /> Add</button>
            </div>
            <div className="space-y-2">
              {form.ingredients.map((ing, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <Input value={ing.name} onChange={e => updateIngredient(i, "name", e.target.value)} placeholder="Ingredient" className="rounded-lg flex-1" />
                  <Input value={ing.quantity} onChange={e => updateIngredient(i, "quantity", e.target.value)} placeholder="Qty" className="rounded-lg w-20" />
                  <Input type="number" value={ing.price} onChange={e => updateIngredient(i, "price", e.target.value)} placeholder="$" className="rounded-lg w-16" />
                  {form.ingredients.length > 1 && <button onClick={() => removeIngredient(i)} className="text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>}
                </div>
              ))}
            </div>
          </div>

          {/* Instructions */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">Instructions *</label>
              <button onClick={addInstruction} className="text-xs text-[#D52B1E] flex items-center gap-1 hover:underline"><Plus className="w-3 h-3" /> Add step</button>
            </div>
            <div className="space-y-2">
              {form.instructions.map((step, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <div className="w-6 h-6 rounded-full bg-red-100 text-[#D52B1E] text-xs flex items-center justify-center font-bold shrink-0 mt-2">{i + 1}</div>
                  <Textarea value={step} onChange={e => updateInstruction(i, e.target.value)} placeholder={`Step ${i + 1}...`} className="rounded-xl resize-none h-16 flex-1" />
                </div>
              ))}
            </div>
          </div>

          {/* AI Vetting */}
          <div className="rounded-xl border border-green-100 bg-green-50 p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-green-600" />
                <span className="font-semibold text-gray-800 text-sm">AI Nutritional & Sustainability Check</span>
              </div>
              <Button onClick={handleVet} disabled={vetting === "loading" || !form.name || form.ingredients[0].name === ""} size="sm" variant="outline" className="rounded-lg border-green-300 text-green-700 hover:bg-green-100">
                {vetting === "loading" ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
                {vetting === "loading" ? "Checking..." : "Run AI Check"}
              </Button>
            </div>
            {vetting && vetting !== "loading" && (
              <div className="mt-2 space-y-1">
                <div className="flex items-center gap-2">
                  {vetting.passes ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <AlertCircle className="w-4 h-4 text-amber-500" />}
                  <span className={`text-sm font-medium ${vetting.passes ? "text-green-700" : "text-amber-600"}`}>
                    {vetting.passes ? "Recipe passed AI vetting!" : "Needs improvement"}
                  </span>
                </div>
                <div className="flex gap-4 text-xs text-gray-600">
                  <span>Nutrition: <strong>{vetting.nutrition_score}/100</strong></span>
                  <span>Sustainability: <strong>{vetting.sustainability_score}/100</strong></span>
                </div>
                {vetting.ai_feedback && <p className="text-xs text-gray-600 italic mt-1">"{vetting.ai_feedback}"</p>}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <Button onClick={onClose} variant="outline" className="flex-1 rounded-xl">Cancel</Button>
            <Button onClick={handleSubmit} disabled={saving || !form.name} className="flex-1 maple-gradient text-white rounded-xl">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {saving ? "Sharing..." : "Share Recipe"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}