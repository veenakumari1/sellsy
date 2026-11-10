from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.seed_service import seed_demo_store

router = APIRouter(prefix="/seed", tags=["Demo Seeding"])

@router.post("/demo")
def seed_demo_data(db: Session = Depends(get_db)):
    demo_user = seed_demo_store(db)
    return {
        "message": "Demo store successfully seeded and verified.",
        "user_email": demo_user.email,
        "demo_password": "demo123456"
    }

