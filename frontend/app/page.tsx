"use client";

import { useEffect, useState } from "react";
import { fetchAPI } from "@/lib/api";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts";

interface DashboardData {
  total: number;
  high: number;
  medium: number;
  low: number;
  department_risk: Array<{
    department: string;
    total: number;
    high: number;
    medium: number;
    low: number;
    avg_risk: number;
  }>;
  risk_distribution: Array<{ range: string; count: number }>;
}

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

function StatCard({ label, value, color, icon }: { label: string; value: number; color: string; icon: string }) {
  return (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-[var(--muted)]">{label}</span>
        <span className="text-xl">{icon}</span>
      </div>
      <div className="text-3xl font-bold" style={{ color }}>{value}</div>
    </div>
  );
}

export default function DashboardPage() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [students, setStudents] = useState<StudentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([fetchAPI("/api/dashboard"), fetchAPI("/api/students")])
      .then(([dash, studs]) => {
        setDashboard(dash);
        setStudents(studs.students);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <div className="text-[var(--muted)] text-lg">Loading dashboard...</div>
    </div>
  );
  if (error) return (
    <div className="flex items-center justify-center h-96">
      <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-6 max-w-md text-center">
        <p className="text-red-400 font-medium">Failed to load dashboard</p>
        <p className="text-red-400/70 text-sm mt-2">{error}</p>
        <p className="text-[var(--muted)] text-xs mt-3">Make sure the backend is running on port 8000</p>
      </div>
    </div>
  );
  if (!dashboard) return null;

  const COLORS = ["var(--high-risk)", "var(--medium-risk)", "var(--low-risk)"];
  const pieData = [
    { name: "High", value: dashboard.high },
    { name: "Medium", value: dashboard.medium },
    { name: "Low", value: dashboard.low },
  ].filter(d => d.value > 0);

  const priorityStudents = students
    .sort((a, b) => b.risk_score - a.risk_score)
    .slice(0, 15);

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Student Risk Dashboard</h1>
        <p className="text-[var(--muted)] text-sm mt-1">
          Predict → Explain → Intervene — AI-powered student retention risk assessment
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Students Monitored" value={dashboard.total} color="var(--foreground)" icon="👥" />
        <StatCard label="High Risk" value={dashboard.high} color="var(--high-risk)" icon="🔴" />
        <StatCard label="Medium Risk" value={dashboard.medium} color="var(--medium-risk)" icon="🟡" />
        <StatCard label="Low Risk" value={dashboard.low} color="var(--low-risk)" icon="🟢" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Risk Distribution */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5">
          <h2 className="text-base font-semibold text-white mb-4">Risk Distribution</h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={dashboard.risk_distribution}>
              <XAxis dataKey="range" tick={{ fill: "#6b7280", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#6b7280", fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  color: "var(--foreground)",
                }}
              />
              <Bar dataKey="count" fill="var(--accent)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Department Risk */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5">
          <h2 className="text-base font-semibold text-white mb-4">Department Risk</h2>
          {dashboard.department_risk.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={dashboard.department_risk} layout="vertical">
                <XAxis type="number" tick={{ fill: "#6b7280", fontSize: 12 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                <YAxis dataKey="department" type="category" tick={{ fill: "#6b7280", fontSize: 12 }} axisLine={false} tickLine={false} width={90} />
                <Tooltip
                  contentStyle={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    color: "var(--foreground)",
                  }}
                  formatter={(value: unknown) => [`${value}%`, "Avg Risk"]}
                />
                <Bar dataKey="avg_risk" fill="var(--accent-light)" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-60 text-[var(--muted)]">No data</div>
          )}
        </div>
      </div>

      {/* Priority Students Table */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl overflow-hidden">
        <div className="p-5 border-b border-[var(--border)] flex items-start justify-between">
          <div>
            <h2 className="text-base font-semibold text-white">Priority Students</h2>
            <p className="text-xs text-[var(--muted)] mt-1">Students ranked by estimated dropout risk</p>
          </div>
          <a
            href="/students"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[var(--accent)] hover:bg-[var(--accent-light)] text-white text-xs font-medium rounded-lg transition-colors whitespace-nowrap"
          >
            View All Students →
          </a>
        </div>
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
              {priorityStudents.map((s) => (
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
      </div>
    </div>
  );
}
