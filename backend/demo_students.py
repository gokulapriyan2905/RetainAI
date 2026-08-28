"""
Generate ~50 synthetic demo students with fictional names/IDs,
mapped to valid dataset feature values. Uses actual trained model for predictions.
"""
import os, json, random
import numpy as np
import pandas as pd
import joblib

random.seed(42)
np.random.seed(42)

BASE = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(BASE, "model")
DATA_PATH = os.path.join(BASE, "data", "dataset.csv")

model = joblib.load(os.path.join(MODEL_DIR, "model.joblib"))
feature_cols = joblib.load(os.path.join(MODEL_DIR, "feature_cols.joblib"))
with open(os.path.join(MODEL_DIR, "metrics.json")) as f:
    metrics = json.load(f)
uses_scaler = metrics.get("uses_scaler", False)
if uses_scaler:
    scaler = joblib.load(os.path.join(MODEL_DIR, "scaler.joblib"))

# Load real dataset to sample realistic feature vectors
df = pd.read_csv(DATA_PATH, sep=";")
df["is_dropout"] = (df["Target"] == "Dropout").astype(int)

# Fictional names
FIRST_NAMES = [
    "Aarav", "Aditi", "Arjun", "Ananya", "Bhavesh", "Charvi", "Devansh", "Diya",
    "Eshan", "Falguni", "Gaurav", "Harini", "Ishaan", "Jiya", "Karthik", "Lavanya",
    "Manav", "Neha", "Omkar", "Prisha", "Rahul", "Riya", "Sahil", "Sneha",
    "Tanmay", "Urvi", "Varun", "Wrishika", "Yash", "Zara",
    "Aditya", "Bhavna", "Chirag", "Deepika", "Eshwar", "Fatima", "Girish", "Hema",
    "Ishan", "Jasleen", "Kunal", "Lata", "Mohan", "Nidhi", "Pranav", "Reema",
    "Siddharth", "Tanya", "Uday", "Vani"
]
LAST_NAMES = [
    "Sharma", "Patel", "Reddy", "Nair", "Gupta", "Singh", "Kumar", "Das",
    "Joshi", "Mehta", "Iyer", "Rao", "Chopra", "Kapoor", "Verma", "Malhotra",
    "Bhat", "Pillai", "Menon", "Saxena", "Mishra", "Pandey", "Chauhan", "Thakur",
    "Banerjee"
]
DEPARTMENTS = ["CSE", "IT", "ECE", "EEE", "Mechanical", "Civil"]
YEARS = [1, 2, 3, 4]

students = []
# Sample 50 real feature rows from the dataset for realistic values
# Mix: ~12 dropout rows, ~30 graduate rows, ~8 enrolled rows
dropout_rows = df[df["Target"] == "Dropout"].sample(15, random_state=42)
grad_rows = df[df["Target"] == "Graduate"].sample(28, random_state=42)
enrolled_rows = df[df["Target"] == "Enrolled"].sample(7, random_state=42)
sampled = pd.concat([dropout_rows, grad_rows, enrolled_rows]).reset_index(drop=True)

for i in range(50):
    row = sampled.iloc[i]
    features = {col: float(row[col]) for col in feature_cols}
    
    # Predict with actual model
    X_input = pd.DataFrame([features])[feature_cols]
    if uses_scaler:
        X_input_transformed = scaler.transform(X_input)
    else:
        X_input_transformed = X_input
    
    proba = float(model.predict_proba(X_input_transformed)[0][1])
    risk_pct = round(proba * 100, 1)
    
    if risk_pct >= 60:
        risk_level = "High"
    elif risk_pct >= 30:
        risk_level = "Medium"
    else:
        risk_level = "Low"
    
    student = {
        "id": f"STU{2024001 + i}",
        "name": f"{FIRST_NAMES[i]} {random.choice(LAST_NAMES)}",
        "department": random.choice(DEPARTMENTS),
        "year": random.choice(YEARS),
        "email": f"{FIRST_NAMES[i].lower()}.{random.choice(LAST_NAMES).lower()}@retainai.edu",
        "features": features,
        "risk_score": risk_pct,
        "risk_level": risk_level,
    }
    students.append(student)

# Sort by risk desc
students.sort(key=lambda s: -s["risk_score"])

# Report
high = sum(1 for s in students if s["risk_level"] == "High")
med = sum(1 for s in students if s["risk_level"] == "Medium")
low = sum(1 for s in students if s["risk_level"] == "Low")
print(f"Generated {len(students)} students: {high} High, {med} Medium, {low} Low risk")

# Show top 5
for s in students[:5]:
    print(f"  {s['name']:25s} {s['department']:12s} Risk={s['risk_score']:5.1f}% ({s['risk_level']})")

with open(os.path.join(BASE, "data", "demo_students.json"), "w") as f:
    json.dump(students, f, indent=2)

print(f"\nSaved to data/demo_students.json")
