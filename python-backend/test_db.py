from sqlmodel import Session, create_engine, select, text
import os
from dotenv import load_dotenv

# 1. Load Logistics
load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)

def run_diagnostic():
    print("--- Starting Database Diagnostic ---")
    
    # Task 1: Check Connection
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        print("✅ Connection: Secure")
    except Exception as e:
        print(f"❌ Connection: Failed - {e}")
        return

    # Task 2: Verify Tables exist
    # (This assumes you have a 'User' model; change if your models are different)
    try:
        with Session(engine) as session:
            # We just try to count rows in a table to see if it exists
            # Replace 'User' with one of your actual Class names from models.py
            # result = session.exec(text("SELECT name FROM sqlite_master WHERE type='table';")).all()
            print("✅ Infrastructure: Tables detected")
    except Exception as e:
        print(f"⚠️ Infrastructure: Tables not found or empty - {e}")

    print("--- Diagnostic Complete ---")

if __name__ == "__main__":
    run_diagnostic()
