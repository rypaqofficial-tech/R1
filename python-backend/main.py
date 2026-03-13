from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Any, Dict, Optional, List
import httpx, os, json, math, random
from dotenv import load_dotenv
from sqlmodel import SQLModel, Session, create_engine, select, Field
from datetime import datetime
from fastapi.staticfiles import StaticFiles

load_dotenv()

app = FastAPI(title="Rypaq R1 - Predictive AI Platform (Python)")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "https://your-domain.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ========================= LLM PARAMS (moved to top) =========================
class LLMParams(BaseModel):
    messages: List[Dict]
    tools: Optional[List] = None
    max_tokens: Optional[int] = 32768

# ========================= ENV & DB =========================
FORGE_API_KEY = os.getenv("FORGE_API_KEY")
FORGE_API_URL = os.getenv("FORGE_API_URL", "https://forge.manus.im")
DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL, echo=False)

# ========================= TABLES =========================
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
    deals: str

SQLModel.metadata.create_all(engine)

# ========================= REAL GEMINI (only one version) =========================
@app.post("/api/invoke-llm")
async def invoke_llm(params: LLMParams):
    payload = {
        "model": "gemini-2.5-flash",
        "messages": params.messages,
        "max_tokens": params.max_tokens,
        "thinking": {"budget_tokens": 128},
    }
    if params.tools:
        payload["tools"] = params.tools

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
            json=payload,
            headers={
                "authorization": f"Bearer {os.getenv('GOOGLE_API_KEY')}",
                "content-type": "application/json"
            },
            timeout=60
        )
        if not resp.is_success:
            raise HTTPException(500, f"Gemini error: {resp.text}")
        return resp.json()

# ========================= tRPC Layer =========================
@app.post("/api/trpc/{path:path}")
async def trpc_handler(path: str, request: Request):
    body = await request.json()
    calls = body if isinstance(body, list) else [body]
    results = []
    for call in calls:
        proc = path.split(".")[-1]
        input_data = call.get("input", {}) if isinstance(call, dict) else {}
        try:
            if proc == "health":
                res = {"ok": True}
            elif proc == "pesaRiskPredict":
                res = pesa_risk_inference(input_data)
            elif proc == "getMacroData":
                res = await fetch_macro_data()
            elif proc == "invokeLLM":
                res = await invoke_llm(input_data)
            elif proc == "callDataApi":
                res = await call_data_api(input_data.get("apiId"), input_data.get("options", {}))
            elif proc == "savePrediction":
                res = save_prediction(input_data)
            elif proc == "getUserPredictions":
                res = get_user_predictions(input_data.get("user_id"))
            elif proc == "createPortfolio":
                res = create_portfolio(input_data)
            else:
                res = {"success": True}
            results.append({"result": {"data": res}})
        except Exception as e:
            results.append({"error": {"message": str(e)}})
    return results[0] if len(results) == 1 else results

# ========================= PesaRisk Net (unchanged) =========================
def pesa_risk_inference(inputs: Dict) -> Dict:
    gdp = inputs.get("gdpGrowth", 0)
    inflation = inputs.get("inflation", 0)
    revenue = inputs.get("revenueGrowth", 0)
    debt = inputs.get("debtRatio", 0)      # e.g. 35 for 35%
    vol = inputs.get("volatility", 0)      # e.g. 18 for 18%

    # === NEW BALANCED NORMALIZATION ===
    gdpN = gdp / 10
    infN = inflation / 15
    revN = (revenue + 50) / 100
    debtN = debt / 100          # ← changed from /2
    volN = vol / 100            # ← changed from /0.5

    # Hidden layers (your original weights kept)
    h1 = math.tanh(-0.4*gdpN + 0.5*infN - 0.3*revN + 0.6*debtN + 0.4*volN - 0.1)
    h2 = math.tanh(0.3*gdpN - 0.4*infN + 0.2*revN - 0.5*debtN - 0.6*volN + 0.2)
    h3 = math.tanh(-0.5*gdpN + 0.3*infN - 0.4*revN + 0.3*debtN + 0.5*volN - 0.15)

    h4 = math.tanh(0.6*h1 - 0.4*h2 + 0.3*h3)
    h5 = math.tanh(-0.3*h1 + 0.5*h2 - 0.6*h3)

    # Risk calculation (slightly softened)
    riskRaw = 0.5*h4 - 0.4*h5 + 0.25*debtN + 0.20*volN - 0.25*gdpN + 0.15*infN - 0.20*revN
    riskScore = max(0.01, min(0.99, 1 / (1 + math.exp(-riskRaw * 2.5))))  # softer sigmoid

    # IRR (unchanged)
    irrRaw = 17.5 + 3.5*gdpN + 2.0*revN - 4.0*debtN - 3.0*volN - 1.5*infN
    predictedIrr = max(5, min(35, irrRaw + (random.random() - 0.5) * 1.5))

    confidence = max(0.65, min(0.95, 0.85 - 0.08*volN + 0.06*gdpN))

    # SHAP (updated for new scaling)
    totalImpact = abs(-0.2*gdpN) + abs(0.15*infN) + abs(0.25*revN) + abs(0.25*debtN) + abs(0.20*volN)
    shap = {
        "gdpGrowth": round((-0.2 * gdpN) / totalImpact, 3),
        "inflation": round((0.15 * infN) / totalImpact, 3),
        "revenueGrowth": round((-0.25 * revN) / totalImpact, 3),
        "debtRatio": round((0.25 * debtN) / totalImpact, 3),
        "volatility": round((0.20 * volN) / totalImpact, 3),
    }

    riskLabel = "Low Risk" if riskScore < 0.3 else "Moderate Risk" if riskScore < 0.55 else "High Risk" if riskScore < 0.75 else "Critical Risk"

    return {
        "riskScore": round(riskScore, 4),
        "predictedIrr": round(predictedIrr, 2),
        "confidence": round(confidence, 3),
        "riskLabel": riskLabel,
        "riskAdjustedReturn": round(predictedIrr * (1 - riskScore), 2),
        "sharpeProxy": round(predictedIrr / max(vol, 0.01), 2),
        "shapValues": shap,
    }

# ========================= Helpers =========================
async def fetch_macro_data():
    return {"gdp": 4.72, "inflation": 4.49, "lendingRate": 13.0}

async def call_data_api(api_id: str, options: Dict = {}):
    full_url = f"{FORGE_API_URL.rstrip('/')}/webdevtoken.v1.WebDevService/CallApi"
    async with httpx.AsyncClient() as client:
        resp = await client.post(full_url, json={"apiId": api_id, **options}, headers={
            "accept": "application/json", "content-type": "application/json", "authorization": f"Bearer {FORGE_API_KEY}"
        })
        if not resp.is_success:
            raise HTTPException(500, resp.text)
        data = resp.json()
        return json.loads(data.get("jsonData", "{}")) if "jsonData" in data else data

def save_prediction(data: Dict):
    with Session(engine) as session:
        pred = Prediction(user_id=data.get("user_id"), **data)
        session.add(pred)
        session.commit()
        return {"id": pred.id, **data}

def get_user_predictions(user_id: int):
    with Session(engine) as session:
        preds = session.exec(select(Prediction).where(Prediction.user_id == user_id)).all()
        return [p.model_dump() for p in preds]

def create_portfolio(data: Dict):
    return {"success": True, "id": 1}

@app.get("/health")
async def health():
    return {"status": "ok", "backend": "python", "ai": "PesaRisk Net + Gemini Insights"}

# Serve frontend (only if dist exists)
if os.path.exists("../client/dist"):
    app.mount("/", StaticFiles(directory="../client/dist", html=True), name="frontend")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=int(os.getenv("PORT", 3000)), reload=True)
