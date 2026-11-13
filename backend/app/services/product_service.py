from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, desc
from app.models import Product, ProductCategory, OrderItem, Order
from app.schemas import ProductOut, ProductDetailOut, CategoryOut

def _to_naive_utc(dt: datetime) -> datetime:
    if dt is None:
        return datetime.now(timezone.utc).replace(tzinfo=None)
    if dt.tzinfo is not None:
        return dt.astimezone(timezone.utc).replace(tzinfo=None)
    return dt

class ProductService:
    @staticmethod
    def _compute_product_stats(db: Session, store_id: str, product: Product) -> Dict[str, Any]:
        # Calculate total units and revenue
        items = db.query(OrderItem).join(Order, Order.id == OrderItem.order_id).filter(
            OrderItem.product_id == product.id,
            Order.store_id == store_id,
            Order.financial_status != "refunded"
        ).all()

        units_sold = sum(i.quantity for i in items)
        revenue = sum(i.quantity * i.price - i.total_discount for i in items)

        # Check velocity delta (last 30 days vs prior 30 days)
        now = datetime.now(timezone.utc).replace(tzinfo=None)
        thirty_days_ago = now - timedelta(days=30)
        sixty_days_ago = now - timedelta(days=60)

        recent_units = sum(
            i.quantity for i in items if i.order and _to_naive_utc(i.order.created_at) >= thirty_days_ago
        )
        prev_units = sum(
            i.quantity for i in items if i.order and sixty_days_ago <= _to_naive_utc(i.order.created_at) < thirty_days_ago
        )

        status = "stable"
        if prev_units > 5 and recent_units < prev_units * 0.65:
            status = "declining"
        elif recent_units >= 15 or revenue > 2000.0:
            status = "top_performer"
        elif product.cost_price > 0 and (product.price - product.cost_price) / product.price > 0.6 and units_sold < 15:
            status = "opportunity"

        return {
            "units_sold": units_sold,
            "revenue": round(revenue, 2),
            "status": status
        }

    @staticmethod
    def _compute_batch_product_stats(
        db: Session,
        store_id: str,
        products: List[Product]
    ) -> Dict[str, Dict[str, Any]]:
        if not products:
            return {}

        product_ids = [p.id for p in products]
        now = datetime.now(timezone.utc).replace(tzinfo=None)
        thirty_days_ago = now - timedelta(days=30)
        sixty_days_ago = now - timedelta(days=60)

        results = db.query(
            OrderItem.product_id,
            OrderItem.quantity,
            OrderItem.price,
            OrderItem.total_discount,
            Order.created_at
        ).join(Order, Order.id == OrderItem.order_id).filter(
            OrderItem.product_id.in_(product_ids),
            Order.store_id == store_id,
            Order.financial_status != "refunded"
        ).all()

        stats_map: Dict[str, Dict[str, Any]] = {
            pid: {"units": 0, "rev": 0.0, "recent": 0, "prev": 0}
            for pid in product_ids
        }

        for row in results:
            pid = row.product_id
            if pid not in stats_map:
                continue
            qty = row.quantity or 0
            price = row.price or 0.0
            discount = row.total_discount or 0.0
            order_dt = _to_naive_utc(row.created_at)

            s = stats_map[pid]
            s["units"] += qty
            s["rev"] += (qty * price - discount)
            if order_dt >= thirty_days_ago:
                s["recent"] += qty
            elif sixty_days_ago <= order_dt < thirty_days_ago:
                s["prev"] += qty

        final_stats: Dict[str, Dict[str, Any]] = {}
        for p in products:
            s = stats_map[p.id]
            units_sold = s["units"]
            revenue = s["rev"]
            recent_units = s["recent"]
            prev_units = s["prev"]

            status = "stable"
            if prev_units > 5 and recent_units < prev_units * 0.65:
                status = "declining"
            elif recent_units >= 15 or revenue > 2000.0:
                status = "top_performer"
            elif p.cost_price > 0 and (p.price - p.cost_price) / p.price > 0.6 and units_sold < 15:
                status = "opportunity"

            final_stats[p.id] = {
                "units_sold": units_sold,
                "revenue": round(revenue, 2),
                "status": status
            }

        return final_stats

    @staticmethod
    def get_products(
        db: Session,
        store_id: str,
        category_id: Optional[str] = None,
        search: Optional[str] = None,
        sort_by: str = "revenue",
        skip: int = 0,
        limit: int = 50
    ) -> List[ProductOut]:
        query = db.query(Product).options(joinedload(Product.category)).filter(Product.store_id == store_id)
        if category_id:
            query = query.filter(Product.category_id == category_id)
        if search:
            query = query.filter(Product.title.ilike(f"%{search}%") | Product.sku.ilike(f"%{search}%"))

        products = query.all()
        stats_by_product = ProductService._compute_batch_product_stats(db, store_id, products)

        out_list = []
        for p in products:
            stats = stats_by_product.get(p.id, {"units_sold": 0, "revenue": 0.0, "status": "stable"})
            cat_out = CategoryOut(id=p.category.id, name=p.category.name, slug=p.category.slug) if p.category else None
            out_list.append(ProductOut(
                id=p.id,
                store_id=p.store_id,
                title=p.title,
                price=p.price,
                cost_price=p.cost_price,
                sku=p.sku,
                inventory_quantity=p.inventory_quantity,
                status=p.status,
                category_id=p.category_id,
                description=p.description,
                image_url=p.image_url,
                category=cat_out,
                units_sold=stats["units_sold"],
                revenue_generated=stats["revenue"],
                velocity_status=stats["status"],
                created_at=p.created_at
            ))

        if sort_by == "revenue":
            out_list.sort(key=lambda x: x.revenue_generated, reverse=True)
        elif sort_by == "units":
            out_list.sort(key=lambda x: x.units_sold, reverse=True)
        elif sort_by == "price_desc":
            out_list.sort(key=lambda x: x.price, reverse=True)
        elif sort_by == "price_asc":
            out_list.sort(key=lambda x: x.price, reverse=False)

        return out_list[skip:skip + limit]

    @staticmethod
    def get_top_products(db: Session, store_id: str, limit: int = 5) -> List[ProductOut]:
        return ProductService.get_products(db, store_id, sort_by="revenue", limit=limit)

    @staticmethod
    def get_declining_products(db: Session, store_id: str) -> List[ProductOut]:
        all_prods = ProductService.get_products(db, store_id, limit=100)
        return [p for p in all_prods if p.velocity_status == "declining"]

    @staticmethod
    def get_product_detail(db: Session, store_id: str, product_id: str) -> Optional[ProductDetailOut]:
        product = db.query(Product).filter(Product.store_id == store_id, Product.id == product_id).first()
        if not product:
            return None

        stats = ProductService._compute_product_stats(db, store_id, product)
        cat_out = CategoryOut(id=product.category.id, name=product.category.name, slug=product.category.slug) if product.category else None

        # Calculate monthly sales for this product
        items = db.query(OrderItem).join(Order, Order.id == OrderItem.order_id).filter(
            OrderItem.product_id == product.id,
            Order.store_id == store_id
        ).order_by(Order.created_at.asc()).all()

        monthly_dict: Dict[str, Dict[str, Any]] = {}
        for item in items:
            month_key = item.order.created_at.strftime("%Y-%m")
            if month_key not in monthly_dict:
                monthly_dict[month_key] = {"month": month_key, "units": 0, "revenue": 0.0}
            monthly_dict[month_key]["units"] += item.quantity
            monthly_dict[month_key]["revenue"] += (item.quantity * item.price - item.total_discount)

        monthly_sales = [
            {"month": k, "units": v["units"], "revenue": round(v["revenue"], 2)}
            for k, v in sorted(monthly_dict.items())
        ]

        margin_pct = 0.0
        if product.price > 0 and product.cost_price > 0:
            margin_pct = round(((product.price - product.cost_price) / product.price) * 100, 1)

        return ProductDetailOut(
            id=product.id,
            store_id=product.store_id,
            title=product.title,
            price=product.price,
            cost_price=product.cost_price,
            sku=product.sku,
            inventory_quantity=product.inventory_quantity,
            status=product.status,
            category_id=product.category_id,
            description=product.description,
            image_url=product.image_url,
            category=cat_out,
            units_sold=stats["units_sold"],
            revenue_generated=stats["revenue"],
            velocity_status=stats["status"],
            margin_pct=margin_pct,
            monthly_sales=monthly_sales,
            created_at=product.created_at
        )
