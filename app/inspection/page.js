"use client";

import Navbar from "../components/Navbar";
import InspectionGenerator from "../components/InspectionGenerator";
import Link from "next/link";
import { Shield, FileText } from "lucide-react";

export default function InspectionPage() {
  return (
    <div className="min-h-screen text-slate-900 flex flex-col justify-between">
      
      {/* Top Navbar */}
      <Navbar activeTab="inspection" />

      {/* Main Tab View Container */}
      <div className="mx-auto w-full py-8 px-4 sm:px-6 lg:px-8 flex-1 max-w-5xl">
        
        {/* Secondary Page Tab Switcher */}
        <div className="flex justify-center mb-8">
          <div className="bg-white/90 backdrop-blur-md p-1.5 rounded-2xl border-2 border-indigo-100 shadow-sm inline-flex items-center gap-1.5">
            <Link
              href="/"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer text-slate-600 hover:bg-slate-100 hover:text-indigo-600"
            >
              <Shield className="w-4 h-4" />
              <span>1. Denial Email Writer</span>
            </Link>

            <Link
              href="/inspection"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/20"
            >
              <FileText className="w-4 h-4" />
              <span>2. Inspection Word Generator</span>
            </Link>
          </div>
        </div>

        {/* INSPECTION SUMMARY WORD GENERATOR */}
        <div className="animate-in fade-in duration-300">
          <InspectionGenerator />
        </div>

      </div>

      {/* Playful Footer */}
      <footer className="text-center text-xs text-slate-500 py-6 border-t border-indigo-100 bg-white/80 backdrop-blur-md">
        <p className="font-semibold">
          Crafted with ❤️ powered by Gemini 3.6 Flash & Google Gen AI SDK
        </p>
      </footer>

    </div>
  );
}
