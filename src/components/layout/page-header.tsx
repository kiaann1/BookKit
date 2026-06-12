type PageHeaderProps = {
  title: string;
  description?: string;
};

export function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <header className="relative border-b border-border/80 pb-3.5 sm:pb-5">
      <div className="absolute -bottom-px left-0 h-0.5 w-10 rounded-full bg-brand-gradient sm:w-14" />
      <h1 className="font-display text-xl font-semibold tracking-tight sm:text-2xl">
        {title}
      </h1>
      {description && (
        <p className="mt-1 max-w-xl text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      )}
    </header>
  );
}
