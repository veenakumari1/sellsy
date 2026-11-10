"use client";

import React, { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ApiClient } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import {
  Plug,
  FileSpreadsheet,
  Upload,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Store,
  ArrowRight,
  ShieldCheck,
  Package,
  ShoppingCart,
  Users
} from "lucide-react";

export default function IntegrationsPage() {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Shopify form state
  const [shopDomain, setShopDomain] = useState("");
  const [connectingShopify, setConnectingShopify] = useState(false);
  const [shopifySuccess, setShopifySuccess] = useState<string | null>(null);

  // CSV Import state
  const [importType, setImportType] = useState<"products" | "orders" | "customers">("products");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<any | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadStatus = async () => {
    setLoading(true);
    try {
      const data = await ApiClient.getIntegrationStatus();
      setStatus(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const handleConnectShopify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopDomain) return;
    setConnectingShopify(true);
    setShopifySuccess(null);
    try {
      await ApiClient.connectShopify(shopDomain);
      setShopifySuccess(`Successfully verified and linked '${shopDomain}'`);
      setShopDomain("");
      await loadStatus();
    } catch (err: any) {
      alert(`Connection failed: ${err.message}`);
    } finally {
      setConnectingShopify(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setPreviewData(null);
    setImportResult(null);

    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".csv")) {
      setError("Please select a standard comma-separated .csv file.");
      return;
    }

    setSelectedFile(file);
    setPreviewLoading(true);
    try {
      const preview = await ApiClient.previewCsv(file, importType);
      setPreviewData(preview);
    } catch (err: any) {
      setError(err.message || "Failed to parse CSV preview");
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!previewData || !selectedFile) return;
    setImportLoading(true);
    setError(null);
    try {
      const res = await ApiClient.confirmCsvImport(
        importType,
        previewData.detected_mappings,
        previewData.preview_rows
      );
      setImportResult(res);
      await loadStatus();
    } catch (err: any) {
      setError(err.message || "Import execution failed");
    } finally {
      setImportLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Integrations & Data Ingestion</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Connect external storefronts or ingest custom CSV files with automatic column mapping and duplicate detection
            </p>
          </div>
        </div>

        {/* Sync Status Banner */}
        {status && (
          <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                <Store size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900">
                    {status.shop_domain || "Aura Living Essentials"}
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    Active & Synchronized
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Platform: <span className="font-semibold uppercase text-slate-700">{status.platform}</span> • Last Synced: {status.last_synced_at ? formatDate(status.last_synced_at) : "Real-time"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-6 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100 text-xs">
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">Products</p>
                <p className="text-base font-bold text-slate-900">{status.products_count}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">Orders</p>
                <p className="text-base font-bold text-slate-900">{status.orders_count}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">Customers</p>
                <p className="text-base font-bold text-slate-900">{status.customers_count}</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Shopify Connect Card */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Plug size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Shopify Storefront Connector</h3>
                  <p className="text-xs text-slate-500">Secure OAuth or custom app credentials</p>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed mt-2">
                Sellsy synchronizes your products, confirmed orders, and customer records via Shopify's official Admin API.
              </p>

              {shopifySuccess && (
                <div className="mt-3 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
                  <CheckCircle2 size={16} />
                  <span>{shopifySuccess}</span>
                </div>
              )}

              <form onSubmit={handleConnectShopify} className="mt-4 space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Shopify Domain
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="mystore.myshopify.com"
                    value={shopDomain}
                    onChange={(e) => setShopDomain(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-600/20"
                  />
                </div>
                <button
                  type="submit"
                  disabled={connectingShopify}
                  className="w-full py-2.5 px-4 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {connectingShopify ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>Verifying Store Credentials...</span>
                    </>
                  ) : (
                    <>
                      <span>Link Shopify Store</span>
                      <ArrowRight size={14} />
                    </>
                  )}
                </button>
              </form>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-2 text-[11px] text-slate-400">
              <ShieldCheck size={14} className="text-blue-600" />
              <span>TLS 1.3 encrypted & scoped to read-only analytical access.</span>
            </div>
          </div>

          {/* CSV File Ingestion Card */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <FileSpreadsheet size={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Custom CSV Data Ingestion</h3>
                <p className="text-xs text-slate-500">Auto-detect columns for stores without Shopify</p>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 mb-3">
                <AlertCircle size={15} />
                <span>{error}</span>
              </div>
            )}

            {/* Import Type Selector */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {(["products", "orders", "customers"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    setImportType(t);
                    setPreviewData(null);
                    setImportResult(null);
                  }}
                  className={`py-2 px-2.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
                    importType === t
                      ? "bg-blue-600 text-white shadow-xs"
                      : "bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200"
                  }`}
                >
                  {t} CSV
                </button>
              ))}
            </div>

            {/* Drag & Drop Input */}
            <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-blue-300 transition-colors bg-slate-50/50">
              <Upload size={24} className="mx-auto text-blue-500 mb-2" />
              <p className="text-xs font-bold text-slate-900">Select {importType} CSV file</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Supports standard comma-separated exports</p>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="mt-3 block w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
              />
            </div>

            {previewLoading && (
              <div className="p-4 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                <RefreshCw size={14} className="animate-spin text-blue-600" />
                <span>Analyzing headers and detecting column mappings...</span>
              </div>
            )}

            {/* Preview & Confirmation */}
            {previewData && (
              <div className="mt-4 space-y-3">
                <div className="p-3 rounded-lg bg-blue-50/70 border border-blue-200/80 text-xs text-blue-900">
                  <div className="flex items-center justify-between font-bold">
                    <span>Parsed {previewData.total_rows} Records</span>
                    <span className="capitalize">{previewData.import_type}</span>
                  </div>
                  <div className="mt-2 text-[11px] text-blue-800 space-y-0.5">
                    <p className="font-semibold">Detected Mappings:</p>
                    {Object.entries(previewData.detected_mappings).map(([raw, canonical]: any) => (
                      <span key={raw} className="inline-block mr-2 bg-white px-2 py-0.5 rounded border border-blue-200">
                        {raw} &rarr; <b>{canonical}</b>
                      </span>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleConfirmImport}
                  disabled={importLoading}
                  className="w-full py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {importLoading ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>Ingesting Records into Database...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={14} />
                      <span>Confirm & Ingest Records</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Ingestion Result */}
            {importResult && (
              <div className="mt-4 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs space-y-1">
                <p className="font-bold flex items-center gap-1.5 text-emerald-800">
                  <CheckCircle2 size={15} />
                  <span>Import Completed Successfully</span>
                </p>
                <p>
                  Successfully ingested <b>{importResult.successful_records}</b> out of <b>{importResult.total_records}</b> records.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

