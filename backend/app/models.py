from enum import Enum
from typing import Optional, List
from datetime import datetime
from sqlmodel import SQLModel, Field, Relationship

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

class DietaryTargets(SQLModel, table=True):
    __tablename__ = "dietary_targets"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    patient_id: int = Field(foreign_key="users.id", index=True)
    clinician_id: int = Field(foreign_key="users.id")
    sodium_mg: Optional[float] = Field(default=2000.0, description="Daily sodium limit in mg")
    carbs_g: Optional[float] = Field(default=250.0, description="Daily carbohydrate limit in g")
    calories_kcal: Optional[float] = Field(default=2000.0, description="Daily calorie limit")
    potassium_mg: Optional[float] = Field(default=None, description="Daily potassium limit in mg")
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class FoodLogs(SQLModel, table=True):
    __tablename__ = "food_logs"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    patient_id: int = Field(foreign_key="users.id", index=True)
    image_url: Optional[str] = Field(default=None)
    description: str = Field(nullable=False)
    sodium_mg: float = Field(default=0.0)
    carbs_g: float = Field(default=0.0)
    calories_kcal: float = Field(default=0.0)
    potassium_mg: float = Field(default=0.0)
    protein_g: float = Field(default=0.0)
    fat_g: float = Field(default=0.0)
    logged_at: datetime = Field(default_factory=datetime.utcnow)

class ClinicalAlerts(SQLModel, table=True):
    __tablename__ = "clinical_alerts"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    patient_id: int = Field(foreign_key="users.id", index=True)
    alert_type: str = Field(nullable=False) # e.g., 'EXCEEDED_SODIUM', 'INACTIVITY'
    message: str = Field(nullable=False)
    is_resolved: bool = Field(default=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)

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
