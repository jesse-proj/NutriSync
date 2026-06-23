from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlmodel import Session, select
from pydantic import BaseModel, EmailStr

from app.database import get_session
from app.models import User, UserCreate, UserRead, TokenResponse, UserRole
from app.auth import get_password_hash, verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

class JSONLoginRequest(BaseModel):
    email: EmailStr
    password: str

@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED, summary="Register a new user")
def register_user(user_data: UserCreate, session: Session = Depends(get_session)):
    # 1. Philippine Data Privacy Act Compliance: Patient consent check
    if user_data.role == UserRole.PATIENT and not user_data.consent_given:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Explicit consent to process health information is required for patients under DPA 2012.",
        )

    # 2. Check if user already exists
    statement = select(User).where(User.email == user_data.email)
    existing_user = session.exec(statement).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists.",
        )

    # 3. Create the user
    hashed_pwd = get_password_hash(user_data.password)
    new_user = User(
        email=user_data.email,
        full_name=user_data.full_name,
        role=user_data.role,
        consent_given=user_data.consent_given,
        hashed_password=hashed_pwd,
    )
    
    session.add(new_user)
    session.commit()
    session.refresh(new_user)
    return new_user

@router.post("/login", response_model=TokenResponse, summary="Login using JSON payload (for decoupled React app)")
def login_json(credentials: JSONLoginRequest, session: Session = Depends(get_session)):
    """Authenticate via standard JSON request, returning a signed JWT access token."""
    # Find user by email
    statement = select(User).where(User.email == credentials.email)
    user = session.exec(statement).first()
    
    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    # Generate access token containing subject, ID, and role
    token_payload = {
        "sub": user.email,
        "id": user.id,
        "role": user.role,
    }
    access_token = create_access_token(data=token_payload)
    
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        role=user.role,
        user_id=user.id,
        full_name=user.full_name,
    )

@router.post("/token", response_model=TokenResponse, summary="Login using Form URL-encoded data (for Swagger UI / OpenAPI docs)")
def login_form(form_data: OAuth2PasswordRequestForm = Depends(), session: Session = Depends(get_session)):
    """Authenticate via OAuth2 Password Request Form, returning a signed JWT access token."""
    statement = select(User).where(User.email == form_data.username)
    user = session.exec(statement).first()
    
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    token_payload = {
        "sub": user.email,
        "id": user.id,
        "role": user.role,
    }
    access_token = create_access_token(data=token_payload)
    
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        role=user.role,
        user_id=user.id,
        full_name=user.full_name,
    )

@router.get("/me", response_model=UserRead, summary="Get current user profile details")
def get_me(current_user: User = Depends(get_current_user)):
    """Retrieve details of the currently authenticated user session."""
    return current_user
