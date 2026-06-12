type TypingIndicatorProps = {
  displayName: string;
};

export function TypingIndicator({ displayName }: TypingIndicatorProps) {
  return (
    <div className="border-b border-border/40 bg-muted/20 px-4 py-2">
      <p className="text-xs text-muted-foreground">
        <span className="font-medium text-foreground/80">{displayName}</span> is
        typing
        <span className="typing-dots ml-0.5 inline-flex" aria-hidden>
          <span>.</span>
          <span>.</span>
          <span>.</span>
        </span>
      </p>
    </div>
  );
}
