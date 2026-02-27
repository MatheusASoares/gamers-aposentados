"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { Fragment } from "react";

export function Breadcrumbs() {
    const pathname = usePathname();
    const segments = pathname.split("/").filter((segment) => segment !== "");

    return (
        <nav className="text-muted-foreground flex items-center text-sm">
            <Link href="/" className="hover:text-primary flex items-center gap-1 transition-colors">
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
                            className={`hover:text-primary capitalize transition-colors ${isLast ? "text-foreground pointer-events-none font-medium" : ""}`}
                        >
                            {segment}
                        </Link>
                        {!isLast && <ChevronRight className="mx-2 h-4 w-4" />}
                    </Fragment>
                );
            })}
        </nav>
    );
}
