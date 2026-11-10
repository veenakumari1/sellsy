from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import init_db, SessionLocal
from app.services.seed_service import seed_demo_store
from app.api.api_router import api_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. Initialize tables
    init_db()
    # 2. Automatically ensure demo store is seeded on startup
    with SessionLocal() as db:
        seed_demo_store(db)
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Sellsy: AI-Powered E-commerce Intelligence & Growth Platform API",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permits local Next.js and deployed Vercel apps
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount all API v1 endpoints
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "service": "Sellsy Intelligence Backend",
        "version": settings.VERSION
    }

@app.get("/", tags=["Root"])
def root():
    return {
        "message": "Welcome to Sellsy - AI-Powered E-commerce Intelligence Platform",
        "docs": "/docs",
        "health": "/health"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)

