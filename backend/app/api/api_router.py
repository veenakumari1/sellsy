from fastapi import APIRouter
from app.api.routes import (
    auth, stores, sales, products, customers,
    forecasts, marketing, assistant, reports, integrations,
    notifications, gamification, realtime,
    agents, winback, inventory, content
)

api_router = APIRouter()

api_router.include_router(auth.router)
api_router.include_router(stores.router)
api_router.include_router(sales.router)
api_router.include_router(products.router)
api_router.include_router(customers.router)
api_router.include_router(forecasts.router)
api_router.include_router(marketing.router)
api_router.include_router(assistant.router)
api_router.include_router(reports.router)
api_router.include_router(integrations.router)
api_router.include_router(notifications.router)
api_router.include_router(gamification.router)
api_router.include_router(realtime.router)
api_router.include_router(agents.router)
api_router.include_router(winback.router)
api_router.include_router(inventory.router)
api_router.include_router(content.router)



