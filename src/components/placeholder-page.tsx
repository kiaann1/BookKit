import { PageHeader } from "@/components/layout/page-header";
import { FadeIn } from "@/components/motion/fade-in";

type PlaceholderPageProps = {
  title: string;
  description: string;
  phase?: string;
};

export function PlaceholderPage({
  title,
  description,
  phase,
}: PlaceholderPageProps) {
  return (
    <FadeIn className="space-y-8">
      <PageHeader title={title} description={description} />
      <div className="rounded-2xl border border-dashed border-primary/25 bg-primary/5 px-6 py-10 text-center">
        <p className="text-sm text-muted-foreground">
          {phase ? (
            <>
              Coming in{" "}
              <span className="font-medium text-primary">{phase}</span>
            </>
          ) : (
            "This section is on the roadmap."
          )}
        </p>
      </div>
    </FadeIn>
  );
}
