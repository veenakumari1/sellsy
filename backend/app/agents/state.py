from typing import TypedDict, List, Dict, Any, Optional

class AgentState(TypedDict):
    store_id: str
    user_query: str
    conversation_history: List[Dict[str, str]]
    intent: str
    required_agents: List[str]
    current_agent_index: int
    agent_outputs: Dict[str, Any]
    tool_calls_executed: List[Dict[str, Any]]
    final_response: str
    suggested_actions: List[str]
