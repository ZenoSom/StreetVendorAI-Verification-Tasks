from fastapi import FastAPI, Depends
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

import models
from database import engine, get_db
from schemas import VendorCreate, VendorResponse

class SalesInput(BaseModel):
    yesterday_sales: float

class InventoryInput(BaseModel):
    forecast_demand: float
    current_stock: float
    safety_stock: float = 5


models.Base.metadata.create_all(bind=engine)


app = FastAPI(
    title="StreetVendorAI",
    description="AI-powered platform for street vendors",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def home():
    return {
        "message": "Welcome to StreetVendorAI!",
        "status": "Backend is running"
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy"
    }


@app.post("/vendors", response_model=VendorResponse)
def create_vendor(
    vendor: VendorCreate,
    db: Session = Depends(get_db)
):

    new_vendor = models.Vendor(
        name=vendor.name,
        mobile=vendor.mobile,
        location=vendor.location,
        business_name=vendor.business_name,
        business_type=vendor.business_type,
        products=vendor.products,
        monthly_income=vendor.monthly_income,
        has_upi=vendor.has_upi,
        has_bank_account=vendor.has_bank_account,
        has_license=vendor.has_license
    )

    db.add(new_vendor)
    db.commit()
    db.refresh(new_vendor)

    return new_vendor


@app.get("/vendors")
def get_vendors(db: Session = Depends(get_db)):

    vendors = db.query(models.Vendor).all()

    return vendors

@app.post("/forecast")
def demand_forecast(sales: SalesInput):
    forecast_demand = round(sales.yesterday_sales * 1.1, 2)

    return {
        "yesterday_sales": sales.yesterday_sales,
        "forecast_demand": forecast_demand,
        "message": "Demand forecast generated successfully."
    }


@app.post("/inventory")
def inventory_planner(inventory: InventoryInput):
    required_stock = (
        inventory.forecast_demand
        + inventory.safety_stock
    )

    recommended_purchase = max(
        0,
        required_stock - inventory.current_stock
    )

    message = (
        "Additional stock is recommended for today's demand."
        if recommended_purchase > 0
        else "Your current stock is sufficient for today's demand."
    )

    return {
        "forecast_demand": inventory.forecast_demand,
        "current_stock": inventory.current_stock,
        "safety_stock": inventory.safety_stock,
        "recommended_purchase": round(recommended_purchase, 2),
        "message": message
    }