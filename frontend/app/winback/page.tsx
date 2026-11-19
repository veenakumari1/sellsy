"use client";

import React, { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ApiClient } from "@/lib/api";
import {
  UserCheck,
  AlertTriangle,
  MessageSquare,
  Send,
  Phone,
  RefreshCw,
  Search,
  ExternalLink,
  Edit2,
  Check,
  X,
  Copy,
  Sparkles,
  ShoppingBag,
  TrendingDown,
  DollarSign
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function WinBackPage() {
  const [selectedDays, setSelectedDays] = useState<number>(30);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingWhatsappId, setEditingWhatsappId] = useState<string | null>(null);
  const [whatsappInput, setWhatsappInput] = useState("");
  const [savingWhatsapp, setSavingWhatsapp] = useState(false);

  // Message modal state
  const [activeMessageCustomer, setActiveMessageCustomer] = useState<any>(null);
  const [generatedMessage, setGeneratedMessage] = useState<string>("");
  const [generatingMessage, setGeneratingMessage] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState(false);

  const loadAtRiskCustomers = async (days = selectedDays, force = false) => {
    setLoading(true);
    try {
      const res = await ApiClient.getAtRiskCustomers(days, force);
      setData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAtRiskCustomers(selectedDays);
  }, [selectedDays]);

  const handleSaveWhatsapp = async (customerId: string) => {
    if (!whatsappInput.trim()) return;
    setSavingWhatsapp(true);
    try {
      await ApiClient.updateCustomerWhatsapp(customerId, whatsappInput.trim());
      await loadAtRiskCustomers(selectedDays, true);
      setEditingWhatsappId(null);
      setWhatsappInput("");
    } catch (e) {
      console.error(e);
      alert("Failed to update WhatsApp number. Please check the format.");
    } finally {
      setSavingWhatsapp(false);
    }
  };

  const handleGenerateMessage = async (customer: any) => {
    setActiveMessageCustomer(customer);
    setGeneratingMessage(true);
    setGeneratedMessage("");
    setCopiedMessage(false);

    try {
      const res = await ApiClient.generateWinbackMessage(customer.id);
      setGeneratedMessage(res.message);
    } catch (e) {
      console.error(e);
      setGeneratedMessage(
        `Salam ${customer.name.split(" ")[0]}! We miss having you shop with us. Use code WELCOMEBACK for 10% off your next purchase!`
      );
    } finally {
      setGeneratingMessage(false);
    }
  };

  const handleCopy = () => {
    if (!generatedMessage) return;
    navigator.clipboard.writeText(generatedMessage);
    setCopiedMessage(true);
    setTimeout(() => setCopiedMessage(false), 2000);
  };

  const cleanNumber = (num: string) => {
    if (!num) return "";
    let d = num.replace(/\D/g, "");
    if (d.startsWith("03") && d.length === 11) d = "92" + d.slice(1);
    return d;
  };

  const getWaLink = (number: string, message: string) => {
    const cleaned = cleanNumber(number);
    if (!cleaned) return null;
    return `https://wa.me/${cleaned}?text=${encodeURIComponent(message)}`;
  };

  const filteredCustomers = (data?.customers || []).filter((c: any) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      (c.phone && c.phone.includes(q)) ||
      (c.last_product_name && c.last_product_name.toLowerCase().includes(q))
    );
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#e8e2dc]">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase bg-[#F6E1E5] text-[#620F1E] rounded-md">
                Customer Retention
              </span>
              <span className="text-xs text-[#8a7c7e]">Direct WhatsApp Outreach</span>
            </div>
            <h1 className="text-2xl font-bold text-[#14090b] tracking-tight mt-1 flex items-center gap-2">
              <UserCheck className="text-[#7b1425]" size={26} />
              Customer Prediction & Win-Back
            </h1>
            <p className="text-xs text-[#6f6264] mt-0.5 max-w-2xl">
              Identifies previous buyers at risk of permanent churn. Re-engage them directly via personalized WhatsApp
              offers referencing their past purchases.
            </p>
          </div>

          {/* Days Filter Pills */}
          <div className="flex items-center gap-1.5 p-1 bg-[#faf8f5] rounded-xl border border-[#e8e2dc] self-start sm:self-auto flex-shrink-0">
            {[30, 60, 90].map((d) => (
              <button
                key={d}
                onClick={() => setSelectedDays(d)}
                className={cn(
                  "px-3 py-1.5 text-xs font-bold rounded-lg transition-all",
                  selectedDays === d
                    ? "bg-[#7b1425] text-white shadow-2xs"
                    : "text-[#5a4e50] hover:text-[#14090b] hover:bg-white"
                )}
              >
                {d}+ Days Inactive
              </button>
            ))}
          </div>
        </div>

        {/* Summary KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 bg-white rounded-2xl border border-[#e8e2dc] shadow-2xs">
            <span className="text-[11px] font-semibold text-[#8a7c7e] block">Total Inactive ({selectedDays}d+)</span>
            <p className="text-2xl font-bold text-[#14090b] mt-1">{data?.total_at_risk ?? 0}</p>
            <span className="text-[10px] text-[#5a4e50] mt-0.5 block">Prior checkout customers</span>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-[#e8e2dc] shadow-2xs">
            <span className="text-[11px] font-semibold text-[#7b1425] block flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#7b1425]" />
              High Risk
            </span>
            <p className="text-2xl font-bold text-[#7b1425] mt-1">{data?.high_risk_count ?? 0}</p>
            <span className="text-[10px] text-[#8a7c7e] mt-0.5 block">Urgent win-back required</span>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-[#e8e2dc] shadow-2xs">
            <span className="text-[11px] font-semibold text-amber-700 block flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-600" />
              Medium Risk
            </span>
            <p className="text-2xl font-bold text-amber-700 mt-1">{data?.medium_risk_count ?? 0}</p>
            <span className="text-[10px] text-[#8a7c7e] mt-0.5 block">Moderate lapse period</span>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-[#e8e2dc] shadow-2xs">
            <span className="text-[11px] font-semibold text-[#8a7c7e] block">Revenue at Churn Risk</span>
            <p className="text-2xl font-bold text-[#14090b] mt-1">
              Rs {(data?.potential_revenue_at_risk || 0).toLocaleString()}
            </p>
            <span className="text-[10px] text-[#5a4e50] mt-0.5 block">Cumulative historical spend</span>
          </div>
        </div>

        {/* Search & Actions Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8a7c7e]" />
            <input
              type="text"
              placeholder="Search by name, email, product..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-9 pr-3 rounded-lg border border-[#e8e2dc] bg-white text-xs text-[#14090b] focus:outline-none focus:border-[#7b1425]"
            />
          </div>

          <button
            onClick={() => loadAtRiskCustomers(selectedDays, true)}
            className="h-9 px-3 rounded-lg border border-[#e8e2dc] bg-white hover:bg-[#faf8f5] text-xs font-semibold text-[#3b2f31] transition-colors inline-flex items-center gap-1.5 self-start sm:self-auto"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            <span>Refresh list</span>
          </button>
        </div>

        {/* At-Risk Customers Table */}
        <div className="bg-white rounded-2xl border border-[#e8e2dc] overflow-hidden shadow-2xs">
          {loading && !data ? (
            <div className="p-8 text-center space-y-2">
              <div className="w-6 h-6 border-2 border-[#7b1425] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-[#6f6264]">Scanning customer purchase history...</p>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <UserCheck size={32} className="mx-auto text-[#a89b99]" />
              <h3 className="text-sm font-bold text-[#14090b]">No at-risk customers found</h3>
              <p className="text-xs text-[#6f6264] max-w-sm mx-auto">
                No shoppers match the {selectedDays}-day inactivity filter with the current search query.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#faf8f5] border-b border-[#e8e2dc] text-[#6f6264] uppercase font-bold text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Risk Level</th>
                    <th className="py-3 px-4">Inactivity</th>
                    <th className="py-3 px-4">Historical Orders</th>
                    <th className="py-3 px-4">Last Product</th>
                    <th className="py-3 px-4">WhatsApp Contact</th>
                    <th className="py-3 px-4 text-right">Outreach Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f3ede7]">
                  {filteredCustomers.map((cust: any) => {
                    const isHigh = cust.risk_level === "High";
                    const isMed = cust.risk_level === "Medium";
                    const hasWhatsapp = Boolean(cust.whatsapp);
                    const isEditing = editingWhatsappId === cust.id;

                    return (
                      <tr key={cust.id} className="hover:bg-[#faf8f5]/60 transition-colors">
                        {/* Customer Info */}
                        <td className="py-3 px-4">
                          <p className="font-bold text-[#14090b]">{cust.name}</p>
                          <p className="text-[11px] text-[#8a7c7e]">{cust.email}</p>
                        </td>

                        {/* Risk Badge */}
                        <td className="py-3 px-4">
                          <span
                            className={cn(
                              "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1",
                              isHigh
                                ? "bg-[#FBF1F3] text-[#7b1425] border border-[#EBC3CB]"
                                : isMed
                                ? "bg-amber-50 text-amber-800 border border-amber-200"
                                : "bg-slate-100 text-slate-700 border border-slate-200"
                            )}
                          >
                            <span
                              className={cn(
                                "w-1.5 h-1.5 rounded-full",
                                isHigh ? "bg-[#7b1425]" : isMed ? "bg-amber-600" : "bg-slate-500"
                              )}
                            />
                            {cust.risk_level} Risk
                          </span>
                        </td>

                        {/* Inactivity */}
                        <td className="py-3 px-4">
                          <p className="font-semibold text-[#14090b]">{cust.days_inactive} days</p>
                          <p className="text-[10px] text-[#8a7c7e]">
                            {cust.last_order_at
                              ? new Date(cust.last_order_at).toLocaleDateString()
                              : "No record"}
                          </p>
                        </td>

                        {/* Spend & Count */}
                        <td className="py-3 px-4">
                          <p className="font-bold text-[#14090b]">
                            Rs {(cust.total_spent || 0).toLocaleString()}
                          </p>
                          <p className="text-[10px] text-[#8a7c7e]">{cust.orders_count} orders</p>
                        </td>

                        {/* Last Product */}
                        <td className="py-3 px-4 max-w-[180px]">
                          <span className="truncate block font-medium text-[#2a1b1e] text-[11px]" title={cust.last_product_name || "Catalog"}>
                            {cust.last_product_name || "General Catalog"}
                          </span>
                        </td>

                        {/* WhatsApp Editable Column */}
                        <td className="py-3 px-4">
                          {isEditing ? (
                            <div className="flex items-center gap-1.5">
                              <input
                                type="text"
                                placeholder="+92 300 1234567"
                                value={whatsappInput}
                                onChange={(e) => setWhatsappInput(e.target.value)}
                                className="w-32 h-7 px-2 text-xs border border-[#7b1425] rounded focus:outline-none"
                                autoFocus
                              />
                              <button
                                onClick={() => handleSaveWhatsapp(cust.id)}
                                disabled={savingWhatsapp}
                                className="p-1 rounded bg-[#7b1425] text-white hover:bg-[#600f1c]"
                                title="Save"
                              >
                                <Check size={12} />
                              </button>
                              <button
                                onClick={() => setEditingWhatsappId(null)}
                                className="p-1 rounded bg-slate-200 text-slate-700 hover:bg-slate-300"
                                title="Cancel"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          ) : hasWhatsapp ? (
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-[11px] text-[#3b2f31]">{cust.whatsapp}</span>
                              <button
                                onClick={() => {
                                  setEditingWhatsappId(cust.id);
                                  setWhatsappInput(cust.whatsapp);
                                }}
                                className="text-[#8a7c7e] hover:text-[#7b1425] p-0.5"
                                title="Edit WhatsApp"
                              >
                                <Edit2 size={11} />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setEditingWhatsappId(cust.id);
                                setWhatsappInput(cust.phone || "+92 ");
                              }}
                              className="text-[11px] font-semibold text-[#7b1425] hover:underline inline-flex items-center gap-1"
                            >
                              <span>+ Add WhatsApp</span>
                            </button>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            {/* Generate message trigger */}
                            <button
                              onClick={() => handleGenerateMessage(cust)}
                              className="px-2.5 py-1.5 rounded-lg border border-[#e8e2dc] bg-white hover:bg-[#faf8f5] text-[11px] font-bold text-[#14090b] inline-flex items-center gap-1 transition-colors"
                              title="Generate AI win-back copy"
                            >
                              <Sparkles size={12} className="text-[#7b1425]" />
                              <span>Draft</span>
                            </button>

                            {/* Direct WhatsApp trigger */}
                            {hasWhatsapp ? (
                              <a
                                href={getWaLink(
                                  cust.whatsapp,
                                  `Salam ${cust.name.split(" ")[0]}! We miss seeing you at our store. Use code WELCOMEBACK for 10% off your next order today!`
                                ) || "#"}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold inline-flex items-center gap-1 transition-colors shadow-2xs"
                                title="Open WhatsApp chat"
                              >
                                <Send size={11} />
                                <span>WhatsApp</span>
                              </a>
                            ) : (
                              <button
                                onClick={() => {
                                  setEditingWhatsappId(cust.id);
                                  setWhatsappInput(cust.phone || "+92 ");
                                }}
                                className="px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-400 text-[11px] font-semibold cursor-pointer hover:bg-slate-200"
                                title="Add phone to enable WhatsApp"
                              >
                                No WhatsApp
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Message Preview Modal */}
        {activeMessageCustomer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <div className="bg-white rounded-2xl border border-[#e8e2dc] shadow-xl max-w-lg w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-[#f3ede7]">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#FBF1F3] text-[#7b1425] flex items-center justify-center font-bold">
                    <Sparkles size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#14090b]">AI Win-Back Message</h3>
                    <p className="text-[11px] text-[#8a7c7e]">
                      Prepared for {activeMessageCustomer.name}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveMessageCustomer(null)}
                  className="p-1 rounded-md text-[#8a7c7e] hover:text-[#14090b]"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Message Box */}
              <div>
                <label className="text-[11px] font-bold text-[#5a4e50] uppercase tracking-wider block mb-1.5">
                  Personalized WhatsApp Copy
                </label>
                {generatingMessage ? (
                  <div className="h-32 rounded-xl bg-[#faf8f5] border border-[#e8e2dc] flex items-center justify-center space-x-2 text-xs text-[#6f6264]">
                    <Sparkles size={14} className="animate-spin text-[#7b1425]" />
                    <span>Synthesizing personalized win-back offer...</span>
                  </div>
                ) : (
                  <textarea
                    rows={5}
                    value={generatedMessage}
                    onChange={(e) => setGeneratedMessage(e.target.value)}
                    className="w-full p-3 text-xs text-[#14090b] rounded-xl border border-[#e8e2dc] focus:outline-none focus:border-[#7b1425] bg-[#faf8f5] leading-relaxed"
                  />
                )}
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={handleCopy}
                  disabled={!generatedMessage}
                  className="px-3 py-2 rounded-lg border border-[#e8e2dc] bg-white hover:bg-[#faf8f5] text-xs font-semibold text-[#14090b] inline-flex items-center gap-1.5"
                >
                  {copiedMessage ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                  <span>{copiedMessage ? "Copied!" : "Copy text"}</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveMessageCustomer(null)}
                    className="px-3 py-2 text-xs font-semibold text-[#5a4e50] hover:text-[#14090b]"
                  >
                    Cancel
                  </button>

                  {activeMessageCustomer.whatsapp ? (
                    <a
                      href={getWaLink(activeMessageCustomer.whatsapp, generatedMessage) || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-sm"
                    >
                      <Send size={13} />
                      <span>Send on WhatsApp</span>
                    </a>
                  ) : (
                    <button
                      onClick={() => {
                        setEditingWhatsappId(activeMessageCustomer.id);
                        setWhatsappInput(activeMessageCustomer.phone || "+92 ");
                        setActiveMessageCustomer(null);
                      }}
                      className="px-4 py-2 rounded-lg bg-[#7b1425] text-white text-xs font-bold"
                    >
                      Add WhatsApp First
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

