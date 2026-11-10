from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field

# ----------------- User & Auth -----------------
class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
    full_name: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserOut(BaseModel):
    id: str
    email: EmailStr
    full_name: Optional[str] = None
    role: str
    is_demo: bool
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut

class TokenPayload(BaseModel):
    sub: Optional[str] = None

# ----------------- Store -----------------
class StoreCreate(BaseModel):
    name: str
    currency: str = "USD"
    domain: Optional[str] = None
    platform: str = "manual"

class StoreUpdate(BaseModel):
    name: Optional[str] = None
    currency: Optional[str] = None
    domain: Optional[str] = None

class StoreOut(BaseModel):
    id: str
    user_id: str
    name: str
    currency: str
    domain: Optional[str] = None
    platform: str
    created_at: datetime

    class Config:
        from_attributes = True

# ----------------- Category & Product -----------------
class CategoryOut(BaseModel):
    id: str
    name: str
    slug: str

    class Config:
        from_attributes = True

class ProductBase(BaseModel):
    title: str
    price: float
    cost_price: float = 0.0
    sku: Optional[str] = None
    inventory_quantity: int = 0
    status: str = "active"
    category_id: Optional[str] = None
    description: Optional[str] = None
    image_url: Optional[str] = None

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    title: Optional[str] = None
    price: Optional[float] = None
    cost_price: Optional[float] = None
    sku: Optional[str] = None
    inventory_quantity: Optional[int] = None
    status: Optional[str] = None
    category_id: Optional[str] = None
    description: Optional[str] = None
    image_url: Optional[str] = None

class ProductOut(ProductBase):
    id: str
    store_id: str
    category: Optional[CategoryOut] = None
    units_sold: int = 0
    revenue_generated: float = 0.0
    velocity_status: str = "stable"  # top_performer, declining, stable, opportunity
    created_at: datetime

    class Config:
        from_attributes = True

class ProductDetailOut(ProductOut):
    monthly_sales: List[Dict[str, Any]] = []
    margin_pct: float = 0.0

# ----------------- Customer -----------------
class CustomerOut(BaseModel):
    id: str
    store_id: str
    email: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    total_spent: float
    orders_count: int
    segment: str
    first_order_at: Optional[datetime] = None
    last_order_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True

class CustomerSegmentSummary(BaseModel):
    segment: str
    display_name: str
    count: int
    total_revenue: float
    avg_spend: float
    percentage_of_customers: float

class CustomerInsightsOut(BaseModel):
    total_customers: int
    repeat_purchase_rate: float
    avg_customer_ltv: float
    segments: List[CustomerSegmentSummary]
    retention_recommendations: List[str]

# ----------------- Order -----------------
class OrderItemOut(BaseModel):
    id: str
    product_id: Optional[str]
    product_title: Optional[str] = None
    quantity: int
    price: float
    total_discount: float

    class Config:
        from_attributes = True

class OrderOut(BaseModel):
    id: str
    store_id: str
    order_number: str
    total_price: float
    subtotal_price: float
    total_tax: float
    total_discounts: float
    financial_status: str
    fulfillment_status: str
    currency: str
    customer_id: Optional[str] = None
    customer_name: Optional[str] = None
    customer_email: Optional[str] = None
    items_count: int = 0
    created_at: datetime

    class Config:
        from_attributes = True

class OrderDetailOut(OrderOut):
    items: List[OrderItemOut] = []

# ----------------- Analytics & KPI -----------------
class KpiCard(BaseModel):
    title: str
    value: str
    numeric_value: float
    delta_pct: float
    trend: str  # up, down, neutral
    subtext: str

class KpiSummaryOut(BaseModel):
    total_revenue: KpiCard
    total_orders: KpiCard
    average_order_value: KpiCard
    total_customers: KpiCard
    conversion_rate: Optional[KpiCard] = None
    revenue_growth: KpiCard

class SalesTrendPoint(BaseModel):
    date: str
    revenue: float
    orders: int
    aov: float

class SalesTrendsOut(BaseModel):
    timeline: List[SalesTrendPoint]
    total_revenue: float
    total_orders: float
    aov: float
    growth_rate_pct: float

class CategoryRevenueOut(BaseModel):
    category_id: Optional[str]
    category_name: str
    revenue: float
    orders_count: int
    percentage: float

class AiInsightCard(BaseModel):
    id: str
    category: str
    title: str
    observation: str
    impact: Optional[str] = None
    actionable_recommendation: str
    confidence_score: float = 0.9

class OverviewDashboardOut(BaseModel):
    kpis: KpiSummaryOut
    trends: List[SalesTrendPoint]
    category_distribution: List[CategoryRevenueOut]
    top_products: List[ProductOut]
    recent_orders: List[OrderOut]
    ai_insights: List[AiInsightCard]

# ----------------- Forecasting -----------------
class ForecastPoint(BaseModel):
    date: str
    projected_revenue: float
    lower_bound: float
    upper_bound: float
    projected_orders: int

class ForecastResultOut(BaseModel):
    horizon_days: int
    total_projected_revenue: float
    total_projected_orders: int
    average_daily_projected: float
    confidence_level_pct: int
    trend_direction: str  # UPWARD, DOWNWARD, STABLE
    methodology: str
    narrative_explanation: str
    historical_points: List[SalesTrendPoint]
    forecast_points: List[ForecastPoint]
    is_sufficient_data: bool = True
    insufficient_data_reason: Optional[str] = None

# ----------------- Marketing -----------------
class MarketingCampaignOut(BaseModel):
    id: str
    title: str
    objective: str
    target_segment: str
    recommended_channels: List[str]
    hero_product_title: Optional[str] = None
    offer_summary: str
    expected_impact: str
    action_steps: List[str]

class MarketingStrategyOut(BaseModel):
    strategic_focus: str
    summary: str
    campaigns: List[MarketingCampaignOut]
    quick_wins: List[str]
    retention_playbook: List[str]
    cross_sell_opportunities: List[Dict[str, Any]]

# ----------------- Assistant & Chat -----------------
class ChatRequest(BaseModel):
    conversation_id: Optional[str] = None
    message: str

class ToolInvocationInfo(BaseModel):
    tool_name: str
    arguments: Dict[str, Any]
    output_summary: Optional[str] = None

class MessageOut(BaseModel):
    id: str
    role: str
    content: str
    tool_calls: Optional[List[ToolInvocationInfo]] = None
    created_at: datetime

    class Config:
        from_attributes = True

class ConversationOut(BaseModel):
    id: str
    title: str
    created_at: datetime
    updated_at: datetime
    messages: List[MessageOut] = []

    class Config:
        from_attributes = True

class ChatResponse(BaseModel):
    conversation_id: str
    message: MessageOut
    suggested_actions: List[str] = []

# ----------------- Reports -----------------
class ReportGenerateRequest(BaseModel):
    report_type: str = "executive"  # executive, sales, products, customers, marketing
    file_format: str = "pdf"  # pdf, csv
    date_from: Optional[str] = None
    date_to: Optional[str] = None

class ReportOut(BaseModel):
    id: str
    title: str
    report_type: str
    file_format: str
    file_path: Optional[str] = None
    status: str
    download_url: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# ----------------- Integrations & CSV -----------------
class ShopifyConnectRequest(BaseModel):
    shop_domain: str
    api_key: Optional[str] = None
    access_token: Optional[str] = None

class IntegrationStatusOut(BaseModel):
    platform: str
    status: str
    shop_domain: Optional[str] = None
    last_synced_at: Optional[datetime] = None
    products_count: int
    orders_count: int
    customers_count: int

class CsvImportPreview(BaseModel):
    filename: str
    import_type: str  # products, orders, customers
    total_rows: int
    headers: List[str]
    preview_rows: List[Dict[str, Any]]
    detected_mappings: Dict[str, str]

class CsvImportConfirmRequest(BaseModel):
    import_type: str
    column_mapping: Dict[str, str]
    rows: List[Dict[str, Any]]

class CsvImportResult(BaseModel):
    job_id: str
    status: str
    total_records: int
    successful_records: int
    failed_records: int
    errors: List[str] = []
