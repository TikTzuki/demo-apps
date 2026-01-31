"use client";

import {cn} from "@/lib/utils";
import {cva, type VariantProps} from "class-variance-authority";
import {forwardRef} from "react";

const buttonVariants = cva(
    "inline-flex items-center justify-center rounded-full font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 disabled:pointer-events-none disabled:opacity-50 active:scale-95",
    {
        variants: {
            variant: {
                default: "bg-white text-primary shadow-lg hover:bg-white/90",
                primary: "bg-primary text-white shadow-lg hover:bg-primary/90",
                success: "bg-success text-white shadow-lg hover:bg-success/90",
                danger: "bg-danger text-white shadow-lg hover:bg-danger/90",
                ghost: "bg-white/20 text-white hover:bg-white/30",
                outline: "border-2 border-white text-white hover:bg-white/10",
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
