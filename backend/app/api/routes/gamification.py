from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models import User, Store
from app.schemas import (
    GamificationOverviewOut, LeaderboardUserOut, ClaimTaskRequest
)
from app.services.gamification_service import GamificationService
from app.api.deps import get_current_user, get_current_store

router = APIRouter(prefix="/gamification", tags=["Gamification & Rewards"])

@router.get("/overview", response_model=GamificationOverviewOut)
def get_gamification_overview(
    current_user: User = Depends(get_current_user),
    current_store: Store = Depends(get_current_store),
    db: Session = Depends(get_db)
):
    return GamificationService.get_overview(db, current_user.id, current_store.id)

@router.get("/leaderboard", response_model=List[LeaderboardUserOut])
def get_leaderboard(
    current_user: User = Depends(get_current_user),
    current_store: Store = Depends(get_current_store),
    db: Session = Depends(get_db)
):
    return GamificationService.get_leaderboard(db, current_user.id, current_store.name)

@router.post("/claim-task")
def claim_task(
    req: ClaimTaskRequest,
    current_user: User = Depends(get_current_user),
    current_store: Store = Depends(get_current_store),
    db: Session = Depends(get_db)
):
    # Verified business improvement tasks point reward values
    task_rewards = {
        "review_insights": 35,
        "bundle_declining": 50,
        "activate_marketing": 75,
        "audit_rfm": 40,
        "set_forecast": 30
    }
    pts = task_rewards.get(req.task_key, 25)

    GamificationService.award_points(
        db,
        user_id=current_user.id,
        activity_type=req.task_key,
        points=pts,
        description=f"Completed Task: {req.task_title}",
        store_id=current_store.id
    )

    # Check if growth planner achievement should be unlocked
    if req.task_key in ["bundle_declining", "activate_marketing"]:
        GamificationService.unlock_achievement(db, current_user.id, "growth_planner", store_id=current_store.id)

    return {
        "status": "ok",
        "points_awarded": pts,
        "overview": GamificationService.get_overview(db, current_user.id, current_store.id)
    }

@router.post("/track-interaction")
def track_interaction(
    feature: str,  # "analytics", "products", "ai_chat"
    current_user: User = Depends(get_current_user),
    current_store: Store = Depends(get_current_store),
    db: Session = Depends(get_db)
):
    if feature == "analytics":
        GamificationService.unlock_achievement(db, current_user.id, "data_explorer", store_id=current_store.id)
    elif feature == "products":
        GamificationService.unlock_achievement(db, current_user.id, "product_expert", store_id=current_store.id)
    elif feature == "ai_chat":
        GamificationService.unlock_achievement(db, current_user.id, "ai_explorer", store_id=current_store.id)

    return {"status": "ok"}

