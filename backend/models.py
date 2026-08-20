from sqlalchemy import Boolean, Float, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from datetime import datetime
from typing import List


class Base(DeclarativeBase):
    pass


class Vendor(Base):
    __tablename__ = "vendors"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    mobile: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    location: Mapped[str] = mapped_column(String(200), nullable=False)
    business_name: Mapped[str] = mapped_column(String(150), nullable=False)
    business_type: Mapped[str] = mapped_column(String(100), nullable=False)
    products: Mapped[str] = mapped_column(Text, nullable=False)
    monthly_income: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    has_upi: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    has_bank_account: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    has_license: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    sales: Mapped[List["SaleRecord"]] = relationship("SaleRecord", back_populates="vendor", cascade="all, delete-orphan")
    orders: Mapped[List["PurchaseOrder"]] = relationship("PurchaseOrder", back_populates="vendor", cascade="all, delete-orphan")


class SaleRecord(Base):
    __tablename__ = "sales_records"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    vendor_id: Mapped[int] = mapped_column(Integer, ForeignKey("vendors.id"), nullable=False)
    date: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    units_sold: Mapped[float] = mapped_column(Float, nullable=False)
    revenue_amount: Mapped[float] = mapped_column(Float, default=0.0)
    weather_condition: Mapped[str] = mapped_column(String(100), default="Clear")
    temperature_c: Mapped[float] = mapped_column(Float, default=28.0)
    is_auto_recorded: Mapped[bool] = mapped_column(Boolean, default=False)

    vendor: Mapped["Vendor"] = relationship("Vendor", back_populates="sales")


class InventoryItem(Base):
    __tablename__ = "inventory_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    vendor_id: Mapped[int] = mapped_column(Integer, ForeignKey("vendors.id"), nullable=False)
    item_name: Mapped[str] = mapped_column(String(100), nullable=False)
    current_stock: Mapped[float] = mapped_column(Float, default=0.0)
    unit_cost: Mapped[float] = mapped_column(Float, default=0.0)
    safety_stock: Mapped[float] = mapped_column(Float, default=5.0)


class PurchaseOrder(Base):
    __tablename__ = "purchase_orders"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    vendor_id: Mapped[int] = mapped_column(Integer, ForeignKey("vendors.id"), nullable=False)
    supplier_name: Mapped[str] = mapped_column(String(150), nullable=False)
    item_name: Mapped[str] = mapped_column(String(100), nullable=False)
    quantity: Mapped[float] = mapped_column(Float, nullable=False)
    total_cost: Mapped[float] = mapped_column(Float, default=0.0)
    status: Mapped[str] = mapped_column(String(50), default="Confirmed")  # Placed, Confirmed, Dispatched, Delivered
    order_date: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    vendor: Mapped["Vendor"] = relationship("Vendor", back_populates="orders")

