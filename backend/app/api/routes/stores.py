from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models import Store, User
from app.schemas import StoreOut, StoreCreate, StoreUpdate
from app.api.deps import get_current_user, get_current_store

router = APIRouter(prefix="/stores", tags=["Stores"])

@router.get("", response_model=List[StoreOut])
def list_stores(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    stores = db.query(Store).filter(Store.user_id == current_user.id).all()
    return [StoreOut.model_validate(s) for s in stores]

@router.get("/active", response_model=StoreOut)
def get_active_store(current_store: Store = Depends(get_current_store)):
    return StoreOut.model_validate(current_store)

@router.post("", response_model=StoreOut)
def create_store(
    store_in: StoreCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    store = Store(
        user_id=current_user.id,
        name=store_in.name,
        currency=store_in.currency,
        domain=store_in.domain,
        platform=store_in.platform
    )
    db.add(store)
    db.commit()
    db.refresh(store)
    return StoreOut.model_validate(store)

@router.put("/{store_id}", response_model=StoreOut)
def update_store(
    store_id: str,
    store_in: StoreUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    store = db.query(Store).filter(Store.id == store_id, Store.user_id == current_user.id).first()
    if not store:
        raise HTTPException(status_code=404, detail="Store not found.")
    
    if store_in.name:
        store.name = store_in.name
    if store_in.currency:
        store.currency = store_in.currency
    if store_in.domain is not None:
        store.domain = store_in.domain

    db.commit()
    db.refresh(store)
    return StoreOut.model_validate(store)
