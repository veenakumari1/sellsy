"use client";

/**
 * ChatWidget — floating Sellsy assistant for the landing page
 * Theme: white · burgundy · black
 *
 * Modes
 *  - Local (default): answers visitor questions from a built-in knowledge base.
 *  - Backend: set NEXT_PUBLIC_CHAT_URL (or pass `endpoint`) → POST { message, history }
 *             expects JSON { reply } (also accepts { response } / { answer } / { message }).
 *             If the call fails, it falls back to local answers automatically.
 */

import React, { useEffect, useRef, useState } from "react";

type Msg = { id: number; role: "user" | "bot"; text: string };

const INK = "#14090b";
const WINE = "#7b1425";

const KB: { keys: string[]; answer: string }[] = [
  {
    keys: ["hi", "hello", "hey", "salam", "assalam", "aoa"],
    answer: "Hi! I'm the Sellsy assistant. Ask me about analytics, the AI agents, forecasting, or how to connect your store.",
  },
  {
    keys: ["what can", "features", "capabilities", "what does", "what is sellsy", "do you do", "offer"],
    answer:
      "Sellsy turns your store data into decisions with six tools: Sales Analytics, Product Intelligence, Customer Insights, Statistical Forecasting, an AI Marketing Advisor, and a conversational Sellsy AI Assistant.",
  },
  {
    keys: ["agent", "multi-agent", "langgraph", "orchestrator", "how does the ai"],
    answer:
      "Instead of one generic chatbot, Sellsy routes each question through five specialized agents: Sales, Product, Customer, Prediction and Marketing. A central orchestrator (built on LangGraph) combines their findings into one answer.",
  },
  {
    keys: ["connect", "shopify", "csv", "integrat", "import", "upload", "ingest", "data source"],
    answer:
      "You can connect your Shopify storefront through its API, or upload your historical product, order and customer CSV files. Columns are mapped automatically, so setup takes minutes.",
  },
  {
    keys: ["forecast", "predict", "holt", "confidence", "accura", "projection"],
    answer:
      "Forecasts use Holt-Winters double exponential smoothing with 80% confidence bands. They are statistical models computed from your data, not guesses from a language model.",
  },
  {
    keys: ["customer", "rfm", "churn", "segment", "vip", "retention", "repeat"],
    answer:
      "Customer Insights segments buyers with RFM (High-Value VIPs, Returning Loyalists, At-Risk Shoppers), shows verified cohort repeat rates, and flags churn risk so you can act before customers drift away.",
  },
  {
    keys: ["product", "sku", "margin", "inventory", "declining", "velocity", "stock"],
    answer:
      "Product Intelligence tracks SKU-level margins and sales velocity, highlights your catalog stars, and detects declining products that may need a liquidation bundle.",
  },
  {
    keys: ["sales", "revenue", "orders", "growth", "weekend", "period"],
    answer:
      "Sales Analytics compares revenue and order volume period over period, shows day-of-week patterns, and tracks deltas automatically, so shifts in revenue velocity are easy to spot.",
  },
  {
    keys: ["marketing", "campaign", "advisor", "cross-sell", "cart", "promotion"],
    answer:
      "The AI Marketing Advisor turns what the other agents find into concrete actions: hero-product campaigns, cart-threshold optimizations and cross-sell pairings.",
  },
  {
    keys: ["mcp", "model context", "assistant", "chatbot", "ask questions"],
    answer:
      "The Sellsy AI Assistant is conversational. It uses Model Context Protocol (MCP) tools to read your actual store data, so answers are grounded in your numbers.",
  },
  {
    keys: ["how it works", "how does it work", "steps", "get started", "start", "setup", "onboard"],
    answer:
      "Three steps: Connect your store (Shopify or CSV), Analyze (five agents compute growth, margins, segments and forecasts), then Decide with clear, number-backed recommendations. The quickest way to see it is the live demo.",
  },
  {
    keys: ["demo", "try", "explore", "dashboard"],
    answer: "Press “Explore Demo” at the top of the page to open the live Sellsy dashboard with sample store data.",
  },
  {
    keys: ["price", "pricing", "cost", "free", "plan", "subscription", "pay"],
    answer:
      "I don't have pricing details here. You can try the live demo from the “Explore Demo” button, and pricing questions are best sent to the team directly.",
  },
];

const FALLBACK =
  "I can help with Sellsy's analytics, AI agents, forecasting, customer insights, and connecting a store (Shopify or CSV). Could you ask about one of those?";

const SUGGESTIONS = [
  "What can Sellsy do?",
  "How do the AI agents work?",
  "How do I connect my store?",
  "How accurate is the forecasting?",
];

function localReply(q: string): string {
  const s = ` ${q.toLowerCase()} `;
  let best = { score: 0, answer: FALLBACK };
  for (const e of KB) {
    const score = e.keys.reduce((n, k) => {
      const hit = k.length <= 3 ? s.includes(` ${k} `) || s.includes(` ${k}!`) || s.includes(` ${k},`) : s.includes(k);
      return n + (hit ? 1 : 0);
    }, 0);
    if (score > best.score) best = { score, answer: e.answer };
  }
  return best.answer;
}

async function backendReply(url: string, message: string, history: Msg[]): Promise<string> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      history: history.map((m) => ({ role: m.role === "user" ? "user" : "assistant", content: m.text })),
    }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  const out = data.reply ?? data.response ?? data.answer ?? data.message;
  if (typeof out !== "string" || !out.trim()) throw new Error("Empty reply");
  return out;
}

const Icon = {
  chat: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" />
    </svg>
  ),
  close: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  ),
  send: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  ),
};

export default function ChatWidget({ endpoint }: { endpoint?: string }) {
  const url =
    endpoint ??
    process.env.NEXT_PUBLIC_CHAT_URL ??
    `${(process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000").replace(/\/+$/, "")}/api/chat`;
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([
    {
      id: 0,
      role: "bot",
      text: "Hi, I'm the Sellsy assistant. Ask me anything about the platform, or pick a question below.",
    },
  ]);
  const idRef = useRef(1);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const timers = useRef<number[]>([]);

  useEffect(() => () => timers.current.forEach((t) => window.clearInterval(t)), []);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [msgs, typing, open]);
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 120);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // reveal the answer word by word
  const reveal = (full: string) => {
    const id = idRef.current++;
    const words = full.split(" ");
    let i = 0;
    setMsgs((m) => [...m, { id, role: "bot", text: "" }]);
    const t = window.setInterval(() => {
      i += 2;
      setMsgs((m) => m.map((x) => (x.id === id ? { ...x, text: words.slice(0, i).join(" ") } : x)));
      if (i >= words.length) window.clearInterval(t);
    }, 28);
    timers.current.push(t);
  };

  const send = async (raw: string) => {
    const text = raw.trim();
    if (!text || typing) return;
    const history = msgs;
    setMsgs((m) => [...m, { id: idRef.current++, role: "user", text }]);
    setInput("");
    setTyping(true);
    let answer: string;
    try {
      answer = url ? await backendReply(url, text, history) : (await new Promise((r) => setTimeout(r, 650)), localReply(text));
    } catch {
      answer = localReply(text);
    }
    setTyping(false);
    reveal(answer);
  };

  const showChips = msgs.length === 1;

  return (
    <div className="sc-root">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {open && (
        <section className="sc-panel" role="dialog" aria-label="Sellsy assistant">
          <header className="sc-head">
            <div>
              <div className="sc-logo">
                <b>S</b>ell<span>s</span>
                <b>y</b>
              </div>
              <div className="sc-sub">
                <i /> AI assistant
              </div>
            </div>
            <button className="sc-x" onClick={() => setOpen(false)} aria-label="Close chat">
              {Icon.close}
            </button>
          </header>

          <div className="sc-list" aria-live="polite">
            {msgs.map((m) => (
              <div key={m.id} className={`sc-row ${m.role}`}>
                <div className="sc-bubble">{m.text || " "}</div>
              </div>
            ))}
            {typing && (
              <div className="sc-row bot">
                <div className="sc-bubble sc-typing" aria-label="Assistant is typing">
                  <i /><i /><i />
                </div>
              </div>
            )}
            {showChips && (
              <div className="sc-chips">
                {SUGGESTIONS.map((s) => (
                  <button key={s} onClick={() => send(s)}>
                    {s}
                  </button>
                ))}
              </div>
            )}
            <div ref={endRef} />
          </div>

          <form
            className="sc-form"
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about Sellsy…"
              maxLength={500}
              aria-label="Your question"
            />
            <button type="submit" disabled={!input.trim() || typing} aria-label="Send">
              {Icon.send}
            </button>
          </form>
        </section>
      )}

      <button className="sc-fab" onClick={() => setOpen((o) => !o)} aria-label={open ? "Close chat" : "Open chat"}>
        {open ? Icon.close : Icon.chat}
        <span>{open ? "Close" : "Ask Sellsy"}</span>
      </button>
    </div>
  );
}

const CSS = `
.sc-root{position:fixed;right:22px;bottom:22px;z-index:60;font-family:'Inter Tight',system-ui,sans-serif;color:${INK}}
.sc-root *{box-sizing:border-box}
.sc-fab{display:flex;align-items:center;gap:9px;height:46px;padding:0 20px;border:0;border-radius:99px;background:${WINE};color:#fff;font:600 13px 'Inter Tight',system-ui,sans-serif;letter-spacing:.02em;cursor:pointer;box-shadow:0 12px 30px -10px rgba(123,20,37,.7);transition:background .2s,transform .2s;margin-left:auto}
.sc-fab:hover{background:${INK};transform:translateY(-2px)}
.sc-panel{width:380px;max-width:calc(100vw - 32px);height:540px;max-height:calc(100vh - 110px);margin-bottom:14px;display:flex;flex-direction:column;background:#fff;border:1px solid rgba(20,9,11,.14);border-radius:20px;overflow:hidden;box-shadow:0 30px 80px -24px rgba(20,9,11,.45);animation:scIn .28s cubic-bezier(.2,.8,.2,1)}
.sc-head{display:flex;align-items:center;justify-content:space-between;padding:16px 18px 14px;border-bottom:1px solid rgba(20,9,11,.1);background:#faf8f5}
.sc-logo{font:italic 800 24px/1 'Fraunces',Georgia,serif;font-variation-settings:'SOFT' 100,'WONK' 1,'opsz' 144;letter-spacing:-.03em;color:${INK}}
.sc-logo b{color:${WINE};font-weight:800}
.sc-sub{display:flex;align-items:center;gap:7px;margin-top:6px;font:500 10.5px 'IBM Plex Mono',monospace;letter-spacing:.1em;text-transform:uppercase;color:#6f6264}
.sc-sub i{width:7px;height:7px;border-radius:50%;background:${WINE};box-shadow:0 0 0 3px rgba(123,20,37,.15)}
.sc-x{display:grid;place-items:center;width:32px;height:32px;border:1px solid rgba(20,9,11,.2);border-radius:50%;background:transparent;color:${INK};cursor:pointer;transition:background .2s,color .2s}
.sc-x:hover{background:${INK};color:#fff}
.sc-list{flex:1;overflow-y:auto;padding:18px 16px 8px;display:flex;flex-direction:column;gap:10px;scroll-behavior:smooth}
.sc-row{display:flex}
.sc-row.user{justify-content:flex-end}
.sc-bubble{max-width:84%;padding:10px 14px;border-radius:16px;font-size:13.5px;line-height:1.5;white-space:pre-wrap;word-wrap:break-word;animation:scPop .22s ease}
.sc-row.bot .sc-bubble{background:#f3ede7;border:1px solid rgba(20,9,11,.08);border-bottom-left-radius:5px}
.sc-row.user .sc-bubble{background:${WINE};color:#fff;border-bottom-right-radius:5px}
.sc-typing{display:flex;gap:5px;padding:13px 15px}
.sc-typing i{width:6px;height:6px;border-radius:50%;background:${WINE};opacity:.35;animation:scDot 1s infinite}
.sc-typing i:nth-child(2){animation-delay:.15s}.sc-typing i:nth-child(3){animation-delay:.3s}
.sc-chips{display:flex;flex-wrap:wrap;gap:8px;margin-top:4px}
.sc-chips button{padding:8px 13px;border:1px solid rgba(123,20,37,.45);border-radius:99px;background:#fff;color:${WINE};font:500 12px 'Inter Tight',system-ui,sans-serif;cursor:pointer;transition:background .2s,color .2s}
.sc-chips button:hover{background:${WINE};color:#fff}
.sc-form{display:flex;gap:8px;padding:12px 14px 14px;border-top:1px solid rgba(20,9,11,.1);background:#fff}
.sc-form input{flex:1;height:42px;padding:0 16px;border:1px solid rgba(20,9,11,.2);border-radius:99px;background:#faf8f5;color:${INK};font:400 13.5px 'Inter Tight',system-ui,sans-serif;outline:none;transition:border-color .2s}
.sc-form input:focus{border-color:${WINE}}
.sc-form button{display:grid;place-items:center;width:42px;height:42px;border:0;border-radius:50%;background:${INK};color:#fff;cursor:pointer;transition:background .2s,opacity .2s}
.sc-form button:hover:not(:disabled){background:${WINE}}
.sc-form button:disabled{opacity:.3;cursor:default}
@keyframes scIn{from{opacity:0;transform:translateY(14px) scale(.98)}to{opacity:1;transform:none}}
@keyframes scPop{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:none}}
@keyframes scDot{0%,80%,100%{opacity:.3;transform:translateY(0)}40%{opacity:1;transform:translateY(-3px)}}
@media (max-width:520px){.sc-root{right:14px;bottom:14px}.sc-panel{width:calc(100vw - 28px)}}
`;