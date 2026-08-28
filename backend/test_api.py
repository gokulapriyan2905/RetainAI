import urllib.request, json

# Test students endpoint
r = urllib.request.urlopen("http://localhost:8000/api/students")
d = json.loads(r.read())
s0 = d["students"][0]
print(f"Top student: {s0['name']} ({s0['id']}) Risk={s0['risk_score']}% {s0['risk_level']}")
print(f"Top factor: {s0['top_risk_factor']}")
sid = s0["id"]

# Test student detail
r2 = urllib.request.urlopen(f"http://localhost:8000/api/students/{sid}")
detail = json.loads(r2.read())
print(f"\nDetail - contributions: {len(detail['contributions'])}, interventions: {len(detail['interventions'])}")
for c in detail["contributions"][:4]:
    print(f"  {c['label']}: {c['value']} ({c['direction']})")
for i in detail["interventions"][:3]:
    print(f"  Intervention: {i['title']} ({i['priority']})")

# Test what-if
import urllib.request
req = urllib.request.Request(
    "http://localhost:8000/api/whatif",
    data=json.dumps({
        "student_id": sid,
        "scenario": {
            "Curricular units 1st sem (approved)": 10,
            "Curricular units 2nd sem (approved)": 10,
            "Curricular units 1st sem (grade)": 14.0,
            "Tuition fees up to date": 1
        }
    }).encode(),
    headers={"Content-Type": "application/json"},
    method="POST"
)
r3 = urllib.request.urlopen(req)
wif = json.loads(r3.read())
print(f"\nWhat-If: Current={wif['current_risk']}% -> Scenario={wif['scenario_risk']}% (diff={wif['difference']}pp)")
