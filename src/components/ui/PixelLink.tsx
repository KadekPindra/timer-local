import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { sizeClasses, variantClasses, type Size, type Variant } from "./PixelButton";

type PixelLinkProps = ComponentProps<typeof Link> & {
    variant?: Variant;
    size?: Size;
    icon?: ReactNode;
};

export default function PixelLink({
    variant = "secondary",
    size = "lg",
    icon,
    className = "",
    children,
    ...props
}: PixelLinkProps) {
    return (
        <Link
            className={`inline-flex shrink-0 items-center rounded-lg border-2 font-pixel tracking-[1px] whitespace-nowrap uppercase transition-[transform,filter] duration-100 hover:brightness-105 active:translate-y-0.75 ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
            {...props}
        >
            {icon}
            {children}
        </Link>
    );
}
