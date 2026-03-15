from sqlmodel import SQLModel, Field
from datetime import datetime
from typing import Optional

class User(SQLModel, table=True):
    id: int = Field(primary_key=True)
    open_id: str
    email: str
    role: str = "analyst"
    tier: str = "free"
    name: Optional[str] = None

class Prediction(SQLModel, table=True):
    id: int = Field(primary_key=True)
    user_id: int
    risk_score: float
    predicted_irr: float
    confidence: float
    risk_label: str
    shap_values: str
    created_at: datetime = Field(default_factory=datetime.now)

class Portfolio(SQLModel, table=True):
    id: int = Field(primary_key=True)
    user_id: int
    name: str
    deals: str  # JSON string
