import os
import time
from contextlib import asynccontextmanager
from typing import Dict, Any

import joblib
import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException, status
from fastapi.staticfiles import StaticFiles

from schemas import PredictionRequest, PredictionResponse, HealthResponse
START_TIME = time.time()
TOP_COUNTRIES = {
    'Other', 'India', 'USA', 'Canada', 'Australia',
    'UK', 'Germany', 'Mexico', 'Turkey', 'France'
}

def map_country(country: str) -> str:
    """Group rarer countries to 'Other' as defined in training."""
    cleaned = country.strip()
    return cleaned if cleaned in TOP_COUNTRIES else 'Other'

def generate_actionable_insights(score: float, req: PredictionRequest) -> tuple[str, str, list[str], bool]:
    """
    Evaluates the mental health score and student habits to produce:
    (category, summary, recommendations, suggest_counselor)
    Specifically alerts and guides students with poor/strained mental health to see a counselor.
    """
    recommendations = []
    suggest_counselor = False

    if score < 5.0:
        category = "Critical Concern" if score < 3.5 else "At Risk (Needs Attention)"
        summary = "Your predicted score indicates significant mental strain and compromised emotional wellbeing."
        suggest_counselor = True
        
        recommendations.append(
            "Consult a Professional Counselor: Your responses indicate high strain. We strongly suggest scheduling a session with a licensed student counselor, psychologist, or university wellbeing advisor."
        )
        if req.Sleep_Hours_Per_Night < 6.5:
            recommendations.append(
                f"Prioritize Sleep Recovery: You are averaging {req.Sleep_Hours_Per_Night} hrs sleep. Aim for 7–8 hours of consistent, uninterrupted rest and disconnect from devices 1 hour before sleep."
            )
        if req.Avg_Daily_Usage_Hours >= 4.0:
            recommendations.append(
                f"Implement a Digital Screen Detox: High screen usage ({req.Avg_Daily_Usage_Hours} hrs/day) increases cognitive fatigue. Use screen-time limits or app timers to reduce usage below 2 hours."
            )
        if req.Physical_Activity_Hours < 1.0:
            recommendations.append(
                "Daily Physical Movement: A 20–30 minute walk or light exercise daily significantly reduces stress hormones and boosts natural mood regulators."
            )
        recommendations.append(
            "Reach Out to Trusted Support: Don't carry burdens alone—reach out to family, mentors, or campus mental health hotlines."
        )

    elif score < 6.5:
        category = "Moderate (Stable)"
        summary = "Acceptable wellbeing baseline, but elevated stress or lifestyle patterns suggest room for improvement."
        
        if req.Stress_Level in ["High", "Very High"]:
            suggest_counselor = True
            recommendations.append(
                f"Speak With a Guidance Counselor: Reporting '{req.Stress_Level}' stress regularly can lead to academic burnout. A counselor or therapist can provide personalized stress-management toolkits."
            )
        
        recommendations.append(
            "Daily Stress-Relief Practice: Dedicate 10-15 minutes each day to box-breathing, meditation, or progressive relaxation."
        )
        if req.Avg_Daily_Usage_Hours >= 4.0:
            recommendations.append(
                "Establish Screen-Free Study Blocks: Avoid checking social media notifications while studying and during morning routines."
            )
        recommendations.append(
            "Implement Structured Breaks: Use the Pomodoro technique (25 min study, 5 min break) to sustain focus without mental exhaustion."
        )

    elif score < 8.0:
        category = "Good (Healthy)"
        summary = "Good overall wellbeing with stable lifestyle habits and balanced digital engagement."
        suggest_counselor = False
        recommendations.append(
            "Maintain Consistent Habits: Your daily balance of rest, study, and social interaction supports healthy mental vitality."
        )
        recommendations.append(
            "Intentional Digital Use: Continue using social platforms with clear intent rather than passive, endless scrolling."
        )
        recommendations.append(
            "Protect Offline Time: Continue scheduling screen-free time for outdoor activities, hobbies, and social gatherings."
        )

    else:
        category = "Thriving (Excellent)"
        summary = "Exceptional mental resilience, balanced screen time, and healthy lifestyle habits."
        suggest_counselor = False
        recommendations.append(
            "Exemplary Balance: Your lifestyle and screen-time habits reflect strong resilience and positive mental vitality."
        )
        recommendations.append(
            "Peer Mentorship: Share your strategies for managing study stress and digital balance with peers and classmates."
        )
        recommendations.append(
            "Creative Outlets: Continue exploring fulfilling creative, academic, or athletic goals outside screens."
        )

    return category, summary, recommendations, suggest_counselor

@asynccontextmanager
async def lifespan(app: FastAPI):
    model_path = "model.pkl" if os.path.exists("model.pkl") else "Mental_Health_Model.pkl"
    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Model file '{model_path}' not found in working directory.")
    
    print(f"[Lifespan Startup] Loading saved ML model pipeline once from: {model_path}...")
    app.state.model = joblib.load(model_path)
    print(f"[Lifespan Startup] Successfully loaded {type(app.state.model).__name__} pipeline into memory.")
    yield
    print("[Lifespan Shutdown] Cleaning up resources...")
    app.state.model = None
app = FastAPI(
    title="Student Wellbeing & Mental Health Predictor API",
    description="Production-grade FastAPI service layer wrapping Scikit-Learn Random Forest pipeline with strict Pydantic validation.",
    version="1.0.0",
    lifespan=lifespan
)

@app.get("/health", response_model=HealthResponse, tags=["System"])
def health_check():
    """
    Uptime check endpoint for monitoring service availability and pipeline status.
    """
    elapsed = int(time.time() - START_TIME)
    hours, rem = divmod(elapsed, 3600)
    minutes, seconds = divmod(rem, 60)
    uptime_str = f"{hours}h {minutes}m {seconds}s"

    is_loaded = hasattr(app.state, "model") and app.state.model is not None

    return HealthResponse(
        status="healthy" if is_loaded else "degraded",
        model_loaded=is_loaded,
        version="1.0.0",
        uptime=uptime_str
    )

@app.post("/predict", response_model=PredictionResponse, tags=["Inference"])
def predict(request: PredictionRequest):
    """
    Inference endpoint.
    Validates input using Pydantic, formats the features into the expected tabular structure,
    and returns model predictions along with ensemble tree-variance confidence estimation.
    """
    if not hasattr(app.state, "model") or app.state.model is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Model is not loaded or service is initializing."
        )

    try:
        grouped_country = map_country(request.Country)
        input_data = {
            "Study_Hours": [request.Study_Hours],
            "Age": [request.Age],
            "Avg_Daily_Usage_Hours": [request.Avg_Daily_Usage_Hours],
            "Daily_Unlocks": [request.Daily_Unlocks],
            "Physical_Activity_Hours": [request.Physical_Activity_Hours],
            "Sleep_Hours_Per_Night": [request.Sleep_Hours_Per_Night],
            "Stress_Level": [request.Stress_Level],
            "Gender": [request.Gender],
            "Academic_Level": [request.Academic_Level],
            "Most_Used_Platform": [request.Most_Used_Platform],
            "Purpose_Of_Use": [request.Purpose_Of_Use],
            "Grouped_countries": [grouped_country]
        }
        df_input = pd.DataFrame(input_data)

        pipeline = app.state.model
        raw_pred = pipeline.predict(df_input)[0]
        final_score = round(float(np.clip(raw_pred, 1.0, 10.0)), 2)

        confidence_pct = 85.0
        details: Dict[str, Any] = {
            "country_mapped_to": grouped_country,
            "input_summary": {
                "age": request.Age,
                "sleep_hours": request.Sleep_Hours_Per_Night,
                "screen_time": request.Avg_Daily_Usage_Hours,
                "stress": request.Stress_Level
            }
        }

        try:
            if "random_forest" in pipeline.named_steps and "preprocessor" in pipeline.named_steps:
                preprocessed = pipeline.named_steps["preprocessor"].transform(df_input)
                forest = pipeline.named_steps["random_forest"]
                tree_preds = np.array([tree.predict(preprocessed)[0] for tree in forest.estimators_])
                std_dev = float(np.std(tree_preds))
                confidence_pct = round(max(50.0, min(99.0, 100.0 * (1.0 - (std_dev / 2.5)))), 1)
                details["trees_evaluated"] = len(tree_preds)
                details["prediction_spread_std"] = round(std_dev, 3)
                details["ensemble_min"] = round(float(np.min(tree_preds)), 2)
                details["ensemble_max"] = round(float(np.max(tree_preds)), 2)
        except Exception as conf_err:
            print(f"Warning computing tree confidence: {conf_err}")

        category, summary, recommendations, suggest_counselor = generate_actionable_insights(final_score, request)

        return PredictionResponse(
            prediction=final_score,
            confidence=confidence_pct,
            category=category,
            summary=summary,
            suggest_counselor=suggest_counselor,
            recommendations=recommendations,
            details=details
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Inference pipeline execution error: {str(e)}"
        )
        
os.makedirs("static", exist_ok=True)
app.mount("/", StaticFiles(directory="static", html=True), name="static")