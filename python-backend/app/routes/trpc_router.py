from fastapi import APIRouter, Request, Depends, HTTPException
from sqlmodel import Session, select
from app.models import User, Prediction, Portfolio
from app.services.risk_service import pesa_risk_inference, RiskInput
from app.services.macro_service import fetch_macro_data
from app.services.forecast_service import build_forecast
from app.services.portfolio_service import create_portfolio
from app.services.auth_service import authenticate_user
from app.config.settings import settings
from app.core.security import verify_token
from database import engine
import json

router = APIRouter()

def get_db():
    with Session(engine) as session:
        yield session

def get_current_user(token: str = Depends(verify_token)):
    if not token:
        raise HTTPException(401, "Invalid or missing token")
    return int(token.get("sub"))

@router.post("/api/trpc/{path:path}")
async def trpc_handler(path: str, request: Request, db: Session = Depends(get_db)):
    body = await request.json()
    calls = body if isinstance(body, list) else [body]
    results = []

    for call in calls:
        proc = path.split(".")[-1]
        input_data = call.get("input", {}) if isinstance(call, dict) else {}

        try:
            if proc == "health":
                res = {"ok": True, "platform": "Rypaq R1 Website"}

            elif proc == "pesaRiskPredict":
                risk_input = RiskInput(**input_data)
                res = pesa_risk_inference(risk_input)

            elif proc == "getMacroData":
                res = await fetch_macro_data()

            elif proc == "invokeLLM":
                res = {"response": "Gemini AI Insights ready when you add GOOGLE_API_KEY", "model": "gemini-2.5-flash"}

            elif proc == "login":
                token = authenticate_user(db, input_data.get("email", "demo@rypaq.com"))
                res = {"token": token, "user": {"email": input_data.get("email")}}

            elif proc == "savePrediction":
                user_id = get_current_user()
                pred = Prediction(user_id=user_id, **input_data)
                db.add(pred)
                db.commit()
                res = {"id": pred.id, "status": "saved"}

            elif proc == "getUserPredictions":
                user_id = get_current_user()
                preds = db.exec(select(Prediction).where(Prediction.user_id == user_id)).all()
                res = [p.model_dump() for p in preds]

            elif proc == "createPortfolio":
                user_id = get_current_user()
                res = create_portfolio(db, user_id, input_data)

            else:
                res = {"success": True}

            results.append({"result": {"data": res}})

        except Exception as e:
            results.append({"error": {"message": str(e)}})

    return results[0] if len(results) == 1 else results