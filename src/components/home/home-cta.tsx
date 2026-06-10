import Link from "next/link";
import { ArrowRight, BookMarked } from "lucide-react";
import { Button } from "@/components/ui/button";

type HomeCtaProps = {
  isLoggedIn: boolean;
  coverCount: number;
};

export function HomeCta({ isLoggedIn, coverCount }: HomeCtaProps) {
  return (
    <section className="pb-20 pt-4 sm:pb-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-brand-gradient px-6 py-12 text-center text-white shadow-xl shadow-primary/20 sm:px-12 sm:py-16">
          <div
            className="pointer-events-none absolute inset-0 opacity-30"
            aria-hidden
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 20%, white 0%, transparent 45%), radial-gradient(circle at 80% 80%, white 0%, transparent 40%)",
            }}
          />

          <div className="relative">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
              <BookMarked className="h-7 w-7" />
            </div>

            <h2 className="font-display mt-6 text-2xl font-semibold tracking-tight sm:text-4xl">
              {isLoggedIn
                ? "Your next great read is waiting"
                : "Start your reading journey today"}
            </h2>

            <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-white/85 sm:text-base">
              {coverCount > 0
                ? `Explore ${coverCount}+ titles in the library, track your progress, and connect with readers who share your taste.`
                : "Create a free account to build your shelf, read in-browser, and discover books by genre."}
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              {isLoggedIn ? (
                <>
                  <Link href="/catalog">
                    <Button
                      size="lg"
                      variant="secondary"
                      className="gap-2 bg-white text-primary hover:bg-white/90"
                    >
                      Browse catalog
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/dashboard">
                    <Button
                      size="lg"
                      variant="outline"
                      className="border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white"
                    >
                      Go to dashboard
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/register">
                    <Button
                      size="lg"
                      variant="secondary"
                      className="gap-2 bg-white text-primary hover:bg-white/90"
                    >
                      Create free account
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/catalog">
                    <Button
                      size="lg"
                      variant="outline"
                      className="border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white"
                    >
                      Browse catalog
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
