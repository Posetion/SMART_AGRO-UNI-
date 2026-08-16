from fastapi import APIRouter, File, UploadFile

from app.services.detect_service import analyze_image

router = APIRouter()


@router.post("/detect")
async def detect(file: UploadFile = File(...)):
    content = await file.read()
    result = analyze_image(content, file.content_type or "image/jpeg")
    return result
