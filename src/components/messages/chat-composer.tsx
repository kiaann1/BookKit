"use client";

import { useRef } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ChatComposerProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  sending?: boolean;
  error?: string | null;
};

export function ChatComposer({
  value,
  onChange,
  onSubmit,
  disabled = false,
  sending = false,
  error,
}: ChatComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (value.trim() && !sending) {
        onSubmit();
      }
    }
  }

  return (
    <div className="shrink-0 border-t border-border/60 bg-card/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] backdrop-blur sm:p-4 sm:pb-4">
      {error ? (
        <p className="mb-2 text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      <div className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          maxLength={2000}
          placeholder="Message…"
          disabled={disabled || sending}
          enterKeyHint="send"
          autoComplete="off"
          className={cn(
            "max-h-32 min-h-[2.75rem] flex-1 resize-none rounded-full border border-border/80 bg-muted/40 px-4 py-2.5 text-base leading-normal md:text-sm",
            "placeholder:text-muted-foreground focus:border-primary/40 focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/20",
          )}
        />
        <Button
          type="button"
          size="icon"
          className="h-11 w-11 shrink-0 rounded-full"
          disabled={disabled || sending || !value.trim()}
          onClick={onSubmit}
          aria-label="Send message"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
      <p className="mt-2 hidden text-[11px] text-muted-foreground sm:block">
        Press Enter to send, Shift+Enter for a new line
      </p>
    </div>
  );
}
