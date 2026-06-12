import Link from "next/link";
import { Compass, Library } from "lucide-react";
import { Button } from "@/components/ui/button";

const cards = [
  {
    icon: Library,
    title: "My shelf",
    description: "Want to read, reading, read, DNF.",
    href: "/shelf",
    cta: "View shelf",
    accent: "from-brand-coral/20 to-brand-coral/5",
  },
  {
    icon: Compass,
    title: "Discover",
    description: "Recommendations picked for you.",
    href: "/recommendations",
    cta: "See picks",
    accent: "from-brand-gold/25 to-brand-gold/5",
  },
];

export function DashboardCards() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {cards.map((card) => (
        <div
          key={card.title}
          className="group relative overflow-hidden rounded-2xl border border-border/70 bg-card/80 p-5 transition hover:border-primary/20"
        >
          <div
            className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${card.accent} opacity-50`}
          />
          <div className="relative">
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-brand-gradient shadow-sm shadow-primary/20">
              <card.icon className="h-4 w-4 text-white" />
            </div>
            <h2 className="font-medium">{card.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {card.description}
            </p>
            <Link href={card.href} className="mt-3 inline-block">
              <Button variant="outline" size="sm">
                {card.cta}
              </Button>
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}
