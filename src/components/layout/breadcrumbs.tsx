"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { Fragment } from "react";

export function Breadcrumbs() {
    const pathname = usePathname();
    const segments = pathname.split("/").filter((segment) => segment !== "");

    return (
        <nav className="flex items-center text-sm text-muted-foreground">
            <Link href="/" className="hover:text-primary transition-colors flex items-center gap-1">
                <Home className="h-4 w-4" />
                <span className="sr-only">Home</span>
            </Link>
            {segments.length > 0 && <ChevronRight className="h-4 w-4 mx-2" />}
            {segments.map((segment, index) => {
                const path = `/${segments.slice(0, index + 1).join("/")}`;
                const isLast = index === segments.length - 1;

                return (
                    <Fragment key={path}>
                        <Link
                            href={path}
                            className={`capitalize hover:text-primary transition-colors ${isLast ? "text-foreground font-medium pointer-events-none" : ""}`}
                        >
                            {segment}
                        </Link>
                        {!isLast && <ChevronRight className="h-4 w-4 mx-2" />}
                    </Fragment>
                );
            })}
        </nav>
    );
}
