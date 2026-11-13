"use client";

import React, { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ApiClient } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import {
  FileText,
  Download,
  Plus,
  RefreshCw,
  FileSpreadsheet,
  CheckCircle2
} from "lucide-react";

export default function ReportsPage() {
  const [reports, setReports] = useState<any[]>(() => ApiClient.getCached("/api/v1/reports") || []);
  const [loading, setLoading] = useState(() => !ApiClient.getCached("/api/v1/reports"));
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [reportType, setReportType] = useState("executive");
  const [fileFormat, setFileFormat] = useState("pdf");

  const loadReports = async (force = false) => {
    const cached = ApiClient.getCached("/api/v1/reports");
    if (force || !cached) {
      setLoading(true);
    }
    setError(null);
    try {
      const data = await ApiClient.listReports(force);
      setReports(data);
    } catch (e) {
      console.error(e);
      setError("We couldn't load your reports right now. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    try {
      await ApiClient.generateReport(reportType, fileFormat);
      await loadReports(true);
    } catch (e: any) {
      alert("We couldn't generate your report right now. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#e8e2dc]">
          <div>
            <h2 className="text-xl font-bold text-[#14090b] tracking-tight">Reports</h2>
            <p className="text-xs text-[#6f6264] mt-0.5">
              Download summaries and spreadsheets of your store data
            </p>
          </div>
        </div>

        {/* Generate Report Widget */}
        <div className="bg-white rounded-2xl border border-[#e8e2dc]/90 p-6 shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-[#FBF1F3] text-[#7b1425] flex items-center justify-center">
              <FileText size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#14090b]">Create a report</h3>
              <p className="text-xs text-[#6f6264]">Choose a report type and format</p>
            </div>
          </div>

          <form onSubmit={handleGenerate} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
            <div>
              <label className="block text-xs font-semibold text-[#3b2f31] mb-1">Report type</label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="h-10 w-full px-3 rounded-lg border border-[#e8e2dc] text-xs text-[#14090b] font-medium bg-[#faf8f5] focus:outline-hidden"
              >
                <option value="executive">Store summary</option>
                <option value="sales">Sales report</option>
                <option value="products">Products report</option>
                <option value="customers">Customers report</option>
                <option value="marketing">Marketing suggestions</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#3b2f31] mb-1">Export Format</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFileFormat("pdf")}
                  className={`h-10 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                    fileFormat === "pdf"
                      ? "bg-[#7b1425] text-white shadow-xs"
                      : "bg-[#faf8f5] border border-[#e8e2dc] text-[#3b2f31] hover:bg-[#f3ede7]"
                  }`}
                >
                  <FileText size={14} />
                  <span>PDF Document</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFileFormat("csv")}
                  className={`h-10 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                    fileFormat === "csv"
                      ? "bg-[#7b1425] text-white shadow-xs"
                      : "bg-[#faf8f5] border border-[#e8e2dc] text-[#3b2f31] hover:bg-[#f3ede7]"
                  }`}
                >
                  <FileSpreadsheet size={14} />
                  <span>CSV Table</span>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={generating}
              className="h-10 px-4 rounded-lg bg-[#7b1425] hover:bg-[#620F1E] text-white text-xs font-semibold shadow-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {generating ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <Plus size={14} />
                  <span>Create report</span>
                </>
              )}
            </button>
          </form>
        </div>

        {error && reports.length === 0 ? (
          <div className="p-6 bg-white rounded-xl border border-[#e8e2dc] text-center space-y-3">
            <p className="text-sm text-[#5a4e50]">{error}</p>
            <button
              onClick={() => loadReports(true)}
              className="px-4 py-2 bg-[#7b1425] text-white text-xs font-semibold rounded-lg hover:bg-[#600f1c] transition-colors"
            >
              Try again
            </button>
          </div>
        ) : (
          /* Historical Generated Reports List */
          <div className="bg-white rounded-2xl border border-[#e8e2dc]/90 shadow-xs overflow-hidden">
            <div className="px-6 py-4 border-b border-[#f3ede7] flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#14090b]">Past reports</h3>
              <button
                onClick={() => loadReports(true)}
                className="p-1 rounded-lg hover:bg-[#faf8f5] text-[#6f6264]"
                title="Refresh archive"
              >
                <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#faf8f5] text-[#6f6264] uppercase font-semibold text-[10px] tracking-wider border-b border-[#f3ede7]">
                  <tr>
                    <th className="px-6 py-3 text-left">Report Document</th>
                    <th className="px-4 py-3 text-center">Format</th>
                    <th className="px-4 py-3 text-left">Created</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-6 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f3ede7]">
                  {loading && reports.length === 0 ? (
                    [1, 2, 3].map((i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="px-6 py-3.5"><div className="h-4 w-48 bg-[#f3ede7] rounded" /></td>
                        <td className="px-4 py-3.5 text-center"><div className="h-4 w-10 bg-[#f3ede7] rounded mx-auto" /></td>
                        <td className="px-4 py-3.5"><div className="h-4 w-24 bg-[#f3ede7] rounded" /></td>
                        <td className="px-4 py-3.5"><div className="h-4 w-16 bg-[#f3ede7] rounded" /></td>
                        <td className="px-6 py-3.5 text-right"><div className="h-6 w-20 bg-[#f3ede7] rounded ml-auto" /></td>
                      </tr>
                    ))
                  ) : reports.length > 0 ? (
                    reports.map((r) => (
                      <tr key={r.id} className="hover:bg-[#faf8f5]/60 transition-colors">
                        <td className="px-6 py-3.5 font-bold text-[#14090b] flex items-center gap-2.5 align-middle">
                          {r.file_format === "pdf" ? (
                            <FileText size={16} className="text-rose-600 flex-shrink-0" />
                          ) : (
                            <FileSpreadsheet size={16} className="text-emerald-600 flex-shrink-0" />
                          )}
                          <span className="truncate max-w-xs">{r.title}</span>
                        </td>
                        <td className="px-4 py-3.5 text-center uppercase font-mono text-[10px] text-[#6f6264] align-middle whitespace-nowrap">
                          {r.file_format}
                        </td>
                        <td className="px-4 py-3.5 text-[#6f6264] align-middle whitespace-nowrap">{formatDate(r.created_at)}</td>
                        <td className="px-4 py-3.5 align-middle whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700">
                            <CheckCircle2 size={11} className="flex-shrink-0" />
                            <span>Ready</span>
                          </span>
                        </td>
                        <td className="px-6 py-3.5 text-right align-middle whitespace-nowrap">
                          <a
                            href={ApiClient.getReportDownloadUrl(r.id)}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#f3ede7] hover:bg-[#FBF1F3] text-[#3b2f31] hover:text-[#620F1E] font-semibold text-xs transition-colors shadow-2xs"
                          >
                            <Download size={13} className="flex-shrink-0" />
                            <span>Download</span>
                          </a>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-[#a89b99]">
                        No reports created yet. Use the form above to create your first report.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

