from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import Store
from app.schemas import AgentRunResponse
from app.services.agents_team_service import AgentsTeamService
from app.api.deps import get_current_store

router = APIRouter(prefix="/agents", tags=["Multi-Agent AI Team"])

@router.post("/run", response_model=AgentRunResponse, status_code=status.HTTP_201_CREATED)
def run_agents_team(
    current_store: Store = Depends(get_current_store),
    db: Session = Depends(get_db)
):
    """
    Executes the multi-agent specialist team (Sales, Inventory, Marketing),
    generates a prioritized manager weekly plan, persists the run to the database,
    and returns findings.
    """
    return AgentsTeamService.execute_full_run(db, current_store)

@router.get("/history", response_model=List[AgentRunResponse])
def get_agents_history(
    limit: int = 20,
    current_store: Store = Depends(get_current_store),
    db: Session = Depends(get_db)
):
    """Retrieves previous agent run cycles and action plans for the active store."""
    return AgentsTeamService.get_history(db, current_store, limit=limit)

