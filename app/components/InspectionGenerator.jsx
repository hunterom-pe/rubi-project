"use client";

import { useState } from "react";
import { 
  FileText, Upload, Sparkles, AlertTriangle, AlertCircle, 
  Download, Plus, Trash2, RefreshCw, File, Image as ImageIcon, Sparkle, Layers, CheckCircle2
} from "lucide-react";
import { 
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, 
  Table, TableRow, TableCell, WidthType, ShadingType, ImageRun
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

  const updateItem = (category, index, field, value) => {
    if (!data) return;
    const updatedList = [...data[category]];
    updatedList[index] = { ...updatedList[index], [field]: value };
    setData({ ...data, [category]: updatedList });
  };

  const deleteItem = (category, index) => {
    if (!data) return;
    const updatedList = data[category].filter((_, idx) => idx !== index);
    setData({ ...data, [category]: updatedList });
  };

  const addItem = (category) => {
    if (!data) return;
    const newItem = {
      code: "1.0",
      section: "General / Miscellaneous",
      title: "New Inspection Finding",
      summary: "Short 1-2 sentence description of the defect.",
      images: [],
    };
    setData({ ...data, [category]: [...data[category], newItem] });
  };

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
          spaceAfter: 300,
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
          spaceAfter: 600,
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
                color: isRed ? "991B1B" : "92400E",
              }),
            ],
            heading: HeadingLevel.HEADING_2,
            spaceBefore: 400,
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
                  width: { size: 12, type: WidthType.PERCENTAGE },
                  shading: { fill: "F1F5F9", type: ShadingType.CLEAR },
                  children: [new Paragraph({ children: [new TextRun({ text: "Code", bold: true, size: 18 })] })],
                }),
                new TableCell({
                  width: { size: 28, type: WidthType.PERCENTAGE },
                  shading: { fill: "F1F5F9", type: ShadingType.CLEAR },
                  children: [new Paragraph({ children: [new TextRun({ text: "Finding / Item Title", bold: true, size: 18 })] })],
                }),
                new TableCell({
                  width: { size: isRed ? 35 : 60, type: WidthType.PERCENTAGE },
                  shading: { fill: "F1F5F9", type: ShadingType.CLEAR },
                  children: [new Paragraph({ children: [new TextRun({ text: "Inspection Summary", bold: true, size: 18 })] })],
                }),
                ...(isRed
                  ? [
                      new TableCell({
                        width: { size: 25, type: WidthType.PERCENTAGE },
                        shading: { fill: "F1F5F9", type: ShadingType.CLEAR },
                        children: [new Paragraph({ children: [new TextRun({ text: "Defect Photos", bold: true, size: 18 })] })],
                      }),
                    ]
                  : []),
              ],
            }),
          ];

          grouped[sectionName].forEach((item) => {
            const summaryChildren = [new Paragraph({ children: [new TextRun({ text: item.summary || "", size: 18 })] })];

            const rowCells = [
              new TableCell({
                children: [new Paragraph({ children: [new TextRun({ text: item.code || "-", size: 18, bold: true })] })],
              }),
              new TableCell({
                children: [new Paragraph({ children: [new TextRun({ text: item.title || "Item", size: 18, bold: true })] })],
              }),
              new TableCell({
                children: summaryChildren,
              }),
            ];

            if (isRed) {
              const imageCellChildren = [];
              const itemImages = item.images && item.images.length > 0 
                ? item.images 
                : item.imageUrl 
                ? [{ dataUrl: item.imageUrl }] 
                : [];

              if (itemImages.length > 0) {
                itemImages.forEach((imgObj, imgIdx) => {
                  try {
                    const imageBytes = Uint8Array.from(atob(imgObj.base64), (c) => c.charCodeAt(0));
                    imageCellChildren.push(
                      new Paragraph({
                        children: [
                          new ImageRun({
                            data: imageBytes,
                            transformation: {
                              width: 140,
                              height: 105,
                            },
                          }),
                        ],
                        spaceAfter: 100,
                      })
                    );
                  } catch (e) {
                    console.warn(`Failed to render image ${imgIdx} in Word:`, e);
                  }
                });
              } else {
                imageCellChildren.push(new Paragraph({ children: [new TextRun({ text: "N/A", size: 16, color: "94A3B8" })] }));
              }

              rowCells.push(new TableCell({ children: imageCellChildren }));
            }

            tableRows.push(new TableRow({ children: rowCells }));
          });

          docChildren.push(
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: tableRows,
            })
          );

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
    <div className="space-y-8 max-w-5xl mx-auto">
      
      {/* Playful Hero Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-violet-100 via-indigo-100 to-pink-100 text-indigo-900 border border-indigo-200/80 shadow-2xs font-semibold text-xs mb-1">
          <Sparkles className="w-4 h-4 text-violet-600 fill-violet-100" />
          <span>Automated Word Summary Builder</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900">
          Inspection Summary <span className="gradient-text-hero">Word Generator</span>
        </h1>
        <p className="text-slate-600 text-base sm:text-lg max-w-xl mx-auto font-medium leading-relaxed">
          Upload any inspection PDF report to extract Red & Yellow defects and download a formatted Word (.docx) document.
        </p>
      </div>

      {/* Main Upload Card */}
      {!data && (
        <div className="bg-white rounded-3xl border border-indigo-100/90 shadow-md p-6 sm:p-9 space-y-7 card-playful">
          <form onSubmit={handleUploadSubmit} className="space-y-7">
            
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border-2 border-red-200 text-red-700 p-4.5 rounded-2xl text-sm flex items-start gap-3.5 shadow-2xs">
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold">Parsing Error</p>
                  <p className="text-red-600 text-xs font-medium">{error}</p>
                </div>
              </div>
            )}

            {/* Drag & Drop File Box */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className={`border-3 border-dashed rounded-3xl p-9 sm:p-12 text-center transition-all cursor-pointer ${
                file
                  ? "border-indigo-500 bg-indigo-50/50 shadow-inner"
                  : "border-indigo-200 hover:border-violet-400 bg-gradient-to-b from-slate-50/60 to-indigo-50/20 hover:bg-indigo-50/40"
              }`}
            >
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="hidden"
                id="pdf-upload-input"
              />
              <label htmlFor="pdf-upload-input" className="cursor-pointer space-y-4 block">
                <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-indigo-500 via-violet-500 to-pink-500 text-white flex items-center justify-center mx-auto shadow-md shadow-indigo-500/20 hover:scale-105 transition-transform duration-200">
                  {file ? <File className="w-8 h-8" /> : <Upload className="w-8 h-8" />}
                </div>
                
                {file ? (
                  <div className="space-y-1">
                    <p className="text-base font-extrabold text-indigo-900">{file.name}</p>
                    <p className="text-xs font-semibold text-indigo-600/80 bg-indigo-100/70 inline-block px-3 py-1 rounded-full">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB • Ready for AI extraction
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <p className="text-base font-bold text-slate-800">
                      Click to choose or drop inspection PDF report here
                    </p>
                    <p className="text-xs text-slate-400 font-medium">
                      Supports HomeGauge, Spectora, InspectHQ, and custom PDFs up to 25MB
                    </p>
                  </div>
                )}
              </label>
            </div>

            {/* Analyze Action Button */}
            <button
              type="submit"
              disabled={loading || !file}
              className={`w-full py-4 px-6 rounded-2xl font-extrabold text-base text-white shadow-lg transition-all flex items-center justify-center gap-2.5 cursor-pointer ${
                loading || !file
                  ? "bg-indigo-300 cursor-not-allowed opacity-80"
                  : "bg-gradient-to-r from-indigo-600 via-violet-600 to-pink-600 hover:from-indigo-700 hover:via-violet-700 hover:to-pink-700 active:scale-[0.99] shadow-indigo-500/25"
              }`}
            >
              {loading ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin text-white" />
                  <span>Parsing Full PDF & Extracting Defect Photos...</span>
                </>
              ) : (
                <>
                  <span>Analyze Inspection PDF</span>
                  <Sparkles className="w-5 h-5 text-pink-200 fill-pink-200" />
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* Editable Results & Preview Section */}
      {data && (
        <div className="space-y-7 animate-in fade-in duration-300">
          
          {/* Header Action Bar */}
          <div className="bg-white rounded-3xl border border-indigo-100 shadow-md p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4 card-playful">
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Inspection Analysis Results
                </h2>
                <span className="inline-flex items-center px-3.5 py-1 rounded-full text-xs font-extrabold bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-2xs">
                  {totalRed + totalYellow} Items Extracted
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 font-medium truncate max-w-lg mt-1">
                Source File: <strong className="text-slate-800">{data.fileName}</strong>
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => { setData(null); setFile(null); }}
                className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold border-2 border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors cursor-pointer"
              >
                Upload New PDF
              </button>
              
              <button
                type="button"
                onClick={generateWordDoc}
                disabled={isExporting}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold bg-gradient-to-r from-indigo-600 via-violet-600 to-pink-600 hover:from-indigo-700 hover:to-pink-700 text-white shadow-md transition-all cursor-pointer active:scale-95 shadow-indigo-500/20"
              >
                {isExporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                <span>Download Word Doc (.docx)</span>
              </button>
            </div>
          </div>

          {/* Stats & Category Filter Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button
              onClick={() => setActiveFilter("all")}
              className={`p-5 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                activeFilter === "all"
                  ? "bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-slate-900/20"
                  : "bg-white text-slate-800 border-slate-200 hover:border-slate-300 shadow-2xs"
              }`}
            >
              <p className="text-xs opacity-80 font-bold uppercase tracking-wider">All Categorized Items</p>
              <p className="text-3xl font-black mt-1">{totalRed + totalYellow}</p>
            </button>

            <button
              onClick={() => setActiveFilter("red")}
              className={`p-5 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                activeFilter === "red"
                  ? "bg-gradient-to-br from-red-600 to-rose-600 text-white border-rose-600 shadow-md ring-2 ring-rose-500/20"
                  : "bg-white text-rose-700 border-rose-200 hover:border-rose-300 shadow-2xs"
              }`}
            >
              <div className="flex items-center justify-between">
                <p className="text-xs opacity-90 font-bold uppercase tracking-wider">Red Items (Safety Concerns)</p>
                <AlertCircle className="w-5 h-5" />
              </div>
              <p className="text-3xl font-black mt-1">{totalRed}</p>
            </button>

            <button
              onClick={() => setActiveFilter("yellow")}
              className={`p-5 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                activeFilter === "yellow"
                  ? "bg-gradient-to-br from-amber-500 to-orange-500 text-white border-amber-500 shadow-md ring-2 ring-amber-500/20"
                  : "bg-white text-amber-800 border-amber-200 hover:border-amber-300 shadow-2xs"
              }`}
            >
              <div className="flex items-center justify-between">
                <p className="text-xs opacity-90 font-bold uppercase tracking-wider">Yellow Items (Maintenance)</p>
                <AlertTriangle className="w-5 h-5" />
              </div>
              <p className="text-3xl font-black mt-1">{totalYellow}</p>
            </button>
          </div>

          {/* Render Red Items */}
          {(activeFilter === "all" || activeFilter === "red") && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-gradient-to-r from-red-500 via-rose-500 to-pink-500 text-white p-4.5 rounded-2xl shadow-md">
                <div className="flex items-center gap-3">
                  <span className="w-3.5 h-3.5 rounded-full bg-white shadow-xs"></span>
                  <h3 className="font-extrabold text-white text-base tracking-tight">
                    Significant and/or Safety Concerns ({totalRed})
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => addItem("redItems")}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-red-700 bg-white hover:bg-red-50 px-3.5 py-1.5 rounded-xl shadow-2xs transition-transform active:scale-95 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Add Red Item
                </button>
              </div>

              {data.redItems.length === 0 ? (
                <div className="bg-white p-6 rounded-2xl border border-slate-200 text-center space-y-2">
                  <p className="text-xs text-slate-500 font-medium">No Red (Safety Concern) items detected in this report.</p>
                  <button
                    onClick={() => addItem("redItems")}
                    className="text-xs font-bold text-red-600 hover:underline inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Manually add a Red Item
                  </button>
                </div>
              ) : (
                data.redItems.map((item, idx) => {
                  const itemImages = item.images && item.images.length > 0 
                    ? item.images 
                    : item.imageUrl 
                    ? [{ dataUrl: item.imageUrl }] 
                    : [];

                  return (
                    <div key={`red-${idx}`} className="bg-white p-6 rounded-2xl border-2 border-slate-200/80 shadow-xs hover:border-rose-200 transition-colors space-y-4 card-playful">
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
                        <div>
                          <label className="block text-[11px] font-extrabold text-slate-500 uppercase">Item Code</label>
                          <input
                            type="text"
                            value={item.code}
                            onChange={(e) => updateItem("redItems", idx, "code", e.target.value)}
                            className="w-full mt-1 px-3.5 py-2 text-xs font-bold rounded-xl border-2 border-slate-200 bg-slate-50/60 focus:bg-white focus:border-rose-500 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-extrabold text-slate-500 uppercase">Section Group</label>
                          <input
                            type="text"
                            value={item.section}
                            onChange={(e) => updateItem("redItems", idx, "section", e.target.value)}
                            className="w-full mt-1 px-3.5 py-2 text-xs font-semibold rounded-xl border-2 border-slate-200 bg-slate-50/60 focus:bg-white focus:border-rose-500 outline-none"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-[11px] font-extrabold text-slate-500 uppercase">Item Title</label>
                          <input
                            type="text"
                            value={item.title}
                            onChange={(e) => updateItem("redItems", idx, "title", e.target.value)}
                            className="w-full mt-1 px-3.5 py-2 text-xs font-extrabold rounded-xl border-2 border-slate-200 bg-slate-50/60 focus:bg-white focus:border-rose-500 outline-none"
                          />
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="block text-[11px] font-extrabold text-slate-500 uppercase">Inspection Summary (1-2 Sentences)</label>
                          <button
                            type="button"
                            onClick={() => deleteItem("redItems", idx)}
                            className="text-xs text-rose-600 hover:text-rose-700 font-bold inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Delete Item
                          </button>
                        </div>
                        <textarea
                          rows={2.5}
                          value={item.summary}
                          onChange={(e) => updateItem("redItems", idx, "summary", e.target.value)}
                          className="w-full p-3.5 text-xs rounded-xl border-2 border-slate-200 bg-slate-50/60 focus:bg-white leading-relaxed outline-none focus:border-rose-500 font-medium"
                        />

                        {/* Defect Photo Thumbnails */}
                        <div className="space-y-2 pt-1">
                          <label className="block text-[11px] font-extrabold text-slate-600 flex items-center gap-1.5">
                            <ImageIcon className="w-4 h-4 text-rose-500" />
                            Extracted Defect Photos ({itemImages.length})
                          </label>
                          
                          {itemImages.length > 0 ? (
                            <div className="flex flex-wrap gap-2.5 pt-1">
                              {itemImages.map((img, imgIdx) => (
                                <div key={imgIdx} className="rounded-xl overflow-hidden border-2 border-slate-200 bg-slate-100 w-32 h-24 flex items-center justify-center shadow-2xs hover:scale-105 transition-transform duration-200">
                                  <img src={img.dataUrl} alt={`Photo ${imgIdx + 1}`} className="w-full h-full object-cover" />
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-3 text-[11px] text-slate-400 font-medium italic">
                              No embedded defect photos detected on page {item.pageNumber || "-"}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Render Yellow Items */}
          {(activeFilter === "all" || activeFilter === "yellow") && (
            <div className="space-y-4 pt-4">
              <div className="flex items-center justify-between bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white p-4.5 rounded-2xl shadow-md">
                <div className="flex items-center gap-3">
                  <span className="w-3.5 h-3.5 rounded-full bg-white shadow-xs"></span>
                  <h3 className="font-extrabold text-white text-base tracking-tight">
                    Possible Defects & Maintenance Items ({totalYellow})
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => addItem("yellowItems")}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-900 bg-white hover:bg-amber-50 px-3.5 py-1.5 rounded-xl shadow-2xs transition-transform active:scale-95 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Add Yellow Item
                </button>
              </div>

              {data.yellowItems.length === 0 ? (
                <div className="bg-white p-6 rounded-2xl border border-slate-200 text-center space-y-2">
                  <p className="text-xs text-slate-500 font-medium">No Yellow (Possible Defect) items detected in this report.</p>
                  <button
                    onClick={() => addItem("yellowItems")}
                    className="text-xs font-bold text-amber-700 hover:underline inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Manually add a Yellow Item
                  </button>
                </div>
              ) : (
                data.yellowItems.map((item, idx) => (
                  <div key={`yellow-${idx}`} className="bg-white p-6 rounded-2xl border-2 border-slate-200/80 shadow-xs hover:border-amber-300 transition-colors space-y-3.5 card-playful">
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
                      <div>
                        <label className="block text-[11px] font-extrabold text-slate-500 uppercase">Item Code</label>
                        <input
                          type="text"
                          value={item.code}
                          onChange={(e) => updateItem("yellowItems", idx, "code", e.target.value)}
                          className="w-full mt-1 px-3.5 py-2 text-xs font-bold rounded-xl border-2 border-slate-200 bg-slate-50/60 focus:bg-white focus:border-amber-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-extrabold text-slate-500 uppercase">Section Group</label>
                        <input
                          type="text"
                          value={item.section}
                          onChange={(e) => updateItem("yellowItems", idx, "section", e.target.value)}
                          className="w-full mt-1 px-3.5 py-2 text-xs font-semibold rounded-xl border-2 border-slate-200 bg-slate-50/60 focus:bg-white focus:border-amber-500 outline-none"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-extrabold text-slate-500 uppercase">Item Title</label>
                        <input
                          type="text"
                          value={item.title}
                          onChange={(e) => updateItem("yellowItems", idx, "title", e.target.value)}
                          className="w-full mt-1 px-3.5 py-2 text-xs font-extrabold rounded-xl border-2 border-slate-200 bg-slate-50/60 focus:bg-white focus:border-amber-500 outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[11px] font-extrabold text-slate-500 uppercase">Inspection Summary (1-2 Sentences)</label>
                        <button
                          type="button"
                          onClick={() => deleteItem("yellowItems", idx)}
                          className="text-xs text-rose-600 hover:text-rose-700 font-bold inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete Item
                        </button>
                      </div>
                      <textarea
                        rows={2.5}
                        value={item.summary}
                        onChange={(e) => updateItem("yellowItems", idx, "summary", e.target.value)}
                        className="w-full p-3.5 text-xs rounded-xl border-2 border-slate-200 bg-slate-50/60 focus:bg-white leading-relaxed outline-none focus:border-amber-500 font-medium"
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
