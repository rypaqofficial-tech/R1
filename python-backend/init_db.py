from sqlmodel import SQLModel, create_engine, text
import os
from dotenv import load_dotenv
# IMPORTANT: Import your models so SQLModel knows what tables to create
from .models import * load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)

def initialize_database():
    try:
        # This is the "Builder" command - it creates the .db file and all tables
        print("--- Building Infrastructure... ---")
        SQLModel.metadata.create_all(engine)
        
        with engine.connect() as connection:
            result = connection.execute(text("SELECT 'Architecture Verified!'"))
            print(f"--- SUCCESS: {result.all()[0][0]} ---")
    except Exception as e:
        print(f"--- FAILURE: {e} ---")

if __name__ == "__main__":
    initialize_database()
