type PageHeaderProps = {
  title: string;
  description?: string;
};

export function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <header className="relative border-b border-border pb-4 sm:pb-6">
      <div className="absolute -bottom-px left-0 h-0.5 w-12 rounded-full bg-brand-gradient sm:w-16" />
      <h1 className="font-display text-xl font-semibold tracking-tight sm:text-3xl">
        {title}
      </h1>
      {description && (
        <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-muted-foreground sm:mt-2">
          {description}
        </p>
      )}
    </header>
  );
}
