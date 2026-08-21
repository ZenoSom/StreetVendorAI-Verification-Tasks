from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

try:
    from api import models
    from api.database import get_db
    from api.schemas import (
        GovernmentSchemeResponse,
        TrainingProgramResponse,
        SupplierCatalogResponse,
        LicenseGuideResponse
    )
except ImportError:
    import models
    from database import get_db
    from schemas import (
        GovernmentSchemeResponse,
        TrainingProgramResponse,
        SupplierCatalogResponse,
        LicenseGuideResponse
    )

router = APIRouter(
    prefix="/hub",
    tags=["Vendor Hub"]
)

@router.get("/eligibility/{vendor_id}", response_model=List[GovernmentSchemeResponse])
def get_eligible_schemes(vendor_id: int, db: Session = Depends(get_db)):
    vendor = db.query(models.Vendor).filter(models.Vendor.id == vendor_id).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
        
    # Simple rule engine: match by business_type or "All"
    schemes = db.query(models.GovernmentScheme).filter(
        (models.GovernmentScheme.target_business_type == vendor.business_type) |
        (models.GovernmentScheme.target_business_type == 'All')
    ).all()
    
    return schemes

@router.get("/training", response_model=List[TrainingProgramResponse])
def get_training_programs(db: Session = Depends(get_db)):
    return db.query(models.TrainingProgram).all()

@router.get("/sourcing/{category}", response_model=List[SupplierCatalogResponse])
def get_suppliers(category: str, db: Session = Depends(get_db)):
    # Filter by category, or return all if 'all' is passed
    if category.lower() == 'all':
        return db.query(models.SupplierCatalog).all()
    
    return db.query(models.SupplierCatalog).filter(
        models.SupplierCatalog.category.ilike(f"%{category}%")
    ).all()

@router.get("/license-guide/{vendor_id}", response_model=LicenseGuideResponse)
def get_license_guide(vendor_id: int, db: Session = Depends(get_db)):
    vendor = db.query(models.Vendor).filter(models.Vendor.id == vendor_id).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
        
    missing_licenses = []
    guide_steps = []
    
    if not vendor.has_license:
        # Determine the type of license based on business type
        if "Food" in vendor.business_type or "Beverage" in vendor.business_type:
            missing_licenses.append("FSSAI Registration")
            guide_steps = [
                "1. Visit the FoSCoS FSSAI website (foscos.fssai.gov.in).",
                "2. Register as a Petty Food Business Operator.",
                "3. Upload your photo and an ID proof (Aadhaar/PAN).",
                "4. Pay the ₹100 annual fee.",
                "5. Download your FSSAI certificate within 7-30 days."
            ]
        else:
            missing_licenses.append("Municipal Vending Certificate")
            guide_steps = [
                "1. Visit your local Municipal Corporation office.",
                "2. Submit the Town Vending Committee (TVC) application form.",
                "3. Attach your Aadhaar card and a photograph.",
                "4. Your survey will be verified by the local TVC.",
                "5. Receive your ID card and Certificate of Vending (CoV)."
            ]
            
    return LicenseGuideResponse(
        vendor_id=vendor_id,
        missing_licenses=missing_licenses,
        guide_steps=guide_steps
    )
