from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.services.predict_service import predict_risk

router = APIRouter()


class PredictRequest(BaseModel):
    cropType: str | None = None
    disease: str | None = None
    temperature: float | None = None
    humidity: float | None = Field(default=70)
    rainfall: float | None = None


@router.post("/predict")
async def predict(body: PredictRequest):
    return predict_risk(body.model_dump())
