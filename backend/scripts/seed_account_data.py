#!/usr/bin/env python3
"""
Seed Account Data Script for Sellsy
Usage:
    python scripts/seed_account_data.py --email sarah@gmail.com [--reset]

Fills an existing user's active store with realistic e-commerce sample data:
- 6 Categories
- 25 Products with realistic prices, costs, SKUs, and low-stock items
- 40 Customers with realistic contact info and calculated segments
- 200 Orders spread across the last 90 days with line items, tax, and realistic statuses
- AI Insights for marketing, sales, products, and customers
- Notifications and Gamification data (points, level, achievements, activities)

Works identically on SQLite locally and on PostgreSQL when DATABASE_URL is set to Railway.
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

from app.core.database import SessionLocal, engine, database_url
from app.models import (
    User, Store, ProductCategory, Product, Customer, Order, OrderItem,
    AiInsight, Notification, UserGamification, AchievementDefinition,
    UserAchievement, GamificationActivity
)
from app.services.gamification_service import GamificationService

def parse_args():
    parser = argparse.ArgumentParser(description="Seed realistic sample data into an existing Sellsy account.")
    parser.add_argument("--email", required=True, help="Email address of the target user (e.g. sarah@gmail.com)")
    parser.add_argument("--reset", action="store_true", help="Delete existing data for this store before seeding")
    return parser.parse_args()

CATEGORIES_DATA = [
    {"name": "Ceramics & Pottery", "slug": "ceramics-pottery"},
    {"name": "Home Fragrance & Candles", "slug": "home-fragrance-candles"},
    {"name": "Linens & Bedding", "slug": "linens-bedding"},
    {"name": "Kitchen & Tableware", "slug": "kitchen-tableware"},
    {"name": "Lighting & Lamps", "slug": "lighting-lamps"},
    {"name": "Decorative Accents", "slug": "decorative-accents"},
]

PRODUCTS_DATA = [
    # Ceramics & Pottery
    {"cat": "Ceramics & Pottery", "title": "Minimalist Matte White Vase", "price": 6500.0, "cost": 4200.0, "sku": "CER-VAS-001", "qty": 18, "desc": "Hand-turned stoneware vase with a tactile matte chalk glaze."},
    {"cat": "Ceramics & Pottery", "title": "Handcrafted Terracotta Planter", "price": 3800.0, "cost": 2400.0, "sku": "CER-PLT-002", "qty": 4, "desc": "Unglazed organic terracotta planter with natural drainage saucer."}, # Low stock
    {"cat": "Ceramics & Pottery", "title": "Speckled Ceramic Mug Set of 4", "price": 4200.0, "cost": 2600.0, "sku": "CER-MUG-003", "qty": 35, "desc": "Artisanal stoneware coffee mugs fired with natural iron speckles."},
    {"cat": "Ceramics & Pottery", "title": "Ribbed Stoneware Pitcher", "price": 5400.0, "cost": 3400.0, "sku": "CER-PIT-004", "qty": 14, "desc": "Sculptural water and beverage pitcher with ergonomic curved handle."},
    {"cat": "Ceramics & Pottery", "title": "Organic Glazed Serving Platter", "price": 7800.0, "cost": 4900.0, "sku": "CER-PLT-005", "qty": 22, "desc": "Wide-rimmed center table platter finished in reactive sage glaze."},

    # Home Fragrance & Candles
    {"cat": "Home Fragrance & Candles", "title": "Amber & Smoked Cedar Soy Candle", "price": 2800.0, "cost": 1700.0, "sku": "CAN-AMB-001", "qty": 42, "desc": "100% soy wax candle hand-poured in reusable amber apothecary glass."},
    {"cat": "Home Fragrance & Candles", "title": "Wild Bergamot Reed Diffuser", "price": 3600.0, "cost": 2200.0, "sku": "CAN-DIF-002", "qty": 5, "desc": "Slow-evaporating botanical fragrance blend with natural rattan reeds."}, # Low stock
    {"cat": "Home Fragrance & Candles", "title": "Palo Santo & Sage Room Spray", "price": 1950.0, "cost": 1200.0, "sku": "CAN-SPR-003", "qty": 30, "desc": "Aromatherapeutic mist infused with organic essential oils and floral water."},
    {"cat": "Home Fragrance & Candles", "title": "Hinoki Wood Sculptural Candle", "price": 3200.0, "cost": 2000.0, "sku": "CAN-HIN-004", "qty": 25, "desc": "Geometric cast wax candle scented with calming Japanese cypress."},

    # Linens & Bedding
    {"cat": "Linens & Bedding", "title": "Washed Belgian Linen Duvet Cover", "price": 22500.0, "cost": 14500.0, "sku": "LIN-DUV-001", "qty": 12, "desc": "Pre-washed breathable flax linen duvet cover with natural mother-of-pearl buttons."},
    {"cat": "Linens & Bedding", "title": "French Flax Linen Pillowcase Pair", "price": 5500.0, "cost": 3500.0, "sku": "LIN-PIL-002", "qty": 38, "desc": "Pair of envelope-closure standard pillowcases made from European flax."},
    {"cat": "Linens & Bedding", "title": "Waffle Weave Cotton Throw Blanket", "price": 8900.0, "cost": 5600.0, "sku": "LIN-BLN-003", "qty": 20, "desc": "Heavyweight breathable organic cotton throw in earthy warm oatmeal."},
    {"cat": "Linens & Bedding", "title": "Raw Hem Linen Table Runner", "price": 3900.0, "cost": 2400.0, "sku": "LIN-TAB-004", "qty": 16, "desc": "Relaxed fringed border dining table runner washed for antique softness."},

    # Kitchen & Tableware
    {"cat": "Kitchen & Tableware", "title": "Matte Black Cutlery 20-Piece Set", "price": 14500.0, "cost": 9200.0, "sku": "KIT-CUT-001", "qty": 15, "desc": "Forged 18/10 stainless steel flatware service for four with PVD titanium finish."},
    {"cat": "Kitchen & Tableware", "title": "Olive Wood Cutting & Charcuterie Board", "price": 5800.0, "cost": 3600.0, "sku": "KIT-BRD-002", "qty": 6, "desc": "Sustainably harvested Mediterranean olive wood board with live bark edge."}, # Low stock
    {"cat": "Kitchen & Tableware", "title": "Fluted Coupe Cocktail Glasses Set of 4", "price": 4900.0, "cost": 3100.0, "sku": "KIT-GLS-003", "qty": 28, "desc": "Lead-free crystal coupe glasses featuring delicate vertical optic ridges."},
    {"cat": "Kitchen & Tableware", "title": "Japanese Chef Santoku Knife", "price": 16500.0, "cost": 10500.0, "sku": "KIT-KNF-004", "qty": 11, "desc": "VG-10 core Damascus steel 7-inch multipurpose culinary chef knife."},

    # Lighting & Lamps
    {"cat": "Lighting & Lamps", "title": "Brushed Brass Table Lamp", "price": 18500.0, "cost": 11800.0, "sku": "LIT-TAB-001", "qty": 8, "desc": "Weighted solid brass desk lamp with adjustable cantilever arm and dimmer dial."},
    {"cat": "Lighting & Lamps", "title": "Ribbed Opal Glass Pendant Light", "price": 19500.0, "cost": 12400.0, "sku": "LIT-PEN-002", "qty": 7, "desc": "Hand-blown matte opal glass sphere pendant with braided fabric cord."}, # Low stock
    {"cat": "Lighting & Lamps", "title": "Sculptural Travertine Sconce", "price": 15800.0, "cost": 10200.0, "sku": "LIT-SCN-003", "qty": 10, "desc": "Natural honed Italian travertine wall light casting indirect ambient glow."},
    {"cat": "Lighting & Lamps", "title": "Rechargeable Cordless Lantern", "price": 8500.0, "cost": 5300.0, "sku": "LIT-LAN-004", "qty": 24, "desc": "Portable IP54 rated indoor/outdoor LED lantern with touch stepless dimming."},

    # Decorative Accents
    {"cat": "Decorative Accents", "title": "Travertine Geometric Bookends", "price": 7900.0, "cost": 5000.0, "sku": "DEC-BOK-001", "qty": 14, "desc": "Solid architectural stone bookends cut from unfilled natural travertine."},
    {"cat": "Decorative Accents", "title": "Hand-Woven Jute Storage Basket", "price": 3800.0, "cost": 2400.0, "sku": "DEC-BSK-002", "qty": 32, "desc": "Sturdy braided golden jute floor basket with integrated carrying handles."},
    {"cat": "Decorative Accents", "title": "Fluted Brass Pillar Candlestick", "price": 2900.0, "cost": 1800.0, "sku": "DEC-CDL-003", "qty": 26, "desc": "Heavy turned unlacquered brass candlestick designed to age with rich patina."},
    {"cat": "Decorative Accents", "title": "Curved Walnut Wall Mirror", "price": 24500.0, "cost": 15500.0, "sku": "DEC-MIR-004", "qty": 9, "desc": "Solid American black walnut statement mirror with soft rounded pill silhouette."},
]

CUSTOMERS_DATA = [
    ("Marcus", "Vance", "marcus.vance@gmail.com", "+1 (555) 234-8901"),
    ("Emily", "Chen", "emily.chen@outlook.com", "+1 (555) 890-1234"),
    ("David", "Kowalski", "d.kowalski@yahoo.com", "+1 (555) 456-7890"),
    ("Sophia", "Martinez", "sophia.mtz@gmail.com", "+1 (555) 345-6789"),
    ("Oliver", "Wright", "oliver.wright@icloud.com", "+1 (555) 678-9012"),
    ("Hannah", "Abbott", "hannah.abbott@gmail.com", "+1 (555) 789-0123"),
    ("Lucas", "Bennett", "lbennett@enterprise.com", "+1 (555) 901-2345"),
    ("Aria", "Patel", "aria.patel@designhub.io", "+1 (555) 012-3456"),
    ("Ethan", "Sullivan", "ethan.sullivan@gmail.com", "+1 (555) 123-4567"),
    ("Chloe", "Morrison", "chloe.m@coastal.com", "+1 (555) 234-5678"),
    ("Alexander", "Hayes", "alex.hayes@gmail.com", "+1 (555) 345-6780"),
    ("Mia", "Torres", "mia.torres@gmail.com", "+1 (555) 456-7891"),
    ("James", "Sterling", "james.sterling@outlook.com", "+1 (555) 567-8902"),
    ("Isabella", "Rossi", "isabella.rossi@studio.it", "+1 (555) 678-9013"),
    ("Benjamin", "Foster", "ben.foster@gmail.com", "+1 (555) 789-0124"),
    ("Charlotte", "Kim", "charlotte.kim@gmail.com", "+1 (555) 890-1235"),
    ("Daniel", "Nielsen", "daniel.nielsen@nordic.com", "+1 (555) 901-2346"),
    ("Amelia", "Brooks", "amelia.brooks@gmail.com", "+1 (555) 012-3457"),
    ("Henry", "Sinclair", "henry.sinclair@gmail.com", "+1 (555) 123-4568"),
    ("Evelyn", "Ward", "evelyn.ward@gmail.com", "+1 (555) 234-5679"),
    ("Sebastian", "Cole", "sebastian.cole@gmail.com", "+1 (555) 345-6781"),
    ("Harper", "Diaz", "harper.diaz@yahoo.com", "+1 (555) 456-7892"),
    ("Jack", "Calloway", "jack.calloway@gmail.com", "+1 (555) 567-8903"),
    ("Ella", "Monroe", "ella.monroe@gmail.com", "+1 (555) 678-9014"),
    ("Liam", "Fitzgerald", "liam.fitz@gmail.com", "+1 (555) 789-0125"),
    ("Grace", "O'Connor", "grace.oc@gmail.com", "+1 (555) 890-1236"),
    ("Samuel", "Rhodes", "samuel.rhodes@gmail.com", "+1 (555) 901-2347"),
    ("Victoria", "Vargas", "victoria.vargas@gmail.com", "+1 (555) 012-3458"),
    ("Owen", "Mercer", "owen.mercer@gmail.com", "+1 (555) 123-4569"),
    ("Penelope", "Dunn", "penelope.dunn@gmail.com", "+1 (555) 234-5670"),
    ("Caleb", "Holloway", "caleb.h@gmail.com", "+1 (555) 345-6782"),
    ("Layla", "Santos", "layla.santos@gmail.com", "+1 (555) 456-7893"),
    ("Noah", "Castillo", "noah.castillo@gmail.com", "+1 (555) 567-8904"),
    ("Zoe", "Kaufman", "zoe.kaufman@gmail.com", "+1 (555) 678-9015"),
    ("Leo", "Reyes", "leo.reyes@gmail.com", "+1 (555) 789-0126"),
    ("Stella", "Garner", "stella.garner@gmail.com", "+1 (555) 890-1237"),
    ("Julian", "Perez", "julian.perez@gmail.com", "+1 (555) 901-2348"),
    ("Audrey", "Vaughn", "audrey.vaughn@gmail.com", "+1 (555) 012-3459"),
    ("Theodore", "Lang", "theo.lang@gmail.com", "+1 (555) 123-4560"),
    ("Scarlett", "Frost", "scarlett.frost@gmail.com", "+1 (555) 234-5671"),
]

def seed():
    args = parse_args()
    target_email = args.email.strip().lower()

    print(f"Connecting to database: {database_url.split('@')[-1] if '@' in database_url else database_url}")
    
    with SessionLocal() as db:
        # 1. Locate User
        user = db.query(User).filter(User.email == target_email).first()
        if not user:
            print(f"Error: User with email '{target_email}' not found in database.")
            print("Please ensure the user exists before running this seed script.")
            sys.exit(1)

        # 2. Locate Active Store
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
            store.currency = "PKR"
            db.flush()
            print(f"Found active store '{store.name}' (ID: {store.id}) for user '{user.email}'.")

        # 3. Check Idempotency
        existing_products = db.query(Product).filter(Product.store_id == store.id).count()
        existing_orders = db.query(Order).filter(Order.store_id == store.id).count()

        if existing_products > 0 or existing_orders > 0:
            if not args.reset:
                print(f"Store '{store.name}' already contains {existing_products} products and {existing_orders} orders.")
                print("Skipping seed to preserve existing data. Pass '--reset' to wipe and re-seed this store.")
                return
            else:
                print(f"--reset flag supplied. Cleaning existing store data for '{store.name}'...")
                # Order matters due to foreign keys
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
                print("Existing store data cleared.")

        # 4. Create Categories
        print("Seeding 6 product categories...")
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

        # 5. Create Products
        print("Seeding 25 products with realistic SKUs, prices and inventory...")
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
                status="active"
            )
            db.add(prod)
            product_objs.append(prod)
        db.flush()

        # 6. Create Customers
        print("Seeding 40 customer records...")
        customer_objs = []
        for fn, ln, email, phone in CUSTOMERS_DATA:
            cust = Customer(
                store_id=store.id,
                first_name=fn,
                last_name=ln,
                email=email,
                phone=phone,
                total_spent=0.0,
                orders_count=0,
                segment="new"
            )
            db.add(cust)
            customer_objs.append(cust)
        db.flush()

        # 7. Create ~200 Orders across the last 90 days
        print("Generating 200 orders spread across the last 90 days...")
        now = datetime.now(timezone.utc).replace(tzinfo=None)
        start_date = now - timedelta(days=89)

        # Distribute order frequency across customers to create realistic segments:
        # 6 VIPs (6-9 orders), 14 Returning (3-5 orders), 16 Single-buyers (1 order), 4 Inactive (0 orders)
        cust_order_targets = {}
        for idx, cust in enumerate(customer_objs):
            if idx < 6:
                cust_order_targets[cust.id] = random.randint(6, 9)
            elif idx < 20:
                cust_order_targets[cust.id] = random.randint(3, 5)
            elif idx < 36:
                cust_order_targets[cust.id] = 1
            else:
                cust_order_targets[cust.id] = 0

        # Build list of (customer, timestamp) tuples with natural growth across 90 days:
        # Month 1: 1-2 orders/day, Month 2: 2-3 orders/day, Month 3: 2-4 orders/day
        order_dates = []
        for day_offset in range(90):
            if day_offset < 30:
                count = random.choices([1, 2], weights=[0.6, 0.4])[0]
            elif day_offset < 60:
                count = random.choices([1, 2, 3], weights=[0.25, 0.55, 0.20])[0]
            else:
                count = random.choices([2, 3, 4], weights=[0.25, 0.55, 0.20])[0]

            for _ in range(count):
                order_time = start_date + timedelta(
                    days=day_offset,
                    hours=random.randint(8, 22),
                    minutes=random.randint(0, 59),
                    seconds=random.randint(0, 59)
                )
                order_dates.append(order_time)

        # Target ~200 orders (adjust if slightly off)
        if len(order_dates) > 205:
            order_dates = order_dates[:205]
        total_seeded_orders = len(order_dates)
        order_dates.sort()

        # Build customer pool according to targets
        cust_pool = []
        for cust_id, target in cust_order_targets.items():
            cust_pool.extend([cust_id] * target)
        
        # Adjust pool size to match total_seeded_orders
        while len(cust_pool) < total_seeded_orders:
            cust_pool.append(random.choice(customer_objs[:20]).id)
        if len(cust_pool) > total_seeded_orders:
            cust_pool = cust_pool[:total_seeded_orders]
        random.shuffle(cust_pool)

        customer_map = {c.id: c for c in customer_objs}
        customer_order_records = {c.id: [] for c in customer_objs}

        for idx, order_time in enumerate(order_dates):
            order_num = f"#{1001 + idx}"
            chosen_cust_id = cust_pool[idx]
            
            # Status distribution: 88% paid, 8% pending, 4% refunded
            roll = random.random()
            if roll < 0.88:
                fin_status = "paid"
                ful_status = "fulfilled"
            elif roll < 0.96:
                fin_status = "pending"
                ful_status = "unfulfilled"
            else:
                fin_status = "refunded"
                ful_status = "fulfilled"

            # 1 to 3 items per order
            num_items = random.choices([1, 2, 3], weights=[0.55, 0.35, 0.10])[0]
            selected_prods = random.sample(product_objs, num_items)

            subtotal = 0.0
            order_items_to_add = []
            for p in selected_prods:
                qty = random.choices([1, 2, 3], weights=[0.75, 0.20, 0.05])[0]
                item_price = p.price
                subtotal += (item_price * qty)
                order_items_to_add.append({
                    "product_id": p.id,
                    "quantity": qty,
                    "price": item_price
                })

            subtotal = round(subtotal, 2)
            tax = round(subtotal * 0.07, 2)
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

        # 8. Update Customer aggregates and segments
        print("Calculating customer lifetime values, orders counts, and behavioral segments...")
        for cust in customer_objs:
            orders = customer_order_records[cust.id]
            valid_orders = [o for o in orders if o[2] != "refunded"]
            
            cust.orders_count = len(orders)
            cust.total_spent = round(sum(o[1] for o in valid_orders), 2)
            
            if orders:
                cust.first_order_at = min(o[0] for o in orders)
                cust.last_order_at = max(o[0] for o in orders)
                
                # Assign segment
                if cust.total_spent >= 50000.0 or cust.orders_count >= 5:
                    cust.segment = "high_value"
                elif cust.orders_count >= 2:
                    cust.segment = "returning"
                elif cust.last_order_at < (now - timedelta(days=45)):
                    cust.segment = "at_risk"
                else:
                    cust.segment = "new"
            else:
                cust.segment = "inactive"

        # 9. Create AI Insights
        print("Creating AI strategic insights...")
        insights_data = [
            {
                "category": "sales",
                "title": "AOV Expansion on Weekend Collections",
                "observation": "Saturday & Sunday checkout baskets average Rs 14,500, outperforming weekday averages by +22%.",
                "impact": "Potential +Rs 380,000/mo incremental revenue through weekend bundles.",
                "rec": "Activate weekend-exclusive multi-item incentives and curated room set discounts starting Friday afternoon.",
                "confidence": 0.94
            },
            {
                "category": "products",
                "title": "High Margin Opportunity in Linens",
                "observation": "Washed Belgian Linen Duvet Cover maintains a 64% gross margin and 94% 5-star customer rating.",
                "impact": "Strongest lifetime value predictor across store catalog.",
                "rec": "Promote Linen collections in post-purchase welcome sequence to accelerate second order velocity.",
                "confidence": 0.91
            },
            {
                "category": "customers",
                "title": "VIP Retention Stability",
                "observation": "Top 15% VIP shoppers account for 44% of cumulative store revenue with a 68-day repeat purchase cycle.",
                "impact": "Core foundation of baseline revenue predictable for next quarter.",
                "rec": "Launch an exclusive VIP tiered preview for upcoming seasonal home fragrance releases.",
                "confidence": 0.89
            },
            {
                "category": "marketing",
                "title": "Inventory Rebalancing on Planters",
                "observation": "Handcrafted Terracotta Planter has fallen to 4 units in stock while demand velocity remains elevated.",
                "impact": "Stockout projected within 6 days without immediate replenishment.",
                "rec": "Place restock order of 40 units immediately and activate backorder notification signup on product page.",
                "confidence": 0.96
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
                created_at=now - timedelta(days=2)
            ))

        # 10. Create Notifications
        print("Creating notifications for store events...")
        notifs_data = [
            ("order", "New Order #1200 Received", "Marcus Vance placed an order for Washed Belgian Linen Duvet Cover (Rs 23,625).", "/sales", False, 1),
            ("inventory_alert", "Low Stock Alert: Terracotta Planter", "Handcrafted Terracotta Planter is down to 4 units in stock.", "/products", False, 3),
            ("ai_insight", "AI Growth Strategy Ready", "Weekend AOV patterns identified an incremental revenue opportunity of +Rs 380,000/mo.", "/marketing", False, 5),
            ("gamification", "Achievement Unlocked: Catalog Master", "Your store catalog now has over 20 active products (+150 Points!).", "/rewards", True, 8),
            ("sales", "Weekly Sales Target Reached", "Sarah's Store generated over Rs 500,000 in weekly revenue.", "/sales", True, 12),
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

        # 11. Create Gamification Data
        print("Configuring gamification profile and achievements...")
        GamificationService.ensure_definitions(db)
        
        ug = db.query(UserGamification).filter(UserGamification.user_id == user.id).first()
        if not ug:
            ug = UserGamification(
                user_id=user.id,
                store_id=store.id,
                total_points=350,
                level=3,
                rank_title="Growth Strategist",
                streak_days=6,
                last_active_at=now
            )
            db.add(ug)
        else:
            ug.total_points = 350
            ug.level = 3
            ug.rank_title = "Growth Strategist"
            ug.streak_days = 6
            ug.last_active_at = now
        db.flush()

        # Unlock initial achievements
        achievements_to_unlock = ["store_starter", "catalog_master", "first_hundred_k"]
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
                        unlocked_at=now - timedelta(days=random.randint(5, 40))
                    )
                    db.add(ua)
                else:
                    ua.is_unlocked = True
                    ua.current_progress = ad.target_progress

        # Add gamification activities
        activities_data = [
            ("store_registered", 100, "Connected storefront to Sellsy intelligence engine", 60),
            ("catalog_synced", 150, "Successfully published 25 catalog products", 45),
            ("orders_milestone", 50, "Surpassed 100 processed store transactions", 20),
            ("streak_bonus", 50, "Maintained active 5-day sales review streak", 3)
        ]
        for act_type, pts, desc, days_ago in activities_data:
            db.add(GamificationActivity(
                user_id=user.id,
                activity_type=act_type,
                points_earned=pts,
                description=desc,
                created_at=now - timedelta(days=days_ago)
            ))

        db.commit()

        # 12. Final summary
        final_products = db.query(Product).filter(Product.store_id == store.id).count()
        final_orders = db.query(Order).filter(Order.store_id == store.id).count()
        final_customers = db.query(Customer).filter(Customer.store_id == store.id).count()
        final_notifs = db.query(Notification).filter(Notification.user_id == user.id).count()

        print("\n=======================================================")
        print(f" SUCCESS: Store '{store.name}' seeded successfully!")
        print(f" - Account:        {user.email} (ID: {user.id})")
        print(f" - Active Store:   {store.name} (ID: {store.id})")
        print(f" - Categories:     {len(CATEGORIES_DATA)}")
        print(f" - Products:       {final_products}")
        print(f" - Customers:      {final_customers}")
        print(f" - Orders:         {final_orders} (over 90 days)")
        print(f" - Notifications:  {final_notifs}")
        print(f" - Gamification:   Level 3 (350 Points, 3 Badges Unlocked)")
        print("=======================================================\n")

if __name__ == "__main__":
    seed()
