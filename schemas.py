from typing import Literal, Optional, Dict, Any
from pydantic import BaseModel, Field, field_validator

class PredictionRequest(BaseModel):
    """
    Request schema with strict validation constraints.
    Rejects invalid values (such as negative age or impossible hours) with 422 Unprocessable Entity.
    """
    Age: int = Field(
        ...,
        ge=5,
        le=120,
        description="Age of the student (must be between 5 and 120 years)",
        examples=[21]
    )
    Gender: Literal["Female", "Male", "Other"] = Field(
        ...,
        description="Gender identity",
        examples=["Female"]
    )
    Country: str = Field(
        default="Other",
        min_length=2,
        max_length=80,
        description="Country of residence",
        examples=["USA"]
    )
    Academic_Level: Literal["High School", "Undergraduate", "Graduate"] = Field(
        ...,
        description="Current academic level",
        examples=["Undergraduate"]
    )
    Study_Hours: float = Field(
        ...,
        ge=0.0,
        le=24.0,
        description="Daily study hours (0.0 to 24.0)",
        examples=[3.5]
    )
    Avg_Daily_Usage_Hours: float = Field(
        ...,
        ge=0.0,
        le=24.0,
        description="Average daily social media usage in hours",
        examples=[4.0]
    )
    Daily_Unlocks: int = Field(
        ...,
        ge=0,
        le=1000,
        description="Estimated daily phone unlock count",
        examples=[45]
    )
    Physical_Activity_Hours: float = Field(
        ...,
        ge=0.0,
        le=24.0,
        description="Daily physical activity / exercise in hours",
        examples=[1.5]
    )
    Sleep_Hours_Per_Night: float = Field(
        ...,
        ge=0.0,
        le=24.0,
        description="Average sleep duration per night in hours",
        examples=[7.0]
    )
    Stress_Level: Literal["Low", "Medium", "High", "Very High"] = Field(
        ...,
        description="Self-reported stress level",
        examples=["Medium"]
    )
    Most_Used_Platform: Literal[
        "Instagram", "TikTok", "YouTube", "WhatsApp", "Snapchat",
        "Twitter", "Facebook", "LinkedIn", "KakaoTalk", "LINE",
        "VKontakte", "WeChat", "Other"
    ] = Field(
        ...,
        description="Primary social media platform used",
        examples=["Instagram"]
    )
    Purpose_Of_Use: Literal[
        "Entertainment", "Networking", "Education", "News", "Other"
    ] = Field(
        ...,
        description="Primary purpose of social media usage",
        examples=["Entertainment"]
    )

    model_config = {
        "json_schema_extra": {
            "example": {
                "Age": 21,
                "Gender": "Female",
                "Country": "USA",
                "Academic_Level": "Undergraduate",
                "Study_Hours": 3.5,
                "Avg_Daily_Usage_Hours": 4.0,
                "Daily_Unlocks": 45,
                "Physical_Activity_Hours": 1.5,
                "Sleep_Hours_Per_Night": 7.0,
                "Stress_Level": "Medium",
                "Most_Used_Platform": "Instagram",
                "Purpose_Of_Use": "Entertainment"
            }
        }
    }


class PredictionResponse(BaseModel):
    """
    Response schema returning predicted score and model confidence metrics.
    """
    prediction: float = Field(
        ...,
        description="Predicted Mental Health Score (scale 1.0 - 10.0)"
    )
    confidence: float = Field(
        ...,
        description="Model ensemble confidence percentage (0% - 100%)"
    )
    category: str = Field(
        ...,
        description="Wellbeing category: Critical, At Risk, Moderate, Good, Thriving"
    )
    summary: str = Field(
        ...,
        description="Human-readable assessment summary"
    )
    suggest_counselor: bool = Field(
        default=False,
        description="Flag indicating if seeing a counselor or mental health professional is recommended"
    )
    recommendations: list[str] = Field(
        default_factory=list,
        description="Actionable advice, coping strategies, and support steps"
    )
    details: Dict[str, Any] = Field(
        default_factory=dict,
        description="Diagnostic metrics and feature contributions"
    )


class HealthResponse(BaseModel):
    """
    Response schema for service health status.
    """
    status: str
    model_loaded: bool
    version: str
    uptime: str
