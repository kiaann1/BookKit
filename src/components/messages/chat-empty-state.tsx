import { MessageCircle } from "lucide-react";

export function ChatEmptyState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
        <MessageCircle className="h-7 w-7" />
      </div>
      <p className="mt-4 font-medium">Your messages</p>
      <p className="mt-2 max-w-xs text-sm text-muted-foreground">
        Pick a conversation from the list, or start one from someone&apos;s
        profile.
      </p>
    </div>
  );
}
