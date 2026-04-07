"use client";

import {useState} from "react";
import {triggerReview, type Review} from "@/lib/api";
import LoadingSpinner from "./LoadingSpinner";

interface ReviewSectionProps {
    cvId: number;
    initialReview?: Review | null;
}

export default function ReviewSection({
                                          cvId,
                                          initialReview,
                                      }: ReviewSectionProps) {
    const [review, setReview] = useState<Review | null>(initialReview ?? null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [note, setNote] = useState("");
    const [showNote, setShowNote] = useState(false);

    async function handleReview() {
        setLoading(true);
        setError(null);
        try {
            const result = await triggerReview(cvId, note);
            setReview(result);
            setShowNote(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Review failed");
        } finally {
            setLoading(false);
        }
    }

    function scoreColor(score: number): string {
        if (score >= 8) return "text-green-600";
        if (score >= 6) return "text-yellow-600";
        if (score >= 4) return "text-orange-600";
        return "text-red-600";
    }

    function scoreBgColor(score: number): string {
        if (score >= 8) return "bg-green-500";
        if (score >= 6) return "bg-yellow-500";
        if (score >= 4) return "bg-orange-500";
        return "bg-red-500";
    }

    return (
        <div className="card p-6">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">AI Review</h3>
                {!showNote && (
                    <button
                        onClick={() => setShowNote(true)}
                        disabled={loading}
                        className="btn-primary"
                    >
                        {loading ? (
                            <span className="flex items-center gap-2">
                <LoadingSpinner size="sm"/>
                Reviewing...
              </span>
                        ) : review ? (
                            "Re-review"
                        ) : (
                            "Review"
                        )}
                    </button>
                )}
            </div>

            {showNote && !loading && (
                <div className="mt-4 space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <label className="block text-sm font-medium text-gray-700">
                        Ghi chu cho AI (tuy chon)
                    </label>
                    <textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        rows={3}
                        placeholder="VD: Danh gia ky hon ve kinh nghiem lam viec voi microservices, hoac chu y den kha nang lanh dao..."
                        className="textarea-field w-full"
                    />
                    <div className="flex items-center justify-end gap-2">
                        <button
                            onClick={() => {
                                setShowNote(false);
                                setNote("");
                            }}
                            className="btn-secondary"
                        >
                            Cancel
                        </button>
                        <button onClick={handleReview} className="btn-primary">
                            Submit Review
                        </button>
                    </div>
                </div>
            )}

            {error && (
                <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                </div>
            )}

            {loading && !review && (
                <div className="mt-8 flex flex-col items-center justify-center py-8">
                    <LoadingSpinner size="lg" label="AI is analyzing the CV..."/>
                </div>
            )}

            {review && !loading && (
                <div className="mt-5 space-y-5">
                    {/* Score */}
                    <div className="flex items-center gap-4">
                        <div className="flex flex-col items-center">
              <span
                  className={`text-4xl font-bold ${scoreColor(
                      review.overall_score
                  )}`}
              >
                {review.overall_score}
              </span>
                            <span className="text-sm text-gray-400">out of 10</span>
                        </div>
                        <div className="flex-1">
                            <div className="h-3 w-full rounded-full bg-gray-200">
                                <div
                                    className={`h-3 rounded-full transition-all ${scoreBgColor(
                                        review.overall_score
                                    )}`}
                                    style={{
                                        width: `${(review.overall_score / 10) * 100}%`,
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Strengths */}
                    {review.strengths && review.strengths.length > 0 && (
                        <div>
                            <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                                <svg
                                    className="h-4 w-4 text-green-500"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth={2}
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                                    />
                                </svg>
                                Strengths
                            </h4>
                            <ul className="mt-2 space-y-1.5">
                                {review.strengths.map((s, i) => (
                                    <li
                                        key={i}
                                        className="flex items-start gap-2 text-sm text-gray-600"
                                    >
                                        <span className="mt-1 block h-1.5 w-1.5 shrink-0 rounded-full bg-green-400"/>
                                        {s}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Weaknesses */}
                    {review.weaknesses && review.weaknesses.length > 0 && (
                        <div>
                            <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                                <svg
                                    className="h-4 w-4 text-red-500"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth={2}
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
                                    />
                                </svg>
                                Areas for Improvement
                            </h4>
                            <ul className="mt-2 space-y-1.5">
                                {review.weaknesses.map((w, i) => (
                                    <li
                                        key={i}
                                        className="flex items-start gap-2 text-sm text-gray-600"
                                    >
                                        <span className="mt-1 block h-1.5 w-1.5 shrink-0 rounded-full bg-red-400"/>
                                        {w}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Detailed Review */}
                    {review.detailed_review && (
                        <div>
                            <h4 className="text-sm font-semibold text-gray-700">
                                Detailed Review
                            </h4>
                            <pre
                                className="mt-2 whitespace-pre-wrap rounded-lg bg-gray-50 p-4 text-sm leading-relaxed text-gray-700 ring-1 ring-inset ring-gray-200">
                {review.detailed_review}
              </pre>
                        </div>
                    )}

                    {/* Timestamp */}
                    <p className="text-xs text-gray-400">
                        Reviewed on{" "}
                        {new Date(review.created_at).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                        })}
                    </p>
                </div>
            )}

            {!review && !loading && !error && (
                <div className="mt-4 rounded-lg border border-dashed border-gray-300 px-6 py-8 text-center">
                    <svg
                        className="mx-auto h-10 w-10 text-gray-300"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z"
                        />
                    </svg>
                    <p className="mt-3 text-sm text-gray-500">
                        No review yet. Click the Review button to get an AI-powered analysis
                        of this CV.
                    </p>
                </div>
            )}
        </div>
    );
}
