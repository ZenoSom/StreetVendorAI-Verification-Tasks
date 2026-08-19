from sqlalchemy import Boolean, Float, Integer, String, Text
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class Vendor(Base):
    __tablename__ = "vendors"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    mobile: Mapped[str] = mapped_column(String(20), nullable=False)
    location: Mapped[str] = mapped_column(String(200), nullable=False)
    business_name: Mapped[str] = mapped_column(String(150), nullable=False)
    business_type: Mapped[str] = mapped_column(String(100), nullable=False)
    products: Mapped[str] = mapped_column(Text, nullable=False)
    monthly_income: Mapped[float] = mapped_column(Float, nullable=False)
    has_upi: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    has_bank_account: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    has_license: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
