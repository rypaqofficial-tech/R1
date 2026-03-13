from sqlmodel import create_engine, text
import os
from dotenv import load_dotenv

# 1. Load your .env file
load_dotenv()

# 2. Get the URL (Make sure this matches your .env exactly!)
DATABASE_URL = os.getenv("DATABASE_URL")

# 3. Create the engine
engine = create_engine(DATABASE_URL)

def test_connection():
    try:
        with engine.connect() as connection:
            # We perform a simple SQL "handshake"
            result = connection.execute(text("SELECT 'Connection Successful!'"))
            print(f"--- SUCCESS: {result.all()[0][0]} ---")
    except Exception as e:
        print(f"--- FAILURE: {e} ---")

if __name__ == "__main__":
    test_connection()
