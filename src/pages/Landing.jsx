import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowRight, Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";
import HeroSection from "../components/landing/HeroSection";
import BenefitsSection from "../components/landing/BenefitsSection";
import SeasonalPreview from "../components/landing/SeasonalPreview";

export default function Landing() {
  return (
    <div>
      <HeroSection />
      <BenefitsSection />
      <SeasonalPreview />

      {/* CTA Footer */}
      <section className="py-20 md:py-28 bg-gradient-to-b from-white to-red-50">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="relative rounded-3xl overflow-hidden shadow-2xl" style={{ background: "linear-gradient(135deg, #1a0a0a 0%, #D52B1E 40%, #8B0000 100%)" }}>
            {/* decorative blobs */}
            <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 rounded-full -translate-y-1/3 translate-x-1/3" />
            <div className="absolute bottom-0 left-0 w-56 h-56 bg-white/10 rounded-full translate-y-1/3 -translate-x-1/3" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/5 rounded-full" />
            <div className="relative px-8 py-16 md:py-20">
              <div className="inline-flex items-center gap-2 bg-white/20 border border-white/30 text-white text-sm font-medium px-4 py-2 rounded-full mb-6 backdrop-blur-sm">
                🍁 Trusted by Canadians coast to coast
              </div>
              <h2 className="text-4xl sm:text-5xl font-extrabold text-white mb-5 leading-tight">
                Ready to eat better<br />
                <span className="text-yellow-300">for less?</span>
              </h2>
              <p className="text-white/90 text-xl mb-10 max-w-lg mx-auto leading-relaxed">
                Join thousands of Canadians saving money and eating sustainably with <span className="font-bold text-yellow-300">Savoura</span>.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to={createPageUrl("MealPlanner")}>
                  <Button size="lg" className="bg-white text-[#D52B1E] hover:bg-yellow-50 shadow-2xl text-base px-10 py-6 rounded-2xl font-bold transition-all hover:scale-105">
                    Create My Meal Plan
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
                <Link to={createPageUrl("LocalMap")}>
                  <Button size="lg" variant="outline" className="border-white/50 text-white hover:bg-white/15 text-base px-10 py-6 rounded-2xl font-semibold backdrop-blur-sm">
                    Find Local Food Near Me
                  </Button>
                </Link>
              </div>
              <div className="mt-10 flex items-center justify-center gap-8 flex-wrap">
                {["🥦 Seasonal Ingredients", "💰 Budget-Optimized", "🗺️ Local Food Map"].map(item => (
                  <span key={item} className="text-white/80 text-sm font-medium">{item}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Leaf className="w-5 h-5 text-[#D52B1E]" />
            <span className="font-bold">Savoura</span>
            <span className="text-sm text-gray-400">🍁 Made in Canada</span>
          </div>
          <p className="text-sm text-gray-400">
            © 2026 Savoura. Helping Canadians eat sustainably.
          </p>
        </div>
      </footer>
    </div>
  );
}