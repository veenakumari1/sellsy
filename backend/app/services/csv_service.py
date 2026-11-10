import csv
import io
import uuid
from datetime import datetime, timezone
from typing import Dict, Any, List, Tuple
from sqlalchemy.orm import Session
from app.models import Product, Order, OrderItem, Customer, ImportJob, ProductCategory
from app.schemas import CsvImportPreview, CsvImportResult

class CsvService:
    @staticmethod
    def parse_preview(file_content: bytes, filename: str, import_type: str) -> CsvImportPreview:
        decoded = file_content.decode("utf-8-sig", errors="replace")
        reader = csv.reader(io.StringIO(decoded))
        
        rows = list(reader)
        if not rows:
            raise ValueError("CSV file is completely empty.")

        raw_headers = [h.strip() for h in rows[0]]
        sample_rows_raw = rows[1:6]  # up to 5 sample rows

        # Guess column mappings based on common e-commerce export headers
        detected_mappings: Dict[str, str] = {}
        for h in raw_headers:
            hl = h.lower().replace(" ", "_").replace("-", "_")
            if import_type == "products":
                if hl in ["title", "product_title", "name", "product_name"]:
                    detected_mappings[h] = "title"
                elif hl in ["sku", "item_sku", "product_sku", "barcode"]:
                    detected_mappings[h] = "sku"
                elif hl in ["price", "variant_price", "unit_price", "selling_price"]:
                    detected_mappings[h] = "price"
                elif hl in ["cost", "cost_price", "cogs"]:
                    detected_mappings[h] = "cost_price"
                elif hl in ["inventory", "quantity", "stock", "inventory_quantity"]:
                    detected_mappings[h] = "inventory_quantity"
                elif hl in ["category", "product_type", "type", "collection"]:
                    detected_mappings[h] = "category"
                elif hl in ["description", "body", "body_html"]:
                    detected_mappings[h] = "description"
            elif import_type == "orders":
                if hl in ["order_number", "order_id", "order_name", "id", "name"]:
                    detected_mappings[h] = "order_number"
                elif hl in ["total", "total_price", "amount", "total_amount"]:
                    detected_mappings[h] = "total_price"
                elif hl in ["subtotal", "subtotal_price"]:
                    detected_mappings[h] = "subtotal_price"
                elif hl in ["tax", "total_tax"]:
                    detected_mappings[h] = "total_tax"
                elif hl in ["discount", "total_discounts", "discount_amount"]:
                    detected_mappings[h] = "total_discounts"
                elif hl in ["customer_email", "email"]:
                    detected_mappings[h] = "customer_email"
                elif hl in ["created_at", "date", "order_date"]:
                    detected_mappings[h] = "created_at"
            elif import_type == "customers":
                if hl in ["email", "customer_email"]:
                    detected_mappings[h] = "email"
                elif hl in ["first_name", "firstname", "first"]:
                    detected_mappings[h] = "first_name"
                elif hl in ["last_name", "lastname", "last"]:
                    detected_mappings[h] = "last_name"
                elif hl in ["phone", "mobile", "telephone"]:
                    detected_mappings[h] = "phone"
                elif hl in ["total_spent", "spent"]:
                    detected_mappings[h] = "total_spent"
                elif hl in ["orders_count", "orders"]:
                    detected_mappings[h] = "orders_count"

        # Construct preview rows as dicts
        preview_rows = []
        for r in sample_rows_raw:
            row_dict = {}
            for idx, h in enumerate(raw_headers):
                if idx < len(r):
                    row_dict[h] = r[idx]
            preview_rows.append(row_dict)

        return CsvImportPreview(
            filename=filename,
            import_type=import_type,
            total_rows=len(rows) - 1,
            headers=raw_headers,
            preview_rows=preview_rows,
            detected_mappings=detected_mappings
        )

    @staticmethod
    def process_import(
        db: Session,
        store_id: str,
        import_type: str,
        column_mapping: Dict[str, str],
        rows: List[Dict[str, Any]]
    ) -> CsvImportResult:
        job = ImportJob(
            store_id=store_id,
            import_type=import_type,
            status="processing",
            total_records=len(rows),
            successful_records=0,
            failed_records=0,
            errors_json=[]
        )
        db.add(job)
        db.flush()

        errors = []
        success_count = 0
        failed_count = 0

        # Invert column mapping: {canonical_field: csv_header}
        inv_map = {v: k for k, v in column_mapping.items()}

        if import_type == "products":
            existing_skus = {p.sku for p in db.query(Product.sku).filter(Product.store_id == store_id).all() if p.sku}

            for idx, row in enumerate(rows, 1):
                try:
                    title_col = inv_map.get("title")
                    title = str(row.get(title_col, "")).strip() if title_col else ""
                    if not title:
                        raise ValueError(f"Row {idx}: Missing required product title.")

                    sku_col = inv_map.get("sku")
                    sku = str(row.get(sku_col, "")).strip() if sku_col else f"SKU-{uuid.uuid4().hex[:6].upper()}"

                    # Duplicate detection
                    if sku in existing_skus:
                        # Update or skip
                        prod = db.query(Product).filter(Product.store_id == store_id, Product.sku == sku).first()
                        if prod:
                            price_col = inv_map.get("price")
                            if price_col and row.get(price_col):
                                prod.price = float(row[price_col])
                            success_count += 1
                            continue

                    price_col = inv_map.get("price")
                    price = float(row.get(price_col, 0.0)) if price_col and row.get(price_col) else 19.99

                    cost_col = inv_map.get("cost_price")
                    cost = float(row.get(cost_col, 0.0)) if cost_col and row.get(cost_col) else round(price * 0.35, 2)

                    stock_col = inv_map.get("inventory_quantity")
                    stock = int(float(row.get(stock_col, 50))) if stock_col and row.get(stock_col) else 50

                    desc_col = inv_map.get("description")
                    desc = str(row.get(desc_col, "")) if desc_col else f"High quality {title}"

                    # Category handling
                    cat_col = inv_map.get("category")
                    cat_name = str(row.get(cat_col, "General")).strip() if cat_col else "General"
                    cat = db.query(ProductCategory).filter(ProductCategory.store_id == store_id, ProductCategory.name == cat_name).first()
                    if not cat:
                        cat = ProductCategory(store_id=store_id, name=cat_name, slug=cat_name.lower().replace(" ", "-"))
                        db.add(cat)
                        db.flush()

                    new_prod = Product(
                        store_id=store_id,
                        category_id=cat.id,
                        title=title,
                        description=desc,
                        price=price,
                        cost_price=cost,
                        sku=sku,
                        inventory_quantity=stock,
                        status="active"
                    )
                    db.add(new_prod)
                    existing_skus.add(sku)
                    success_count += 1
                except Exception as e:
                    failed_count += 1
                    errors.append(f"Row {idx}: {str(e)}")

        elif import_type == "customers":
            existing_emails = {c.email for c in db.query(Customer.email).filter(Customer.store_id == store_id).all()}
            for idx, row in enumerate(rows, 1):
                try:
                    email_col = inv_map.get("email")
                    email = str(row.get(email_col, "")).strip().lower() if email_col else ""
                    if not email or "@" not in email:
                        raise ValueError(f"Row {idx}: Invalid or missing email address.")

                    if email in existing_emails:
                        # Duplicate skip or update
                        success_count += 1
                        continue

                    fname_col = inv_map.get("first_name")
                    fname = str(row.get(fname_col, "")).strip() if fname_col else "Customer"
                    lname_col = inv_map.get("last_name")
                    lname = str(row.get(lname_col, "")).strip() if lname_col else ""
                    phone_col = inv_map.get("phone")
                    phone = str(row.get(phone_col, "")) if phone_col else None

                    cust = Customer(
                        store_id=store_id,
                        email=email,
                        first_name=fname,
                        last_name=lname,
                        phone=phone,
                        total_spent=0.0,
                        orders_count=0,
                        segment="new"
                    )
                    db.add(cust)
                    existing_emails.add(email)
                    success_count += 1
                except Exception as e:
                    failed_count += 1
                    errors.append(f"Row {idx}: {str(e)}")

        elif import_type == "orders":
            existing_orders = {o.order_number for o in db.query(Order.order_number).filter(Order.store_id == store_id).all()}
            for idx, row in enumerate(rows, 1):
                try:
                    num_col = inv_map.get("order_number")
                    ord_num = str(row.get(num_col, "")).strip() if num_col else f"#ORD-{uuid.uuid4().hex[:6].upper()}"

                    if ord_num in existing_orders:
                        success_count += 1
                        continue

                    tot_col = inv_map.get("total_price")
                    tot = float(row.get(tot_col, 0.0)) if tot_col and row.get(tot_col) else 50.0

                    email_col = inv_map.get("customer_email")
                    email = str(row.get(email_col, "")).strip().lower() if email_col else None

                    cust_id = None
                    if email and "@" in email:
                        cust = db.query(Customer).filter(Customer.store_id == store_id, Customer.email == email).first()
                        if not cust:
                            cust = Customer(store_id=store_id, email=email, first_name="Shopper", segment="new")
                            db.add(cust)
                            db.flush()
                        cust.total_spent += tot
                        cust.orders_count += 1
                        cust_id = cust.id

                    ord_obj = Order(
                        store_id=store_id,
                        customer_id=cust_id,
                        order_number=ord_num,
                        total_price=tot,
                        subtotal_price=round(tot * 0.93, 2),
                        total_tax=round(tot * 0.07, 2),
                        total_discounts=0.0,
                        financial_status="paid",
                        fulfillment_status="fulfilled"
                    )
                    db.add(ord_obj)
                    existing_orders.add(ord_num)
                    success_count += 1
                except Exception as e:
                    failed_count += 1
                    errors.append(f"Row {idx}: {str(e)}")

        db.commit()

        job.status = "completed" if failed_count == 0 else ("partial" if success_count > 0 else "failed")
        job.successful_records = success_count
        job.failed_records = failed_count
        job.errors_json = errors[:20]  # first 20 errors
        db.commit()

        return CsvImportResult(
            job_id=job.id,
            status=job.status,
            total_records=len(rows),
            successful_records=success_count,
            failed_records=failed_count,
            errors=errors[:10]
        )
