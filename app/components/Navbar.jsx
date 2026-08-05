"use client";

import { Shield, FileText, Sparkles } from "lucide-react";

export default function Navbar({ activeTab, setActiveTab }) {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-2xs">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Title */}
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-xs">
              <Sparkles className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <span className="font-bold text-base text-slate-900 tracking-tight block">
                Draft Builder Suite
              </span>
              <span className="text-[11px] text-slate-500 font-normal">
                Home Warranty Specialist Tools
              </span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80">
            <button
              type="button"
              onClick={() => setActiveTab("denial")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "denial"
                  ? "bg-white text-indigo-700 shadow-xs border border-slate-200/60"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Denial Writer</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("inspection")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "inspection"
                  ? "bg-white text-indigo-700 shadow-xs border border-slate-200/60"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Inspection Summary Doc</span>
            </button>
          </nav>

        </div>
      </div>
    </header>
  );
}
