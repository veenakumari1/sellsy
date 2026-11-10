from typing import Optional
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models import Store
from app.schemas import (
    ShopifyConnectRequest, IntegrationStatusOut,
    CsvImportPreview, CsvImportConfirmRequest, CsvImportResult
)
from app.services.shopify_service import ShopifyService
from app.services.csv_service import CsvService
from app.api.deps import get_current_store

router = APIRouter(prefix="/integrations", tags=["Integrations & Data Ingestion"])

@router.get("/status", response_model=IntegrationStatusOut)
def get_integration_status(
    current_store: Store = Depends(get_current_store),
    db: Session = Depends(get_db)
):
    status_data = ShopifyService.get_status(db, current_store.id)
    return IntegrationStatusOut(**status_data)

@router.post("/shopify/connect")
async def connect_shopify(
    req: ShopifyConnectRequest,
    current_store: Store = Depends(get_current_store),
    db: Session = Depends(get_db)
):
    result = await ShopifyService.verify_and_connect(
        db=db,
        store_id=current_store.id,
        shop_domain=req.shop_domain,
        access_token=req.access_token,
        api_key=req.api_key
    )
    return result

@router.post("/csv/preview", response_model=CsvImportPreview)
async def preview_csv(
    import_type: str = Form(...),
    file: UploadFile = File(...)
):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Uploaded file must be a standard .csv format.")
    
    contents = await file.read()
    try:
        preview = CsvService.parse_preview(contents, file.filename, import_type)
        return preview
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse CSV: {str(e)}")

@router.post("/csv/confirm", response_model=CsvImportResult)
def confirm_csv_import(
    req: CsvImportConfirmRequest,
    current_store: Store = Depends(get_current_store),
    db: Session = Depends(get_db)
):
    try:
        result = CsvService.process_import(
            db=db,
            store_id=current_store.id,
            import_type=req.import_type,
            column_mapping=req.column_mapping,
            rows=req.rows
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Import execution failed: {str(e)}")
