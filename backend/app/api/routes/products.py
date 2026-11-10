from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models import Store
from app.schemas import ProductOut, ProductDetailOut
from app.services.product_service import ProductService
from app.api.deps import get_current_store

router = APIRouter(prefix="/products", tags=["Product Intelligence"])

@router.get("", response_model=List[ProductOut])
def list_products(
    category_id: Optional[str] = None,
    search: Optional[str] = None,
    sort_by: str = Query("revenue", regex="^(revenue|units|price_desc|price_asc)$"),
    skip: int = 0,
    limit: int = 50,
    current_store: Store = Depends(get_current_store),
    db: Session = Depends(get_db)
):
    return ProductService.get_products(
        db,
        current_store.id,
        category_id=category_id,
        search=search,
        sort_by=sort_by,
        skip=skip,
        limit=limit
    )

@router.get("/top", response_model=List[ProductOut])
def get_top_products(
    limit: int = Query(5, ge=1, le=20),
    current_store: Store = Depends(get_current_store),
    db: Session = Depends(get_db)
):
    return ProductService.get_top_products(db, current_store.id, limit=limit)

@router.get("/declining", response_model=List[ProductOut])
def get_declining_products(
    current_store: Store = Depends(get_current_store),
    db: Session = Depends(get_db)
):
    return ProductService.get_declining_products(db, current_store.id)

@router.get("/{product_id}", response_model=ProductDetailOut)
def get_product_detail(
    product_id: str,
    current_store: Store = Depends(get_current_store),
    db: Session = Depends(get_db)
):
    detail = ProductService.get_product_detail(db, current_store.id, product_id)
    if not detail:
        raise HTTPException(status_code=404, detail="Product not found.")
    return detail
