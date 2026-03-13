import os
from sqlmodel import create_engine
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

# echo=True is helpful for now; it shows you the raw SQL in your terminal
engine = create_engine(DATABASE_URL, echo=True)
