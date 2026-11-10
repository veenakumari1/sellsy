import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, DateTime, ForeignKey, Text, JSON, Enum, Index
)
from sqlalchemy.orm import relationship
from app.core.database import Base

def generate_uuid() -> str:
    return str(uuid.uuid4())

def utc_now() -> datetime:
    return datetime.now(timezone.utc)

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=True)
    role = Column(String(50), default="merchant")  # merchant, admin
    is_active = Column(Boolean, default=True)
    is_demo = Column(Boolean, default=False)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    stores = relationship("Store", back_populates="user", cascade="all, delete-orphan")
    conversations = relationship("AiConversation", back_populates="user", cascade="all, delete-orphan")
    reports = relationship("GeneratedReport", back_populates="user", cascade="all, delete-orphan")

class Store(Base):
    __tablename__ = "stores"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    currency = Column(String(10), default="USD")
    domain = Column(String(255), nullable=True)
    platform = Column(String(50), default="demo")  # demo, shopify, csv, manual
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    user = relationship("User", back_populates="stores")
    integration = relationship("StoreIntegration", back_populates="store", uselist=False, cascade="all, delete-orphan")
    categories = relationship("ProductCategory", back_populates="store", cascade="all, delete-orphan")
    products = relationship("Product", back_populates="store", cascade="all, delete-orphan")
    customers = relationship("Customer", back_populates="store", cascade="all, delete-orphan")
    orders = relationship("Order", back_populates="store", cascade="all, delete-orphan")
    insights = relationship("AiInsight", back_populates="store", cascade="all, delete-orphan")
    conversations = relationship("AiConversation", back_populates="store", cascade="all, delete-orphan")
    reports = relationship("GeneratedReport", back_populates="store", cascade="all, delete-orphan")
    import_jobs = relationship("ImportJob", back_populates="store", cascade="all, delete-orphan")

class StoreIntegration(Base):
    __tablename__ = "store_integrations"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    store_id = Column(String(36), ForeignKey("stores.id", ondelete="CASCADE"), unique=True, nullable=False)
    platform = Column(String(50), default="shopify")
    shop_domain = Column(String(255), nullable=True)
    access_token = Column(String(255), nullable=True)
    api_key = Column(String(255), nullable=True)
    status = Column(String(50), default="connected")  # connected, disconnected, pending_auth, sync_error
    last_synced_at = Column(DateTime, nullable=True)
    metadata_json = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    store = relationship("Store", back_populates="integration")

class ProductCategory(Base):
    __tablename__ = "product_categories"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    store_id = Column(String(36), ForeignKey("stores.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    slug = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=utc_now)

    store = relationship("Store", back_populates="categories")
    products = relationship("Product", back_populates="category")

class Product(Base):
    __tablename__ = "products"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    store_id = Column(String(36), ForeignKey("stores.id", ondelete="CASCADE"), nullable=False, index=True)
    category_id = Column(String(36), ForeignKey("product_categories.id", ondelete="SET NULL"), nullable=True)
    title = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    price = Column(Float, nullable=False, default=0.0)
    cost_price = Column(Float, nullable=False, default=0.0)
    sku = Column(String(100), nullable=True, index=True)
    inventory_quantity = Column(Integer, default=0)
    status = Column(String(50), default="active")  # active, draft, archived
    image_url = Column(String(1000), nullable=True)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    store = relationship("Store", back_populates="products")
    category = relationship("ProductCategory", back_populates="products")
    order_items = relationship("OrderItem", back_populates="product")

class Customer(Base):
    __tablename__ = "customers"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    store_id = Column(String(36), ForeignKey("stores.id", ondelete="CASCADE"), nullable=False, index=True)
    email = Column(String(255), nullable=False, index=True)
    first_name = Column(String(100), nullable=True)
    last_name = Column(String(100), nullable=True)
    phone = Column(String(50), nullable=True)
    total_spent = Column(Float, default=0.0)
    orders_count = Column(Integer, default=0)
    segment = Column(String(50), default="new")  # high_value, returning, new, at_risk, inactive
    first_order_at = Column(DateTime, nullable=True)
    last_order_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    store = relationship("Store", back_populates="customers")
    orders = relationship("Order", back_populates="customer")

class Order(Base):
    __tablename__ = "orders"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    store_id = Column(String(36), ForeignKey("stores.id", ondelete="CASCADE"), nullable=False, index=True)
    customer_id = Column(String(36), ForeignKey("customers.id", ondelete="SET NULL"), nullable=True, index=True)
    order_number = Column(String(100), nullable=False, index=True)
    total_price = Column(Float, nullable=False, default=0.0)
    subtotal_price = Column(Float, nullable=False, default=0.0)
    total_tax = Column(Float, default=0.0)
    total_discounts = Column(Float, default=0.0)
    financial_status = Column(String(50), default="paid")  # paid, pending, refunded
    fulfillment_status = Column(String(50), default="fulfilled")  # fulfilled, unfulfilled, partial
    currency = Column(String(10), default="USD")
    created_at = Column(DateTime, default=utc_now, index=True)

    store = relationship("Store", back_populates="orders")
    customer = relationship("Customer", back_populates="orders")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")

class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    order_id = Column(String(36), ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id = Column(String(36), ForeignKey("products.id", ondelete="SET NULL"), nullable=True, index=True)
    quantity = Column(Integer, nullable=False, default=1)
    price = Column(Float, nullable=False, default=0.0)
    total_discount = Column(Float, default=0.0)

    order = relationship("Order", back_populates="items")
    product = relationship("Product", back_populates="order_items")

class SalesAnalyticsDaily(Base):
    __tablename__ = "sales_analytics_daily"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    store_id = Column(String(36), ForeignKey("stores.id", ondelete="CASCADE"), nullable=False, index=True)
    date = Column(DateTime, nullable=False, index=True)
    total_revenue = Column(Float, default=0.0)
    total_orders = Column(Integer, default=0)
    average_order_value = Column(Float, default=0.0)
    new_customers_count = Column(Integer, default=0)
    returning_customers_count = Column(Integer, default=0)

    __table_args__ = (
        Index("idx_store_date", "store_id", "date", unique=True),
    )

class AiInsight(Base):
    __tablename__ = "ai_insights"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    store_id = Column(String(36), ForeignKey("stores.id", ondelete="CASCADE"), nullable=False, index=True)
    category = Column(String(50), nullable=False)  # sales, products, customers, marketing
    title = Column(String(255), nullable=False)
    observation = Column(Text, nullable=False)
    impact = Column(String(255), nullable=True)
    actionable_recommendation = Column(Text, nullable=False)
    confidence_score = Column(Float, default=0.9)
    is_dismissed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=utc_now)

    store = relationship("Store", back_populates="insights")

class AiConversation(Base):
    __tablename__ = "ai_conversations"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    store_id = Column(String(36), ForeignKey("stores.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), default="New Analysis Session")
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    store = relationship("Store", back_populates="conversations")
    user = relationship("User", back_populates="conversations")
    messages = relationship("AiMessage", back_populates="conversation", cascade="all, delete-orphan", order_by="AiMessage.created_at")

class AiMessage(Base):
    __tablename__ = "ai_messages"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    conversation_id = Column(String(36), ForeignKey("ai_conversations.id", ondelete="CASCADE"), nullable=False, index=True)
    role = Column(String(50), nullable=False)  # user, assistant, system, tool
    content = Column(Text, nullable=False)
    tool_calls = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=utc_now)

    conversation = relationship("AiConversation", back_populates="messages")

class GeneratedReport(Base):
    __tablename__ = "generated_reports"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    store_id = Column(String(36), ForeignKey("stores.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    report_type = Column(String(50), nullable=False)  # executive, sales, products, customers, marketing
    file_format = Column(String(10), default="pdf")  # pdf, csv
    file_path = Column(String(500), nullable=True)
    status = Column(String(50), default="ready")  # ready, generating, failed
    summary_data = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=utc_now)

    store = relationship("Store", back_populates="reports")
    user = relationship("User", back_populates="reports")

class ImportJob(Base):
    __tablename__ = "import_jobs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    store_id = Column(String(36), ForeignKey("stores.id", ondelete="CASCADE"), nullable=False, index=True)
    import_type = Column(String(50), nullable=False)  # products, orders, customers
    status = Column(String(50), default="completed")  # pending, processing, completed, failed
    filename = Column(String(255), nullable=True)
    total_records = Column(Integer, default=0)
    successful_records = Column(Integer, default=0)
    failed_records = Column(Integer, default=0)
    errors_json = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=utc_now)

    store = relationship("Store", back_populates="import_jobs")
