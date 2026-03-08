import React from "react";
import { DollarSign, Sprout, Recycle } from "lucide-react";
import { motion } from "framer-motion";

const benefits = [
  {
    icon: DollarSign,
    title: "Save on Groceries",
    description: "Smart meal plans built around your budget. We find the cheapest local options so you save up to 30% weekly.",
    color: "bg-red-50",
    iconColor: "text-[#D52B1E]",
    borderColor: "border-red-100",
  },
  {
    icon: Sprout,
    title: "Eat Seasonal & Local",
    description: "Recipes built around what's growing in Ontario right now. Fresher food, better taste, lower carbon footprint.",
    color: "bg-green-50",
    iconColor: "text-[#2E7D32]",
    borderColor: "border-green-100",
  },
  {
    icon: Recycle,
    title: "Reduce Food Waste",
    description: "Use what you already have. Our ingredient reuse feature suggests recipes to minimize waste.",
    color: "bg-amber-50",
    iconColor: "text-amber-600",
    borderColor: "border-amber-100",
  },
];

export default function BenefitsSection() {
  return (
    <section className="py-20 md:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
            Why Canadians love EcoCart
          </h2>
          <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto">
            Built around Canada's Food Guide, seasonal Ontario produce, and your wallet.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {benefits.map((benefit, index) => (
            <motion.div
              key={benefit.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.15 }}
              className={`${benefit.color} ${benefit.borderColor} border rounded-2xl p-8 hover:shadow-lg hover:-translate-y-1 transition-all duration-300`}
            >
              <div className={`w-14 h-14 rounded-2xl ${benefit.color} flex items-center justify-center mb-6`}>
                <benefit.icon className={`w-7 h-7 ${benefit.iconColor}`} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{benefit.title}</h3>
              <p className="text-gray-600 leading-relaxed">{benefit.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}