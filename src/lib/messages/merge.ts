import type { MessageItem } from "@/lib/messages";

export function mergeMessages(
  existing: MessageItem[],
  incoming: MessageItem[],
): MessageItem[] {
  const byId = new Map(existing.map((message) => [message.id, message]));

  for (const message of incoming) {
    byId.set(message.id, message);
  }

  return [...byId.values()].sort((left, right) =>
    left.createdAt.localeCompare(right.createdAt),
  );
}
