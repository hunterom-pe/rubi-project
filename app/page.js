"use client";

import { useState } from "react";
import { Shield, Sparkles, Copy, Check, AlertCircle, RefreshCw, Info, FileText, Send } from "lucide-react";

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

export default function Home() {
  const [claim, setClaim] = useState("");
  const [reason, setReason] = useState("");
  const [length, setLength] = useState("Medium");
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e) => {
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

      setDraft(data.draft);
    } catch (err) {
      setError(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!draft) return;
    navigator.clipboard.writeText(draft);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  const applyPreset = (preset) => {
    setClaim(preset.claim);
    setReason(preset.reason);
    setError(null);
  };

  const handleClear = () => {
    setClaim("");
    setReason("");
    setDraft("");
    setError(null);
    setCopied(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        
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
                onClick={handleClear}
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
          <form onSubmit={handleSubmit} className="space-y-6">
            
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

        {/* Output Card (Displays when result exists) */}
        {draft && (
          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Card Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-teal-500"></div>
                <h2 className="text-lg font-bold text-slate-900">
                  Generated Email Draft
                </h2>
              </div>

              {/* Copy Draft Button */}
              <button
                type="button"
                onClick={handleCopy}
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

            {/* Draft Display Box */}
            <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-4 sm:p-5 text-slate-800 text-sm leading-relaxed whitespace-pre-wrap font-sans select-text">
              {draft}
            </div>

            {/* Helper Footer Actions */}
            <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 pt-2 px-1">
              <span className="flex items-center gap-1 text-slate-400">
                <Info className="w-3.5 h-3.5" />
                Review and edit as needed prior to sending to customer.
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

        {/* Footer */}
        <footer className="text-center text-xs text-slate-400 py-4">
          Powered by Gemini 3.6 Flash & Google Gen AI SDK • Home Warranty Customer Care
        </footer>

      </div>
    </div>
  );
}
