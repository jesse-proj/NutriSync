from datetime import date, datetime, timezone
from enum import Enum
from typing import List, Optional

from pydantic import BaseModel
from sqlmodel import Field, Relationship, SQLModel


def utc_now():
    return datetime.now(timezone.utc)


class UserRole(str, Enum):
    PATIENT = "patient"
    CLINICIAN = "clinician"


class UserBase(SQLModel):
    email: str = Field(unique=True, index=True, nullable=False)
    full_name: str = Field(nullable=False)
    role: UserRole = Field(nullable=False)
    # Philippine Data Privacy Act (DPA 2012) compliance
    consent_given: bool = Field(
        default=False, description="Explicit opt-in from patient for health monitoring"
    )


class UserCreate(UserBase):
    password: str = Field(
        min_length=8, description="Password must be at least 8 characters"
    )


class UserRead(UserBase):
    id: int


class PatientClinicianLink(SQLModel, table=True):
    __tablename__ = "patient_clinician_links"

    patient_id: int = Field(foreign_key="users.id", primary_key=True)
    clinician_id: int = Field(foreign_key="users.id", primary_key=True)
    linked_at: datetime = Field(default_factory=utc_now)


class User(UserBase, table=True):
    __tablename__ = "users"

    id: Optional[int] = Field(default=None, primary_key=True)
    hashed_password: str = Field(nullable=False)
    # Clinician credential fields
    profession: Optional[str] = Field(
        default=None, description="e.g. Cardiologist, Nurse, Dietitian"
    )
    prc_number: Optional[str] = Field(default=None, description="PRC license number")
    date_of_birth: Optional[date] = Field(default=None)
    prc_id_image_url: Optional[str] = Field(
        default=None, description="Path to uploaded PRC ID photo"
    )
    credentials_verified: bool = Field(
        default=False, description="Auto-verified for prototype"
    )


class DietaryTargets(SQLModel, table=True):
    __tablename__ = "dietary_targets"

    id: Optional[int] = Field(default=None, primary_key=True)
    patient_id: int = Field(foreign_key="users.id", index=True)
    clinician_id: int = Field(foreign_key="users.id")
    sodium_mg: Optional[float] = Field(
        default=2000.0, description="Daily sodium limit in mg"
    )
    carbs_g: Optional[float] = Field(
        default=250.0, description="Daily carbohydrate limit in g"
    )
    calories_kcal: Optional[float] = Field(
        default=2000.0, description="Daily calorie limit"
    )
    potassium_mg: Optional[float] = Field(
        default=None, description="Daily potassium limit in mg"
    )
    protein_g: Optional[float] = Field(
        default=None, description="Daily protein limit in g"
    )
    fat_g: Optional[float] = Field(default=None, description="Daily fat limit in g")
    updated_at: datetime = Field(default_factory=utc_now)


class FoodLogs(SQLModel, table=True):
    __tablename__ = "food_logs"

    id: Optional[int] = Field(default=None, primary_key=True)
    patient_id: int = Field(foreign_key="users.id", index=True)
    image_url: Optional[str] = Field(default=None)
    name: str = Field(default="Unknown Meal")
    description: str = Field(nullable=False)
    sodium_mg: float = Field(default=0.0)
    carbs_g: float = Field(default=0.0)
    calories_kcal: float = Field(default=0.0)
    potassium_mg: float = Field(default=0.0)
    protein_g: float = Field(default=0.0)
    fat_g: float = Field(default=0.0)
    logged_at: datetime = Field(default_factory=utc_now)


class ClinicalAlerts(SQLModel, table=True):
    __tablename__ = "clinical_alerts"

    id: Optional[int] = Field(default=None, primary_key=True)
    patient_id: int = Field(foreign_key="users.id", index=True)
    alert_type: str = Field(nullable=False)  # e.g., 'EXCEEDED_SODIUM', 'INACTIVITY'
    message: str = Field(nullable=False)
    is_resolved: bool = Field(default=False)
    created_at: datetime = Field(default_factory=utc_now)


class ClinicalReminderType(str, Enum):
    MEDICATION = "medication"
    HYDRATION = "hydration"
    MEAL = "meal"
    ACTIVITY = "activity"
    CUSTOM = "custom"


class ClinicalReminder(SQLModel, table=True):
    __tablename__ = "clinical_reminders"

    id: Optional[int] = Field(default=None, primary_key=True)
    patient_id: int = Field(foreign_key="users.id", index=True)
    clinician_id: int = Field(foreign_key="users.id")
    reminder_type: ClinicalReminderType = Field(nullable=False)
    title: str = Field(nullable=False)
    description: str = Field(default="")
    schedule: str = Field(default="")
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)


class ChatMessage(SQLModel, table=True):
    __tablename__ = "chat_messages"

    id: Optional[int] = Field(default=None, primary_key=True)
    sender_id: int = Field(foreign_key="users.id", index=True)
    receiver_id: int = Field(foreign_key="users.id", index=True)
    message: str = Field(nullable=False)
    is_read: bool = Field(default=False)
    created_at: datetime = Field(default_factory=utc_now)


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


# Clinical Reminder Schemas
class ClinicalReminderCreate(BaseModel):
    reminder_type: str
    title: str
    description: str = ""
    schedule: str = ""


class ClinicalReminderUpdate(BaseModel):
    reminder_type: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    schedule: Optional[str] = None
    is_active: Optional[bool] = None
