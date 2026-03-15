import json
from app.models import Portfolio
from sqlmodel import Session

def create_portfolio(db: Session, user_id: int, data: dict):
    portfolio = Portfolio(
        user_id=user_id,
        name=data.get("name", "New Portfolio"),
        deals=json.dumps(data.get("deals", []))
    )
    db.add(portfolio)
    db.commit()
    return {"id": portfolio.id, "status": "created"}