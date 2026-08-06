"use client";

import { Shield, FileText, Sparkles, Wand2 } from "lucide-react";

export default function Navbar({ activeTab, setActiveTab }) {
  return (
    <header className="bg-white/90 backdrop-blur-md border-b border-indigo-100/80 sticky top-0 z-50 shadow-xs">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18">
          
          {/* Brand Logo & Title */}
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setActiveTab("denial")}>
            <div className="p-2.5 bg-gradient-to-tr from-indigo-600 via-violet-600 to-pink-500 text-white rounded-2xl shadow-md group-hover:scale-105 transition-transform duration-200 ring-4 ring-indigo-50">
              <Wand2 className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base sm:text-lg text-slate-900 tracking-tight block">
                  Draft<span className="text-indigo-600">Magic</span>
                </span>
                <span className="bg-pink-100 text-pink-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-pink-200 shadow-2xs">
                  Pro Suite
                </span>
              </div>
              <span className="text-[11px] text-slate-500 font-medium">
                Warranty & Inspection AI Specialist
              </span>
            </div>
          </div>

          {/* Playful Floating Navigation Tabs */}
          <nav className="flex items-center bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200/80 shadow-2xs">
            <button
              type="button"
              onClick={() => setActiveTab("denial")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer ${
                activeTab === "denial"
                  ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/25 scale-[1.02]"
                  : "text-slate-600 hover:text-indigo-600 hover:bg-slate-200/60"
              }`}
            >
              <Shield className="w-4 h-4 stroke-[2.2]" />
              <span>Denial Writer</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("inspection")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer ${
                activeTab === "inspection"
                  ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/25 scale-[1.02]"
                  : "text-slate-600 hover:text-indigo-600 hover:bg-slate-200/60"
              }`}
            >
              <FileText className="w-4 h-4 stroke-[2.2]" />
              <span>Inspection Generator</span>
            </button>
          </nav>

        </div>
      </div>
    </header>
  );
}
