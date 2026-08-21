import datetime
from sqlalchemy.orm import Session
from database import engine, get_db
import models
import random
import uuid

models.Base.metadata.create_all(bind=engine)

def seed_data():
    db = next(get_db())
    
    # Ensure there is at least one vendor
    vendor = db.query(models.Vendor).first()
    if not vendor:
        vendor = models.Vendor(
            name="Ramesh",
            mobile="9876543210",
            location="Connaught Place, New Delhi",
            business_name="Ramesh Tea Stall",
            business_type="Beverages",
            products="Tea, Coffee, Snacks"
        )
        db.add(vendor)
        db.commit()
        db.refresh(vendor)
        
    print(f"Using vendor ID: {vendor.id}")
    
    # Generate 30 days of past sales data
    today = datetime.datetime.utcnow()
    
    for i in range(30):
        past_date = today - datetime.timedelta(days=30-i)
        
        # Simulate some trend and randomness
        base_units = 100
        trend = i * 2  # slight upward trend
    base_sales = 30
    for i in range(90):
        # Create a trend with some randomness
        current_sales = base_sales + (i * 0.2) + random.uniform(-10, 15)
        if i % 7 == 5 or i % 7 == 6: # Weekend boost
            current_sales *= 1.4
            
        weather = random.choice(["Clear", "Clear", "Clear", "Rainy", "Cloudy"])
        temp = random.uniform(25.0, 35.0)
        if weather == "Rainy":
            current_sales *= 0.6
            temp -= 3.0
            
        # Optional: Seasonal peak for the last 10 days
        if i > 80:
            current_sales *= 1.5

        sale = models.SaleRecord(
            vendor_id=vendor.id,
            date=today - datetime.timedelta(days=90-i),
            units_sold=round(current_sales),
            revenue_amount=round(current_sales * 15.0, 2),
            weather_condition=weather,
            temperature_c=round(temp, 1),
            is_auto_recorded=True
        )
        db.add(sale)
        
    db.commit()
    # Add Purchase Orders
    suppliers = ["Ramu Wholesale", "Delhi Fresh Produce", "A1 Spices & Grains", "Metro Cash & Carry", "City Distributors"]
    items = ["Tea Leaves", "Sugar", "Milk (Bulk)", "Snacks Pack", "Cooking Oil", "Paper Cups", "Spices Mix"]
    for i in range(10):
        qty = random.randint(5, 50)
        db.add(models.PurchaseOrder(
            vendor_id=vendor.id,
            supplier_name=random.choice(suppliers),
            item_name=random.choice(items),
            quantity=qty,
            total_cost=qty * random.uniform(40, 120),
            status=random.choice(["Confirmed", "Delivered", "Delivered", "Delivered"]),
            order_date=today - datetime.timedelta(days=random.randint(1, 30))
        ))
    db.commit()
    print("Added sample Purchase Orders!")

    # Add recent UPI transactions
    # 2 Bulk Orders
    for _ in range(2):
        db.add(models.UPITransaction(
            vendor_id=vendor.id,
            transaction_id=f"UPI{uuid.uuid4().hex[:12].upper()}",
            payer_name=random.choice(["Sanjay Events Co.", "Tech Park Catering", "City Wedding Planners"]),
            payer_vpa=f"corporate{random.randint(1,99)}@okhdfcbank",
            amount=random.choice([8500.0, 5400.0, 12000.0, 7500.0]),
            items_sold=f"Bulk Catering Order: {random.randint(100, 300)}x Items",
            status="SUCCESS",
            timestamp=today - datetime.timedelta(hours=random.randint(1, 48))
        ))

    # 15 Normal Transactions
    for _ in range(15):
        qty = random.randint(1, 4)
        db.add(models.UPITransaction(
            vendor_id=vendor.id,
            transaction_id=f"UPI{uuid.uuid4().hex[:12].upper()}",
            payer_name=random.choice(["Rahul", "Sneha", "Amit", "Priya", "Vikram", "Anjali", "Rohan", "Neha", "Karan"]),
            payer_vpa=f"user{random.randint(100,999)}@{random.choice(['okhdfcbank', 'okicici', 'paytm', 'ybl'])}",
            amount=random.choice([20.0, 30.0, 40.0, 50.0, 60.0, 100.0, 120.0, 150.0]),
            items_sold=f"{qty}x Tea, {random.randint(0,2)}x Coffee, {random.randint(0,3)}x Snacks",
            status="SUCCESS",
            timestamp=today - datetime.timedelta(minutes=random.randint(5, 1440))
        ))
    db.commit()
    print("Added sample UPI Transactions!")

def seed_hub_data():
    db = next(get_db())
    
    # Schemes
    if db.query(models.GovernmentScheme).count() == 0:
        schemes = [
            models.GovernmentScheme(
                title="PM SVANidhi",
                category="Credit",
                description="Micro-credit facility for street vendors",
                benefit="₹10k - ₹50k working capital loan",
                eligibility_criteria="Must have a Certificate of Vending / ID card issued by Urban Local Bodies (ULB)",
                target_business_type="All",
                apply_url="https://pmsvanidhi.mohua.gov.in"
            ),
            models.GovernmentScheme(
                title="Mudra Yojana (Shishu)",
                category="Credit",
                description="Loans for small businesses",
                benefit="Up to ₹50,000",
                eligibility_criteria="Non-corporate, non-farm small/micro enterprises",
                target_business_type="All",
                apply_url="https://www.mudra.org.in"
            ),
            models.GovernmentScheme(
                title="PMFME Scheme",
                category="Grant",
                description="Support for micro food processing enterprises",
                benefit="Credit-linked capital subsidy at 35% with maximum of ₹10 lakh",
                eligibility_criteria="Existing micro food processing units",
                target_business_type="Food Vendor",
                apply_url="https://pmfme.mofpi.gov.in"
            ),
            models.GovernmentScheme(
                title="Stand-Up India Scheme",
                category="Loan",
                description="Loans between ₹10 lakh and ₹1 Crore for SC/ST and women entrepreneurs.",
                benefit="Large Scale Funding",
                eligibility_criteria="SC/ST or Woman Entrepreneur",
                target_business_type="All",
                apply_url="https://www.standupmitra.in/"
            ),
            models.GovernmentScheme(
                title="DAY-NULM (National Urban Livelihoods Mission)",
                category="Support",
                description="Provides support for urban street vendors including skilling and micro-enterprise development.",
                benefit="Skill Training & Micro-credit",
                eligibility_criteria="Urban street vendors with valid vending certificate",
                target_business_type="All",
                apply_url="https://nulm.gov.in/"
            )
        ]
        db.add_all(schemes)
        
    # Training Programs
    if db.query(models.TrainingProgram).count() == 0:
        programs = [
            models.TrainingProgram(
                title="Digital Payments 101",
                description="Learn how to use UPI, generate QR codes, and avoid common online payment frauds.",
                module_type="Finance",
                duration_mins=15,
                video_url="https://www.youtube.com/embed/5O1xO76y25o"
            ),
            models.TrainingProgram(
                title="FSSAI Hygiene Guidelines",
                description="Essential food safety and hygiene practices for street food vendors.",
                module_type="Compliance",
                duration_mins=30,
                video_url="https://www.youtube.com/embed/cM3n8x88-oU"
            ),
            models.TrainingProgram(
                title="WhatsApp Marketing",
                description="How to use WhatsApp Business to take orders from regular customers in your area.",
                module_type="Marketing",
                duration_mins=20,
                video_url="https://www.youtube.com/embed/5m0j6sW1x8k"
            ),
            models.TrainingProgram(
                title="Waste Management Basics",
                description="How to properly dispose of waste and maintain a clean vending area to attract more customers.",
                module_type="Environment",
                duration_mins=10,
                video_url="https://www.youtube.com/embed/dummy_waste"
            ),
            models.TrainingProgram(
                title="Customer Service Excellence",
                description="Tips on communicating with customers, handling complaints, and building loyalty.",
                module_type="Business",
                duration_mins=25,
                video_url="https://www.youtube.com/embed/dummy_service"
            )
        ]
        db.add_all(programs)
        
    # Suppliers
    if db.query(models.SupplierCatalog).count() == 0:
        suppliers = [
            models.SupplierCatalog(
                name="Central Wholesale Mandi",
                category="Produce",
                location_area="Delhi",
                discount_info="12% Bulk Discount",
                contact_number="9876500111",
                rating=4.5
            ),
            models.SupplierCatalog(
                name="City Packaging & Utensils Co.",
                category="Packaging",
                location_area="Mumbai",
                discount_info="10% Cashback on UPI",
                contact_number="9876500222",
                rating=4.2
            ),
            models.SupplierCatalog(
                name="Express Dairy Direct",
                category="Dairy",
                location_area="Delhi",
                discount_info="Fresh daily delivery at ₹42/L",
                contact_number="9876500333",
                rating=4.8
            ),
            models.SupplierCatalog(
                name="Sita Ram Traders",
                category="Groceries",
                location_area="Chandni Chowk",
                discount_info="5% off on bulk lentils",
                contact_number="9876500003",
                rating=4.4
            ),
            models.SupplierCatalog(
                name="Green Leaf Packaging",
                category="Packaging",
                location_area="Okhla Industrial Area",
                discount_info="15% off on eco-friendly cups",
                contact_number="9876500004",
                rating=4.9
            ),
            models.SupplierCatalog(
                name="National Spice Co.",
                category="Spices",
                location_area="Khari Baoli",
                discount_info="Wholesale rates for vendors",
                contact_number="9876500005",
                rating=4.7
            )
        ]
        db.add_all(suppliers)
        
    db.commit()
    print("Successfully populated Vendor Hub seed data!")

if __name__ == "__main__":
    seed_data()
    seed_hub_data()
