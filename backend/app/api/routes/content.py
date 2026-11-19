from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import Store
from app.schemas import ContentGenerateRequest, ContentGenerateResponse
from app.services.content_generator_service import ContentGeneratorService
from app.api.deps import get_current_store

router = APIRouter(prefix="/content", tags=["AI Content Generator"])

@router.post("/generate", response_model=ContentGenerateResponse)
def generate_product_content(
    payload: ContentGenerateRequest,
    current_store: Store = Depends(get_current_store),
    db: Session = Depends(get_db)
):
    """
    Generates 3 distinct high-converting e-commerce copy variations for a selected product:
    product descriptions, paid ad copy, or social captions, tuned to the specified tone.
    """
    if payload.content_type not in ("description", "ad_copy", "social_post"):
        payload.content_type = "description"
    if payload.tone not in ("friendly", "premium", "urgent"):
        payload.tone = "friendly"

    try:
        return ContentGeneratorService.generate_content(
            db=db,
            store=current_store,
            product_id=payload.product_id,
            content_type=payload.content_type,
            tone=payload.tone
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

