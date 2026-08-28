"use client";

import { useEffect, useState } from "react";
import { fetchAPI } from "@/lib/api";

interface ModelInfo {
    best_model: string;
    dataset_size: number;
    train_size: number;
    test_size: number;
    dropout_count: number;
    non_dropout_count: number;
    all_results: Record<string, {
        recall: number;
        precision: number;
        f1: number;
        confusion_matrix: number[][];
    }>;
    feature_importance: Array<[string, number]>;
    uses_scaler: boolean;
}

export default function ModelInfoPage() {
    const [info, setInfo] = useState<ModelInfo | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAPI("/api/model-info")
            .then(setInfo)
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="flex items-center justify-center h-96 text-[var(--muted)]">Loading...</div>;
    if (!info) return <div className="text-red-400 text-center mt-20">Failed to load model info</div>;

    const bestResult = info.all_results[info.best_model];

    return (
        <div>
            <a href="/" className="inline-flex items-center gap-2 text-[var(--muted)] hover:text-white text-sm mb-6 transition-colors">
                ← Back to Dashboard
            </a>

            <h1 className="text-2xl font-bold text-white mb-1">Model Insights</h1>
            <p className="text-sm text-[var(--muted)] mb-6">Actual training metrics and model information</p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Model Overview */}
                <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6">
                    <h2 className="text-base font-semibold text-white mb-4">Selected Model</h2>
                    <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                            <span className="text-[var(--muted)]">Algorithm</span>
                            <span className="text-white font-semibold">{info.best_model}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-[var(--muted)]">Dataset Size</span>
                            <span className="text-white font-semibold">{info.dataset_size.toLocaleString()} students</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-[var(--muted)]">Training Set</span>
                            <span className="text-white font-semibold">{info.train_size.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-[var(--muted)]">Test Set</span>
                            <span className="text-white font-semibold">{info.test_size.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-[var(--muted)]">Dropout Cases</span>
                            <span className="text-white font-semibold">{info.dropout_count.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-[var(--muted)]">Non-Dropout Cases</span>
                            <span className="text-white font-semibold">{info.non_dropout_count.toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                {/* Selected Model Metrics */}
                <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6">
                    <h2 className="text-base font-semibold text-white mb-4">Performance Metrics (Dropout Class)</h2>
                    {bestResult && (
                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-[var(--muted)]">Recall</span>
                                    <span className="text-white font-semibold">{(bestResult.recall * 100).toFixed(1)}%</span>
                                </div>
                                <div className="w-full h-2 bg-[var(--border)] rounded-full overflow-hidden">
                                    <div className="h-full bg-[var(--accent)] rounded-full" style={{ width: `${bestResult.recall * 100}%` }} />
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-[var(--muted)]">Precision</span>
                                    <span className="text-white font-semibold">{(bestResult.precision * 100).toFixed(1)}%</span>
                                </div>
                                <div className="w-full h-2 bg-[var(--border)] rounded-full overflow-hidden">
                                    <div className="h-full bg-[var(--accent-light)] rounded-full" style={{ width: `${bestResult.precision * 100}%` }} />
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-[var(--muted)]">F1 Score</span>
                                    <span className="text-white font-semibold">{(bestResult.f1 * 100).toFixed(1)}%</span>
                                </div>
                                <div className="w-full h-2 bg-[var(--border)] rounded-full overflow-hidden">
                                    <div className="h-full bg-green-500 rounded-full" style={{ width: `${bestResult.f1 * 100}%` }} />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Confusion Matrix */}
            {bestResult && (
                <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 mb-6">
                    <h2 className="text-base font-semibold text-white mb-4">Confusion Matrix ({info.best_model})</h2>
                    <div className="flex justify-center">
                        <div>
                            <div className="flex mb-2">
                                <div className="w-24" />
                                <div className="w-28 text-center text-xs text-[var(--muted)] font-medium">Pred: Stay</div>
                                <div className="w-28 text-center text-xs text-[var(--muted)] font-medium">Pred: Dropout</div>
                            </div>
                            <div className="flex items-center mb-2">
                                <div className="w-24 text-right pr-3 text-xs text-[var(--muted)] font-medium">Actual: Stay</div>
                                <div className="w-28 h-16 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center justify-center mx-1">
                                    <span className="text-lg font-bold text-green-400">{bestResult.confusion_matrix[0][0]}</span>
                                </div>
                                <div className="w-28 h-16 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center justify-center mx-1">
                                    <span className="text-lg font-bold text-red-400">{bestResult.confusion_matrix[0][1]}</span>
                                </div>
                            </div>
                            <div className="flex items-center">
                                <div className="w-24 text-right pr-3 text-xs text-[var(--muted)] font-medium">Actual: Dropout</div>
                                <div className="w-28 h-16 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center justify-center mx-1">
                                    <span className="text-lg font-bold text-red-400">{bestResult.confusion_matrix[1][0]}</span>
                                </div>
                                <div className="w-28 h-16 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center justify-center mx-1">
                                    <span className="text-lg font-bold text-green-400">{bestResult.confusion_matrix[1][1]}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* All Model Comparison */}
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 mb-6">
                <h2 className="text-base font-semibold text-white mb-4">Model Comparison</h2>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-[var(--border)]">
                                <th className="text-left text-xs font-medium text-[var(--muted)] uppercase px-4 py-3">Model</th>
                                <th className="text-left text-xs font-medium text-[var(--muted)] uppercase px-4 py-3">Recall</th>
                                <th className="text-left text-xs font-medium text-[var(--muted)] uppercase px-4 py-3">Precision</th>
                                <th className="text-left text-xs font-medium text-[var(--muted)] uppercase px-4 py-3">F1</th>
                                <th className="text-left text-xs font-medium text-[var(--muted)] uppercase px-4 py-3">Selected</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Object.entries(info.all_results).map(([name, r]) => (
                                <tr key={name} className={`border-b border-[var(--border)] ${name === info.best_model ? "bg-[var(--accent)]/5" : ""}`}>
                                    <td className="px-4 py-3 text-sm text-white font-medium">{name}</td>
                                    <td className="px-4 py-3 text-sm text-[var(--muted)]">{(r.recall * 100).toFixed(1)}%</td>
                                    <td className="px-4 py-3 text-sm text-[var(--muted)]">{(r.precision * 100).toFixed(1)}%</td>
                                    <td className="px-4 py-3 text-sm text-white font-semibold">{(r.f1 * 100).toFixed(1)}%</td>
                                    <td className="px-4 py-3">
                                        {name === info.best_model && (
                                            <span className="text-xs px-2 py-1 bg-[var(--accent)]/10 text-[var(--accent-light)] rounded-full font-medium">✓ Best</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Top Features */}
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 mb-6">
                <h2 className="text-base font-semibold text-white mb-4">Top Feature Importances</h2>
                <div className="space-y-2">
                    {info.feature_importance.slice(0, 10).map(([feat, imp], i) => (
                        <div key={i} className="flex items-center gap-3">
                            <span className="w-6 text-xs text-[var(--muted)] text-right">{i + 1}</span>
                            <div className="flex-1">
                                <div className="flex justify-between text-sm mb-0.5">
                                    <span className="text-[var(--muted)] truncate max-w-[250px]">{feat}</span>
                                    <span className="text-white font-medium">{(imp * 100).toFixed(1)}%</span>
                                </div>
                                <div className="w-full h-1 bg-[var(--border)] rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-[var(--accent)] rounded-full"
                                        style={{ width: `${(imp / info.feature_importance[0][1]) * 100}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Limitations */}
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6">
                <h2 className="text-base font-semibold text-white mb-3">Limitations</h2>
                <ul className="space-y-2 text-sm text-[var(--muted)]">
                    <li className="flex gap-2"><span className="text-yellow-500">⚠</span> Model trained on a single Portuguese institution's data — may not generalize to other contexts.</li>
                    <li className="flex gap-2"><span className="text-yellow-500">⚠</span> Feature importance shows model influence, not causal relationships.</li>
                    <li className="flex gap-2"><span className="text-yellow-500">⚠</span> Predictions should complement, not replace, professional academic counseling judgment.</li>
                    <li className="flex gap-2"><span className="text-yellow-500">⚠</span> Demo uses synthetic student identities mapped to real dataset feature distributions.</li>
                    <li className="flex gap-2"><span className="text-yellow-500">⚠</span> Binary classification (Dropout vs. non-Dropout) — &quot;Enrolled&quot; students treated as non-dropout.</li>
                </ul>
            </div>
        </div>
    );
}
