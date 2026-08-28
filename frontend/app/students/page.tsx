"use client";

import { useEffect, useState } from "react";
import { fetchAPI } from "@/lib/api";

interface StudentSummary {
    id: string;
    name: string;
    department: string;
    year: number;
    risk_score: number;
    risk_level: string;
    top_risk_factor: string;
}

function RiskBadge({ level }: { level: string }) {
    const cls = level === "High" ? "risk-high" : level === "Medium" ? "risk-medium" : "risk-low";
    const icon = level === "High" ? "▲" : level === "Medium" ? "●" : "▼";
    return (
        <span className={`${cls} inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold`}>
            {icon} {level}
        </span>
    );
}

type FilterLevel = "All" | "High" | "Medium" | "Low";

export default function StudentsPage() {
    const [students, setStudents] = useState<StudentSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<FilterLevel>("All");

    useEffect(() => {
        fetchAPI("/api/students")
            .then((data) => setStudents(data.students))
            .catch((e) => setError(e.message))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return (
        <div className="flex items-center justify-center h-96">
            <div className="text-[var(--muted)] text-lg">Loading students...</div>
        </div>
    );
    if (error) return (
        <div className="flex items-center justify-center h-96">
            <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-6 max-w-md text-center">
                <p className="text-red-400 font-medium">Failed to load students</p>
                <p className="text-red-400/70 text-sm mt-2">{error}</p>
                <p className="text-[var(--muted)] text-xs mt-3">Make sure the backend is running on port 8000</p>
            </div>
        </div>
    );

    const filtered = filter === "All"
        ? students
        : students.filter((s) => s.risk_level === filter);

    const sorted = [...filtered].sort((a, b) => b.risk_score - a.risk_score);

    const counts = {
        All: students.length,
        High: students.filter((s) => s.risk_level === "High").length,
        Medium: students.filter((s) => s.risk_level === "Medium").length,
        Low: students.filter((s) => s.risk_level === "Low").length,
    };

    const filterButtons: FilterLevel[] = ["All", "High", "Medium", "Low"];

    return (
        <div>
            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center gap-3 mb-1">
                    <a href="/" className="text-[var(--muted)] hover:text-white text-sm transition-colors">← Dashboard</a>
                </div>
                <h1 className="text-2xl font-bold text-white mt-3">All Students</h1>
                <p className="text-[var(--muted)] text-sm mt-1">
                    Complete student directory — {students.length} students monitored
                </p>
            </div>

            {/* Filter buttons */}
            <div className="flex items-center gap-2 mb-5">
                {filterButtons.map((level) => (
                    <button
                        key={level}
                        onClick={() => setFilter(level)}
                        className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors ${filter === level
                                ? level === "High"
                                    ? "bg-red-500/20 text-red-400 border border-red-500/30"
                                    : level === "Medium"
                                        ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                                        : level === "Low"
                                            ? "bg-green-500/20 text-green-400 border border-green-500/30"
                                            : "bg-[var(--accent)]/20 text-[var(--accent-light)] border border-[var(--accent)]/30"
                                : "bg-[var(--card)] text-[var(--muted)] border border-[var(--border)] hover:text-white hover:border-[var(--accent)]"
                            }`}
                    >
                        {level} ({counts[level]})
                    </button>
                ))}
            </div>

            {/* Students Table */}
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-[var(--border)]">
                                <th className="text-left text-xs font-medium text-[var(--muted)] uppercase tracking-wider px-5 py-3">Student</th>
                                <th className="text-left text-xs font-medium text-[var(--muted)] uppercase tracking-wider px-5 py-3">Department</th>
                                <th className="text-left text-xs font-medium text-[var(--muted)] uppercase tracking-wider px-5 py-3">Risk %</th>
                                <th className="text-left text-xs font-medium text-[var(--muted)] uppercase tracking-wider px-5 py-3">Risk Level</th>
                                <th className="text-left text-xs font-medium text-[var(--muted)] uppercase tracking-wider px-5 py-3">Key Risk Indicator</th>
                                <th className="text-right text-xs font-medium text-[var(--muted)] uppercase tracking-wider px-5 py-3">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sorted.map((s) => (
                                <tr key={s.id} className="border-b border-[var(--border)] hover:bg-[var(--card-hover)] transition-colors">
                                    <td className="px-5 py-4">
                                        <div>
                                            <div className="text-sm font-medium text-white">{s.name}</div>
                                            <div className="text-xs text-[var(--muted)]">{s.id} · Year {s.year}</div>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4 text-sm text-[var(--muted)]">{s.department}</td>
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-16 h-1.5 bg-[var(--border)] rounded-full overflow-hidden">
                                                <div
                                                    className="h-full rounded-full"
                                                    style={{
                                                        width: `${s.risk_score}%`,
                                                        background: s.risk_level === "High" ? "var(--high-risk)" : s.risk_level === "Medium" ? "var(--medium-risk)" : "var(--low-risk)",
                                                    }}
                                                />
                                            </div>
                                            <span className="text-sm font-semibold text-white">{s.risk_score}%</span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4">
                                        <RiskBadge level={s.risk_level} />
                                    </td>
                                    <td className="px-5 py-4 text-sm text-[var(--muted)] max-w-[200px] truncate">{s.top_risk_factor}</td>
                                    <td className="px-5 py-4 text-right">
                                        <a
                                            href={`/student/${s.id}`}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[var(--accent)] hover:bg-[var(--accent-light)] text-white text-xs font-medium rounded-lg transition-colors"
                                        >
                                            View →
                                        </a>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {sorted.length === 0 && (
                    <div className="flex items-center justify-center py-12 text-[var(--muted)] text-sm">
                        No students found for the selected filter.
                    </div>
                )}
            </div>
        </div>
    );
}
