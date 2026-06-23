from enum import Enum
from typing import Optional
from sqlmodel import SQLModel, Field

class UserRole(str, Enum):
    PATIENT = "patient"
    CLINICIAN = "clinician"

class UserBase(SQLModel):
    email: str = Field(unique=True, index=True, nullable=False)
    full_name: str = Field(nullable=False)
    role: UserRole = Field(nullable=False)
    # Philippine Data Privacy Act (DPA 2012) compliance
    consent_given: bool = Field(default=False, description="Explicit opt-in from patient for health monitoring")

class UserCreate(UserBase):
    password: str = Field(min_length=8, description="Password must be at least 8 characters")

class UserRead(UserBase):
    id: int

class User(UserBase, table=True):
    __tablename__ = "users"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    hashed_password: str = Field(nullable=False)

# JWT Auth Schemas
class TokenResponse(SQLModel):
    access_token: str
    token_type: str = "bearer"
    role: UserRole
    user_id: int
    full_name: str

class TokenData(SQLModel):
    email: Optional[str] = None
    role: Optional[UserRole] = None
    user_id: Optional[int] = None
