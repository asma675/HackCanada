import React from "react";
import Navbar from "./components/shared/Navbar";

export default function Layout({ children, currentPageName }) {
  return (
    <div className="min-h-screen bg-[#FDFCFB]">
      <Navbar />
      <main>{children}</main>
    </div>
  );
}