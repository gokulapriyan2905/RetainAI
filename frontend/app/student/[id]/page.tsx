"use client";

import { useEffect, useState, use, useCallback } from "react";
import { fetchAPI, postAPI } from "@/lib/api";

interface Contribution {
    feature: string;
    label: string;
    value: number;
    abs_impact: number;
    direction: string;
    shap_value?: number;
}

interface Intervention {
    title: string;
    description: string;
    priority: string;
    icon: string;
}

interface StudentDetail {
    id: string;
    name: string;
    department: string;
    year: number;
    email: string;
    risk_score: number;
    risk_level: string;
    contributions: Contribution[];
    interventions: Intervention[];
    features: Record<string, number>;
}

interface WhatIfFeature {
    key: string;
    label: string;
    description: string;
    min: number;
    max: number;
    step: number;
    type: string;
}

interface WhatIfResult {
    current_risk: number;
    scenario_risk: number;
    difference: number;
}

interface AlertInfo {
    alertId: string;
    timestamp: string;
    studentName: string;
    riskLevel: string;
    riskScore: number;
    topFactor: string;
    nextAction: string;
}

// ─── Utility: generate local alert ID ───
function generateAlertId(): string {
    const ts = Date.now().toString(36).toUpperCase();
    const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `ALR-${ts}-${rand}`;
}

// ─── Utility: format timestamp ───
function formatTimestamp(): string {
    return new Date().toLocaleString("en-US", {
        year: "numeric", month: "short", day: "numeric",
        hour: "2-digit", minute: "2-digit", second: "2-digit",
    });
}

// ─── Generate HTML report and download ───
function generateReport(student: StudentDetail) {
    const timestamp = formatTimestamp();
    const safeName = student.name.replace(/\s+/g, "_");
    const filename = `RetainAI_Student_Risk_${safeName}.html`;

    const riskColor = student.risk_level === "High" ? "#ef4444" : student.risk_level === "Medium" ? "#f59e0b" : "#22c55e";

    const factorsHtml = student.contributions.slice(0, 6).map(c => `
        <tr>
            <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${c.label}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center;">${typeof c.value === "number" ? (Number.isInteger(c.value) ? c.value : c.value.toFixed(2)) : c.value}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center;color:${c.direction === "increases" ? "#ef4444" : "#22c55e"};">
                ${c.direction === "increases" ? "↑ Increases Risk" : "↓ Decreases Risk"}
            </td>
        </tr>
    `).join("");

    const interventionsHtml = student.interventions.map(i => `
        <tr>
            <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-weight:600;">${i.title}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center;">
                <span style="display:inline-block;padding:2px 10px;border-radius:12px;font-size:11px;font-weight:700;
                    background:${i.priority === "Critical" ? "#fef2f2" : i.priority === "High" ? "#fff7ed" : "#eff6ff"};
                    color:${i.priority === "Critical" ? "#dc2626" : i.priority === "High" ? "#ea580c" : "#2563eb"};">
                    ${i.priority}
                </span>
            </td>
            <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;color:#6b7280;font-size:13px;">${i.description}</td>
        </tr>
    `).join("");

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>RetainAI — Student Risk Assessment — ${student.name}</title>
<style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; color: #1f2937; background: #fff; padding: 40px; line-height: 1.6; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; padding-bottom: 20px; border-bottom: 3px solid #6366f1; }
    .brand { font-size: 28px; font-weight: 800; color: #6366f1; letter-spacing: -0.5px; }
    .subtitle { font-size: 14px; color: #6b7280; margin-top: 2px; }
    .report-meta { text-align: right; font-size: 12px; color: #9ca3af; }
    .section { margin-bottom: 28px; }
    .section-title { font-size: 16px; font-weight: 700; color: #374151; margin-bottom: 12px; padding-bottom: 6px; border-bottom: 1px solid #e5e7eb; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 32px; }
    .info-row { display: flex; justify-content: space-between; padding: 4px 0; }
    .info-label { color: #6b7280; font-size: 14px; }
    .info-value { font-weight: 600; font-size: 14px; }
    .risk-box { display: inline-flex; align-items: center; gap: 12px; padding: 16px 24px; border-radius: 12px; margin-top: 8px; }
    table { width: 100%; border-collapse: collapse; font-size: 14px; margin-top: 8px; }
    th { text-align: left; padding: 10px 12px; background: #f9fafb; border-bottom: 2px solid #e5e7eb; font-size: 12px; text-transform: uppercase; color: #6b7280; letter-spacing: 0.5px; }
    .disclaimer { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-top: 32px; font-size: 12px; color: #6b7280; }
    .disclaimer strong { color: #374151; }
    .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #9ca3af; text-align: center; }
    @media print { body { padding: 20px; } }
</style>
</head>
<body>

<div class="header">
    <div>
        <div class="brand">RetainAI</div>
        <div class="subtitle">Student Risk Assessment Report</div>
    </div>
    <div class="report-meta">
        <div>Generated: ${timestamp}</div>
        <div>Report ID: RPT-${Date.now().toString(36).toUpperCase()}</div>
    </div>
</div>

<div class="section">
    <div class="section-title">Student Information</div>
    <div class="info-grid">
        <div class="info-row"><span class="info-label">Student</span><span class="info-value">${student.name}</span></div>
        <div class="info-row"><span class="info-label">Student ID</span><span class="info-value">${student.id}</span></div>
        <div class="info-row"><span class="info-label">Department</span><span class="info-value">${student.department}</span></div>
        <div class="info-row"><span class="info-label">Year</span><span class="info-value">${student.year}</span></div>
        <div class="info-row"><span class="info-label">Email</span><span class="info-value">${student.email}</span></div>
    </div>
</div>

<div class="section">
    <div class="section-title">Risk Assessment</div>
    <div class="risk-box" style="background:${riskColor}15; border: 1px solid ${riskColor}40;">
        <div style="font-size:36px;font-weight:800;color:${riskColor};">${student.risk_score}%</div>
        <div>
            <div style="font-size:14px;font-weight:700;color:${riskColor};">${student.risk_level} Risk</div>
            <div style="font-size:12px;color:#6b7280;">Estimated Dropout Risk</div>
        </div>
    </div>
</div>

<div class="section">
    <div class="section-title">Key Risk Indicators</div>
    <table>
        <thead><tr><th>Factor</th><th style="text-align:center;">Value</th><th style="text-align:center;">Direction</th></tr></thead>
        <tbody>${factorsHtml}</tbody>
    </table>
</div>

<div class="section">
    <div class="section-title">Recommended Interventions</div>
    <table>
        <thead><tr><th>Intervention</th><th style="text-align:center;">Priority</th><th>Description</th></tr></thead>
        <tbody>${interventionsHtml}</tbody>
    </table>
</div>

<div class="disclaimer">
    <p><strong>Model Disclaimer:</strong> This report contains a model-estimated risk score and should support, not replace, human judgment. Model associations do not establish causation.</p>
    <p style="margin-top:8px;"><strong>Data Disclaimer:</strong> Demo uses synthetic student identities/data for demonstration.</p>
</div>

<div class="footer">
    RetainAI — AI-Powered Student Retention Risk Assessment &nbsp;|&nbsp; ${timestamp}
</div>

</body>
</html>`;

    try {
        const blob = new Blob([html], { type: "text/html" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        return { success: true, filename };
    } catch (err) {
        return { success: false, filename, error: err instanceof Error ? err.message : "Unknown error" };
    }
}

// ─── Risk gauge ───
function RiskGauge({ score, level }: { score: number; level: string }) {
    const color = level === "High" ? "var(--high-risk)" : level === "Medium" ? "var(--medium-risk)" : "var(--low-risk)";
    const radius = 45;
    const circumference = 2 * Math.PI * radius;
    const dashoffset = circumference - (score / 100) * circumference;

    return (
        <div className="flex flex-col items-center">
            <svg width="140" height="140" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r={radius} fill="none" stroke="var(--border)" strokeWidth="10" />
                <circle
                    cx="60" cy="60" r={radius}
                    fill="none" stroke={color} strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={dashoffset}
                    transform="rotate(-90 60 60)"
                    style={{ transition: "stroke-dashoffset 0.8s ease" }}
                />
                <text x="60" y="55" textAnchor="middle" className="text-2xl font-bold" fill="white" fontSize="24">{score}%</text>
                <text x="60" y="75" textAnchor="middle" fill={color} fontSize="11" fontWeight="600">{level} RISK</text>
            </svg>
        </div>
    );
}

function IconForType(type: string) {
    switch (type) {
        case "book": return "📚";
        case "users": return "👥";
        case "dollar": return "💰";
        case "alert": return "🚨";
        case "clock": return "⏰";
        case "home": return "🏠";
        case "clipboard": return "📋";
        default: return "📌";
    }
}

// ─── Toast notification ───
function Toast({ message, type, onClose }: { message: string; type: "success" | "error"; onClose: () => void }) {
    useEffect(() => {
        const timer = setTimeout(onClose, 5000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className={`fixed top-6 right-6 z-50 max-w-sm px-5 py-3 rounded-xl shadow-2xl border text-sm font-medium animate-[slideIn_0.3s_ease] ${type === "success"
                ? "bg-green-900/90 border-green-500/40 text-green-200"
                : "bg-red-900/90 border-red-500/40 text-red-200"
            }`}>
            <div className="flex items-center gap-2">
                <span className="text-base">{type === "success" ? "✓" : "✗"}</span>
                <span>{message}</span>
                <button onClick={onClose} className="ml-auto text-xs opacity-60 hover:opacity-100">✕</button>
            </div>
        </div>
    );
}

export default function StudentPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [student, setStudent] = useState<StudentDetail | null>(null);
    const [whatIfFeatures, setWhatIfFeatures] = useState<WhatIfFeature[]>([]);
    const [scenario, setScenario] = useState<Record<string, number>>({});
    const [whatIfResult, setWhatIfResult] = useState<WhatIfResult | null>(null);
    const [simulating, setSimulating] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showSimulator, setShowSimulator] = useState(false);

    // Quick Actions state
    const [alertSent, setAlertSent] = useState(false);
    const [alertInfo, setAlertInfo] = useState<AlertInfo | null>(null);
    const [showAlertModal, setShowAlertModal] = useState(false);
    const [reportGenerated, setReportGenerated] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

    useEffect(() => {
        Promise.all([
            fetchAPI(`/api/students/${id}`),
            fetchAPI("/api/whatif-features"),
        ])
            .then(([s, wf]) => {
                setStudent(s);
                setWhatIfFeatures(wf.features);
                const init: Record<string, number> = {};
                for (const f of wf.features) {
                    init[f.key] = s.features[f.key] ?? 0;
                }
                setScenario(init);
            })
            .catch((e) => setError(e.message))
            .finally(() => setLoading(false));
    }, [id]);

    const runSimulation = async () => {
        setSimulating(true);
        try {
            const result = await postAPI("/api/whatif", {
                student_id: id,
                scenario,
            });
            setWhatIfResult(result);
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : "Simulation error";
            setError(msg);
        } finally {
            setSimulating(false);
        }
    };

    // ─── Send Alert to Advisor ───
    const handleSendAlert = useCallback(() => {
        if (!student) return;
        try {
            const topFactor = student.contributions[0]?.label ?? "N/A";
            const nextAction = student.interventions[0]?.title ?? "Schedule advisor meeting";
            const info: AlertInfo = {
                alertId: generateAlertId(),
                timestamp: formatTimestamp(),
                studentName: student.name,
                riskLevel: student.risk_level,
                riskScore: student.risk_score,
                topFactor,
                nextAction,
            };
            setAlertInfo(info);
            setAlertSent(true);
            setShowAlertModal(true);
        } catch {
            setToast({ message: "Failed to create advisor alert.", type: "error" });
        }
    }, [student]);

    // ─── Generate Report ───
    const handleGenerateReport = useCallback(() => {
        if (!student) return;
        try {
            const result = generateReport(student);
            if (result.success) {
                setReportGenerated(true);
                setToast({ message: `Report downloaded: ${result.filename}`, type: "success" });
            } else {
                setToast({ message: `Report failed: ${result.error}`, type: "error" });
            }
        } catch {
            setToast({ message: "Failed to generate report. Please try again.", type: "error" });
        }
    }, [student]);

    if (loading) return (
        <div className="flex items-center justify-center h-96 text-[var(--muted)]">Loading student data...</div>
    );
    if (error) return (
        <div className="flex items-center justify-center h-96">
            <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-6 text-center">
                <p className="text-red-400">{error}</p>
            </div>
        </div>
    );
    if (!student) return null;

    const topContributions = student.contributions.slice(0, 4);

    return (
        <div>
            {/* Toast */}
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            {/* Alert Modal */}
            {showAlertModal && alertInfo && (
                <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowAlertModal(false)}>
                    <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
                        {/* Header */}
                        <div className="flex items-center gap-3 mb-5">
                            <div className="w-10 h-10 rounded-full bg-green-500/15 flex items-center justify-center text-green-400 text-lg">✓</div>
                            <div>
                                <h3 className="text-base font-bold text-white">Advisor Alert Created</h3>
                                <p className="text-[10px] text-[var(--muted)] font-mono">{alertInfo.alertId}</p>
                            </div>
                        </div>
                        {/* Details */}
                        <div className="space-y-2.5 mb-5">
                            <div className="flex justify-between text-sm">
                                <span className="text-[var(--muted)]">Student</span>
                                <span className="text-white font-medium">{alertInfo.studentName}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-[var(--muted)]">Risk Level</span>
                                <span className={`font-semibold ${alertInfo.riskLevel === "High" ? "text-red-400" : alertInfo.riskLevel === "Medium" ? "text-yellow-400" : "text-green-400"}`}>
                                    {alertInfo.riskLevel} ({alertInfo.riskScore}%)
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-[var(--muted)]">Top Risk Indicator</span>
                                <span className="text-white font-medium text-right max-w-[180px]">{alertInfo.topFactor}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-[var(--muted)]">Recommended Next Action</span>
                                <span className="text-white font-medium text-right max-w-[180px]">{alertInfo.nextAction}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-[var(--muted)]">Timestamp</span>
                                <span className="text-white font-medium text-xs">{alertInfo.timestamp}</span>
                            </div>
                        </div>
                        {/* Demo disclaimer */}
                        <div className="bg-blue-500/8 border border-blue-500/20 rounded-lg px-4 py-2.5 mb-5">
                            <p className="text-[11px] text-blue-300/80">
                                ℹ️ Demo notification — no external message was sent. In production, this would notify the assigned academic advisor via email or institutional messaging system.
                            </p>
                        </div>
                        <button
                            onClick={() => setShowAlertModal(false)}
                            className="w-full px-4 py-2.5 bg-[var(--accent)] hover:bg-[var(--accent-light)] text-white text-sm font-medium rounded-lg transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}

            {/* Back button */}
            <a href="/" className="inline-flex items-center gap-2 text-[var(--muted)] hover:text-white text-sm mb-6 transition-colors">
                ← Back to Dashboard
            </a>

            {/* Student Header */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                {/* Info Card */}
                <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-full bg-[var(--accent)] flex items-center justify-center text-white text-lg font-bold flex-shrink-0">
                            {student.name.charAt(0)}
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-white">{student.name}</h1>
                            <p className="text-[var(--muted)] text-sm mt-0.5">{student.id}</p>
                        </div>
                    </div>
                    <div className="mt-5 space-y-2.5">
                        <div className="flex justify-between text-sm">
                            <span className="text-[var(--muted)]">Department</span>
                            <span className="text-white font-medium">{student.department}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-[var(--muted)]">Year</span>
                            <span className="text-white font-medium">{student.year}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-[var(--muted)]">Email</span>
                            <span className="text-white font-medium text-xs">{student.email}</span>
                        </div>
                    </div>
                </div>

                {/* Risk Gauge */}
                <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 flex flex-col items-center justify-center">
                    <p className="text-sm text-[var(--muted)] mb-2 font-medium">Estimated Dropout Risk</p>
                    <RiskGauge score={student.risk_score} level={student.risk_level} />
                </div>

                {/* Quick Actions */}
                <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6">
                    <h3 className="text-sm font-semibold text-white mb-4">Quick Actions</h3>
                    <div className="space-y-3">
                        <button
                            onClick={() => setShowSimulator(!showSimulator)}
                            className="w-full px-4 py-2.5 bg-[var(--accent)] hover:bg-[var(--accent-light)] text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                        >
                            🔬 Open What-If Simulator
                        </button>
                        <button
                            onClick={handleSendAlert}
                            className={`w-full px-4 py-2.5 border text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${alertSent
                                    ? "bg-green-500/10 border-green-500/30 text-green-400"
                                    : "bg-[var(--card-hover)] border-[var(--border)] text-[var(--foreground)] hover:border-[var(--accent)]"
                                }`}
                        >
                            {alertSent ? "✓ Alert Sent to Advisor" : "📧 Send Alert to Advisor"}
                        </button>
                        <button
                            onClick={handleGenerateReport}
                            className={`w-full px-4 py-2.5 border text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${reportGenerated
                                    ? "bg-green-500/10 border-green-500/30 text-green-400"
                                    : "bg-[var(--card-hover)] border-[var(--border)] text-[var(--foreground)] hover:border-[var(--accent)]"
                                }`}
                        >
                            {reportGenerated ? "✓ Report Downloaded" : "📋 Generate Report"}
                        </button>
                    </div>
                </div>
            </div>

            {/* Key Risk Indicators */}
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 mb-6">
                <h2 className="text-lg font-semibold text-white mb-1">Why was this student flagged?</h2>
                <p className="text-xs text-[var(--muted)] mb-5">Key risk indicators from the predictive model (correlation, not causation)</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {topContributions.map((c, i) => (
                        <div key={i} className="bg-[var(--background)] border border-[var(--border)] rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-white">{c.label}</span>
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.direction === "increases" ? "bg-red-500/10 text-red-400" : "bg-green-500/10 text-green-400"
                                    }`}>
                                    {c.direction === "increases" ? "↑ Risk Indicator" : "↓ Protective"}
                                </span>
                            </div>
                            <div className="flex items-end justify-between">
                                <div>
                                    <span className="text-xs text-[var(--muted)]">Value: </span>
                                    <span className="text-sm text-white font-semibold">{typeof c.value === "number" ? (Number.isInteger(c.value) ? c.value : c.value.toFixed(2)) : c.value}</span>
                                </div>
                                <div className="w-24 h-1.5 bg-[var(--border)] rounded-full overflow-hidden">
                                    <div
                                        className="h-full rounded-full"
                                        style={{
                                            width: `${Math.min(100, (c.abs_impact / (topContributions[0]?.abs_impact || 1)) * 100)}%`,
                                            background: c.direction === "increases" ? "var(--high-risk)" : "var(--low-risk)",
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Recommended Interventions */}
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 mb-6">
                <h2 className="text-lg font-semibold text-white mb-1">Recommended Interventions</h2>
                <p className="text-xs text-[var(--muted)] mb-5">Interventions based on identified risk indicators</p>
                <div className="space-y-3">
                    {student.interventions.map((int, i) => (
                        <div key={i} className="flex items-start gap-4 bg-[var(--background)] border border-[var(--border)] rounded-lg p-4">
                            <span className="text-xl flex-shrink-0 mt-0.5">{IconForType(int.icon)}</span>
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <h3 className="text-sm font-semibold text-white">{int.title}</h3>
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${int.priority === "Critical" ? "bg-red-500/15 text-red-400" :
                                        int.priority === "High" ? "bg-orange-500/15 text-orange-400" :
                                            "bg-blue-500/15 text-blue-400"
                                        }`}>
                                        {int.priority}
                                    </span>
                                </div>
                                <p className="text-xs text-[var(--muted)] mt-1">{int.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* What-If Simulator */}
            {showSimulator && (
                <div className="bg-[var(--card)] border-2 border-[var(--accent)] rounded-xl p-6 mb-6">
                    <div className="flex items-center gap-3 mb-1">
                        <span className="text-xl">🔬</span>
                        <h2 className="text-lg font-semibold text-white">What-If Simulator</h2>
                    </div>
                    <p className="text-xs text-[var(--muted)] mb-6">
                        Adjust scenario variables and rerun the ML model to see estimated risk change.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                        {whatIfFeatures.map((f) => {
                            const isBinary = f.min === 0 && f.max === 1 && f.step === 1;
                            return (
                                <div key={f.key} className="bg-[var(--background)] border border-[var(--border)] rounded-lg p-4">
                                    <label className="text-sm font-medium text-white block mb-1">{f.label}</label>
                                    <p className="text-[10px] text-[var(--muted)] mb-3">{f.description}</p>
                                    {isBinary ? (
                                        <div className="flex items-center gap-3">
                                            <div className="flex rounded-lg overflow-hidden border border-[var(--border)] flex-1">
                                                <button
                                                    type="button"
                                                    onClick={() => setScenario({ ...scenario, [f.key]: 0 })}
                                                    className={`flex-1 px-3 py-2 text-xs font-semibold transition-colors ${(scenario[f.key] ?? 0) === 0
                                                        ? "bg-red-500/20 text-red-400 border-r border-[var(--border)]"
                                                        : "bg-transparent text-[var(--muted)] border-r border-[var(--border)] hover:text-white"
                                                        }`}
                                                >
                                                    ✗ Not Paid
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setScenario({ ...scenario, [f.key]: 1 })}
                                                    className={`flex-1 px-3 py-2 text-xs font-semibold transition-colors ${(scenario[f.key] ?? 0) === 1
                                                        ? "bg-green-500/20 text-green-400"
                                                        : "bg-transparent text-[var(--muted)] hover:text-white"
                                                        }`}
                                                >
                                                    ✓ Paid
                                                </button>
                                            </div>
                                            <div className="text-right min-w-[60px]">
                                                <span className="text-xs text-[var(--muted)]">
                                                    {student.features[f.key] === 1 ? "Paid" : "Not Paid"}
                                                </span>
                                                <span className="text-xs text-[var(--muted)]"> → </span>
                                                <span className="text-sm font-semibold text-white">
                                                    {(scenario[f.key] ?? 0) === 1 ? "Paid" : "Not Paid"}
                                                </span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="range"
                                                min={f.min}
                                                max={f.max}
                                                step={f.step}
                                                value={scenario[f.key] ?? 0}
                                                onChange={(e) => setScenario({ ...scenario, [f.key]: parseFloat(e.target.value) })}
                                                className="flex-1 accent-[var(--accent)]"
                                            />
                                            <div className="text-right min-w-[60px]">
                                                <span className="text-xs text-[var(--muted)]">
                                                    {student.features[f.key] !== undefined ? (Number.isInteger(student.features[f.key]) ? student.features[f.key] : student.features[f.key].toFixed(1)) : "—"}
                                                </span>
                                                <span className="text-xs text-[var(--muted)]"> → </span>
                                                <span className="text-sm font-semibold text-white">
                                                    {scenario[f.key] !== undefined ? (f.type === "float" ? scenario[f.key].toFixed(1) : scenario[f.key]) : "—"}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    <button
                        onClick={runSimulation}
                        disabled={simulating}
                        className="w-full px-6 py-3 bg-[var(--accent)] hover:bg-[var(--accent-light)] disabled:opacity-50 text-white font-semibold rounded-lg transition-colors text-sm"
                    >
                        {simulating ? "Running model..." : "Run Scenario Prediction"}
                    </button>

                    {/* Results */}
                    {whatIfResult && (
                        <div className="mt-6">
                            <div className="grid grid-cols-3 gap-4 mb-4">
                                <div className="bg-[var(--background)] border border-[var(--border)] rounded-lg p-4 text-center">
                                    <p className="text-xs text-[var(--muted)] mb-1">Current Risk</p>
                                    <p className="text-2xl font-bold text-white">{whatIfResult.current_risk}%</p>
                                </div>
                                <div className="bg-[var(--background)] border border-[var(--border)] rounded-lg p-4 text-center">
                                    <p className="text-xs text-[var(--muted)] mb-1">Scenario Risk</p>
                                    <p className="text-2xl font-bold" style={{
                                        color: whatIfResult.scenario_risk < whatIfResult.current_risk ? "var(--low-risk)" :
                                            whatIfResult.scenario_risk > whatIfResult.current_risk ? "var(--high-risk)" : "var(--foreground)"
                                    }}>
                                        {whatIfResult.scenario_risk}%
                                    </p>
                                </div>
                                <div className="bg-[var(--background)] border border-[var(--border)] rounded-lg p-4 text-center">
                                    <p className="text-xs text-[var(--muted)] mb-1">Difference</p>
                                    <p className="text-2xl font-bold" style={{
                                        color: whatIfResult.difference < 0 ? "var(--low-risk)" :
                                            whatIfResult.difference > 0 ? "var(--high-risk)" : "var(--foreground)"
                                    }}>
                                        {whatIfResult.difference > 0 ? "+" : ""}{whatIfResult.difference} pp
                                    </p>
                                </div>
                            </div>
                            <p className="text-[10px] text-[var(--muted)] text-center italic">
                                Scenario results show how the predictive model responds to changed inputs. They do not prove causal impact.
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
