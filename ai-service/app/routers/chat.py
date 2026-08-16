from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.services.chat_service import chat_reply

router = APIRouter()


class ChatMessage(BaseModel):
    sender: str
    text: str


class ChatContext(BaseModel):
    farmerProfile: str | None = None
    weatherText: str | None = None


class ChatRequest(BaseModel):
    prompt: str
    history: list[ChatMessage] = Field(default_factory=list)
    context: ChatContext | None = None


@router.post("/chat")
async def chat(body: ChatRequest):
    ctx = body.context.model_dump() if body.context else None
    reply = chat_reply(body.prompt, [m.model_dump() for m in body.history], ctx)
    return {"reply": reply}
