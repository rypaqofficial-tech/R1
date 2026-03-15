from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config.settings import settings
from app.routes.trpc_router import router as trpc_router
from app.models import SQLModel
from database import engine
import uvicorn

app = FastAPI(title="Rypaq R1 - Predictive AI Platform")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(trpc_router)

SQLModel.metadata.create_all(engine)

@app.get("/health")
async def health():
    return {"status": "ok", "version": "2.0", "platform": "Rypaq R1 Website"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=3000, reload=True)
