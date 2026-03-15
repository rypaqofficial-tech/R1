from app.core.security import create_access_token
from app.models import User
from sqlmodel import Session, select
from typing import Optional

def authenticate_user(db: Session, email: str, open_id: str = "demo") -> Optional[str]:
    user = db.exec(select(User).where(User.email == email)).first()
    if not user:
        user = User(open_id=open_id, email=email, name="Demo User", role="analyst", tier="free")
        db.add(user)
        db.commit()
    token = create_access_token({"sub": str(user.id), "email": user.email})
    return token