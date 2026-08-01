"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { Fragment, useEffect, useState } from "react";
import { resolveBreadcrumbLabel } from "./actions";

// Basic regex to check if a string looks like a UUID
const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

function BreadcrumbLabel({ segment }: { segment: string }) {
    const [label, setLabel] = useState<string>(segment);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (UUID_REGEX.test(segment)) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setIsLoading(true);
            resolveBreadcrumbLabel(segment)
                .then((resolvedLabel) => {
                    setLabel(resolvedLabel);
                    setIsLoading(false);
                })
                .catch(() => {
                    setIsLoading(false);
                });
        }
    }, [segment]);

    if (isLoading) {
        return <span className="animate-pulse">...</span>;
    }

    return <span>{label}</span>;
}

export function Breadcrumbs() {
    const pathname = usePathname();
    const segments = pathname.split("/").filter((segment) => segment !== "");

    return (
        <nav className="text-muted-foreground flex items-center text-sm select-none cursor-default">
            <Link href="/" className="hover:text-primary flex items-center gap-1 transition-colors cursor-pointer">
                <Home className="h-4 w-4" />
                <span className="sr-only">Home</span>
            </Link>
            {segments.length > 0 && <ChevronRight className="mx-2 h-4 w-4" />}
            {segments.map((segment, index) => {
                const path = `/${segments.slice(0, index + 1).join("/")}`;
                const isLast = index === segments.length - 1;

                return (
                    <Fragment key={path}>
                        <Link
                            href={path}
                            className={`hover:text-primary capitalize transition-colors ${isLast ? "text-foreground cursor-default font-medium" : "cursor-pointer"}`}
                        >
                            <BreadcrumbLabel segment={segment} />
                        </Link>
                        {!isLast && <ChevronRight className="mx-2 h-4 w-4" />}
                    </Fragment>
                );
            })}
        </nav>
    );
}
