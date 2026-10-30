import type { ComponentProps, ReactNode } from "react";

export type Variant = "primary" | "secondary" | "accent" | "danger" | "blue";
export type Size = "sm" | "md" | "lg" | "xl" | "2xl" | "icon";

type PixelButtonProps = ComponentProps<"button"> & {
    variant?: Variant;
    size?: Size;
    icon?: ReactNode;
};

export const variantClasses: Record<Variant, string> = {
    primary:
        "border-itcc-orange-900 bg-linear-to-b from-itcc-orange-300 to-itcc-orange-500 text-white shadow-btn-primary text-shadow-pixel",
    secondary: "border-itcc-blue-500 bg-white text-itcc-blue-700 shadow-btn-secondary",
    accent: "border-itcc-orange-500 bg-white text-itcc-red shadow-btn-primary",
    danger: "border-itcc-orange-500 bg-white text-itcc-danger",
    blue: "border-itcc-navy bg-linear-to-b from-itcc-blue-400 to-itcc-blue-700 text-white shadow-btn-navy text-shadow-pixel-navy",
};

export const sizeClasses: Record<Size, string> = {
    sm: "h-11 gap-2 px-5 text-[15px]",
    md: "h-12 gap-2 px-4.5 text-[15px]",
    lg: "h-12 gap-2 px-5.5 text-[17px]",
    xl: "h-13 gap-2.5 px-7 text-xl",
    "2xl": "h-16 gap-3 px-7.5 text-2xl",
    icon: "size-12 justify-center",
};

export default function PixelButton({
    variant = "secondary",
    size = "lg",
    icon,
    type = "button",
    className = "",
    children,
    ...props
}: PixelButtonProps) {
    return (
        <button
            type={type}
            className={`inline-flex shrink-0 cursor-pointer items-center rounded-lg border-2 font-pixel tracking-[1px] whitespace-nowrap uppercase transition-[transform,filter] duration-100 enabled:hover:brightness-105 enabled:active:translate-y-0.75 disabled:cursor-not-allowed disabled:opacity-45 ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
            {...props}
        >
            {icon}
            {children}
        </button>
    );
}
