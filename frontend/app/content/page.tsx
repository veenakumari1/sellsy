"use client";

import React, { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ApiClient } from "@/lib/api";
import {
  Wand2,
  FileText,
  Megaphone,
  Share2,
  Sparkles,
  Copy,
  Check,
  Package,
  Layers,
  ArrowRight,
  Hash,
  ShoppingBag,
  RefreshCw,
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function ContentGeneratorPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [contentType, setContentType] = useState<string>("description");
  const [tone, setTone] = useState<string>("friendly");

  const [generating, setGenerating] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    ApiClient.getProducts()
      .then((prods) => {
        setProducts(prods || []);
        if (prods && prods.length > 0) {
          setSelectedProductId(prods[0].id);
        }
      })
      .catch((e) => console.error(e));
  }, []);

  const handleGenerate = async () => {
    if (!selectedProductId) return;
    setGenerating(true);
    setError(null);

    try {
      const res = await ApiClient.generateContent(selectedProductId, contentType, tone);
      setResults(res);
    } catch (e: any) {
      console.error(e);
      setError("Content synthesis failed. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const handleCopyVariation = (variation: any) => {
    const textToCopy = `${variation.headline}\n\n${variation.body}\n\n${variation.call_to_action}${
      variation.tags?.length ? `\n\n${variation.tags.join(" ")}` : ""
    }`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedId(variation.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const contentTypes = [
    {
      id: "description",
      name: "Product Description",
      desc: "Comprehensive SEO-ready catalog copy highlighting features & benefits",
      icon: FileText,
    },
    {
      id: "ad_copy",
      name: "Paid Ad Copy",
      desc: "High-converting Facebook & Instagram direct-response ad creative",
      icon: Megaphone,
    },
    {
      id: "social_post",
      name: "Social Media Post",
      desc: "Captivating Instagram/TikTok captions with hooks and trending tags",
      icon: Share2,
    },
  ];

  const tones = [
    { id: "friendly", label: "Friendly & Warm", desc: "Approachable, conversational, sincere" },
    { id: "premium", label: "Premium & Luxury", desc: "Artisanal heritage, refined elegance" },
    { id: "urgent", label: "Urgent & High-Converting", desc: "Scarcity, limited drop, act now" },
  ];

  const selectedProduct = products.find((p) => p.id === selectedProductId);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="pb-4 border-b border-[#e8e2dc]">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase bg-[#F6E1E5] text-[#620F1E] rounded-md">
              Creative Studio
            </span>
            <span className="text-xs text-[#8a7c7e]">Direct-Response Retail Copy</span>
          </div>
          <h1 className="text-2xl font-bold text-[#14090b] tracking-tight mt-1 flex items-center gap-2">
            <Wand2 className="text-[#7b1425]" size={26} />
            AI Content Generator
          </h1>
          <p className="text-xs text-[#6f6264] mt-0.5 max-w-2xl">
            Produce three high-converting variations of product descriptions, paid social ad hooks, or organic captions
            tailored to your product specifications.
          </p>
        </div>

        {/* Generator Controls Card */}
        <div className="bg-white rounded-2xl border border-[#e8e2dc] p-6 shadow-2xs space-y-6">
          {/* Step 1: Select Product */}
          <div>
            <label className="text-xs font-bold text-[#14090b] uppercase tracking-wider block mb-2">
              1. Choose Product
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl border border-[#e8e2dc] bg-[#faf8f5] text-xs font-semibold text-[#14090b] focus:outline-none focus:border-[#7b1425]"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title} {p.price ? `(Rs ${Number(p.price).toLocaleString()})` : ""}
                  </option>
                ))}
              </select>

              {selectedProduct && (
                <div className="p-3 bg-[#faf8f5] rounded-xl border border-[#f0eae4] text-xs text-[#5a4e50] flex items-center justify-between">
                  <div className="truncate pr-2">
                    <span className="font-bold text-[#14090b] block truncate">{selectedProduct.title}</span>
                    <span className="text-[11px] text-[#8a7c7e]">{selectedProduct.category?.name || "General"}</span>
                  </div>
                  <span className="px-2.5 py-1 rounded-md font-bold text-xs bg-white border border-[#e8e2dc] text-[#7b1425] flex-shrink-0">
                    Rs {Number(selectedProduct.price || 0).toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Step 2: Content Format */}
          <div>
            <label className="text-xs font-bold text-[#14090b] uppercase tracking-wider block mb-2">
              2. Select Content Format
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {contentTypes.map((t) => {
                const Icon = t.icon;
                const isSelected = contentType === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setContentType(t.id)}
                    className={cn(
                      "p-4 rounded-xl border text-left transition-all flex flex-col justify-between",
                      isSelected
                        ? "bg-[#FBF1F3] border-[#7b1425] text-[#14090b] shadow-2xs"
                        : "bg-white border-[#e8e2dc] hover:border-[#DC9AA7] text-[#5a4e50]"
                    )}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Icon size={18} className={isSelected ? "text-[#7b1425]" : "text-[#8a7c7e]"} />
                        {isSelected && <span className="w-2 h-2 rounded-full bg-[#7b1425]" />}
                      </div>
                      <h4 className="text-xs font-bold text-[#14090b]">{t.name}</h4>
                      <p className="text-[11px] text-[#6f6264] mt-1 leading-snug">{t.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 3: Tone of Voice */}
          <div>
            <label className="text-xs font-bold text-[#14090b] uppercase tracking-wider block mb-2">
              3. Select Brand Tone
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {tones.map((t) => {
                const isSelected = tone === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTone(t.id)}
                    className={cn(
                      "p-3 rounded-xl border text-left transition-all",
                      isSelected
                        ? "bg-[#FBF1F3] border-[#7b1425] text-[#14090b]"
                        : "bg-[#faf8f5] border-[#e8e2dc] hover:border-[#DC9AA7] text-[#5a4e50]"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#14090b]">{t.label}</span>
                      {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-[#7b1425]" />}
                    </div>
                    <p className="text-[10px] text-[#8a7c7e] mt-0.5">{t.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Trigger Button */}
          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-[#f3ede7]">
            <p className="text-xs text-[#8a7c7e]">
              Generates 3 distinct copy angles ready for instant clipboard export.
            </p>

            <button
              onClick={handleGenerate}
              disabled={generating || !selectedProductId}
              className={cn(
                "h-11 px-6 rounded-xl bg-[#7b1425] hover:bg-[#600f1c] text-white text-xs font-bold transition-all shadow-sm inline-flex items-center justify-center gap-2 flex-shrink-0",
                generating && "opacity-90 cursor-wait"
              )}
            >
              <Wand2 size={16} className={generating ? "animate-spin" : ""} />
              <span>{generating ? "Crafting Variations..." : "Generate 3 Variations"}</span>
            </button>
          </div>
        </div>

        {/* Error Notice */}
        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-900 text-xs flex items-center gap-2">
            <AlertCircle size={16} className="text-red-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Results Section */}
        {results?.variations?.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[#14090b]">Generated Copy Variations</h3>
                <p className="text-xs text-[#8a7c7e]">
                  Product: <strong>{results.product_title}</strong> • Tone:{" "}
                  <strong>{results.tone}</strong>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
              {results.variations.map((v: any) => {
                const isCopied = copiedId === v.id;
                return (
                  <div
                    key={v.id}
                    className="bg-white rounded-2xl border border-[#e8e2dc] p-5 flex flex-col justify-between hover:border-[#DC9AA7] transition-all shadow-2xs"
                  >
                    <div>
                      {/* Card Header */}
                      <div className="flex items-center justify-between pb-3 border-b border-[#f3ede7]">
                        <span className="text-xs font-bold text-[#7b1425]">{v.title}</span>
                        <span className="text-[10px] text-[#8a7c7e] font-mono">
                          {v.char_count || v.body?.length || 0} chars
                        </span>
                      </div>

                      {/* Content */}
                      <div className="mt-4 space-y-3">
                        <h4 className="text-sm font-bold text-[#14090b] leading-snug">
                          {v.headline}
                        </h4>

                        <p className="text-xs text-[#3b2f31] leading-relaxed whitespace-pre-line">
                          {v.body}
                        </p>

                        {/* CTA Box */}
                        {v.call_to_action && (
                          <div className="p-2.5 rounded-lg bg-[#faf8f5] border border-[#f0eae4] text-xs">
                            <span className="text-[10px] font-bold text-[#7b1425] uppercase tracking-wider block">
                              Call To Action
                            </span>
                            <span className="font-semibold text-[#14090b] mt-0.5 block">
                              {v.call_to_action}
                            </span>
                          </div>
                        )}

                        {/* Tags */}
                        {v.tags?.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {v.tags.map((tag: string, tIdx: number) => (
                              <span
                                key={tIdx}
                                className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#faf8f5] text-[#5a4e50] border border-[#e8e2dc]"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Copy Button */}
                    <div className="mt-5 pt-3 border-t border-[#f3ede7]">
                      <button
                        onClick={() => handleCopyVariation(v)}
                        className={cn(
                          "w-full h-9 rounded-lg border text-xs font-bold transition-all inline-flex items-center justify-center gap-1.5",
                          isCopied
                            ? "bg-emerald-600 text-white border-emerald-600"
                            : "border-[#e8e2dc] bg-white hover:bg-[#faf8f5] text-[#14090b]"
                        )}
                      >
                        {isCopied ? <Check size={14} /> : <Copy size={14} />}
                        <span>{isCopied ? "Copied to Clipboard!" : "Copy Variation"}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

