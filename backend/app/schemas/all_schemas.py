from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field, ConfigDict

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
    currency: str = "PKR"
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
    repeat_purchase_rate_pct: Optional[float] = None
    avg_customer_ltv: float
    segments: List[CustomerSegmentSummary]
    retention_recommendations: List[str]
    recommendations: Optional[List[str]] = None

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

# ----------------- Notifications -----------------
class NotificationOut(BaseModel):
    id: str
    title: str
    message: str
    category: str
    is_read: bool
    link: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class NotificationListResponse(BaseModel):
    notifications: List[NotificationOut]
    unread_count: int

# ----------------- Gamification -----------------
class AchievementOut(BaseModel):
    id: str
    key: str
    title: str
    description: str
    category: str
    icon_name: str
    points_reward: int
    is_unlocked: bool = False
    current_progress: int = 0
    target_progress: int = 1
    unlocked_at: Optional[datetime] = None

class GamificationActivityOut(BaseModel):
    id: str
    activity_type: str
    points_earned: int
    description: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class LeaderboardUserOut(BaseModel):
    rank: int
    user_id: str
    name: str
    store_name: str
    points: int
    level: int
    rank_title: str
    badge_count: int
    is_current_user: bool = False

class GamificationOverviewOut(BaseModel):
    total_points: int
    level: int
    rank_title: str
    streak_days: int
    points_to_next_level: int
    next_level_points: int
    level_progress_pct: float
    completed_achievements_count: int
    total_achievements_count: int
    achievements: List[AchievementOut]
    recent_activities: List[GamificationActivityOut]

class ClaimTaskRequest(BaseModel):
    task_key: str
    task_title: str

# ----------------- AI Growth Features -----------------

# Feature 1: Multi-Agent AI Team
class AgentFinding(BaseModel):
    specialist: str
    role: str
    status: str = "completed"
    headline: str
    metrics: Dict[str, Any] = Field(default_factory=dict)
    key_finding: str
    recommendation: str
    confidence_score: float = 0.95

class ActionPlanItem(BaseModel):
    priority: str  # high, medium, low
    title: str
    description: str
    expected_impact: str
    action_category: str  # sales, inventory, marketing

class ManagerPlan(BaseModel):
    weekly_theme: str
    executive_summary: str
    actions: List[ActionPlanItem]
    generated_at: str

class AgentRunResponse(BaseModel):
    id: str
    store_id: str
    sales_finding: Dict[str, Any]
    inventory_finding: Dict[str, Any]
    marketing_finding: Dict[str, Any]
    manager_plan: Dict[str, Any]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# Feature 2: Churn Prediction & Win-Back
class AtRiskCustomerOut(BaseModel):
    id: str
    name: str
    email: str
    phone: Optional[str] = None
    whatsapp: Optional[str] = None
    days_inactive: int
    last_order_at: Optional[datetime] = None
    orders_count: int
    total_spent: float
    risk_level: str  # High, Medium, Low
    last_product_name: Optional[str] = None
    currency: str = "PKR"

    model_config = ConfigDict(from_attributes=True)

class WinBackListResponse(BaseModel):
    customers: List[AtRiskCustomerOut]
    total_at_risk: int
    high_risk_count: int
    medium_risk_count: int
    low_risk_count: int
    potential_revenue_at_risk: float

class CustomerWhatsappUpdate(BaseModel):
    whatsapp: str

class WinBackMessageRequest(BaseModel):
    customer_id: str
    discount_code: Optional[str] = "WELCOMEBACK"

class WinBackMessageResponse(BaseModel):
    customer_id: str
    customer_name: str
    whatsapp: Optional[str] = None
    message: str
    wa_link: Optional[str] = None

# Feature 3: Inventory and Restock Alerts
class InventoryAlertItem(BaseModel):
    id: str
    title: str
    sku: Optional[str] = None
    category_name: Optional[str] = None
    price: float
    inventory_quantity: int
    reorder_level: int
    daily_velocity: float
    days_left: Optional[int] = None
    status: str  # Out of stock, Low stock, Healthy
    suggested_restock_qty: int
    restock_reason: str
    estimated_restock_cost: float

    model_config = ConfigDict(from_attributes=True)

class InventoryAlertsResponse(BaseModel):
    items: List[InventoryAlertItem]
    total_skus: int
    low_stock_count: int
    out_of_stock_count: int
    healthy_count: int
    estimated_reorder_cost: float

class ReorderLevelUpdate(BaseModel):
    reorder_level: int = Field(..., ge=0)

# Feature 4: AI Content Generator
class ContentGenerateRequest(BaseModel):
    product_id: str
    content_type: str = "description"  # description, ad_copy, social_post
    tone: str = "friendly"  # friendly, premium, urgent

class ContentVariation(BaseModel):
    id: int
    title: str
    headline: str
    body: str
    call_to_action: str
    tags: List[str] = Field(default_factory=list)
    char_count: int = 0

class ContentGenerateResponse(BaseModel):
    product_id: str
    product_title: str
    content_type: str
    tone: str
    variations: List[ContentVariation]


