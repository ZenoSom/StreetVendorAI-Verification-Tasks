from typing import Optional, List, Union
from pydantic import BaseModel, ConfigDict, field_validator
from datetime import datetime


class VendorCreate(BaseModel):
    name: str
    mobile: str
    location: str
    business_name: str
    business_type: str
    products: str
    monthly_income: Optional[float] = 0.0
    has_upi: Union[bool, str] = False
    has_bank_account: Union[bool, str] = False
    has_license: Union[bool, str] = False

    @field_validator("has_upi", "has_bank_account", "has_license", mode="before")
    def parse_bool_fields(cls, v):
        if isinstance(v, str):
            return v.lower() in ("yes", "true", "1")
        return bool(v)


class VendorResponse(BaseModel):
    id: int
    name: str
    mobile: str
    location: str
    business_name: str
    business_type: str
    products: str
    monthly_income: float
    has_upi: bool
    has_bank_account: bool
    has_license: bool
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class SaleRecordCreate(BaseModel):
    vendor_id: int
    units_sold: float
    revenue_amount: Optional[float] = 0.0
    is_auto_recorded: Optional[bool] = False


class SaleRecordResponse(BaseModel):
    id: int
    vendor_id: int
    date: datetime
    units_sold: float
    revenue_amount: float
    weather_condition: str
    temperature_c: float
    is_auto_recorded: bool

    model_config = ConfigDict(from_attributes=True)


class ForecastInput(BaseModel):
    vendor_id: Optional[int] = None
    yesterday_sales: Optional[float] = None
    auto_record: Optional[bool] = False


class InventoryInput(BaseModel):
    vendor_id: Optional[int] = None
    forecast_demand: float
    current_stock: float
    safety_stock: Optional[float] = 5.0


class FinanceInput(BaseModel):
    cost_per_unit: float
    target_margin_pct: Optional[float] = 35.0
    daily_sales_units: float


class FinanceResponse(BaseModel):
    suggested_price: float
    cost_per_unit: float
    expected_daily_revenue: float
    expected_daily_profit: float
    daily_savings_recommendation: float
    pricing_advice: str
    savings_tip: str


class PurchaseOrderCreate(BaseModel):
    vendor_id: int
    supplier_name: str
    item_name: str
    quantity: float
    total_cost: Optional[float] = 0.0


class PurchaseOrderResponse(BaseModel):
    id: int
    vendor_id: int
    supplier_name: str
    item_name: str
    quantity: float
    total_cost: float
    status: str
    order_date: datetime

    model_config = ConfigDict(from_attributes=True)


class SchemeItem(BaseModel):
    title: str
    category: str
    description: str
    benefit: str
    eligibility: str
    apply_url: str


class MarketAccessResponse(BaseModel):
    schemes: List[SchemeItem]
    local_suppliers: List[dict]
    online_channels: List[dict]


class DeliveryRequest(BaseModel):
    vendor_name: str
    forecast_demand: float
    recommended_purchase: float
    suggested_price: float
    daily_savings: float
    channel: str = "mobile"  # mobile, sms, voice


class DeliveryResponse(BaseModel):
    channel: str
    status: str
    sms_text: Optional[str] = None
    voice_script: Optional[str] = None


