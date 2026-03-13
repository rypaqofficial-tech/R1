from sqlmodel import SQLModel
from database import engine  # This imports the engine we created earlier
import models                # This imports all your new Python classes

def create_db_and_tables():
    print("--- Connecting to MySQL and Building Infrastructure ---")
    # This is the "Magic" command that creates the tables in MySQL
    SQLModel.metadata.create_all(engine)
    print("--- SUCCESS: All tables created in rypaq_db! ---")

if __name__ == "__main__":
    create_db_and_tables()
