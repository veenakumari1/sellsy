from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models import Store, Customer
from app.schemas import CustomerOut, CustomerInsightsOut
from app.services.customer_service import CustomerService
from app.api.deps import get_current_store

router = APIRouter(prefix="/customers", tags=["Customer Insights"])

@router.get("/insights", response_model=CustomerInsightsOut)
def get_customer_insights(
    current_store: Store = Depends(get_current_store),
    db: Session = Depends(get_db)
):
    return CustomerService.get_insights(db, current_store.id)

@router.get("", response_model=List[CustomerOut])
def list_customers(
    segment: Optional[str] = None,
    search: Optional[str] = None,
    sort_by: str = Query("spend", regex="^(spend|orders|recent|date)$"),
    skip: int = 0,
    limit: int = 50,
    current_store: Store = Depends(get_current_store),
    db: Session = Depends(get_db)
):
    return CustomerService.get_customers(
        db,
        current_store.id,
        segment=segment,
        search=search,
        sort_by=sort_by,
        skip=skip,
        limit=limit
    )

@router.get("/{customer_id}", response_model=CustomerOut)
def get_customer(
    customer_id: str,
    current_store: Store = Depends(get_current_store),
    db: Session = Depends(get_db)
):
    cust = db.query(Customer).filter(Customer.store_id == current_store.id, Customer.id == customer_id).first()
    if not cust:
        raise HTTPException(status_code=404, detail="Customer not found.")
    return CustomerOut.model_validate(cust)
