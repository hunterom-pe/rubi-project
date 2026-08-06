"use client";

import { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import InspectionGenerator from "./components/InspectionGenerator";
import Link from "next/link";
import { 
  Shield, Sparkles, Copy, Check, AlertCircle, RefreshCw, 
  Info, FileText, Send, History, Trash2, ExternalLink, Search, Clock, Download, ChevronRight, Bookmark, Wand2, Zap, HeartHandshake
} from "lucide-react";

const SAMPLE_PRESETS = [
  {
    label: "❄️ HVAC Pre-existing Rust & Failure",
    claim: "Customer states the central A/C unit stopped cooling during a hot week. Technician inspected and found severe rust, prior improper wiring, and compressor failure that existed prior to policy inception.",
    reason: "Excluded under Policy Section 3A: Pre-existing defects and pre-policy mechanical failure.",
    badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100 hover:border-indigo-300"
  },
  {
    label: "🚰 Plumbing Tree Root Blockage",
    claim: "Homeowner reported slow drainage in main sewer line leading to backup in basement shower. Inspection showed tree root infiltration and pipe collapse.",
    reason: "Section 4B: Outside sewer line root damage and natural wear-and-tear are not covered.",
    badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300"
  },
  {
    label: "🧊 Appliance Pet Hair Maintenance",
    claim: "Refrigerator ice maker stopped working and compressor overheating. Unit was completely clogged with 5 years of pet hair and dust, causing thermal failure.",
    reason: "Section 2C: Failure caused by failure to perform routine annual maintenance.",
    badgeColor: "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100 hover:border-amber-300"
  }
];

const LOCAL_STORAGE_KEY = "warranty_denial_draft_history_v1";

export default function Home() {
  const [activeTab, setActiveTab] = useState("denial"); // "denial" | "inspection"

  // Denial Writer State
  const [claim, setClaim] = useState("");
  const [reason, setReason] = useState("");
  const [length, setLength] = useState("Medium");
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  // History state
  const [history, setHistory] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedHistoryItem, setSelectedHistoryItem] = useState(null);
  const [copiedHistoryId, setCopiedHistoryId] = useState(null);

  // Load history from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        setHistory(JSON.parse(saved));
      }
    } catch (e) {
      console.warn("Failed to load draft history from localStorage:", e);
    }
  }, []);

  // Save history to localStorage
  const saveHistoryToStorage = (updatedHistory) => {
    setHistory(updatedHistory);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedHistory));
    } catch (e) {
      console.warn("Failed to save draft history to localStorage:", e);
    }
  };

  const handleDenialSubmit = async (e) => {
    e.preventDefault();
    if (!claim.trim() || !reason.trim()) {
      setError("Please fill out both the Customer Claim Request and Basic Denial Explanation.");
      return;
    }

    setLoading(true);
    setError(null);
    setDraft("");
    setCopied(false);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ claim, reason, length }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to generate denial email draft.");
      }

      const generatedDraft = data.draft;
      setDraft(generatedDraft);

      // Add to local history
      const newRecord = {
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        claim: claim.trim(),
        reason: reason.trim(),
        length,
        draft: generatedDraft,
      };

      const updated = [newRecord, ...history];
      saveHistoryToStorage(updated);
    } catch (err) {
      setError(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text, id = null) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    if (id) {
      setCopiedHistoryId(id);
      setTimeout(() => setCopiedHistoryId(null), 2000);
    } else {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const applyPreset = (preset) => {
    setClaim(preset.claim);
    setReason(preset.reason);
    setError(null);
  };

  const loadFromHistory = (item) => {
    setClaim(item.claim);
    setReason(item.reason);
    setLength(item.length || "Medium");
    setDraft(item.draft);
    setError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deleteHistoryItem = (id, e) => {
    e.stopPropagation();
    const updated = history.filter((item) => item.id !== id);
    saveHistoryToStorage(updated);
    if (selectedHistoryItem?.id === id) {
      setSelectedHistoryItem(null);
    }
  };

  const clearAllHistory = () => {
    if (window.confirm("Are you sure you want to clear your entire draft history?")) {
      saveHistoryToStorage([]);
      setSelectedHistoryItem(null);
    }
  };

  const exportHistoryJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(history, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `warranty-denial-history-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const filteredHistory = history.filter((item) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      item.claim?.toLowerCase().includes(query) ||
      item.reason?.toLowerCase().includes(query) ||
      item.draft?.toLowerCase().includes(query)
    );
  });

  const formatDate = (isoString) => {
    try {
      const date = new Date(isoString);
      return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }).format(date);
    } catch {
      return isoString;
    }
  };

  return (
    <div className="min-h-screen text-slate-900 flex flex-col justify-between">
      
      {/* Top Navbar */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Tab View Container */}
      <div className={`mx-auto w-full py-8 px-4 sm:px-6 lg:px-8 flex-1 ${activeTab === "inspection" ? "max-w-5xl" : "max-w-3xl"}`}>
        
        {/* Secondary Page Tab Switcher with Direct Links */}
        <div className="flex justify-center mb-8">
          <div className="bg-white/90 backdrop-blur-md p-1.5 rounded-2xl border-2 border-indigo-100 shadow-sm inline-flex items-center gap-1.5">
            <Link
              href="/"
              onClick={() => setActiveTab("denial")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
                activeTab === "denial"
                  ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/20"
                  : "text-slate-600 hover:bg-slate-100 hover:text-indigo-600"
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>1. Denial Email Writer</span>
            </Link>

            <Link
              href="/inspection"
              onClick={() => setActiveTab("inspection")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
                activeTab === "inspection"
                  ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/20"
                  : "text-slate-600 hover:bg-slate-100 hover:text-indigo-600"
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>2. Inspection Word Generator</span>
            </Link>
          </div>
        </div>

        {activeTab === "denial" ? (
          /* TAB 1: WARRANTY DENIAL WRITER */
          <div className="space-y-8 animate-in fade-in duration-300">
            
            {/* Playful Hero Header */}
            <header className="text-center space-y-3">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-violet-100 via-pink-100 to-amber-100 text-indigo-900 border border-indigo-200/80 shadow-2xs font-semibold text-xs mb-1">
                <Sparkles className="w-4 h-4 text-pink-600 fill-pink-100" />
                <span>AI-Powered Claim Communication Assistant</span>
              </div>
              <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900">
                Warranty Denial <span className="gradient-text-hero">Draft Writer</span>
              </h1>
              <p className="text-slate-600 text-base sm:text-lg max-w-xl mx-auto font-medium leading-relaxed">
                Transform technical denial reasons into empathetic, professional emails in seconds.
              </p>
            </header>

            {/* Quick Presets Selector */}
            <div className="bg-white/90 backdrop-blur-md p-5 rounded-2xl border border-indigo-100 shadow-sm space-y-3 card-playful">
              <div className="flex items-center justify-between text-xs font-bold text-slate-600 uppercase tracking-wider">
                <span className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-500 fill-amber-400" />
                  Quick Example Claims (Click to test)
                </span>
                {(claim || reason) && (
                  <button
                    onClick={() => { setClaim(""); setReason(""); setDraft(""); setError(null); }}
                    type="button"
                    className="text-xs text-indigo-600 hover:text-pink-600 font-bold transition-colors cursor-pointer"
                  >
                    Clear All Fields
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2.5 pt-1">
                {SAMPLE_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => applyPreset(preset)}
                    className={`text-xs font-bold px-3.5 py-2 rounded-xl border transition-all cursor-pointer text-left active:scale-95 shadow-2xs ${preset.badgeColor}`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Main Interactive Form Card */}
            <main className="bg-white rounded-3xl border border-indigo-100/90 shadow-md p-6 sm:p-9 space-y-7 card-playful">
              <form onSubmit={handleDenialSubmit} className="space-y-7">
                
                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 border-2 border-red-200 text-red-700 p-4.5 rounded-2xl text-sm flex items-start gap-3.5 shadow-2xs">
                    <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="font-bold">Generation Issue</p>
                      <p className="text-red-600 text-xs font-medium">{error}</p>
                    </div>
                  </div>
                )}

                {/* Textarea 1: Customer Claim Request */}
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center shadow-xs">
                      1
                    </span>
                    <label 
                      htmlFor="claim-input" 
                      className="block text-sm font-bold text-slate-900"
                    >
                      Customer Claim Request
                    </label>
                  </div>
                  <textarea
                    id="claim-input"
                    rows={3}
                    value={claim}
                    onChange={(e) => setClaim(e.target.value)}
                    placeholder="Describe what the customer requested (e.g. A/C unit stopped cooling during heat wave...)"
                    className="w-full rounded-2xl border-2 border-slate-200 bg-slate-50/50 p-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:bg-white focus:ring-4 focus:ring-indigo-100 outline-none transition-all resize-y font-medium"
                    required
                  />
                </div>

                {/* Textarea 2: Basic Denial Explanation */}
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-violet-600 text-white text-xs font-bold flex items-center justify-center shadow-xs">
                      2
                    </span>
                    <label 
                      htmlFor="reason-input" 
                      className="block text-sm font-bold text-slate-900"
                    >
                      Basic Denial Explanation
                    </label>
                  </div>
                  <textarea
                    id="reason-input"
                    rows={2.5}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="e.g. Excluded under Section 3A due to pre-existing rust and improper wiring..."
                    className="w-full rounded-2xl border-2 border-slate-200 bg-slate-50/50 p-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-violet-600 focus:bg-white focus:ring-4 focus:ring-violet-100 outline-none transition-all resize-y font-medium"
                    required
                  />
                </div>

                {/* Radio Option Group: Response Length */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-pink-600 text-white text-xs font-bold flex items-center justify-center shadow-xs">
                      3
                    </span>
                    <label className="block text-sm font-bold text-slate-900">
                      Response Tone & Length
                    </label>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { title: "Short", desc: "Direct & Concise" },
                      { title: "Medium", desc: "Balanced & Helpful" },
                      { title: "Long", desc: "Detailed Explanation" }
                    ].map((option) => (
                      <label
                        key={option.title}
                        className={`relative flex flex-col items-center justify-center p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                          length === option.title
                            ? "border-indigo-600 bg-gradient-to-br from-indigo-50 to-violet-50 text-indigo-900 ring-2 ring-indigo-500/30 shadow-sm"
                            : "border-slate-200 bg-slate-50/40 text-slate-700 hover:bg-slate-100/80 hover:border-slate-300"
                        }`}
                      >
                        <input
                          type="radio"
                          name="response-length"
                          value={option.title}
                          checked={length === option.title}
                          onChange={(e) => setLength(e.target.value)}
                          className="sr-only"
                        />
                        <span className="font-extrabold text-sm text-slate-900">{option.title}</span>
                        <span className="text-[11px] font-medium text-slate-500 mt-0.5">{option.desc}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Primary Action Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-4 px-6 rounded-2xl font-extrabold text-base text-white shadow-lg transition-all flex items-center justify-center gap-2.5 cursor-pointer ${
                    loading
                      ? "bg-indigo-400 cursor-not-allowed opacity-90"
                      : "bg-gradient-to-r from-indigo-600 via-violet-600 to-pink-600 hover:from-indigo-700 hover:via-violet-700 hover:to-pink-700 active:scale-[0.99] shadow-indigo-500/25"
                  }`}
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin text-white" />
                      <span>Crafting Friendly Response...</span>
                    </>
                  ) : (
                    <>
                      <span>Generate Email Draft</span>
                      <Sparkles className="w-5 h-5 text-pink-200 fill-pink-200" />
                    </>
                  )}
                </button>
              </form>
            </main>

            {/* Output Card */}
            {draft && (
              <section className="bg-white rounded-3xl border-2 border-emerald-200 shadow-lg p-6 sm:p-9 space-y-5 animate-in fade-in slide-in-from-bottom-3 duration-300 card-playful">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-emerald-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 animate-pulse shadow-xs"></div>
                    <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                      Generated Email Draft
                    </h2>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopy(draft)}
                    className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-extrabold border-2 transition-all duration-200 cursor-pointer ${
                      copied
                        ? "bg-emerald-500 text-white border-emerald-500 shadow-md scale-105"
                        : "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100 shadow-2xs"
                    }`}
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 stroke-[3]" />
                        <span>✓ Copied to Clipboard!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 text-emerald-600" />
                        <span>Copy Draft</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="bg-gradient-to-br from-emerald-50/40 via-teal-50/20 to-slate-50 border border-emerald-200/80 rounded-2xl p-5 sm:p-6 text-slate-900 text-sm sm:text-base leading-relaxed whitespace-pre-wrap font-sans select-text shadow-2xs">
                  {draft}
                </div>

                <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 pt-1 px-1">
                  <span className="flex items-center gap-1.5 font-medium text-slate-500">
                    <HeartHandshake className="w-4 h-4 text-pink-500" />
                    Saved automatically to your history log below.
                  </span>
                  <a
                    href={`mailto:?subject=${encodeURIComponent(
                      draft.match(/^Subject:\s*(.*)/i)?.[1] || "Warranty Claim Update"
                    )}&body=${encodeURIComponent(draft)}`}
                    className="text-indigo-600 hover:text-pink-600 font-bold hover:underline inline-flex items-center gap-1.5 transition-colors mt-1 sm:mt-0"
                  >
                    <Send className="w-4 h-4" />
                    Open directly in Email App
                  </a>
                </div>
              </section>
            )}

            {/* Draft History Section */}
            <section className="bg-white rounded-3xl border border-indigo-100 shadow-md p-6 sm:p-9 space-y-6 card-playful">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-gradient-to-tr from-indigo-500 to-violet-600 text-white rounded-2xl shadow-xs">
                    <History className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                      Saved Draft History
                      <span className="bg-pink-100 text-pink-700 text-xs font-extrabold px-3 py-0.5 rounded-full border border-pink-200">
                        {history.length}
                      </span>
                    </h2>
                    <p className="text-xs text-slate-500 font-medium">Stored securely in your local browser</p>
                  </div>
                </div>

                {history.length > 0 && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={exportHistoryJSON}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-indigo-600 bg-slate-100 hover:bg-indigo-50 px-3.5 py-2 rounded-xl border border-slate-200 hover:border-indigo-200 transition-all cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      Export
                    </button>
                    <button
                      type="button"
                      onClick={clearAllHistory}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3.5 py-2 rounded-xl border border-red-200 transition-all cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                      Clear All
                    </button>
                  </div>
                )}
              </div>

              {history.length === 0 ? (
                <div className="text-center py-10 space-y-3">
                  <div className="w-14 h-14 rounded-3xl bg-indigo-50 text-indigo-400 flex items-center justify-center mx-auto shadow-2xs">
                    <Bookmark className="w-7 h-7" />
                  </div>
                  <p className="text-base font-bold text-slate-700">No saved drafts yet</p>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">Drafts you generate above will automatically appear here for quick copying and reuse.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search past claims, denial reasons, or draft wording..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 text-xs sm:text-sm rounded-2xl border-2 border-slate-200 bg-slate-50/50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100 font-medium"
                    />
                  </div>

                  <div className="space-y-3.5 max-h-[420px] overflow-y-auto pr-1">
                    {filteredHistory.length === 0 ? (
                      <p className="text-center text-xs text-slate-400 py-6">No drafts match your search filter.</p>
                    ) : (
                      filteredHistory.map((item) => {
                        const isSelected = selectedHistoryItem?.id === item.id;
                        const isCopied = copiedHistoryId === item.id;

                        return (
                          <div
                            key={item.id}
                            onClick={() => setSelectedHistoryItem(isSelected ? null : item)}
                            className={`rounded-2xl border-2 transition-all cursor-pointer p-4.5 space-y-3 ${
                              isSelected
                                ? "border-indigo-500 bg-indigo-50/30 ring-2 ring-indigo-500/20 shadow-sm"
                                : "border-slate-200 bg-slate-50/40 hover:bg-slate-100/70 hover:border-slate-300"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="space-y-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-extrabold text-slate-900 truncate max-w-[240px] sm:max-w-[360px]">
                                    {item.claim}
                                  </span>
                                  <span className="text-[10px] font-bold bg-indigo-100 text-indigo-700 px-2.5 py-0.5 rounded-full shrink-0">
                                    {item.length}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-500 truncate font-medium">
                                  Reason: {item.reason}
                                </p>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0 text-slate-400">
                                <span className="text-[11px] text-slate-400 font-semibold flex items-center gap-1 mr-1">
                                  <Clock className="w-3.5 h-3.5" />
                                  {formatDate(item.createdAt)}
                                </span>
                                <ChevronRight
                                  className={`w-4 h-4 transition-transform duration-200 ${
                                    isSelected ? "rotate-90 text-indigo-600" : ""
                                  }`}
                                />
                              </div>
                            </div>

                            {isSelected && (
                              <div className="pt-3 border-t border-slate-200/80 space-y-3 animate-in fade-in duration-150">
                                <div className="bg-white p-4 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-wrap font-sans">
                                  {item.draft}
                                </div>
                                
                                <div className="flex items-center justify-between gap-2 pt-1">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      loadFromHistory(item);
                                    }}
                                    className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-pink-600 cursor-pointer transition-colors"
                                  >
                                    <ExternalLink className="w-4 h-4" />
                                    Load into Generator
                                  </button>

                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleCopy(item.draft, item.id);
                                      }}
                                      className={`inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                                        isCopied
                                          ? "bg-emerald-500 text-white border-emerald-500"
                                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                                      }`}
                                    >
                                      {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                      <span>{isCopied ? "Copied!" : "Copy"}</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => deleteHistoryItem(item.id, e)}
                                      className="p-1.5 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                                      title="Delete item"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </section>
          </div>
        ) : (
          /* TAB 2: INSPECTION SUMMARY WORD GENERATOR */
          <div className="animate-in fade-in duration-300">
            <InspectionGenerator />
          </div>
        )}

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
