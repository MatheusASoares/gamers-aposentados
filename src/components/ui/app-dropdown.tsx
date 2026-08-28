"use client";

import * as React from "react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AppDropdownOption<T extends string | number = string | number> {
    value: T;
    label: string;
    icon?: React.ReactNode;
    badge?: string;
}

export interface AppDropdownProps<T extends string | number = string | number> {
    value: T;
    onChange: (value: T) => void;
    options: AppDropdownOption<T>[];
    placeholder?: string;
    icon?: React.ReactNode;
    className?: string;
    menuClassName?: string;
    accentColor?: "purple" | "amber" | "cyan" | "default";
    ariaLabel?: string;
    disabled?: boolean;
}

export function AppDropdown<T extends string | number = string | number>({
    value,
    onChange,
    options,
    placeholder = "Selecione...",
    icon,
    className,
    menuClassName,
    accentColor = "purple",
    ariaLabel,
    disabled = false,
}: AppDropdownProps<T>) {
    const [open, setOpen] = React.useState(false);

    const selectedOption = React.useMemo(() => {
        return options.find((opt) => opt.value === value);
    }, [options, value]);

    const getAccentClasses = () => {
        switch (accentColor) {
            case "amber":
                return {
                    borderFocus: "focus:border-amber-500 hover:border-amber-500/60",
                    glow: "shadow-[0_0_15px_rgba(245,158,11,0.15)]",
                    activeItem: "bg-amber-500/15 text-amber-300 font-black",
                    activeIndicator: "text-amber-400",
                };
            case "cyan":
                return {
                    borderFocus: "focus:border-cyan-500 hover:border-cyan-500/60",
                    glow: "shadow-[0_0_15px_rgba(6,182,212,0.15)]",
                    activeItem: "bg-cyan-500/15 text-cyan-300 font-black",
                    activeIndicator: "text-cyan-400",
                };
            case "purple":
            default:
                return {
                    borderFocus: "focus:border-[#bd0df2] hover:border-[#bd0df2]/60",
                    glow: "shadow-[0_0_15px_rgba(189,13,242,0.15)]",
                    activeItem: "bg-[#bd0df2]/15 text-[#bd0df2] font-black",
                    activeIndicator: "text-[#bd0df2]",
                };
        }
    };

    const accents = getAccentClasses();

    return (
        <DropdownMenuPrimitive.Root open={open} onOpenChange={setOpen}>
            <DropdownMenuPrimitive.Trigger
                disabled={disabled}
                aria-label={ariaLabel || placeholder}
                className={cn(
                    "group relative flex items-center justify-between gap-2.5 rounded-xl border border-zinc-800 bg-zinc-900/90 px-3.5 sm:px-4 py-2.5 text-xs sm:text-sm font-bold text-white transition-all outline-none",
                    "hover:bg-zinc-850 hover:text-white min-h-[44px] w-full text-left select-none cursor-pointer",
                    accents.borderFocus,
                    open && `border-zinc-700 bg-zinc-900 ${accents.glow}`,
                    disabled && "cursor-not-allowed opacity-50",
                    className
                )}
            >
                <div className="flex items-center gap-2 truncate min-w-0">
                    {icon && <span className="shrink-0 text-zinc-400">{icon}</span>}
                    {selectedOption?.icon && (
                        <span className="shrink-0">{selectedOption.icon}</span>
                    )}
                    <span className="truncate tracking-wide font-bold">
                        {selectedOption ? selectedOption.label : placeholder}
                    </span>
                </div>

                <ChevronDown
                    className={cn(
                        "h-4 w-4 shrink-0 text-zinc-400 transition-transform duration-200 group-hover:text-white",
                        open && "rotate-180 text-white"
                    )}
                />
            </DropdownMenuPrimitive.Trigger>

            <DropdownMenuPrimitive.Portal>
                <DropdownMenuPrimitive.Content
                    sideOffset={6}
                    align="start"
                    className={cn(
                        "z-50 min-w-[180px] sm:min-w-[210px] max-h-[320px] overflow-y-auto rounded-2xl border border-zinc-800 bg-zinc-950/98 p-1.5 shadow-[0_12px_40px_rgba(0,0,0,0.95)] backdrop-blur-2xl outline-none",
                        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 duration-150",
                        menuClassName
                    )}
                >
                    {options.map((option) => {
                        const isSelected = option.value === value;
                        return (
                            <DropdownMenuPrimitive.Item
                                key={String(option.value)}
                                onClick={() => onChange(option.value)}
                                className={cn(
                                    "flex cursor-pointer select-none items-center justify-between gap-3 rounded-xl px-3 sm:px-3.5 py-2.5 text-xs sm:text-sm font-bold tracking-wide outline-none transition-colors min-h-[40px]",
                                    isSelected
                                        ? accents.activeItem
                                        : "text-zinc-300 hover:bg-zinc-800/80 hover:text-white"
                                )}
                            >
                                <div className="flex items-center gap-2.5 min-w-0 truncate">
                                    {option.icon && <span className="shrink-0">{option.icon}</span>}
                                    <span className="truncate">{option.label}</span>
                                </div>

                                {isSelected && (
                                    <Check className={cn("h-4 w-4 shrink-0", accents.activeIndicator)} />
                                )}
                            </DropdownMenuPrimitive.Item>
                        );
                    })}
                </DropdownMenuPrimitive.Content>
            </DropdownMenuPrimitive.Portal>
        </DropdownMenuPrimitive.Root>
    );
}
