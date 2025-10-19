import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def get_db_engine():
    """
    Create and return a SQLAlchemy engine using PostgreSQL credentials
    from the .env file.
    """
    user = os.getenv("DB_USER")
    password = os.getenv("DB_PASSWORD")
    host = os.getenv("DB_HOST")
    port = os.getenv("DB_PORT")
    database = os.getenv("DB_NAME")

    # Build connection URL
    db_url = f"postgresql+psycopg2://{user}:{password}@{host}:{port}/{database}"

    try:
        engine = create_engine(db_url)
        # Test connection using text()
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        print("✅ Connected to PostgreSQL successfully.", flush=True)
        return engine
    except Exception as e:
        print("❌ Database connection failed:", e, flush=True)
        raise
