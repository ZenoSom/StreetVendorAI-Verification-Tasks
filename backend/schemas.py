from pydantic import BaseModel, ConfigDict


class VendorCreate(BaseModel):
    name: str
    mobile: str
    location: str
    business_name: str
    business_type: str
    products: str
    monthly_income: float
    has_upi: bool = False
    has_bank_account: bool = False
    has_license: bool = False


class VendorResponse(VendorCreate):
    id: int

    model_config = ConfigDict(from_attributes=True)
