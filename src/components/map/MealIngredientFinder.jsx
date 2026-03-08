import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Plus, Trash2, Search, DollarSign, Leaf, MapPin, Clock, ChevronDown, ChevronUp, Navigation, Star, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const PRIORITY_LABELS = [
  { val: 0, label: "Cheapest price" },
  { val: 25, label: "Budget-leaning" },
  { val: 50, label: "Balanced" },
  { val: 75, label: "Eco-leaning" },
  { val: 100, label: "Most sustainable" },
];

function getPriorityLabel(val) {
  return PRIORITY_LABELS.reduce((prev, cur) =>
    Math.abs(cur.val - val) < Math.abs(prev.val - val) ? cur : prev
  ).label;
}

export default function MealIngredientFinder({ userLocation, onGetLocation, locationLoading, onStoresFound, onIngredientPins }) {
  const [meals, setMeals] = useState([{ name: "", servings: "" }]);
  const [budget, setBudget] = useState([20, 100]);
  const [priority, setPriority] = useState([50]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [nearbyStores, setNearbyStores] = useState([]);
  const [collapsed, setCollapsed] = useState(false);

  const addMeal = () => setMeals(m => [...m, { name: "", servings: "" }]);
  const removeMeal = (i) => setMeals(m => m.filter((_, idx) => idx !== i));
  const updateMeal = (i, field, val) => setMeals(m => m.map((meal, idx) => idx === i ? { ...meal, [field]: val } : meal));

  const validMeals = meals.filter(m => m.name.trim());

  const fetchRealStores = async (keywords) => {
    // Run multiple searches in parallel for different store types to get real, diverse results
    const searches = keywords.map(kw =>
      base44.functions.invoke("mapsProxy", {
        action: "nearby",
        lat: userLocation.lat,
        lng: userLocation.lng,
        radius: 8000,
        keyword: kw,
      })
    );
    const responses = await Promise.all(searches);
    // Merge results and deduplicate by place_id
    const seen = new Set();
    const merged = [];
    for (const res of responses) {
      for (const place of (res?.data?.results || [])) {
        if (!seen.has(place.place_id)) {
          seen.add(place.place_id);
          merged.push(place);
        }
      }
    }
    // Sort by rating desc
    return merged.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  };

  const handleFind = async () => {
    if (!validMeals.length) return;
    if (!userLocation) { onGetLocation(); return; }
    setLoading(true);
    setResults(null);
    setNearbyStores([]);

    const mealList = validMeals.map(m => `${m.name}${m.servings ? ` (${m.servings} servings)` : ""}`).join(", ");
    const ecoWeight = priority[0];
    const costWeight = 100 - ecoWeight;

    const aiResult = await base44.integrations.Core.InvokeLLM({
      prompt: `A user in Ontario, Canada wants to cook these meals this week: ${mealList}.

Budget: $${budget[0]}–$${budget[1]} CAD total for the week.
Priority: ${ecoWeight}% sustainability / ${costWeight}% cost savings.

1. List all ingredients needed with quantities (for the servings listed).
2. For each ingredient, name the best REAL Canadian store chain to buy it at. Use actual chain names like: Walmart, Loblaws, No Frills, FreshCo, Food Basics, Metro, Sobeys, Costco, Whole Foods, bulk store, farmers market. ${ecoWeight > 60 ? "Prefer farmers market, organic stores for fresh produce." : ecoWeight < 40 ? "Prefer No Frills, Food Basics, Walmart for cheapest prices." : "Mix of discount grocery and farmers market."}
3. Give a concise shopping strategy (which stores to visit and why).
4. Estimate total weekly grocery cost in CAD (realistic Canadian prices).
5. Rate sustainability 0–100.
6. Provide 2-4 Google Maps search terms to find the best nearby stores for these meals (use real store names and types, e.g. ["No Frills", "Walmart grocery", "farmers market", "Loblaws"]).`,
      response_json_schema: {
        type: "object",
        properties: {
          ingredients: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                quantity: { type: "string" },
                best_store_chain: { type: "string" },
              }
            }
          },
          shopping_strategy: { type: "string" },
          estimated_total_cost: { type: "number" },
          sustainability_score: { type: "number" },
          store_search_keywords: { type: "array", items: { type: "string" } }
        }
      }
    });

    setResults(aiResult);

    // Now fetch REAL nearby stores from Google Places
    const keywords = aiResult?.store_search_keywords?.length
      ? aiResult.store_search_keywords
      : ["grocery store supermarket"];
    const stores = await fetchRealStores(keywords);
    setNearbyStores(stores);

    if (onStoresFound) onStoresFound(stores);

    // Build ingredient pins: match each ingredient's best_store_chain to a real nearby store
    if (onIngredientPins && aiResult?.ingredients?.length && stores.length) {
      const pins = [];
      for (const ing of aiResult.ingredients) {
        if (!ing.best_store_chain) continue;
        const chainLower = ing.best_store_chain.toLowerCase();
        // Find the best matching real store
        const match = stores.find(s => s.name?.toLowerCase().includes(chainLower.split(" ")[0])) || stores[0];
        if (match) {
          pins.push({ ingredient: ing.name, quantity: ing.quantity, store_name: match.name, place: match });
        }
      }
      onIngredientPins(pins);
    }

    setLoading(false);
  };

  return (
    <div className="bg-gradient-to-r from-red-50 via-orange-50 to-amber-50 border-b border-red-100">
      <div className="max-w-7xl mx-auto px-4 py-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
            <Search className="w-4 h-4 text-[#D52B1E]" />
            Find local stores for your weekly meals
          </h2>
          <button onClick={() => setCollapsed(c => !c)} className="text-gray-400 hover:text-gray-600 p-1">
            {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>

        <AnimatePresence initial={false}>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="grid md:grid-cols-2 gap-6">
                {/* LEFT: Meal entry */}
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-gray-600">Your meals this week</p>
                  <div className="space-y-2">
                    {meals.map((meal, i) => (
                      <div key={i} className="flex gap-2 items-center">
                        <Input
                          value={meal.name}
                          onChange={e => updateMeal(i, "name", e.target.value)}
                          placeholder={`Meal (e.g. chicken and rice)`}
                          className="flex-1 rounded-xl bg-white text-sm h-9"
                        />
                        <Input
                          value={meal.servings}
                          onChange={e => updateMeal(i, "servings", e.target.value)}
                          placeholder="Servings"
                          className="w-24 rounded-xl bg-white text-sm h-9"
                          type="number"
                          min="1"
                        />
                        {meals.length > 1 && (
                          <button onClick={() => removeMeal(i)} className="text-gray-300 hover:text-red-400 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <button onClick={addMeal} className="flex items-center gap-1.5 text-xs text-[#D52B1E] font-medium hover:underline">
                    <Plus className="w-3.5 h-3.5" /> Add another meal
                  </button>
                </div>

                {/* RIGHT: Budget + Priority sliders */}
                <div className="space-y-5">
                  {/* Budget range */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-semibold text-gray-600 flex items-center gap-1">
                        <DollarSign className="w-3.5 h-3.5 text-green-600" /> Weekly Budget
                      </p>
                      <span className="text-xs font-bold text-gray-800">${budget[0]} – ${budget[1]} CAD</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-400 w-6">$0</span>
                      <div className="flex-1 space-y-2">
                        <Slider
                          value={[budget[0]]}
                          onValueChange={([v]) => setBudget([Math.min(v, budget[1] - 5), budget[1]])}
                          min={0} max={300} step={5}
                          className="w-full"
                        />
                        <Slider
                          value={[budget[1]]}
                          onValueChange={([v]) => setBudget([budget[0], Math.max(v, budget[0] + 5)])}
                          min={0} max={300} step={5}
                          className="w-full"
                        />
                      </div>
                      <span className="text-xs text-gray-400 w-8">$300</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Drag the two sliders to set min and max budget</p>
                  </div>

                  {/* Priority slider */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-semibold text-gray-600 flex items-center gap-1">
                        <Leaf className="w-3.5 h-3.5 text-green-600" /> Priority
                      </p>
                      <span className="text-xs font-bold text-gray-800">{getPriorityLabel(priority[0])}</span>
                    </div>
                    <Slider
                      value={priority}
                      onValueChange={setPriority}
                      min={0} max={100} step={25}
                      className="w-full"
                    />
                    <div className="flex justify-between mt-1">
                      <span className="text-xs text-gray-400 flex items-center gap-0.5"><DollarSign className="w-3 h-3" />Cheapest</span>
                      <span className="text-xs text-gray-400 flex items-center gap-0.5"><Leaf className="w-3 h-3 text-green-500" />Most Eco</span>
                    </div>
                  </div>

                  {/* Location + Find button */}
                  <div className="flex gap-2">
                    {!userLocation && (
                      <Button onClick={onGetLocation} disabled={locationLoading} variant="outline" size="sm" className="rounded-xl border-[#D52B1E] text-[#D52B1E] hover:bg-red-50 text-xs">
                        <Navigation className="w-3.5 h-3.5 mr-1" /> {locationLoading ? "Locating…" : "Set Location First"}
                      </Button>
                    )}
                    <Button
                      onClick={handleFind}
                      disabled={loading || !validMeals.length}
                      className="maple-gradient text-white rounded-xl text-xs px-5"
                      size="sm"
                    >
                      {loading ? (
                        <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />Analyzing…</>
                      ) : (
                        <><MapPin className="w-3.5 h-3.5 mr-1.5" />Find Local Stores</>
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Results */}
              <AnimatePresence>
                {results && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-5 space-y-3"
                  >
                    {/* Summary row */}
                    <div className="flex flex-wrap gap-3">
                      <div className="bg-white rounded-xl px-4 py-2 border border-orange-100 flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-bold text-gray-800">~${results.estimated_total_cost?.toFixed(0)} CAD</span>
                        <span className="text-xs text-gray-400">estimated total</span>
                      </div>
                      <div className="bg-white rounded-xl px-4 py-2 border border-orange-100 flex items-center gap-2">
                        <Leaf className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-bold text-gray-800">{results.sustainability_score}/100</span>
                        <span className="text-xs text-gray-400">eco score</span>
                      </div>
                    </div>

                    {/* Strategy */}
                    <div className="bg-white rounded-xl p-3 border border-orange-100">
                      <p className="text-xs font-bold text-gray-700 mb-1 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-[#D52B1E]" /> Shopping Strategy
                      </p>
                      <p className="text-xs text-gray-600 leading-relaxed">{results.shopping_strategy}</p>
                    </div>

                    {/* REAL nearby stores from Google Places */}
                    {nearbyStores.length > 0 && (
                      <div className="bg-white rounded-xl p-3 border border-orange-100">
                        <p className="text-xs font-bold text-gray-700 mb-2 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-[#D52B1E]" /> Real Stores Near You
                        </p>
                        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-52 overflow-y-auto">
                          {nearbyStores.slice(0, 9).map((store, i) => (
                            <a
                              key={store.place_id || i}
                              href={`https://www.google.com/maps/place/?q=place_id:${store.place_id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-start gap-2 p-2 rounded-lg border border-gray-100 hover:border-red-200 hover:bg-red-50 transition-all group"
                            >
                              <div className="w-6 h-6 rounded-full maple-gradient flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5">
                                {i + 1}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-gray-800 truncate group-hover:text-[#D52B1E]">{store.name}</p>
                                <p className="text-xs text-gray-400 truncate">{store.vicinity}</p>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  {store.rating && (
                                    <span className="flex items-center gap-0.5 text-xs text-amber-500">
                                      <Star className="w-2.5 h-2.5 fill-amber-400" /> {store.rating}
                                    </span>
                                  )}
                                  {store.opening_hours?.open_now !== undefined && (
                                    <span className={`text-xs font-medium ${store.opening_hours.open_now ? "text-green-600" : "text-red-400"}`}>
                                      {store.opening_hours.open_now ? "Open" : "Closed"}
                                    </span>
                                  )}
                                  <ExternalLink className="w-2.5 h-2.5 text-gray-300 group-hover:text-[#D52B1E] ml-auto" />
                                </div>
                              </div>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Ingredient list */}
                    {results.ingredients?.length > 0 && (
                     <div className="bg-white rounded-xl p-3 border border-orange-100">
                       <p className="text-xs font-bold text-gray-700 mb-2 flex items-center gap-1">
                         <MapPin className="w-3.5 h-3.5 text-green-600" /> Ingredients & Where to Buy
                         <span className="text-gray-400 font-normal ml-1">— click to see on map</span>
                       </p>
                       <div className="grid sm:grid-cols-2 gap-x-4 gap-y-1.5 max-h-48 overflow-y-auto">
                         {results.ingredients.map((ing, i) => {
                           const chainLower = ing.best_store_chain?.toLowerCase() || "";
                           const matchedStore = nearbyStores.find(s => s.name?.toLowerCase().includes(chainLower.split(" ")[0])) || nearbyStores[0];
                           return (
                             <button
                               key={i}
                               onClick={() => {
                                 if (matchedStore && onIngredientPins) {
                                   onIngredientPins([{ ingredient: ing.name, quantity: ing.quantity, store_name: matchedStore.name, place: matchedStore }]);
                                 }
                               }}
                               className="flex items-start gap-2 text-xs text-left hover:bg-green-50 rounded-lg px-1.5 py-1 transition-colors group"
                             >
                               <span className="w-2 h-2 rounded-full bg-green-600 mt-1 shrink-0 group-hover:scale-125 transition-transform" />
                               <div>
                                 <span className="font-medium text-gray-800">{ing.name}</span>
                                 <span className="text-gray-400"> · {ing.quantity}</span>
                                 {ing.best_store_chain && <span className="text-green-700 font-medium"> → {ing.best_store_chain}</span>}
                               </div>
                             </button>
                           );
                         })}
                       </div>
                     </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}