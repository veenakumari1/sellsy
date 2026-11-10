from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models import Store
from app.schemas import ForecastResultOut
from app.services.forecast_service import ForecastService
from app.api.deps import get_current_store

router = APIRouter(prefix="/forecasts", tags=["Sales Forecasting"])

@router.get("", response_model=ForecastResultOut)
def get_forecast(
    days_ahead: int = Query(30, ge=7, le=90),
    current_store: Store = Depends(get_current_store),
    db: Session = Depends(get_db)
):
    return ForecastService.generate_forecast(db, current_store.id, days_ahead=days_ahead)
