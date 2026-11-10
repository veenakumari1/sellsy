from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models import Store
from app.schemas import (
    OverviewDashboardOut, KpiSummaryOut, SalesTrendsOut, CategoryRevenueOut
)
from app.services.analytics_service import AnalyticsService
from app.api.deps import get_current_store

router = APIRouter(prefix="/analytics", tags=["Sales Analytics"])

@router.get("/overview", response_model=OverviewDashboardOut)
def get_overview(
    current_store: Store = Depends(get_current_store),
    db: Session = Depends(get_db)
):
    return AnalyticsService.get_overview_dashboard(db, current_store.id)

@router.get("/kpis", response_model=KpiSummaryOut)
def get_kpis(
    days: int = Query(30, ge=1, le=365),
    current_store: Store = Depends(get_current_store),
    db: Session = Depends(get_db)
):
    return AnalyticsService.get_kpis(db, current_store.id, days=days)

@router.get("/trends", response_model=SalesTrendsOut)
def get_sales_trends(
    days: int = Query(30, ge=7, le=365),
    current_store: Store = Depends(get_current_store),
    db: Session = Depends(get_db)
):
    return AnalyticsService.get_sales_trends(db, current_store.id, days=days)

@router.get("/categories", response_model=List[CategoryRevenueOut])
def get_category_revenue(
    current_store: Store = Depends(get_current_store),
    db: Session = Depends(get_db)
):
    return AnalyticsService.get_category_revenue(db, current_store.id)
