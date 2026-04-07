"use client";

import {useState, useEffect} from "react";
import {
    getDepartmentJDs,
    triggerMatch,
    getMatches,
    type JD,
    type Match,
} from "@/lib/api";
import LoadingSpinner from "./LoadingSpinner";

interface MatchSectionProps {
    cvId: number;
    departmentId: number;
}

export default function MatchSection({
                                         cvId,
                                         departmentId,
                                     }: MatchSectionProps) {
    const [jds, setJDs] = useState<JD[]>([]);
    const [matches, setMatches] = useState<Match[]>([]);
    const [selectedJDId, setSelectedJDId] = useState<number | "">("");
    const [matching, setMatching] = useState(false);
    const [loadingMatches, setLoadingMatches] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        Promise.all([
            getDepartmentJDs(departmentId),
            getMatches(cvId),
        ])
            .then(([jdList, matchList]) => {
                setJDs(jdList);
                setMatches(matchList);
                if (jdList.length > 0) setSelectedJDId(jdList[0].id);
            })
            .catch(() => {
            })
            .finally(() => setLoadingMatches(false));
    }, [cvId, departmentId]);

    async function handleMatch() {
        if (!selectedJDId) return;
        setMatching(true);
        setError(null);
        try {
            const result = await triggerMatch(cvId, selectedJDId as number);
            setMatches((prev) => {
                const filtered = prev.filter((m) => m.jd_id !== result.jd_id);
                return [result, ...filtered];
            });
        } catch (err) {
            setError(err instanceof Error ? err.message : "Match failed");
        } finally {
            setMatching(false);
        }
    }

    function matchColor(pct: number): string {
        if (pct > 70) return "bg-green-500";
        if (pct >= 40) return "bg-yellow-500";
        return "bg-red-500";
    }

    function matchTextColor(pct: number): string {
        if (pct > 70) return "text-green-700";
        if (pct >= 40) return "text-yellow-700";
        return "text-red-700";
    }

    function matchBgColor(pct: number): string {
        if (pct > 70) return "bg-green-50";
        if (pct >= 40) return "bg-yellow-50";
        return "bg-red-50";
    }

    return (
        <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900">JD Matching</h3>

            {/* Match trigger */}
            <div className="mt-4 flex items-end gap-3">
                <div className="flex-1">
                    <label
                        htmlFor="jd-select"
                        className="block text-sm font-medium text-gray-700"
                    >
                        Select Job Description
                    </label>
                    <select
                        id="jd-select"
                        value={selectedJDId}
                        onChange={(e) =>
                            setSelectedJDId(
                                e.target.value ? Number(e.target.value) : ""
                            )
                        }
                        className="input-field mt-1"
                        disabled={jds.length === 0 || matching}
                    >
                        {jds.length === 0 ? (
                            <option value="">No job descriptions available</option>
                        ) : (
                            jds.map((jd) => (
                                <option key={jd.id} value={jd.id}>
                                    {jd.title}
                                </option>
                            ))
                        )}
                    </select>
                </div>
                <button
                    onClick={handleMatch}
                    disabled={!selectedJDId || matching}
                    className="btn-primary shrink-0"
                >
                    {matching ? (
                        <span className="flex items-center gap-2">
              <LoadingSpinner size="sm"/>
              Matching...
            </span>
                    ) : (
                        "Match"
                    )}
                </button>
            </div>

            {error && (
                <div className="mt-3 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                </div>
            )}

            {matching && (
                <div className="mt-6 flex flex-col items-center py-6">
                    <LoadingSpinner size="lg" label="AI is comparing CV with JD..."/>
                </div>
            )}

            {/* Existing matches */}
            <div className="mt-6">
                <h4 className="text-sm font-semibold text-gray-700">Match Results</h4>

                {loadingMatches ? (
                    <div className="mt-4 flex justify-center py-4">
                        <LoadingSpinner size="md"/>
                    </div>
                ) : matches.length === 0 ? (
                    <div className="mt-3 rounded-lg border border-dashed border-gray-300 px-6 py-6 text-center">
                        <svg
                            className="mx-auto h-8 w-8 text-gray-300"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5"
                            />
                        </svg>
                        <p className="mt-2 text-sm text-gray-500">
                            No matches yet. Select a JD and click Match to compare.
                        </p>
                    </div>
                ) : (
                    <div className="mt-3 space-y-4">
                        {matches.map((match) => {
                            const jdTitle =
                                match.jd_title ||
                                jds.find((j) => j.id === match.jd_id)?.title ||
                                `JD #${match.jd_id}`;

                            const matched = (match.matched_items || []).filter((i) => i.status === "matched");
                            const partial = (match.matched_items || []).filter((i) => i.status === "partial");
                            const missing = (match.matched_items || []).filter((i) => i.status === "missing");

                            return (
                                <div
                                    key={match.id}
                                    className="rounded-lg border border-gray-200 bg-white p-4"
                                >
                                    <div className="flex items-center justify-between">
                                        <h5 className="text-sm font-medium text-gray-900">
                                            {jdTitle}
                                        </h5>
                                        <span
                                            className={`rounded-full px-3 py-1 text-sm font-bold ${matchTextColor(
                                                match.match_percentage
                                            )} ${matchBgColor(match.match_percentage)}`}
                                        >
                      {match.match_percentage}%
                    </span>
                                    </div>

                                    {/* Progress bar */}
                                    <div className="mt-2 h-2 w-full rounded-full bg-gray-100">
                                        <div
                                            className={`h-2 rounded-full transition-all ${matchColor(
                                                match.match_percentage
                                            )}`}
                                            style={{width: `${match.match_percentage}%`}}
                                        />
                                    </div>

                                    {/* Summary */}
                                    {match.match_details && (
                                        <p className="mt-3 text-sm leading-relaxed text-gray-600">
                                            {match.match_details}
                                        </p>
                                    )}

                                    {/* Matched Items Breakdown */}
                                    {(match.matched_items || []).length > 0 && (
                                        <div className="mt-4 space-y-3">
                                            {/* Stats bar */}
                                            <div className="flex items-center gap-4 text-xs font-medium">
                        <span className="flex items-center gap-1 text-green-700">
                          <span className="inline-block h-2 w-2 rounded-full bg-green-500"/>
                            {matched.length} matched
                        </span>
                                                <span className="flex items-center gap-1 text-yellow-700">
                          <span className="inline-block h-2 w-2 rounded-full bg-yellow-500"/>
                                                    {partial.length} partial
                        </span>
                                                <span className="flex items-center gap-1 text-red-700">
                          <span className="inline-block h-2 w-2 rounded-full bg-red-500"/>
                                                    {missing.length} missing
                        </span>
                                            </div>

                                            {/* Items list */}
                                            <div className="space-y-2">
                                                {(match.matched_items || []).map((item, i) => {
                                                    const configs = {
                                                        matched: {
                                                            icon: (
                                                                <svg className="h-4 w-4 text-green-500" fill="none"
                                                                     viewBox="0 0 24 24" strokeWidth={2}
                                                                     stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round"
                                                                          d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
                                                                </svg>
                                                            ),
                                                            bg: "bg-green-50 border-green-200",
                                                            label: "text-green-700",
                                                        },
                                                        partial: {
                                                            icon: (
                                                                <svg className="h-4 w-4 text-yellow-500" fill="none"
                                                                     viewBox="0 0 24 24" strokeWidth={2}
                                                                     stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round"
                                                                          d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"/>
                                                                </svg>
                                                            ),
                                                            bg: "bg-yellow-50 border-yellow-200",
                                                            label: "text-yellow-700",
                                                        },
                                                        missing: {
                                                            icon: (
                                                                <svg className="h-4 w-4 text-red-500" fill="none"
                                                                     viewBox="0 0 24 24" strokeWidth={2}
                                                                     stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round"
                                                                          d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
                                                                </svg>
                                                            ),
                                                            bg: "bg-red-50 border-red-200",
                                                            label: "text-red-700",
                                                        },
                                                    };
                                                    const statusConfig = configs[item.status] || configs.missing;

                                                    return (
                                                        <div
                                                            key={i}
                                                            className={`rounded-lg border p-3 ${statusConfig.bg}`}
                                                        >
                                                            <div className="flex items-start gap-2">
                                                                <span
                                                                    className="mt-0.5 shrink-0">{statusConfig.icon}</span>
                                                                <div className="min-w-0 flex-1">
                                                                    <p className={`text-sm font-medium ${statusConfig.label}`}>
                                                                        {item.requirement}
                                                                    </p>
                                                                    <p className="mt-0.5 text-xs text-gray-600">
                                                                        {item.evidence}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    <p className="mt-3 text-xs text-gray-400">
                                        {new Date(match.created_at).toLocaleDateString("en-US", {
                                            year: "numeric",
                                            month: "short",
                                            day: "numeric",
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
