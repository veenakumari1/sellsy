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
  CheckCircle2,
  Clock,
  Sparkles,
  ShieldCheck
} from "lucide-react";

export default function ReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [reportType, setReportType] = useState("executive");
  const [fileFormat, setFileFormat] = useState("pdf");

  const loadReports = async () => {
    setLoading(true);
    try {
      const data = await ApiClient.listReports();
      setReports(data);
    } catch (e) {
      console.error(e);
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
      await loadReports();
    } catch (e: any) {
      alert(`Report generation failed: ${e.message}`);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Executive Reports & Data Exports</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Compile publication-quality PDF dossiers and CSV spreadsheets with calculated analytics and AI strategic synthesis
            </p>
          </div>
        </div>

        {/* Generate Report Widget */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <FileText size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Compile New Intelligence Report</h3>
              <p className="text-xs text-slate-500">Select report scope and export format</p>
            </div>
          </div>

          <form onSubmit={handleGenerate} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Report Module</label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs text-slate-900 font-medium bg-slate-50 focus:outline-hidden"
              >
                <option value="executive">Executive Summary (Holistic Store Diagnostic)</option>
                <option value="sales">Sales Performance Ledger & Velocity</option>
                <option value="products">Product Intelligence & SKU Margins</option>
                <option value="customers">Customer Cohorts & RFM Segmentation</option>
                <option value="marketing">AI Marketing Strategy & Campaigns</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Export Format</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFileFormat("pdf")}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                    fileFormat === "pdf"
                      ? "bg-blue-600 text-white shadow-xs"
                      : "bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <FileText size={14} />
                  <span>PDF Document</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFileFormat("csv")}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                    fileFormat === "csv"
                      ? "bg-blue-600 text-white shadow-xs"
                      : "bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100"
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
              className="py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {generating ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>Compiling Real Data...</span>
                </>
              ) : (
                <>
                  <Plus size={14} />
                  <span>Generate Report</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Historical Generated Reports List */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Generated Reports Archive</h3>
            <button
              onClick={loadReports}
              className="p-1 rounded-lg hover:bg-slate-50 text-slate-500"
              title="Refresh archive"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3">Report Document</th>
                  <th className="px-4 py-3">Format</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reports.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-3.5 font-bold text-slate-900 flex items-center gap-2.5">
                      {r.file_format === "pdf" ? (
                        <FileText size={16} className="text-rose-600 flex-shrink-0" />
                      ) : (
                        <FileSpreadsheet size={16} className="text-emerald-600 flex-shrink-0" />
                      )}
                      <span>{r.title}</span>
                    </td>
                    <td className="px-4 py-3.5 uppercase font-mono text-[10px] text-slate-500">
                      {r.file_format}
                    </td>
                    <td className="px-4 py-3.5 text-slate-500">{formatDate(r.created_at)}</td>
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700">
                        <CheckCircle2 size={11} />
                        <span>Ready</span>
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <a
                        href={ApiClient.getReportDownloadUrl(r.id)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 font-semibold text-xs transition-colors shadow-2xs"
                      >
                        <Download size={13} />
                        <span>Download</span>
                      </a>
                    </td>
                  </tr>
                ))}
                {reports.length === 0 && !loading && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                      No reports generated yet. Use the tool above to compile your first report.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

