import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import datetime
import uuid
import random
from pydantic import BaseModel

try:
    from api import models
    from api.database import engine, get_db
    from api.schemas import (
        VendorCreate, VendorResponse,
        SaleRecordCreate, SaleRecordResponse,
        ForecastInput, InventoryInput,
        FinanceInput, FinanceResponse,
        PurchaseOrderCreate, PurchaseOrderResponse,
        MarketAccessResponse, SchemeItem,
        DeliveryRequest, DeliveryResponse,
        UPITransactionResponse
    )
    from api.ml_forecaster import calculate_statistical_forecast, fetch_live_weather
    from api.vendor_hub import router as vendor_hub_router
except ImportError:
    import models
    from database import engine, get_db
    from schemas import (
        VendorCreate, VendorResponse,
        SaleRecordCreate, SaleRecordResponse,
        ForecastInput, InventoryInput,
        FinanceInput, FinanceResponse,
        PurchaseOrderCreate, PurchaseOrderResponse,
        MarketAccessResponse, SchemeItem,
        DeliveryRequest, DeliveryResponse,
        UPITransactionResponse
    )
    from ml_forecaster import calculate_statistical_forecast, fetch_live_weather
    from vendor_hub import router as vendor_hub_router

# Create database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="StreetVendorAI API",
    description="AI-powered digital platform for street vendors",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(vendor_hub_router)



@app.get("/")
def home():
    return {
        "message": "Welcome to StreetVendorAI Real Working API",
        "status": "Backend is live with SQLite Database & ML Forecaster Engine"
    }


@app.get("/health")
def health_check():
    return {"status": "healthy", "database": "connected"}


# ---------------- VENDOR PROFILE API ----------------

@app.post("/vendors", response_model=VendorResponse)
def create_vendor(vendor: VendorCreate, db: Session = Depends(get_db)):
    # Check if mobile already registered
    existing = db.query(models.Vendor).filter(models.Vendor.mobile == vendor.mobile).first()
    if existing:
        return existing

    new_vendor = models.Vendor(
        name=vendor.name,
        mobile=vendor.mobile,
        location=vendor.location,
        business_name=vendor.business_name,
        business_type=vendor.business_type,
        products=vendor.products,
        monthly_income=vendor.monthly_income or 0.0,
        has_upi=bool(vendor.has_upi),
        has_bank_account=bool(vendor.has_bank_account),
        has_license=bool(vendor.has_license)
    )

    db.add(new_vendor)
    db.commit()
    db.refresh(new_vendor)
    return new_vendor


@app.get("/vendors", response_model=List[VendorResponse])
def get_vendors(db: Session = Depends(get_db)):
    return db.query(models.Vendor).all()


@app.get("/vendors/{vendor_id}", response_model=VendorResponse)
def get_vendor_by_id(vendor_id: int, db: Session = Depends(get_db)):
    v = db.query(models.Vendor).filter(models.Vendor.id == vendor_id).first()
    if not v:
        raise HTTPException(status_code=404, detail="Vendor not found")
    return v


# ---------------- VENDOR PROFILE API ----------------

class CashTransactionCreate(BaseModel):
    vendor_id: int
    amount: float
    items_sold: str

@app.post("/cash-transaction", response_model=UPITransactionResponse)
def record_cash_transaction(txn: CashTransactionCreate, db: Session = Depends(get_db)):
    db_txn = models.UPITransaction(
        vendor_id=txn.vendor_id,
        transaction_id=f"CSH{uuid.uuid4().hex[:12].upper()}",
        payer_name="Walk-in Customer",
        payer_vpa="CASH",
        amount=txn.amount,
        items_sold=txn.items_sold,
        status="SUCCESS"
    )
    db.add(db_txn)
    db.commit()
    db.refresh(db_txn)
    return db_txn

@app.post("/upi/sync/{vendor_id}", response_model=List[UPITransactionResponse])
def sync_live_upi_transactions(vendor_id: int, db: Session = Depends(get_db)):
    # Sandbox Simulation: Generate 1 to 3 random UPI transactions
    v = db.query(models.Vendor).filter(models.Vendor.id == vendor_id).first()
    if not v:
        raise HTTPException(status_code=404, detail="Vendor not found")

    names = ["Rahul", "Priya", "Amit", "Sneha", "Vikram", "Anjali"]
    banks = ["okicici", "okhdfcbank", "oksbi", "paytm", "apl"]
    
    num_txns = random.randint(1, 3)
    new_txns = []
    total_amount = 0.0
    
    for _ in range(num_txns):
        # 10% chance of a bulk catering order between ₹1000 and ₹10000
        if random.random() < 0.1:
            amount = float(random.randint(1000, 10000))
        else:
            amount = random.choice([20.0, 30.0, 50.0, 100.0, 150.0])
            
        payer = random.choice(names)
        bank = random.choice(banks)
        vendor_products = [p.strip() for p in v.products.split(",")] if v.products else ["Item"]
        
        if amount >= 1000:
            items_str = f"Bulk Catering Order: {random.randint(50, 200)}x {random.choice(vendor_products)}"
        else:
            # Pick 1 or 2 random products and a random quantity for each
            selected_products = random.sample(vendor_products, k=random.randint(1, min(2, len(vendor_products))))
            items_list = [f"{random.randint(1, 3)}x {p}" for p in selected_products]
            items_str = ", ".join(items_list)

        txn = models.UPITransaction(
            vendor_id=vendor_id,
            transaction_id=f"UPI{uuid.uuid4().hex[:12].upper()}",
            payer_name=payer,
            payer_vpa=f"{payer.lower()}@{bank}",
            amount=amount,
            items_sold=items_str,
            status="SUCCESS"
        )
        db.add(txn)
        new_txns.append(txn)
        total_amount += amount
    
    db.commit()
    
    # Auto-log a SaleRecord covering these transactions
    if total_amount > 0:
        weather_info = fetch_live_weather(v.location)
        auto_sale = models.SaleRecord(
            vendor_id=vendor_id,
            units_sold=num_txns * 2.0, # Approximate units based on txns
            revenue_amount=total_amount,
            weather_condition=weather_info["condition"],
            temperature_c=weather_info["temperature_c"],
            is_auto_recorded=True
        )
        db.add(auto_sale)
        db.commit()

    for txn in new_txns:
        db.refresh(txn)

    return new_txns


# ---------------- SALES RECORDS & ML FORECASTING API ----------------

@app.post("/sales", response_model=SaleRecordResponse)
def record_sale(sale: SaleRecordCreate, db: Session = Depends(get_db)):
    v = db.query(models.Vendor).filter(models.Vendor.id == sale.vendor_id).first()
    weather_info = fetch_live_weather(v.location if v else "Delhi")

    new_sale = models.SaleRecord(
        vendor_id=sale.vendor_id,
        units_sold=sale.units_sold,
        revenue_amount=sale.revenue_amount or 0.0,
        weather_condition=weather_info["condition"],
        temperature_c=weather_info["temperature_c"],
        is_auto_recorded=bool(sale.is_auto_recorded)
    )

    db.add(new_sale)
    db.commit()
    db.refresh(new_sale)
    return new_sale


@app.get("/sales/{vendor_id}", response_model=List[SaleRecordResponse])
def get_sales_history(vendor_id: int, db: Session = Depends(get_db)):
    return db.query(models.SaleRecord).filter(models.SaleRecord.vendor_id == vendor_id).order_by(models.SaleRecord.date.desc()).all()


@app.post("/forecast")
def demand_forecast(req: ForecastInput, db: Session = Depends(get_db)):
    sales_history = []
    location = "Connaught Place, New Delhi"

    if req.vendor_id:
        v = db.query(models.Vendor).filter(models.Vendor.id == req.vendor_id).first()
        if v:
            location = v.location
            db_sales = db.query(models.SaleRecord).filter(models.SaleRecord.vendor_id == req.vendor_id).order_by(models.SaleRecord.date.asc()).all()
            sales_history = [s.units_sold for s in db_sales]

    if not sales_history and req.yesterday_sales is not None:
        sales_history = [req.yesterday_sales]

    if not sales_history:
        sales_history = [100.0]  # Standard baseline fallback

    forecast_units, confidence, trend_msg, weather_info = calculate_statistical_forecast(
        sales_history=sales_history,
        location=location,
        auto_record=bool(req.auto_record)
    )

    return {
        "yesterday_sales": sales_history[-1],
        "forecast_demand": forecast_units,
        "confidence": confidence,
        "trend": trend_msg,
        "weather": weather_info,
        "message": f"ML statistical forecast computed using {len(sales_history)} historical sale entries & live weather signals!"
    }


# ---------------- INVENTORY & PURCHASE ORDERS API ----------------

@app.post("/inventory")
def inventory_planner(inventory: InventoryInput):
    required_stock = inventory.forecast_demand + (inventory.safety_stock or 5.0)
    recommended_purchase = max(0.0, required_stock - inventory.current_stock)

    message = (
        f"Restock Advice: Purchase {round(recommended_purchase, 1)} units to prevent stockouts."
        if recommended_purchase > 0
        else "Your inventory is optimal for today's forecast."
    )

    return {
        "forecast_demand": inventory.forecast_demand,
        "current_stock": inventory.current_stock,
        "safety_stock": inventory.safety_stock or 5.0,
        "recommended_purchase": round(recommended_purchase, 1),
        "message": message
    }


@app.post("/orders", response_model=PurchaseOrderResponse)
def create_purchase_order(order: PurchaseOrderCreate, db: Session = Depends(get_db)):
    new_order = models.PurchaseOrder(
        vendor_id=order.vendor_id,
        supplier_name=order.supplier_name,
        item_name=order.item_name,
        quantity=order.quantity,
        total_cost=order.total_cost or 0.0,
        status="Confirmed"
    )

    db.add(new_order)
    db.commit()
    db.refresh(new_order)
    return new_order


@app.get("/orders/{vendor_id}", response_model=List[PurchaseOrderResponse])
def get_vendor_orders(vendor_id: int, db: Session = Depends(get_db)):
    return db.query(models.PurchaseOrder).filter(models.PurchaseOrder.vendor_id == vendor_id).order_by(models.PurchaseOrder.order_date.desc()).all()


# ---------------- FINANCIAL ASSISTANT API ----------------

@app.post("/finance", response_model=FinanceResponse)
def financial_assistant(finance: FinanceInput):
    margin_pct = finance.target_margin_pct or 35.0
    suggested_price = round(finance.cost_per_unit * (1 + margin_pct / 100.0), 2)
    expected_revenue = round(suggested_price * finance.daily_sales_units, 2)
    expected_profit = round((suggested_price - finance.cost_per_unit) * finance.daily_sales_units, 2)
    daily_savings = round(expected_profit * 0.15, 2)

    return FinanceResponse(
        suggested_price=suggested_price,
        cost_per_unit=finance.cost_per_unit,
        expected_daily_revenue=expected_revenue,
        expected_daily_profit=expected_profit,
        daily_savings_recommendation=daily_savings,
        pricing_advice=f"Setting price at ₹{suggested_price} yields a {margin_pct}% profit margin while staying competitive.",
        savings_tip=f"Save ₹{daily_savings} today into PM SVANidhi micro-savings or emergency fund."
    )


# ---------------- MARKET ACCESS & GOVERNMENT SCHEMES API ----------------

@app.get("/market-access", response_model=MarketAccessResponse)
def market_access(business_type: Optional[str] = "General"):
    schemes = [
        SchemeItem(
            title="PM SVANidhi Scheme",
            category="Government Micro-Credit",
            description="Collateral-free working capital loan up to ₹50,000 for street vendors with 7% interest subsidy & cashbacks on UPI.",
            benefit="₹10,000 to ₹50,000 working capital + 7% interest subsidy",
            eligibility="All registered street vendors with ULB certificate or recommendation letter",
            apply_url="https://pmsvanidhi.mohua.gov.in"
        ),
        SchemeItem(
            title="PM Mudra Yojana (Shishu)",
            category="Business Expansion Loan",
            description="Micro loans up to ₹50,000 for purchasing inventory, carts, or equipment.",
            benefit="Up to ₹50,000 collateral-free low interest loan",
            eligibility="Small business owners & street vendors",
            apply_url="https://www.mudra.org.in"
        ),
        SchemeItem(
            title="PM Vishwakarma Scheme",
            category="Skill & Equipment Grant",
            description="Skill training, toolkit incentive of ₹15,000 and credit support for traditional artisans & street vendors.",
            benefit="₹15,000 toolkit voucher + skill stipend",
            eligibility="Artisans, handicraft & specialized vendors",
            apply_url="https://pmvishwakarma.gov.in"
        )
    ]

    suppliers = [
        {"name": "Central Wholesale Mandi", "category": "Produce & Grains", "discount": "12% Bulk Discount", "contact": "9876500111", "distance": "1.2 km"},
        {"name": "City Packaging & Utensils Co.", "category": "Packaging & Supplies", "discount": "10% Cashback on UPI", "contact": "9876500222", "distance": "2.5 km"},
        {"name": "Express Dairy Direct", "category": "Dairy & Beverages", "discount": "Fresh daily delivery at ₹42/L", "contact": "9876500333", "distance": "0.8 km"}
    ]

    channels = [
        {"name": "ONDC Digital Store", "type": "Online Marketplace", "status": "Ready to onboard", "action": "Sync Catalog"},
        {"name": "StreetVendorAI WhatsApp Shop", "type": "Direct Customer Orders", "status": "Active", "action": "Generate QR Code"},
        {"name": "Local Neighborhood Delivery App", "type": "Hyperlocal Express", "status": "Connected", "action": "View Orders"}
    ]

    return MarketAccessResponse(schemes=schemes, local_suppliers=suppliers, online_channels=channels)


# ---------------- MULTI-CHANNEL INSIGHTS DELIVERY API ----------------

@app.post("/delivery/insights", response_model=DeliveryResponse)
def delivery_insights(req: DeliveryRequest):
    sms = (
        f"[StreetVendorAI Insight for {req.vendor_name}]\n"
        f"📊 Forecast Today: {req.forecast_demand} units.\n"
        f"📦 Restock Advice: {req.recommended_purchase} units.\n"
        f"💵 Target Price: ₹{req.suggested_price} | Save Today: ₹{req.daily_savings}.\n"
        f"Explore PM SVANidhi loan on app!"
    )

    voice_script = (
        f"Namaste {req.vendor_name}! Here is your StreetVendorAI daily update. "
        f"Today your expected demand is {req.forecast_demand} units. "
        f"We recommend purchasing {req.recommended_purchase} additional units from your local supplier. "
        f"Sell at rupees {req.suggested_price} per unit and save rupees {req.daily_savings} into your savings account today. "
        f"Have a prosperous business day!"
    )

    return DeliveryResponse(channel=req.channel, status="Sent successfully", sms_text=sms, voice_script=voice_script)