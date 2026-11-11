"use client";

import React, { useEffect, useState, useRef } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ApiClient } from "@/lib/api";
import {
  BotMessageSquare,
  Sparkles,
  Send,
  User,
  Wrench,
  ChevronDown,
  ChevronRight,
  Plus,
  RefreshCw,
  MessageSquare,
  CheckCircle2,
  ShieldCheck
} from "lucide-react";

export default function AssistantPage() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [expandedTools, setExpandedTools] = useState<Record<string, boolean>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const suggestedQuestions = [
    "Why are my sales dropping and what should I do?",
    "What were my best-selling products this month?",
    "Which products should I promote to grow AOV?",
    "How many returning customers do I have?",
    "What is my expected revenue next month?",
    "Give me an executive growth strategy for this quarter"
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
      const errorMsg = {
        id: `err-${Date.now()}`,
        role: "assistant",
        content: `Error contacting agent team: ${e.message || "Failed to execute multi-agent workflow"}`,
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
      <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-8.5rem)]">
        {/* Left Sessions Column */}
        <div className="w-full lg:w-72 bg-white rounded-2xl border border-[#e8e2dc]/90 p-4 shadow-xs flex flex-col justify-between overflow-hidden">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#f3ede7]">
              <div className="flex items-center gap-2">
                <BotMessageSquare size={18} className="text-[#7b1425]" />
                <h3 className="text-sm font-bold text-[#14090b]">Intelligence Sessions</h3>
              </div>
              <button
                onClick={startNewConversation}
                className="p-1.5 rounded-lg bg-[#FBF1F3] text-[#7b1425] hover:bg-[#F6E1E5] transition-colors"
                title="New Session"
              >
                <Plus size={16} />
              </button>
            </div>

            <div className="mt-3 space-y-1 overflow-y-auto max-h-[calc(100vh-18rem)]">
              {conversations.map((c) => (
                <button
                  key={c.id}
                  onClick={() => selectConversation(c.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-medium transition-colors flex items-center gap-2.5 ${
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
                <p className="text-xs text-[#a89b99] p-3 text-center">No past sessions yet.</p>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-[#f3ede7] text-[11px] text-[#a89b99] flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-emerald-600" />
            <span>Multi-Agent LangGraph System</span>
          </div>
        </div>

        {/* Right Active Chat Workspace */}
        <div className="flex-1 bg-white rounded-2xl border border-[#e8e2dc]/90 shadow-xs flex flex-col overflow-hidden">
          {/* Header */}
          <div className="px-6 py-3.5 border-b border-[#f3ede7] flex items-center justify-between bg-[#faf8f5]/50">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#7b1425] flex items-center justify-center text-white">
                <Sparkles size={16} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#14090b]">Sellsy Multi-Agent Orchestrator</h3>
                <p className="text-[11px] text-[#6f6264]">Autonomous workflow backed by official Python MCP tools</p>
              </div>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
              Database Grounded
            </span>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 p-6 overflow-y-auto space-y-5">
            {messages.length === 0 ? (
              <div className="py-12 max-w-xl mx-auto text-center space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-[#FBF1F3] text-[#7b1425] flex items-center justify-center mx-auto">
                  <BotMessageSquare size={24} />
                </div>
                <div>
                  <h4 className="text-base font-bold text-[#14090b]">How can Sellsy help your store today?</h4>
                  <p className="text-xs text-[#6f6264] mt-1 leading-relaxed">
                    Ask questions regarding revenue trends, best selling products, customer churn, or marketing playbooks. The AI orchestrator will delegate tasks to specialized agents and query verified database tools.
                  </p>
                </div>

                <div className="pt-2">
                  <p className="text-[11px] uppercase font-bold text-[#a89b99] tracking-wider mb-2">
                    Suggested Questions:
                  </p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {suggestedQuestions.map((q, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSend(q)}
                        className="px-3 py-1.5 rounded-lg border border-[#e8e2dc] hover:border-[#DC9AA7] bg-[#faf8f5] hover:bg-[#FBF1F3]/50 text-[#3b2f31] hover:text-[#620F1E] text-xs text-left transition-colors font-medium shadow-2xs"
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

                  <div className={`max-w-2xl space-y-2 ${m.role === "user" ? "items-end" : "items-start"}`}>
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
                                  <span className="font-semibold text-[#14090b]">MCP Tool:</span>
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
                  <span>AI Agents collaborating & invoking MCP tools...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <div className="p-4 border-t border-[#f3ede7] bg-white">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                placeholder="Ask about sales, best products, at-risk buyers, or marketing playbooks..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={loading}
                className="flex-1 px-4 py-2.5 rounded-xl border border-[#e8e2dc] focus:outline-hidden focus:ring-2 focus:ring-[#7b1425]/20 focus:border-[#7b1425] text-xs text-[#14090b] shadow-2xs"
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="px-4 py-2.5 rounded-xl bg-[#7b1425] hover:bg-[#620F1E] text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                <span>Send</span>
                <Send size={14} />
              </button>
            </form>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

