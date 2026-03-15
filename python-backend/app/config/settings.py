from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    DATABASE_URL: str
    GOOGLE_API_KEY: str = ""
    FORGE_API_KEY: str = ""
    FORGE_API_URL: str = "https://forge.manus.im"
    SECRET_KEY: str = "change-this-in-production-to-a-very-long-random-string"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
