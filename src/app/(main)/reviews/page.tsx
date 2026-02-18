import { Rocket } from "lucide-react";

export default function ReviewsPage() {
    return (
        <div className="flex flex-col items-center justify-center p-24 text-center">
            <div className="p-4 bg-primary/10 rounded-full mb-6">
                <Rocket className="h-12 w-12 text-primary" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">Game Reviews</h1>
            <p className="text-muted-foreground text-lg mb-8 max-w-md">
                Our squad is currently exploring new worlds. The review archives will be available soon.
            </p>
        </div>
    );
}
