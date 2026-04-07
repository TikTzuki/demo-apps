"use client";

interface LoadingSpinnerProps {
    size?: "sm" | "md" | "lg";
    label?: string;
}

export default function LoadingSpinner({
                                           size = "md",
                                           label,
                                       }: LoadingSpinnerProps) {
    const sizeClasses = {
        sm: "h-4 w-4 border-2",
        md: "h-8 w-8 border-[3px]",
        lg: "h-12 w-12 border-4",
    };

    return (
        <div className="flex flex-col items-center justify-center gap-3">
            <div
                className={`${sizeClasses[size]} animate-spin rounded-full border-indigo-200 border-t-indigo-600`}
            />
            {label && (
                <p className="text-sm text-gray-500 animate-pulse">{label}</p>
            )}
        </div>
    );
}
