from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import chat, detect, predict

app = FastAPI(title="Smart Agro AI Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(detect.router, prefix="/ai", tags=["detect"])
app.include_router(predict.router, prefix="/ai", tags=["predict"])
app.include_router(chat.router, prefix="/ai", tags=["chat"])


@app.get("/ai/health")
def health():
    return {"status": "ok", "service": "smart-agro-ai"}
