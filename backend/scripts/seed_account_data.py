#!/usr/bin/env python3
"""
Seed Account Data Script for Storsy
Usage:
    python scripts/seed_account_data.py --email sarah@gmail.com [--reset] [--days 7] [--scale 1.0]

Fills an existing user's active store with a realistic, compact e-commerce dataset (PKR):
- 3 Categories
- 8 Products with realistic prices (Rs 800 - Rs 15,000), costs (55-75%), and low-stock items
- 12 Customers with Pakistani names and +92 03XX phone numbers
- ~30 Orders spread over the last 7 days (weighted towards weekends), with real line items and statuses
- Updated customer metrics (total_spent, orders_count, segment, order dates)
- 3-4 Notifications and small gamification progression (level 1-2, ~95 points, unlocked badges)

Works identically on SQLite locally and on PostgreSQL when DATABASE_URL points to Railway.
Idempotent: skips if the store already has products or orders, unless --reset is passed.
"""

import sys
import os
import argparse
import random
from pathlib import Path
from datetime import datetime, timedelta, timezone

# Ensure the backend directory is in sys.path so 'app' can be imported
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from sqlalchemy.orm import Session
from app.core.database import SessionLocal, engine, database_url, Base
from app.models import (
    User, Store, ProductCategory, Product, Customer, Order, OrderItem,
    AiInsight, Notification, UserGamification, AchievementDefinition,
    UserAchievement, GamificationActivity, AgentRun
)
from app.services.gamification_service import GamificationService

def parse_args():
    parser = argparse.ArgumentParser(description="Seed realistic compact sample data into an existing Storsy account.")
    parser.add_argument("--email", required=True, help="Email address of the target user (e.g. sarah@gmail.com)")
    parser.add_argument("--reset", action="store_true", help="Delete existing data for this store before seeding")
    parser.add_argument("--days", type=int, default=7, help="Number of historical days for orders (default: 7)")
    parser.add_argument("--scale", type=float, default=1.0, help="Scale multiplier for data volume (default: 1.0)")
    return parser.parse_args()

# 3 Categories
CATEGORIES_DATA = [
    {"name": "Apparel & Textiles", "slug": "apparel-textiles"},
    {"name": "Home & Living", "slug": "home-living"},
    {"name": "Leather & Accessories", "slug": "leather-accessories"},
]

# 8 Products: price Rs 800 to Rs 15,000, cost 55-75% of price, couple with low stock
PRODUCTS_DATA = [
    # Apparel & Textiles
    {
        "cat": "Apparel & Textiles",
        "title": "Embroidered Lawn Kurta",
        "price": 4500.0,
        "cost": 2700.0, # 60%
        "sku": "APP-KUR-001",
        "qty": 24,
        "desc": "Hand-embroidered breathable summer lawn kurta with delicate needlework along the neckline."
    },
    {
        "cat": "Apparel & Textiles",
        "title": "Handwoven Cotton Shawl",
        "price": 6800.0,
        "cost": 4200.0, # 61.8%
        "sku": "APP-SHW-002",
        "qty": 4, # Low stock
        "desc": "Traditional hand-spun soft cotton wrap finished with organic fringe tassels."
    },

    # Home & Living
    {
        "cat": "Home & Living",
        "title": "Block-Printed Cushion Cover",
        "price": 1450.0,
        "cost": 870.0, # 60%
        "sku": "HOM-CSH-001",
        "qty": 35,
        "desc": "Artisanal wooden block-printed 18x18 inch cotton cushion cover in indigo motifs."
    },
    {
        "cat": "Home & Living",
        "title": "Brass Tabletop Planter",
        "price": 3900.0,
        "cost": 2450.0, # 62.8%
        "sku": "HOM-PLN-002",
        "qty": 0, # Out of stock
        "reorder_level": 10,
        "desc": "Hand-hammered warm brass planter with protective clear coat and indoor drainage plate."
    },
    {
        "cat": "Home & Living",
        "title": "Handmade Ceramic Chai Cups (Set of 4)",
        "price": 2800.0,
        "cost": 1680.0, # 60%
        "sku": "HOM-CUP-003",
        "qty": 18,
        "desc": "Artisan terracotta and stoneware glazed tea cups fired with earthy reactive mineral glazes."
    },

    # Leather & Accessories
    {
        "cat": "Leather & Accessories",
        "title": "Full-Grain Leather Wallet",
        "price": 3200.0,
        "cost": 1950.0, # 60.9%
        "sku": "LEA-WLT-001",
        "qty": 30,
        "desc": "Vegetable-tanned cowhide bifold wallet with 8 card slots and currency divider."
    },
    {
        "cat": "Leather & Accessories",
        "title": "Executive Leather Messenger Bag",
        "price": 14500.0,
        "cost": 9200.0, # 63.4%
        "sku": "LEA-BAG-002",
        "qty": 5, # Low stock
        "reorder_level": 10,
        "desc": "Handcrafted premium buffalo leather 15-inch laptop briefcase with antique brass hardware."
    },
    {
        "cat": "Leather & Accessories",
        "title": "Handcrafted Jute Cardholder",
        "price": 950.0,
        "cost": 550.0, # 57.9%
        "sku": "LEA-CRD-003",
        "qty": 40,
        "desc": "Minimalist pocket card sleeve crafted from natural treated jute with leather trim."
    },
]

# 12 Pakistani Customers with +92 03XX mobile numbers
CUSTOMERS_DATA = [
    ("Tariq", "Mehmood", "tariq.mehmood@gmail.com", "+92 300 8472910"),
    ("Ayesha", "Khan", "ayesha.khan@outlook.com", "+92 321 4567891"),
    ("Bilal", "Ahmed", "bilal.ahmed@yahoo.com", "+92 333 5129843"),
    ("Fatima", "Zahra", "fatima.zahra@gmail.com", "+92 345 6789012"),
    ("Usman", "Ali", "usman.ali@gmail.com", "+92 301 2345678"),
    ("Sana", "Malik", "sana.malik@outlook.com", "+92 322 8765432"),
    ("Hamza", "Siddiqui", "hamza.siddiqui@gmail.com", "+92 334 9876543"),
    ("Zainab", "Bibi", "zainab.bibi@yahoo.com", "+92 312 3456789"),
    ("Omer", "Farooq", "omer.farooq@gmail.com", "+92 302 4567890"),
    ("Mariam", "Javed", "mariam.javed@gmail.com", "+92 323 5678901"),
    ("Hassan", "Raza", "hassan.raza@outlook.com", "+92 335 6789012"),
    ("Hina", "Qureshi", "hina.qureshi@gmail.com", "+92 346 7890123"),
]

def seed_store_data(
    db: Session,
    user: User,
    store: Store,
    days: int = 7,
    scale: float = 1.0,
    reset: bool = False
) -> dict:
    """
    Core seeding function that fills `store` (owned by `user`) with a 1-week
    realistic PKR dataset: 3 categories, 8 products, 12 customers, ~30 orders,
    AI insights, notifications, and gamification.

    Safe & Idempotent: Does nothing if the store already has data, unless `reset=True`.
    """
    days = max(1, days)
    scale = max(0.1, scale)

    # 1. Check Idempotency / Existing Data
    existing_products = db.query(Product).filter(Product.store_id == store.id).count()
    existing_orders = db.query(Order).filter(Order.store_id == store.id).count()
    existing_customers = db.query(Customer).filter(Customer.store_id == store.id).count()

    if existing_products > 0 or existing_orders > 0 or existing_customers > 0:
        if not reset:
            return {
                "success": False,
                "status": "already_has_data",
                "message": f"Store '{store.name}' already contains data ({existing_products} products, {existing_customers} customers, {existing_orders} orders). Seeding was skipped.",
                "categories": db.query(ProductCategory).filter(ProductCategory.store_id == store.id).count(),
                "products": existing_products,
                "customers": existing_customers,
                "orders": existing_orders,
            }
        else:
            # Wipe existing store records for CLI reset
            db.query(OrderItem).filter(OrderItem.order_id.in_(
                db.query(Order.id).filter(Order.store_id == store.id)
            )).delete(synchronize_session=False)
            db.query(Order).filter(Order.store_id == store.id).delete(synchronize_session=False)
            db.query(Product).filter(Product.store_id == store.id).delete(synchronize_session=False)
            db.query(ProductCategory).filter(ProductCategory.store_id == store.id).delete(synchronize_session=False)
            db.query(Customer).filter(Customer.store_id == store.id).delete(synchronize_session=False)
            db.query(AiInsight).filter(AiInsight.store_id == store.id).delete(synchronize_session=False)
            db.query(Notification).filter(Notification.user_id == user.id).delete(synchronize_session=False)
            db.query(GamificationActivity).filter(GamificationActivity.user_id == user.id).delete(synchronize_session=False)
            db.query(UserAchievement).filter(UserAchievement.user_id == user.id).delete(synchronize_session=False)
            db.query(UserGamification).filter(UserGamification.user_id == user.id).delete(synchronize_session=False)
            db.commit()

    # 2. Ensure Store Currency is PKR
    store.currency = "PKR"
    db.flush()

    # 3. Create Categories (3)
    cat_map = {}
    for cat_info in CATEGORIES_DATA:
        cat = ProductCategory(
            store_id=store.id,
            name=cat_info["name"],
            slug=cat_info["slug"]
        )
        db.add(cat)
        db.flush()
        cat_map[cat_info["name"]] = cat.id

    # 4. Create Products (8)
    product_objs = []
    for p_info in PRODUCTS_DATA:
        prod = Product(
            store_id=store.id,
            category_id=cat_map.get(p_info["cat"]),
            title=p_info["title"],
            description=p_info["desc"],
            price=p_info["price"],
            cost_price=p_info["cost"],
            sku=p_info["sku"],
            inventory_quantity=p_info["qty"],
            reorder_level=p_info.get("reorder_level", 10),
            status="active"
        )
        db.add(prod)
        product_objs.append(prod)
    db.flush()

    # 5. Create Customers (12)
    customer_objs = []
    for fn, ln, email, phone in CUSTOMERS_DATA:
        cust = Customer(
            store_id=store.id,
            first_name=fn,
            last_name=ln,
            email=email,
            phone=phone,
            whatsapp=phone,
            total_spent=0.0,
            orders_count=0,
            segment="new"
        )
        db.add(cust)
        customer_objs.append(cust)
    db.flush()

    # 6. Create Orders spread over the last `days` (default 7 days)
    target_total_orders = max(5, int(round(30 * (days / 7.0) * scale)))
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    start_date = now - timedelta(days=days - 1)

    order_dates = []
    day_weights = []
    for day_offset in range(days):
        current_day = start_date + timedelta(days=day_offset)
        weekday = current_day.weekday()
        weight = 1.6 if weekday in (5, 6) else 1.0
        day_weights.append((day_offset, weight))

    total_weight = sum(w for _, w in day_weights)
    for day_offset, weight in day_weights:
        day_orders_count = int(round((weight / total_weight) * target_total_orders))
        for _ in range(day_orders_count):
            order_time = start_date + timedelta(
                days=day_offset,
                hours=random.randint(9, 22),
                minutes=random.randint(0, 59),
                seconds=random.randint(0, 59)
            )
            if order_time <= now:
                order_dates.append(order_time)

    if not order_dates:
        order_dates = [now - timedelta(hours=i * 4) for i in range(target_total_orders)]
    order_dates.sort()
    actual_order_count = len(order_dates)

    cust_order_targets = {}
    for idx, cust in enumerate(customer_objs):
        if idx < 2:
            cust_order_targets[cust.id] = random.randint(4, 5)
        elif idx < 6:
            cust_order_targets[cust.id] = random.randint(2, 3)
        elif idx < 11:
            cust_order_targets[cust.id] = 1
        else:
            cust_order_targets[cust.id] = 0

    cust_pool = []
    for cust_id, target in cust_order_targets.items():
        cust_pool.extend([cust_id] * target)

    while len(cust_pool) < actual_order_count:
        cust_pool.append(random.choice(customer_objs[:6]).id)
    if len(cust_pool) > actual_order_count:
        cust_pool = cust_pool[:actual_order_count]
    random.shuffle(cust_pool)

    customer_order_records = {c.id: [] for c in customer_objs}

    for idx, order_time in enumerate(order_dates):
        order_num = f"#{1001 + idx}"
        chosen_cust_id = cust_pool[idx]

        roll = random.random()
        if roll < 0.88:
            fin_status = "paid"
            ful_status = "fulfilled"
        elif roll < 0.95:
            fin_status = "pending"
            ful_status = "unfulfilled"
        else:
            fin_status = "refunded"
            ful_status = "fulfilled"

        num_items = random.choices([1, 2], weights=[0.75, 0.25])[0]
        selected_prods = random.sample(product_objs, min(num_items, len(product_objs)))

        subtotal = 0.0
        order_items_to_add = []
        for p in selected_prods:
            qty = random.choices([1, 2], weights=[0.85, 0.15])[0]
            item_price = p.price
            subtotal += (item_price * qty)
            order_items_to_add.append({
                "product_id": p.id,
                "quantity": qty,
                "price": item_price
            })

        subtotal = round(subtotal, 2)
        tax = round(subtotal * 0.05, 2)
        total = round(subtotal + tax, 2)

        order = Order(
            store_id=store.id,
            customer_id=chosen_cust_id,
            order_number=order_num,
            total_price=total,
            subtotal_price=subtotal,
            total_tax=tax,
            total_discounts=0.0,
            financial_status=fin_status,
            fulfillment_status=ful_status,
            currency="PKR",
            created_at=order_time
        )
        db.add(order)
        db.flush()

        for it in order_items_to_add:
            db.add(OrderItem(
                order_id=order.id,
                product_id=it["product_id"],
                quantity=it["quantity"],
                price=it["price"],
                total_discount=0.0
            ))

        customer_order_records[chosen_cust_id].append((order_time, total, fin_status))

    # 7. Update Customer aggregates and segments
    for cust in customer_objs:
        orders = customer_order_records[cust.id]
        valid_orders = [o for o in orders if o[2] != "refunded"]

        cust.orders_count = len(orders)
        cust.total_spent = round(sum(o[1] for o in valid_orders), 2)

        if orders:
            cust.first_order_at = min(o[0] for o in orders)
            cust.last_order_at = max(o[0] for o in orders)

            if cust.total_spent >= 20000.0 or cust.orders_count >= 4:
                cust.segment = "high_value"
            elif cust.orders_count >= 2:
                cust.segment = "returning"
            else:
                cust.segment = "new"
        else:
            cust.segment = "inactive"

    # Ensure realistic at-risk cohorts for Win-Back feature
    if len(customer_objs) >= 3:
        # Customer 0: inactive 95 days (High Risk)
        c0 = customer_objs[0]
        c0.orders_count = max(c0.orders_count, 3)
        c0.total_spent = max(c0.total_spent, 18500.0)
        c0.last_order_at = now - timedelta(days=95)
        c0.first_order_at = now - timedelta(days=130)
        c0.segment = "at_risk"

        # Customer 1: inactive 65 days (Medium/High Risk)
        c1 = customer_objs[1]
        c1.orders_count = max(c1.orders_count, 2)
        c1.total_spent = max(c1.total_spent, 9800.0)
        c1.last_order_at = now - timedelta(days=65)
        c1.first_order_at = now - timedelta(days=85)
        c1.segment = "at_risk"

        # Customer 2: inactive 38 days (Medium/Low Risk)
        c2 = customer_objs[2]
        c2.orders_count = max(c2.orders_count, 1)
        c2.total_spent = max(c2.total_spent, 4500.0)
        c2.last_order_at = now - timedelta(days=38)
        c2.first_order_at = now - timedelta(days=38)
        c2.segment = "at_risk"

    # 8. Create AI Insights (PKR)
    insights_data = [
        {
            "category": "sales",
            "title": "Weekend Revenue Lift on Handwoven Apparel",
            "observation": "Saturday & Sunday checkout baskets average Rs 8,500, outperforming weekday averages by +18%.",
            "impact": "Opportunity for +Rs 45,000 weekly incremental revenue via weekend bundles.",
            "rec": "Offer a weekend styling combo of Handwoven Cotton Shawl with Block-Printed Cushions.",
            "confidence": 0.92
        },
        {
            "category": "products",
            "title": "Low Stock Alert: Handwoven Cotton Shawl",
            "observation": "Handwoven Cotton Shawl inventory has dropped to 4 units with steady demand.",
            "impact": "Risk of stockout within 4-5 days.",
            "rec": "Reorder 20 units from artisan supplier to prevent revenue loss.",
            "confidence": 0.95
        },
        {
            "category": "customers",
            "title": "Repeat Buyer Momentum",
            "observation": "Returning shoppers have generated 48% of total revenue in the last 7 days.",
            "impact": "High customer retention rate despite early store lifecycle.",
            "rec": "Send thank-you discount codes for next purchase to first-time buyers.",
            "confidence": 0.88
        },
        {
            "category": "marketing",
            "title": "Leather Goods Cross-Sell Opportunity",
            "observation": "Customers purchasing Kurta show high affinity for Full-Grain Leather Wallet.",
            "impact": "Could increase average order value by +25%.",
            "rec": "Show leather accessories as recommended add-ons on the checkout page.",
            "confidence": 0.90
        }
    ]
    for ins in insights_data:
        db.add(AiInsight(
            store_id=store.id,
            category=ins["category"],
            title=ins["title"],
            observation=ins["observation"],
            impact=ins["impact"],
            actionable_recommendation=ins["rec"],
            confidence_score=ins["confidence"],
            created_at=now - timedelta(days=1)
        ))

    # 9. Create Notifications (4 notifications)
    notifs_data = [
        ("order", "New Order #1028 Received", "Ayesha Khan placed an order for Embroidered Lawn Kurta (Rs 4,725).", "/sales", False, 2),
        ("inventory_alert", "Low Stock Alert: Cotton Shawl", "Handwoven Cotton Shawl is down to 4 units in stock.", "/products", False, 5),
        ("ai_insight", "AI Sales Tip Available", "Weekend sales surge identified. Check your sales forecast and recommendations.", "/marketing", False, 14),
        ("gamification", "Achievement Unlocked: First Sale", "Congratulations on recording your initial store transactions (+50 Points!).", "/rewards", True, 36),
    ]
    for cat, title, msg, link, is_read, hours_ago in notifs_data:
        db.add(Notification(
            user_id=user.id,
            store_id=store.id,
            category=cat,
            title=title,
            message=msg,
            link=link,
            is_read=is_read,
            created_at=now - timedelta(hours=hours_ago)
        ))

    # 10. Gamification Data
    GamificationService.ensure_definitions(db)

    ug = db.query(UserGamification).filter(UserGamification.user_id == user.id).first()
    if not ug:
        ug = UserGamification(
            user_id=user.id,
            store_id=store.id,
            total_points=95,
            level=1,
            rank_title="Rising Merchant",
            streak_days=3,
            last_active_at=now
        )
        db.add(ug)
    else:
        ug.total_points = 95
        ug.level = 1
        ug.rank_title = "Rising Merchant"
        ug.streak_days = 3
        ug.last_active_at = now
    db.flush()

    achievements_to_unlock = ["store_starter", "first_sale"]
    for key in achievements_to_unlock:
        ad = db.query(AchievementDefinition).filter(AchievementDefinition.key == key).first()
        if ad:
            ua = db.query(UserAchievement).filter(
                UserAchievement.user_id == user.id,
                UserAchievement.achievement_id == ad.id
            ).first()
            if not ua:
                ua = UserAchievement(
                    user_id=user.id,
                    achievement_id=ad.id,
                    is_unlocked=True,
                    current_progress=ad.target_progress,
                    unlocked_at=now - timedelta(days=2)
                )
                db.add(ua)
            else:
                ua.is_unlocked = True
                ua.current_progress = ad.target_progress

    activities_data = [
        ("store_registered", 50, "Connected storefront to Storsy intelligence engine", 6),
        ("first_sale", 25, "Recorded first customer transaction", 4),
        ("daily_review", 20, "Checked store analytics dashboard", 1)
    ]
    for act_type, pts, desc, days_ago in activities_data:
        db.add(GamificationActivity(
            user_id=user.id,
            activity_type=act_type,
            points_earned=pts,
            description=desc,
            created_at=now - timedelta(days=days_ago)
        ))

    # 10. Seed Initial Multi-Agent AI Team Run
    existing_agent_run = db.query(AgentRun).filter(AgentRun.store_id == store.id).first()
    if not existing_agent_run:
        from app.services.agents_team_service import AgentsTeamService
        AgentsTeamService.execute_full_run(db, store)

    db.commit()

    final_categories = len(cat_map)
    final_products = len(product_objs)
    final_customers = len(customer_objs)
    final_orders = actual_order_count

    return {
        "success": True,
        "status": "seeded",
        "message": f"Sample data loaded successfully! {final_products} products, {final_customers} customers, and {final_orders} orders created.",
        "categories": final_categories,
        "products": final_products,
        "customers": final_customers,
        "orders": final_orders,
        "notifications": len(notifs_data),
    }

def seed():
    args = parse_args()
    target_email = args.email.strip().lower()
    days = max(1, args.days)
    scale = max(0.1, args.scale)

    masked_url = database_url.split('@')[-1] if '@' in database_url else database_url
    print(f"Connecting to database: {masked_url}")

    try:
        Base.metadata.create_all(bind=engine)
    except Exception as e:
        print(f"Notice: Table inspection/creation: {e}")

    with SessionLocal() as db:
        user = db.query(User).filter(User.email == target_email).first()
        if not user:
            print(f"Error: User with email '{target_email}' not found in database.")
            print("Please ensure the user exists before running this seed script.")
            sys.exit(1)

        store = db.query(Store).filter(Store.user_id == user.id).first()
        if not store:
            store = Store(
                user_id=user.id,
                name=f"{user.full_name or 'Sarah'}'s Store",
                currency="PKR",
                platform="manual"
            )
            db.add(store)
            db.commit()
            db.refresh(store)
            print(f"Created active store '{store.name}' (ID: {store.id}) for user '{user.email}'.")
        else:
            print(f"Found active store '{store.name}' (ID: {store.id}) for user '{user.email}'.")

        result = seed_store_data(
            db=db,
            user=user,
            store=store,
            days=days,
            scale=scale,
            reset=args.reset
        )

        if not result["success"]:
            print(result["message"])
            return

        print("\n=======================================================")
        print(f" SUCCESS: Store '{store.name}' seeded successfully!")
        print(f" - Account:        {user.email} (ID: {user.id})")
        print(f" - Active Store:   {store.name} (ID: {store.id})")
        print(f" - Categories:     {result['categories']}")
        print(f" - Products:       {result['products']}")
        print(f" - Customers:      {result['customers']}")
        print(f" - Orders:         {result['orders']} (over last {days} days)")
        print(f" - Notifications:  {result['notifications']}")
        print(f" - Gamification:   Level 1 (95 Points, 2 Achievements Unlocked)")
        print("=======================================================\n")

if __name__ == "__main__":
    seed()
