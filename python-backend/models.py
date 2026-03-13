from datetime import datetime
from enum import Enum
from typing import Optional, Dict, Any
from sqlmodel import Field, SQLModel, Column, JSON
from decimal import Decimal

# 1. TRANSLATING ENUMS (Logic: Must match your original "mysqlEnum" values)
class Role(str, Enum):
    analyst = "analyst"
    investor = "investor"
    admin = "admin"

class Tier(str, Enum):
    free = "free"
    pro = "pro"
    enterprise = "enterprise"

# 2. TRANSLATING THE USER TABLE (Logic: Identical to your Drizzle users table)
class User(SQLModel, table=True):
    __tablename__ = "users"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    openId: str = Field(max_length=64, unique=True, nullable=False)
    name: Optional[str] = None
    email: Optional[str] = Field(max_length=320)
    loginMethod: Optional[str] = Field(max_length=64)
    role: Role = Field(default=Role.analyst)
    firm: Optional[str] = Field(max_length=255)
    tier: Tier = Field(default=Tier.free)
    predictionsUsed: int = Field(default=0)
    createdAt: datetime = Field(default_factory=datetime.now)
    # The 'onupdate' logic ensures the timestamp changes when data changes
    updatedAt: datetime = Field(
        default_factory=datetime.now, 
        sa_column_kwargs={"onupdate": datetime.now}
    )

# 3. TRANSLATING PREDICTIONS (Logic: Keeps your financial metrics intact)
class Prediction(SQLModel, table=True):
    __tablename__ = "predictions"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    userId: int = Field(foreign_key="users.id") # Relationship logic
    gdpGrowth: float
    inflation: float
    revenueGrowth: float
    debtRatio: float
    volatility: float
    riskScore: float
    predictedIrr: float
    # JSON logic for your SHAP values (AI explanations)
    shapValues: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))
    createdAt: datetime = Field(default_factory=datetime.now)

# --- Continuing in models.py ---

class DealStatus(str, Enum):
    active = "active"
    monitoring = "monitoring"
    exited = "exited"
    watchlist = "watchlist"

class Deals(SQLModel, table=True):
    __tablename__ = "deals"
    id: Optional[int] = Field(default=None, primary_key=True)
    userId: int = Field(foreign_key="users.id")
    name: str = Field(max_length=255)
    sector: Optional[str] = Field(max_length=64)
    status: DealStatus = Field(default=DealStatus.active)
    predictionId: Optional[int] = None
    notes: Optional[str] = None
    # Precision 18, Scale 2 matches your Drizzle decimal logic
    investmentAmount: Optional[Decimal] = Field(default=None, max_digits=18, decimal_places=2)
    currency: str = Field(default="KES", max_length=8)
    createdAt: datetime = Field(default_factory=datetime.now)
    updatedAt: datetime = Field(
        default_factory=datetime.now, 
        sa_column_kwargs={"onupdate": datetime.now}
    )

class Portfolios(SQLModel, table=True):
    __tablename__ = "portfolios"
    id: Optional[int] = Field(default=None, primary_key=True)
    userId: int = Field(foreign_key="users.id")
    name: str = Field(max_length=255)
    description: Optional[str] = None
    totalCompanies: int = Field(default=0)
    avgRisk: Optional[float] = None
    portfolioIrr: Optional[float] = None
    totalAum: Optional[Decimal] = Field(default=None, max_digits=18, decimal_places=2)
    currency: str = Field(default="KES", max_length=8)
    createdAt: datetime = Field(default_factory=datetime.now)
    updatedAt: datetime = Field(default_factory=datetime.now, sa_column_kwargs={"onupdate": datetime.now})

class AlertType(str, Enum):
    high_risk = "high_risk"
    opportunity = "opportunity"
    macro_change = "macro_change"
    model_drift = "model_drift"
    system = "system"

class Severity(str, Enum):
    info = "info"
    warning = "warning"
    critical = "critical"

class Alerts(SQLModel, table=True):
    __tablename__ = "alerts"
    id: Optional[int] = Field(default=None, primary_key=True)
    userId: int = Field(foreign_key="users.id")
    type: AlertType
    severity: Severity = Field(default=Severity.info)
    title: str = Field(max_length=255)
    message: str
    isRead: bool = Field(default=False)
    
    # We rename the Python attribute to 'alert_metadata'
    # but we use 'alias="metadata"' so the MySQL column is still named 'metadata'
    alert_metadata: Optional[Dict[str, Any]] = Field(
        default=None, 
        sa_column=Column("metadata", JSON) 
    )
    
    createdAt: datetime = Field(default_factory=datetime.now)

class Subscriptions(SQLModel, table=True):
    __tablename__ = "subscriptions"
    id: Optional[int] = Field(default=None, primary_key=True)
    userId: int = Field(foreign_key="users.id", unique=True)
    tier: Tier = Field(default=Tier.free)
    stripeCustomerId: Optional[str] = Field(max_length=255)
    stripeSubscriptionId: Optional[str] = Field(max_length=255)
    status: str = Field(default="active")
    currentPeriodStart: Optional[datetime] = None
    currentPeriodEnd: Optional[datetime] = None
    createdAt: datetime = Field(default_factory=datetime.now)
    updatedAt: datetime = Field(default_factory=datetime.now, sa_column_kwargs={"onupdate": datetime.now})

class MacroCache(SQLModel, table=True):
    __tablename__ = "macroCache"
    id: Optional[int] = Field(default=None, primary_key=True)
    indicator: str = Field(max_length=64, unique=True)
    value: float
    source: Optional[str] = Field(max_length=64)
    fetchedAt: datetime = Field(default_factory=datetime.now)
