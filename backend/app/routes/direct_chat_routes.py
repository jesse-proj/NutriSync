from fastapi import APIRouter, Depends, HTTPException, status, WebSocket, WebSocketDisconnect
from sqlmodel import Session, select, or_, and_
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
import jwt

from app.database import get_session
from app.models import User, UserRole, ChatMessage
from app.auth import get_current_user
from app.config import settings

router = APIRouter(prefix="/chat/direct", tags=["Direct Messages"])

class ChatConnectionManager:
    def __init__(self):
        # Map user_id to active WebSocket connection
        self.active_connections: Dict[int, WebSocket] = {}

    async def connect(self, websocket: WebSocket, user_id: int):
        await websocket.accept()
        self.active_connections[user_id] = websocket

    def disconnect(self, user_id: int):
        if user_id in self.active_connections:
            del self.active_connections[user_id]

    async def send_personal_message(self, message: Dict[str, Any], user_id: int):
        if user_id in self.active_connections:
            try:
                await self.active_connections[user_id].send_json(message)
            except Exception as e:
                print(f"Error sending message to user {user_id}: {e}")
                self.disconnect(user_id)

manager = ChatConnectionManager()

# WebSocket Route
@router.websocket("/ws")
async def websocket_chat_endpoint(websocket: WebSocket, session: Session = Depends(get_session)):
    # Extract token from query parameters
    token = websocket.query_params.get("token")
    if not token:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Token missing")
        return

    try:
        # Decode token to verify and identify the user
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        user_id: Optional[int] = payload.get("id")
        if user_id is None:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Invalid token payload")
            return
            
        # Ensure user exists in database
        user = session.get(User, user_id)
        if not user:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="User not found")
            return

    except jwt.ExpiredSignatureError:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Token expired")
        return
    except jwt.PyJWTError:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Invalid token signature")
        return

    # Accept connection and register user
    await manager.connect(websocket, user_id)
    print(f"User {user_id} ({user.full_name}) connected to Direct Chat WebSocket")

    try:
        while True:
            # Expecting JSON: {"receiver_id": int, "message": "text"}
            data = await websocket.receive_json()
            receiver_id = data.get("receiver_id")
            message_text = data.get("message")

            if not receiver_id or not message_text or not str(message_text).strip():
                continue

            # Verify receiver exists
            receiver = session.get(User, receiver_id)
            if not receiver:
                continue

            # Save message to database
            chat_msg = ChatMessage(
                sender_id=user_id,
                receiver_id=receiver_id,
                message=str(message_text).strip(),
                is_read=False,
                created_at=datetime.now(timezone.utc)
            )
            session.add(chat_msg)
            session.commit()
            session.refresh(chat_msg)

            # Format payload to send
            message_payload = {
                "id": chat_msg.id,
                "sender_id": chat_msg.sender_id,
                "receiver_id": chat_msg.receiver_id,
                "message": chat_msg.message,
                "is_read": chat_msg.is_read,
                "created_at": chat_msg.created_at.isoformat()
            }

            # Echo back to sender
            await manager.send_personal_message(message_payload, user_id)
            
            # Send to receiver if online
            await manager.send_personal_message(message_payload, receiver_id)

    except WebSocketDisconnect:
        manager.disconnect(user_id)
        print(f"User {user_id} disconnected from Direct Chat WebSocket")
    except Exception as e:
        manager.disconnect(user_id)
        print(f"Error in WebSocket loop for user {user_id}: {e}")


# REST Endpoints
@router.get("/history/{partner_id}", response_model=List[ChatMessage])
def get_chat_history(
    partner_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Retrieve chat history between current user and partner_id."""
    statement = select(ChatMessage).where(
        or_(
            and_(ChatMessage.sender_id == current_user.id, ChatMessage.receiver_id == partner_id),
            and_(ChatMessage.sender_id == partner_id, ChatMessage.receiver_id == current_user.id)
        )
    ).order_by(ChatMessage.created_at.asc())
    
    messages = session.exec(statement).all()
    return messages


@router.get("/unread", response_model=Dict[int, int])
def get_unread_counts(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Retrieve unread message counts grouped by sender_id."""
    statement = select(ChatMessage).where(
        ChatMessage.receiver_id == current_user.id,
        ChatMessage.is_read == False
    )
    unread_messages = session.exec(statement).all()
    
    counts = {}
    for msg in unread_messages:
        counts[msg.sender_id] = counts.get(msg.sender_id, 0) + 1
    return counts


@router.patch("/read/{partner_id}")
def mark_messages_as_read(
    partner_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Mark all unread messages from partner_id as read."""
    statement = select(ChatMessage).where(
        ChatMessage.sender_id == partner_id,
        ChatMessage.receiver_id == current_user.id,
        ChatMessage.is_read == False
    )
    unread_messages = session.exec(statement).all()
    for msg in unread_messages:
        msg.is_read = True
        session.add(msg)
    
    if unread_messages:
        session.commit()
        
    return {"ok": True, "count": len(unread_messages)}
