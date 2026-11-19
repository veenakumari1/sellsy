import os
from typing import Dict, Any, List
from langgraph.graph import StateGraph, END
from app.agents.state import AgentState
from app.agents.specialists import (
    run_sales_agent,
    run_product_agent,
    run_customer_agent,
    run_prediction_agent,
    run_marketing_agent
)
from app.core.config import settings

def orchestrator_router(state: AgentState) -> AgentState:
    query = state["user_query"].lower()
    
    required = []
    
    # Check for comprehensive diagnostics
    is_comprehensive = any(w in query for w in [
        "why are my sales", "how to grow", "business plan", "growth strategy",
        "store performance", "store diagnostic", "full report", "overview", "what should i do"
    ])

    if is_comprehensive:
        required = ["sales", "products", "customers", "marketing"]
    else:
        # Check domain specific intents
        if any(w in query for w in ["sale", "revenue", "order", "growth", "aov", "performance"]):
            required.append("sales")
        if any(w in query for w in ["product", "sku", "item", "best sell", "top sell", "declining", "catalog", "inventory"]):
            required.append("products")
        if any(w in query for w in ["customer", "shopper", "client", "repeat", "churn", "vip", "at risk", "retention"]):
            required.append("customers")
        if any(w in query for w in ["forecast", "predict", "next month", "future", "projection", "estimate"]):
            required.append("prediction")
        if any(w in query for w in ["market", "promote", "campaign", "ad", "cross sell", "upsell", "bundle"]):
            required.append("marketing")

    # Fallback to sales and products if none explicitly caught
    if not required:
        required = ["sales", "products"]

    state["required_agents"] = required
    state["current_agent_index"] = 0
    return state

def router_next_agent(state: AgentState) -> str:
    agents = state.get("required_agents", [])
    idx = state.get("current_agent_index", 0)
    if idx < len(agents):
        return agents[idx]
    return "synthesis"

def sales_step(state: AgentState) -> AgentState:
    state = run_sales_agent(state)
    state["current_agent_index"] = state.get("current_agent_index", 0) + 1
    return state

def products_step(state: AgentState) -> AgentState:
    state = run_product_agent(state)
    state["current_agent_index"] = state.get("current_agent_index", 0) + 1
    return state

def customers_step(state: AgentState) -> AgentState:
    state = run_customer_agent(state)
    state["current_agent_index"] = state.get("current_agent_index", 0) + 1
    return state

def prediction_step(state: AgentState) -> AgentState:
    state = run_prediction_agent(state)
    state["current_agent_index"] = state.get("current_agent_index", 0) + 1
    return state

def marketing_step(state: AgentState) -> AgentState:
    state = run_marketing_agent(state)
    state["current_agent_index"] = state.get("current_agent_index", 0) + 1
    return state

def synthesis_step(state: AgentState) -> AgentState:
    outputs = state.get("agent_outputs", {})
    query = state.get("user_query", "")

    sections = []
    
    # Build consolidated response
    if "sales_agent" in outputs:
        sections.append(outputs["sales_agent"]["narrative"])
    if "product_agent" in outputs:
        sections.append(outputs["product_agent"]["narrative"])
    if "customer_agent" in outputs:
        sections.append(outputs["customer_agent"]["narrative"])
    if "prediction_agent" in outputs:
        sections.append(outputs["prediction_agent"]["narrative"])
    if "marketing_agent" in outputs:
        sections.append(outputs["marketing_agent"]["narrative"])

    consolidated_draft = "\n\n".join(sections)

    # Optional Gemini enhancement if GEMINI_API_KEY is configured
    final_text = consolidated_draft
    if settings.GEMINI_API_KEY and len(settings.GEMINI_API_KEY) > 10:
        try:
            from google import genai
            client = genai.Client(api_key=settings.GEMINI_API_KEY)
            prompt = (
                f"You are the Storsy AI Executive Assistant for e-commerce store intelligence.\n"
                f"The user asked: '{query}'\n\n"
                f"Your specialized AI agent team analyzed the store database and returned the following verified data:\n"
                f"{consolidated_draft}\n\n"
                f"Synthesize this into a polished, professional, concise response. "
                f"Preserve all exact rupee amounts (PKR / Rs), percentages, product names, and action items. "
                f"Do not invent any numbers. Keep the tone sharp, executive, and encouraging."
            )
            response = client.models.generate_content(
                model=settings.GEMINI_MODEL,
                contents=prompt
            )
            if response and response.text:
                final_text = response.text
        except Exception:
            # Fall back smoothly to grounded analytical draft
            final_text = consolidated_draft

    # Formulate relevant suggested next questions
    suggestions = [
        "What are my best-selling products this month?",
        "How can I reactivate at-risk customers?",
        "What is my sales forecast for next month?",
        "Generate a full marketing campaign blueprint"
    ]

    state["final_response"] = final_text
    state["suggested_actions"] = suggestions
    return state

def build_multi_agent_graph():
    builder = StateGraph(AgentState)

    builder.add_node("router", orchestrator_router)
    builder.add_node("sales", sales_step)
    builder.add_node("products", products_step)
    builder.add_node("customers", customers_step)
    builder.add_node("prediction", prediction_step)
    builder.add_node("marketing", marketing_step)
    builder.add_node("synthesis", synthesis_step)

    builder.set_entry_point("router")

    # Routing from router
    builder.add_conditional_edges(
        "router",
        router_next_agent,
        {
            "sales": "sales",
            "products": "products",
            "customers": "customers",
            "prediction": "prediction",
            "marketing": "marketing",
            "synthesis": "synthesis"
        }
    )

    # Routing from each agent back to router_next_agent
    for agent_node in ["sales", "products", "customers", "prediction", "marketing"]:
        builder.add_conditional_edges(
            agent_node,
            router_next_agent,
            {
                "sales": "sales",
                "products": "products",
                "customers": "customers",
                "prediction": "prediction",
                "marketing": "marketing",
                "synthesis": "synthesis"
            }
        )

    builder.add_edge("synthesis", END)

    return builder.compile()

# Singleton compiled graph
agent_graph = build_multi_agent_graph()

def run_agent_workflow(store_id: str, query: str, conversation_history: List[Dict[str, str]] = None) -> Dict[str, Any]:
    initial_state: AgentState = {
        "store_id": store_id,
        "user_query": query,
        "conversation_history": conversation_history or [],
        "intent": "general",
        "required_agents": [],
        "current_agent_index": 0,
        "agent_outputs": {},
        "tool_calls_executed": [],
        "final_response": "",
        "suggested_actions": []
    }
    result_state = agent_graph.invoke(initial_state)
    return {
        "response": result_state["final_response"],
        "tool_calls": result_state["tool_calls_executed"],
        "suggested_actions": result_state["suggested_actions"]
    }
