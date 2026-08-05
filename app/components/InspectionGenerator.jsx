"use client";

import { useState } from "react";
import { 
  FileText, Upload, Sparkles, CheckCircle2, AlertTriangle, AlertCircle, 
  Download, Edit3, Plus, Trash2, RefreshCw, File, ChevronDown, Filter, LayerGroup
} from "lucide-react";
import { 
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, 
  Table, TableRow, TableCell, WidthType, BorderStyle, ShadingType 
} from "docx";

export default function InspectionGenerator() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null); // { redItems: [], yellowItems: [], fileName: "" }
  const [activeFilter, setActiveFilter] = useState("all"); // "all" | "red" | "yellow"
  const [isExporting, setIsExporting] = useState(false);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.toLowerCase().endsWith(".pdf")) {
        setError("Please select a valid PDF file.");
        return;
      }
      if (selectedFile.size > 25 * 1024 * 1024) {
        setError("File size exceeds 25MB limit.");
        return;
      }
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      if (!droppedFile.name.toLowerCase().endsWith(".pdf")) {
        setError("Please drop a valid PDF file.");
        return;
      }
      if (droppedFile.size > 25 * 1024 * 1024) {
        setError("File size exceeds 25MB limit.");
        return;
      }
      setFile(droppedFile);
      setError(null);
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError("Please upload a PDF file first.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/parse-inspection", {
        method: "POST",
        body: formData,
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Failed to analyze inspection PDF.");
      }

      setData(result);
    } catch (err) {
      setError(err.message || "An error occurred while analyzing the PDF.");
    } finally {
      setLoading(false);
    }
  };

  // Helper to update item field inline
  const updateItem = (category, index, field, value) => {
    if (!data) return;
    const updatedList = [...data[category]];
    updatedList[index] = { ...updatedList[index], [field]: value };
    setData({ ...data, [category]: updatedList });
  };

  // Delete item
  const deleteItem = (category, index) => {
    if (!data) return;
    const updatedList = data[category].filter((_, idx) => idx !== index);
    setData({ ...data, [category]: updatedList });
  };

  // Add new item manually
  const addItem = (category) => {
    if (!data) return;
    const newItem = {
      code: "1.0",
      section: "General / Miscellaneous",
      title: "New Inspection Finding",
      summary: "Short 1-2 sentence description of the defect.",
    };
    setData({ ...data, [category]: [...data[category], newItem] });
  };

  // Helper to group items by section
  const groupItemsBySection = (items) => {
    const map = {};
    items.forEach((item) => {
      const sec = item.section || "General / Miscellaneous";
      if (!map[sec]) map[sec] = [];
      map[sec].push(item);
    });
    return map;
  };

  // Generate and Download Word Document (.docx)
  const generateWordDoc = async () => {
    if (!data) return;
    setIsExporting(true);

    try {
      const docChildren = [
        // Main Title Header
        new Paragraph({
          text: "Inspection Defect Summary Report",
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
          spaceBefore: 200,
          spaceAfter: 300, // Generous spacing after document title
        }),

        // Sub-header File Metadata
        new Paragraph({
          children: [
            new TextRun({ text: `Report File: `, bold: true, size: 20, color: "475569" }),
            new TextRun({ text: `${data.fileName || "Inspection_Report.pdf"}`, size: 20, color: "1E293B" }),
            new TextRun({ text: `    |    Date Generated: `, bold: true, size: 20, color: "475569" }),
            new TextRun({ text: `${new Date().toLocaleDateString()}`, size: 20, color: "1E293B" }),
          ],
          alignment: AlignmentType.CENTER,
          spaceAfter: 600, // Clear separation space before main document content
        }),

        // Decorative Separator Spacer
        new Paragraph({
          text: "",
          spaceAfter: 400,
        }),
      ];

      // Helper function to build a severity category section in Word
      const addCategoryToDoc = (title, items, isRed) => {
        if (!items || items.length === 0) return;

        // Category Header Banner
        docChildren.push(
          new Paragraph({
            children: [
              new TextRun({
                text: title,
                bold: true,
                size: 26,
                color: isRed ? "991B1B" : "92400E", // Dark red vs dark amber
              }),
            ],
            heading: HeadingLevel.HEADING_2,
            spaceBefore: 400, // Generous spacing before top category header
            spaceAfter: 250,
          })
        );

        const grouped = groupItemsBySection(items);

        Object.keys(grouped).forEach((sectionName) => {
          // Section Heading
          docChildren.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: sectionName,
                  bold: true,
                  size: 22,
                  color: "1E293B",
                }),
              ],
              heading: HeadingLevel.HEADING_3,
              spaceBefore: 250,
              spaceAfter: 150,
            })
          );

          // Table of items for this section
          const tableRows = [
            // Header Row
            new TableRow({
              tableHeader: true,
              children: [
                new TableCell({
                  width: { size: 15, type: WidthType.PERCENTAGE },
                  shading: { fill: "F1F5F9", type: ShadingType.CLEAR },
                  children: [new Paragraph({ children: [new TextRun({ text: "Code", bold: true, size: 18 })] })],
                }),
                new TableCell({
                  width: { size: 35, type: WidthType.PERCENTAGE },
                  shading: { fill: "F1F5F9", type: ShadingType.CLEAR },
                  children: [new Paragraph({ children: [new TextRun({ text: "Finding / Item Title", bold: true, size: 18 })] })],
                }),
                new TableCell({
                  width: { size: 50, type: WidthType.PERCENTAGE },
                  shading: { fill: "F1F5F9", type: ShadingType.CLEAR },
                  children: [new Paragraph({ children: [new TextRun({ text: "Inspection Summary", bold: true, size: 18 })] })],
                }),
              ],
            }),
          ];

          grouped[sectionName].forEach((item) => {
            tableRows.push(
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: item.code || "-", size: 18, bold: true })] })],
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: item.title || "Item", size: 18, bold: true })] })],
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: item.summary || "", size: 18 })] })],
                  }),
                ],
              })
            );
          });

          docChildren.push(
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: tableRows,
            })
          );

          // Spacer after table
          docChildren.push(new Paragraph({ text: "", spaceAfter: 250 }));
        });
      };

      // Add Red Items
      addCategoryToDoc("1. SIGNIFICANT AND/OR SAFETY CONCERNS (RED ITEMS)", data.redItems, true);

      // Add Yellow Items
      addCategoryToDoc("2. POSSIBLE DEFECTS & MAINTENANCE (YELLOW ITEMS)", data.yellowItems, false);

      const doc = new Document({
        sections: [
          {
            properties: {},
            children: docChildren,
          },
        ],
      });

      const blob = await Packer.toBlob(doc);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Inspection_Summary_Report_${new Date().toISOString().slice(0, 10)}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to export Word document:", err);
      alert("Failed to export Word document. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const totalRed = data?.redItems?.length || 0;
  const totalYellow = data?.yellowItems?.length || 0;

  return (
    <div className="space-y-8">
      
      {/* Header Banner */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center p-3 bg-indigo-100 text-indigo-600 rounded-2xl mb-1 ring-8 ring-indigo-50/50">
          <FileText className="w-8 h-8 stroke-[2.2]" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
          Inspection Summary Word Generator
        </h1>
        <p className="text-slate-600 text-base sm:text-lg max-w-xl mx-auto font-normal">
          Upload an inspection PDF report to extract and categorize Red & Yellow defects into a formatted Word (.docx) document.
        </p>
      </div>

      {/* Main Upload Card */}
      {!data && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
          <form onSubmit={handleUploadSubmit} className="space-y-6">
            
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold">Error</p>
                  <p className="text-red-600">{error}</p>
                </div>
              </div>
            )}

            {/* File Drag and Drop Zone */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer ${
                file
                  ? "border-indigo-500 bg-indigo-50/30"
                  : "border-slate-300 hover:border-indigo-400 bg-slate-50/50 hover:bg-slate-50"
              }`}
            >
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="hidden"
                id="pdf-upload-input"
              />
              <label htmlFor="pdf-upload-input" className="cursor-pointer space-y-3 block">
                <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto shadow-xs">
                  {file ? <File className="w-6 h-6" /> : <Upload className="w-6 h-6" />}
                </div>
                
                {file ? (
                  <div>
                    <p className="text-sm font-bold text-indigo-900">{file.name}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB • Ready to analyze
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-slate-800">
                      Click to upload or drag & drop inspection PDF
                    </p>
                    <p className="text-xs text-slate-400">
                      Supports inspection report PDFs up to 25MB
                    </p>
                  </div>
                )}
              </label>
            </div>

            {/* Analyze Action Button */}
            <button
              type="submit"
              disabled={loading || !file}
              className={`w-full py-3.5 px-4 rounded-xl font-semibold text-sm text-white shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
                loading || !file
                  ? "bg-indigo-400 cursor-not-allowed opacity-90"
                  : "bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99]"
              }`}
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>Scanning PDF & Categorizing Findings...</span>
                </>
              ) : (
                <>
                  <span>Analyze Inspection PDF</span>
                  <Sparkles className="w-4 h-4 text-indigo-200" />
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* Editable Results & Preview Section */}
      {data && (
        <div className="space-y-6">
          
          {/* Header Action Bar */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <span>Inspection Analysis Results</span>
                <span className="text-xs font-medium bg-indigo-100 text-indigo-700 px-2.5 py-0.5 rounded-full">
                  {totalRed + totalYellow} Items Extracted
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Source File: <strong className="text-slate-700">{data.fileName}</strong>
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => { setData(null); setFile(null); }}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
              >
                Upload New PDF
              </button>
              
              <button
                type="button"
                onClick={generateWordDoc}
                disabled={isExporting}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-all cursor-pointer active:scale-95"
              >
                {isExporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                <span>Download Word Doc (.docx)</span>
              </button>
            </div>
          </div>

          {/* Stats & Category Filter */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button
              onClick={() => setActiveFilter("all")}
              className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                activeFilter === "all"
                  ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                  : "bg-white text-slate-800 border-slate-200 hover:border-slate-300"
              }`}
            >
              <p className="text-xs opacity-75 font-medium">All Categorized Items</p>
              <p className="text-2xl font-extrabold mt-1">{totalRed + totalYellow}</p>
            </button>

            <button
              onClick={() => setActiveFilter("red")}
              className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                activeFilter === "red"
                  ? "bg-red-600 text-white border-red-600 shadow-xs"
                  : "bg-white text-red-700 border-red-200 hover:border-red-300"
              }`}
            >
              <div className="flex items-center justify-between">
                <p className="text-xs opacity-80 font-medium">Red Items (Safety/Significant)</p>
                <AlertCircle className="w-4 h-4" />
              </div>
              <p className="text-2xl font-extrabold mt-1">{totalRed}</p>
            </button>

            <button
              onClick={() => setActiveFilter("yellow")}
              className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                activeFilter === "yellow"
                  ? "bg-amber-500 text-white border-amber-500 shadow-xs"
                  : "bg-white text-amber-700 border-amber-200 hover:border-amber-300"
              }`}
            >
              <div className="flex items-center justify-between">
                <p className="text-xs opacity-80 font-medium">Yellow Items (Possible Defects)</p>
                <AlertTriangle className="w-4 h-4" />
              </div>
              <p className="text-2xl font-extrabold mt-1">{totalYellow}</p>
            </button>
          </div>

          {/* Render Red Items */}
          {(activeFilter === "all" || activeFilter === "red") && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-red-50 p-4 rounded-xl border border-red-200">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-red-600"></span>
                  <h3 className="font-bold text-red-900 text-sm sm:text-base">
                    🔴 Significant and/or Safety Concerns ({totalRed})
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => addItem("redItems")}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-red-700 bg-white hover:bg-red-100 px-3 py-1.5 rounded-lg border border-red-300 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Red Item
                </button>
              </div>

              {data.redItems.length === 0 ? (
                <p className="text-xs text-slate-400 italic px-2">No Red (Safety Concern) items detected.</p>
              ) : (
                data.redItems.map((item, idx) => (
                  <div key={`red-${idx}`} className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-500">Item Code</label>
                        <input
                          type="text"
                          value={item.code}
                          onChange={(e) => updateItem("redItems", idx, "code", e.target.value)}
                          className="w-full mt-1 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-slate-50"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-500">Section Group</label>
                        <input
                          type="text"
                          value={item.section}
                          onChange={(e) => updateItem("redItems", idx, "section", e.target.value)}
                          className="w-full mt-1 px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-semibold text-slate-500">Item Title</label>
                        <input
                          type="text"
                          value={item.title}
                          onChange={(e) => updateItem("redItems", idx, "title", e.target.value)}
                          className="w-full mt-1 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-slate-50"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[11px] font-semibold text-slate-500">Inspection Summary (1-2 Sentences)</label>
                        <button
                          type="button"
                          onClick={() => deleteItem("redItems", idx)}
                          className="text-xs text-red-600 hover:text-red-700 inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete
                        </button>
                      </div>
                      <textarea
                        rows={2}
                        value={item.summary}
                        onChange={(e) => updateItem("redItems", idx, "summary", e.target.value)}
                        className="w-full p-3 text-xs rounded-lg border border-slate-200 bg-slate-50 leading-relaxed outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Render Yellow Items */}
          {(activeFilter === "all" || activeFilter === "yellow") && (
            <div className="space-y-4 pt-4">
              <div className="flex items-center justify-between bg-amber-50 p-4 rounded-xl border border-amber-200">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                  <h3 className="font-bold text-amber-900 text-sm sm:text-base">
                    🟡 Possible Defects & Maintenance Items ({totalYellow})
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => addItem("yellowItems")}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-amber-800 bg-white hover:bg-amber-100 px-3 py-1.5 rounded-lg border border-amber-300 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Yellow Item
                </button>
              </div>

              {data.yellowItems.length === 0 ? (
                <p className="text-xs text-slate-400 italic px-2">No Yellow (Possible Defect) items detected.</p>
              ) : (
                data.yellowItems.map((item, idx) => (
                  <div key={`yellow-${idx}`} className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-500">Item Code</label>
                        <input
                          type="text"
                          value={item.code}
                          onChange={(e) => updateItem("yellowItems", idx, "code", e.target.value)}
                          className="w-full mt-1 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-slate-50"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-500">Section Group</label>
                        <input
                          type="text"
                          value={item.section}
                          onChange={(e) => updateItem("yellowItems", idx, "section", e.target.value)}
                          className="w-full mt-1 px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-semibold text-slate-500">Item Title</label>
                        <input
                          type="text"
                          value={item.title}
                          onChange={(e) => updateItem("yellowItems", idx, "title", e.target.value)}
                          className="w-full mt-1 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-slate-50"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[11px] font-semibold text-slate-500">Inspection Summary (1-2 Sentences)</label>
                        <button
                          type="button"
                          onClick={() => deleteItem("yellowItems", idx)}
                          className="text-xs text-red-600 hover:text-red-700 inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete
                        </button>
                      </div>
                      <textarea
                        rows={2}
                        value={item.summary}
                        onChange={(e) => updateItem("yellowItems", idx, "summary", e.target.value)}
                        className="w-full p-3 text-xs rounded-lg border border-slate-200 bg-slate-50 leading-relaxed outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

        </div>
      )}

    </div>
  );
}
