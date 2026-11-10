# Database Design & Entity Relationship (ER) Model

---

## 1. Relational Database Overview

Sellsy utilizes a PostgreSQL relational schema engineered for rapid analytical aggregation, foreign key referential integrity, and multi-tenant data isolation.

---

## 2. Entity-Relationship Diagram

```mermaid
erDiagram
    USERS ||--o{ STORES : owns
    USERS ||--o{ AI_CONVERSATIONS : creates
    USERS ||--o{ GENERATED_REPORTS : requests

    STORES ||--o| STORE_INTEGRATIONS : configures
    STORES ||--o{ PRODUCT_CATEGORIES : classifies
    STORES ||--o{ PRODUCTS : catalogs
    STORES ||--o{ CUSTOMERS : records
    STORES ||--o{ ORDERS : processes
    STORES ||--o{ AI_INSIGHTS : generates
    STORES ||--o{ IMPORT_JOBS : executes

    PRODUCT_CATEGORIES ||--o{ PRODUCTS : groups
    CUSTOMERS ||--o{ ORDERS : places
    ORDERS ||--o{ ORDER_ITEMS : contains
    PRODUCTS ||--o{ ORDER_ITEMS : referenced_in

    AI_CONVERSATIONS ||--o{ AI_MESSAGES : contains

    USERS {
        string id PK
        string email UK
        string hashed_password
        string full_name
        string role
        boolean is_demo
        datetime created_at
    }

    STORES {
        string id PK
        string user_id FK
        string name
        string currency
        string domain
        string platform
        datetime created_at
    }

    STORE_INTEGRATIONS {
        string id PK
        string store_id FK
        string platform
        string shop_domain
        string access_token
        string status
        datetime last_synced_at
    }

    PRODUCTS {
        string id PK
        string store_id FK
        string category_id FK
        string title
        string sku UK
        float price
        float cost_price
        int inventory_quantity
        string status
    }

    CUSTOMERS {
        string id PK
        string store_id FK
        string email
        string first_name
        string last_name
        float total_spent
        int orders_count
        string segment
        datetime last_order_at
    }

    ORDERS {
        string id PK
        string store_id FK
        string customer_id FK
        string order_number UK
        float total_price
        float subtotal_price
        float total_tax
        float total_discounts
        string financial_status
        datetime created_at
    }

    ORDER_ITEMS {
        string id PK
        string order_id FK
        string product_id FK
        int quantity
        float price
        float total_discount
    }

    AI_INSIGHTS {
        string id PK
        string store_id FK
        string category
        string title
        text observation
        text actionable_recommendation
        float confidence_score
    }
```

---

## 3. Database Indexes

- `idx_store_date`: Indexed on `(store_id, date)` for sub-millisecond daily rollups.
- `idx_orders_store_created`: Indexed on `(store_id, created_at)` for rolling window queries.
- `idx_products_sku`: Indexed on `(store_id, sku)` for fast catalog lookups and duplicate detection during CSV ingestion.
- `idx_customers_email`: Indexed on `(store_id, email)` for customer cohort tracking.
