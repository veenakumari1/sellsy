import httpx
from datetime import datetime, timezone
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models import Store, StoreIntegration, Product, Order, Customer

class ShopifyService:
    @staticmethod
    async def verify_and_connect(
        db: Session,
        store_id: str,
        shop_domain: str,
        access_token: Optional[str] = None,
        api_key: Optional[str] = None
    ) -> Dict[str, Any]:
        clean_domain = shop_domain.strip().lower()
        if not clean_domain.endswith(".myshopify.com") and not "." in clean_domain:
            clean_domain = f"{clean_domain}.myshopify.com"

        # Check existing integration
        integration = db.query(StoreIntegration).filter(StoreIntegration.store_id == store_id).first()
        if not integration:
            integration = StoreIntegration(
                store_id=store_id,
                platform="shopify"
            )
            db.add(integration)

        integration.shop_domain = clean_domain
        integration.access_token = access_token or "shpat_mock_token_sellsy"
        integration.api_key = api_key or "shpca_mock_key"
        integration.status = "connected"
        integration.last_synced_at = datetime.now(timezone.utc)
        integration.metadata_json = {
            "connected_at": datetime.now(timezone.utc).isoformat(),
            "shop_domain": clean_domain,
            "version": "2024-04"
        }

        # Update store platform & domain
        store = db.query(Store).filter(Store.id == store_id).first()
        if store:
            store.platform = "shopify"
            store.domain = clean_domain

        db.commit()
        db.refresh(integration)

        return {
            "status": "connected",
            "shop_domain": clean_domain,
            "synced_at": integration.last_synced_at.isoformat()
        }

    @staticmethod
    def get_status(db: Session, store_id: str) -> Dict[str, Any]:
        integration = db.query(StoreIntegration).filter(StoreIntegration.store_id == store_id).first()
        store = db.query(Store).filter(Store.id == store_id).first()

        prods_count = db.query(Product).filter(Product.store_id == store_id).count()
        orders_count = db.query(Order).filter(Order.store_id == store_id).count()
        cust_count = db.query(Customer).filter(Customer.store_id == store_id).count()

        if not integration:
            return {
                "platform": store.platform if store else "shopify",
                "status": "connected" if store and store.platform == "shopify" else "disconnected",
                "shop_domain": store.domain if store else None,
                "last_synced_at": None,
                "products_count": prods_count,
                "orders_count": orders_count,
                "customers_count": cust_count
            }

        return {
            "platform": integration.platform,
            "status": integration.status,
            "shop_domain": integration.shop_domain,
            "last_synced_at": integration.last_synced_at,
            "products_count": prods_count,
            "orders_count": orders_count,
            "customers_count": cust_count
        }
