# RetainAI

### AI-Powered Student Retention & Early Dropout Risk Warning System

RetainAI is an AI-powered student retention system designed to identify students who may be at risk of academic disengagement or dropout at an early stage.

The system combines student data, machine-learning-based risk prediction, explainable risk factors, and an interactive dashboard to help educators identify students who may need timely intervention.

---

## Problem Statement

Educational institutions often identify at-risk students only after their academic performance has significantly declined.

RetainAI addresses this problem by providing an early-warning system that:

- Identifies students with elevated dropout/retention risk.
- Provides a risk score and risk category.
- Highlights important contributing factors.
- Allows educators to inspect individual student profiles.
- Provides a dashboard for monitoring the overall student population.
- Uses a machine-learning model to support data-driven intervention decisions.

---

## Key Features

### 1. Student Risk Prediction

The backend uses a trained machine-learning model to estimate student retention/dropout risk from available student features.

Each student can be categorized into risk levels such as:

- High Risk
- Medium Risk
- Low Risk

The prediction is intended as an early-warning signal rather than a definitive statement about a student's future.

### 2. Student Dashboard

The frontend provides an interactive dashboard containing:

- Total number of students
- Risk distribution
- Student-level risk information
- Retention/dropout indicators
- Key risk factors
- Individual student information

### 3. Individual Student Profiles

Users can open an individual student's profile and inspect:

- Student information
- Predicted risk
- Relevant feature values
- Risk-related indicators
- Model-generated information available for that student

### 4. Explainable Risk Factors

RetainAI is designed to surface the factors associated with a student's predicted risk instead of presenting only a prediction.

This helps educators understand why a student may require attention.

### 5. Machine Learning Model

The backend contains the trained model and preprocessing artifacts used by the application.

Model-related files include:

- `model.joblib`
- `scaler.joblib`
- `feature_cols.joblib`
- `feature_stats.json`
- `metrics.json`

These artifacts allow the application to use the trained model without retraining it every time the application starts.

---

## System Architecture

```text
                    ┌──────────────────────┐
                    │      Student Data    │
                    │ CSV / Demo Dataset   │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │   ML Model /         │
                    │   Preprocessing      │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │      FastAPI          │
                    │      Backend          │
                    │                      │
                    │ /api/dashboard       │
                    │ /api/students        │
                    │ /api/students/{id}   │
                    │ /api/whatif-features│
                    │ /api/whatif          │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │     Next.js Frontend │
                    │                      │
                    │ Dashboard            │
                    │ Students             │
                    │ Student Profile      │
                    │ Model Information    │
                    └──────────────────────┘
Technology Stack
Frontend
Next.js
React
TypeScript
CSS
Next.js App Router
Backend
Python
FastAPI
Uvicorn
Pandas
Scikit-learn
XGBoost
SHAP
Joblib

Machine Learning
The project uses a supervised machine-learning pipeline with preprocessing/scaling and a trained predictive model.
The repository includes the trained model artifacts and model evaluation metadata.
RetainAI/
│
├── backend/
│   ├── data/
│   │   ├── dataset.csv
│   │   └── demo_students.json
│   │
│   ├── model/
│   │   ├── feature_cols.joblib
│   │   ├── feature_stats.json
│   │   ├── metrics.json
│   │   ├── model.joblib
│   │   └── scaler.joblib
│   │
│   ├── demo_students.py
│   ├── main.py
│   ├── requirements.txt
│   ├── test_api.py
│   └── train_model.py
│
├── frontend/
│   ├── app/
│   │   ├── model-info/
│   │   ├── student/
│   │   ├── students/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   │
│   ├── lib/
│   │   └── api.ts
│   │
│   ├── package.json
│   └── package-lock.json
│
└── .gitignore
