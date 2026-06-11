import { Badge } from "@/components/ui/badge";
import {
  BOOK_REQUEST_STATUS_LABELS,
  type BookRequestStatus,
} from "@/lib/constants/book-request-status";

function statusVariant(status: BookRequestStatus) {
  switch (status) {
    case "ADDED":
      return "success" as const;
    case "SOURCED":
      return "default" as const;
    case "DECLINED":
      return "muted" as const;
    default:
      return "warning" as const;
  }
}

export function BookRequestStatusBadge({
  status,
}: {
  status: BookRequestStatus;
}) {
  return (
    <Badge variant={statusVariant(status)}>
      {BOOK_REQUEST_STATUS_LABELS[status]}
    </Badge>
  );
}
