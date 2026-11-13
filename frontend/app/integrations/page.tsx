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
  ShieldCheck
} from "lucide-react";

export default function IntegrationsPage() {
  const [status, setStatus] = useState<any>(() => ApiClient.getCached("/api/v1/integrations/status"));
  const [loading, setLoading] = useState(() => !ApiClient.getCached("/api/v1/integrations/status"));
  const [errorState, setErrorState] = useState<string | null>(null);

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

  const loadStatus = async (force = false) => {
    const cached = ApiClient.getCached("/api/v1/integrations/status");
    if (force || !cached) {
      setLoading(true);
    }
    setErrorState(null);
    try {
      const data = await ApiClient.getIntegrationStatus(force);
      setStatus(data);
    } catch (e) {
      console.error(e);
      setErrorState("We couldn't load your integrations right now. Please try again.");
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
      setShopifySuccess(`Successfully connected '${shopDomain}'`);
      setShopDomain("");
      await loadStatus(true);
    } catch (err: any) {
      alert("We couldn't connect your store right now. Please try again.");
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
      setError("Failed to read CSV file. Please check the file and try again.");
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
      await loadStatus(true);
    } catch (err: any) {
      setError("Import failed. Please try again.");
    } finally {
      setImportLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#e8e2dc]">
          <div>
            <h2 className="text-xl font-bold text-[#14090b] tracking-tight">Integrations</h2>
            <p className="text-xs text-[#6f6264] mt-0.5">
              Connect your Shopify store or upload CSV files
            </p>
          </div>
        </div>

        {errorState && !status ? (
          <div className="p-6 bg-white rounded-xl border border-[#e8e2dc] text-center space-y-3">
            <p className="text-sm text-[#5a4e50]">{errorState}</p>
            <button
              onClick={() => loadStatus(true)}
              className="px-4 py-2 bg-[#7b1425] text-white text-xs font-semibold rounded-lg hover:bg-[#600f1c] transition-colors"
            >
              Try again
            </button>
          </div>
        ) : (
          <>
            {/* Sync Status Banner */}
            {status && (
              <div className="p-5 rounded-2xl bg-white border border-[#e8e2dc]/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                    <Store size={22} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-[#14090b]">
                        {status.shop_domain || "Aura Living Essentials"}
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        Connected
                      </span>
                    </div>
                    <p className="text-xs text-[#6f6264] mt-0.5">
                      Platform: <span className="font-semibold uppercase text-[#3b2f31]">{status.platform}</span> • Last Synced: {status.last_synced_at ? formatDate(status.last_synced_at) : "Just now"}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 sm:gap-6 border-t md:border-t-0 pt-3 md:pt-0 border-[#f3ede7] text-xs">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-[#a89b99]">Products</p>
                    <p className="text-base font-bold text-[#14090b]">{status.products_count}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-[#a89b99]">Orders</p>
                    <p className="text-base font-bold text-[#14090b]">{status.orders_count}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-[#a89b99]">Customers</p>
                    <p className="text-base font-bold text-[#14090b]">{status.customers_count}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
              {/* Shopify Connect Card */}
              <div className="bg-white rounded-2xl border border-[#e8e2dc]/90 p-6 shadow-xs flex flex-col justify-between h-full">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <Plug size={18} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[#14090b]">Connect Shopify</h3>
                      <p className="text-xs text-[#6f6264]">Link your Shopify store</p>
                    </div>
                  </div>

                  <p className="text-xs text-[#5a4e50] leading-relaxed mt-2">
                    Sellsy automatically imports your products, orders, and customer data from your Shopify store.
                  </p>

                  {shopifySuccess && (
                    <div className="mt-3 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
                      <CheckCircle2 size={16} />
                      <span>{shopifySuccess}</span>
                    </div>
                  )}

                  <form onSubmit={handleConnectShopify} className="mt-4 space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-[#3b2f31] mb-1">
                        Shopify Domain
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="mystore.myshopify.com"
                        value={shopDomain}
                        onChange={(e) => setShopDomain(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-[#e8e2dc] text-[#14090b] focus:outline-hidden focus:ring-2 focus:ring-[#7b1425]/20"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={connectingShopify}
                      className="w-full py-2.5 px-4 rounded-lg bg-[#14090b] hover:bg-[#2a1b1e] text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {connectingShopify ? (
                        <>
                          <RefreshCw size={14} className="animate-spin" />
                          <span>Connecting store...</span>
                        </>
                      ) : (
                        <>
                          <span>Connect store</span>
                          <ArrowRight size={14} />
                        </>
                      )}
                    </button>
                  </form>
                </div>

                <div className="mt-6 pt-4 border-t border-[#f3ede7] flex items-center gap-2 text-[11px] text-[#a89b99]">
                  <ShieldCheck size={14} className="text-[#7b1425]" />
                  <span>Your data is encrypted and securely synced.</span>
                </div>
              </div>

              {/* CSV File Ingestion Card */}
              <div className="bg-white rounded-2xl border border-[#e8e2dc]/90 p-6 shadow-xs flex flex-col justify-between h-full">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-[#FBF1F3] text-[#7b1425] flex items-center justify-center">
                      <FileSpreadsheet size={18} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[#14090b]">Upload CSV files</h3>
                      <p className="text-xs text-[#6f6264]">Add products, orders, or customers from a spreadsheet</p>
                    </div>
                  </div>

                  {error && (
                    <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 mb-3">
                      <AlertCircle size={15} />
                      <span>{error}</span>
                    </div>
                  )}

                  {/* Import Type Selector */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
                    {(["products", "orders", "customers"] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => {
                          setImportType(t);
                          setPreviewData(null);
                          setImportResult(null);
                        }}
                        className={`h-10 sm:h-9 min-h-[40px] px-2.5 rounded-lg text-xs font-semibold capitalize transition-colors inline-flex items-center justify-center whitespace-nowrap ${
                          importType === t
                            ? "bg-[#7b1425] text-white shadow-xs"
                            : "bg-[#faf8f5] text-[#3b2f31] hover:bg-[#f3ede7] border border-[#e8e2dc]"
                        }`}
                      >
                        {t} CSV
                      </button>
                    ))}
                  </div>

                  {/* Drag & Drop Input */}
                  <div className="border-2 border-dashed border-[#e8e2dc] rounded-xl p-6 text-center hover:border-[#DC9AA7] transition-colors bg-[#faf8f5]/50">
                    <Upload size={24} className="mx-auto text-[#A3243A] mb-2" />
                    <p className="text-xs font-bold text-[#14090b]">Select {importType} CSV file</p>
                    <p className="text-[11px] text-[#a89b99] mt-0.5">Supports standard CSV exports</p>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleFileChange}
                      className="mt-3 block w-full text-xs text-[#6f6264] file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-[#FBF1F3] file:text-[#620F1E] hover:file:bg-[#F6E1E5] cursor-pointer"
                    />
                  </div>

                  {previewLoading && (
                    <div className="p-4 text-center text-xs text-[#6f6264] flex items-center justify-center gap-2">
                      <RefreshCw size={14} className="animate-spin text-[#7b1425]" />
                      <span>Reading file...</span>
                    </div>
                  )}

                  {/* Preview & Confirmation */}
                  {previewData && (
                    <div className="mt-4 space-y-3">
                      <div className="p-3 rounded-lg bg-[#FBF1F3]/70 border border-[#EBC3CB]/80 text-xs text-[#380911]">
                        <div className="flex items-center justify-between font-bold">
                          <span>{previewData.total_rows} rows found</span>
                          <span className="capitalize">{previewData.import_type}</span>
                        </div>
                        <div className="mt-2 text-[11px] text-[#4D0C18] space-y-0.5">
                          <p className="font-semibold">Columns matched:</p>
                          {Object.entries(previewData.detected_mappings).map(([raw, canonical]: any) => (
                            <span key={raw} className="inline-block mr-2 bg-white px-2 py-0.5 rounded border border-[#EBC3CB]">
                              {raw} &rarr; <b>{canonical}</b>
                            </span>
                          ))}
                        </div>
                      </div>

                      <button
                        onClick={handleConfirmImport}
                        disabled={importLoading}
                        className="w-full py-2.5 px-4 rounded-lg bg-[#7b1425] hover:bg-[#620F1E] text-white font-semibold text-xs shadow-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {importLoading ? (
                          <>
                            <RefreshCw size={14} className="animate-spin" />
                            <span>Importing...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 size={14} />
                            <span>Import data</span>
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
                        <span>Import complete</span>
                      </p>
                      <p>
                        Successfully imported <b>{importResult.successful_records}</b> out of <b>{importResult.total_records}</b> records.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

