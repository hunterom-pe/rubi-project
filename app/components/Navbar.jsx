"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Shield, FileText, Wand2 } from "lucide-react";

export default function Navbar({ activeTab, setActiveTab }) {
  const pathname = usePathname();
  const currentTab = activeTab || (pathname === "/inspection" ? "inspection" : "denial");

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-indigo-100 sticky top-0 z-[100] shadow-sm">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Brand Logo & Title */}
          <Link 
            href="/"
            onClick={() => setActiveTab && setActiveTab("denial")}
            className="flex items-center gap-3 cursor-pointer group select-none"
          >
            <div className="p-2.5 bg-gradient-to-tr from-indigo-600 via-violet-600 to-pink-500 text-white rounded-2xl shadow-md group-hover:scale-105 transition-transform duration-200 ring-4 ring-indigo-50">
              <Wand2 className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base sm:text-lg text-slate-900 tracking-tight block">
                  Draft<span className="text-indigo-600">Magic</span>
                </span>
                <span className="bg-pink-100 text-pink-700 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-pink-200 shadow-2xs">
                  Pro Suite
                </span>
              </div>
              <span className="text-[11px] text-slate-500 font-medium">
                Warranty & Inspection AI Specialist
              </span>
            </div>
          </Link>

          {/* Clickable Navigation Tabs with Direct Routes */}
          <nav className="flex items-center bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200/80 shadow-inner relative z-50">
            <Link
              href="/"
              onClick={() => setActiveTab && setActiveTab("denial")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all duration-200 cursor-pointer select-none relative z-50 ${
                currentTab === "denial"
                  ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/25 scale-[1.02]"
                  : "text-slate-600 hover:text-indigo-600 hover:bg-white/80"
              }`}
            >
              <Shield className="w-4 h-4 stroke-[2.5]" />
              <span>Denial Writer</span>
            </Link>

            <Link
              href="/inspection"
              onClick={() => setActiveTab && setActiveTab("inspection")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all duration-200 cursor-pointer select-none relative z-50 ${
                currentTab === "inspection"
                  ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/25 scale-[1.02]"
                  : "text-slate-600 hover:text-indigo-600 hover:bg-white/80"
              }`}
            >
              <FileText className="w-4 h-4 stroke-[2.5]" />
              <span>Inspection Generator</span>
            </Link>
          </nav>

        </div>
      </div>
    </header>
  );
}
