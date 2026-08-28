"""
Train dropout prediction model on UCI dataset.
Compares Logistic Regression, Random Forest, XGBoost.
Saves best model + metrics + feature names.
"""
import os, json, warnings
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, confusion_matrix, f1_score, recall_score, precision_score
import joblib

warnings.filterwarnings("ignore")

BASE = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(BASE, "data", "dataset.csv")
MODEL_DIR = os.path.join(BASE, "model")
os.makedirs(MODEL_DIR, exist_ok=True)

# --- Load ---
df = pd.read_csv(DATA_PATH, sep=";")
print(f"Dataset shape: {df.shape}")
print(f"Target distribution:\n{df['Target'].value_counts()}")

# Binary classification: Dropout vs non-Dropout
df["is_dropout"] = (df["Target"] == "Dropout").astype(int)
feature_cols = [c for c in df.columns if c not in ["Target", "is_dropout"]]
X = df[feature_cols].copy()
y = df["is_dropout"].copy()

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

scaler = StandardScaler()
X_train_sc = scaler.fit_transform(X_train)
X_test_sc = scaler.transform(X_test)

# --- Models ---
models = {
    "Logistic Regression": LogisticRegression(max_iter=1000, random_state=42, class_weight="balanced"),
    "Random Forest": RandomForestClassifier(n_estimators=200, random_state=42, class_weight="balanced", n_jobs=-1),
}

# Try XGBoost
try:
    from xgboost import XGBClassifier
    # compute scale_pos_weight
    neg = (y_train == 0).sum()
    pos = (y_train == 1).sum()
    spw = neg / pos if pos > 0 else 1
    models["XGBoost"] = XGBClassifier(
        n_estimators=200, max_depth=6, learning_rate=0.1,
        scale_pos_weight=spw, random_state=42, eval_metric="logloss",
        use_label_encoder=False
    )
    print("XGBoost available.")
except ImportError:
    print("XGBoost not available, skipping.")

results = {}
for name, model in models.items():
    print(f"\nTraining {name}...")
    if name == "Logistic Regression":
        model.fit(X_train_sc, y_train)
        preds = model.predict(X_test_sc)
        proba = model.predict_proba(X_test_sc)[:, 1]
    else:
        model.fit(X_train, y_train)
        preds = model.predict(X_test)
        proba = model.predict_proba(X_test)[:, 1]

    r = recall_score(y_test, preds)
    p = precision_score(y_test, preds)
    f = f1_score(y_test, preds)
    cm = confusion_matrix(y_test, preds).tolist()
    print(f"  Recall={r:.3f}  Precision={p:.3f}  F1={f:.3f}")
    print(f"  Confusion Matrix: {cm}")
    results[name] = {"recall": r, "precision": p, "f1": f, "confusion_matrix": cm, "model": model}

# Pick best by F1
best_name = max(results, key=lambda k: results[k]["f1"])
best_model = results[best_name]["model"]
print(f"\n=== Best model: {best_name} (F1={results[best_name]['f1']:.3f}) ===")

# --- Feature importance ---
if best_name == "Logistic Regression":
    importances = np.abs(best_model.coef_[0])
else:
    importances = best_model.feature_importances_

feat_importance = sorted(zip(feature_cols, importances.tolist()), key=lambda x: -x[1])

# --- Save artifacts ---
joblib.dump(best_model, os.path.join(MODEL_DIR, "model.joblib"))
joblib.dump(scaler, os.path.join(MODEL_DIR, "scaler.joblib"))
joblib.dump(feature_cols, os.path.join(MODEL_DIR, "feature_cols.joblib"))

metrics = {
    "best_model": best_name,
    "dataset_size": len(df),
    "train_size": len(X_train),
    "test_size": len(X_test),
    "dropout_count": int(df["is_dropout"].sum()),
    "non_dropout_count": int((df["is_dropout"] == 0).sum()),
    "all_results": {},
    "feature_importance": feat_importance[:20],
    "uses_scaler": best_name == "Logistic Regression",
}
for name, r in results.items():
    metrics["all_results"][name] = {
        "recall": round(r["recall"], 4),
        "precision": round(r["precision"], 4),
        "f1": round(r["f1"], 4),
        "confusion_matrix": r["confusion_matrix"],
    }

with open(os.path.join(MODEL_DIR, "metrics.json"), "w") as f:
    json.dump(metrics, f, indent=2)

# --- Save dataset stats for demo student generation ---
stats = {}
for col in feature_cols:
    stats[col] = {
        "min": float(X[col].min()),
        "max": float(X[col].max()),
        "mean": float(X[col].mean()),
        "std": float(X[col].std()),
        "median": float(X[col].median()),
    }
with open(os.path.join(MODEL_DIR, "feature_stats.json"), "w") as f:
    json.dump(stats, f, indent=2)

print("\nAll artifacts saved to", MODEL_DIR)
print("Done!")
