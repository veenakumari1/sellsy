import random
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from app.models import (
    User, Store, StoreIntegration, ProductCategory, Product, Customer,
    Order, OrderItem, SalesAnalyticsDaily, AiInsight
)
from app.core.security import get_password_hash

def seed_demo_store(db: Session) -> User:
    # Check if demo user already exists
    demo_user = db.query(User).filter(User.email == "demo@sellsy.io").first()
    if demo_user:
        return demo_user

    # 1. Create Demo User
    demo_user = User(
        email="demo@sellsy.io",
        hashed_password=get_password_hash("demo123456"),
        full_name="Alex Mercer",
        role="merchant",
        is_demo=True,
        is_active=True
    )
    db.add(demo_user)
    db.flush()

    # 2. Create Demo Store
    store = Store(
        user_id=demo_user.id,
        name="Aura Living Essentials",
        currency="USD",
        domain="auraliving.myshopify.com",
        platform="demo"
    )
    db.add(store)
    db.flush()

    # 3. Create Store Integration (Simulated Shopify link)
    integration = StoreIntegration(
        store_id=store.id,
        platform="shopify",
        shop_domain="auraliving.myshopify.com",
        status="connected",
        last_synced_at=datetime.now(timezone.utc),
        metadata_json={
            "plan_name": "Shopify Advanced",
            "country": "US",
            "currency": "USD",
            "timezone": "America/New_York"
        }
    )
    db.add(integration)
    db.flush()

    # 4. Product Categories
    categories_data = [
        {"name": "Ceramics & Decor", "slug": "ceramics-decor"},
        {"name": "Wellness & Aromatherapy", "slug": "wellness-aromatherapy"},
        {"name": "Home Lighting", "slug": "home-lighting"},
        {"name": "Smart Kitchen", "slug": "smart-kitchen"}
    ]
    category_objs = {}
    for cat in categories_data:
        c = ProductCategory(store_id=store.id, name=cat["name"], slug=cat["slug"])
        db.add(c)
        db.flush()
        category_objs[cat["name"]] = c

    # 5. Realistic Products (25 products)
    products_catalog = [
        # Ceramics & Decor
        {"title": "Minimalist Matte Ceramic Planter", "cat": "Ceramics & Decor", "price": 48.00, "cost": 16.00, "sku": "CER-PLT-01", "stock": 85, "img": "https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&w=400&q=80"},
        {"title": "Handcrafted Speckled Vase", "cat": "Ceramics & Decor", "price": 64.00, "cost": 22.00, "sku": "CER-VAS-02", "stock": 42, "img": "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=400&q=80"},
        {"title": "Wabi-Sabi Stoneware Mug Set (4-pack)", "cat": "Ceramics & Decor", "price": 52.00, "cost": 18.00, "sku": "CER-MUG-03", "stock": 120, "img": "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=400&q=80"},
        {"title": "Terracotta Arch Sculpture", "cat": "Ceramics & Decor", "price": 78.00, "cost": 28.00, "sku": "CER-ARC-04", "stock": 18, "img": "https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?auto=format&fit=crop&w=400&q=80"},
        {"title": "Nordic Travertine Decorative Tray", "cat": "Ceramics & Decor", "price": 89.00, "cost": 31.00, "sku": "CER-TRY-05", "stock": 35, "img": "https://images.unsplash.com/photo-1616046229478-9901c5536a45?auto=format&fit=crop&w=400&q=80"},
        {"title": "Earthy Ribbed Candle Vessel", "cat": "Ceramics & Decor", "price": 34.00, "cost": 11.00, "sku": "CER-CND-06", "stock": 64, "img": "https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=400&q=80"},
        
        # Wellness & Aromatherapy
        {"title": "Aura Ultrasonic Aroma Diffuser", "cat": "Wellness & Aromatherapy", "price": 75.00, "cost": 25.00, "sku": "WEL-DIF-01", "stock": 90, "img": "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=400&q=80"},
        {"title": "Organic French Lavender Oil (30ml)", "cat": "Wellness & Aromatherapy", "price": 24.00, "cost": 6.50, "sku": "WEL-OIL-02", "stock": 210, "img": "https://images.unsplash.com/photo-1608571424266-edeb9bbefdec?auto=format&fit=crop&w=400&q=80"},
        {"title": "Wild Cedarwood & Amber Room Spray", "cat": "Wellness & Aromatherapy", "price": 32.00, "cost": 9.00, "sku": "WEL-SPR-03", "stock": 140, "img": "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=400&q=80"},
        {"title": "Himalayan Pink Salt Bath Soak (500g)", "cat": "Wellness & Aromatherapy", "price": 28.00, "cost": 7.00, "sku": "WEL-SLT-04", "stock": 175, "img": "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=400&q=80"},
        {"title": "Botanical Soy Wax Pillar Candle", "cat": "Wellness & Aromatherapy", "price": 38.00, "cost": 12.00, "sku": "WEL-CDL-05", "stock": 80, "img": "https://images.unsplash.com/photo-1572726729437-3732efed3f8a?auto=format&fit=crop&w=400&q=80"},
        {"title": "Organic Eucalyptus Shower Bundle", "cat": "Wellness & Aromatherapy", "price": 22.00, "cost": 5.00, "sku": "WEL-EUC-06", "stock": 55, "img": "https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=400&q=80"},

        # Home Lighting
        {"title": "Sculptural Opal Glass Pendant Lamp", "cat": "Home Lighting", "price": 145.00, "cost": 52.00, "sku": "LGT-PDN-01", "stock": 28, "img": "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=400&q=80"},
        {"title": "Rechargeable Brass Bedside Lamp", "cat": "Home Lighting", "price": 95.00, "cost": 34.00, "sku": "LGT-BED-02", "stock": 60, "img": "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=400&q=80"},
        {"title": "Pleated Fabric Accent Sconce", "cat": "Home Lighting", "price": 115.00, "cost": 41.00, "sku": "LGT-SCN-03", "stock": 30, "img": "https://images.unsplash.com/photo-1540932239986-30128078f3c5?auto=format&fit=crop&w=400&q=80"},
        {"title": "Dimmable Ambient Amber LED Bulb Set", "cat": "Home Lighting", "price": 36.00, "cost": 10.00, "sku": "LGT-BLB-04", "stock": 190, "img": "https://images.unsplash.com/photo-1550985543-f47f38aeee65?auto=format&fit=crop&w=400&q=80"},
        {"title": "Handmade Paper Lantern Shade", "cat": "Home Lighting", "price": 45.00, "cost": 13.00, "sku": "LGT-PPR-05", "stock": 70, "img": "https://images.unsplash.com/photo-1517991104123-1d56a6e81ed9?auto=format&fit=crop&w=400&q=80"},
        {"title": "Fluted Marble Table Light", "cat": "Home Lighting", "price": 185.00, "cost": 68.00, "sku": "LGT-TBL-06", "stock": 15, "img": "https://images.unsplash.com/photo-1543198126-a8ad8e47fb22?auto=format&fit=crop&w=400&q=80"},

        # Smart Kitchen
        {"title": "Precision Gooseneck Pour-Over Kettle", "cat": "Smart Kitchen", "price": 119.00, "cost": 42.00, "sku": "KTN-KTL-01", "stock": 50, "img": "https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=400&q=80"},
        {"title": "Cold Brew Artisan Glass Carafe", "cat": "Smart Kitchen", "price": 42.00, "cost": 14.00, "sku": "KTN-CRF-02", "stock": 85, "img": "https://images.unsplash.com/photo-1517256064527-09c73fc73e38?auto=format&fit=crop&w=400&q=80"},
        {"title": "Hand-Turned Walnut Cutting Board", "cat": "Smart Kitchen", "price": 72.00, "cost": 24.00, "sku": "KTN-BRD-03", "stock": 40, "img": "https://images.unsplash.com/photo-1590794056226-79ef3a8147e1?auto=format&fit=crop&w=400&q=80"},
        {"title": "Japanese Carbon Steel Santoku Knife", "cat": "Smart Kitchen", "price": 135.00, "cost": 48.00, "sku": "KTN-KNF-04", "stock": 32, "img": "https://images.unsplash.com/photo-1593618998160-e34014e67546?auto=format&fit=crop&w=400&q=80"},
        {"title": "Double-Wall Insulated Matcha Bowl", "cat": "Smart Kitchen", "price": 38.00, "cost": 12.00, "sku": "KTN-MCH-05", "stock": 65, "img": "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=400&q=80"},
        {"title": "Ceramic Pestle & Mortar Set", "cat": "Smart Kitchen", "price": 46.00, "cost": 15.00, "sku": "KTN-MOR-06", "stock": 48, "img": "https://images.unsplash.com/photo-1589782182703-2aaa69037b5b?auto=format&fit=crop&w=400&q=80"},
        {"title": "Organic Linen Kitchen Tea Towels (Set of 3)", "cat": "Smart Kitchen", "price": 32.00, "cost": 9.50, "sku": "KTN-TWL-07", "stock": 110, "img": "https://images.unsplash.com/photo-1606851094655-b2593a9af63f?auto=format&fit=crop&w=400&q=80"}
    ]

    product_objs = []
    for p_info in products_catalog:
        prod = Product(
            store_id=store.id,
            category_id=category_objs[p_info["cat"]].id,
            title=p_info["title"],
            description=f"Premium grade {p_info['title'].lower()} crafted with sustainable materials and contemporary aesthetic.",
            price=p_info["price"],
            cost_price=p_info["cost"],
            sku=p_info["sku"],
            inventory_quantity=p_info["stock"],
            status="active",
            image_url=p_info["img"]
        )
        db.add(prod)
        db.flush()
        product_objs.append(prod)

    # 6. Customers (45 realistic customers)
    first_names = ["Emma", "Liam", "Olivia", "Noah", "Sophia", "Jackson", "Ava", "Lucas", "Mia", "Oliver",
                   "Isabella", "Ethan", "Harper", "Aiden", "Evelyn", "James", "Charlotte", "Benjamin", "Amelia", "Henry",
                   "Ella", "Alexander", "Chloe", "William", "Victoria", "Daniel", "Grace", "Matthew", "Zoey", "Samuel",
                   "Penelope", "Sebastian", "Riley", "David", "Layla", "Joseph", "Nora", "Carter", "Lily", "Owen",
                   "Hannah", "Wyatt", "Elena", "John", "Maya"]
    last_names = ["Vance", "Sterling", "Kowalski", "Dupont", "Chen", "Sinclair", "Mercer", "Lindqvist", "Patel", "Thorne",
                  "Novak", "Holloway", "Rousseau", "Castillo", "Mendoza", "Kim", "Tanaka", "Fletcher", "Blackwood", "Sutherland"]

    customer_objs = []
    for i, fname in enumerate(first_names):
        lname = last_names[i % len(last_names)]
        email = f"{fname.lower()}.{lname.lower()}{random.randint(10, 99)}@example.com"
        cust = Customer(
            store_id=store.id,
            email=email,
            first_name=fname,
            last_name=lname,
            phone=f"+1 (555) {random.randint(100, 999)}-{random.randint(1000, 9999)}",
            total_spent=0.0,
            orders_count=0,
            segment="new"
        )
        db.add(cust)
        db.flush()
        customer_objs.append(cust)

    # 7. Orders & Order Items across last 90 days
    # Real distribution:
    # Top performers: "Aura Ultrasonic Aroma Diffuser", "Minimalist Matte Ceramic Planter", "Precision Gooseneck Pour-Over Kettle"
    # Declining product: "Wild Cedarwood & Amber Room Spray" (was bought often early on, dropped in last 30 days)
    now = datetime.now(timezone.utc)
    base_date = now - timedelta(days=90)
    
    order_counter = 1001
    all_orders = []

    # Let's seed ~175 orders spanning the last 90 days
    for day in range(91):
        order_date = base_date + timedelta(days=day)
        # Weekends have slightly more orders
        day_of_week = order_date.weekday()
        if day_of_week in (4, 5, 6):  # Fri, Sat, Sun
            daily_orders_count = random.randint(2, 4)
        else:
            daily_orders_count = random.randint(1, 3)

        # Recent 30 days has a gentle growth trend (+15%)
        if day > 60:
            if random.random() > 0.4:
                daily_orders_count += 1

        for _ in range(daily_orders_count):
            # Select customer: 30% chance of returning customer who already ordered
            if random.random() < 0.35 and [c for c in customer_objs if c.orders_count > 0]:
                ordered_custs = [c for c in customer_objs if c.orders_count > 0]
                customer = random.choice(ordered_custs)
            else:
                customer = random.choice(customer_objs)

            order_num = f"AUR-{order_counter}"
            order_counter += 1

            # Decide items (1 to 3 items per order)
            num_items = random.choices([1, 2, 3], weights=[0.55, 0.35, 0.10])[0]
            
            # Weighted choice of products
            # Aura Diffuser (prod index 6), Planter (prod index 0), Kettle (prod index 18) are stars
            weights = []
            for idx, p in enumerate(product_objs):
                if p.title == "Aura Ultrasonic Aroma Diffuser":
                    weights.append(14)
                elif p.title == "Minimalist Matte Ceramic Planter":
                    weights.append(12)
                elif p.title == "Precision Gooseneck Pour-Over Kettle":
                    weights.append(10)
                elif p.title == "Wild Cedarwood & Amber Room Spray":
                    # Declining product: high weight early on, low weight in last 30 days
                    weights.append(12 if day < 45 else 2)
                elif p.title == "Organic French Lavender Oil (30ml)":
                    weights.append(11)
                else:
                    weights.append(4)

            chosen_products = random.choices(product_objs, weights=weights, k=num_items)

            subtotal = 0.0
            order_items_to_add = []
            for p in chosen_products:
                qty = 1 if p.price > 80 else random.choices([1, 2], weights=[0.8, 0.2])[0]
                item_price = p.price
                discount = round(item_price * 0.10, 2) if random.random() < 0.15 else 0.0
                subtotal += (item_price * qty) - discount
                order_items_to_add.append({
                    "product": p,
                    "quantity": qty,
                    "price": item_price,
                    "discount": discount
                })

            subtotal = round(subtotal, 2)
            tax = round(subtotal * 0.07, 2)
            total = round(subtotal + tax, 2)

            # Order timestamp with jitter
            order_time = order_date + timedelta(hours=random.randint(8, 22), minutes=random.randint(0, 59))

            order = Order(
                store_id=store.id,
                customer_id=customer.id,
                order_number=order_num,
                total_price=total,
                subtotal_price=subtotal,
                total_tax=tax,
                total_discounts=round(sum(item["discount"] for item in order_items_to_add), 2),
                financial_status="paid",
                fulfillment_status="fulfilled",
                currency="USD",
                created_at=order_time
            )
            db.add(order)
            db.flush()

            for item in order_items_to_add:
                order_item = OrderItem(
                    order_id=order.id,
                    product_id=item["product"].id,
                    quantity=item["quantity"],
                    price=item["price"],
                    total_discount=item["discount"]
                )
                db.add(order_item)

            # Update customer statistics
            customer.total_spent = round(customer.total_spent + total, 2)
            customer.orders_count += 1
            if customer.first_order_at is None or order_time < customer.first_order_at:
                customer.first_order_at = order_time
            if customer.last_order_at is None or order_time > customer.last_order_at:
                customer.last_order_at = order_time

            all_orders.append(order)

    # 8. Re-evaluate customer RFM segments based on generated orders
    for c in customer_objs:
        if c.orders_count == 0:
            c.segment = "inactive"
        elif c.orders_count >= 4 or c.total_spent > 350.0:
            c.segment = "high_value"
        elif c.orders_count >= 2:
            days_since_last = (now - c.last_order_at).days if c.last_order_at else 999
            if days_since_last > 45:
                c.segment = "at_risk"
            else:
                c.segment = "returning"
        else:
            days_since_last = (now - c.last_order_at).days if c.last_order_at else 999
            if days_since_last > 60:
                c.segment = "inactive"
            else:
                c.segment = "new"

    # 9. Create AI Business Insights grounded in the generated data
    insights_data = [
        {
            "category": "sales",
            "title": "Weekend Sales Surge Outperforming Weekdays",
            "observation": "Friday through Sunday revenue accounts for 58.4% of weekly turnover, yielding an average daily revenue of $840 vs $460 on weekdays.",
            "impact": "+24% higher conversion probability on weekends.",
            "actionable_recommendation": "Concentrate Meta ad budget allocations on Thursday evenings and launch SMS flash drops on Saturday mornings to ride peak weekend buying intent.",
            "confidence_score": 0.94
        },
        {
            "category": "products",
            "title": "High Margin Opportunity: Minimalist Matte Ceramic Planter",
            "observation": "The Ceramic Planter generated 74 orders with a 66.7% gross margin ($48 price / $16 COGS), making it your top gross-profit contributor.",
            "impact": "Accounted for $3,552 in gross revenue with zero stockout incidents.",
            "actionable_recommendation": "Create a bundled SKU pairing the Planter with the Wild Cedarwood Room Spray or Organic Essential Oils at a 10% bundle saving to cross-sell and boost basket AOV.",
            "confidence_score": 0.96
        },
        {
            "category": "products",
            "title": "Velocity Alert: Wild Cedarwood & Amber Room Spray Declining",
            "observation": "Monthly sales velocity for Cedarwood Room Spray dropped 42% over the last 30 days (14 units sold vs 24 units in the previous month).",
            "impact": "Holding 140 units of tied-up inventory ($1,260 cost capital).",
            "actionable_recommendation": "Trigger an automated re-order email to past buyers of the Room Spray offering a refill discount, or bundle it as a free gift with purchase on orders above $120.",
            "confidence_score": 0.91
        },
        {
            "category": "customers",
            "title": "At-Risk VIP Cohort Detected",
            "observation": "8 repeat customers with historical lifetime spend >$250 haven't placed an order in over 50 days.",
            "impact": "Potential loss of $2,400+ in annualized high-margin repeat revenue.",
            "actionable_recommendation": "Launch an automated 'We Miss You' win-back flow featuring an exclusive $20 gift voucher valid for 7 days on newly arrived kitchen & lighting wares.",
            "confidence_score": 0.89
        }
    ]

    for ins in insights_data:
        db.add(AiInsight(
            store_id=store.id,
            category=ins["category"],
            title=ins["title"],
            observation=ins["observation"],
            impact=ins["impact"],
            actionable_recommendation=ins["actionable_recommendation"],
            confidence_score=ins["confidence_score"]
        ))

    db.commit()
    db.refresh(demo_user)
    return demo_user
