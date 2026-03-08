import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowRight, Leaf, DollarSign, Recycle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden canada-hero">
      {/* Decorative elements */}
      <div className="absolute top-20 left-10 w-64 h-64 bg-red-100/30 rounded-full blur-3xl" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-green-100/30 rounded-full blur-3xl" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-24 md:pt-24 md:pb-32 relative">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 border border-red-100 text-sm font-medium text-[#D52B1E] mb-6 shadow-sm">
              <Leaf className="w-4 h-4" />
              Made for Canadians 🍁
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-gray-900 leading-tight">
              Eat healthy,{" "}
              <span className="text-[#D52B1E]">spend less</span>, support{" "}
              <span className="text-[#2E7D32]">local</span>.
            </h1>
            
            <p className="mt-6 text-lg text-gray-600 leading-relaxed max-w-lg">
              Savoura generates weekly meal plans using seasonal Ontario produce and locally 
              available ingredients — optimized for your budget and the planet.
            </p>
            
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <Link to={createPageUrl("MealPlanner")}>
                <Button size="lg" className="maple-gradient text-white shadow-lg shadow-red-200/50 hover:shadow-xl hover:shadow-red-200/60 transition-all text-base px-8 py-6 rounded-xl">
                  Start Planning
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link to={createPageUrl("IngredientReuse")}>
                <Button variant="outline" size="lg" className="border-gray-200 text-gray-700 hover:bg-gray-50 text-base px-8 py-6 rounded-xl">
                  Use What I Have
                </Button>
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="hidden lg:block"
          >
            <div className="relative">
              <div className="w-full aspect-square max-w-md mx-auto rounded-3xl overflow-hidden shadow-2xl shadow-red-100/50">
                <img
                  src="https://images.unsplash.com/photo-1606787366850-de6330128bfc?w=600&h=600&fit=crop"
                  alt="Fresh seasonal produce"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-4 -left-4 glass-card rounded-2xl p-4 shadow-lg float-animation">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <Leaf className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">92% Local</p>
                    <p className="text-xs text-gray-500">Ontario sourced</p>
                  </div>
                </div>
              </div>
              <div className="absolute -top-4 -right-4 glass-card rounded-2xl p-4 shadow-lg float-animation" style={{ animationDelay: "1.5s" }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-[#D52B1E]" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">$47 saved</p>
                    <p className="text-xs text-gray-500">this week</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}