"use client";

import {cn} from "@/lib/utils";
import {cva, type VariantProps} from "class-variance-authority";
import {forwardRef} from "react";

const buttonVariants = cva(
    "inline-flex items-center justify-center rounded-full font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 dark:focus-visible:ring-gray-500 disabled:pointer-events-none disabled:opacity-50 active:scale-95",
    {
        variants: {
            variant: {
                default:
                    "bg-gray-900 text-white shadow-sm hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100",
                primary:
                    "bg-gray-900 text-white shadow-sm hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100",
                success:
                    "bg-green-600 text-white shadow-sm hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-500",
                danger:
                    "bg-red-600 text-white shadow-sm hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-500",
                ghost:
                    "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700",
                outline:
                    "border border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800",
            },
            size: {
                default: "h-12 px-6 py-2 text-base",
                sm: "h-10 px-4 py-1 text-sm",
                lg: "h-14 px-8 py-3 text-lg",
                icon: "h-10 w-10",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
);

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
        VariantProps<typeof buttonVariants> {
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({className, variant, size, ...props}, ref) => {
        return (
            <button
                className={cn(buttonVariants({variant, size, className}))}
                ref={ref}
                {...props}
            />
        );
    }
);
Button.displayName = "Button";

export {Button, buttonVariants};
