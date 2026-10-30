import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Icon({ size = 20, children, ...props }: IconProps) {
    return (
        <svg
            aria-hidden="true"
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            {...props}
        >
            {children}
        </svg>
    );
}

export function PlusIcon(props: IconProps) {
    return (
        <Icon size={18} strokeWidth={3} strokeLinecap="square" {...props}>
            <path d="M12 5v14M5 12h14" />
        </Icon>
    );
}

export function CloseIcon(props: IconProps) {
    return (
        <Icon size={18} strokeWidth={3} strokeLinecap="square" {...props}>
            <path d="M6 6l12 12M18 6 6 18" />
        </Icon>
    );
}

export function FullscreenIcon(props: IconProps) {
    return (
        <Icon strokeWidth={2.5} strokeLinecap="square" {...props}>
            <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
        </Icon>
    );
}

export function ExitFullscreenIcon(props: IconProps) {
    return (
        <Icon strokeWidth={2.5} strokeLinecap="square" {...props}>
            <path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" />
        </Icon>
    );
}

export function SpinnerIcon(props: IconProps) {
    return (
        <Icon size={28} strokeWidth={2.5} strokeLinecap="round" {...props}>
            <path d="M21 12a9 9 0 1 1-6.2-8.56" />
        </Icon>
    );
}

export function CheckIcon(props: IconProps) {
    return (
        <Icon size={18} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" {...props}>
            <path d="M5 12l5 5 9-10" />
        </Icon>
    );
}

export function BellIcon(props: IconProps) {
    return (
        <Icon strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" {...props}>
            <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
            <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </Icon>
    );
}

export function SettingsIcon(props: IconProps) {
    return (
        <Icon size={18} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" {...props}>
            <path d="M4 7h10M18 7h2M4 17h2M10 17h10" />
            <circle cx="16" cy="7" r="2" />
            <circle cx="8" cy="17" r="2" />
        </Icon>
    );
}

export function PlayIcon(props: IconProps) {
    return (
        <Icon size={16} fill="currentColor" stroke="none" {...props}>
            <path d="M7 4v16l13-8z" />
        </Icon>
    );
}

export function PauseIcon(props: IconProps) {
    return (
        <Icon size={22} fill="currentColor" stroke="none" {...props}>
            <path d="M6 4h4v16H6zM14 4h4v16h-4z" />
        </Icon>
    );
}

export function ResetIcon(props: IconProps) {
    return (
        <Icon strokeWidth={2.5} strokeLinecap="round" {...props}>
            <path d="M3 12a9 9 0 1 0 3-6.7" />
            <path d="M3 4v5h5" />
        </Icon>
    );
}

export function ChevronLeftIcon(props: IconProps) {
    return (
        <Icon size={18} strokeWidth={2.5} strokeLinecap="square" {...props}>
            <path d="M15 6l-6 6 6 6" />
        </Icon>
    );
}

export function ChevronRightIcon(props: IconProps) {
    return (
        <Icon strokeWidth={2.5} strokeLinecap="square" {...props}>
            <path d="M9 6l6 6-6 6" />
        </Icon>
    );
}

export function ChevronUpIcon(props: IconProps) {
    return (
        <Icon size={18} strokeWidth={2.5} strokeLinecap="square" {...props}>
            <path d="M6 15l6-6 6 6" />
        </Icon>
    );
}

export function ChevronDownIcon(props: IconProps) {
    return (
        <Icon size={18} strokeWidth={2.5} strokeLinecap="square" {...props}>
            <path d="M6 9l6 6 6-6" />
        </Icon>
    );
}

export function TrashIcon(props: IconProps) {
    return (
        <Icon size={18} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" {...props}>
            <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" />
        </Icon>
    );
}

export function DuplicateIcon(props: IconProps) {
    return (
        <Icon size={18} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" {...props}>
            <rect x="9" y="9" width="11" height="11" rx="2" />
            <path d="M5 15V5a2 2 0 0 1 2-2h10" />
        </Icon>
    );
}

export function VolumeIcon(props: IconProps) {
    return (
        <Icon size={22} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" {...props}>
            <path d="M11 5 6 9H3v6h3l5 4z" />
            <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" />
        </Icon>
    );
}

export function InfoIcon(props: IconProps) {
    return (
        <Icon strokeWidth={2} strokeLinecap="round" {...props}>
            <circle cx="12" cy="12" r="9" />
            <path d="M12 8v5M12 16.5v.5" />
        </Icon>
    );
}
