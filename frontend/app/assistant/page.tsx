"use client";

import React, { useEffect, useState, useRef } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ApiClient } from "@/lib/api";
import {
  BotMessageSquare,
  Sparkles,
  Send,
  Wrench,
  ChevronDown,
  ChevronRight,
  Plus,
  RefreshCw,
  MessageSquare,
  ShieldCheck
} from "lucide-react";

export default function AssistantPage() {
  const [conversations, setConversations] = useState<any[]>(() => ApiClient.getCached("/api/v1/assistant/conversations") || []);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [expandedTools, setExpandedTools] = useState<Record<string, boolean>>({});
  const [showMobileHistory, setShowMobileHistory] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const suggestedQuestions = [
    "Why are my sales dropping and what should I do?",
    "What were my best-selling products this month?",
    "Which products should I promote to grow order value?",
    "How many returning customers do I have?",
    "What is my expected revenue next month?",
    "Give me growth suggestions for this quarter"
  ];

  const loadConversations = async () => {
    try {
      const convs = await ApiClient.getConversations();
      setConversations(convs);
      if (convs.length > 0 && !activeConvId) {
        selectConversation(convs[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const selectConversation = async (convId: string) => {
    setActiveConvId(convId);
    setShowMobileHistory(false);
    try {
      const conv = await ApiClient.getConversation(convId);
      setMessages(conv.messages || []);
    } catch (e) {
      console.error(e);
    }
  };

  const startNewConversation = () => {
    setActiveConvId(null);
    setMessages([]);
    setShowMobileHistory(false);
  };

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = async (messageToSend?: string) => {
    const text = messageToSend || input;
    if (!text.trim() || loading) return;

    setInput("");
    const tempUserMsg = {
      id: `temp-${Date.now()}`,
      role: "user",
      content: text,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);
    setLoading(true);

    try {
      const response = await ApiClient.sendChatMessage(text, activeConvId || undefined);
      if (!activeConvId) {
        setActiveConvId(response.conversation_id);
        loadConversations();
      }
      setMessages((prev) => [...prev, response.message]);
    } catch (e: any) {
      console.error("Assistant chat error", e);
      const errorMsg = {
        id: `err-${Date.now()}`,
        role: "assistant",
        content: "We couldn't connect to your assistant right now. Please try again.",
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const toggleTool = (idx: string) => {
    setExpandedTools((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  return (
    <DashboardLayout>
      <div className="space-y-4">
        {/* Page Heading */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#e8e2dc]">
          <div>
            <h2 className="text-xl font-bold text-[#14090b] tracking-tight">Assistant</h2>
            <p className="text-xs text-[#6f6264] mt-0.5">
              Ask questions and get AI insights about your store
            </p>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 h-[calc(100dvh-12.5rem)] lg:h-[calc(100vh-13.5rem)] min-h-[480px] min-w-0">
        {/* Left Sessions Column */}
        <div
          className={`w-full lg:w-72 bg-white rounded-2xl border border-[#e8e2dc]/90 p-4 shadow-xs flex-col justify-between overflow-hidden flex-shrink-0 ${
            showMobileHistory ? "flex max-h-[50vh] lg:max-h-none" : "hidden lg:flex"
          }`}
        >
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#f3ede7]">
              <div className="flex items-center gap-2">
                <BotMessageSquare size={18} className="text-[#7b1425]" />
                <h3 className="text-sm font-bold text-[#14090b]">Past chats</h3>
              </div>
              <button
                onClick={startNewConversation}
                className="p-1.5 rounded-lg bg-[#FBF1F3] text-[#7b1425] hover:bg-[#F6E1E5] transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
                title="New chat"
              >
                <Plus size={16} />
              </button>
            </div>

            <div className="mt-3 space-y-1 overflow-y-auto max-h-[35vh] lg:max-h-[calc(100vh-23rem)]">
              {conversations.map((c) => (
                <button
                  key={c.id}
                  onClick={() => selectConversation(c.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-medium transition-colors flex items-center gap-2.5 min-h-[40px] ${
                    activeConvId === c.id
                      ? "bg-[#FBF1F3] text-[#4D0C18] font-semibold border border-[#EBC3CB]/60"
                      : "text-[#5a4e50] hover:bg-[#faf8f5]"
                  }`}
                >
                  <MessageSquare size={14} className="flex-shrink-0 text-[#a89b99]" />
                  <span className="truncate flex-1">{c.title}</span>
                </button>
              ))}
              {conversations.length === 0 && (
                <p className="text-xs text-[#a89b99] p-3 text-center">No past chats yet.</p>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-[#f3ede7] text-[11px] text-[#a89b99] flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-emerald-600" />
            <span>Store AI Assistant</span>
          </div>
        </div>

        {/* Right Active Chat Workspace */}
        <div className="flex-1 bg-white rounded-2xl border border-[#e8e2dc]/90 shadow-xs flex flex-col overflow-hidden min-w-0 h-full">
          {/* Header */}
          <div className="px-4 sm:px-6 py-3.5 border-b border-[#f3ede7] flex items-center justify-between bg-[#faf8f5]/50 flex-wrap gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-[#7b1425] flex items-center justify-center text-white flex-shrink-0">
                <Sparkles size={16} />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-[#14090b] truncate">Store Assistant</h3>
                <p className="text-[11px] text-[#6f6264] truncate hidden sm:block">Ask anything about your store, sales, or products</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={() => setShowMobileHistory(!showMobileHistory)}
                className="lg:hidden h-8 px-2.5 rounded-lg border border-[#e8e2dc] bg-white text-xs font-semibold text-[#5a4e50] hover:text-[#7b1425] flex items-center gap-1.5 transition-colors min-h-[36px]"
                aria-label="Toggle chat history"
              >
                <BotMessageSquare size={14} className="text-[#7b1425]" />
                <span>{showMobileHistory ? "Chat" : "History"}</span>
              </button>
              <button
                type="button"
                onClick={startNewConversation}
                className="lg:hidden h-8 w-8 rounded-lg bg-[#FBF1F3] text-[#7b1425] flex items-center justify-center min-h-[36px] min-w-[36px]"
                title="New chat"
              >
                <Plus size={15} />
              </button>
              <span className="hidden sm:inline-flex px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                Store data
              </span>
            </div>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 p-3.5 sm:p-6 overflow-y-auto space-y-4 sm:space-y-5">
            {messages.length === 0 ? (
              <div className="py-12 max-w-xl mx-auto text-center space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-[#FBF1F3] text-[#7b1425] flex items-center justify-center mx-auto">
                  <BotMessageSquare size={24} />
                </div>
                <div>
                  <h4 className="text-base font-bold text-[#14090b]">How can Storsy help your store today?</h4>
                  <p className="text-xs text-[#6f6264] mt-1 leading-relaxed">
                    Ask questions about your sales, top products, returning buyers, or marketing ideas.
                  </p>
                </div>

                <div className="pt-2">
                  <p className="text-[11px] uppercase font-bold text-[#a89b99] tracking-wider mb-2">
                    Suggested questions:
                  </p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {suggestedQuestions.map((q, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSend(q)}
                        className="px-3 py-1.5 rounded-lg border border-[#e8e2dc] hover:border-[#DC9AA7] bg-[#faf8f5] hover:bg-[#FBF1F3]/50 text-[#3b2f31] hover:text-[#620F1E] text-xs text-left transition-colors font-medium shadow-2xs min-h-[36px]"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              messages.map((m, mIdx) => (
                <div
                  key={m.id || mIdx}
                  className={`flex gap-3 ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {m.role === "assistant" && (
                    <div className="w-8 h-8 rounded-lg bg-[#7b1425] text-white flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Sparkles size={16} />
                    </div>
                  )}

                  <div className={`w-full max-w-full sm:max-w-2xl space-y-2 ${m.role === "user" ? "items-end" : "items-start"}`}>
                    {/* Tool Invocations Badge */}
                    {m.tool_calls && m.tool_calls.length > 0 && (
                      <div className="space-y-1.5 mb-2">
                        {m.tool_calls.map((tc: any, tcIdx: number) => {
                          const key = `${m.id}-${tcIdx}`;
                          const isOpen = !!expandedTools[key];
                          return (
                            <div
                              key={tcIdx}
                              className="rounded-lg border border-[#e8e2dc] bg-[#faf8f5] text-[11px] overflow-hidden"
                            >
                              <button
                                onClick={() => toggleTool(key)}
                                className="w-full px-3 py-1.5 flex items-center justify-between text-[#3b2f31] hover:bg-[#f3ede7] font-mono transition-colors"
                              >
                                <div className="flex items-center gap-1.5">
                                  <Wrench size={12} className="text-[#7b1425]" />
                                  <span className="font-semibold text-[#14090b]">Tool used:</span>
                                  <span className="text-[#620F1E]">{tc.tool_name}()</span>
                                </div>
                                {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                              </button>
                              {isOpen && (
                                <div className="p-2.5 bg-[#14090b] text-[#e8e2dc] font-mono text-[10px] space-y-1 border-t border-[#e8e2dc]">
                                  <div>
                                    <span className="text-[#a89b99]">Arguments: </span>
                                    <span>{JSON.stringify(tc.arguments)}</span>
                                  </div>
                                  {tc.output_summary && (
                                    <div>
                                      <span className="text-[#a89b99]">Result: </span>
                                      <span className="text-emerald-400">{tc.output_summary}</span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Message Bubble */}
                    <div
                      className={`p-4 rounded-2xl text-xs leading-relaxed ${
                        m.role === "user"
                          ? "bg-[#14090b] text-white rounded-br-xs"
                          : "bg-[#faf8f5] text-[#14090b] border border-[#e8e2dc]/80 rounded-bl-xs space-y-2"
                      }`}
                    >
                      <div className="whitespace-pre-wrap font-sans">{m.content}</div>
                    </div>
                  </div>

                  {m.role === "user" && (
                    <div className="w-8 h-8 rounded-lg bg-[#e8e2dc] text-[#3b2f31] flex items-center justify-center flex-shrink-0 mt-0.5 font-bold text-xs">
                      AM
                    </div>
                  )}
                </div>
              ))
            )}

            {loading && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#7b1425] text-white flex items-center justify-center flex-shrink-0 animate-pulse">
                  <Sparkles size={16} />
                </div>
                <div className="p-3.5 rounded-2xl bg-[#faf8f5] border border-[#e8e2dc] text-xs text-[#5a4e50] flex items-center gap-2">
                  <RefreshCw size={13} className="animate-spin text-[#7b1425]" />
                  <span>Thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <div className="p-3 sm:p-4 border-t border-[#f3ede7] bg-white sticky bottom-0 z-10">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                placeholder="Ask anything about your store..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={loading}
                className="h-10 flex-1 px-3 sm:px-4 rounded-xl border border-[#e8e2dc] focus:outline-hidden focus:ring-2 focus:ring-[#7b1425]/20 focus:border-[#7b1425] text-xs text-[#14090b] shadow-2xs min-h-[40px]"
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="h-10 px-3.5 sm:px-4 rounded-xl bg-[#7b1425] hover:bg-[#620F1E] text-white text-xs font-semibold shadow-xs transition-colors inline-flex items-center justify-center gap-1.5 disabled:opacity-50 flex-shrink-0 min-h-[40px]"
              >
                <span>Send</span>
                <Send size={14} />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
    </DashboardLayout>
  );
}

