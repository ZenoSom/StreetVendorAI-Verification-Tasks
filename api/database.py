import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Use Postgres if provided via environment variable (ideal for Vercel production)
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    # If running on Vercel serverless (where only /tmp is writable)
    if os.getenv("VERCEL"):
        DATABASE_URL = "sqlite:////tmp/streetvendor.db"
    else:
        # Local development fallback
        DATABASE_URL = "sqlite:///./streetvendor.db"

# sqlite-specific args
connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args["check_same_thread"] = False

engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
