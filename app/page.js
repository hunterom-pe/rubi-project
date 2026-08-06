"use client";

import { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import InspectionGenerator from "./components/InspectionGenerator";
import { 
  Shield, Sparkles, Copy, Check, AlertCircle, RefreshCw, 
  Info, FileText, Send, History, Trash2, ExternalLink, Search, Clock, Download, ChevronRight, Bookmark
} from "lucide-react";

const SAMPLE_PRESETS = [
  {
    label: "HVAC Pre-existing Condition",
    claim: "Customer states the central A/C unit stopped cooling during a hot week. Technician inspected and found severe rust, prior improper wiring, and compressor failure that existed prior to policy inception.",
    reason: "Excluded under Policy Section 3A: Pre-existing defects and pre-policy mechanical failure."
  },
  {
    label: "Plumbing Wear & Tear",
    claim: "Homeowner reported slow drainage in main sewer line leading to backup in basement shower. Inspection showed tree root infiltration and pipe collapse.",
    reason: "Section 4B: Outside sewer line root damage and natural wear-and-tear are not covered."
  },
  {
    label: "Appliance Lack of Maintenance",
    claim: "Refrigerator ice maker stopped working and compressor overheating. Unit was completely clogged with 5 years of pet hair and dust, causing thermal failure.",
    reason: "Section 2C: Failure caused by failure to perform routine annual maintenance."
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
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between">
      
      {/* Top Navbar */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Tab View */}
      <div className={`mx-auto w-full py-8 px-4 sm:px-6 lg:px-8 flex-1 ${activeTab === "inspection" ? "max-w-5xl" : "max-w-3xl"}`}>
        
        {activeTab === "denial" ? (
          /* TAB 1: WARRANTY DENIAL WRITER */
          <div className="space-y-8 animate-in fade-in duration-200">
            
            {/* Header Section */}
            <header className="text-center space-y-3">
              <div className="inline-flex items-center justify-center p-3 bg-indigo-100 text-indigo-600 rounded-2xl shadow-xs mb-1 ring-8 ring-indigo-50/50">
                <Shield className="w-8 h-8 stroke-[2.2]" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
                Warranty Denial Draft Writer
              </h1>
              <p className="text-slate-600 text-base sm:text-lg max-w-xl mx-auto font-normal">
                Generate professional, empathetic denial emails in seconds.
              </p>
            </header>

            {/* Preset Sample Selector */}
            <div className="bg-white/80 backdrop-blur-xs p-4 rounded-xl border border-slate-200/80 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <span className="flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-indigo-500" />
                  Quick Presets (Try an example claim)
                </span>
                {(claim || reason) && (
                  <button
                    onClick={() => { setClaim(""); setReason(""); setDraft(""); setError(null); }}
                    type="button"
                    className="text-xs text-slate-400 hover:text-slate-600 font-normal transition-colors cursor-pointer"
                  >
                    Clear fields
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                {SAMPLE_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => applyPreset(preset)}
                    className="text-xs font-medium bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-indigo-200 transition-all cursor-pointer text-left"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Main Form Card */}
            <main className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
              <form onSubmit={handleDenialSubmit} className="space-y-6">
                
                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="font-semibold">Generation Failed</p>
                      <p className="text-red-600">{error}</p>
                    </div>
                  </div>
                )}

                {/* Textarea 1: Customer Claim Request */}
                <div className="space-y-2">
                  <label 
                    htmlFor="claim-input" 
                    className="block text-sm font-semibold text-slate-800"
                  >
                    1. Customer Claim Request
                  </label>
                  <textarea
                    id="claim-input"
                    rows={3}
                    value={claim}
                    onChange={(e) => setClaim(e.target.value)}
                    placeholder="Paste customer request or claim summary here..."
                    className="w-full rounded-xl border border-slate-200 bg-white p-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all resize-y"
                    required
                  />
                </div>

                {/* Textarea 2: Basic Denial Explanation */}
                <div className="space-y-2">
                  <label 
                    htmlFor="reason-input" 
                    className="block text-sm font-semibold text-slate-800"
                  >
                    2. Basic Denial Explanation
                  </label>
                  <textarea
                    id="reason-input"
                    rows={2}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="e.g., Pre-existing condition, unmaintained HVAC, or excluded under section 4B..."
                    className="w-full rounded-xl border border-slate-200 bg-white p-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all resize-y"
                    required
                  />
                </div>

                {/* Radio Option Group: Response Length */}
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-slate-800">
                    3. Response Length
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {["Short", "Medium", "Long"].map((option) => (
                      <label
                        key={option}
                        className={`relative flex items-center justify-center p-3 rounded-xl border cursor-pointer text-sm font-medium transition-all ${
                          length === option
                            ? "border-indigo-600 bg-indigo-50/50 text-indigo-700 ring-1 ring-indigo-600"
                            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300"
                        }`}
                      >
                        <input
                          type="radio"
                          name="response-length"
                          value={option}
                          checked={length === option}
                          onChange={(e) => setLength(e.target.value)}
                          className="sr-only"
                        />
                        <span>{option}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Primary Action Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-3.5 px-4 rounded-xl font-semibold text-sm text-white shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    loading
                      ? "bg-indigo-400 cursor-not-allowed opacity-90"
                      : "bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99]"
                  }`}
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-white" />
                      <span>Drafting Response...</span>
                    </>
                  ) : (
                    <>
                      <span>Generate Email Draft</span>
                      <Sparkles className="w-4 h-4 text-indigo-200" />
                    </>
                  )}
                </button>
              </form>
            </main>

            {/* Output Card */}
            {draft && (
              <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-teal-500"></div>
                    <h2 className="text-lg font-bold text-slate-900">
                      Generated Email Draft
                    </h2>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopy(draft)}
                    className={`inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold border transition-all duration-200 cursor-pointer ${
                      copied
                        ? "bg-teal-100 text-teal-700 border-teal-300 shadow-xs"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                    }`}
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-teal-700 stroke-[2.5]" />
                        <span>✓ Copied to Clipboard!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-500" />
                        <span>Copy Draft</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-4 sm:p-5 text-slate-800 text-sm leading-relaxed whitespace-pre-wrap font-sans select-text">
                  {draft}
                </div>

                <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 pt-2 px-1">
                  <span className="flex items-center gap-1 text-slate-400">
                    <Info className="w-3.5 h-3.5" />
                    Saved automatically to your history below.
                  </span>
                  <a
                    href={`mailto:?subject=${encodeURIComponent(
                      draft.match(/^Subject:\s*(.*)/i)?.[1] || "Warranty Claim Update"
                    )}&body=${encodeURIComponent(draft)}`}
                    className="text-indigo-600 hover:text-indigo-700 font-medium hover:underline inline-flex items-center gap-1 mt-1 sm:mt-0"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Open in Email Client
                  </a>
                </div>
              </section>
            )}

            {/* Draft History Section */}
            <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-slate-100 text-slate-700 rounded-xl">
                    <History className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      Saved Draft History
                      <span className="bg-slate-100 text-slate-600 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-slate-200">
                        {history.length}
                      </span>
                    </h2>
                    <p className="text-xs text-slate-500">Stored securely in your browser's local storage</p>
                  </div>
                </div>

                {history.length > 0 && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={exportHistoryJSON}
                      className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-indigo-600 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Export
                    </button>
                    <button
                      type="button"
                      onClick={clearAllHistory}
                      className="inline-flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-700 px-3 py-1.5 rounded-lg border border-red-200 hover:bg-red-50 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Clear All
                    </button>
                  </div>
                )}
              </div>

              {history.length === 0 ? (
                <div className="text-center py-8 space-y-2">
                  <Bookmark className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-sm font-medium text-slate-600">No saved drafts yet</p>
                  <p className="text-xs text-slate-400">Drafts generated above will automatically be saved here for quick reference.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search past claim requests, denial reasons, or draft text..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                    {filteredHistory.length === 0 ? (
                      <p className="text-center text-xs text-slate-400 py-4">No drafts match your search term.</p>
                    ) : (
                      filteredHistory.map((item) => {
                        const isSelected = selectedHistoryItem?.id === item.id;
                        const isCopied = copiedHistoryId === item.id;

                        return (
                          <div
                            key={item.id}
                            onClick={() => setSelectedHistoryItem(isSelected ? null : item)}
                            className={`rounded-xl border transition-all cursor-pointer p-4 space-y-3 ${
                              isSelected
                                ? "border-indigo-500 bg-indigo-50/20 ring-1 ring-indigo-500/30 shadow-xs"
                                : "border-slate-200 bg-slate-50/50 hover:bg-slate-100/70 hover:border-slate-300"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="space-y-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-semibold text-slate-900 truncate max-w-[240px] sm:max-w-[360px]">
                                    {item.claim}
                                  </span>
                                  <span className="text-[10px] font-medium bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full shrink-0">
                                    {item.length}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-500 truncate">
                                  Reason: {item.reason}
                                </p>
                              </div>

                              <div className="flex items-center gap-1 shrink-0 text-slate-400">
                                <span className="text-[11px] text-slate-400 flex items-center gap-1 mr-1">
                                  <Clock className="w-3 h-3" />
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
                                <div className="bg-white p-3.5 rounded-lg border border-slate-200 text-xs text-slate-800 leading-relaxed whitespace-pre-wrap font-sans">
                                  {item.draft}
                                </div>
                                
                                <div className="flex items-center justify-between gap-2 pt-1">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      loadFromHistory(item);
                                    }}
                                    className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 cursor-pointer"
                                  >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                    Load into Generator
                                  </button>

                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleCopy(item.draft, item.id);
                                      }}
                                      className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                                        isCopied
                                          ? "bg-teal-100 text-teal-700 border-teal-300"
                                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                                      }`}
                                    >
                                      {isCopied ? <Check className="w-3.5 h-3.5 text-teal-700" /> : <Copy className="w-3.5 h-3.5" />}
                                      <span>{isCopied ? "Copied!" : "Copy"}</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => deleteHistoryItem(item.id, e)}
                                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                                      title="Delete item"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
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
          <div className="animate-in fade-in duration-200">
            <InspectionGenerator />
          </div>
        )}

      </div>

      {/* Footer */}
      <footer className="text-center text-xs text-slate-400 py-4 border-t border-slate-200/60 bg-white">
        Powered by Gemini 3.6 Flash & Google Gen AI SDK • Home Warranty Specialist Suite
      </footer>

    </div>
  );
}
