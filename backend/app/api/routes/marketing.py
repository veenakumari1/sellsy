from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models import Store
from app.schemas import MarketingStrategyOut
from app.services.marketing_service import MarketingService
from app.api.deps import get_current_store

router = APIRouter(prefix="/marketing", tags=["AI Marketing Advisor"])

@router.get("/strategy", response_model=MarketingStrategyOut)
def get_marketing_strategy(
    current_store: Store = Depends(get_current_store),
    db: Session = Depends(get_db)
):
    return MarketingService.get_marketing_strategy(db, current_store.id)
