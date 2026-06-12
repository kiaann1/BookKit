import { cn } from "@/lib/utils";

type SettingsSectionProps = {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "danger";
};

export function SettingsSection({
  title,
  description,
  children,
  className,
  variant = "default",
}: SettingsSectionProps) {
  return (
    <section
      className={cn(
        "space-y-4 rounded-2xl border bg-card p-5 sm:p-6",
        variant === "danger" ? "border-destructive/30" : "border-border/80",
        className,
      )}
    >
      <div>
        <h2
          className={cn(
            "font-medium",
            variant === "danger" && "text-destructive",
          )}
        >
          {title}
        </h2>
        {description ? (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}
