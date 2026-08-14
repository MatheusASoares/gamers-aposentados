// src/app/(main)/deals/page.tsx

import { Metadata } from "next";
import { DealsContainer } from "@/components/deals/DealsContainer";

export const metadata: Metadata = {
    title: "Deals Tracker | Gamers Aposentados",
    description: "Comparador de preços Steam Family em tempo real entre Estados Unidos e Brasil.",
};

export default function DealsPage() {
    return (
        <main className="w-full">
            <DealsContainer />
        </main>
    );
}
