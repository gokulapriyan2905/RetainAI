"""
FastAPI backend for RetainAI.
Serves student data, model predictions, what-if simulations, and model info.
"""
import os, json
from typing import Dict
import pandas as pd
import numpy as np
import joblib
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

BASE = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(BASE, "model")
DATA_DIR = os.path.join(BASE, "data")

app = FastAPI(title="RetainAI API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Load artifacts at startup ---
model = joblib.load(os.path.join(MODEL_DIR, "model.joblib"))
feature_cols = joblib.load(os.path.join(MODEL_DIR, "feature_cols.joblib"))
with open(os.path.join(MODEL_DIR, "metrics.json")) as f:
    metrics = json.load(f)
uses_scaler = metrics.get("uses_scaler", False)
scaler = None
if uses_scaler:
    scaler = joblib.load(os.path.join(MODEL_DIR, "scaler.joblib"))

with open(os.path.join(DATA_DIR, "demo_students.json")) as f:
    students = json.load(f)
students_by_id = {s["id"]: s for s in students}

# Human-readable feature labels
FEATURE_LABELS = {
    "Curricular units 1st sem (approved)": "Courses Passed \u2014 Semester 1",
    "Curricular units 1st sem (grade)": "Average Grade \u2014 Semester 1",
    "Curricular units 2nd sem (approved)": "Courses Passed \u2014 Semester 2",
    "Curricular units 2nd sem (grade)": "Average Grade \u2014 Semester 2",
    "Curricular units 1st sem (enrolled)": "Courses Enrolled \u2014 Semester 1",
    "Curricular units 2nd sem (enrolled)": "Courses Enrolled \u2014 Semester 2",
    "Tuition fees up to date": "Tuition Fees Paid",
    "Scholarship holder": "Has Scholarship",
    "Admission grade": "Admission Grade",
    "Age at enrollment": "Age at Enrollment",
    "Previous qualification (grade)": "Previous Qualification Grade",
    "Debtor": "Has Outstanding Debt",
    "Displaced": "Displaced Student",
    "Gender": "Gender",
    "Curricular units 1st sem (evaluations)": "1st Sem Evaluations",
    "Curricular units 2nd sem (evaluations)": "2nd Sem Evaluations",
    "Curricular units 1st sem (credited)": "1st Sem Units Credited",
    "Curricular units 2nd sem (credited)": "2nd Sem Units Credited",
    "Curricular units 1st sem (without evaluations)": "1st Sem Without Eval",
    "Curricular units 2nd sem (without evaluations)": "2nd Sem Without Eval",
    "Unemployment rate": "Unemployment Rate",
    "Inflation rate": "Inflation Rate",
    "GDP": "GDP",
    "Application mode": "Application Mode",
    "Application order": "Application Order",
    "Course": "Course",
    "Daytime/evening attendance": "Day/Evening Attendance",
    "Previous qualification": "Previous Qualification",
    "Nacionality": "Nationality",
    "Mother's qualification": "Mother's Education",
    "Father's qualification": "Father's Education",
    "Mother's occupation": "Mother's Occupation",
    "Father's occupation": "Father's Occupation",
    "Marital Status": "Marital Status",
    "Educational special needs": "Special Needs",
    "International": "International Student",
}

# What-if simulator features (understandable, actionable)
WHATIF_FEATURES = [
    {
        "key": "Curricular units 1st sem (approved)",
        "label": "Courses Passed \u2014 Semester 1",
        "description": "Number of courses successfully completed in the first semester.",
        "min": 0, "max": 26, "step": 1, "type": "int"
    },
    {
        "key": "Curricular units 2nd sem (approved)",
        "label": "Courses Passed \u2014 Semester 2",
        "description": "Number of courses successfully completed in the second semester.",
        "min": 0, "max": 20, "step": 1, "type": "int"
    },
    {
        "key": "Curricular units 1st sem (grade)",
        "label": "Average Grade \u2014 Semester 1",
        "description": "Average academic grade in the first semester (0\u201320 scale).",
        "min": 0, "max": 20, "step": 0.5, "type": "float"
    },
    {
        "key": "Tuition fees up to date",
        "label": "Tuition Fees Paid",
        "description": "Whether the student's tuition fees are paid.",
        "min": 0, "max": 1, "step": 1, "type": "int"
    },
]

def predict_risk(features: dict) -> float:
    """Run actual model prediction."""
    X = pd.DataFrame([features])[feature_cols]
    if uses_scaler and scaler is not None:
        X = scaler.transform(X)
    proba = float(model.predict_proba(X)[0][1])
    return round(proba * 100, 1)

def get_feature_contributions(features: dict) -> list:
    """Get top feature contributions using model feature importance + feature values."""
    importance = metrics.get("feature_importance", [])
    imp_dict = {k: v for k, v in importance}
    
    # Try SHAP for this specific instance
    try:
        import shap
        X_input = pd.DataFrame([features])[feature_cols]
        if uses_scaler and scaler is not None:
            X_transformed = scaler.transform(X_input)
            explainer = shap.Explainer(model, feature_names=feature_cols)
            shap_values = explainer(pd.DataFrame(X_transformed, columns=feature_cols))
        else:
            explainer = shap.Explainer(model)
            shap_values = explainer(X_input)
        
        # Get SHAP values for dropout class
        if len(shap_values.shape) == 3:
            sv = shap_values.values[0, :, 1]  # class 1 = dropout
        else:
            sv = shap_values.values[0]
        
        contributions = []
        for i, col in enumerate(feature_cols):
            contributions.append({
                "feature": col,
                "label": FEATURE_LABELS.get(col, col),
                "value": float(features.get(col, 0)),
                "shap_value": float(sv[i]),
                "abs_impact": abs(float(sv[i])),
                "direction": "increases" if sv[i] > 0 else "decreases",
            })
        contributions.sort(key=lambda x: -x["abs_impact"])
        return contributions[:8]
    except Exception:
        pass
    
    # Fallback: use global feature importance weighted by deviation from mean
    with open(os.path.join(MODEL_DIR, "feature_stats.json")) as f:
        stats = json.load(f)
    
    contributions = []
    for col in feature_cols:
        val = features.get(col, 0)
        mean = stats[col]["mean"]
        std = stats[col]["std"] if stats[col]["std"] > 0 else 1
        deviation = (val - mean) / std
        global_imp = imp_dict.get(col, 0)
        impact = global_imp * abs(deviation)
        
        contributions.append({
            "feature": col,
            "label": FEATURE_LABELS.get(col, col),
            "value": float(val),
            "impact": float(impact),
            "abs_impact": float(abs(impact)),
            "direction": "increases" if deviation > 0 else "decreases",
        })
    contributions.sort(key=lambda x: -x["abs_impact"])
    return contributions[:8]

def get_interventions(contributions: list, features: dict) -> list:
    """Deterministic rules-based interventions based on risk factors."""
    interventions = []
    feat_set = {c["feature"] for c in contributions[:4]}
    
    # Academic performance issues
    if any(f in feat_set for f in [
        "Curricular units 1st sem (approved)", "Curricular units 2nd sem (approved)",
        "Curricular units 1st sem (grade)", "Curricular units 2nd sem (grade)"
    ]):
        if features.get("Curricular units 1st sem (approved)", 5) < 3 or \
           features.get("Curricular units 2nd sem (approved)", 5) < 3:
            interventions.append({
                "title": "Academic Remediation Program",
                "description": "Enroll in supplemental instruction and tutoring for failed subjects.",
                "priority": "High",
                "icon": "book"
            })
        interventions.append({
            "title": "Faculty Mentoring & Follow-up",
            "description": "Assign dedicated faculty advisor for weekly check-ins on academic progress.",
            "priority": "High",
            "icon": "users"
        })
    
    # Financial issues
    if any(f in feat_set for f in ["Tuition fees up to date", "Debtor", "Scholarship holder"]):
        interventions.append({
            "title": "Financial Aid Review",
            "description": "Connect with financial aid office to explore scholarships, grants, or payment plans.",
            "priority": "High",
            "icon": "dollar"
        })
    
    if features.get("Tuition fees up to date", 1) == 0:
        interventions.append({
            "title": "Emergency Financial Support",
            "description": "Refer to emergency fund and fee waiver programs.",
            "priority": "Critical",
            "icon": "alert"
        })
    
    # Age / non-traditional
    if "Age at enrollment" in feat_set:
        interventions.append({
            "title": "Non-Traditional Student Support",
            "description": "Connect with peer support groups and flexible scheduling options.",
            "priority": "Medium",
            "icon": "clock"
        })
    
    # Displacement
    if "Displaced" in feat_set or features.get("Displaced", 0) == 1:
        interventions.append({
            "title": "Student Wellness & Housing Support",
            "description": "Connect with campus housing and wellness counseling services.",
            "priority": "Medium",
            "icon": "home"
        })
    
    # Always add general mentoring if not already suggested
    if not any(i["title"].startswith("Faculty") for i in interventions):
        interventions.append({
            "title": "Peer Mentoring Program",
            "description": "Pair with a successful senior student mentor for guidance and motivation.",
            "priority": "Medium",
            "icon": "users"
        })
    
    # General for high risk
    interventions.append({
        "title": "Early Alert Conference",
        "description": "Schedule meeting with department coordinator to discuss retention strategies.",
        "priority": "Medium",
        "icon": "clipboard"
    })
    
    return interventions[:5]

# ============ API Endpoints ============

@app.get("/api/students")
def get_students():
    """Return all students (summary view)."""
    summary = []
    for s in students:
        contribs = get_feature_contributions(s["features"])
        top_factor = contribs[0]["label"] if contribs else "N/A"
        summary.append({
            "id": s["id"],
            "name": s["name"],
            "department": s["department"],
            "year": s["year"],
            "risk_score": s["risk_score"],
            "risk_level": s["risk_level"],
            "top_risk_factor": top_factor,
        })
    return {"students": summary}


@app.get("/api/students/{student_id}")
def get_student(student_id: str):
    """Return detailed student data with risk factors and interventions."""
    s = students_by_id.get(student_id)
    if not s:
        raise HTTPException(404, "Student not found")
    
    contributions = get_feature_contributions(s["features"])
    interventions = get_interventions(contributions, s["features"])
    
    return {
        "id": s["id"],
        "name": s["name"],
        "department": s["department"],
        "year": s["year"],
        "email": s["email"],
        "risk_score": s["risk_score"],
        "risk_level": s["risk_level"],
        "contributions": contributions,
        "interventions": interventions,
        "features": s["features"],
    }


class WhatIfRequest(BaseModel):
    student_id: str
    scenario: Dict[str, float]

@app.post("/api/whatif")
def what_if(req: WhatIfRequest):
    """Run what-if simulation with changed feature values."""
    s = students_by_id.get(req.student_id)
    if not s:
        raise HTTPException(404, "Student not found")
    
    # Current risk
    current_risk = s["risk_score"]
    
    # Modified features
    modified_features = dict(s["features"])
    for key, val in req.scenario.items():
        if key in modified_features:
            modified_features[key] = val
    
    new_risk = predict_risk(modified_features)
    diff = round(new_risk - current_risk, 1)
    
    return {
        "current_risk": current_risk,
        "scenario_risk": new_risk,
        "difference": diff,
        "modified_features": {k: {"original": s["features"].get(k, 0), "new": v} for k, v in req.scenario.items()},
    }


@app.get("/api/whatif-features")
def get_whatif_features():
    """Return the what-if simulator feature definitions."""
    return {"features": WHATIF_FEATURES}


@app.get("/api/model-info")
def get_model_info():
    """Return model metrics and info."""
    return metrics


@app.get("/api/dashboard")
def get_dashboard():
    """Return dashboard summary stats."""
    total = len(students)
    high = sum(1 for s in students if s["risk_level"] == "High")
    medium = sum(1 for s in students if s["risk_level"] == "Medium")
    low = sum(1 for s in students if s["risk_level"] == "Low")
    
    # Department risk
    dept_risk = {}
    for s in students:
        dept = s["department"]
        if dept not in dept_risk:
            dept_risk[dept] = {"total": 0, "high": 0, "medium": 0, "low": 0, "sum_risk": 0}
        dept_risk[dept]["total"] += 1
        dept_risk[dept][s["risk_level"].lower()] += 1
        dept_risk[dept]["sum_risk"] += s["risk_score"]
    
    dept_data = []
    for dept, data in dept_risk.items():
        dept_data.append({
            "department": dept,
            "total": data["total"],
            "high": data["high"],
            "medium": data["medium"],
            "low": data["low"],
            "avg_risk": round(data["sum_risk"] / data["total"], 1),
        })
    dept_data.sort(key=lambda d: -d["avg_risk"])
    
    # Risk distribution
    risk_dist = [
        {"range": "0-20%", "count": sum(1 for s in students if s["risk_score"] < 20)},
        {"range": "20-40%", "count": sum(1 for s in students if 20 <= s["risk_score"] < 40)},
        {"range": "40-60%", "count": sum(1 for s in students if 40 <= s["risk_score"] < 60)},
        {"range": "60-80%", "count": sum(1 for s in students if 60 <= s["risk_score"] < 80)},
        {"range": "80-100%", "count": sum(1 for s in students if s["risk_score"] >= 80)},
    ]
    
    return {
        "total": total,
        "high": high,
        "medium": medium,
        "low": low,
        "department_risk": dept_data,
        "risk_distribution": risk_dist,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
