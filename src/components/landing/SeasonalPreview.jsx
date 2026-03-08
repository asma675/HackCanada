import React from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { MapPin, Leaf } from "lucide-react";

const seasonalItems = [
  { name: "Ontario Apples", season: "Fall–Spring", img: "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=200&h=200&fit=crop", price: "$1.29/lb" },
  { name: "Greenhouse Tomatoes", season: "Year-round", img: "https://images.unsplash.com/photo-1546470427-e26264be0b0c?w=200&h=200&fit=crop", price: "$2.49/lb" },
  { name: "Ontario Carrots", season: "Year-round", img: "https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=200&h=200&fit=crop", price: "$0.99/lb" },
  { name: "Local Potatoes", season: "Fall–Spring", img: "https://images.unsplash.com/photo-1518977676601-b53f82ber630?w=200&h=200&fit=crop", price: "$0.79/lb" },
  { name: "Ontario Cabbage", season: "Fall–Winter", img: "https://images.unsplash.com/photo-1594282486552-05b4d80fbb9f?w=200&h=200&fit=crop", price: "$1.49/head" },
  { name: "Maple Syrup", season: "Spring", img: "https://images.unsplash.com/photo-1589496933738-f5c27bc146d3?w=200&h=200&fit=crop", price: "$8.99/bottle" },
];

export default function SeasonalPreview() {
  return (
    <section className="py-20 md:py-28 bg-gradient-to-b from-white to-[#FDFCFB]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <div className="inline-flex items-center gap-2 text-[#2E7D32] text-sm font-medium mb-4">
            <MapPin className="w-4 h-4" />
            Ontario, Canada
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
            What's in season now
          </h2>
          <p className="mt-4 text-gray-500 max-w-xl mx-auto">
            Fresh, affordable produce available locally this month.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {seasonalItems.map((item, i) => (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="bg-white rounded-2xl border border-gray-100 p-4 text-center hover:shadow-md hover:-translate-y-1 transition-all duration-300 group"
            >
              <div className="w-16 h-16 mx-auto rounded-full overflow-hidden mb-3 ring-2 ring-green-100 group-hover:ring-green-200 transition-all">
                <img src={item.img} alt={item.name} className="w-full h-full object-cover" />
              </div>
              <p className="text-sm font-semibold text-gray-900 mb-1">{item.name}</p>
              <p className="text-xs text-gray-400 mb-2">{item.season}</p>
              <Badge variant="secondary" className="bg-green-50 text-green-700 border-0 text-xs">
                {item.price}
              </Badge>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}